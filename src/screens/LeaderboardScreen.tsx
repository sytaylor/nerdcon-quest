import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Crown, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'
import { useAuth, type Profile } from '../lib/auth'
import { supabase } from '../lib/supabase'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

type Category = 'overall' | 'connections' | 'sessions'

interface LeaderboardEntry extends Profile {
  /** Extra stat for category leaderboards */
  stat_count?: number
}

interface ConnectionLeaderboardRow extends Profile {
  connection_count: number | string
}

interface SessionLeaderboardRow extends Profile {
  session_count: number | string
}

const MOCK_LEADERBOARD: Profile[] = [
  { id: 'lb-1', nerd_number: 1, display_name: 'Simon Taylor', company: 'Fintech Brainfood', role: 'Founder', bio: null, looking_for: null, avatar_url: null, quest_line: 'explorer', xp: 1850, level: 5 },
  { id: 'lb-2', nerd_number: 7, display_name: 'Alex Chen', company: 'Stripe', role: 'Engineer', bio: null, looking_for: null, avatar_url: null, quest_line: 'builder', xp: 1420, level: 4 },
  { id: 'lb-3', nerd_number: 13, display_name: 'Maya Rodriguez', company: 'Plaid', role: 'PM', bio: null, looking_for: null, avatar_url: null, quest_line: 'operator', xp: 1180, level: 4 },
  { id: 'lb-4', nerd_number: 42, display_name: 'Dev Nerd', company: 'NerdCon HQ', role: 'Builder', bio: null, looking_for: null, avatar_url: null, quest_line: 'builder', xp: 950, level: 3 },
  { id: 'lb-5', nerd_number: 69, display_name: 'Jordan Kim', company: 'Revolut', role: 'Design Lead', bio: null, looking_for: null, avatar_url: null, quest_line: 'explorer', xp: 820, level: 3 },
  { id: 'lb-6', nerd_number: 101, display_name: 'Priya Patel', company: 'Wise', role: 'Head of Product', bio: null, looking_for: null, avatar_url: null, quest_line: 'operator', xp: 710, level: 3 },
  { id: 'lb-7', nerd_number: 256, display_name: 'Marcus Webb', company: 'a16z', role: 'Partner', bio: null, looking_for: null, avatar_url: null, quest_line: 'operator', xp: 580, level: 3 },
  { id: 'lb-8', nerd_number: 314, display_name: 'Luna Tran', company: 'Square', role: 'SWE', bio: null, looking_for: null, avatar_url: null, quest_line: 'builder', xp: 420, level: 2 },
  { id: 'lb-9', nerd_number: 420, display_name: 'Kai Nakamura', company: 'Mercury', role: 'CTO', bio: null, looking_for: null, avatar_url: null, quest_line: 'builder', xp: 310, level: 2 },
  { id: 'lb-10', nerd_number: 512, display_name: 'Zara Okonkwo', company: 'Nubank', role: 'Analyst', bio: null, looking_for: null, avatar_url: null, quest_line: 'explorer', xp: 150, level: 1 },
]

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'overall', label: 'Overall' },
  { key: 'connections', label: 'Connections' },
  { key: 'sessions', label: 'Sessions' },
]

function formatNerdNumber(n: number): string {
  return `#${String(n).padStart(4, '0')}`
}

function getLevelLabel(level: number): string {
  const labels: Record<number, string> = {
    1: 'Newbie',
    2: 'Apprentice',
    3: 'Operator',
    4: 'Veteran',
    5: 'Legend',
  }
  return labels[level] ?? 'Newbie'
}

export function LeaderboardScreen() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [category, setCategory] = useState<Category>('overall')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true)

      if (DEV_MODE) {
        await new Promise((r) => setTimeout(r, 300))
        setEntries(MOCK_LEADERBOARD)
        setLoading(false)
        return
      }

      if (category === 'overall') {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .order('xp', { ascending: false })
          .limit(20)
        if (data) setEntries(data as LeaderboardEntry[])
      } else if (category === 'connections') {
        const { data } = await supabase.rpc('leaderboard_connections', { lim: 20 })
        if (data) {
          setEntries((data as ConnectionLeaderboardRow[]).map((d) => ({
            ...d,
            stat_count: Number(d.connection_count),
          })))
        }
      } else if (category === 'sessions') {
        const { data } = await supabase.rpc('leaderboard_sessions', { lim: 20 })
        if (data) {
          setEntries((data as SessionLeaderboardRow[]).map((d) => ({
            ...d,
            stat_count: Number(d.session_count),
          })))
        }
      }

      setLoading(false)
    }

    fetchLeaderboard()
  }, [category])

  const currentUserId = profile?.id ?? (DEV_MODE ? 'dev-user-001' : null)
  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <div
      className="min-h-[calc(100dvh-4rem)] px-5 pb-24"
      style={{ paddingTop: 'calc(var(--sat) + 1rem)' }}
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/profile')}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-panel-dark text-fog-gray transition-colors hover:border-nerdcon-blue/40 hover:text-terminal-white"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-mono text-lg font-bold text-terminal-white">Leaderboard</h1>
          <p className="font-mono text-[11px] text-fog-gray">Top nerds by XP</p>
        </div>
      </div>

      {/* Category pills */}
      <div className="mb-5 flex gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`rounded-full px-3.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wider transition-colors ${
              category === c.key
                ? 'bg-nerdcon-blue/15 text-nerdcon-blue border border-nerdcon-blue/30'
                : 'border border-white/5 bg-panel-dark text-fog-gray'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <p className="py-12 text-center font-mono text-xs animate-pulse text-fog-gray">
          Loading leaderboard...
        </p>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <Trophy size={40} className="text-fog-gray/30" />
          <p className="text-center font-mono text-xs text-fog-gray">
            No rankings yet. Start earning XP!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Top 3 */}
          {top3.map((entry, i) => {
            const rank = i + 1
            const isCurrentUser = entry.id === currentUserId
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 30 }}
              >
                <TopCard rank={rank} entry={entry} isCurrentUser={isCurrentUser} category={category} />
              </motion.div>
            )
          })}

          {/* Rest (4-20) */}
          {rest.length > 0 && (
            <div className="mt-4 space-y-1">
              <h2 className="mb-2 font-mono text-xs uppercase tracking-wider text-fog-gray">
                Rankings
              </h2>
              {rest.map((entry, i) => {
                const rank = i + 4
                const isCurrentUser = entry.id === currentUserId
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.24 + i * 0.04, type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <RankRow rank={rank} entry={entry} isCurrentUser={isCurrentUser} category={category} />
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Top 3 Card ─── */

interface TopCardProps {
  rank: number
  entry: LeaderboardEntry
  isCurrentUser: boolean
  category: Category
}

function TopCard({ rank, entry, isCurrentUser, category }: TopCardProps) {
  const glowMap: Record<number, 'gold' | 'none'> = { 1: 'gold', 2: 'none', 3: 'none' }
  const rankColors: Record<number, string> = {
    1: 'text-loot-gold',
    2: 'text-fog-gray',
    3: 'text-loot-gold/60',
  }
  const borderColors: Record<number, string> = {
    1: 'border-loot-gold/30',
    2: 'border-fog-gray/20',
    3: 'border-loot-gold/15',
  }
  const bgAccent: Record<number, string> = {
    1: 'bg-loot-gold/5',
    2: 'bg-fog-gray/5',
    3: 'bg-loot-gold/3',
  }

  return (
    <Card
      glow={glowMap[rank] ?? 'none'}
      className={`${borderColors[rank] ?? ''} ${bgAccent[rank] ?? ''} ${
        isCurrentUser ? '!border-nerdcon-blue/40' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Rank */}
        <div className="flex w-8 flex-col items-center">
          {rank === 1 && <Crown size={16} className="mb-0.5 text-loot-gold" />}
          <span className={`font-mono text-lg font-bold ${rankColors[rank] ?? 'text-fog-gray'}`}>
            {rank}
          </span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-mono text-sm font-bold text-terminal-white">
              {entry.display_name ?? `Nerd ${formatNerdNumber(entry.nerd_number)}`}
            </span>
            {isCurrentUser && (
              <span className="font-mono text-[10px] text-nerdcon-blue">YOU</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {entry.company && (
              <span className="truncate text-xs text-fog-gray">{entry.company}</span>
            )}
            <Badge color="gold">{formatNerdNumber(entry.nerd_number)}</Badge>
          </div>
        </div>

        {/* XP + Level / Category stat */}
        <div className="flex flex-col items-end gap-0.5">
          {category === 'overall' ? (
            <>
              <span className="font-mono text-sm font-bold text-xp-green">{entry.xp} XP</span>
              <span className="font-mono text-[10px] text-fog-gray">
                LVL {entry.level} {getLevelLabel(entry.level)}
              </span>
            </>
          ) : (
            <>
              <span className="font-mono text-sm font-bold text-cyan-pulse">
                {entry.stat_count ?? 0}
              </span>
              <span className="font-mono text-[10px] text-fog-gray">
                {category === 'connections' ? 'connections' : 'sessions'}
              </span>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

/* ─── Compact Rank Row ─── */

interface RankRowProps {
  rank: number
  entry: LeaderboardEntry
  isCurrentUser: boolean
  category: Category
}

function RankRow({ rank, entry, isCurrentUser, category }: RankRowProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
        isCurrentUser
          ? 'border-nerdcon-blue/40 bg-nerdcon-blue/5'
          : 'border-white/5 bg-panel-dark'
      }`}
    >
      {/* Rank number */}
      <span className="w-6 text-center font-mono text-xs font-bold text-fog-gray">{rank}</span>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-mono text-sm font-bold text-terminal-white">
            {entry.display_name ?? `Nerd ${formatNerdNumber(entry.nerd_number)}`}
          </span>
          {isCurrentUser && (
            <span className="font-mono text-[10px] text-nerdcon-blue">YOU</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {entry.company && (
            <span className="truncate text-[11px] text-fog-gray">{entry.company}</span>
          )}
          <span className="font-mono text-[10px] text-loot-gold">
            {formatNerdNumber(entry.nerd_number)}
          </span>
        </div>
      </div>

      {/* XP / Category stat */}
      <div className="flex flex-col items-end">
        {category === 'overall' ? (
          <>
            <span className="font-mono text-xs font-bold text-xp-green">{entry.xp} XP</span>
            <span className="font-mono text-[10px] text-fog-gray">LVL {entry.level}</span>
          </>
        ) : (
          <>
            <span className="font-mono text-xs font-bold text-cyan-pulse">{entry.stat_count ?? 0}</span>
            <span className="font-mono text-[10px] text-fog-gray">
              {category === 'connections' ? 'conns' : 'sched'}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
