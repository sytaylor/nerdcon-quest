import { ArrowLeft, Check, X, MessageCircle, ChevronRight } from 'lucide-react'
import { Card } from './Card'
import { Badge } from './Badge'
import { ChatThread } from './ChatThread'
import { ChatInput } from './ChatInput'
import { useDM } from '../lib/dm'
import { useAuth } from '../lib/auth'

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

/** DM request card with accept/decline */
function RequestCard({ request, onAccept, onDecline }: {
  request: { id: string; sender_profile?: { display_name: string; nerd_number: number; company: string | null }; created_at: string }
  onAccept: () => void
  onDecline: () => void
}) {
  const p = request.sender_profile
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-pulse/15 font-mono text-sm font-bold text-cyan-pulse">
          {(p?.display_name ?? '?')[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-terminal-white">
            {p?.display_name ?? 'Unknown'}
          </p>
          <p className="font-mono text-[10px] text-fog-gray">
            {p?.company && `${p.company} · `}
            #{String(p?.nerd_number ?? 0).padStart(4, '0')} · {fmtRelative(request.created_at)}
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={onAccept}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-xp-green/15 text-xp-green transition-colors hover:bg-xp-green/25"
          >
            <Check size={16} />
          </button>
          <button
            onClick={onDecline}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-boss-magenta/15 text-boss-magenta transition-colors hover:bg-boss-magenta/25"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </Card>
  )
}

/** Conversation list item */
function ConvoItem({ convo, onClick }: {
  convo: { id: string; other_user?: { display_name: string; nerd_number: number; quest_line: string | null }; last_message?: { content: string; created_at: string }; unread_count: number }
  onClick: () => void
}) {
  const o = convo.other_user
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className="transition-colors hover:border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-nerdcon-blue/15 font-mono text-sm font-bold text-nerdcon-blue">
            {(o?.display_name ?? '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-terminal-white">
                {o?.display_name ?? 'Unknown'}
              </span>
              <Badge color="gold">
                #{String(o?.nerd_number ?? 0).padStart(4, '0')}
              </Badge>
            </div>
            {convo.last_message && (
              <p className="mt-0.5 truncate text-xs text-fog-gray">
                {convo.last_message.content}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {convo.last_message && (
              <span className="font-mono text-[10px] text-fog-gray/50">
                {fmtRelative(convo.last_message.created_at)}
              </span>
            )}
            {convo.unread_count > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-boss-magenta px-1.5 font-mono text-[10px] font-bold text-white">
                {convo.unread_count}
              </span>
            )}
            <ChevronRight size={14} className="text-fog-gray/30" />
          </div>
        </div>
      </Card>
    </button>
  )
}

/** Full DM inbox — requests + conversation list + active thread */
export function DMInbox() {
  const dm = useDM()
  const { user } = useAuth()
  async function handleAccept(id: string) {
    await dm.acceptRequest(id)
  }

  // Active conversation view
  if (dm.activeConversationId) {
    const convo = dm.conversations.find((c) => c.id === dm.activeConversationId)
    const name = convo?.other_user?.display_name ?? 'Chat'

    // Map DirectMessage to ChatMessage format for ChatThread reuse
    const chatMessages = dm.activeMessages.map((m) => ({
      id: m.id,
      party_id: m.conversation_id,
      sender_id: m.sender_id,
      content: m.content,
      message_type: 'text' as const,
      created_at: m.created_at,
      sender: convo?.other_user && m.sender_id !== user?.id
        ? { display_name: convo.other_user.display_name, nerd_number: convo.other_user.nerd_number, quest_line: convo.other_user.quest_line }
        : undefined,
    }))

    return (
      <div className="flex flex-col" style={{ minHeight: '400px' }}>
        {/* Header */}
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={dm.closeConversation}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-fog-gray transition-colors hover:text-terminal-white"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="font-mono text-sm font-medium text-terminal-white">{name}</span>
        </div>

        <Card className="flex flex-1 flex-col !p-0 overflow-hidden">
          <ChatThread
            messages={chatMessages}
            currentUserId={user?.id ?? null}
            hasMore={false}
            loading={false}
            onLoadMore={() => {}}
          />
          <ChatInput onSend={dm.sendMessage} disabled={dm.sending} />
        </Card>
      </div>
    )
  }

  // Inbox list view
  if (dm.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="animate-pulse font-mono text-xs text-fog-gray">Loading messages...</span>
      </div>
    )
  }

  const hasContent = dm.incomingRequests.length > 0 || dm.conversations.length > 0

  if (!hasContent) {
    return (
      <Card>
        <div className="flex flex-col items-center py-8 text-center">
          <MessageCircle size={32} className="mb-3 text-fog-gray/30" />
          <p className="text-sm text-fog-gray">No messages yet</p>
          <p className="mt-1 text-xs text-fog-gray/60">
            Scan someone's QR code, then send them a message request
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Pending requests */}
      {dm.incomingRequests.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-mono text-xs uppercase tracking-wider text-fog-gray">
            Message Requests ({dm.incomingRequests.length})
          </h3>
          {dm.incomingRequests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              onAccept={() => handleAccept(req.id)}
              onDecline={() => dm.declineRequest(req.id)}
            />
          ))}
        </div>
      )}

      {/* Conversations */}
      {dm.conversations.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-mono text-xs uppercase tracking-wider text-fog-gray">
            Conversations
          </h3>
          {dm.conversations.map((convo) => (
            <ConvoItem
              key={convo.id}
              convo={convo}
              onClick={() => dm.openConversation(convo.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
