import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Flame,
  MessageSquare,
  Wrench,
  Coffee,
  Zap,
  Users,
  MapPin,
  AlertTriangle,
  Trash2,
  CalendarDays,
  ArrowLeft,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { useUserSchedule, type Session } from '../lib/sessions'
import { SessionDetailSheet } from './SessionDetailSheet'
import { fmtTime } from '../lib/format'

/* ─── Configs ─── */

const trackColor: Record<Session['track'], 'cyan' | 'blue' | 'green' | 'gray'> = {
  builder: 'cyan',
  operator: 'blue',
  explorer: 'green',
  general: 'gray',
}

const trackBar: Record<Session['track'], string> = {
  builder: 'bg-cyan-pulse',
  operator: 'bg-nerdcon-blue',
  explorer: 'bg-xp-green',
  general: 'bg-fog-gray',
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

/* ─── Helpers ─── */

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function detectConflicts(sessions: Session[]): Set<string> {
  const conflicting = new Set<string>()
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const a = sessions[i]
      const b = sessions[j]
      if (a.day !== b.day) continue
      const aStart = timeToMinutes(a.start_time)
      const aEnd = timeToMinutes(a.end_time)
      const bStart = timeToMinutes(b.start_time)
      const bEnd = timeToMinutes(b.end_time)
      if (aStart < bEnd && bStart < aEnd) {
        conflicting.add(a.id)
        conflicting.add(b.id)
      }
    }
  }
  return conflicting
}

/* ─── Component ─── */

export function ScheduleScreen() {
  const navigate = useNavigate()
  const [day, setDay] = useState<1 | 2>(1)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const { schedule, removeSession, loading } = useUserSchedule()

  const daySessions = useMemo(
    () =>
      schedule
        .filter((s) => s.day === day)
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [schedule, day],
  )

  const conflicts = useMemo(() => detectConflicts(daySessions), [daySessions])

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
          <h1 className="font-mono text-lg font-bold text-terminal-white">My Schedule</h1>
          <p className="font-mono text-xs text-fog-gray">
            {daySessions.length} session{daySessions.length !== 1 ? 's' : ''} &middot; Day {day}
          </p>
        </div>
      </div>

      {/* Day toggle */}
      <div className="flex gap-2 px-5 pb-3">
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

      {/* Conflict warning */}
      {conflicts.size > 0 && (
        <div className="mx-5 mb-3 flex items-center gap-2 rounded-lg border border-loot-gold/20 bg-loot-gold/5 px-3 py-2">
          <AlertTriangle size={14} className="shrink-0 text-loot-gold" />
          <p className="font-mono text-[11px] text-loot-gold">
            {conflicts.size / 2} overlapping session{conflicts.size > 2 ? 's' : ''} detected
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {loading && (
          <p className="py-8 text-center font-mono text-xs text-fog-gray">Loading schedule…</p>
        )}

        {!loading && daySessions.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16">
            <CalendarDays size={40} className="text-fog-gray/30" />
            <p className="max-w-[220px] text-center font-mono text-xs text-fog-gray">
              No sessions saved yet. Browse the agenda to build your schedule.
            </p>
            <Button variant="primary" onClick={() => navigate('/agenda')}>
              <CalendarDays size={16} />
              Browse Agenda
            </Button>
          </div>
        )}

        {daySessions.map((session) => {
          const Icon = typeIcon[session.session_type]
          const hasConflict = conflicts.has(session.id)

          return (
            <div key={session.id} className="flex gap-3 pb-3">
              {/* Time column */}
              <div className="flex w-12 shrink-0 flex-col items-end pt-3.5">
                <span className="font-mono text-xs font-bold text-terminal-white">
                  {fmtTime(session.start_time)}
                </span>
                <span className="font-mono text-[10px] text-fog-gray">
                  {fmtTime(session.end_time)}
                </span>
              </div>

              {/* Track color bar */}
              <div className={`w-0.5 shrink-0 rounded-full ${trackBar[session.track]}`} />

              {/* Card */}
              <motion.div
                className="min-w-0 flex-1 cursor-pointer"
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSession(session)}
              >
                <Card
                  className={hasConflict ? 'border-loot-gold/30' : ''}
                  glow={hasConflict ? 'gold' : 'none'}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Icon size={12} className={typeColor[session.session_type]} />
                        <Badge color={trackColor[session.track]}>{session.track}</Badge>
                        {hasConflict && (
                          <Badge color="gold">
                            <AlertTriangle size={9} className="mr-0.5" />
                            Conflict
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-mono text-sm font-bold leading-snug text-terminal-white">
                        {session.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-fog-gray">
                        <span className="inline-flex items-center gap-0.5">
                          <MapPin size={10} />
                          {session.room}
                        </span>
                        {session.speaker_names.length > 0 && (
                          <span className="truncate">
                            {session.speaker_names.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeSession(session.id)
                      }}
                      className="shrink-0 rounded-md p-1.5 text-fog-gray transition-colors hover:bg-boss-magenta/10 hover:text-boss-magenta"
                      aria-label="Remove from schedule"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            </div>
          )
        })}
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
