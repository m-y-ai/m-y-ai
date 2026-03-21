import { MessageSquarePlus } from 'lucide-react'

export default function ChatPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-zinc-950 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/80 ring-1 ring-zinc-700/50">
        <MessageSquarePlus className="h-7 w-7 text-zinc-400" />
      </div>
      <div>
        <h1 className="text-base font-semibold text-zinc-200">Select an agent &amp; start a thread</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Choose an agent from the left, then click <span className="text-zinc-400">+</span> to begin
        </p>
      </div>
    </div>
  )
}
