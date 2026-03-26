import { useState } from 'react'
import { Users, MessageCircle, Zap, UserPlus, Plus, LogIn, Copy, LogOut, Crown, ChevronRight } from 'lucide-react'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Sheet } from '../components/Sheet'
import { SegmentedControl } from '../components/SegmentedControl'
import { PeopleDirectory } from '../components/PeopleDirectory'
import { DMInbox } from '../components/DMInbox'
import { ChatThread } from '../components/ChatThread'
import { ChatInput } from '../components/ChatInput'
import { useAuth } from '../lib/auth'
import { useParty, type Party, type PartyMember } from '../lib/party'
import { useChat } from '../lib/chat'
import { useDM } from '../lib/dm'
import { useConnections } from '../lib/connections'

/* ─── Mock Organic Squads ─── */

const MOCK_ORGANIC_SQUADS = [
  { id: 'org-founders', name: 'Founders Circle', emoji: '🚀', description: 'For founders building the future of fintech.', member_count: 47, is_organic: true },
  { id: 'org-speakers', name: 'Speakers Lounge', emoji: '🎤', description: 'Green room for NerdCon speakers.', member_count: 12, is_organic: true },
  { id: 'org-builders', name: "Builder's Guild", emoji: '⚡', description: 'Engineers, architects, and code nerds.', member_count: 89, is_organic: true },
  { id: 'org-operators', name: "Operator's Den", emoji: '📊', description: 'Product, growth, and ops leaders.', member_count: 65, is_organic: true },
  { id: 'org-investors', name: 'Investor Circle', emoji: '💰', description: 'VCs, angels, and allocators.', member_count: 23, is_organic: true },
  { id: 'org-firsttimers', name: 'First-Timers', emoji: '👋', description: 'Your first NerdCon? Welcome!', member_count: 134, is_organic: true },
]

/* ─── Main Screen ─── */

export function CommunityScreen() {
  const { party, loading: partyLoading } = useParty()
  const { requestCount } = useConnections()
  const dm = useDM()
  const [view, setView] = useState('people')

  const unreadMessages = dm.totalUnread
  const totalNotifications = requestCount + unreadMessages

  const segments = [
    { key: 'people', label: 'People', badge: requestCount > 0 ? requestCount : null },
    { key: 'messages', label: 'Messages', badge: unreadMessages > 0 ? unreadMessages : null },
    { key: 'squads', label: 'Squads' },
  ]

  return (
    <div
      className="min-h-[calc(100dvh-4rem)]"
      style={{ paddingTop: 'calc(var(--sat) + 1rem)' }}
    >
      <div className="px-5 pb-2">
        <h1 className="mb-1 font-mono text-lg font-bold text-terminal-white">
          Community
        </h1>
        <p className="mb-4 font-mono text-xs text-fog-gray">
          Discover people. Make connections. Find your squad.
        </p>
        <SegmentedControl segments={segments} active={view} onChange={setView} />
      </div>

      <div className="mt-3">
        {view === 'people' && <PeopleView />}
        {view === 'messages' && <MessagesView />}
        {view === 'squads' && <SquadsView />}
      </div>
    </div>
  )
}

/* ─── People View ─── */

function PeopleView() {
  const { incomingRequests, acceptRequest, declineRequest } = useConnections()

  return (
    <div>
      {/* Incoming requests banner */}
      {incomingRequests.length > 0 && (
        <div className="mb-3 px-5">
          <Card glow="gold" className="!py-3">
            <h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-loot-gold">
              Connection Requests ({incomingRequests.length})
            </h3>
            {incomingRequests.map(req => (
              <div key={req.id} className="flex items-center gap-3 py-1.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-loot-gold/10 font-mono text-xs font-bold text-loot-gold">
                  {(req.profile?.display_name ?? '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-terminal-white">{req.profile?.display_name}</span>
                  {req.message && <p className="truncate text-[11px] text-fog-gray italic">"{req.message}"</p>}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => acceptRequest(req.id)}
                    className="rounded-lg bg-xp-green/15 px-2.5 py-1.5 font-mono text-[10px] font-medium text-xp-green transition-colors hover:bg-xp-green/25"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => declineRequest(req.id)}
                    className="rounded-lg bg-white/5 px-2.5 py-1.5 font-mono text-[10px] font-medium text-fog-gray transition-colors hover:bg-white/10"
                  >
                    Pass
                  </button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      <PeopleDirectory />
    </div>
  )
}

/* ─── Messages View ─── */

function MessagesView() {
  return (
    <div className="px-5 pb-24">
      <DMInbox />
    </div>
  )
}

/* ─── Squads View ─── */

function SquadsView() {
  const { party, members, loading, leaveParty } = useParty()
  const { user } = useAuth()
  const chat = useChat()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [showGroupChat, setShowGroupChat] = useState(false)

  return (
    <div className="px-5 pb-24">
      {/* My Squad */}
      {loading ? (
        <p className="py-8 text-center font-mono text-xs text-fog-gray animate-pulse">Loading...</p>
      ) : party ? (
        <div className="mb-6">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-wider text-fog-gray">
            My Nerd Squad
          </h2>
          {showGroupChat ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <button
                  onClick={() => setShowGroupChat(false)}
                  className="font-mono text-[10px] text-fog-gray hover:text-terminal-white"
                >
                  ← Back to squads
                </button>
                <span className="font-mono text-xs text-terminal-white">{party.name}</span>
              </div>
              <Card className="flex flex-col !p-0 overflow-hidden" style={{ minHeight: '340px' }}>
                <ChatThread
                  messages={chat.messages}
                  currentUserId={user?.id ?? null}
                  hasMore={chat.hasMore}
                  loading={chat.loading}
                  onLoadMore={chat.loadMore}
                  onReport={chat.reportMessage}
                />
                <ChatInput onSend={chat.sendMessage} disabled={chat.sending} />
              </Card>
            </div>
          ) : (
            <button className="w-full text-left" onClick={() => { setShowGroupChat(true); chat.markRead() }}>
              <Card glow="blue" className="transition-colors hover:border-nerdcon-blue/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-nerdcon-blue/15 text-lg">
                    🎮
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-terminal-white">{party.name}</span>
                      <Badge color="blue">{members.length}/{party.max_members}</Badge>
                    </div>
                    <p className="text-xs text-fog-gray">
                      Code: {party.invite_code} · {chat.messages.length > 0 ? `${chat.messages.length} messages` : 'Start chatting'}
                    </p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-boss-magenta px-1.5 font-mono text-[10px] font-bold text-white">
                      {chat.unreadCount}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-fog-gray/30" />
                </div>
              </Card>
            </button>
          )}
        </div>
      ) : (
        <div className="mb-6">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-wider text-fog-gray">
            My Nerd Squad
          </h2>
          <Card>
            <div className="flex flex-col items-center py-4 text-center">
              <p className="mb-3 text-sm text-fog-gray">
                Create a squad or join one with an invite code.
              </p>
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => setCreateOpen(true)}>
                  <Plus size={14} />
                  Create
                </Button>
                <Button variant="secondary" onClick={() => setJoinOpen(true)}>
                  <LogIn size={14} />
                  Join
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Organic Squads */}
      <div className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-fog-gray">
          Community Squads
        </h2>
        <p className="text-[11px] text-fog-gray/60">
          Open groups for like-minded nerds. Join any that fit.
        </p>
        {MOCK_ORGANIC_SQUADS.map(squad => (
          <Card key={squad.id} className="transition-colors hover:border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xl">
                {squad.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-mono text-sm font-bold text-terminal-white">{squad.name}</span>
                <p className="text-xs text-fog-gray">{squad.description}</p>
                <span className="font-mono text-[10px] text-fog-gray/50">{squad.member_count} members</span>
              </div>
              <Button variant="secondary" className="!px-3 !py-1.5 !text-[11px]">
                Join
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <CreateSquadSheet open={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinSquadSheet open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  )
}

/* ─── Create Squad Sheet ─── */

function CreateSquadSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createParty } = useParty()
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    await createParty(name.trim())
    setCreating(false)
    setName('')
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="mb-1 font-mono text-base font-bold text-terminal-white">
        Create a Nerd Squad
      </h2>
      <p className="mb-5 text-sm text-fog-gray">
        Name your squad and invite up to 5 others with a code.
      </p>
      <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-fog-gray">
        Squad Name
      </label>
      <input
        type="text"
        maxLength={30}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Brainfood Crew"
        className="mb-5 w-full rounded-lg border border-white/10 bg-void-black px-4 py-3 font-sans text-sm text-terminal-white placeholder-fog-gray/50 outline-none focus:border-nerdcon-blue/60"
      />
      <Button variant="primary" className="w-full" disabled={!name.trim() || creating} onClick={handleCreate}>
        {creating ? 'Creating...' : 'Create Squad'}
      </Button>
    </Sheet>
  )
}

/* ─── Join Squad Sheet ─── */

function JoinSquadSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { joinParty } = useParty()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  async function handleJoin() {
    if (code.length < 6) return
    setJoining(true)
    setError(null)
    const { error: err } = await joinParty(code.trim())
    if (err) { setError(err); setJoining(false) }
    else { setCode(''); setJoining(false); onClose() }
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="mb-1 font-mono text-base font-bold text-terminal-white">
        Join a Nerd Squad
      </h2>
      <p className="mb-5 text-sm text-fog-gray">
        Enter the 6-character invite code from your friend.
      </p>
      <input
        type="text"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="NERD42"
        className="mb-2 w-full rounded-lg border border-white/10 bg-void-black px-4 py-3 text-center font-mono text-lg uppercase tracking-[0.3em] text-terminal-white placeholder-fog-gray/50 outline-none focus:border-nerdcon-blue/60"
      />
      {error && <p className="mb-3 text-center font-mono text-xs text-boss-magenta">{error}</p>}
      <Button variant="primary" className="mt-3 w-full" disabled={code.length < 6 || joining} onClick={handleJoin}>
        {joining ? 'Joining...' : 'Join Squad'}
      </Button>
    </Sheet>
  )
}
