import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SESSIONS_DIR = path.join(__dirname, '..', 'storage', 'Sessions')
const THREADS_FILE = path.join(SESSIONS_DIR, 'threads.json')
const WORKSPACES_DIR = path.join(__dirname, '..', 'storage', 'Workspaces')

/**
 * ThreadManager — persists thread metadata and manages per-thread workspaces.
 *
 * Thread:
 *   id        — UUID
 *   agentId   — which agent type handles this thread
 *   title     — display name (auto or user-set)
 *   createdAt — ms timestamp
 *   updatedAt — ms timestamp
 *   messageCount
 *
 * Each thread gets an isolated workspace at:
 *   storage/Workspaces/{agentId}/{threadId}/
 *
 * Session key for AgentRunner/SessionManager:
 *   thread:{threadId}
 */
export default class ThreadManager {
  constructor() {
    this.threads = new Map()
    this._ensureDirs()
    this._loadThreads()
  }

  _ensureDirs() {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true })
    fs.mkdirSync(WORKSPACES_DIR, { recursive: true })
  }

  _loadThreads() {
    if (!fs.existsSync(THREADS_FILE)) return
    try {
      const data = JSON.parse(fs.readFileSync(THREADS_FILE, 'utf-8'))
      for (const t of data) {
        this.threads.set(t.id, t)
      }
    } catch (err) {
      console.error('[ThreadManager] Failed to load threads:', err.message)
    }
  }

  _saveThreads() {
    try {
      const data = JSON.stringify([...this.threads.values()], null, 2)
      fs.writeFileSync(THREADS_FILE, data, 'utf-8')
    } catch (err) {
      console.error('[ThreadManager] Failed to save threads:', err.message)
    }
  }

  /**
   * Create a new thread for the given agent
   */
  createThread(agentId, title = '') {
    const id = randomUUID()
    const now = Date.now()
    const thread = {
      id,
      agentId,
      title: title || `New Thread`,
      createdAt: now,
      updatedAt: now,
      messageCount: 0
    }
    this.threads.set(id, thread)
    this._saveThreads()
    this._ensureWorkspace(agentId, id)
    return thread
  }

  /**
   * Get a thread by ID
   */
  getThread(id) {
    return this.threads.get(id) || null
  }

  /**
   * List all threads, optionally filtered by agentId
   * Returns newest first
   */
  listThreads(agentId = null) {
    const all = [...this.threads.values()]
    const filtered = agentId ? all.filter(t => t.agentId === agentId) : all
    return filtered.sort((a, b) => b.updatedAt - a.updatedAt)
  }

  /**
   * Update thread metadata
   */
  updateThread(id, updates) {
    const thread = this.threads.get(id)
    if (!thread) return null
    Object.assign(thread, updates, { updatedAt: Date.now() })
    this._saveThreads()
    return thread
  }

  /**
   * Delete a thread
   */
  deleteThread(id) {
    const deleted = this.threads.has(id)
    if (deleted) {
      this.threads.delete(id)
      this._saveThreads()
    }
    return deleted
  }

  /**
   * Increment message count and update timestamp
   */
  incrementMessageCount(id) {
    const thread = this.threads.get(id)
    if (!thread) return
    thread.messageCount = (thread.messageCount || 0) + 1
    thread.updatedAt = Date.now()
    this._saveThreads()
  }

  /**
   * Session key used by AgentRunner and SessionManager
   */
  getSessionKey(threadId) {
    return `thread:${threadId}`
  }

  /**
   * Workspace path for a thread (exposed to agent via system prompt)
   */
  getWorkspacePath(agentId, threadId) {
    return path.join(WORKSPACES_DIR, agentId, threadId)
  }

  /**
   * Workspace path as tilde-prefixed string for system prompt
   * Resolves to storage/Workspaces/{agentId}/{threadId}/ relative to backend
   */
  getWorkspaceDisplayPath(agentId, threadId) {
    // Use absolute path so agent tools can access it
    return this.getWorkspacePath(agentId, threadId)
  }

  _ensureWorkspace(agentId, threadId) {
    const dir = this.getWorkspacePath(agentId, threadId)
    fs.mkdirSync(dir, { recursive: true })
  }
}
