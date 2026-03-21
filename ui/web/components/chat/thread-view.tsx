'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import MessageBubble, { StreamingBubble } from './message-bubble'
import MessageInput from './message-input'
import { fetchMessages, sendMessage, type Message } from '@/lib/api'

interface ThreadViewProps {
  threadId: string
}

export default function ThreadView({ threadId }: ThreadViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [streamTool, setStreamTool] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load messages when thread changes
  useEffect(() => {
    setLoading(true)
    setMessages([])
    setStreamContent('')
    setStreamTool(undefined)
    setError(null)

    fetchMessages(threadId)
      .then(setMessages)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [threadId])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamContent])

  const handleSubmit = useCallback(async () => {
    const text = input.trim()
    if (!text || streaming) return

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)
    setStreamContent('')
    setStreamTool(undefined)
    setError(null)

    try {
      await sendMessage(threadId, text, {
        onChunk: (content) => {
          setStreamContent(prev => prev + content)
        },
        onTool: (name) => {
          setStreamTool(name)
        },
        onDone: (fullText) => {
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: fullText, timestamp: Date.now() }
          ])
          setStreamContent('')
          setStreamTool(undefined)
          setStreaming(false)
        },
        onError: (err) => {
          setError(err)
          setStreamContent('')
          setStreamTool(undefined)
          setStreaming(false)
        }
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      setStreaming(false)
      setStreamContent('')
    }
  }, [threadId, input, streaming])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-600 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-600 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {messages.length === 0 && !streaming && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 ring-1 ring-zinc-700/50">
                <span className="font-mono text-sm font-bold text-zinc-300">AI</span>
              </div>
              <p className="text-sm text-zinc-400">Send a message to start the conversation</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={`${msg.timestamp}-${i}`} message={msg} />
          ))}

          {streaming && (
            <StreamingBubble content={streamContent} toolName={streamTool} />
          )}

          {error && (
            <div className="rounded-xl bg-red-950/40 px-4 py-3 text-sm text-red-400 ring-1 ring-red-900/50">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800/60 px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <MessageInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            streaming={streaming}
            disabled={loading}
          />
          <p className="mt-2 text-center text-[11px] text-zinc-600">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
