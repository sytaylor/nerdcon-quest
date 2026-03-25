import { useState } from 'react'
import { Sparkles, Briefcase, Users, Flag } from 'lucide-react'
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
  onReport,
}: {
  message: ChatMessage
  isOwn: boolean
  onReport?: (messageId: string) => void
}) {
  const [showReport, setShowReport] = useState(false)
  const [reported, setReported] = useState(false)

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

  function handleReport() {
    if (onReport && !reported) {
      onReport(message.id)
      setReported(true)
      setShowReport(false)
    }
  }

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

        {/* Bubble — tap to show report on non-own messages */}
        <div
          onClick={() => !isOwn && onReport && setShowReport((v) => !v)}
          className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
            isOwn
              ? 'rounded-br-md bg-nerdcon-blue text-white'
              : 'rounded-bl-md bg-white/[0.07] text-terminal-white'
          }`}
        >
          {message.content}
        </div>

        {/* Timestamp + report */}
        <div className={`mt-0.5 flex items-center gap-2 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="font-mono text-[10px] text-fog-gray/50">
            {fmtTime(message.created_at)}
          </span>
          {showReport && !isOwn && !reported && (
            <button
              onClick={handleReport}
              className="flex items-center gap-0.5 font-mono text-[10px] text-boss-magenta/60 transition-colors hover:text-boss-magenta"
            >
              <Flag size={9} />
              Report
            </button>
          )}
          {reported && (
            <span className="font-mono text-[10px] text-fog-gray/40">Reported</span>
          )}
        </div>
      </div>
    </div>
  )
}
