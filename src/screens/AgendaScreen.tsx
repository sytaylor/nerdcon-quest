import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Flame,
  MessageSquare,
  Wrench,
  Coffee,
  Zap,
  Users,
  Clock,
  MapPin,
  ArrowLeft,
  Plus,
  Check,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'
import { useSessions, useUserSchedule, type Session } from '../lib/sessions'
import { SessionDetailSheet } from './SessionDetailSheet'
import { fmtTime } from '../lib/format'

/* ─── Configs ─── */

const trackColor: Record<Session['track'], 'cyan' | 'blue' | 'green' | 'gray'> = {
  builder: 'cyan',
  operator: 'blue',
  explorer: 'green',
  general: 'gray',
}

const trackBorder: Record<Session['track'], string> = {
  builder: 'border-l-cyan-pulse',
  operator: 'border-l-nerdcon-blue',
  explorer: 'border-l-xp-green',
  general: 'border-l-fog-gray',
}

const typeIcon: Record<Session['session_type'], typeof Flame> = {
  keynote: Flame,
  panel: MessageSquare,
  workshop: Wrench,
  fireside: Coffee,
  lightning: Zap,
  social: Users,
}

const typeColor: Record<Session['session_type'], string> = {
  keynote: 'text-boss-magenta',
  panel: 'text-nerdcon-blue',
  workshop: 'text-cyan-pulse',
  fireside: 'text-loot-gold',
  lightning: 'text-cyan-pulse',
  social: 'text-xp-green',
}

const TRACKS = [
  { key: null, label: 'All' },
  { key: 'builder' as const, label: 'Builder', color: 'cyan' as const },
  { key: 'operator' as const, label: 'Operator', color: 'blue' as const },
  { key: 'explorer' as const, label: 'Explorer', color: 'green' as const },
] as const

/* ─── Component ─── */

export function AgendaScreen() {
  const navigate = useNavigate()
  const [day, setDay] = useState<1 | 2>(1)
  const [trackFilter, setTrackFilter] = useState<Session['track'] | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  const { sessions, loading } = useSessions({ day })
  const { isInSchedule, addSession, removeSession } = useUserSchedule()

  const filtered = useMemo(() => {
    if (!trackFilter) return sessions
    return sessions.filter((s) => s.track === trackFilter || s.track === 'general')
  }, [sessions, trackFilter])

  /* Group by time slot */
  const grouped = useMemo(() => {
    const map = new Map<string, Session[]>()
    for (const s of filtered) {
      const key = `${fmtTime(s.start_time)}–${fmtTime(s.end_time)}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    return Array.from(map.entries())
  }, [filtered])

  function handleQuickAdd(e: React.MouseEvent, session: Session) {
    e.stopPropagation()
    if (isInSchedule(session.id)) {
      removeSession(session.id)
    } else {
      addSession(session.id)
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
      {/* Header with back button */}
      <div
        className="flex items-center gap-3 px-5 pb-2 pt-4"
        style={{ paddingTop: 'calc(var(--sat) + 1rem)' }}
      >
        <button
          onClick={() => navigate('/quests')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-panel-dark text-fog-gray transition-colors hover:text-terminal-white"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="font-mono text-lg font-bold text-terminal-white">Agenda</h1>
          <p className="font-mono text-xs text-fog-gray">
            Nov {day === 1 ? 19 : 20}, 2026
          </p>
        </div>
      </div>

      {/* Day toggle */}
      <div className="flex gap-2 px-5 pb-2">
        {([1, 2] as const).map((d) => (
          <motion.button
            key={d}
            whileTap={{ scale: 0.97 }}
            onClick={() => setDay(d)}
            className={`rounded-full px-4 py-1.5 font-mono text-xs font-medium transition-colors ${
              day === d
                ? 'bg-nerdcon-blue text-terminal-white shadow-glow-blue'
                : 'border border-white/10 bg-panel-dark text-fog-gray'
            }`}
          >
            Day {d}
          </motion.button>
        ))}
      </div>

      {/* Track filter chips */}
      <div className="flex gap-1.5 overflow-x-auto px-5 pb-3 pt-1">
        {TRACKS.map((t) => {
          const active = trackFilter === t.key
          return (
            <motion.button
              key={t.label}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTrackFilter(t.key)}
              className={`shrink-0 rounded-full px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider transition-colors ${
                active
                  ? 'bg-nerdcon-blue/15 text-nerdcon-blue border border-nerdcon-blue/30'
                  : 'border border-white/5 bg-panel-dark text-fog-gray'
              }`}
            >
              {t.label}
            </motion.button>
          )
        })}
      </div>

      {/* Session list */}
      <div className="flex-1 space-y-6 overflow-y-auto px-5 pb-24">
        {loading && (
          <p className="py-8 text-center font-mono text-xs text-fog-gray">Loading sessions...</p>
        )}

        {!loading && grouped.length === 0 && (
          <p className="py-8 text-center font-mono text-xs text-fog-gray">
            No sessions match your filters.
          </p>
        )}

        {grouped.map(([timeSlot, slotSessions]) => (
          <div key={timeSlot}>
            {/* Time slot header */}
            <div className="mb-2 flex items-center gap-2">
              <Clock size={12} className="text-fog-gray" />
              <span className="font-mono text-xs font-medium text-fog-gray">{timeSlot}</span>
            </div>

            {/* Session cards */}
            <div className="space-y-2">
              {slotSessions.map((session) => {
                const Icon = typeIcon[session.session_type]
                const inSchedule = isInSchedule(session.id)
                return (
                  <motion.div
                    key={session.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedSession(session)}
                    className="cursor-pointer"
                  >
                    <Card
                      className={`border-l-2 ${trackBorder[session.track]} !rounded-l-none`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex items-center gap-1.5">
                            <Icon
                              size={13}
                              className={typeColor[session.session_type]}
                            />
                            <Badge color={trackColor[session.track]}>
                              {session.track}
                            </Badge>
                          </div>
                          <h3 className="font-mono text-sm font-bold leading-snug text-terminal-white">
                            {session.title}
                          </h3>
                          <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-fog-gray">
                            <span className="inline-flex items-center gap-0.5">
                              <MapPin size={10} />
                              {session.room}
                            </span>
                            {session.speaker_names.length > 0 && (
                              <span className="inline-flex items-center gap-0.5">
                                <Users size={10} />
                                {session.speaker_names.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick add/remove button */}
                        <button
                          onClick={(e) => handleQuickAdd(e, session)}
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all ${
                            inSchedule
                              ? 'bg-xp-green/15 text-xp-green shadow-glow-green'
                              : 'border border-white/10 bg-panel-dark text-fog-gray hover:border-nerdcon-blue/40 hover:text-nerdcon-blue'
                          }`}
                          aria-label={inSchedule ? 'Remove from schedule' : 'Add to schedule'}
                        >
                          {inSchedule ? <Check size={14} /> : <Plus size={14} />}
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Session Detail Sheet */}
      <SessionDetailSheet
        session={selectedSession}
        open={!!selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  )
}
