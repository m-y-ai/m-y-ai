# m-y-ai Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal AI assistant platform with a Node.js gateway (rewrite of secure-openclaw) and Web (Next.js) + Mobile (Expo/React Native) as the only chat channels.

**Architecture:** A bun monorepo with three packages — `gateway` (WebSocket server handling AI providers, tools, memory, sessions), `web` (Next.js chat UI + dashboard), and `mobile` (Expo React Native). Clients connect to the gateway over WebSocket using a lightweight typed protocol. The gateway owns all AI logic; clients are thin.

**Tech Stack:** Node.js 22+ / TypeScript (gateway), Bun (package manager + runtime), Next.js 16 + shadcn/ui + Tailwind + framer-motion (web), Expo SDK 52 + React Native (mobile), LanceDB (vector memory), Puppeteer (browser tool), Composio (500+ app integrations via MCP), @anthropic-ai/sdk + openai + @google/generative-ai (providers).

---

## Design Decisions

### What we take from secure-openclaw (simplified)
- Per-session FIFO queue (Map<sessionId, queue>) — identical pattern
- Composio HTTP MCP integration (500+ apps, pre-wired)
- Cron scheduling tool (delayed, recurring, cron expr)
- Slash commands (/new, /status, /memory, /model, /provider)
- File-based config via `.env`
- JSONL session transcripts

### What we take from openclaw (but simpler)
- LanceDB vector memory (semantic search, replaces flat files)
- Browser automation tool (Puppeteer)
- Multi-provider AI (Claude, OpenAI, Gemini, Ollama)
- Skills system (simplified — local markdown skill files)
- PDF tool, web search (Tavily), image generation

### What's new in m-y-ai
- WebSocket gateway protocol (RequestFrame / ResponseFrame / EventFrame)
- Next.js web app as primary channel (replaces terminal chat)
- Expo React Native mobile app as secondary channel
- Built-in dashboard: sessions, memory browser, provider config, skill manager
- No messaging platform integrations (WhatsApp, Telegram, etc.)

---

## Repository Structure

```
m-y-ai/
├── packages/
│   ├── gateway/                 # Core WebSocket gateway
│   │   ├── src/
│   │   │   ├── index.ts         # Entry: starts WS server
│   │   │   ├── server.ts        # WebSocket server, client registry, frame routing
│   │   │   ├── config.ts        # Config loader from .env
│   │   │   ├── protocol/
│   │   │   │   └── types.ts     # All WS frame types (shared contract)
│   │   │   ├── agent/
│   │   │   │   ├── runner.ts    # Per-session FIFO queues + concurrency
│   │   │   │   └── executor.ts  # Build system prompt, call provider, stream chunks
│   │   │   ├── providers/
│   │   │   │   ├── index.ts     # Provider registry + factory
│   │   │   │   ├── base.ts      # BaseProvider interface
│   │   │   │   ├── claude.ts    # @anthropic-ai/sdk wrapper
│   │   │   │   ├── openai.ts    # openai wrapper
│   │   │   │   ├── gemini.ts    # @google/generative-ai wrapper
│   │   │   │   └── ollama.ts    # Ollama HTTP wrapper (local models)
│   │   │   ├── tools/
│   │   │   │   ├── index.ts     # Tool registry, MCP server composition
│   │   │   │   ├── browser.ts   # Puppeteer: screenshot, navigate, click, fill
│   │   │   │   ├── memory.ts    # LanceDB: search, write, list
│   │   │   │   ├── cron.ts      # Schedule delayed/recurring/cron jobs
│   │   │   │   ├── search.ts    # Tavily web search
│   │   │   │   ├── image.ts     # Image generation (OpenAI DALL-E / Fal)
│   │   │   │   ├── pdf.ts       # PDF text extraction
│   │   │   │   └── composio.ts  # Composio HTTP MCP (500+ apps)
│   │   │   ├── memory/
│   │   │   │   └── manager.ts   # LanceDB vector store lifecycle
│   │   │   ├── sessions/
│   │   │   │   └── manager.ts   # JSONL transcript r/w, session metadata
│   │   │   ├── skills/
│   │   │   │   └── manager.ts   # Load .md skill files, inject into system prompt
│   │   │   └── commands/
│   │   │       └── handler.ts   # Slash command parser + dispatcher
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                     # Next.js 16 web app
│   │   ├── app/
│   │   │   ├── layout.tsx       # Root layout (Geist font, dark theme, analytics)
│   │   │   ├── page.tsx         # Redirect to /chat
│   │   │   ├── chat/
│   │   │   │   └── page.tsx     # Chat interface
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx     # Overview: sessions, status, quick stats
│   │   │   │   ├── memory/
│   │   │   │   │   └── page.tsx # Memory browser (search, view, delete)
│   │   │   │   ├── skills/
│   │   │   │   │   └── page.tsx # Skill manager (enable/disable)
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx # Provider config, model, API keys
│   │   │   └── api/
│   │   │       └── health/
│   │   │           └── route.ts # Health check
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── chat-panel.tsx     # Main chat container
│   │   │   │   ├── message-list.tsx   # Scrollable message history
│   │   │   │   ├── message-item.tsx   # Single message (user/assistant/tool)
│   │   │   │   ├── tool-call-card.tsx # Tool invocation display
│   │   │   │   ├── input-bar.tsx      # Text input + send button + attach
│   │   │   │   └── session-sidebar.tsx# Session list + new session button
│   │   │   ├── dashboard/
│   │   │   │   ├── stat-card.tsx
│   │   │   │   ├── memory-row.tsx
│   │   │   │   └── skill-toggle.tsx
│   │   │   └── ui/                    # shadcn components
│   │   ├── lib/
│   │   │   ├── gateway-ws.ts          # WS client singleton (reconnect, frame parse)
│   │   │   └── store.ts               # Zustand store (messages, sessions, status)
│   │   ├── hooks/
│   │   │   └── use-gateway.ts         # React hook wrapping gateway-ws.ts
│   │   └── package.json
│   │
│   └── mobile/                  # Expo React Native app
│       ├── app/
│       │   ├── _layout.tsx      # Root layout (NativeWind, navigation)
│       │   ├── index.tsx        # Chat screen
│       │   └── settings.tsx     # Provider/model settings
│       ├── components/
│       │   ├── MessageList.tsx
│       │   ├── MessageBubble.tsx
│       │   ├── InputBar.tsx
│       │   └── ToolCallCard.tsx
│       ├── lib/
│       │   ├── gateway-ws.ts    # WS client (same protocol, RN WebSocket API)
│       │   └── store.ts         # Zustand store
│       └── package.json
│
├── package.json                 # Bun workspace root
├── .env.example
├── .gitignore
└── README.md
```

---

## WebSocket Protocol (shared contract)

All frames are JSON. Clients send `ClientFrame`, gateway sends `ServerFrame`.

```typescript
// packages/gateway/src/protocol/types.ts

// Client → Gateway
type ClientFrame =
  | { type: 'message';  sessionId: string; text: string; attachments?: Attachment[] }
  | { type: 'command';  sessionId: string; command: string }   // /new /status etc.
  | { type: 'abort';    sessionId: string }
  | { type: 'list_sessions' }
  | { type: 'get_memory';   query: string }
  | { type: 'get_sessions_meta' }

// Gateway → Client
type ServerFrame =
  | { type: 'chunk';        sessionId: string; text: string }
  | { type: 'tool_use';     sessionId: string; tool: string; args: unknown }
  | { type: 'tool_result';  sessionId: string; tool: string; result: unknown }
  | { type: 'thinking';     sessionId: string; text: string }
  | { type: 'done';         sessionId: string }
  | { type: 'error';        sessionId: string; message: string }
  | { type: 'command_response'; sessionId: string; text: string }
  | { type: 'sessions';     sessions: SessionMeta[] }
  | { type: 'memory_results'; results: MemoryResult[] }
  | { type: 'status';       provider: string; model: string; uptime: number }
  | { type: 'cron_fired';   jobId: string; message: string }
```

---

## Task 1: Monorepo Scaffold

**Files:**
- Create: `package.json` (bun workspace root)
- Create: `packages/gateway/package.json`
- Create: `packages/gateway/tsconfig.json`
- Create: `packages/gateway/src/protocol/types.ts`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Init bun workspace**

```bash
cd /Users/malharujawane/Documents/Development/m-y-ai/m-y-ai
```

Create `package.json`:
```json
{
  "name": "m-y-ai",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "gateway": "bun run packages/gateway/src/index.ts",
    "web": "cd packages/web && bun dev",
    "dev": "concurrently \"bun gateway\" \"bun web\""
  },
  "devDependencies": {
    "concurrently": "^9.1.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create gateway package**

```bash
mkdir -p packages/gateway/src/{protocol,agent,providers,tools,memory,sessions,skills,commands}
```

`packages/gateway/package.json`:
```json
{
  "name": "@m-y-ai/gateway",
  "version": "0.1.0",
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.37.0",
    "@composio/core": "latest",
    "openai": "^4.77.0",
    "@google/generative-ai": "^0.21.0",
    "@lancedb/lancedb": "^0.14.0",
    "apache-arrow": "^18.1.0",
    "ws": "^8.18.0",
    "dotenv": "^16.4.7",
    "pino": "^9.6.0",
    "zod": "^3.24.0",
    "node-cron": "^3.0.3",
    "puppeteer": "^23.10.0",
    "pdf-parse": "^1.1.1"
  },
  "devDependencies": {
    "@types/ws": "^8.5.14",
    "@types/node": "^22.10.0"
  }
}
```

`packages/gateway/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write protocol types**

`packages/gateway/src/protocol/types.ts` — write full ClientFrame and ServerFrame types as defined in the Design Decisions section above. Include `SessionMeta`, `MemoryResult`, `Attachment` types.

- [ ] **Step 4: Create .env.example**

```bash
# AI Providers (at least one required)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
OLLAMA_BASE_URL=http://localhost:11434

# App integrations (optional but recommended)
COMPOSIO_API_KEY=ak_...

# Web search (optional)
TAVILY_API_KEY=tvly-...

# Gateway config
GATEWAY_PORT=4069
GATEWAY_SECRET=changeme-long-random-string

# Default provider + model
DEFAULT_PROVIDER=claude
DEFAULT_MODEL=claude-sonnet-4-5

# Storage paths (defaults shown)
MEMORY_PATH=~/.m-y-ai/memory
SESSIONS_PATH=~/.m-y-ai/sessions
SKILLS_PATH=~/.m-y-ai/skills
CRON_PATH=~/.m-y-ai/cron-jobs.json
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
dist/
.env
.env.local
*.local
.DS_Store
auth_*/
~/.m-y-ai/sessions/   # don't commit personal sessions
```

- [ ] **Step 6: Install workspace deps + commit**

```bash
bun install
git add -A
git commit -m "feat: init bun monorepo scaffold with gateway package skeleton"
```

---

## Task 2: Gateway Config + Logging

**Files:**
- Create: `packages/gateway/src/config.ts`
- Create: `packages/gateway/src/logger.ts`

- [ ] **Step 1: Write config.ts**

`packages/gateway/src/config.ts`:
```typescript
import { config as loadEnv } from 'dotenv'
import { z } from 'zod'
import { homedir } from 'os'
import { join } from 'path'

loadEnv()

const resolve = (p: string) => p.replace('~', homedir())

const schema = z.object({
  gatewayPort:     z.coerce.number().default(4069),
  gatewaySecret:   z.string().default(''),
  defaultProvider: z.string().default('claude'),
  defaultModel:    z.string().default('claude-sonnet-4-5'),
  // Provider keys
  anthropicApiKey: z.string().optional(),
  openaiApiKey:    z.string().optional(),
  geminiApiKey:    z.string().optional(),
  ollamaBaseUrl:   z.string().default('http://localhost:11434'),
  // Integrations
  composioApiKey:  z.string().optional(),
  tavilyApiKey:    z.string().optional(),
  // Storage
  memoryPath:   z.string().default(resolve('~/.m-y-ai/memory')),
  sessionsPath: z.string().default(resolve('~/.m-y-ai/sessions')),
  skillsPath:   z.string().default(resolve('~/.m-y-ai/skills')),
  cronPath:     z.string().default(resolve('~/.m-y-ai/cron-jobs.json')),
})

export const config = schema.parse({
  gatewayPort:     process.env.GATEWAY_PORT,
  gatewaySecret:   process.env.GATEWAY_SECRET,
  defaultProvider: process.env.DEFAULT_PROVIDER,
  defaultModel:    process.env.DEFAULT_MODEL,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openaiApiKey:    process.env.OPENAI_API_KEY,
  geminiApiKey:    process.env.GEMINI_API_KEY,
  ollamaBaseUrl:   process.env.OLLAMA_BASE_URL,
  composioApiKey:  process.env.COMPOSIO_API_KEY,
  tavilyApiKey:    process.env.TAVILY_API_KEY,
  memoryPath:      process.env.MEMORY_PATH,
  sessionsPath:    process.env.SESSIONS_PATH,
  skillsPath:      process.env.SKILLS_PATH,
  cronPath:        process.env.CRON_PATH,
})
```

- [ ] **Step 2: Write logger.ts**

```typescript
import pino from 'pino'
export const logger = pino({ level: process.env.LOG_LEVEL ?? 'info', transport: { target: 'pino-pretty' } })
```

- [ ] **Step 3: Commit**

```bash
git add packages/gateway/src/config.ts packages/gateway/src/logger.ts
git commit -m "feat(gateway): config loader with zod validation + pino logger"
```

---

## Task 3: Session Manager

**Files:**
- Create: `packages/gateway/src/sessions/manager.ts`

- [ ] **Step 1: Write sessions/manager.ts**

```typescript
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'fs'
import { join } from 'path'
import { config } from '../config.js'

export interface SessionMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface SessionMeta {
  sessionId: string
  createdAt: number
  updatedAt: number
  provider: string
  model: string
  messageCount: number
}

export class SessionManager {
  private cache = new Map<string, SessionMessage[]>()
  private meta  = new Map<string, SessionMeta>()

  constructor() {
    mkdirSync(config.sessionsPath, { recursive: true })
  }

  private filePath(sessionId: string) {
    return join(config.sessionsPath, `${sessionId.replace(/[^a-z0-9-]/gi, '_')}.jsonl`)
  }

  private metaPath() {
    return join(config.sessionsPath, '_meta.json')
  }

  loadMeta(): SessionMeta[] {
    const p = this.metaPath()
    if (!existsSync(p)) return []
    return JSON.parse(readFileSync(p, 'utf8'))
  }

  private saveMeta() {
    writeFileSync(this.metaPath(), JSON.stringify([...this.meta.values()], null, 2))
  }

  getMessages(sessionId: string): SessionMessage[] {
    if (this.cache.has(sessionId)) return this.cache.get(sessionId)!
    const p = this.filePath(sessionId)
    if (!existsSync(p)) return []
    const msgs = readFileSync(p, 'utf8')
      .split('\n').filter(Boolean)
      .map(l => JSON.parse(l) as SessionMessage)
    this.cache.set(sessionId, msgs)
    return msgs
  }

  appendMessage(sessionId: string, msg: SessionMessage, provider: string, model: string) {
    const msgs = this.getMessages(sessionId)
    msgs.push(msg)
    appendFileSync(this.filePath(sessionId), JSON.stringify(msg) + '\n')
    const existing = this.meta.get(sessionId)
    this.meta.set(sessionId, {
      sessionId,
      createdAt: existing?.createdAt ?? msg.timestamp,
      updatedAt: msg.timestamp,
      provider,
      model,
      messageCount: msgs.length,
    })
    this.saveMeta()
  }

  clearSession(sessionId: string) {
    this.cache.delete(sessionId)
    writeFileSync(this.filePath(sessionId), '')
    if (this.meta.has(sessionId)) {
      const m = this.meta.get(sessionId)!
      this.meta.set(sessionId, { ...m, messageCount: 0 })
      this.saveMeta()
    }
  }

  newSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  }
}

export const sessions = new SessionManager()
```

- [ ] **Step 2: Commit**

```bash
git add packages/gateway/src/sessions/
git commit -m "feat(gateway): JSONL session manager with metadata index"
```

---

## Task 4: Memory Manager (LanceDB)

**Files:**
- Create: `packages/gateway/src/memory/manager.ts`

- [ ] **Step 1: Write memory/manager.ts**

```typescript
import { connect, type Connection, type Table } from '@lancedb/lancedb'
import { config } from '../config.js'
import { logger } from '../logger.js'

interface MemoryRecord {
  id: string
  text: string
  sessionId: string
  timestamp: number
  vector: number[]
}

export interface MemoryResult {
  id: string
  text: string
  sessionId: string
  timestamp: number
  score: number
}

export class MemoryManager {
  private db: Connection | null = null
  private table: Table | null = null

  async init() {
    this.db = await connect(config.memoryPath)
    const tables = await this.db.tableNames()
    if (tables.includes('memories')) {
      this.table = await this.db.openTable('memories')
    }
    logger.info('Memory manager initialized')
  }

  private async embed(text: string): Promise<number[]> {
    // Use a simple hash-based embedding until a real embedding model is wired
    // Replace with OpenAI text-embedding-3-small or local model
    const buf = Buffer.from(text)
    const vec = Array.from({ length: 384 }, (_, i) => (buf[i % buf.length] ?? 0) / 255)
    return vec
  }

  async write(text: string, sessionId: string): Promise<string> {
    const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const vector = await this.embed(text)
    const record: MemoryRecord = { id, text, sessionId, timestamp: Date.now(), vector }
    if (!this.table) {
      this.table = await this.db!.createTable('memories', [record])
    } else {
      await this.table.add([record])
    }
    return id
  }

  async search(query: string, limit = 5): Promise<MemoryResult[]> {
    if (!this.table) return []
    const vector = await this.embed(query)
    const results = await this.table.vectorSearch(vector).limit(limit).toArray()
    return results.map(r => ({ id: r.id, text: r.text, sessionId: r.sessionId, timestamp: r.timestamp, score: r._distance ?? 0 }))
  }

  async list(limit = 20): Promise<MemoryResult[]> {
    if (!this.table) return []
    const results = await this.table.query().limit(limit).toArray()
    return results.map(r => ({ id: r.id, text: r.text, sessionId: r.sessionId, timestamp: r.timestamp, score: 0 }))
  }
}

export const memory = new MemoryManager()
```

> **NOTE:** Replace the `embed()` stub with `openai.embeddings.create({ model: 'text-embedding-3-small', input: text })` once the OpenAI provider is wired (Task 6). The interface stays the same.

- [ ] **Step 2: Commit**

```bash
git add packages/gateway/src/memory/
git commit -m "feat(gateway): LanceDB memory manager with semantic search interface"
```

---

## Task 5: Provider System

**Files:**
- Create: `packages/gateway/src/providers/base.ts`
- Create: `packages/gateway/src/providers/claude.ts`
- Create: `packages/gateway/src/providers/openai.ts`
- Create: `packages/gateway/src/providers/gemini.ts`
- Create: `packages/gateway/src/providers/ollama.ts`
- Create: `packages/gateway/src/providers/index.ts`

- [ ] **Step 1: Write base.ts**

```typescript
export interface ProviderMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

export interface StreamChunk {
  type: 'text' | 'tool_use' | 'tool_result' | 'thinking' | 'done'
  text?: string
  toolName?: string
  toolArgs?: unknown
  toolResult?: unknown
}

export interface QueryOptions {
  systemPrompt: string
  messages: ProviderMessage[]
  tools: ToolDefinition[]
  maxTokens?: number
  onChunk: (chunk: StreamChunk) => void
}

export interface BaseProvider {
  name: string
  query(opts: QueryOptions): Promise<void>
  getModels(): string[]
  currentModel: string
  setModel(model: string): void
  abort(): void
}
```

- [ ] **Step 2: Write claude.ts**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { config } from '../config.js'
import type { BaseProvider, QueryOptions, StreamChunk } from './base.js'

export class ClaudeProvider implements BaseProvider {
  name = 'claude'
  currentModel: string
  private client: Anthropic
  private controller: AbortController | null = null

  private models = ['claude-opus-4-6', 'claude-sonnet-4-5', 'claude-haiku-4-5']

  constructor() {
    this.client = new Anthropic({ apiKey: config.anthropicApiKey })
    this.currentModel = config.defaultModel.startsWith('claude') ? config.defaultModel : 'claude-sonnet-4-5'
  }

  getModels() { return this.models }
  setModel(model: string) { this.currentModel = model }
  abort() { this.controller?.abort() }

  async query({ systemPrompt, messages, tools, onChunk }: QueryOptions) {
    this.controller = new AbortController()
    const stream = this.client.messages.stream({
      model: this.currentModel,
      max_tokens: 8192,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      tools: tools.map(t => ({ name: t.name, description: t.description, input_schema: t.inputSchema as Anthropic.Tool['input_schema'] })),
    }, { signal: this.controller.signal })

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') onChunk({ type: 'text', text: event.delta.text })
        if (event.delta.type === 'thinking_delta') onChunk({ type: 'thinking', text: event.delta.thinking })
      }
      if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
        onChunk({ type: 'tool_use', toolName: event.content_block.name })
      }
    }
    onChunk({ type: 'done' })
  }
}
```

- [ ] **Step 3: Write openai.ts, gemini.ts, ollama.ts**

Each follows the same `BaseProvider` interface. `openai.ts` wraps `openai` SDK stream. `gemini.ts` wraps `@google/generative-ai` generateContentStream. `ollama.ts` hits `{ollamaBaseUrl}/api/chat` with `stream: true` using fetch.

- [ ] **Step 4: Write providers/index.ts**

```typescript
import { config } from '../config.js'
import { ClaudeProvider } from './claude.js'
import { OpenAIProvider } from './openai.js'
import { GeminiProvider } from './gemini.js'
import { OllamaProvider } from './ollama.js'
import type { BaseProvider } from './base.js'

const registry: Record<string, () => BaseProvider> = {
  claude: () => new ClaudeProvider(),
  openai: () => new OpenAIProvider(),
  gemini: () => new GeminiProvider(),
  ollama: () => new OllamaProvider(),
}

let activeProvider: BaseProvider = registry[config.defaultProvider]?.() ?? new ClaudeProvider()

export const providers = {
  get current() { return activeProvider },
  switchProvider(name: string) {
    if (!registry[name]) throw new Error(`Unknown provider: ${name}`)
    activeProvider = registry[name]()
  },
  list: () => Object.keys(registry),
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/gateway/src/providers/
git commit -m "feat(gateway): multi-provider system (Claude, OpenAI, Gemini, Ollama)"
```

---

## Task 6: Tool System

**Files:**
- Create: `packages/gateway/src/tools/index.ts`
- Create: `packages/gateway/src/tools/browser.ts`
- Create: `packages/gateway/src/tools/memory.ts`
- Create: `packages/gateway/src/tools/cron.ts`
- Create: `packages/gateway/src/tools/search.ts`
- Create: `packages/gateway/src/tools/image.ts`
- Create: `packages/gateway/src/tools/pdf.ts`
- Create: `packages/gateway/src/tools/composio.ts`

- [ ] **Step 1: Write tools/index.ts (registry)**

```typescript
import type { ToolDefinition } from '../providers/base.js'

export interface ToolExecutor {
  definition: ToolDefinition
  execute(args: unknown): Promise<unknown>
}

const registry = new Map<string, ToolExecutor>()

export const tools = {
  register(executor: ToolExecutor) { registry.set(executor.definition.name, executor) },
  getDefinitions(): ToolDefinition[] { return [...registry.values()].map(t => t.definition) },
  async execute(name: string, args: unknown): Promise<unknown> {
    const executor = registry.get(name)
    if (!executor) throw new Error(`Unknown tool: ${name}`)
    return executor.execute(args)
  },
}
```

- [ ] **Step 2: Write tools/browser.ts (Puppeteer)**

```typescript
import puppeteer, { type Browser } from 'puppeteer'
import { tools } from './index.js'

let browser: Browser | null = null
const getBrowser = async () => { browser ??= await puppeteer.launch({ headless: true }); return browser }

tools.register({
  definition: {
    name: 'browser',
    description: 'Control a headless browser: navigate to URLs, take screenshots, click elements, fill forms, extract text',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['navigate', 'screenshot', 'click', 'fill', 'extract_text', 'evaluate'] },
        url: { type: 'string' },
        selector: { type: 'string' },
        value: { type: 'string' },
        script: { type: 'string' },
      },
      required: ['action'],
    },
  },
  async execute(args: any) {
    const b = await getBrowser()
    const page = (await b.pages())[0] ?? await b.newPage()
    switch (args.action) {
      case 'navigate':   await page.goto(args.url, { waitUntil: 'domcontentloaded' }); return { ok: true, url: page.url() }
      case 'screenshot': return { screenshot: (await page.screenshot({ encoding: 'base64' })) }
      case 'click':      await page.click(args.selector); return { ok: true }
      case 'fill':       await page.fill(args.selector, args.value); return { ok: true }
      case 'extract_text': return { text: await page.$eval('body', el => el.innerText) }
      case 'evaluate':   return { result: await page.evaluate(args.script) }
      default: throw new Error(`Unknown action: ${args.action}`)
    }
  },
})
```

- [ ] **Step 3: Write tools/memory.ts**

```typescript
import { tools } from './index.js'
import { memory } from '../memory/manager.js'

tools.register({
  definition: {
    name: 'memory_search',
    description: 'Semantically search your personal memory for relevant information',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
  },
  async execute(args: any) { return { results: await memory.search(args.query) } },
})

tools.register({
  definition: {
    name: 'memory_write',
    description: 'Save a piece of information to long-term memory for future retrieval',
    inputSchema: { type: 'object', properties: { text: { type: 'string' }, sessionId: { type: 'string' } }, required: ['text'] },
  },
  async execute(args: any) {
    const id = await memory.write(args.text, args.sessionId ?? 'unknown')
    return { id, saved: true }
  },
})
```

- [ ] **Step 4: Write tools/search.ts (Tavily)**

```typescript
import { tools } from './index.js'
import { config } from '../config.js'

tools.register({
  definition: {
    name: 'web_search',
    description: 'Search the web for current information',
    inputSchema: { type: 'object', properties: { query: { type: 'string' }, maxResults: { type: 'number' } }, required: ['query'] },
  },
  async execute(args: any) {
    if (!config.tavilyApiKey) return { error: 'TAVILY_API_KEY not configured' }
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.tavilyApiKey}` },
      body: JSON.stringify({ query: args.query, max_results: args.maxResults ?? 5 }),
    })
    return res.json()
  },
})
```

- [ ] **Step 5: Write tools/cron.ts**

Mirror the cron logic from `secure-openclaw/tools/cron.js` but in TypeScript. Use `node-cron` for cron expressions. Persist jobs to `config.cronPath`. Expose tools: `schedule_delayed`, `schedule_recurring`, `schedule_cron`, `list_scheduled`, `cancel_scheduled`.

- [ ] **Step 6: Write tools/pdf.ts**

Use `pdf-parse`. Accept a file path or base64 encoded PDF. Return extracted text.

- [ ] **Step 7: Write tools/image.ts**

Use OpenAI `images.generate` (DALL-E 3). Return the image URL. Fallback to returning an error if OpenAI key not configured.

- [ ] **Step 8: Write tools/composio.ts**

```typescript
import { Composio } from '@composio/core'
import { tools } from './index.js'
import { config } from '../config.js'

export async function initComposio() {
  if (!config.composioApiKey) return
  const composio = new Composio({ apiKey: config.composioApiKey })
  // Composio exposes its tools via MCP HTTP — register a passthrough tool
  tools.register({
    definition: {
      name: 'composio',
      description: 'Execute any of 500+ app integrations (Gmail, Calendar, GitHub, Notion, Slack, Linear, Jira, HubSpot, Salesforce…). Pass the app name and action.',
      inputSchema: {
        type: 'object',
        properties: {
          app: { type: 'string', description: 'App name e.g. gmail, github, notion' },
          action: { type: 'string', description: 'Action name e.g. GMAIL_SEND_EMAIL' },
          params: { type: 'object' },
        },
        required: ['app', 'action'],
      },
    },
    async execute(args: any) {
      const entity = composio.getEntity('default')
      return entity.execute(args.action, args.params)
    },
  })
}
```

- [ ] **Step 9: Commit**

```bash
git add packages/gateway/src/tools/
git commit -m "feat(gateway): tool system (browser, memory, search, cron, pdf, image, composio)"
```

---

## Task 7: Skills Manager

**Files:**
- Create: `packages/gateway/src/skills/manager.ts`
- Create: `~/.m-y-ai/skills/example.md` (runtime, not committed)

- [ ] **Step 1: Write skills/manager.ts**

```typescript
import { readdirSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { config } from '../config.js'
import { mkdirSync } from 'fs'

export interface Skill {
  name: string
  description: string
  content: string
  enabled: boolean
}

export class SkillsManager {
  private skills = new Map<string, Skill>()

  constructor() {
    mkdirSync(config.skillsPath, { recursive: true })
    this.load()
  }

  private load() {
    if (!existsSync(config.skillsPath)) return
    const files = readdirSync(config.skillsPath).filter(f => f.endsWith('.md'))
    for (const file of files) {
      const content = readFileSync(join(config.skillsPath, file), 'utf8')
      const name = file.replace('.md', '')
      // Parse frontmatter: ---\nenabled: true\ndescription: ...\n---
      const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)/)
      const meta = match ? Object.fromEntries(match[1].split('\n').map(l => l.split(': '))) : {}
      this.skills.set(name, {
        name,
        description: meta.description ?? '',
        content: match ? match[2] : content,
        enabled: meta.enabled !== 'false',
      })
    }
  }

  getSystemPromptAppend(): string {
    return [...this.skills.values()]
      .filter(s => s.enabled)
      .map(s => `## Skill: ${s.name}\n${s.content}`)
      .join('\n\n')
  }

  list(): Skill[] { return [...this.skills.values()] }
  toggle(name: string, enabled: boolean) {
    const s = this.skills.get(name)
    if (s) this.skills.set(name, { ...s, enabled })
  }
}

export const skills = new SkillsManager()
```

- [ ] **Step 2: Commit**

```bash
git add packages/gateway/src/skills/
git commit -m "feat(gateway): markdown skill loader with frontmatter enable/disable"
```

---

## Task 8: Agent Executor + Runner

**Files:**
- Create: `packages/gateway/src/agent/executor.ts`
- Create: `packages/gateway/src/agent/runner.ts`

- [ ] **Step 1: Write agent/executor.ts**

```typescript
import { providers } from '../providers/index.js'
import { tools } from '../tools/index.js'
import { sessions } from '../sessions/manager.js'
import { memory } from '../memory/manager.js'
import { skills } from '../skills/manager.js'
import type { StreamChunk } from '../providers/base.js'

export interface ExecuteOptions {
  sessionId: string
  message: string
  onChunk: (chunk: StreamChunk) => void
}

function buildSystemPrompt(sessionId: string): string {
  const now = new Date().toISOString()
  const memCtx = '' // populated after async memory search (see execute())
  const skillCtx = skills.getSystemPromptAppend()

  return `You are m-y-ai, a personal AI assistant.
Current time: ${now}
Session: ${sessionId}

You have access to tools: browser automation, web search, memory read/write, file handling, scheduling (cron), and 500+ app integrations via Composio (Gmail, Calendar, GitHub, Notion, Slack, and more).

Memory guidelines:
- Only save to memory when the user explicitly asks you to remember something.
- Search memory proactively when the user references past context.

Communication: Be concise. No unnecessary preamble.

${skillCtx}`.trim()
}

export async function execute({ sessionId, message, onChunk }: ExecuteOptions) {
  // Load history
  const history = sessions.getMessages(sessionId)
  const provider = providers.current

  // Inject memory context into system prompt
  const memResults = await memory.search(message, 3)
  const memCtx = memResults.length
    ? '\n\nRelevant memories:\n' + memResults.map(r => `- ${r.text}`).join('\n')
    : ''

  const systemPrompt = buildSystemPrompt(sessionId) + memCtx

  // Add user message to session
  sessions.appendMessage(sessionId, { role: 'user', content: message, timestamp: Date.now() }, provider.name, provider.currentModel)

  let fullResponse = ''
  const pendingToolCall: { name: string; args: unknown } | null = null

  await provider.query({
    systemPrompt,
    messages: [...history, { role: 'user', content: message }],
    tools: tools.getDefinitions(),
    onChunk: async (chunk) => {
      if (chunk.type === 'text') fullResponse += chunk.text ?? ''
      if (chunk.type === 'tool_use' && chunk.toolName) {
        onChunk(chunk)
        // Tool execution is handled by the streaming loop in each provider
        // Providers that support tool loops will call tools.execute() internally
        // For providers that don't (Gemini, Ollama), we handle it here
      }
      onChunk(chunk)
    },
  })

  // Save assistant response
  if (fullResponse) {
    sessions.appendMessage(sessionId, { role: 'assistant', content: fullResponse, timestamp: Date.now() }, provider.name, provider.currentModel)
  }
}
```

- [ ] **Step 2: Write agent/runner.ts (per-session FIFO queue)**

```typescript
import { execute } from './executor.js'
import type { StreamChunk } from '../providers/base.js'

interface QueueItem {
  sessionId: string
  message: string
  onChunk: (chunk: StreamChunk) => void
  onDone: () => void
  onError: (err: Error) => void
}

const queues = new Map<string, { items: QueueItem[]; processing: boolean }>()

function getQueue(sessionId: string) {
  if (!queues.has(sessionId)) queues.set(sessionId, { items: [], processing: false })
  return queues.get(sessionId)!
}

async function processQueue(sessionId: string) {
  const q = getQueue(sessionId)
  if (q.processing) return
  q.processing = true
  while (q.items.length > 0) {
    const item = q.items.shift()!
    try {
      await execute({ sessionId: item.sessionId, message: item.message, onChunk: item.onChunk })
      item.onDone()
    } catch (err) {
      item.onError(err instanceof Error ? err : new Error(String(err)))
    }
  }
  q.processing = false
}

export function enqueue(item: QueueItem) {
  getQueue(item.sessionId).items.push(item)
  processQueue(item.sessionId)
}

export function queueDepth(sessionId: string) {
  return getQueue(sessionId).items.length
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/gateway/src/agent/
git commit -m "feat(gateway): agent executor with memory injection + per-session FIFO runner"
```

---

## Task 9: Slash Command Handler

**Files:**
- Create: `packages/gateway/src/commands/handler.ts`

- [ ] **Step 1: Write commands/handler.ts**

```typescript
import { sessions } from '../sessions/manager.js'
import { memory } from '../memory/manager.js'
import { providers } from '../providers/index.js'
import { skills } from '../skills/manager.js'
import { queueDepth } from '../agent/runner.js'

export interface CommandResult {
  handled: boolean
  response?: string
}

export async function handleCommand(sessionId: string, input: string): Promise<CommandResult> {
  const [cmd, ...args] = input.trim().split(/\s+/)
  switch (cmd) {
    case '/new':
    case '/reset':
      sessions.clearSession(sessionId)
      return { handled: true, response: 'Session cleared. Starting fresh.' }

    case '/status':
      const p = providers.current
      return { handled: true, response: `Provider: ${p.name} | Model: ${p.currentModel} | Queue: ${queueDepth(sessionId)} messages` }

    case '/memory':
      if (args[0] === 'search') {
        const results = await memory.search(args.slice(1).join(' '))
        return { handled: true, response: results.length ? results.map(r => `• ${r.text}`).join('\n') : 'No results.' }
      }
      const all = await memory.list(10)
      return { handled: true, response: all.length ? all.map(r => `• ${r.text}`).join('\n') : 'Memory is empty.' }

    case '/model':
      if (args[0]) { providers.current.setModel(args[0]); return { handled: true, response: `Model set to ${args[0]}` } }
      return { handled: true, response: `Current model: ${providers.current.currentModel}\nAvailable: ${providers.current.getModels().join(', ')}` }

    case '/provider':
      if (args[0]) { providers.switchProvider(args[0]); return { handled: true, response: `Switched to ${args[0]}` } }
      return { handled: true, response: `Provider: ${providers.current.name} | Available: ${providers.list().join(', ')}` }

    case '/skills':
      const list = skills.list()
      return { handled: true, response: list.map(s => `${s.enabled ? '✓' : '○'} ${s.name}: ${s.description}`).join('\n') }

    case '/queue':
      return { handled: true, response: `Queue depth for ${sessionId}: ${queueDepth(sessionId)}` }

    case '/help':
      return { handled: true, response: '/new /status /memory [search <q>] /model [name] /provider [name] /skills /queue /help' }

    default:
      return { handled: false }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/gateway/src/commands/
git commit -m "feat(gateway): slash command handler (/new /status /memory /model /provider /skills)"
```

---

## Task 10: WebSocket Gateway Server

**Files:**
- Create: `packages/gateway/src/server.ts`
- Create: `packages/gateway/src/index.ts`

- [ ] **Step 1: Write server.ts**

```typescript
import { WebSocketServer, WebSocket } from 'ws'
import { config } from './config.js'
import { logger } from './logger.js'
import { enqueue } from './agent/runner.js'
import { handleCommand } from './commands/handler.js'
import { sessions } from './sessions/manager.js'
import { memory } from './memory/manager.js'
import { providers } from './providers/index.js'
import type { ClientFrame, ServerFrame } from './protocol/types.js'

function send(ws: WebSocket, frame: ServerFrame) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(frame))
}

export function startServer() {
  const wss = new WebSocketServer({ port: config.gatewayPort })
  logger.info(`Gateway running on ws://localhost:${config.gatewayPort}`)

  wss.on('connection', (ws) => {
    logger.info('Client connected')

    ws.on('message', async (raw) => {
      let frame: ClientFrame
      try { frame = JSON.parse(raw.toString()) }
      catch { send(ws, { type: 'error', sessionId: '', message: 'Invalid JSON' }); return }

      switch (frame.type) {
        case 'message': {
          // Check for slash command first
          if (frame.text.startsWith('/')) {
            const result = await handleCommand(frame.sessionId, frame.text)
            if (result.handled) {
              send(ws, { type: 'command_response', sessionId: frame.sessionId, text: result.response ?? '' })
              return
            }
          }
          // Enqueue for agent
          enqueue({
            sessionId: frame.sessionId,
            message: frame.text,
            onChunk: (chunk) => {
              if (chunk.type === 'text')        send(ws, { type: 'chunk',       sessionId: frame.sessionId, text: chunk.text ?? '' })
              if (chunk.type === 'tool_use')    send(ws, { type: 'tool_use',    sessionId: frame.sessionId, tool: chunk.toolName ?? '', args: chunk.toolArgs })
              if (chunk.type === 'tool_result') send(ws, { type: 'tool_result', sessionId: frame.sessionId, tool: chunk.toolName ?? '', result: chunk.toolResult })
              if (chunk.type === 'thinking')    send(ws, { type: 'chunk',       sessionId: frame.sessionId, text: chunk.text ?? '' })
            },
            onDone:  () => send(ws, { type: 'done',  sessionId: frame.sessionId }),
            onError: (e) => send(ws, { type: 'error', sessionId: frame.sessionId, message: e.message }),
          })
          break
        }
        case 'command': {
          const result = await handleCommand(frame.sessionId, frame.command)
          send(ws, { type: 'command_response', sessionId: frame.sessionId, text: result.response ?? 'Unknown command' })
          break
        }
        case 'abort': {
          providers.current.abort()
          send(ws, { type: 'done', sessionId: frame.sessionId })
          break
        }
        case 'list_sessions': {
          send(ws, { type: 'sessions', sessions: sessions.loadMeta() })
          break
        }
        case 'get_memory': {
          const results = await memory.search(frame.query)
          send(ws, { type: 'memory_results', results })
          break
        }
      }
    })

    ws.on('close', () => logger.info('Client disconnected'))
    ws.on('error', (err) => logger.error({ err }, 'WS error'))

    // Send status on connect
    send(ws, { type: 'status', provider: providers.current.name, model: providers.current.currentModel, uptime: process.uptime() })
  })
}
```

- [ ] **Step 2: Write index.ts**

```typescript
import 'dotenv/config'
import { memory } from './memory/manager.js'
import { initComposio } from './tools/composio.js'
import './tools/browser.js'
import './tools/memory.js'
import './tools/search.js'
import './tools/cron.js'
import './tools/pdf.js'
import './tools/image.js'
import { startServer } from './server.js'
import { logger } from './logger.js'

async function main() {
  logger.info('Starting m-y-ai gateway...')
  await memory.init()
  await initComposio()
  startServer()
  logger.info('Gateway ready')
}

main().catch(err => { console.error(err); process.exit(1) })
```

- [ ] **Step 3: Test gateway starts**

```bash
cd packages/gateway
cp ../../.env.example .env  # fill in ANTHROPIC_API_KEY
bun src/index.ts
# Expected: "Gateway running on ws://localhost:4069"
```

- [ ] **Step 4: Smoke test with wscat**

```bash
npx wscat -c ws://localhost:4069
# Send: {"type":"list_sessions"}
# Expected: {"type":"sessions","sessions":[]}
# Send: {"type":"message","sessionId":"test-1","text":"Hello"}
# Expected: stream of {"type":"chunk",...} frames then {"type":"done",...}
```

- [ ] **Step 5: Commit**

```bash
git add packages/gateway/src/server.ts packages/gateway/src/index.ts
git commit -m "feat(gateway): WebSocket server with message routing, command handling, session listing"
```

---

## Task 11: Web App Scaffold (Next.js)

**Files:**
- Create: `packages/web/` (full Next.js project)

- [ ] **Step 1: Scaffold Next.js with bun**

```bash
cd packages
bunx create-next-app@latest web --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd web
bunx shadcn@latest init -y
```

- [ ] **Step 2: Install UI dependencies**

```bash
bun add framer-motion @vercel/analytics lucide-react zustand
bunx shadcn@latest add button input card badge separator scroll-area tooltip sheet dialog
```

- [ ] **Step 3: Set up dark theme + Geist font in layout.tsx**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

export const metadata: Metadata = { title: 'm-y-ai', description: 'Your personal AI assistant' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-background text-foreground antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Add gateway URL to env**

`packages/web/.env.local`:
```
NEXT_PUBLIC_GATEWAY_WS=ws://localhost:4069
```

- [ ] **Step 5: Commit**

```bash
git add packages/web/
git commit -m "feat(web): Next.js 16 scaffold with shadcn, dark theme, Geist font, Vercel Analytics"
```

---

## Task 12: Gateway WebSocket Client (Web)

**Files:**
- Create: `packages/web/lib/gateway-ws.ts`
- Create: `packages/web/lib/store.ts`
- Create: `packages/web/hooks/use-gateway.ts`

- [ ] **Step 1: Write lib/gateway-ws.ts**

```typescript
import type { ClientFrame, ServerFrame } from '../../gateway/src/protocol/types'

type FrameHandler = (frame: ServerFrame) => void

class GatewayWS {
  private ws: WebSocket | null = null
  private handlers = new Set<FrameHandler>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  connect(url: string) {
    this.ws = new WebSocket(url)
    this.ws.onmessage = (e) => {
      const frame: ServerFrame = JSON.parse(e.data)
      this.handlers.forEach(h => h(frame))
    }
    this.ws.onclose = () => {
      this.reconnectTimer = setTimeout(() => this.connect(url), 2000)
    }
    this.ws.onerror = console.error
  }

  send(frame: ClientFrame) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(frame))
  }

  on(handler: FrameHandler) { this.handlers.add(handler); return () => this.handlers.delete(handler) }
  get connected() { return this.ws?.readyState === WebSocket.OPEN }
}

export const gateway = new GatewayWS()
```

- [ ] **Step 2: Write lib/store.ts (Zustand)**

```typescript
import { create } from 'zustand'
import type { SessionMeta, MemoryResult } from '../../gateway/src/protocol/types'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  toolName?: string
  toolArgs?: unknown
  toolResult?: unknown
  streaming?: boolean
  timestamp: number
}

interface GatewayStore {
  sessionId: string
  messages: Message[]
  sessions: SessionMeta[]
  connected: boolean
  provider: string
  model: string
  // Actions
  setConnected: (v: boolean) => void
  setStatus: (provider: string, model: string) => void
  addMessage: (msg: Message) => void
  appendChunk: (id: string, text: string) => void
  finalizeMessage: (id: string) => void
  setSessions: (sessions: SessionMeta[]) => void
  clearMessages: () => void
  newSession: () => void
}

export const useStore = create<GatewayStore>((set) => ({
  sessionId: `session-${Date.now()}`,
  messages: [],
  sessions: [],
  connected: false,
  provider: 'claude',
  model: 'claude-sonnet-4-5',
  setConnected: (v) => set({ connected: v }),
  setStatus: (provider, model) => set({ provider, model }),
  addMessage: (msg) => set(s => ({ messages: [...s.messages, msg] })),
  appendChunk: (id, text) => set(s => ({
    messages: s.messages.map(m => m.id === id ? { ...m, content: m.content + text } : m),
  })),
  finalizeMessage: (id) => set(s => ({
    messages: s.messages.map(m => m.id === id ? { ...m, streaming: false } : m),
  })),
  setSessions: (sessions) => set({ sessions }),
  clearMessages: () => set({ messages: [] }),
  newSession: () => set({ sessionId: `session-${Date.now()}`, messages: [] }),
}))
```

- [ ] **Step 3: Write hooks/use-gateway.ts**

```typescript
'use client'
import { useEffect, useCallback } from 'react'
import { gateway } from '@/lib/gateway-ws'
import { useStore } from '@/lib/store'
import type { ServerFrame } from '../../../gateway/src/protocol/types'

export function useGateway() {
  const store = useStore()

  useEffect(() => {
    gateway.connect(process.env.NEXT_PUBLIC_GATEWAY_WS ?? 'ws://localhost:4069')

    const off = gateway.on((frame: ServerFrame) => {
      switch (frame.type) {
        case 'status':
          store.setConnected(true)
          store.setStatus(frame.provider, frame.model)
          break
        case 'chunk':
          // Find streaming message or create one
          const streaming = useStore.getState().messages.find(m => m.streaming && m.role === 'assistant')
          if (streaming) store.appendChunk(streaming.id, frame.text)
          else store.addMessage({ id: `msg-${Date.now()}`, role: 'assistant', content: frame.text, streaming: true, timestamp: Date.now() })
          break
        case 'done':
          const last = useStore.getState().messages.findLast(m => m.streaming)
          if (last) store.finalizeMessage(last.id)
          break
        case 'tool_use':
          store.addMessage({ id: `tool-${Date.now()}`, role: 'tool', content: '', toolName: frame.tool, toolArgs: frame.args, timestamp: Date.now() })
          break
        case 'tool_result':
          const toolMsg = useStore.getState().messages.findLast(m => m.role === 'tool' && m.toolName === frame.tool)
          if (toolMsg) store.appendChunk(toolMsg.id, JSON.stringify(frame.result))
          break
        case 'command_response':
          store.addMessage({ id: `cmd-${Date.now()}`, role: 'assistant', content: frame.text, timestamp: Date.now() })
          break
        case 'sessions':
          store.setSessions(frame.sessions)
          break
      }
    })
    return off
  }, [])

  const sendMessage = useCallback((text: string) => {
    const { sessionId } = useStore.getState()
    store.addMessage({ id: `user-${Date.now()}`, role: 'user', content: text, timestamp: Date.now() })
    gateway.send({ type: 'message', sessionId, text })
  }, [])

  return { sendMessage, ...store }
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/web/lib/ packages/web/hooks/
git commit -m "feat(web): gateway WS client, Zustand store, useGateway hook"
```

---

## Task 13: Chat UI Components

**Files:**
- Create: `packages/web/components/chat/chat-panel.tsx`
- Create: `packages/web/components/chat/message-list.tsx`
- Create: `packages/web/components/chat/message-item.tsx`
- Create: `packages/web/components/chat/tool-call-card.tsx`
- Create: `packages/web/components/chat/input-bar.tsx`
- Create: `packages/web/components/chat/session-sidebar.tsx`

- [ ] **Step 1: Write message-item.tsx**

Renders a single message bubble. User messages: right-aligned glass card. Assistant messages: left-aligned with markdown rendering (`react-markdown` + `react-syntax-highlighter`). Streaming: show a blinking cursor. Tool messages: render `ToolCallCard`.

```bash
bun add react-markdown react-syntax-highlighter
bun add -D @types/react-syntax-highlighter
```

Apply glassmorphism styling:
```tsx
// User message:
className="ml-auto max-w-[80%] rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 text-sm"
// Assistant message:
className="mr-auto max-w-[80%] rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 px-4 py-3 text-sm"
```

- [ ] **Step 2: Write tool-call-card.tsx**

Shows tool invocation with collapsible args/result. Use `<details>` or shadcn `Collapsible`. Badge with tool name (lucide `Wrench` icon). Args in `<pre>` with `font-mono`. Result inline or truncated.

- [ ] **Step 3: Write message-list.tsx**

```tsx
'use client'
import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageItem } from './message-item'
import type { Message } from '@/lib/store'

export function MessageList({ messages }: { messages: Message[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  return (
    <div className="flex flex-col gap-4 py-4 px-4 overflow-y-auto h-full">
      <AnimatePresence initial={false}>
        {messages.map(msg => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <MessageItem message={msg} />
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  )
}
```

- [ ] **Step 4: Write input-bar.tsx**

Full-width input at bottom. Textarea (auto-resize). Send button (lucide `SendHorizontal`). Attach button (lucide `Paperclip`) — placeholder for file upload. Enter to send, Shift+Enter for newline. Disable during streaming.

- [ ] **Step 5: Write session-sidebar.tsx**

Left panel listing sessions (fetched from gateway on mount via `gateway.send({ type: 'list_sessions' })`). Each row: session ID truncated, message count, last active timestamp. "New session" button at top (lucide `SquarePen`). Active session highlighted.

- [ ] **Step 6: Write chat-panel.tsx (orchestrator)**

```tsx
'use client'
import { useGateway } from '@/hooks/use-gateway'
import { MessageList } from './message-list'
import { InputBar } from './input-bar'
import { SessionSidebar } from './session-sidebar'

export function ChatPanel() {
  const { messages, sendMessage, connected, provider, model, sessions, newSession } = useGateway()
  return (
    <div className="flex h-screen bg-black/90">
      <SessionSidebar sessions={sessions} onNew={newSession} />
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 backdrop-blur-md">
          <span className="text-sm font-mono text-white/40">{provider} / {model}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {connected ? 'connected' : 'reconnecting…'}
          </span>
        </header>
        <div className="flex-1 overflow-hidden"><MessageList messages={messages} /></div>
        <InputBar onSend={sendMessage} disabled={!connected} />
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Wire to chat/page.tsx**

```tsx
import { ChatPanel } from '@/components/chat/chat-panel'
export default function ChatPage() { return <ChatPanel /> }
```

- [ ] **Step 8: Test in browser**

```bash
cd packages/web && bun dev
# Open http://localhost:3000/chat
# Send "Hello" — should see streaming response from Claude
```

- [ ] **Step 9: Commit**

```bash
git add packages/web/components/chat/ packages/web/app/chat/
git commit -m "feat(web): chat UI with glassmorphism, streaming messages, tool call cards, session sidebar"
```

---

## Task 14: Dashboard Pages

**Files:**
- Create: `packages/web/app/dashboard/page.tsx`
- Create: `packages/web/app/dashboard/memory/page.tsx`
- Create: `packages/web/app/dashboard/settings/page.tsx`
- Create: `packages/web/app/dashboard/skills/page.tsx`

- [ ] **Step 1: Write dashboard layout + overview page**

Dashboard layout: left nav (lucide icons: `MessageSquare`, `Brain`, `Zap`, `Settings`), main content area. Overview shows: stat cards (total sessions, memory entries, active skills, current provider/model), recent sessions list.

- [ ] **Step 2: Write memory/page.tsx**

Search bar → calls `gateway.send({ type: 'get_memory', query })` → renders `memory_results` frame. Result list: text excerpt, session ID, timestamp. Empty state with brain icon.

- [ ] **Step 3: Write settings/page.tsx**

Form fields: Default Provider (select), Default Model (text), API keys (masked inputs). Save writes to a settings endpoint (add `/api/settings/route.ts` that writes to gateway via WS or a REST sidecar). Sections: Providers, Tools (enable/disable browser, Composio, Tavily), Gateway.

- [ ] **Step 4: Write skills/page.tsx**

Toggle list of skills. Each row: skill name, description, enabled toggle (`Switch` from shadcn). Calls `gateway.send({ type: 'command', command: '/skills' })` to fetch, parses response.

- [ ] **Step 5: Commit**

```bash
git add packages/web/app/dashboard/
git commit -m "feat(web): dashboard with memory browser, settings, skills manager"
```

---

## Task 15: Mobile App (Expo)

**Files:**
- Create: `packages/mobile/` (full Expo project)

- [ ] **Step 1: Scaffold Expo app**

```bash
cd packages
bunx create-expo-app@latest mobile --template blank-typescript
cd mobile
bun add zustand nativewind@^4 react-native-safe-area-context react-native-screens
```

- [ ] **Step 2: Configure NativeWind**

Follow NativeWind v4 setup for Expo (babel.config.js + tailwind.config.js). Default theme: dark (`backgroundColor: '#0a0a0a'`).

- [ ] **Step 3: Copy gateway-ws.ts from web (adapted for RN)**

React Native's `WebSocket` is global — same API as browser. The `gateway-ws.ts` file works as-is. Copy it and update imports. Copy `store.ts` unchanged (Zustand works in RN).

- [ ] **Step 4: Write components/MessageBubble.tsx**

Similar glassmorphism: `expo-blur` `BlurView` for glass effect. User: right-aligned. Assistant: left-aligned with markdown (use `react-native-markdown-display`).

```bash
bun add expo-blur react-native-markdown-display
```

- [ ] **Step 5: Write components/InputBar.tsx**

`TextInput` (multiline, dark), Send button. Keyboard avoiding with `KeyboardAvoidingView`.

- [ ] **Step 6: Write app/index.tsx (Chat screen)**

FlatList for messages (inverted). InputBar at bottom. Status bar showing provider/model. Connect to gateway WS on mount (`process.env.EXPO_PUBLIC_GATEWAY_WS`).

`packages/mobile/.env`:
```
EXPO_PUBLIC_GATEWAY_WS=ws://192.168.x.x:4069   # local network IP of your Mac
```

- [ ] **Step 7: Write app/settings.tsx**

Simple settings screen: Gateway URL input, provider/model display.

- [ ] **Step 8: Test on iOS Simulator**

```bash
bun run ios
# Type a message, verify streaming response appears
```

- [ ] **Step 9: Commit**

```bash
git add packages/mobile/
git commit -m "feat(mobile): Expo React Native chat app with WebSocket gateway connection"
```

---

## Task 16: README + AGENTS.md + PRD.md + SYSTEM-DESIGN.md

**Files:**
- Modify: `README.md`
- Create: `PRD.md`
- Create: `SYSTEM-DESIGN.md`
- Create: `AGENTS.md`

- [ ] **Step 1: Write README.md**

Quick start (clone → `.env` → `bun install` → `bun gateway` → `bun web`). Prerequisites (Node 22+, bun, Anthropic API key). Architecture one-liner. Links to PRD + SYSTEM-DESIGN.

- [ ] **Step 2: Write PRD.md**

Product goals, target user (personal use), success criteria, feature list (providers, tools, channels, memory, skills, dashboard, mobile), non-goals (no multi-user, no SaaS, no messaging platform integrations).

- [ ] **Step 3: Write SYSTEM-DESIGN.md**

HLD (gateway ↔ web ↔ mobile), LLD (each module's responsibility), REST/WS API routes (all ClientFrame + ServerFrame types), DB schema (LanceDB memory, JSONL sessions, cron JSON), package deps per package, frontend/backend/storage layout.

- [ ] **Step 4: Write AGENTS.md**

Rules for AI agents working in this repo: monorepo layout, which files to touch for which tasks, bun commands (`bun gateway`, `bun web`, `bun mobile`), import rules (protocol types shared between gateway and web), do not commit `.env`, test commands.

- [ ] **Step 5: Commit**

```bash
git add README.md PRD.md SYSTEM-DESIGN.md AGENTS.md
git commit -m "docs: README, PRD, SYSTEM-DESIGN, AGENTS"
```

---

## Task 17: End-to-End Integration Test

- [ ] **Step 1: Start gateway**

```bash
bun gateway
# Expected: "Gateway ready" on ws://localhost:4069
```

- [ ] **Step 2: Start web app**

```bash
bun web
# Expected: Next.js on http://localhost:3000
```

- [ ] **Step 3: Verify chat works end-to-end**

1. Open `http://localhost:3000/chat`
2. Header shows `connected` badge in green
3. Send: `"What's 2 + 2?"` → streaming response appears
4. Send: `"/status"` → shows provider/model/queue
5. Send: `"Remember: my favorite color is blue"` → agent calls `memory_write` tool, tool card appears
6. Send: `"What's my favorite color?"` → agent calls `memory_search`, returns blue
7. Send: `"/new"` → session clears
8. Send: `"Search the web for current AI news"` → calls `web_search` tool (if Tavily key set)
9. Send: `"Schedule a reminder in 10 seconds: check the test"` → calls `schedule_delayed`, message arrives after 10s via `cron_fired` frame

- [ ] **Step 4: Verify mobile works**

1. `bun ios` (or `bun android`)
2. Send a message, verify streaming response
3. Disconnect gateway, verify reconnect after 2s

- [ ] **Step 5: Commit final state**

```bash
git add -A
git commit -m "chore: end-to-end verified — gateway + web + mobile working"
```

---

## Build Order Summary

```
Task 1  → Monorepo scaffold + protocol types
Task 2  → Config + logger
Task 3  → Session manager (JSONL)
Task 4  → Memory manager (LanceDB)
Task 5  → Provider system (Claude, OpenAI, Gemini, Ollama)
Task 6  → Tool system (browser, memory, search, cron, PDF, image, Composio)
Task 7  → Skills manager
Task 8  → Agent executor + FIFO runner
Task 9  → Slash commands
Task 10 → WebSocket gateway server  ← gateway is complete here, testable with wscat
Task 11 → Web app scaffold (Next.js + shadcn)
Task 12 → Gateway WS client + Zustand store + useGateway hook
Task 13 → Chat UI components  ← web chat works end-to-end here
Task 14 → Dashboard pages (memory, settings, skills)
Task 15 → Mobile app (Expo)
Task 16 → Docs (README, PRD, SYSTEM-DESIGN, AGENTS)
Task 17 → E2E integration test
```

Each task produces a working, committable increment. The gateway is fully testable (wscat) at Task 10 before the web UI exists. The web chat is fully functional at Task 13.
