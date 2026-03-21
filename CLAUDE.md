# CLAUDE.md — m-y-ai Platform

AI agent and developer instructions for working on this codebase.

---

## Project Overview

**m-y-ai** is a personal AI assistant gateway — a 24/7 messaging middleware that bridges multiple chat platforms (WhatsApp, Telegram, Signal, iMessage) to a Claude AI backend. The system is a Node.js ES module project using the Claude Agent SDK, with a FIFO-queued, session-isolated agent runner.

**Current scope (this repo):** The gateway/backend. A Next.js web UI is planned as the next major deliverable.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ (ES modules, `"type": "module"`) |
| Package Manager | **Bun** (`bun install`, `bun run`) |
| AI Provider | `@anthropic-ai/claude-agent-sdk` (primary), `@opencode-ai/sdk` (alternative) |
| Integrations | `@composio/core` (500+ app MCP server) |
| Validation | `zod` v4 |
| Logging | `pino` |
| Persistence | Flat-file markdown (`~/m-y-ai/`), JSONL transcripts |
| Deployment | Docker + docker-compose |

---

## Directory Structure

```
.
├── adapters/              # Messaging platform adapters (SEE ADAPTERS SECTION)
│   ├── base.js            # Abstract base class — all adapters extend this
│   ├── whatsapp.js        # Baileys-based WhatsApp (ACTIVE)
│   ├── telegram.js        # node-telegram-bot-api polling (ACTIVE)
│   ├── signal.js          # signal-cli subprocess (disabled by default)
│   ├── imessage.js        # macOS imsg CLI (disabled by default)
│   ├── web.js             # Web/WebSocket adapter (PLACEHOLDER — needs implementation)
│   └── mobile-app.js      # React Native adapter (PLACEHOLDER)
│
├── agent/
│   ├── claude-agent.js    # ClaudeAgent: builds system prompt, initializes MCP servers
│   └── runner.js          # AgentRunner: per-session FIFO queue, event emitter
│
├── providers/
│   ├── index.js           # Factory + instance cache
│   ├── base-provider.js   # Abstract BaseProvider
│   ├── claude-provider.js # Anthropic SDK wrapper
│   └── opencode-provider.js # OpenCode SDK wrapper
│
├── memory/manager.js      # MemoryManager: daily logs + curated MEMORY.md
├── sessions/manager.js    # SessionManager: in-memory state + JSONL transcripts
├── tools/
│   ├── cron.js            # Cron MCP server (delayed/recurring/cron-expr jobs)
│   └── gateway.js         # Gateway MCP server (send_message, list_platforms, etc.)
│
├── commands/handler.js    # Slash command processor (/new, /status, /memory, /model)
├── storage/               # Markdown-based persistent storage (identity, memory, prefs)
├── gateway.js             # Main entry point — wires adapters + agent + tools
├── cli.js                 # Interactive CLI menu (start gateway, chat, setup adapters)
└── config.js              # Config loader (env vars → typed config object)
```

---

## Adapters — Critical Architecture

The adapter layer is the most important architectural concern. Every messaging platform follows the same interface defined in `adapters/base.js`.

### Base Adapter Interface

```javascript
// adapters/base.js
class BaseAdapter extends EventEmitter {
  async start()                              // Connect/auth with platform
  async stop()                              // Disconnect gracefully
  async sendMessage(chatId, text)           // Send outgoing message
  onMessage(callback)                       // Register: callback(message) on incoming
  shouldRespond(message, config)            // Allowlist check (DMs, groups, mentions)
  generateSessionKey(message)               // Returns: "agent:agentId:platform:type:chatId"
}
```

### Platform Adapter Summary

| Adapter | File | Protocol | Auth Method | Status |
|---------|------|----------|-------------|--------|
| WhatsApp | `whatsapp.js` | Baileys (unofficial WA) | QR code → file-based auth state | **ACTIVE** |
| Telegram | `telegram.js` | node-telegram-bot-api polling | Bot token | **ACTIVE** |
| Signal | `signal.js` | signal-cli JSON-RPC subprocess | Phone number | Disabled (opt-in) |
| iMessage | `imessage.js` | `imsg` CLI subprocess watch | Native macOS | Disabled (macOS only) |
| Web | `web.js` | **EMPTY PLACEHOLDER** | — | Needs implementation |
| Mobile | `mobile-app.js` | **EMPTY PLACEHOLDER** | — | Needs implementation |

### Session Key Format

Every adapter generates session keys in this format:
```
agent:{agentId}:{platform}:{type}:{chatId}
# Examples:
agent:m-y-ai:whatsapp:dm:+1234567890
agent:m-y-ai:telegram:group:123456789
agent:m-y-ai:web:dm:user-uuid
```

This key is used for:
- FIFO queue isolation (each session has its own queue)
- Transcript storage (sanitized to filesystem-safe path)
- Memory scoping

### Message Object Shape

Adapters normalize messages to this shape before calling `onMessage`:
```javascript
{
  chatId: string,           // Platform-specific chat identifier
  senderId: string,         // Sender identifier
  text: string,             // Message content
  platform: string,         // 'whatsapp' | 'telegram' | 'signal' | 'imessage' | 'web'
  type: string,             // 'dm' | 'group'
  timestamp: number,        // Unix timestamp
  // Platform-specific extras (e.g., media, reply-to, message ID)
}
```

### Adding a New Adapter

1. Create `adapters/your-platform.js` extending `BaseAdapter`
2. Implement all 5 methods: `start`, `stop`, `sendMessage`, `onMessage`, `shouldRespond`
3. Register in `gateway.js` `initAdapters()` method
4. Add config keys to `config.js` and `.env.example`

---

## Web Adapter (Priority Build)

`adapters/web.js` is currently an empty placeholder. The planned implementation is a **WebSocket adapter** that will allow the Next.js web UI to communicate with the gateway.

### Planned WebSocket Protocol

The gateway should expose a WebSocket server that speaks a structured frame protocol:

```typescript
// RequestFrame — client → gateway
{ type: 'message', sessionKey: string, text: string, timestamp: number }
{ type: 'command', sessionKey: string, command: string, args: string[] }

// ResponseFrame — gateway → client (streamed)
{ type: 'chunk', sessionKey: string, text: string, done: false }
{ type: 'chunk', sessionKey: string, text: string, done: true }
{ type: 'error', sessionKey: string, error: string }

// EventFrame — gateway → client (async)
{ type: 'tool_use', sessionKey: string, toolName: string, input: object }
{ type: 'queue_position', sessionKey: string, position: number }
{ type: 'status', sessionKey: string, state: 'queued'|'processing'|'completed'|'failed' }
```

### WebSocket Port

Use port `4096` (already exposed in docker-compose and Dockerfile).

---

## Message Flow

```
Incoming Message
  → Platform Adapter (WhatsApp/Telegram/etc.)
  → Gateway.handleAdapterMessage()
  → CommandHandler (if /slash command)
      OR
  → AgentRunner.enqueueRun(sessionKey, message)
  → Per-session FIFO queue (one active run per sessionKey)
  → ClaudeAgent.runAndCollect(message, context)
  → Claude Agent SDK (with MCP: Built-in tools + Composio + Cron + Gateway)
  → Streaming response chunks
  → Adapter.sendMessage() — back to platform
  → SessionManager.appendTranscript() — JSONL log
```

---

## Agent System

### ClaudeAgent (agent/claude-agent.js)

- Builds a dynamic system prompt per request including: current date/time, session info, platform, memory context (reads `MEMORY.md` + today's daily log)
- Initializes MCP servers: built-in Claude Code tools (`Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`, `TodoWrite`, `Skill`), Composio (500+ app integrations), custom Cron MCP, custom Gateway MCP
- Runs in `bypassPermissions` mode for autonomous operation
- Instructs model to **avoid markdown** on messaging platforms (no bold, no headers, no bullet lists)

### AgentRunner (agent/runner.js)

- Maintains a `Map<sessionKey, Queue>` for per-session isolation
- Emits lifecycle events: `queued`, `processing`, `completed`, `failed`
- Emits `agent:tool` for tool usage tracking
- Global stats: `totalQueued`, `totalProcessed`, `totalFailed`

---

## Providers (AI Abstraction)

Two providers are supported, selectable at runtime via `/provider` command or config:

| Provider | SDK | Default Models |
|----------|-----|----------------|
| `claude` | `@anthropic-ai/claude-agent-sdk` | `claude-opus-4-6`, `claude-sonnet-4-5-20250929`, `claude-haiku-4-5-20251001` |
| `opencode` | `@opencode-ai/sdk` | `opencode/big-pickle`, `opencode/gpt-5-nano`, `opencode/grok-code` |

Provider instances are cached by `name + config hash` in `providers/index.js`.

---

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional (enables Composio integrations)
COMPOSIO_API_KEY=ak_...

# WhatsApp
WHATSAPP_ALLOWED_DMS=+1234567890    # Comma-separated or '*' for all
WHATSAPP_ALLOWED_GROUPS=*

# Telegram
TELEGRAM_BOT_TOKEN=your-token
TELEGRAM_ALLOWED_DMS=*

# Signal (disabled by default)
SIGNAL_PHONE_NUMBER=+1234567890
SIGNAL_ALLOWED_DMS=+1234567890

# iMessage (macOS only, disabled by default)
IMESSAGE_ALLOWED_DMS=+1234567890
```

Copy `.env.example` → `.env` for local dev.

---

## NPM Scripts

```bash
bun start        # Start gateway (node cli.js start)
bun run chat     # Terminal chat mode
bun run setup    # Adapter setup wizard
bun run cli      # Interactive menu
```

---

## Slash Commands (via CommandHandler)

Available in all chat interfaces:
- `/new` or `/reset` — Start new session (clear transcript)
- `/status` — Show queue & session info
- `/memory` — Read/write memory files
- `/queue` — Show queue status
- `/model` — Select provider model
- `/provider` — Switch between Claude & OpenCode
- `/help` — Show all commands

---

## Storage & Memory

### Workspace Structure (`~/m-y-ai/`)

```
~/m-y-ai/
├── MEMORY.md                  # Curated long-term memory (agent writes on request)
├── memory/
│   └── YYYY-MM-DD.md          # Daily logs (append-only, auto-created)
└── sessions/
    └── {sanitized-session-key}.jsonl  # Per-session transcript
```

### Markdown Storage (`storage/` in repo)

```
storage/
├── Agents/Default/
│   ├── IDENTITY.md     # Agent personality
│   ├── SOUL.md         # Agent values
│   └── TOOLS.md        # Tool inventory
├── Personalization/
│   ├── USER.md         # User profile (Malhar Ujawane)
│   └── PREFERENCES.md  # Preferences
├── Memory/MEMORY.md    # Curated memory
└── Documents/
    ├── CALENDAR.md
    └── TODO.md
```

Memory writes only happen when user explicitly requests it ("remember this", "save this").

---

## Web UI Development Guidelines

When building the Next.js web UI for this project:

### Tech Stack (per CLAUDE.md global rules)
- **Next.js App Router** with TypeScript
- **Bun** as package manager
- **shadcn/ui** components + **Tailwind CSS**
- **Framer Motion** for animations
- **Lucide React** icons
- **Vercel Analytics** for observability
- Mobile responsive, glassmorphism/Liquid Glass design

### Key UI Surfaces to Build

1. **Chat Interface** — Real-time streaming chat connected to web adapter WebSocket
   - Message list with streaming text rendering
   - Use AI Elements (`npx ai-elements`) for AI text rendering — never render raw markdown
   - Input bar with command support (`/slash` commands)
   - Session selector (switch between conversation threads)

2. **Gateway Dashboard** — Monitor the gateway in real-time
   - Active adapters status (WhatsApp ✓, Telegram ✓, Signal ○, iMessage ○)
   - Queue visualization per session
   - Tool usage feed (agent:tool events)
   - Connected sessions list

3. **Memory Browser** — View and edit persistent memory
   - MEMORY.md viewer/editor
   - Daily log calendar view
   - Search across memory files

4. **Adapter Config** — Configure platform adapters
   - Per-adapter enable/disable toggles
   - Allowlist management (DMs, groups)
   - WhatsApp QR code display for auth

5. **Provider Settings** — Switch AI providers/models
   - Model selector (Claude vs OpenCode)
   - API key management

### WebSocket Connection Pattern

```typescript
// Connect to gateway WebSocket (port 4096)
const ws = new WebSocket('ws://localhost:4096')

// Send message
ws.send(JSON.stringify({
  type: 'message',
  sessionKey: 'agent:m-y-ai:web:dm:user-uuid',
  text: 'Hello',
  timestamp: Date.now()
}))

// Receive streaming chunks
ws.onmessage = (event) => {
  const frame = JSON.parse(event.data)
  // frame.type: 'chunk' | 'error' | 'tool_use' | 'queue_position' | 'status'
}
```

### API Routes to Build

```
GET  /api/sessions           # List active sessions
GET  /api/sessions/:key      # Session details + transcript
GET  /api/adapters           # List adapters + status
POST /api/adapters/:name     # Enable/disable adapter
GET  /api/memory             # Read MEMORY.md
PUT  /api/memory             # Write MEMORY.md
GET  /api/memory/daily       # Daily logs list
GET  /api/memory/daily/:date # Read specific daily log
GET  /api/queue              # Queue stats
GET  /api/providers          # Available providers/models
POST /api/providers          # Switch provider/model
```

---

## Docker

```bash
# Build and run
docker-compose up -d

# Volumes
wa-auth:/app/auth_whatsapp   # WhatsApp auth state (QR code only on first run)
memory:/home/claw/m-y-ai     # Memory persistence
```

Container runs as non-root user `claw` (required for Claude Code `bypassPermissions` mode). Port `4096` is exposed.

---

## Key Patterns & Conventions

- **ES Modules only** — always `import`/`export`, never `require()`
- **Async/await** throughout — no callbacks except in adapter event handlers
- **EventEmitter** for lifecycle events (AgentRunner, CronManager)
- **Per-session FIFO queues** — never run two agent instances for the same session concurrently
- **Platform-agnostic messaging** — agent output must work in SMS-like contexts (no markdown, no code blocks)
- **Allowlists** — all adapters gate access via `shouldRespond()` before calling agent
- **Memory writes are explicit** — agent only writes to MEMORY.md when user says "remember this"

---

## Known Limitations / TODOs

- `adapters/web.js` is an empty placeholder — WebSocket implementation needed
- `adapters/mobile-app.js` is an empty placeholder — React Native bridge needed
- Signal and iMessage adapters are disabled by default (require extra setup)
- No authentication on the web UI yet — single-user assumption
- Memory is flat-file markdown, not vector-indexed (LanceDB planned)
- Provider switching resets session context (by design)
