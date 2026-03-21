'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createThread, deleteThread, type Thread, type Agent } from '@/lib/api'

interface ThreadSidebarProps {
  agent: Agent | null
  threads: Thread[]
  selectedThreadId: string | null
  onThreadsChange: (threads: Thread[]) => void
}

function formatDate(ms: number): string {
  const d = new Date(ms)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)

  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function ThreadSidebar({
  agent,
  threads,
  selectedThreadId,
  onThreadsChange
}: ThreadSidebarProps) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleNewThread() {
    if (!agent || creating) return
    setCreating(true)
    try {
      const thread = await createThread(agent.id)
      onThreadsChange([thread, ...threads])
      router.push(`/chat/${thread.id}`)
    } catch (err) {
      console.error('Failed to create thread:', err)
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteThread(e: React.MouseEvent, threadId: string) {
    e.preventDefault()
    e.stopPropagation()
    setDeletingId(threadId)
    try {
      await deleteThread(threadId)
      const updated = threads.filter(t => t.id !== threadId)
      onThreadsChange(updated)
      if (selectedThreadId === threadId) {
        router.push('/chat')
      }
    } catch (err) {
      console.error('Failed to delete thread:', err)
    } finally {
      setDeletingId(null)
    }
  }

  if (!agent) {
    return (
      <div className="flex h-full w-64 flex-col border-r border-zinc-800/60 bg-zinc-900/50 p-4">
        <p className="text-sm text-zinc-500">Select an agent to start</p>
      </div>
    )
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-zinc-800/60 bg-zinc-900/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/60 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">{agent.name}</h2>
          {agent.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">{agent.description}</p>
          )}
        </div>
        <button
          onClick={handleNewThread}
          disabled={creating}
          title="New thread"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto py-2">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <MessageSquare className="h-8 w-8 text-zinc-700" />
            <p className="text-xs text-zinc-500">No threads yet</p>
            <button
              onClick={handleNewThread}
              disabled={creating}
              className="text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-200"
            >
              Start one
            </button>
          </div>
        ) : (
          threads.map(thread => {
            const isSelected = thread.id === selectedThreadId
            return (
              <button
                key={thread.id}
                onClick={() => router.push(`/chat/${thread.id}`)}
                className={cn(
                  'group flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors',
                  isSelected
                    ? 'bg-zinc-800/80 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                )}
              >
                <MessageSquare className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', isSelected ? 'text-zinc-300' : 'text-zinc-600')} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-medium">{thread.title}</span>
                    <span className="shrink-0 text-[10px] text-zinc-600">
                      {formatDate(thread.updatedAt)}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-600">
                    {thread.messageCount} {thread.messageCount === 1 ? 'message' : 'messages'}
                  </span>
                </div>
                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteThread(e, thread.id)}
                  disabled={deletingId === thread.id}
                  className="invisible shrink-0 rounded p-0.5 text-zinc-600 transition-colors hover:text-red-400 group-hover:visible disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
