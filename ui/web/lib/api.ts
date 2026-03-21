const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:2700'

export type Agent = {
  id: string
  name: string
  description: string
}

export type Thread = {
  id: string
  agentId: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount: number
}

export type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  hasImage?: boolean
}

export type SSEChunk =
  | { type: 'chunk'; content: string }
  | { type: 'tool'; name: string }
  | { type: 'done'; fullText: string }
  | { type: 'error'; error: string }

// ─── Agents ──────────────────────────────────────────────────────────────────

export async function fetchAgents(): Promise<Agent[]> {
  const res = await fetch(`${BACKEND}/api/agents`)
  if (!res.ok) throw new Error('Failed to fetch agents')
  return res.json()
}

// ─── Threads ─────────────────────────────────────────────────────────────────

export async function fetchThreads(agentId?: string): Promise<Thread[]> {
  const url = agentId
    ? `${BACKEND}/api/threads?agentId=${encodeURIComponent(agentId)}`
    : `${BACKEND}/api/threads`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch threads')
  return res.json()
}

export async function createThread(agentId: string, title?: string): Promise<Thread> {
  const res = await fetch(`${BACKEND}/api/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, title })
  })
  if (!res.ok) throw new Error('Failed to create thread')
  return res.json()
}

export async function deleteThread(threadId: string): Promise<void> {
  await fetch(`${BACKEND}/api/threads/${threadId}`, { method: 'DELETE' })
}

export async function renameThread(threadId: string, title: string): Promise<Thread> {
  const res = await fetch(`${BACKEND}/api/threads/${threadId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  })
  if (!res.ok) throw new Error('Failed to rename thread')
  return res.json()
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function fetchMessages(threadId: string): Promise<Message[]> {
  const res = await fetch(`${BACKEND}/api/threads/${threadId}/messages`)
  if (!res.ok) throw new Error('Failed to fetch messages')
  return res.json()
}

/**
 * Send a message to a thread and stream the SSE response.
 * Calls onChunk for each text delta, onDone when complete, onError on failure.
 */
export async function sendMessage(
  threadId: string,
  text: string,
  {
    onChunk,
    onTool,
    onDone,
    onError
  }: {
    onChunk: (content: string) => void
    onTool?: (name: string) => void
    onDone: (fullText: string) => void
    onError: (error: string) => void
  }
): Promise<void> {
  const res = await fetch(`${BACKEND}/api/threads/${threadId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })

  if (!res.ok || !res.body) {
    onError(`HTTP ${res.status}`)
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Process complete SSE lines (separated by \n\n)
      const parts = buffer.split('\n\n')
      buffer = parts.pop() ?? ''

      for (const part of parts) {
        for (const line of part.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const data: SSEChunk = JSON.parse(line.slice(6))
            if (data.type === 'chunk') onChunk(data.content)
            else if (data.type === 'tool') onTool?.(data.name)
            else if (data.type === 'done') onDone(data.fullText)
            else if (data.type === 'error') onError(data.error)
          } catch { /* malformed SSE line */ }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
