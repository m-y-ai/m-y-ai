import http from 'http'
import { randomUUID } from 'crypto'
import BaseAdapter from './base.js'

/**
 * Mobile app adapter — HTTP server with SSE for React Native / native mobile clients
 *
 * Protocol:
 *   GET  /connect?deviceId=<id>    → SSE stream; emits { type, ... } events
 *                                    deviceId must be pre-registered or '*' allowed
 *                                    Requires X-Api-Key header (if apiKey set in config)
 *   POST /message                  → { deviceId, text, image? } → 202 Accepted
 *                                    Requires X-Api-Key header (if apiKey set in config)
 *
 * Config options:
 *   port           {number}   HTTP listen port (default: 2702)
 *   apiKey         {string}   Shared secret all mobile clients must send as X-Api-Key
 *   allowedDMs     {string[]} Allowed deviceIds, or ['*'] for any authenticated device
 *   allowedGroups  {string[]} Mobile clients are always DMs, so this can be empty
 *   heartbeatMs    {number}   SSE heartbeat interval in ms (default: 20000)
 */
export default class MobileAppAdapter extends BaseAdapter {
  constructor(config) {
    super(config)
    this.server = null
    this.sseClients = new Map() // deviceId -> ServerResponse
  }

  async start() {
    const port = this.config.port || 2702

    this.server = http.createServer((req, res) => {
      this._addCors(res)

      if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
      }

      const url = new URL(req.url, 'http://localhost')

      if (req.method === 'GET' && url.pathname === '/connect') {
        this._handleConnect(req, res, url)
        return
      }

      if (req.method === 'POST' && url.pathname === '/message') {
        this._handleMessage(req, res)
        return
      }

      // Health check
      if (req.method === 'GET' && url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'ok', clients: this.sseClients.size }))
        return
      }

      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
    })

    await new Promise((resolve) => this.server.listen(port, resolve))
    console.log(`[MobileApp] Adapter started on port ${port}`)
  }

  async stop() {
    for (const res of this.sseClients.values()) {
      try { res.end() } catch (_) {}
    }
    this.sseClients.clear()

    if (this.server) {
      await new Promise((resolve) => this.server.close(resolve))
      this.server = null
    }
    console.log('[MobileApp] Adapter stopped')
  }

  async sendMessage(deviceId, text) {
    const res = this.sseClients.get(deviceId)
    if (!res) {
      throw new Error(`[MobileApp] No connected client for deviceId: ${deviceId}`)
    }
    this._sseWrite(res, { type: 'message', text })
  }

  async sendTyping(deviceId) {
    const res = this.sseClients.get(deviceId)
    if (!res) return
    try {
      this._sseWrite(res, { type: 'typing' })
    } catch (_) {}
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  _addCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key')
  }

  _authOk(req) {
    if (!this.config.apiKey) return true
    return req.headers['x-api-key'] === this.config.apiKey
  }

  _sseWrite(res, data) {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  _handleConnect(req, res, url) {
    if (!this._authOk(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Unauthorized' }))
      return
    }

    // deviceId identifies the device across reconnects (stable per-install UUID)
    const deviceId = url.searchParams.get('deviceId') || randomUUID()

    // Close any previous SSE connection for the same device (reconnect)
    const existing = this.sseClients.get(deviceId)
    if (existing) {
      try { this._sseWrite(existing, { type: 'replaced' }); existing.end() } catch (_) {}
      this.sseClients.delete(deviceId)
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    })

    this._sseWrite(res, { type: 'connected', deviceId })
    this.sseClients.set(deviceId, res)
    console.log(`[MobileApp] Device connected: ${deviceId} (${this.sseClients.size} total)`)

    const heartbeatMs = this.config.heartbeatMs || 20000
    const heartbeat = setInterval(() => {
      try { res.write(': heartbeat\n\n') } catch (_) { clearInterval(heartbeat) }
    }, heartbeatMs)

    req.on('close', () => {
      clearInterval(heartbeat)
      this.sseClients.delete(deviceId)
      console.log(`[MobileApp] Device disconnected: ${deviceId}`)
    })
  }

  _handleMessage(req, res) {
    if (!this._authOk(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Unauthorized' }))
      return
    }

    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        const msg = JSON.parse(body)

        if (!msg.deviceId) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'deviceId is required' }))
          return
        }

        let image = null
        if (msg.image?.data) {
          image = {
            data: msg.image.data,
            mediaType: msg.image.mediaType || 'image/jpeg'
          }
        }

        const text = msg.text || (image ? '[Image]' : '')
        if (!text && !image) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'text or image is required' }))
          return
        }

        const message = {
          chatId: msg.deviceId,
          text,
          isGroup: false,
          sender: msg.deviceId,
          mentions: [],
          image,
          raw: msg
        }

        if (!this.shouldRespond(message, this.config)) {
          res.writeHead(403, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Not authorized' }))
          return
        }

        res.writeHead(202, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))

        this.emitMessage(message)
      } catch (err) {
        console.error('[MobileApp] Error parsing message:', err.message)
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid JSON' }))
      }
    })
  }
}
