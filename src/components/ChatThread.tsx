import { useEffect, useRef } from 'react'
import { ChatBubble } from './ChatBubble'
import type { ChatMessage } from '../lib/chat'

export function ChatThread({
  messages,
  currentUserId,
  hasMore,
  loading,
  onLoadMore,
}: {
  messages: ChatMessage[]
  currentUserId: string | null
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(messages.length)
  const isNearBottom = useRef(true)

  // Track if user is near bottom
  function handleScroll() {
    const el = containerRef.current
    if (!el) return
    const threshold = 80
    isNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
  }

  // Auto-scroll on new messages (only if near bottom)
  useEffect(() => {
    if (messages.length > prevLengthRef.current && isNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevLengthRef.current = messages.length
  }, [messages.length])

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    }
  }, [loading])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="animate-pulse font-mono text-xs text-fog-gray">
          Loading messages...
        </span>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="text-center">
          <p className="font-mono text-sm text-fog-gray">
            No messages yet
          </p>
          <p className="mt-1 text-xs text-fog-gray/60">
            Say something to your party!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-1 py-3"
      onScroll={handleScroll}
    >
      {/* Load more button */}
      {hasMore && (
        <div className="mb-3 flex justify-center">
          <button
            onClick={onLoadMore}
            className="rounded-full bg-white/5 px-4 py-1.5 font-mono text-[11px] text-fog-gray transition-colors hover:bg-white/10"
          >
            Load older messages
          </button>
        </div>
      )}

      <div className="space-y-2">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender_id === currentUserId}
          />
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  )
}
