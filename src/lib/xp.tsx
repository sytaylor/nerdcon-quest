import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

export interface Mission {
  id: string
  name: string
  description: string
  xp_reward: number
  type: 'social' | 'content' | 'explore' | 'side'
  progress: number
  target: number
  completed: boolean
  completed_at: string | null
}

export interface XPToast {
  id: string
  message: string
  xp: number
}

interface XPState {
  missions: Mission[]
  totalXP: number
  level: number
  levelLabel: string
  levelProgress: number
  checkMissions: () => Promise<void>
  scheduleCount: number
  connectionCount: number
  toasts: XPToast[]
  dismissToast: (id: string) => void
}

interface LevelInfo {
  level: number
  label: string
  min: number
  max: number
}

const LEVELS: LevelInfo[] = [
  { level: 1, label: 'Newbie', min: 0, max: 199 },
  { level: 2, label: 'Apprentice', min: 200, max: 499 },
  { level: 3, label: 'Operator', min: 500, max: 999 },
  { level: 4, label: 'Veteran', min: 1000, max: 1499 },
  { level: 5, label: 'Legend', min: 1500, max: Infinity },
]

export function getLevelInfo(xp: number): { level: number; label: string; progress: number } {
  const info = LEVELS.find((l) => xp >= l.min && xp <= l.max) ?? LEVELS[0]
  const range = info.max === Infinity ? 500 : info.max - info.min + 1
  const progress = Math.min((xp - info.min) / range, 1)
  return { level: info.level, label: info.label, progress }
}

export function buildMissions(
  scheduleCount: number,
  connectionCount: number,
  rsvpCount: number,
  messageCount: number,
  sponsorVisitCount: number
): Mission[] {
  const now = new Date().toISOString()

  function mission(
    id: string,
    name: string,
    description: string,
    xp_reward: number,
    type: Mission['type'],
    progress: number,
    target: number
  ): Mission {
    const completed = progress >= target
    return {
      id,
      name,
      description,
      xp_reward,
      type,
      progress,
      target,
      completed,
      completed_at: completed ? now : null,
    }
  }

  return [
    mission(
      'plan-ahead',
      'Plan Ahead',
      'Add 3+ sessions to your schedule',
      50,
      'content',
      Math.min(scheduleCount, 3),
      3
    ),
    mission(
      'first-blood',
      'First Blood',
      'Make your first connection via QR scan',
      50,
      'social',
      Math.min(connectionCount, 1),
      1
    ),
    mission(
      'party-up',
      'Party Up',
      'Make 3+ connections',
      75,
      'social',
      Math.min(connectionCount, 3),
      3
    ),
    mission(
      'social-butterfly',
      'Social Butterfly',
      'RSVP to 2+ social events',
      75,
      'explore',
      Math.min(rsvpCount, 2),
      2
    ),
    mission(
      'guild-master',
      'Guild Master',
      'Connect with 10+ people',
      200,
      'social',
      Math.min(connectionCount, 10),
      10
    ),
    mission(
      'party-chatter',
      'Party Chatter',
      'Send 10 messages in party chat',
      50,
      'social',
      Math.min(messageCount, 10),
      10
    ),
    mission(
      'booth-crawler',
      'Booth Crawler',
      'Visit 5 sponsor booths',
      100,
      'explore',
      Math.min(sponsorVisitCount, 5),
      5
    ),
    mission(
      'sponsor-champion',
      'Sponsor Champion',
      'Complete all 12 sponsor side quests',
      300,
      'side',
      Math.min(sponsorVisitCount, 12),
      12
    ),
  ]
}

const MOCK_MISSIONS = buildMissions(2, 1, 0, 3, 2)
const MOCK_XP = MOCK_MISSIONS.filter((m) => m.completed).reduce((s, m) => s + m.xp_reward, 0)

const XPContext = createContext<XPState | null>(null)

export function XPProvider({ children }: { children: ReactNode }) {
  const { user, profile, refreshProfile } = useAuth()
  const [missions, setMissions] = useState<Mission[]>(DEV_MODE ? MOCK_MISSIONS : [])
  const [scheduleCount, setScheduleCount] = useState(DEV_MODE ? 2 : 0)
  const [connectionCount, setConnectionCount] = useState(DEV_MODE ? 1 : 0)
  const [totalXP, setTotalXP] = useState(DEV_MODE ? MOCK_XP : 0)
  const lastSyncedXP = useRef<number>(DEV_MODE ? MOCK_XP : profile?.xp ?? 0)
  const [toasts, setToasts] = useState<XPToast[]>([])

  // Load previously completed missions from profile
  const savedCompletions = profile?.completed_missions
  const completedMissionIds = useRef<Set<string>>(
    DEV_MODE
      ? new Set(MOCK_MISSIONS.filter((m) => m.completed).map((m) => m.id))
      : new Set(savedCompletions ?? [])
  )

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const checkMissions = useCallback(async () => {
    if (DEV_MODE || !user) return

    const userId = user.id

    // Fetch counts in parallel
    const [scheduleRes, connectionsRes, rsvpRes, messagesRes, sponsorRes] = await Promise.all([
      supabase
        .from('user_schedule')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .or(`user_a.eq.${userId},user_b.eq.${userId}`),
      supabase
        .from('user_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .then((res) => {
          // Table may not exist yet — treat errors as 0
          if (res.error) return { count: 0 }
          return res
        }),
      supabase
        .from('party_messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', userId)
        .eq('message_type', 'text')
        .then((res) => {
          if (res.error) return { count: 0 }
          return res
        }),
      supabase
        .from('sponsor_visits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .then((res) => {
          if (res.error) return { count: 0 }
          return res
        }),
    ])

    const sc = scheduleRes.count ?? 0
    const cc = connectionsRes.count ?? 0
    const rc = (rsvpRes as { count: number }).count ?? 0
    const mc = (messagesRes as { count: number }).count ?? 0
    const svc = (sponsorRes as { count: number }).count ?? 0

    setScheduleCount(sc)
    setConnectionCount(cc)

    const newMissions = buildMissions(sc, cc, rc, mc, svc)
    setMissions(newMissions)

    // Fire toasts for newly completed missions
    for (const m of newMissions) {
      if (m.completed && !completedMissionIds.current.has(m.id)) {
        completedMissionIds.current.add(m.id)
        setToasts((prev) => [
          ...prev,
          { id: `${m.id}-${Date.now()}`, message: m.name, xp: m.xp_reward },
        ])
      }
    }

    const xp = newMissions.filter((m) => m.completed).reduce((s, m) => s + m.xp_reward, 0)
    setTotalXP(xp)

    // Sync XP and completed missions to profile if changed
    if (xp !== lastSyncedXP.current) {
      lastSyncedXP.current = xp
      const { error } = await supabase.rpc('sync_profile_missions')
      if (!error) await refreshProfile()
    }
  }, [user, refreshProfile])

  // Check on mount
  useEffect(() => {
    checkMissions()
  }, [checkMissions])

  const { level, label: levelLabel, progress: levelProgress } = getLevelInfo(totalXP)

  return (
    <XPContext.Provider
      value={{
        missions,
        totalXP,
        level,
        levelLabel,
        levelProgress,
        checkMissions,
        scheduleCount,
        connectionCount,
        toasts,
        dismissToast,
      }}
    >
      {children}
    </XPContext.Provider>
  )
}

export function useXP() {
  const ctx = useContext(XPContext)
  if (!ctx) throw new Error('useXP must be used within XPProvider')
  return ctx
}
