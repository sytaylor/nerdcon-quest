import { useState, useEffect, useMemo } from 'react'
import { Search, UserPlus, MessageCircle, Check, Clock, Sparkles, Briefcase, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from './Card'
import { Badge } from './Badge'
import { Sheet } from './Sheet'
import { Button } from './Button'
import { supabase } from '../lib/supabase'
import { useAuth, type Profile } from '../lib/auth'
import { useConnections } from '../lib/connections'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

/* ─── Mock People ─── */

const MOCK_PEOPLE: Profile[] = [
  { id: 'dev-user-002', nerd_number: 7, display_name: 'Ada Lovelace', company: 'Plaid', role: 'Engineer', bio: 'Open banking nerd. Building the pipes.', looking_for: 'Co-founders, API partners', avatar_url: null, quest_line: 'operator', xp: 420, level: 2 },
  { id: 'dev-user-003', nerd_number: 1337, display_name: 'Satoshi N.', company: 'Lightning Labs', role: 'Protocol Engineer', bio: 'Decentralizing payments one block at a time.', looking_for: 'Infrastructure builders', avatar_url: null, quest_line: 'explorer', xp: 890, level: 3 },
  { id: 'dev-user-004', nerd_number: 69, display_name: 'Jordan Kim', company: 'Revolut', role: 'Design Lead', bio: 'Making fintech beautiful.', looking_for: 'Product designers, UX researchers', avatar_url: null, quest_line: 'explorer', xp: 820, level: 3 },
  { id: 'dev-user-005', nerd_number: 101, display_name: 'Priya Patel', company: 'Wise', role: 'Head of Product', bio: 'Cross-border payments obsessive.', looking_for: 'Operators scaling internationally', avatar_url: null, quest_line: 'operator', xp: 710, level: 3 },
  { id: 'dev-user-006', nerd_number: 256, display_name: 'Marcus Webb', company: 'a16z', role: 'Partner', bio: 'Investing in the next wave of fintech infra.', looking_for: 'Founders, seed-stage startups', avatar_url: null, quest_line: 'operator', xp: 580, level: 3 },
  { id: 'dev-user-007', nerd_number: 314, display_name: 'Luna Tran', company: 'Square', role: 'SWE', bio: 'Payment systems at scale. Rust enthusiast.', looking_for: 'Systems engineers, open-source contributors', avatar_url: null, quest_line: 'builder', xp: 420, level: 2 },
  { id: 'dev-user-008', nerd_number: 420, display_name: 'Kai Nakamura', company: 'Mercury', role: 'CTO', bio: 'Building banking for startups.', looking_for: 'API-first founders', avatar_url: null, quest_line: 'builder', xp: 310, level: 2 },
  { id: 'dev-user-009', nerd_number: 512, display_name: 'Zara Okonkwo', company: 'Nubank', role: 'Analyst', bio: 'LatAm fintech enthusiast. Data-driven.', looking_for: 'Emerging market operators', avatar_url: null, quest_line: 'explorer', xp: 150, level: 1 },
]

function QuestIcon({ questLine }: { questLine: string | null }) {
  switch (questLine) {
    case 'builder': return <Sparkles size={11} className="text-cyan-pulse" />
    case 'operator': return <Briefcase size={11} className="text-boss-magenta" />
    case 'explorer': return <Users size={11} className="text-xp-green" />
    default: return null
  }
}

const QUEST_FILTERS = [
  { key: null, label: 'All' },
  { key: 'builder' as const, label: 'Builder' },
  { key: 'operator' as const, label: 'Operator' },
  { key: 'explorer' as const, label: 'Explorer' },
]

export function PeopleDirectory({ onMessage }: { onMessage?: (userId: string) => void }) {
  const { user } = useAuth()
  const { isConnected, isPending, sendRequest, acceptRequest, incomingRequests } = useConnections()
  const [people, setPeople] = useState<Profile[]>(DEV_MODE ? MOCK_PEOPLE : [])
  const [loading, setLoading] = useState(!DEV_MODE)
  const [search, setSearch] = useState('')
  const [questFilter, setQuestFilter] = useState<string | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<Profile | null>(null)
  const [connectMsg, setConnectMsg] = useState('')
  const [sendingRequest, setSendingRequest] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  useEffect(() => {
    if (DEV_MODE) return
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('discoverable', true)
        .order('nerd_number', { ascending: true })
        .limit(200)
      if (data) setPeople(data as Profile[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let result = people.filter(p => p.id !== user?.id)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.display_name?.toLowerCase().includes(q) ||
        p.company?.toLowerCase().includes(q) ||
        p.role?.toLowerCase().includes(q) ||
        p.looking_for?.toLowerCase().includes(q)
      )
    }
    if (questFilter) {
      result = result.filter(p => p.quest_line === questFilter)
    }
    return result
  }, [people, search, questFilter, user?.id])

  async function handleConnect() {
    if (!selectedPerson) return
    setSendingRequest(true)
    setRequestError(null)
    const { error } = await sendRequest(selectedPerson.id, connectMsg || undefined)
    setSendingRequest(false)
    if (error) {
      setRequestError(error)
    } else {
      setConnectMsg('')
      setSelectedPerson(null)
    }
  }

  // Check if selected person has a pending request to us
  const incomingFromSelected = selectedPerson
    ? incomingRequests.find(r => r.sender_id === selectedPerson.id)
    : null

  return (
    <>
      <div className="px-5 pb-24">
        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fog-gray/50" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search people..."
            className="w-full rounded-xl border border-white/10 bg-void-black py-2.5 pl-9 pr-4 text-sm text-terminal-white placeholder-fog-gray/40 outline-none transition-colors focus:border-nerdcon-blue/50"
          />
        </div>

        {/* Quest line filters */}
        <div className="mb-4 flex gap-1.5 overflow-x-auto">
          {QUEST_FILTERS.map(f => (
            <button
              key={f.label}
              onClick={() => setQuestFilter(f.key)}
              className={`shrink-0 rounded-full px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider transition-colors ${
                questFilter === f.key
                  ? 'bg-nerdcon-blue/15 text-nerdcon-blue border border-nerdcon-blue/30'
                  : 'border border-white/5 bg-panel-dark text-fog-gray'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading && <p className="py-12 text-center font-mono text-xs text-fog-gray animate-pulse">Loading people...</p>}

        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center">
            <Users size={32} className="mx-auto mb-2 text-fog-gray/30" />
            <p className="font-mono text-xs text-fog-gray">
              {search ? 'No one matches your search' : 'No attendees yet — be one of the first!'}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map((person, i) => {
            const connected = isConnected(person.id)
            const pending = isPending(person.id)
            const hasIncoming = incomingRequests.some(r => r.sender_id === person.id)

            return (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <button className="w-full text-left" onClick={() => setSelectedPerson(person)}>
                  <Card className={`transition-colors hover:border-white/10 ${connected ? 'border-xp-green/15' : ''}`}>
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-nerdcon-blue/15 font-mono text-sm font-bold text-nerdcon-blue">
                        {(person.display_name ?? '?')[0].toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-terminal-white">{person.display_name}</span>
                          <QuestIcon questLine={person.quest_line} />
                          <Badge color="gold">#{String(person.nerd_number).padStart(4, '0')}</Badge>
                        </div>
                        {person.company && (
                          <p className="truncate text-xs text-fog-gray">
                            {person.company}{person.role ? ` · ${person.role}` : ''}
                          </p>
                        )}
                        {person.looking_for && (
                          <p className="mt-0.5 truncate text-[11px] text-fog-gray/60">
                            Looking for: {person.looking_for}
                          </p>
                        )}
                      </div>

                      {/* Status indicator */}
                      <div className="shrink-0">
                        {connected ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-xp-green/15 text-xp-green">
                            <Check size={14} />
                          </div>
                        ) : hasIncoming ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-loot-gold/15 text-loot-gold">
                            <UserPlus size={14} />
                          </div>
                        ) : pending ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-fog-gray">
                            <Clock size={14} />
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-fog-gray">
                            <UserPlus size={14} />
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Profile Sheet */}
      <Sheet open={!!selectedPerson} onClose={() => { setSelectedPerson(null); setConnectMsg(''); setRequestError(null) }}>
        {selectedPerson && (
          <div className="pb-4">
            {/* Profile header */}
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-nerdcon-blue/15 font-mono text-xl font-bold text-nerdcon-blue">
                {(selectedPerson.display_name ?? '?')[0].toUpperCase()}
              </div>
              <div>
                <h2 className="font-mono text-base font-bold text-terminal-white">{selectedPerson.display_name}</h2>
                {selectedPerson.company && (
                  <p className="text-sm text-fog-gray">
                    {selectedPerson.company}{selectedPerson.role ? ` · ${selectedPerson.role}` : ''}
                  </p>
                )}
                <div className="mt-1 flex items-center gap-2">
                  <Badge color="gold">#{String(selectedPerson.nerd_number).padStart(4, '0')}</Badge>
                  <QuestIcon questLine={selectedPerson.quest_line} />
                  <span className="font-mono text-[10px] text-xp-green">{selectedPerson.xp} XP</span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {selectedPerson.bio && (
              <p className="mb-3 text-sm text-terminal-white/80">{selectedPerson.bio}</p>
            )}

            {selectedPerson.looking_for && (
              <div className="mb-4 rounded-lg bg-white/[0.03] px-3 py-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-fog-gray">Looking for</span>
                <p className="mt-0.5 text-sm text-terminal-white/70">{selectedPerson.looking_for}</p>
              </div>
            )}

            {/* Action buttons */}
            {isConnected(selectedPerson.id) ? (
              <div className="flex gap-2">
                <Button variant="primary" className="flex-1" onClick={() => { onMessage?.(selectedPerson.id); setSelectedPerson(null) }}>
                  <MessageCircle size={14} />
                  Message
                </Button>
                <Button variant="secondary" className="flex-1">
                  <Check size={14} className="text-xp-green" />
                  Connected
                </Button>
              </div>
            ) : incomingFromSelected ? (
              <div className="space-y-2">
                {incomingFromSelected.message && (
                  <div className="rounded-lg bg-loot-gold/5 border border-loot-gold/15 px-3 py-2">
                    <p className="text-sm text-terminal-white/80 italic">"{incomingFromSelected.message}"</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="primary" className="flex-1" onClick={() => { acceptRequest(incomingFromSelected.id); setSelectedPerson(null) }}>
                    <Check size={14} />
                    Accept
                  </Button>
                  <Button variant="ghost" className="flex-1">
                    Decline
                  </Button>
                </div>
              </div>
            ) : isPending(selectedPerson.id) ? (
              <Button variant="secondary" className="w-full" disabled>
                <Clock size={14} />
                Request Sent
              </Button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={connectMsg}
                  onChange={e => setConnectMsg(e.target.value.slice(0, 140))}
                  placeholder="Add a note (optional)..."
                  maxLength={140}
                  className="w-full rounded-lg border border-white/10 bg-void-black px-3 py-2.5 text-sm text-terminal-white placeholder-fog-gray/40 outline-none focus:border-nerdcon-blue/50"
                />
                {requestError && (
                  <p className="font-mono text-[11px] text-boss-magenta">{requestError}</p>
                )}
                <Button variant="primary" className="w-full" onClick={handleConnect} disabled={sendingRequest}>
                  <UserPlus size={14} />
                  {sendingRequest ? 'Sending...' : 'Connect'}
                </Button>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </>
  )
}
