import { Sparkles, Briefcase, Users } from 'lucide-react'
import type { ChatMessage } from '../lib/chat'

function QuestIcon({ questLine }: { questLine: string | null }) {
  switch (questLine) {
    case 'builder':
      return <Sparkles size={10} className="text-cyan-pulse" />
    case 'operator':
      return <Briefcase size={10} className="text-boss-magenta" />
    case 'explorer':
      return <Users size={10} className="text-xp-green" />
    default:
      return null
  }
}

function fmtTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function ChatBubble({
  message,
  isOwn,
}: {
  message: ChatMessage
  isOwn: boolean
}) {
  // System messages
  if (message.message_type === 'system') {
    return (
      <div className="flex justify-center py-1.5">
        <span className="rounded-full bg-white/5 px-3 py-1 font-mono text-[11px] text-fog-gray">
          {message.content}
        </span>
      </div>
    )
  }

  const nerdNum = message.sender?.nerd_number
    ? `#${String(message.sender.nerd_number).padStart(4, '0')}`
    : null

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender info (not for own messages) */}
        {!isOwn && message.sender && (
          <div className="mb-0.5 flex items-center gap-1.5 px-1">
            <QuestIcon questLine={message.sender.quest_line} />
            <span className="font-mono text-[11px] font-medium text-fog-gray">
              {message.sender.display_name}
            </span>
            {nerdNum && (
              <span className="font-mono text-[10px] text-loot-gold/60">
                {nerdNum}
              </span>
            )}
          </div>
        )}

        {/* Bubble */}
        <div
          className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
            isOwn
              ? 'rounded-br-md bg-nerdcon-blue text-white'
              : 'rounded-bl-md bg-white/[0.07] text-terminal-white'
          }`}
        >
          {message.content}
        </div>

        {/* Timestamp */}
        <div className={`mt-0.5 px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
          <span className="font-mono text-[10px] text-fog-gray/50">
            {fmtTime(message.created_at)}
          </span>
        </div>
      </div>
    </div>
  )
}
