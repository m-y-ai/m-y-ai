import { EventEmitter } from 'events'
import MemoryManager from '../memory/manager.js'
import { createCronMcpServer, setContext as setCronContext, getScheduler } from '../tools/cron.js'
import { createGatewayMcpServer, setGatewayContext } from '../tools/gateway.js'
import { getProvider } from '../providers/index.js'

/**
 * Build the system prompt, incorporating agent config loaded from storage/Agents/{id}/
 */
function buildSystemPrompt(memoryContext, sessionInfo, cronInfo, providerName = 'claude', agentConfig = null) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const timeStr = now.toLocaleTimeString('en-US', { hour12: true })

  // Use agent IDENTITY.md as the persona, or fall back to default
  const persona = agentConfig?.identity?.trim()
    || `You are M-Y AI, a personal AI assistant communicating via the M-Y AI platform (web & mobile).`

  // Agent SOUL.md adds values and behavioral guidelines
  const soulSection = agentConfig?.soul?.trim()
    ? `\n\n${agentConfig.soul.trim()}`
    : ''

  // Agent TOOLS.md describes custom tools or integrations specific to this agent
  const toolsSection = agentConfig?.tools?.trim()
    ? `\n\n## Agent-Specific Tools & Capabilities\n${agentConfig.tools.trim()}`
    : ''

  // Thread-specific workspace path for isolation
  const workspacePath = sessionInfo.workspacePath || '~/m-y-ai/'

  // Platform-specific formatting guidance
  const isWebPlatform = sessionInfo.platform === 'web'
  const formattingGuidance = isWebPlatform
    ? `- You may use markdown formatting — the web UI renders it correctly
- Use headers, bold, code blocks, and lists where they improve clarity`
    : `- DO NOT use markdown formatting (no **, \`, #, -, etc.) — messaging platforms don't render it
- Use plain text only — write naturally without formatting syntax`

  return `${persona}${soulSection}

## Current Context
- Date: ${dateStr}
- Time: ${timeStr}
- Session: ${sessionInfo.sessionKey}
- Platform: ${sessionInfo.platform}
${sessionInfo.agentId ? `- Agent: ${sessionInfo.agentId}` : ''}
${sessionInfo.threadId ? `- Thread: ${sessionInfo.threadId}` : ''}

## Memory System

You have access to a persistent memory system. Use it to remember important information across conversations.

### Memory Structure
- **MEMORY.md**: Curated long-term memory for important facts, preferences, and decisions
- **memory/YYYY-MM-DD.md**: Daily notes (append-only log for each day)

### When to Write Memory
- **Only when the user asks** — e.g. "remember this", "save this", "don't forget"
- **Write to MEMORY.md** for: preferences, important decisions, recurring information, relationships, key facts
- **Write to daily log** for: tasks completed, temporary notes, conversation context, things that happened today

### Memory Tools
- Use \`Read\` tool to read memory files
- Use \`Write\` or \`Edit\` tools to update memory files
- Workspace path: ${workspacePath}
- All memory files should be .md (markdown)

### Memory Writing Guidelines
1. Be concise but include enough context to be useful later
2. Use markdown headers to organize information
3. Include dates when relevant
4. For MEMORY.md, organize by topic/category
5. For daily logs, use timestamps
6. Do NOT proactively use memory unless the user asks you to remember or recall something

## Current Memory Context
${memoryContext || 'No memory files found yet. Start building your memory!'}

## Scheduling / Reminders

You have cron tools to schedule messages:
- \`mcp__cron__schedule_delayed\`: One-time reminder after delay (seconds)
- \`mcp__cron__schedule_recurring\`: Repeat at interval (seconds)
- \`mcp__cron__schedule_cron\`: Cron expression (minute hour day month weekday)
- \`mcp__cron__list_scheduled\`: List all scheduled jobs
- \`mcp__cron__cancel_scheduled\`: Cancel a job by ID

When user says "remind me in X minutes/hours", use schedule_delayed.
When user says "every day at 9am", use schedule_cron with "0 9 * * *".

### Current Scheduled Jobs
${cronInfo || 'No jobs scheduled'}

## Image Handling

When the user sends an image, you will receive it in your context. You can:
- Describe what you see in the image
- Answer questions about the image
- Extract text from images (OCR)
- Analyze charts, diagrams, screenshots

## Communication Style
- Be helpful and conversational
- Keep responses concise and focused
${formattingGuidance}
- Use emoji sparingly and appropriately
- Remember context from the conversation
- Proactively use tools when needed
- DO NOT mention details about connected accounts (emails, usernames, account IDs) unless explicitly asked — just perform the action silently

## Available Tools
Built-in: Read, Write, Edit, Bash, Glob, Grep, TodoWrite, Skill
Scheduling: mcp__cron__schedule_delayed, mcp__cron__schedule_recurring, mcp__cron__schedule_cron, mcp__cron__list_scheduled, mcp__cron__cancel_scheduled
Gateway: mcp__gateway__send_message, mcp__gateway__list_platforms, mcp__gateway__get_queue_status, mcp__gateway__get_current_context, mcp__gateway__list_sessions, mcp__gateway__broadcast_message
Composio: Access to 500+ app integrations (Gmail, Slack, GitHub, Google Sheets, etc.) and browser automation via Composio MCP tools
${toolsSection}

## Gateway Tools
- \`mcp__gateway__send_message\`: Send a message to any chat on any platform
- \`mcp__gateway__list_platforms\`: List connected platforms
- \`mcp__gateway__get_queue_status\`: Check message queue status
- \`mcp__gateway__get_current_context\`: Get current platform/chat/session info
- \`mcp__gateway__list_sessions\`: List all active sessions
- \`mcp__gateway__broadcast_message\`: Send to multiple chats (use carefully)

## Tool Selection — IMPORTANT

**Use Composio tools for app integrations AND browser tasks.**
For tasks involving Gmail, Slack, GitHub, Google Sheets, Calendar, Notion, Trello, Jira, and other apps, ALWAYS use Composio MCP tools. These are faster, more reliable, and work via API.

For browser/web tasks, use Composio's browser tool which provides a live browser session.

## Important
- The workspace at ${workspacePath} is your working directory — use it to store files and memory
- Always check memory before asking the user for information they may have already told you
- Update memory when you learn new persistent information about the user
- When user asks to be reminded, use the cron scheduling tools
${providerName === 'opencode' ? `
## Composio Integrations — IMPORTANT

You have access to 500+ app integrations via Composio MCP tools.

### Common Integrations
- **Email**: Gmail — send, read, search emails, manage labels
- **Messaging**: Slack — send messages, read channels, manage threads
- **Code**: GitHub — repos, issues, PRs, commits, actions
- **Docs**: Google Docs, Notion — create, read, edit documents
- **Sheets**: Google Sheets — read, write, update spreadsheets
- **Calendar**: Google Calendar — create, list, update events
- **Tasks**: Trello, Jira, Linear — manage boards, tickets, projects
- **Storage**: Google Drive, Dropbox — upload, download, manage files

When a user asks you to do something, first check if a Composio tool exists for the task.
` : ''}`
}

/**
 * Claude Agent using the Claude Agent SDK
 * Supports per-agent configuration loaded from storage/Agents/{id}/
 */
export default class ClaudeAgent extends EventEmitter {
  constructor(config = {}) {
    super()
    this.memoryManager = new MemoryManager()
    this.cronMcpServer = createCronMcpServer()
    this.cronScheduler = getScheduler()
    this.gatewayMcpServer = createGatewayMcpServer()
    this.gateway = null // Set via setGateway() after construction
    this.sessions = new Map()
    this.abortControllers = new Map()

    // Agent-specific configuration (identity, soul, tools) from storage/Agents/
    this.agentConfig = config.agentConfig || null

    // Provider setup
    this.providerName = config.provider || 'claude'
    const providerConfig = {
      allowedTools: config.allowedTools,
      maxTurns: config.maxTurns,
      permissionMode: config.permissionMode,
    }
    if (this.providerName === 'opencode') {
      Object.assign(providerConfig, config.opencode || {})
    }
    this.provider = getProvider(this.providerName, providerConfig)

    this.allowedTools = config.allowedTools || [
      'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep',
      'TodoWrite', 'Skill', 'AskUserQuestion'
    ]

    this.cronTools = [
      'mcp__cron__schedule_delayed',
      'mcp__cron__schedule_recurring',
      'mcp__cron__schedule_cron',
      'mcp__cron__list_scheduled',
      'mcp__cron__cancel_scheduled'
    ]

    this.gatewayTools = [
      'mcp__gateway__send_message',
      'mcp__gateway__list_platforms',
      'mcp__gateway__get_queue_status',
      'mcp__gateway__get_current_context',
      'mcp__gateway__list_sessions',
      'mcp__gateway__broadcast_message'
    ]

    this.maxTurns = config.maxTurns || 50
    this.permissionMode = config.permissionMode || 'default'

    // Forward cron events
    this.cronScheduler.on('execute', (data) => this.emit('cron:execute', data))
  }

  getSession(sessionKey) {
    if (!this.sessions.has(sessionKey)) {
      this.sessions.set(sessionKey, {
        sdkSessionId: null,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        messageCount: 0
      })
    }
    return this.sessions.get(sessionKey)
  }

  abort(sessionKey) {
    return this.provider.abort(sessionKey)
  }

  getCronSummary() {
    const jobs = this.cronScheduler.list()
    if (jobs.length === 0) return null
    return jobs.map(j => `- ${j.id}: ${j.description} (${j.type})`).join('\n')
  }

  /**
   * Build prompt — supports images for vision
   */
  buildPrompt(message, image) {
    if (!image) return message

    return [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: image.mediaType,
          data: image.data
        }
      },
      {
        type: 'text',
        text: message
      }
    ]
  }

  /**
   * Generate streaming messages for the SDK
   */
  async *generateMessages(message, image) {
    yield {
      type: 'user',
      message: {
        role: 'user',
        content: this.buildPrompt(message, image)
      }
    }
  }

  /**
   * Run the agent for a message
   * @param {Object} params
   * @param {string} params.message
   * @param {string} params.sessionKey
   * @param {string} [params.platform]
   * @param {string} [params.chatId]
   * @param {Object} [params.image]
   * @param {Object} [params.mcpServers]
   * @param {Function} [params.canUseTool]
   * @param {string} [params.agentId]
   * @param {string} [params.threadId]
   * @param {string} [params.workspacePath]
   */
  async *run(params) {
    const {
      message,
      sessionKey,
      platform = 'unknown',
      chatId = null,
      image = null,
      mcpServers = {},
      canUseTool,
      agentId = null,
      threadId = null,
      workspacePath = null
    } = params

    const session = this.getSession(sessionKey)
    session.lastActivity = Date.now()
    session.messageCount++

    setCronContext({ platform, chatId, sessionKey })
    setGatewayContext({
      gateway: this.gateway,
      currentPlatform: platform,
      currentChatId: chatId,
      currentSessionKey: sessionKey
    })

    const memoryContext = this.memoryManager.getMemoryContext()
    const cronInfo = this.getCronSummary()
    const systemPrompt = buildSystemPrompt(
      memoryContext,
      { sessionKey, platform, agentId, threadId, workspacePath },
      cronInfo,
      this.providerName,
      this.agentConfig
    )

    const allAllowedTools = [...this.allowedTools, ...this.cronTools, ...this.gatewayTools]

    const allMcpServers = {
      cron: this.cronMcpServer,
      gateway: this.gatewayMcpServer,
      ...mcpServers
    }

    if (image) console.log('[Agent] With image attachment')

    this.emit('run:start', { sessionKey, message, hasImage: !!image })

    try {
      let fullText = ''
      let hasStreamedContent = false

      const queryParams = {
        prompt: this.generateMessages(message, image),
        chatId: sessionKey,
        mcpServers: allMcpServers,
        allowedTools: allAllowedTools,
        maxTurns: this.maxTurns,
        systemPrompt,
        permissionMode: this.permissionMode
      }
      if (canUseTool) queryParams.canUseTool = canUseTool

      for await (const chunk of this.provider.query(queryParams)) {
        if (chunk.type === 'stream_event' && chunk.event) {
          const event = chunk.event
          hasStreamedContent = true

          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            const text = event.delta.text
            if (text) {
              fullText += text
              yield { type: 'text', content: text, isReasoning: !!event.isReasoning }
              this.emit('run:text', { sessionKey, content: text })
            }
          } else if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
            yield {
              type: 'tool_use',
              name: event.content_block.name,
              input: event.content_block.input || {},
              id: event.content_block.id
            }
            this.emit('run:tool', { sessionKey, name: event.content_block.name })
          }
          continue
        }

        if (chunk.type === 'assistant' && chunk.message?.content) {
          for (const block of chunk.message.content) {
            if (block.type === 'text' && block.text && !hasStreamedContent) {
              fullText += block.text
              yield { type: 'text', content: block.text }
              this.emit('run:text', { sessionKey, content: block.text })
            } else if (block.type === 'tool_use') {
              if (!hasStreamedContent) {
                yield { type: 'tool_use', name: block.name, input: block.input, id: block.id }
                this.emit('run:tool', { sessionKey, name: block.name })
              }
            }
          }
          continue
        }

        if (chunk.type === 'tool_result' || chunk.type === 'result') {
          yield { type: 'tool_result', result: chunk.result || chunk.content }
          continue
        }

        if (chunk.type === 'done') break
        if (chunk.type === 'aborted') {
          yield { type: 'aborted' }
          this.emit('run:aborted', { sessionKey })
          return
        }
        if (chunk.type === 'error') {
          yield { type: 'error', error: chunk.error }
          this.emit('run:error', { sessionKey, error: chunk.error })
          return
        }

        if (chunk.type !== 'system') yield chunk
      }

      yield { type: 'done', fullText }
      this.emit('run:complete', { sessionKey, response: fullText })

    } catch (error) {
      if (error.name === 'AbortError') {
        yield { type: 'aborted' }
        this.emit('run:aborted', { sessionKey })
      } else {
        console.error('[Agent] Error:', error)
        yield { type: 'error', error: error.message }
        this.emit('run:error', { sessionKey, error })
        throw error
      }
    }
  }

  /**
   * Run and collect full response (used by cron)
   */
  async runAndCollect(params) {
    let fullText = ''
    for await (const chunk of this.run(params)) {
      if (chunk.type === 'text') fullText += chunk.content
      if (chunk.type === 'done') return chunk.fullText || fullText
      if (chunk.type === 'error') throw new Error(chunk.error)
    }
    return fullText
  }

  stopCron() {
    this.cronScheduler.stop()
  }
}
