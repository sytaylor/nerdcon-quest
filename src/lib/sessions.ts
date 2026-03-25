import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

/* ─── Types ─── */

export interface Session {
  id: string
  title: string
  description: string
  track: 'builder' | 'operator' | 'explorer' | 'general'
  session_type: 'keynote' | 'panel' | 'workshop' | 'fireside' | 'lightning' | 'social'
  room: string
  day: 1 | 2
  start_time: string
  end_time: string
  speaker_names: string[]
  speaker_bios: { name: string; bio: string; company: string; role: string }[]
  capacity: number | null
  tags: string[]
}

export interface UseSessionsOptions {
  day?: 1 | 2
  track?: Session['track']
  session_type?: Session['session_type']
}

/* ─── useSessions ─── */

export function useSessions(options: UseSessionsOptions = {}) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      if (!DEV_MODE) {
        try {
          let query = supabase.from('sessions').select('*')
          if (options.day) query = query.eq('day', options.day)
          if (options.track) query = query.eq('track', options.track)
          if (options.session_type) query = query.eq('session_type', options.session_type)
          query = query.order('start_time', { ascending: true })

          const { data, error: err } = await query
          if (!cancelled && data && data.length > 0) {
            setSessions(data as Session[])
            setLoading(false)
            return
          }
          if (err) console.warn('Supabase sessions fetch failed, using stubs:', err.message)
        } catch {
          console.warn('Supabase unavailable, using stub sessions')
        }
      }

      if (cancelled) return
      let filtered = [...STUB_SESSIONS]
      if (options.day) filtered = filtered.filter((s) => s.day === options.day)
      if (options.track) filtered = filtered.filter((s) => s.track === options.track)
      if (options.session_type) filtered = filtered.filter((s) => s.session_type === options.session_type)
      filtered.sort((a, b) => a.start_time.localeCompare(b.start_time))
      setSessions(filtered)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [options.day, options.track, options.session_type])

  return { sessions, loading, error }
}

/* ─── useUserSchedule ─── */

export function useUserSchedule() {
  const { user } = useAuth()
  const [schedule, setSchedule] = useState<Session[]>([])
  const [ids, setIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const fetchSchedule = useCallback(async () => {
    if (!user) { setSchedule([]); setIds(new Set()); setLoading(false); return }

    if (DEV_MODE) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_schedule')
        .select('session_id, sessions(*)')
        .eq('user_id', user.id)

      if (error) throw error
      const rows = (data ?? []).map((r: any) => r.sessions as Session).filter(Boolean)
      setSchedule(rows)
      setIds(new Set(rows.map((s) => s.id)))
    } catch {
      console.warn('Could not fetch user schedule, using local state')
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchSchedule() }, [fetchSchedule])

  const addSession = useCallback(async (sessionId: string) => {
    if (!user) return
    setIds((prev) => new Set(prev).add(sessionId))

    if (DEV_MODE) {
      const stub = STUB_SESSIONS.find((s) => s.id === sessionId)
      if (stub) setSchedule((prev) => [...prev, stub])
      return
    }

    try {
      await supabase.from('user_schedule').insert({ user_id: user.id, session_id: sessionId })
      await fetchSchedule()
    } catch {
      setIds((prev) => { const n = new Set(prev); n.delete(sessionId); return n })
    }
  }, [user, fetchSchedule])

  const removeSession = useCallback(async (sessionId: string) => {
    if (!user) return
    setIds((prev) => { const n = new Set(prev); n.delete(sessionId); return n })
    setSchedule((prev) => prev.filter((s) => s.id !== sessionId))

    if (DEV_MODE) return

    try {
      await supabase.from('user_schedule').delete().eq('user_id', user.id).eq('session_id', sessionId)
    } catch {
      await fetchSchedule()
    }
  }, [user, fetchSchedule])

  const isInSchedule = useCallback((sessionId: string) => ids.has(sessionId), [ids])

  return { schedule, addSession, removeSession, isInSchedule, loading }
}

/* ─── useRSVP (for social events) ─── */

export function useRSVP() {
  const { user } = useAuth()
  const [rsvpIds, setRsvpIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const fetchRSVPs = useCallback(async () => {
    if (!user || DEV_MODE) { setLoading(false); return }

    const { data } = await supabase
      .from('user_rsvps')
      .select('session_id')
      .eq('user_id', user.id)

    if (data) setRsvpIds(new Set(data.map((r: any) => r.session_id)))
    setLoading(false)
  }, [user])

  useEffect(() => { fetchRSVPs() }, [fetchRSVPs])

  const toggleRSVP = useCallback(async (sessionId: string) => {
    if (!user) return

    if (rsvpIds.has(sessionId)) {
      // Remove RSVP
      setRsvpIds((prev) => { const n = new Set(prev); n.delete(sessionId); return n })
      if (!DEV_MODE) {
        await supabase.from('user_rsvps').delete().eq('user_id', user.id).eq('session_id', sessionId)
      }
    } else {
      // Add RSVP
      setRsvpIds((prev) => new Set(prev).add(sessionId))
      if (!DEV_MODE) {
        await supabase.from('user_rsvps').upsert({ user_id: user.id, session_id: sessionId }, { onConflict: 'user_id,session_id' })
      }
    }
  }, [user, rsvpIds])

  const hasRSVP = useCallback((sessionId: string) => rsvpIds.has(sessionId), [rsvpIds])

  return { rsvpIds, rsvpCount: rsvpIds.size, hasRSVP, toggleRSVP, loading }
}

/* ─── Stub Data ─── */

export const STUB_SESSIONS: Session[] = [
  // ── Day 1: Nov 19, 2026 ──
  {
    id: 's-01',
    title: 'Welcome to NerdCon: The Fintech Quest Begins',
    description: 'Opening keynote setting the stage for two days of fintech exploration, demos, and community building.',
    track: 'general',
    session_type: 'keynote',
    room: 'Main Stage',
    day: 1,
    start_time: '09:00',
    end_time: '09:45',
    speaker_names: ['Simon Taylor'],
    speaker_bios: [{ name: 'Simon Taylor', bio: 'Fintech nerd-in-chief and founder of Fintech Brainfood.', company: 'Fintech Brainfood', role: 'Founder' }],
    capacity: null,
    tags: ['opening', 'keynote'],
  },
  {
    id: 's-02',
    title: 'Building the Real-Time Payments Stack',
    description: 'Deep dive into FedNow, RTP, and instant settlement architecture with live code demos.',
    track: 'builder',
    session_type: 'workshop',
    room: 'Workshop A',
    day: 1,
    start_time: '10:00',
    end_time: '11:30',
    speaker_names: ['Jas Shah', 'Reggie Young'],
    speaker_bios: [
      { name: 'Jas Shah', bio: 'Payments infrastructure architect and open-source contributor.', company: 'Moov', role: 'Head of Engineering' },
      { name: 'Reggie Young', bio: 'Payments nerd and compliance enthusiast.', company: 'Lithic', role: 'Head of Regulatory' },
    ],
    capacity: 60,
    tags: ['payments', 'real-time', 'FedNow'],
  },
  {
    id: 's-03',
    title: 'Embedded Finance: Strategy for Platform Operators',
    description: 'How platforms are monetizing financial services — and what the next wave looks like.',
    track: 'operator',
    session_type: 'panel',
    room: 'Main Stage',
    day: 1,
    start_time: '10:00',
    end_time: '10:50',
    speaker_names: ['Angela Strange', 'Matt Harris', 'Leda Glyptis'],
    speaker_bios: [
      { name: 'Angela Strange', bio: 'Fintech investor focused on embedded finance and infrastructure.', company: 'a16z', role: 'General Partner' },
      { name: 'Matt Harris', bio: 'Pioneer in fintech venture investing.', company: 'Bain Capital Ventures', role: 'Partner' },
      { name: 'Leda Glyptis', bio: 'Banking transformation strategist and author.', company: '10x Banking', role: 'Chief Client Officer' },
    ],
    capacity: null,
    tags: ['embedded-finance', 'platforms', 'strategy'],
  },
  {
    id: 's-04',
    title: 'Stablecoin Infrastructure: From Circle to On-Chain Rails',
    description: 'Technical workshop building a stablecoin payment flow end-to-end.',
    track: 'builder',
    session_type: 'workshop',
    room: 'Workshop B',
    day: 1,
    start_time: '11:00',
    end_time: '12:30',
    speaker_names: ['Austin Adams'],
    speaker_bios: [{ name: 'Austin Adams', bio: 'DeFi researcher and protocol engineer.', company: 'Uniswap Labs', role: 'Research Lead' }],
    capacity: 40,
    tags: ['stablecoins', 'crypto', 'on-chain'],
  },
  {
    id: 's-05',
    title: 'Lunch & Sponsor Demos',
    description: 'Grab lunch and tour the sponsor hall. Lightning demos on the hour.',
    track: 'general',
    session_type: 'social',
    room: 'Sponsor Hall',
    day: 1,
    start_time: '12:30',
    end_time: '14:00',
    speaker_names: [],
    speaker_bios: [],
    capacity: null,
    tags: ['lunch', 'networking', 'demos'],
  },
  {
    id: 's-06',
    title: 'Fireside: AI in Underwriting — Hype vs. Reality',
    description: 'Candid conversation about where AI is actually working in credit decisions.',
    track: 'operator',
    session_type: 'fireside',
    room: 'Main Stage',
    day: 1,
    start_time: '14:00',
    end_time: '14:45',
    speaker_names: ['Petal Founder', 'Jason Mikula'],
    speaker_bios: [
      { name: 'Petal Founder', bio: 'Built a credit card company on alternative data.', company: 'Petal', role: 'Co-founder' },
      { name: 'Jason Mikula', bio: 'Fintech analyst and newsletter author.', company: 'Fintech Business Weekly', role: 'Editor' },
    ],
    capacity: null,
    tags: ['AI', 'lending', 'underwriting'],
  },
  {
    id: 's-07',
    title: 'Lightning Talks: 5 APIs You Should Know',
    description: 'Five 8-minute talks showcasing the most exciting fintech APIs of 2026.',
    track: 'builder',
    session_type: 'lightning',
    room: 'Workshop A',
    day: 1,
    start_time: '15:00',
    end_time: '15:45',
    speaker_names: ['Various Speakers'],
    speaker_bios: [{ name: 'Various Speakers', bio: 'Builders from across the fintech ecosystem.', company: 'Various', role: 'Engineers' }],
    capacity: 60,
    tags: ['APIs', 'lightning', 'developer-tools'],
  },
  {
    id: 's-08',
    title: 'Networking: Find Your Co-Founder',
    description: 'Structured speed networking for people looking to build together.',
    track: 'explorer',
    session_type: 'social',
    room: 'Networking Hub',
    day: 1,
    start_time: '15:00',
    end_time: '16:00',
    speaker_names: [],
    speaker_bios: [],
    capacity: 80,
    tags: ['networking', 'co-founder', 'social'],
  },
  {
    id: 's-09',
    title: 'The Compliance-First Approach to Fintech Product',
    description: 'Why building compliance into your product from day one is a competitive advantage.',
    track: 'operator',
    session_type: 'panel',
    room: 'Main Stage',
    day: 1,
    start_time: '16:00',
    end_time: '16:50',
    speaker_names: ['Sarita Harbour', 'Dan Kimerling'],
    speaker_bios: [
      { name: 'Sarita Harbour', bio: 'Compliance and regtech expert.', company: 'Alloy', role: 'VP Compliance' },
      { name: 'Dan Kimerling', bio: 'Fintech investor focused on regulated infrastructure.', company: 'Deciens Capital', role: 'Managing Partner' },
    ],
    capacity: null,
    tags: ['compliance', 'regtech', 'product'],
  },
  {
    id: 's-10',
    title: 'Day 1 Happy Hour & Arcade Night',
    description: 'Retro arcade games, drinks, and vibes. Top scores win NerdCon loot.',
    track: 'general',
    session_type: 'social',
    room: 'Networking Hub',
    day: 1,
    start_time: '17:00',
    end_time: '19:00',
    speaker_names: [],
    speaker_bios: [],
    capacity: null,
    tags: ['social', 'arcade', 'party'],
  },

  // ── Day 2: Nov 20, 2026 ──
  {
    id: 's-11',
    title: 'Day 2 Kickoff: State of Fintech 2026',
    description: 'Data-driven overview of what is working, what is dying, and what comes next.',
    track: 'general',
    session_type: 'keynote',
    room: 'Main Stage',
    day: 2,
    start_time: '09:00',
    end_time: '09:45',
    speaker_names: ['Simon Taylor'],
    speaker_bios: [{ name: 'Simon Taylor', bio: 'Fintech nerd-in-chief and founder of Fintech Brainfood.', company: 'Fintech Brainfood', role: 'Founder' }],
    capacity: null,
    tags: ['keynote', 'state-of-fintech'],
  },
  {
    id: 's-12',
    title: 'Hands-On: Building with Open Banking APIs',
    description: 'Code-along workshop connecting to Plaid, TrueLayer, and MX in a single abstraction.',
    track: 'builder',
    session_type: 'workshop',
    room: 'Workshop A',
    day: 2,
    start_time: '10:00',
    end_time: '11:30',
    speaker_names: ['Zach Perret'],
    speaker_bios: [{ name: 'Zach Perret', bio: 'Open banking advocate and infrastructure builder.', company: 'Plaid', role: 'CEO' }],
    capacity: 50,
    tags: ['open-banking', 'APIs', 'workshop'],
  },
  {
    id: 's-13',
    title: 'Scaling a Neobank: Lessons from 0 to 10M Users',
    description: 'Operator playbook for scaling fintech consumer products past product-market fit.',
    track: 'operator',
    session_type: 'fireside',
    room: 'Main Stage',
    day: 2,
    start_time: '10:00',
    end_time: '10:50',
    speaker_names: ['Vlad Tenev'],
    speaker_bios: [{ name: 'Vlad Tenev', bio: 'Democratizing finance one product at a time.', company: 'Robinhood', role: 'CEO' }],
    capacity: null,
    tags: ['neobank', 'scaling', 'growth'],
  },
  {
    id: 's-14',
    title: 'Explorer Meetup: Europe × US Fintech Bridge',
    description: 'Informal meetup connecting European and US fintech operators and builders.',
    track: 'explorer',
    session_type: 'social',
    room: 'VIP Lounge',
    day: 2,
    start_time: '10:00',
    end_time: '11:00',
    speaker_names: [],
    speaker_bios: [],
    capacity: 30,
    tags: ['europe', 'networking', 'cross-border'],
  },
  {
    id: 's-15',
    title: 'Tokenization of Real-World Assets',
    description: 'From treasuries to real estate — how RWA tokenization actually works under the hood.',
    track: 'builder',
    session_type: 'panel',
    room: 'Workshop B',
    day: 2,
    start_time: '11:00',
    end_time: '11:50',
    speaker_names: ['Securitize Team', 'Ondo Finance'],
    speaker_bios: [
      { name: 'Securitize Team', bio: 'Pioneers in compliant digital securities.', company: 'Securitize', role: 'Engineering' },
      { name: 'Ondo Finance', bio: 'Bringing institutional finance on-chain.', company: 'Ondo Finance', role: 'Protocol Team' },
    ],
    capacity: null,
    tags: ['RWA', 'tokenization', 'crypto'],
  },
  {
    id: 's-16',
    title: 'Lunch & Demo Pit',
    description: 'Grab lunch and watch startups pitch in the demo pit. Vote for your favorite.',
    track: 'general',
    session_type: 'social',
    room: 'Sponsor Hall',
    day: 2,
    start_time: '12:00',
    end_time: '13:30',
    speaker_names: [],
    speaker_bios: [],
    capacity: null,
    tags: ['lunch', 'demos', 'startups'],
  },
  {
    id: 's-17',
    title: 'Lightning Talks: Regtech, AI Agents, and Beyond',
    description: 'Six rapid-fire talks on the bleeding edge of fintech infrastructure.',
    track: 'builder',
    session_type: 'lightning',
    room: 'Workshop A',
    day: 2,
    start_time: '13:30',
    end_time: '14:30',
    speaker_names: ['Various Speakers'],
    speaker_bios: [{ name: 'Various Speakers', bio: 'Innovators pushing fintech boundaries.', company: 'Various', role: 'Builders' }],
    capacity: 60,
    tags: ['lightning', 'regtech', 'AI-agents'],
  },
  {
    id: 's-18',
    title: 'The Future of Banking Infrastructure',
    description: 'Are core banking platforms finally ready? A candid operator discussion.',
    track: 'operator',
    session_type: 'panel',
    room: 'Main Stage',
    day: 2,
    start_time: '14:30',
    end_time: '15:20',
    speaker_names: ['Jason Bates', 'Leda Glyptis'],
    speaker_bios: [
      { name: 'Jason Bates', bio: 'Co-founded multiple neobanks and fintech platforms.', company: '11:FS', role: 'Co-founder' },
      { name: 'Leda Glyptis', bio: 'Banking transformation strategist and author.', company: '10x Banking', role: 'Chief Client Officer' },
    ],
    capacity: null,
    tags: ['core-banking', 'infrastructure', 'strategy'],
  },
  {
    id: 's-19',
    title: 'Explorer Session: VC Office Hours',
    description: 'Book 15-min slots with fintech VCs. First come, first served.',
    track: 'explorer',
    session_type: 'social',
    room: 'VIP Lounge',
    day: 2,
    start_time: '15:00',
    end_time: '16:30',
    speaker_names: [],
    speaker_bios: [],
    capacity: 20,
    tags: ['VC', 'fundraising', 'networking'],
  },
  {
    id: 's-20',
    title: 'Closing Keynote: What We Build Next',
    description: 'Final remarks, community awards, and the road ahead for NerdCon.',
    track: 'general',
    session_type: 'keynote',
    room: 'Main Stage',
    day: 2,
    start_time: '17:00',
    end_time: '17:45',
    speaker_names: ['Simon Taylor'],
    speaker_bios: [{ name: 'Simon Taylor', bio: 'Fintech nerd-in-chief and founder of Fintech Brainfood.', company: 'Fintech Brainfood', role: 'Founder' }],
    capacity: null,
    tags: ['closing', 'keynote', 'community'],
  },
]
