import { useState, useMemo } from 'react'
import {
  Flame,
  MessageSquare,
  Wrench,
  Coffee,
  Zap,
  Users,
  Clock,
  MapPin,
  Plus,
  Check,
  AlertTriangle,
  Trash2,
  CalendarDays,
  Swords,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'
import { XPBar } from '../components/XPBar'
import { SegmentedControl } from '../components/SegmentedControl'
import { useSessions, useUserSchedule, type Session } from '../lib/sessions'
import { SessionDetailSheet } from './SessionDetailSheet'
import { fmtTime } from '../lib/format'
import { useXP } from '../lib/xp'

/* ─── Shared Configs ─── */

const trackColor: Record<Session['track'], 'cyan' | 'blue' | 'green' | 'gray'> = {
  builder: 'cyan', operator: 'blue', explorer: 'green', general: 'gray',
}
const trackBorder: Record<Session['track'], string> = {
  builder: 'border-l-cyan-pulse', operator: 'border-l-nerdcon-blue',
  explorer: 'border-l-xp-green', general: 'border-l-fog-gray',
}
const trackBar: Record<Session['track'], string> = {
  builder: 'bg-cyan-pulse', operator: 'bg-nerdcon-blue',
  explorer: 'bg-xp-green', general: 'bg-fog-gray',
}
const typeIcon: Record<Session['session_type'], typeof Flame> = {
  keynote: Flame, panel: MessageSquare, workshop: Wrench,
  fireside: Coffee, lightning: Zap, social: Users,
}
const typeColor: Record<Session['session_type'], string> = {
  keynote: 'text-boss-magenta', panel: 'text-nerdcon-blue',
  workshop: 'text-cyan-pulse', fireside: 'text-loot-gold',
  lightning: 'text-cyan-pulse', social: 'text-xp-green',
}

const TRACKS = [
  { key: null, label: 'All' },
  { key: 'builder' as const, label: 'Builder' },
  { key: 'operator' as const, label: 'Operator' },
  { key: 'explorer' as const, label: 'Explorer' },
] as const

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function detectConflicts(sessions: Session[]): Set<string> {
  const c = new Set<string>()
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const a = sessions[i], b = sessions[j]
      if (a.day !== b.day) continue
      if (timeToMinutes(a.start_time) < timeToMinutes(b.end_time) &&
          timeToMinutes(b.start_time) < timeToMinutes(a.end_time)) {
        c.add(a.id); c.add(b.id)
      }
    }
  }
  return c
}

/* ─── Main Component ─── */

export function MissionsTab() {
  const [view, setView] = useState('agenda')
  const [day, setDay] = useState<1 | 2>(1)
  const [trackFilter, setTrackFilter] = useState<Session['track'] | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  const { sessions, loading: sessionsLoading } = useSessions({ day })
  const { schedule, isInSchedule, addSession, removeSession, loading: scheduleLoading } = useUserSchedule()
  const xp = useXP()

  const completableMissions = xp.missions.filter(m => !m.completed && m.progress >= m.target).length
  const scheduleCount = schedule.length

  const segments = [
    { key: 'agenda', label: 'Agenda' },
    { key: 'schedule', label: 'Schedule', badge: scheduleCount > 0 ? scheduleCount : null },
    { key: 'missions', label: 'Missions', dot: completableMissions > 0 },
  ]

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col" style={{ paddingTop: 'calc(var(--sat) + 0.75rem)' }}>
      {/* Header row: title + day toggle */}
      <div className="flex items-center justify-between px-5 pb-2">
        <h1 className="font-mono text-lg font-bold text-terminal-white">Quests</h1>
        <div className="flex gap-1.5">
          {([1, 2] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`rounded-full px-3 py-1 font-mono text-[11px] font-medium transition-colors ${
                day === d
                  ? 'bg-nerdcon-blue text-terminal-white'
                  : 'border border-white/10 text-fog-gray'
              }`}
            >
              Day {d}
            </button>
          ))}
        </div>
      </div>

      {/* Segmented control */}
      <div className="px-5 pb-3">
        <SegmentedControl segments={segments} active={view} onChange={setView} />
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {view === 'agenda' && (
          <AgendaView
            sessions={sessions}
            loading={sessionsLoading}
            trackFilter={trackFilter}
            setTrackFilter={setTrackFilter}
            isInSchedule={isInSchedule}
            addSession={addSession}
            removeSession={removeSession}
            onSelect={setSelectedSession}
          />
        )}
        {view === 'schedule' && (
          <ScheduleView
            schedule={schedule}
            day={day}
            loading={scheduleLoading}
            removeSession={removeSession}
            onSelect={setSelectedSession}
          />
        )}
        {view === 'missions' && (
          <MissionsView xp={xp} />
        )}
      </div>

      <SessionDetailSheet
        session={selectedSession}
        open={!!selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  )
}

/* ─── Agenda View ─── */

interface AgendaViewProps {
  sessions: Session[]
  loading: boolean
  trackFilter: Session['track'] | null
  setTrackFilter: (t: Session['track'] | null) => void
  isInSchedule: (id: string) => boolean
  addSession: (id: string) => void
  removeSession: (id: string) => void
  onSelect: (s: Session) => void
}

function AgendaView({ sessions, loading, trackFilter, setTrackFilter, isInSchedule, addSession, removeSession, onSelect }: AgendaViewProps) {
  const filtered = useMemo(() => {
    if (!trackFilter) return sessions
    return sessions.filter((s) => s.track === trackFilter || s.track === 'general')
  }, [sessions, trackFilter])

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
    isInSchedule(session.id) ? removeSession(session.id) : addSession(session.id)
  }

  return (
    <>
      <div className="flex gap-1.5 overflow-x-auto px-5 pb-3">
        {TRACKS.map((t) => (
          <button
            key={t.label}
            onClick={() => setTrackFilter(t.key)}
            className={`shrink-0 rounded-full px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider transition-colors ${
              trackFilter === t.key
                ? 'bg-nerdcon-blue/15 text-nerdcon-blue border border-nerdcon-blue/30'
                : 'border border-white/5 bg-panel-dark text-fog-gray'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-6 px-5 pb-24">
        {loading && <p className="py-8 text-center font-mono text-xs text-fog-gray">Loading sessions...</p>}
        {!loading && grouped.length === 0 && <p className="py-8 text-center font-mono text-xs text-fog-gray">No sessions match your filters.</p>}

        {grouped.map(([timeSlot, slotSessions]) => (
          <div key={timeSlot}>
            <div className="mb-2 flex items-center gap-2">
              <Clock size={12} className="text-fog-gray" />
              <span className="font-mono text-xs font-medium text-fog-gray">{timeSlot}</span>
            </div>
            <div className="space-y-2">
              {slotSessions.map((session) => {
                const Icon = typeIcon[session.session_type]
                const inSchedule = isInSchedule(session.id)
                return (
                  <motion.div key={session.id} whileTap={{ scale: 0.98 }} onClick={() => onSelect(session)} className="cursor-pointer">
                    <Card className={`border-l-2 ${trackBorder[session.track]} !rounded-l-none`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex items-center gap-1.5">
                            <Icon size={13} className={typeColor[session.session_type]} />
                            <Badge color={trackColor[session.track]}>{session.track}</Badge>
                          </div>
                          <h3 className="font-mono text-sm font-bold leading-snug text-terminal-white">{session.title}</h3>
                          <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-fog-gray">
                            <span className="inline-flex items-center gap-0.5"><MapPin size={10} />{session.room}</span>
                            {session.speaker_names.length > 0 && (
                              <span className="inline-flex items-center gap-0.5"><Users size={10} />{session.speaker_names.join(', ')}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleQuickAdd(e, session)}
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all ${
                            inSchedule
                              ? 'bg-xp-green/15 text-xp-green shadow-glow-green'
                              : 'border border-white/10 bg-panel-dark text-fog-gray hover:border-nerdcon-blue/40 hover:text-nerdcon-blue'
                          }`}
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
    </>
  )
}

/* ─── Schedule View ─── */

interface ScheduleViewProps {
  schedule: Session[]
  day: 1 | 2
  loading: boolean
  removeSession: (id: string) => void
  onSelect: (s: Session) => void
}

function ScheduleView({ schedule, day, loading, removeSession, onSelect }: ScheduleViewProps) {
  const daySessions = useMemo(
    () => schedule.filter((s) => s.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [schedule, day],
  )
  const conflicts = useMemo(() => detectConflicts(daySessions), [daySessions])

  return (
    <div className="px-5 pb-24">
      {conflicts.size > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-loot-gold/20 bg-loot-gold/5 px-3 py-2">
          <AlertTriangle size={14} className="shrink-0 text-loot-gold" />
          <p className="font-mono text-[11px] text-loot-gold">Overlapping sessions detected</p>
        </div>
      )}

      {loading && <p className="py-8 text-center font-mono text-xs text-fog-gray">Loading schedule...</p>}

      {!loading && daySessions.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16">
          <CalendarDays size={40} className="text-fog-gray/30" />
          <p className="max-w-[220px] text-center font-mono text-xs text-fog-gray">
            No sessions saved for Day {day}. Tap + on the Agenda to add sessions.
          </p>
        </div>
      )}

      {daySessions.map((session) => {
        const Icon = typeIcon[session.session_type]
        const hasConflict = conflicts.has(session.id)
        return (
          <div key={session.id} className="flex gap-3 pb-3">
            <div className="flex w-12 shrink-0 flex-col items-end pt-3.5">
              <span className="font-mono text-xs font-bold text-terminal-white">{fmtTime(session.start_time)}</span>
              <span className="font-mono text-[10px] text-fog-gray">{fmtTime(session.end_time)}</span>
            </div>
            <div className={`w-0.5 shrink-0 rounded-full ${trackBar[session.track]}`} />
            <motion.div className="min-w-0 flex-1 cursor-pointer" whileTap={{ scale: 0.98 }} onClick={() => onSelect(session)}>
              <Card className={hasConflict ? 'border-loot-gold/30' : ''} glow={hasConflict ? 'gold' : 'none'}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-1.5">
                      <Icon size={12} className={typeColor[session.session_type]} />
                      <Badge color={trackColor[session.track]}>{session.track}</Badge>
                      {hasConflict && <Badge color="gold"><AlertTriangle size={9} className="mr-0.5" />Conflict</Badge>}
                    </div>
                    <h3 className="font-mono text-sm font-bold leading-snug text-terminal-white">{session.title}</h3>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-fog-gray">
                      <span className="inline-flex items-center gap-0.5"><MapPin size={10} />{session.room}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeSession(session.id) }}
                    className="shrink-0 rounded-md p-1.5 text-fog-gray transition-colors hover:bg-boss-magenta/10 hover:text-boss-magenta"
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
  )
}

/* ─── Missions View ─── */

interface MissionsViewProps {
  xp: ReturnType<typeof useXP>
}

function MissionsView({ xp }: MissionsViewProps) {
  return (
    <div className="px-5 pb-24">
      {/* XP summary */}
      <div className="mb-6">
        <XPBar current={xp.totalXP} max={xp.levelProgress < 1 ? Math.ceil(xp.totalXP / xp.levelProgress) : xp.totalXP} level={xp.level} label={xp.levelLabel} />
      </div>

      {/* Active missions */}
      <div className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-fog-gray">Missions</h2>
        {xp.missions.map((m) => (
          <Card key={m.id} className={m.completed ? 'border-xp-green/20' : ''}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {m.completed ? (
                    <Check size={14} className="text-xp-green" />
                  ) : m.progress >= m.target ? (
                    <Swords size={14} className="text-loot-gold animate-pulse" />
                  ) : (
                    <Swords size={14} className="text-nerdcon-blue" />
                  )}
                  <span className={`font-mono text-sm font-bold ${m.completed ? 'text-xp-green' : 'text-terminal-white'}`}>
                    {m.name}
                  </span>
                </div>
                <p className="mt-1 text-xs text-fog-gray">{m.description}</p>
                {/* Progress bar */}
                {!m.completed && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        className={`h-full rounded-full ${m.progress >= m.target ? 'bg-loot-gold' : 'bg-nerdcon-blue'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((m.progress / m.target) * 100, 100)}%` }}
                        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-fog-gray">{m.progress}/{m.target}</span>
                  </div>
                )}
              </div>
              <Badge color={m.completed ? 'green' : 'gold'}>
                {m.completed ? '✓' : '+'}{m.xp_reward} XP
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
