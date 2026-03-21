'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import AgentSidebar from '@/components/chat/agent-sidebar'
import ThreadSidebar from '@/components/chat/thread-sidebar'
import { fetchAgents, fetchThreads, type Agent, type Thread } from '@/lib/api'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const [agents, setAgents] = useState<Agent[]>([])
  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Extract current threadId from pathname /chat/[threadId]
  const currentThreadId = pathname.startsWith('/chat/')
    ? pathname.slice('/chat/'.length)
    : null

  // Load agents on mount
  useEffect(() => {
    fetchAgents()
      .then(data => {
        setAgents(data)
        if (data.length > 0) setSelectedAgentId(data[0].id)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Load threads when selected agent changes
  useEffect(() => {
    if (!selectedAgentId) return
    fetchThreads(selectedAgentId)
      .then(setThreads)
      .catch(console.error)
  }, [selectedAgentId])

  // When navigating to a thread, auto-select its agent
  useEffect(() => {
    if (!currentThreadId) return
    const thread = threads.find(t => t.id === currentThreadId)
    if (thread && thread.agentId !== selectedAgentId) {
      setSelectedAgentId(thread.agentId)
    }
  }, [currentThreadId, threads, selectedAgentId])

  const handleSelectAgent = useCallback((agentId: string) => {
    setSelectedAgentId(agentId)
  }, [])

  const handleThreadsChange = useCallback((updated: Thread[]) => {
    setThreads(updated)
  }, [])

  const selectedAgent = agents.find(a => a.id === selectedAgentId) ?? null

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      {/* Agent sidebar — 64px icon rail */}
      <AgentSidebar
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelectAgent={handleSelectAgent}
      />

      {/* Thread sidebar — 256px thread list */}
      <ThreadSidebar
        agent={selectedAgent}
        threads={threads}
        selectedThreadId={currentThreadId}
        onThreadsChange={handleThreadsChange}
      />

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
