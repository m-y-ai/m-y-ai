import { listAgents, loadAgentConfig } from '../agent/registry.js'

/**
 * Parse JSON request body
 */
function parseBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')) }
      catch { resolve({}) }
    })
    req.on('error', () => resolve({}))
  })
}

/**
 * Send JSON response with CORS headers
 */
function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  })
  res.end(JSON.stringify(data))
}

/**
 * Add CORS headers to any response
 */
function addCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

/**
 * Create the API router function.
 * Returns a handler that processes /api/* requests.
 * Returns false if the request was not an API route.
 */
export function createApiRouter(gateway) {
  return async function handleApiRequest(req, res) {
    const url = new URL(req.url, 'http://localhost')
    const pathname = url.pathname

    if (!pathname.startsWith('/api/')) return false

    addCors(res)

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return true
    }

    // ─── GET /api/agents ─────────────────────────────────────────────────────
    if (req.method === 'GET' && pathname === '/api/agents') {
      const agents = listAgents()
      sendJSON(res, 200, agents.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description
      })))
      return true
    }

    // ─── GET /api/agents/:id ──────────────────────────────────────────────────
    const agentMatch = pathname.match(/^\/api\/agents\/([^/]+)$/)
    if (req.method === 'GET' && agentMatch) {
      const agentId = agentMatch[1]
      const config = loadAgentConfig(agentId)
      if (!config) {
        sendJSON(res, 404, { error: 'Agent not found' })
        return true
      }
      sendJSON(res, 200, { id: config.id, name: config.name, description: config.description })
      return true
    }

    // ─── GET /api/threads ─────────────────────────────────────────────────────
    if (req.method === 'GET' && pathname === '/api/threads') {
      const agentId = url.searchParams.get('agentId') || null
      const threads = gateway.threadManager.listThreads(agentId)
      sendJSON(res, 200, threads)
      return true
    }

    // ─── POST /api/threads ────────────────────────────────────────────────────
    if (req.method === 'POST' && pathname === '/api/threads') {
      const body = await parseBody(req)
      const { agentId, title } = body
      if (!agentId) {
        sendJSON(res, 400, { error: 'agentId is required' })
        return true
      }
      if (!loadAgentConfig(agentId)) {
        sendJSON(res, 404, { error: `Agent "${agentId}" not found` })
        return true
      }
      const thread = gateway.threadManager.createThread(agentId, title)
      sendJSON(res, 201, thread)
      return true
    }

    // ─── Thread-specific routes ───────────────────────────────────────────────
    const threadMatch = pathname.match(/^\/api\/threads\/([^/]+)$/)
    if (threadMatch) {
      const threadId = decodeURIComponent(threadMatch[1])

      // GET /api/threads/:id
      if (req.method === 'GET') {
        const thread = gateway.threadManager.getThread(threadId)
        if (!thread) { sendJSON(res, 404, { error: 'Thread not found' }); return true }
        sendJSON(res, 200, thread)
        return true
      }

      // PATCH /api/threads/:id
      if (req.method === 'PATCH') {
        const thread = gateway.threadManager.getThread(threadId)
        if (!thread) { sendJSON(res, 404, { error: 'Thread not found' }); return true }
        const body = await parseBody(req)
        const updated = gateway.threadManager.updateThread(threadId, { title: body.title })
        sendJSON(res, 200, updated)
        return true
      }

      // DELETE /api/threads/:id
      if (req.method === 'DELETE') {
        const deleted = gateway.threadManager.deleteThread(threadId)
        sendJSON(res, deleted ? 200 : 404, { ok: deleted })
        return true
      }
    }

    // ─── Messages routes ──────────────────────────────────────────────────────
    const messagesMatch = pathname.match(/^\/api\/threads\/([^/]+)\/messages$/)
    if (messagesMatch) {
      const threadId = decodeURIComponent(messagesMatch[1])

      // GET /api/threads/:id/messages
      if (req.method === 'GET') {
        const thread = gateway.threadManager.getThread(threadId)
        if (!thread) { sendJSON(res, 404, { error: 'Thread not found' }); return true }
        const sessionKey = gateway.threadManager.getSessionKey(threadId)
        const transcript = gateway.sessionManager.getTranscript(sessionKey)
        sendJSON(res, 200, transcript)
        return true
      }

      // POST /api/threads/:id/messages — SSE streaming response
      if (req.method === 'POST') {
        const thread = gateway.threadManager.getThread(threadId)
        if (!thread) { sendJSON(res, 404, { error: 'Thread not found' }); return true }

        const body = await parseBody(req)
        const text = body.text?.trim()
        if (!text) { sendJSON(res, 400, { error: 'text is required' }); return true }

        const agentConfig = loadAgentConfig(thread.agentId)

        // SSE headers
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'X-Accel-Buffering': 'no'
        })

        const writeSSE = (data) => {
          try { res.write(`data: ${JSON.stringify(data)}\n\n`) } catch { /* client gone */ }
        }

        // Heartbeat to keep connection alive
        const heartbeat = setInterval(() => {
          try { res.write(': heartbeat\n\n') } catch { clearInterval(heartbeat) }
        }, 20000)

        req.on('close', () => clearInterval(heartbeat))

        try {
          const workspacePath = gateway.threadManager.getWorkspaceDisplayPath(thread.agentId, threadId)

          await gateway.agentRunner.enqueueThreadRun(
            threadId,
            thread.agentId,
            agentConfig,
            text,
            workspacePath,
            {
              onChunk: writeSSE,
              onDone: (data) => {
                clearInterval(heartbeat)
                writeSSE(data)
                gateway.threadManager.incrementMessageCount(threadId)
                try { res.end() } catch { /* already closed */ }
              },
              onError: (error) => {
                clearInterval(heartbeat)
                writeSSE({ type: 'error', error: String(error) })
                try { res.end() } catch { /* already closed */ }
              }
            }
          )
        } catch (error) {
          clearInterval(heartbeat)
          writeSSE({ type: 'error', error: error.message })
          try { res.end() } catch { /* already closed */ }
        }
        return true
      }
    }

    // Not handled by API router
    return false
  }
}
