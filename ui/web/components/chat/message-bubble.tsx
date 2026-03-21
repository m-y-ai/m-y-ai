'use client'

import { cn } from '@/lib/utils'
import type { Message } from '@/lib/api'

interface MessageBubbleProps {
  message: Message
  streaming?: boolean
}

/**
 * Render message content with basic code block detection.
 * Handles triple-backtick code blocks and preserves whitespace elsewhere.
 */
function MessageContent({ content, streaming }: { content: string; streaming?: boolean }) {
  // Split on code fences: ```lang?\ncode\n```
  const parts = content.split(/(```(?:\w+)?\n?[\s\S]*?```)/g)

  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          // Extract optional language and code body
          const match = part.match(/^```(\w+)?\n?([\s\S]*?)```$/)
          const lang = match?.[1] ?? ''
          const code = match?.[2] ?? part.slice(3, -3)
          return (
            <div key={i} className="overflow-hidden rounded-lg bg-zinc-950 ring-1 ring-zinc-800">
              {lang && (
                <div className="border-b border-zinc-800 px-3 py-1">
                  <span className="font-mono text-[10px] text-zinc-500">{lang}</span>
                </div>
              )}
              <pre className="overflow-x-auto p-3 text-[13px] leading-relaxed text-zinc-200">
                <code>{code.trimEnd()}</code>
              </pre>
            </div>
          )
        }

        // Inline text — render with whitespace preserved and bold/inline-code support
        const segments = part.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
        return (
          <p key={i} className="whitespace-pre-wrap leading-relaxed">
            {segments.map((seg, j) => {
              if (seg.startsWith('`') && seg.endsWith('`')) {
                return (
                  <code key={j} className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-[13px] text-zinc-200">
                    {seg.slice(1, -1)}
                  </code>
                )
              }
              if (seg.startsWith('**') && seg.endsWith('**')) {
                return <strong key={j} className="font-semibold text-zinc-100">{seg.slice(2, -2)}</strong>
              }
              return seg
            })}
          </p>
        )
      })}
      {streaming && (
        <span className="inline-block h-4 w-0.5 animate-pulse bg-zinc-400 align-text-bottom" />
      )}
    </div>
  )
}

function ToolIndicator({ content }: { content: string }) {
  // Surface tool-use hints embedded in the content as [tool:name] markers
  // (the thread view adds these during streaming)
  if (!content.startsWith('[tool:')) return null
  const name = content.slice(6, -1)
  return (
    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
      <span className="font-mono">{name}</span>
    </div>
  )
}

export default function MessageBubble({ message, streaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex w-full gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {/* Assistant avatar */}
      {!isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 ring-1 ring-zinc-700/50">
          <span className="font-mono text-[10px] font-bold text-zinc-300">AI</span>
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
          isUser
            ? 'rounded-tr-sm bg-zinc-100 text-zinc-900 dark:bg-zinc-200 dark:text-zinc-900'
            : 'rounded-tl-sm bg-zinc-800/60 text-zinc-200 ring-1 ring-zinc-700/30'
        )}
      >
        <MessageContent content={message.content} streaming={streaming} />
      </div>
    </div>
  )
}

/**
 * Streaming placeholder bubble — shown while agent is generating
 */
export function StreamingBubble({ content, toolName }: { content: string; toolName?: string }) {
  return (
    <div className="flex w-full gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 ring-1 ring-zinc-700/50">
        <span className="font-mono text-[10px] font-bold text-zinc-300">AI</span>
      </div>
      <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-zinc-800/60 px-4 py-3 text-sm text-zinc-200 ring-1 ring-zinc-700/30">
        {toolName && (
          <div className="mb-2 flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            <span className="font-mono">{toolName}</span>
          </div>
        )}
        {content ? (
          <MessageContent content={content} streaming />
        ) : (
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" />
          </div>
        )}
      </div>
    </div>
  )
}
