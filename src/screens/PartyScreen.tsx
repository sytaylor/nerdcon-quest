import { useState } from 'react'
import { Users, Plus, LogIn, Copy, LogOut, Crown, Briefcase, Sparkles, Calendar, MessageCircle } from 'lucide-react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'
import { Sheet } from '../components/Sheet'
import { XPBar } from '../components/XPBar'
import { ChatThread } from '../components/ChatThread'
import { ChatInput } from '../components/ChatInput'
import { useParty } from '../lib/party'
import { useChat } from '../lib/chat'
import { useAuth } from '../lib/auth'

/* ─── XP Level Thresholds ─── */

const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 1500]
const LEVEL_NAMES = ['Newbie', 'Apprentice', 'Operator', 'Veteran', 'Legend']

function xpMax(level: number) {
  return LEVEL_THRESHOLDS[Math.min(level + 1, LEVEL_THRESHOLDS.length - 1)] ?? 2000
}

function levelName(level: number) {
  return LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length - 1)] ?? 'Legend'
}

/* ─── Quest Line Icons ─── */

function QuestLineIcon({ questLine }: { questLine: string | null }) {
  switch (questLine) {
    case 'builder':
      return <Sparkles size={12} className="text-cyan-pulse" />
    case 'operator':
      return <Briefcase size={12} className="text-boss-magenta" />
    case 'explorer':
      return <Users size={12} className="text-xp-green" />
    default:
      return null
  }
}

/* ─── No Party View ─── */

function NoPartyView({
  onCreateOpen,
  onJoinOpen,
}: {
  onCreateOpen: () => void
  onJoinOpen: () => void
}) {
  return (
    <>
      <Card glow="blue" className="mb-6">
        <div className="flex flex-col items-center py-8 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-nerdcon-blue/10">
            <Users size={36} className="text-nerdcon-blue" />
          </div>
          <h2 className="mb-1 font-mono text-lg font-bold text-terminal-white">
            No Party Yet
          </h2>
          <p className="mb-6 max-w-xs text-sm text-fog-gray">
            Form a party of up to 6 nerds. Share schedules, see each other on the
            map, and earn bonus XP together.
          </p>
          <div className="flex gap-3">
            <Button variant="primary" onClick={onCreateOpen}>
              <Plus size={16} />
              Create Party
            </Button>
            <Button variant="secondary" onClick={onJoinOpen}>
              <LogIn size={16} />
              Join Party
            </Button>
          </div>
        </div>
      </Card>
    </>
  )
}

/* ─── Party View ─── */

type PartyTab = 'members' | 'chat'

function PartyView() {
  const { party, members, leaveParty } = useParty()
  const { user } = useAuth()
  const chat = useChat()
  const [copied, setCopied] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [activeTab, setActiveTab] = useState<PartyTab>('chat')

  if (!party) return null

  async function handleCopyInvite() {
    try {
      await navigator.clipboard.writeText(party!.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: prompt
      window.prompt('Copy this invite code:', party!.invite_code)
    }
  }

  async function handleLeave() {
    await leaveParty()
    setConfirmLeave(false)
  }

  // Schedule overlap placeholder — count members going to the keynote
  const keynoteCount = Math.min(members.length, Math.max(2, members.length - 1))

  return (
    <>
      {/* Party Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold text-terminal-white">
            {party.name}
          </h2>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="font-mono text-xs uppercase tracking-[0.2em] text-fog-gray"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              {party.invite_code}
            </span>
            <Badge color="blue">
              {members.length}/{party.max_members}
            </Badge>
          </div>
        </div>
        <Button variant="secondary" className="!px-3 !py-2" onClick={handleCopyInvite}>
          <Copy size={14} />
          {copied ? 'Copied!' : 'Share'}
        </Button>
      </div>

      {/* Tab Switcher */}
      <div className="mb-4 flex gap-1 rounded-xl bg-white/5 p-1">
        <button
          onClick={() => {
            setActiveTab('chat')
            chat.markRead()
          }}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-mono text-xs font-medium transition-colors ${
            activeTab === 'chat'
              ? 'bg-nerdcon-blue/20 text-nerdcon-blue'
              : 'text-fog-gray hover:text-terminal-white'
          }`}
        >
          <MessageCircle size={14} />
          Chat
          {chat.unreadCount > 0 && activeTab !== 'chat' && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-boss-magenta px-1 font-mono text-[10px] font-bold text-white">
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-mono text-xs font-medium transition-colors ${
            activeTab === 'members'
              ? 'bg-nerdcon-blue/20 text-nerdcon-blue'
              : 'text-fog-gray hover:text-terminal-white'
          }`}
        >
          <Users size={14} />
          Members ({members.length})
        </button>
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="mb-6 flex flex-col" style={{ minHeight: '360px' }}>
          <Card className="flex flex-1 flex-col !p-0 overflow-hidden">
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
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <>
          <div className="mb-6 space-y-3">
            {members.map((member) => (
              <Card key={member.id}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-nerdcon-blue/15 font-mono text-sm font-bold text-nerdcon-blue">
                    {(member.profile.display_name ?? '?')[0].toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-terminal-white">
                        {member.profile.display_name}
                      </span>
                      {member.user_id === party.created_by && (
                        <Crown size={12} className="shrink-0 text-loot-gold" />
                      )}
                      <QuestLineIcon questLine={member.profile.quest_line} />
                    </div>

                    {member.profile.company && (
                      <p className="truncate text-xs text-fog-gray">
                        {member.profile.company}
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-3">
                      <Badge color="gold">
                        #{String(member.profile.nerd_number).padStart(4, '0')}
                      </Badge>
                      <span className="font-mono text-[11px] text-xp-green">
                        LVL {member.profile.level} &middot; {member.profile.xp} XP
                      </span>
                    </div>

                    <div className="mt-2">
                      <XPBar
                        current={member.profile.xp}
                        max={xpMax(member.profile.level)}
                        level={member.profile.level}
                        label={levelName(member.profile.level)}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Schedule Overlap */}
          <div className="mb-6 space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-fog-gray">
              Schedule Overlap
            </h3>
            <Card glow="cyan">
              <div className="flex items-center gap-3">
                <Calendar size={18} className="shrink-0 text-cyan-pulse" />
                <div>
                  <p className="text-sm font-medium text-terminal-white">
                    {keynoteCount}/{members.length} members going to Keynote
                  </p>
                  <p className="text-xs text-fog-gray">
                    Check the agenda to see shared sessions
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Leave Party */}
      {!confirmLeave ? (
        <Button
          variant="ghost"
          className="w-full !text-fog-gray"
          onClick={() => setConfirmLeave(true)}
        >
          <LogOut size={14} />
          Leave Party
        </Button>
      ) : (
        <Card glow="magenta">
          <p className="mb-3 text-center text-sm text-terminal-white">
            Leave <strong>{party.name}</strong>? You can rejoin with the invite code.
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setConfirmLeave(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 !bg-boss-magenta"
              onClick={handleLeave}
            >
              Leave
            </Button>
          </div>
        </Card>
      )}
    </>
  )
}

/* ─── Create Party Sheet ─── */

function CreatePartySheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
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
        Create a Party
      </h2>
      <p className="mb-5 text-sm text-fog-gray">
        Name your party and invite up to 5 others with a code.
      </p>
      <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-fog-gray">
        Party Name
      </label>
      <input
        type="text"
        maxLength={30}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Brainfood Crew"
        className="mb-5 w-full rounded-lg border border-white/10 bg-void-black px-4 py-3 font-sans text-sm text-terminal-white placeholder-fog-gray/50 outline-none focus:border-nerdcon-blue/60"
      />
      <Button
        variant="primary"
        className="w-full"
        disabled={!name.trim() || creating}
        onClick={handleCreate}
      >
        {creating ? 'Creating...' : 'Create Party'}
      </Button>
    </Sheet>
  )
}

/* ─── Join Party Sheet ─── */

function JoinPartySheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { joinParty } = useParty()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  async function handleJoin() {
    if (code.length < 6) return
    setJoining(true)
    setError(null)
    const { error: err } = await joinParty(code.trim())
    if (err) {
      setError(err)
      setJoining(false)
    } else {
      setCode('')
      setJoining(false)
      onClose()
    }
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="mb-1 font-mono text-base font-bold text-terminal-white">
        Join a Party
      </h2>
      <p className="mb-5 text-sm text-fog-gray">
        Enter the 6-character invite code from your friend.
      </p>
      <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-fog-gray">
        Invite Code
      </label>
      <input
        type="text"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="NERD42"
        className="mb-2 w-full rounded-lg border border-white/10 bg-void-black px-4 py-3 text-center font-mono text-lg uppercase tracking-[0.3em] text-terminal-white placeholder-fog-gray/50 outline-none focus:border-nerdcon-blue/60"
      />
      {error && (
        <p className="mb-3 text-center font-mono text-xs text-boss-magenta">
          {error}
        </p>
      )}
      <Button
        variant="primary"
        className="mt-3 w-full"
        disabled={code.length < 6 || joining}
        onClick={handleJoin}
      >
        {joining ? 'Joining...' : 'Join Party'}
      </Button>
    </Sheet>
  )
}

/* ─── Main Screen ─── */

export function PartyScreen() {
  const { party, loading } = useParty()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  return (
    <div
      className="min-h-[calc(100dvh-4rem)] px-5 pb-24"
      style={{ paddingTop: 'calc(var(--sat) + 1rem)' }}
    >
      <h1 className="mb-1 font-mono text-lg font-bold text-terminal-white">
        Party Hub
      </h1>
      <p className="mb-6 font-mono text-xs text-fog-gray">
        Team up. See each other on the map. Conquer quests together.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="font-mono text-sm text-fog-gray">Loading...</span>
        </div>
      ) : party ? (
        <PartyView />
      ) : (
        <NoPartyView
          onCreateOpen={() => setCreateOpen(true)}
          onJoinOpen={() => setJoinOpen(true)}
        />
      )}

      <CreatePartySheet open={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinPartySheet open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  )
}
