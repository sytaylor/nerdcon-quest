import { useState, useRef, useCallback } from 'react'
import { Send } from 'lucide-react'

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (content: string) => Promise<{ error: string | null }>
  disabled?: boolean
}) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return

    setError(null)
    const result = await onSend(trimmed)

    if (result.error) {
      setError(result.error)
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000)
    } else {
      setText('')
      inputRef.current?.focus()
    }
  }, [text, disabled, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const remaining = 500 - text.length
  const showCount = text.length > 400

  return (
    <div className="border-t border-white/5 bg-panel-dark px-3 py-2.5">
      {error && (
        <p className="mb-1.5 font-mono text-[11px] text-boss-magenta">
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 500))}
          onKeyDown={handleKeyDown}
          placeholder="Message your party..."
          maxLength={500}
          disabled={disabled}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-void-black px-3.5 py-2.5 text-sm text-terminal-white placeholder-fog-gray/40 outline-none transition-colors focus:border-nerdcon-blue/50 disabled:opacity-40"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-nerdcon-blue text-white transition-all hover:bg-nerdcon-blue/80 disabled:bg-white/5 disabled:text-fog-gray/30"
        >
          <Send size={16} />
        </button>
      </div>
      {showCount && (
        <p className={`mt-1 text-right font-mono text-[10px] ${remaining < 50 ? 'text-boss-magenta' : 'text-fog-gray/40'}`}>
          {remaining}
        </p>
      )}
    </div>
  )
}
