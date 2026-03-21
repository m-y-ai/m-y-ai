'use client'

import { useRef, useEffect, KeyboardEvent } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  streaming?: boolean
  placeholder?: string
}

export default function MessageInput({
  value,
  onChange,
  onSubmit,
  disabled,
  streaming,
  placeholder = 'Message…'
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [value])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && !streaming && value.trim()) {
        onSubmit()
      }
    }
  }

  const canSend = !disabled && !streaming && value.trim().length > 0

  return (
    <div className="relative flex items-end gap-2 rounded-2xl bg-zinc-800/80 px-4 py-3 ring-1 ring-zinc-700/50 focus-within:ring-zinc-600/80 transition-all">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        className={cn(
          'flex-1 resize-none bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500',
          'max-h-[200px] overflow-y-auto leading-relaxed',
          'disabled:opacity-50'
        )}
      />

      <button
        onClick={onSubmit}
        disabled={!canSend}
        title={streaming ? 'Stop' : 'Send (Enter)'}
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all',
          streaming
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            : canSend
              ? 'bg-zinc-200 text-zinc-900 hover:bg-white'
              : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
        )}
      >
        {streaming ? (
          <Square className="h-3.5 w-3.5 fill-current" />
        ) : (
          <ArrowUp className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  )
}
