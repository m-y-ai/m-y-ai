import { EventEmitter } from 'events'
import ClaudeAgent from './claude-agent.js'

/**
 * AgentRunner — FIFO queue per session, multi-agent support.
 *
 * Manages:
 * - One ClaudeAgent per agentId (created lazily, shared across threads)
 * - Per-session FIFO queues (sessions can run in parallel, messages within a session are sequential)
 * - Thread-based runs via enqueueThreadRun() with SSE callbacks
 * - Messaging-platform runs via enqueueRun() (existing behavior, unchanged)
 */
export default class AgentRunner extends EventEmitter {
  constructor(sessionManager, config = {}) {
    super()
    this.sessionManager = sessionManager
    this.config = config  // stored for creating additional agent instances

    // Default agent (for messaging platforms / backwards compat)
    const defaultAgent = new ClaudeAgent(config)
    this.agent = defaultAgent  // backwards-compat reference used by gateway
    this.agents = new Map([['Default', defaultAgent]])

    this.queues = new Map()  // sessionKey → { items: [], processing: boolean }
    this.mcpServers = {}
    this.gateway = null

    this.globalStats = {
      totalQueued: 0,
      totalProcessed: 0,
      totalFailed: 0
    }

    this._forwardAgentEvents(defaultAgent)
  }

  /**
   * Forward events from an agent instance to this runner's emitter
   */
  _forwardAgentEvents(agent) {
    agent.on('run:start', (data) => this.emit('agent:start', data))
    agent.on('run:text', (data) => this.emit('agent:text', data))
    agent.on('run:tool', (data) => this.emit('agent:tool', data))
    agent.on('run:complete', (data) => this.emit('agent:complete', data))
    agent.on('run:error', (data) => this.emit('agent:error', data))
  }

  /**
   * Set the gateway reference on all current and future agents
   */
  setGateway(gateway) {
    this.gateway = gateway
    for (const agent of this.agents.values()) {
      agent.gateway = gateway
    }
  }

  /**
   * Get or create a ClaudeAgent for the given agentId + config.
   * Each agentId has one shared instance (thread isolation is via session key).
   */
  getOrCreateAgent(agentId, agentConfig = null) {
    if (!this.agents.has(agentId)) {
      const agent = new ClaudeAgent({ ...this.config, agentConfig })
      agent.gateway = this.gateway
      this._forwardAgentEvents(agent)
      this.agents.set(agentId, agent)
      console.log(`[Runner] Created agent instance for: ${agentId}`)
    }
    return this.agents.get(agentId)
  }

  /**
   * Set MCP servers (called from gateway after Composio init)
   */
  setMcpServers(mcpServers) {
    this.mcpServers = mcpServers
  }

  // ─── Queue mechanics ────────────────────────────────────────────────────────

  getQueueStatus(sessionKey) {
    const queue = this.queues.get(sessionKey)
    if (!queue) return { pending: 0, processing: false }
    return { pending: queue.items.length, processing: queue.processing }
  }

  getGlobalStats() {
    let totalPending = 0
    let activeSessions = 0
    for (const queue of this.queues.values()) {
      totalPending += queue.items.length
      if (queue.processing) activeSessions++
    }
    return { ...this.globalStats, totalPending, activeSessions, totalSessions: this.queues.size }
  }

  _getOrCreateQueue(sessionKey) {
    if (!this.queues.has(sessionKey)) {
      this.queues.set(sessionKey, { items: [], processing: false })
    }
    return this.queues.get(sessionKey)
  }

  async processQueue(sessionKey) {
    const queue = this.queues.get(sessionKey)
    if (!queue || queue.processing || queue.items.length === 0) return

    queue.processing = true

    while (queue.items.length > 0) {
      const run = queue.items.shift()
      const waitTime = Date.now() - run.queuedAt

      this.emit('processing', {
        runId: run.id,
        sessionKey,
        waitTimeMs: waitTime,
        remainingInQueue: queue.items.length
      })

      if (waitTime > 1000) {
        console.log(`[Queue] Processing after ${Math.round(waitTime / 1000)}s wait`)
      }

      try {
        const response = await this.executeRun(run)
        this.globalStats.totalProcessed++
        this.emit('completed', { runId: run.id, sessionKey, processingTimeMs: Date.now() - run.queuedAt })
        run.resolve(response)
      } catch (error) {
        this.globalStats.totalFailed++
        this.emit('failed', { runId: run.id, sessionKey, error: error.message })
        run.reject(error)
      }
    }

    queue.processing = false

    // Clean up empty queues after a delay
    setTimeout(() => {
      const q = this.queues.get(sessionKey)
      if (q && q.items.length === 0 && !q.processing) {
        this.queues.delete(sessionKey)
      }
    }, 60000)
  }

  // ─── Messaging platform runs (existing behavior) ─────────────────────────────

  extractPlatform(sessionKey) {
    const parts = sessionKey.split(':')
    return parts[2] || 'unknown'
  }

  /**
   * Enqueue a run for a messaging platform session (WhatsApp, Telegram, etc.)
   */
  async enqueueRun(sessionKey, message, adapter, chatId, image = null) {
    const queue = this._getOrCreateQueue(sessionKey)
    const position = queue.items.length + (queue.processing ? 1 : 0)

    return new Promise((resolve, reject) => {
      const run = {
        id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        sessionKey,
        message,
        adapter,
        chatId,
        image,
        mcpServers: this.mcpServers,
        resolve,
        reject,
        queuedAt: Date.now(),
        isThreadRun: false
      }

      queue.items.push(run)
      this.globalStats.totalQueued++

      this.emit('queued', {
        runId: run.id,
        sessionKey,
        position,
        queueLength: queue.items.length
      })

      if (position > 0) {
        console.log(`[Queue] Message queued at position ${position} for ${sessionKey}`)
      }

      this.processQueue(sessionKey)
    })
  }

  // ─── Thread-based runs (web UI / API) ─────────────────────────────────────

  /**
   * Enqueue a run for a thread from the web UI.
   * Uses SSE callbacks (onChunk, onDone, onError) instead of an adapter.
   */
  async enqueueThreadRun(threadId, agentId, agentConfig, message, workspacePath, callbacks) {
    const sessionKey = `thread:${threadId}`
    const queue = this._getOrCreateQueue(sessionKey)

    return new Promise((resolve, reject) => {
      const run = {
        id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        sessionKey,
        threadId,
        agentId,
        agentConfig,
        message,
        workspacePath,
        ...callbacks,
        resolve,
        reject,
        queuedAt: Date.now(),
        isThreadRun: true
      }

      queue.items.push(run)
      this.globalStats.totalQueued++

      this.processQueue(sessionKey)
    })
  }

  // ─── Execution ─────────────────────────────────────────────────────────────

  async executeRun(run) {
    return run.isThreadRun
      ? this.executeThreadRun(run)
      : this.executeMessagingRun(run)
  }

  /**
   * Execute a messaging platform run (sends response via adapter)
   */
  async executeMessagingRun(run) {
    const { sessionKey, message, adapter, chatId, image, mcpServers } = run
    const platform = this.extractPlatform(sessionKey)

    this.sessionManager.appendTranscript(sessionKey, {
      role: 'user',
      content: message,
      hasImage: !!image
    })

    const canUseTool = this.createMessagingCanUseTool(adapter, chatId)

    try {
      let currentText = ''
      let fullText = ''

      for await (const chunk of this.agent.run({
        message,
        sessionKey,
        platform,
        chatId,
        image,
        mcpServers,
        canUseTool
      })) {
        if (chunk.type === 'text') {
          currentText += chunk.content
          fullText += chunk.content
        }
        if (chunk.type === 'tool_use' && currentText.trim()) {
          await adapter.sendMessage(chatId, currentText.trim())
          currentText = ''
        }
        if (chunk.type === 'done' && currentText.trim()) {
          await adapter.sendMessage(chatId, currentText.trim())
        }
      }

      this.sessionManager.appendTranscript(sessionKey, { role: 'assistant', content: fullText })
      return fullText
    } catch (error) {
      console.error(`[Runner] Messaging run failed for ${sessionKey}:`, error)
      throw error
    }
  }

  /**
   * Execute a thread run — streams chunks via callbacks for SSE
   */
  async executeThreadRun(run) {
    const { sessionKey, threadId, agentId, agentConfig, message, workspacePath, onChunk, onDone, onError } = run

    this.sessionManager.appendTranscript(sessionKey, { role: 'user', content: message })

    const agent = this.getOrCreateAgent(agentId, agentConfig)

    try {
      let fullText = ''

      for await (const chunk of agent.run({
        message,
        sessionKey,
        platform: 'web',
        chatId: threadId,
        mcpServers: this.mcpServers,
        agentId,
        threadId,
        workspacePath
      })) {
        if (chunk.type === 'text') {
          fullText += chunk.content
          onChunk?.({ type: 'chunk', content: chunk.content })
        }
        if (chunk.type === 'tool_use') {
          onChunk?.({ type: 'tool', name: chunk.name })
        }
        if (chunk.type === 'done') break
        if (chunk.type === 'aborted') break
        if (chunk.type === 'error') {
          onError?.(chunk.error)
          throw new Error(chunk.error)
        }
      }

      this.sessionManager.appendTranscript(sessionKey, { role: 'assistant', content: fullText })
      onDone?.({ type: 'done', fullText })
      return fullText

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(`[Runner] Thread run failed for ${sessionKey}:`, error)
        onError?.(error.message)
      }
      throw error
    }
  }

  // ─── Tool approval (messaging platforms) ──────────────────────────────────

  createMessagingCanUseTool(adapter, chatId) {
    const gateway = this.gateway
    if (!gateway) return undefined

    return async (toolName, input, options) => {
      if (toolName === 'AskUserQuestion') {
        const questions = input.questions || []
        let prompt = ''
        for (const q of questions) {
          prompt += `${q.question}\n\n`
          if (q.options) {
            q.options.forEach((opt, i) => {
              prompt += `${i + 1}) ${opt.label}`
              if (opt.description) prompt += ` — ${opt.description}`
              prompt += '\n'
            })
          }
          prompt += '\nReply with a number or type your answer.'
        }

        const reply = await gateway.waitForApproval(chatId, adapter, prompt.trim())
        if (!reply) return { behavior: 'deny', message: 'No response received (timed out).' }

        const num = parseInt(reply.trim())
        const firstQuestion = questions[0]
        if (firstQuestion?.options && num >= 1 && num <= firstQuestion.options.length) {
          const selected = firstQuestion.options[num - 1]
          return {
            behavior: 'allow',
            updatedInput: { ...input, questions: [{ ...firstQuestion, answer: selected.label }] }
          }
        }

        return {
          behavior: 'allow',
          updatedInput: { ...input, questions: [{ ...firstQuestion, answer: reply.trim() }] }
        }
      }

      const reason = options.decisionReason || ''
      let prompt = `Claude wants to use: ${toolName}`
      if (reason) prompt += `\n${reason}`

      const inputStr = JSON.stringify(input, null, 2)
      if (inputStr.length < 500) prompt += `\n\n${inputStr}`
      prompt += '\n\nReply Y to allow, N to deny.'

      const reply = await gateway.waitForApproval(chatId, adapter, prompt)
      if (!reply) return { behavior: 'deny', message: 'No response received (timed out).', interrupt: true }

      const answer = reply.trim().toLowerCase()
      if (answer === 'y' || answer === 'yes') return { behavior: 'allow', updatedInput: input }
      return { behavior: 'deny', message: reply.trim() || 'User denied the action.' }
    }
  }

  /**
   * Abort a running query
   */
  abort(sessionKey) {
    return this.agent.abort(sessionKey)
  }
}
