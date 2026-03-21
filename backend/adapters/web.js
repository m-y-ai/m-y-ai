import http from 'http'
import { randomUUID } from 'crypto'
import BaseAdapter from './base.js'

/**
 * Web adapter — HTTP server with SSE for browser clients
 *
 * Protocol:
 *   GET  /connect           → SSE stream; server emits { type, ... } events
 *                             Response header X-Chat-Id carries the assigned chatId
 *   POST /message           → { chatId, text, image? } → 202 Accepted
 *
 * Config options:
 *   port           {number}   HTTP listen port (default: 2701)
 *   allowedOrigins {string[]} CORS origins ('*' for all, default)
 *   apiKey         {string}   Optional shared secret; clients send as X-Api-Key header
 *   allowedDMs     {string[]} Allowed chatIds, or ['*'] for all
 *   allowedGroups  {string[]} Web clients are always DMs, so this can be empty
 */
export default class WebAdapter extends BaseAdapter {
  constructor(config) {
    super(config)
    this.server = null
    this.sseClients = new Map() // chatId -> ServerResponse
  }

  async start() {
    const port = this.config.port || 2701

    this.server = http.createServer((req, res) => {
      this._addCors(req, res)

      if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
      }

      const pathname = new URL(req.url, 'http://localhost').pathname

      if (req.method === 'GET' && pathname === '/connect') {
        this._handleConnect(req, res)
        return
      }

      if (req.method === 'POST' && pathname === '/message') {
        this._handleMessage(req, res)
        return
      }

      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
    })

    await new Promise((resolve) => this.server.listen(port, resolve))
    console.log(`[Web] Adapter started on port ${port}`)
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
    console.log('[Web] Adapter stopped')
  }

  async sendMessage(chatId, text) {
    const res = this.sseClients.get(chatId)
    if (!res) {
      throw new Error(`[Web] No connected client for chatId: ${chatId}`)
    }
    this._sseWrite(res, { type: 'message', text })
  }

  async sendTyping(chatId) {
    const res = this.sseClients.get(chatId)
    if (!res) return
    try {
      this._sseWrite(res, { type: 'typing' })
    } catch (_) {}
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  _addCors(req, res) {
    const origins = this.config.allowedOrigins || ['*']
    const origin = req.headers['origin'] || ''
    const allow = origins.includes('*') || origins.includes(origin) ? (origin || '*') : ''
    if (allow) res.setHeader('Access-Control-Allow-Origin', allow)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key')
    res.setHeader('Access-Control-Expose-Headers', 'X-Chat-Id')
  }

  _authOk(req) {
    if (!this.config.apiKey) return true
    return req.headers['x-api-key'] === this.config.apiKey
  }

  _sseWrite(res, data) {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  _handleConnect(req, res) {
    if (!this._authOk(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Unauthorized' }))
      return
    }

    const chatId = randomUUID()

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Chat-Id': chatId
    })

    // Identify the client
    this._sseWrite(res, { type: 'connected', chatId })
    this.sseClients.set(chatId, res)
    console.log(`[Web] Client connected: ${chatId} (${this.sseClients.size} total)`)

    // Keep-alive heartbeat every 25 s
    const heartbeat = setInterval(() => {
      try { res.write(': heartbeat\n\n') } catch (_) { clearInterval(heartbeat) }
    }, 25000)

    req.on('close', () => {
      clearInterval(heartbeat)
      this.sseClients.delete(chatId)
      console.log(`[Web] Client disconnected: ${chatId}`)
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

        if (!msg.chatId) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'chatId is required' }))
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
          chatId: msg.chatId,
          text,
          isGroup: false,
          sender: msg.chatId,
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
        console.error('[Web] Error parsing message:', err.message)
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid JSON' }))
      }
    })
  }
}
