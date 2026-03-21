'use client'

import { cn } from '@/lib/utils'
import type { Agent } from '@/lib/api'

interface AgentSidebarProps {
  agents: Agent[]
  selectedAgentId: string | null
  onSelectAgent: (agentId: string) => void
}

function AgentAvatar({ name, active }: { name: string; active: boolean }) {
  const initials = name
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={cn(
        'relative flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200',
        active
          ? 'bg-white text-zinc-900 shadow-lg shadow-white/10 ring-1 ring-white/20'
          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
      )}
    >
      {initials}
      {active && (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
      )}
    </div>
  )
}

export default function AgentSidebar({ agents, selectedAgentId, onSelectAgent }: AgentSidebarProps) {
  return (
    <div className="flex h-full w-16 flex-col items-center gap-2 border-r border-zinc-800/60 bg-zinc-950 py-4">
      {/* Logo mark */}
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-zinc-700/50">
        <span className="font-mono text-xs font-bold text-zinc-300">MY</span>
      </div>

      <div className="h-px w-8 bg-zinc-800" />

      {/* Agent list */}
      <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto py-2">
        {agents.map(agent => (
          <button
            key={agent.id}
            title={agent.name}
            onClick={() => onSelectAgent(agent.id)}
            className="group relative"
          >
            <AgentAvatar name={agent.name} active={selectedAgentId === agent.id} />
            {/* Tooltip */}
            <div className="pointer-events-none absolute left-12 top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 opacity-0 shadow-xl ring-1 ring-zinc-700/50 transition-opacity group-hover:opacity-100">
              {agent.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
