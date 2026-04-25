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
  Plus,
  Check,
  AlertTriangle,
  Trash2,
  CalendarDays,
  Swords,
  ChevronRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'
import { XPBar } from '../components/XPBar'
import { SegmentedControl } from '../components/SegmentedControl'
import { useSessions, useUserSchedule, useRSVP, type Session } from '../lib/sessions'
import { useSponsors, useSponsorVisits, type Sponsor } from '../lib/sponsors'
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
  const navigate = useNavigate()
  const [view, setView] = useState('missions')
  const [day, setDay] = useState<1 | 2>(1)
  const [trackFilter, setTrackFilter] = useState<Session['track'] | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  const { sessions, loading: sessionsLoading } = useSessions({ day })
  const { schedule, isInSchedule, addSession, removeSession, loading: scheduleLoading } = useUserSchedule()
  const xp = useXP()
  const socialSessions = useSessions({ session_type: 'social' })
  const rsvp = useRSVP()
  const { sponsors } = useSponsors()
  const sponsorVisits = useSponsorVisits()

  const completableMissions = xp.missions.filter(m => !m.completed && m.progress >= m.target).length
  const scheduleCount = schedule.length

  const segments = [
    { key: 'missions', label: 'Missions', dot: completableMissions > 0 },
    { key: 'agenda', label: 'Agenda' },
    { key: 'schedule', label: 'Schedule', badge: scheduleCount > 0 ? scheduleCount : null },
    { key: 'events', label: 'Events' },
  ]

  // Mission tap handlers — navigate to relevant view/tab
  function handleMissionTap(missionId: string) {
    switch (missionId) {
      case 'plan-ahead':
      case 'social-butterfly':
        setView('agenda')
        if (missionId === 'social-butterfly') setTrackFilter(null) // show all so social events are visible
        break
      case 'first-blood':
      case 'guild-master':
        navigate('/profile') // QR scanner is on profile
        break
      case 'party-up':
        navigate('/party')
        break
      case 'party-chatter':
        navigate('/party')
        break
      case 'booth-crawler':
      case 'sponsor-champion':
        setView('events')
        break
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col" style={{ paddingTop: 'calc(var(--sat) + 0.75rem)' }}>
      {/* Header */}
      <div className="px-5 pb-2">
        <h1 className="font-mono text-lg font-bold text-terminal-white">Quests</h1>
      </div>

      {/* Segmented control */}
      <div className="px-5 pb-3">
        <SegmentedControl segments={segments} active={view} onChange={setView} />
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {view === 'missions' && (
          <MissionsView xp={xp} onMissionTap={handleMissionTap} />
        )}
        {view === 'agenda' && (
          <AgendaView
            sessions={sessions}
            loading={sessionsLoading}
            day={day}
            setDay={setDay}
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
            setDay={setDay}
            loading={scheduleLoading}
            removeSession={removeSession}
            onSelect={setSelectedSession}
          />
        )}
        {view === 'events' && (
          <EventsView
            socialSessions={socialSessions.sessions}
            rsvp={rsvp}
            sponsors={sponsors}
            sponsorVisits={sponsorVisits}
            onSelect={setSelectedSession}
            xp={xp}
          />
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
  day: 1 | 2
  setDay: (d: 1 | 2) => void
  trackFilter: Session['track'] | null
  setTrackFilter: (t: Session['track'] | null) => void
  isInSchedule: (id: string) => boolean
  addSession: (id: string) => void
  removeSession: (id: string) => void
  onSelect: (s: Session) => void
}

function AgendaView({ sessions, loading, day, setDay, trackFilter, setTrackFilter, isInSchedule, addSession, removeSession, onSelect }: AgendaViewProps) {
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
    if (isInSchedule(session.id)) {
      removeSession(session.id)
    } else {
      addSession(session.id)
    }
  }

  return (
    <>
      {/* Day toggle + track filters */}
      <div className="flex items-center gap-2 px-5 pb-2">
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
        <span className="font-mono text-[11px] text-fog-gray">·</span>
        <span className="font-mono text-[11px] text-fog-gray">Nov {day === 1 ? 19 : 20}</span>
      </div>
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
  setDay: (d: 1 | 2) => void
  loading: boolean
  removeSession: (id: string) => void
  onSelect: (s: Session) => void
}

function ScheduleView({ schedule, day, setDay, loading, removeSession, onSelect }: ScheduleViewProps) {
  const daySessions = useMemo(
    () => schedule.filter((s) => s.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [schedule, day],
  )
  const conflicts = useMemo(() => detectConflicts(daySessions), [daySessions])

  return (
    <div className="px-5 pb-24">
      {/* Day toggle */}
      <div className="mb-3 flex items-center gap-2">
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
        <span className="font-mono text-[11px] text-fog-gray">
          · {daySessions.length} session{daySessions.length !== 1 ? 's' : ''}
        </span>
      </div>

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
  onMissionTap: (missionId: string) => void
}

function MissionsView({ xp, onMissionTap }: MissionsViewProps) {
  const LEVEL_MAX = [200, 500, 1000, 1500, 2000]
  const currentMax = LEVEL_MAX[Math.min(xp.level - 1, LEVEL_MAX.length - 1)]

  return (
    <div className="px-5 pb-24">
      {/* XP summary */}
      <div className="mb-6">
        <XPBar current={xp.totalXP} max={currentMax} level={xp.level} label={xp.levelLabel} />
      </div>



      {/* Active missions */}
      <div className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-fog-gray">Missions</h2>
        {xp.missions.map((m) => (
          <motion.div
            key={m.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => !m.completed && onMissionTap(m.id)}
            className={!m.completed ? 'cursor-pointer' : ''}
          >
            <Card className={m.completed ? 'border-xp-green/20' : ''}>
              <div className="flex items-start gap-3">
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
                <div className="flex flex-col items-end gap-1.5">
                  <Badge color={m.completed ? 'green' : 'gold'}>
                    {m.completed ? '✓' : '+'}{m.xp_reward} XP
                  </Badge>
                  {!m.completed && (
                    <ChevronRight size={14} className="text-fog-gray/40" />
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ─── Events View (Social Events + Sponsors) ─── */

interface EventsViewProps {
  socialSessions: Session[]
  rsvp: ReturnType<typeof useRSVP>
  sponsors: Sponsor[]
  sponsorVisits: ReturnType<typeof useSponsorVisits>
  onSelect: (s: Session) => void
  xp: ReturnType<typeof useXP>
}

function EventsView({ socialSessions, rsvp, sponsors, sponsorVisits, onSelect, xp }: EventsViewProps) {
  const categoryLabel: Record<string, string> = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver' }
  const categoryGlow: Record<string, 'cyan' | 'gold' | 'none'> = { platinum: 'cyan', gold: 'gold', silver: 'none' }
  const categoryBorder: Record<string, string> = { platinum: 'border-cyan-pulse/30', gold: 'border-loot-gold/20', silver: 'border-white/10' }

  const grouped = sponsors.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {} as Record<string, Sponsor[]>)

  return (
    <div className="px-5 pb-24">
      {/* Social Events */}
      <div className="mb-6 space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-fog-gray">
          Social Events
        </h2>
        {socialSessions.length === 0 && (
          <Card><p className="text-center text-sm text-fog-gray">No social events loaded</p></Card>
        )}
        {socialSessions.map((session) => {
          const hasRsvp = rsvp.hasRSVP(session.id)
          return (
            <motion.div key={session.id} whileTap={{ scale: 0.98 }}>
              <Card className={hasRsvp ? 'border-xp-green/20' : ''}>
                <div className="flex items-start gap-3" onClick={() => onSelect(session)}>
                  <div className="flex-1 cursor-pointer">
                    <div className="mb-1 flex items-center gap-2">
                      <Users size={13} className="text-xp-green" />
                      <Badge color="gray">Day {session.day}</Badge>
                      <span className="font-mono text-[10px] text-fog-gray">
                        {fmtTime(session.start_time)}–{fmtTime(session.end_time)}
                      </span>
                    </div>
                    <h3 className="font-mono text-sm font-bold text-terminal-white">{session.title}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-fog-gray">
                      <MapPin size={10} />{session.room}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); rsvp.toggleRSVP(session.id); xp.checkMissions() }}
                    className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 font-mono text-[11px] font-medium transition-all ${
                      hasRsvp
                        ? 'bg-xp-green/15 text-xp-green'
                        : 'border border-white/10 bg-panel-dark text-fog-gray hover:border-xp-green/40 hover:text-xp-green'
                    }`}
                  >
                    {hasRsvp ? <Check size={12} /> : <Plus size={12} />}
                    {hasRsvp ? 'Going' : 'RSVP'}
                  </button>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Sponsor Side Quests */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-wider text-fog-gray">
            Sponsor Side Quests
          </h2>
          <Badge color="gold">{sponsorVisits.visitCount}/{sponsors.length}</Badge>
        </div>

        {(['platinum', 'gold', 'silver'] as const).map((tier) => {
          const tierSponsors = grouped[tier]
          if (!tierSponsors || tierSponsors.length === 0) return null

          return (
            <div key={tier} className="space-y-2">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-fog-gray/60">
                {categoryLabel[tier]} Sponsors
              </h3>
              {tierSponsors.map((sponsor) => {
                const visited = sponsorVisits.hasVisited(sponsor.id)
                return (
                  <motion.div key={sponsor.id} whileTap={{ scale: 0.98 }}>
                    <Card
                      glow={visited ? 'none' : categoryGlow[sponsor.category]}
                      className={visited ? 'border-xp-green/20' : categoryBorder[sponsor.category]}
                    >
                      <div className="flex items-start gap-3">
                        {/* Logo emoji */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xl">
                          {sponsor.logo_emoji}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-terminal-white">{sponsor.name}</span>
                            <Badge color="gray">{sponsor.booth_number}</Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-fog-gray">{sponsor.tagline}</p>

                          {/* Side quest */}
                          <div className="mt-2 flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5">
                            {visited ? (
                              <Check size={12} className="shrink-0 text-xp-green" />
                            ) : (
                              <Swords size={12} className="shrink-0 text-loot-gold" />
                            )}
                            <span className={`font-mono text-[11px] ${visited ? 'text-xp-green' : 'text-terminal-white'}`}>
                              {sponsor.side_quest_title}
                            </span>
                            <Badge color={visited ? 'green' : 'gold'}>
                              {visited ? '✓' : '+'}{sponsor.side_quest_xp} XP
                            </Badge>
                          </div>
                          {!visited && (
                            <p className="mt-1 text-[11px] text-fog-gray/70">{sponsor.side_quest_description}</p>
                          )}
                        </div>

                        {/* Complete button */}
                        {!visited && (
                          <button
                            onClick={() => sponsorVisits.recordVisit(sponsor.id)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-loot-gold/20 bg-loot-gold/5 text-loot-gold transition-all hover:bg-loot-gold/15"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
