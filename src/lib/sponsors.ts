import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

/* ─── Types ─── */

export interface Sponsor {
  id: string
  name: string
  tagline: string
  logo_emoji: string
  booth_number: string
  website: string | null
  category: 'platinum' | 'gold' | 'silver'
  side_quest_title: string
  side_quest_description: string
  side_quest_xp: number
  display_order: number
}

interface SponsorVisitRow {
  sponsor_id: string
}

/* ─── Stub Data ─── */

const STUB_SPONSORS: Sponsor[] = [
  { id: 'sp-01', name: 'Stripe', tagline: 'Payments infrastructure for the internet', logo_emoji: '💳', booth_number: 'P1', website: null, category: 'platinum', side_quest_title: 'Payment Architect', side_quest_description: 'Visit the Stripe booth and demo the new Issuing API', side_quest_xp: 40, display_order: 1 },
  { id: 'sp-02', name: 'Plaid', tagline: 'The easiest way to connect bank accounts', logo_emoji: '🔗', booth_number: 'P2', website: null, category: 'platinum', side_quest_title: 'Connection Master', side_quest_description: 'Try the Plaid Link demo and connect a sandbox account', side_quest_xp: 40, display_order: 2 },
  { id: 'sp-03', name: 'Neon', tagline: 'Serverless Postgres for modern apps', logo_emoji: '🐘', booth_number: 'P3', website: null, category: 'platinum', side_quest_title: 'Query Runner', side_quest_description: 'Run a query on the Neon live demo terminal', side_quest_xp: 40, display_order: 3 },
  { id: 'sp-04', name: 'Mercury', tagline: 'Banking for startups', logo_emoji: '🚀', booth_number: 'G1', website: null, category: 'gold', side_quest_title: 'Startup Banker', side_quest_description: 'Chat with the Mercury team about treasury APIs', side_quest_xp: 30, display_order: 4 },
  { id: 'sp-05', name: 'Ramp', tagline: 'The corporate card that saves you money', logo_emoji: '💰', booth_number: 'G2', website: null, category: 'gold', side_quest_title: 'Expense Hunter', side_quest_description: 'Snap a receipt with the Ramp receipt scanner', side_quest_xp: 30, display_order: 5 },
  { id: 'sp-06', name: 'Moov', tagline: 'Money movement APIs', logo_emoji: '⚡', booth_number: 'G3', website: null, category: 'gold', side_quest_title: 'Money Mover', side_quest_description: 'Move mock money through the Moov sandbox', side_quest_xp: 30, display_order: 6 },
  { id: 'sp-07', name: 'Alloy', tagline: 'Identity decisioning for fintech', logo_emoji: '🛡️', booth_number: 'G4', website: null, category: 'gold', side_quest_title: 'Identity Verifier', side_quest_description: 'Run a mock KYC check on the Alloy demo', side_quest_xp: 30, display_order: 7 },
  { id: 'sp-08', name: 'Unit', tagline: 'Banking-as-a-service for platforms', logo_emoji: '🏦', booth_number: 'S1', website: null, category: 'silver', side_quest_title: 'Platform Builder', side_quest_description: 'See the Unit embedded banking demo', side_quest_xp: 25, display_order: 8 },
  { id: 'sp-09', name: 'Lithic', tagline: 'Card issuing infrastructure', logo_emoji: '💎', booth_number: 'S2', website: null, category: 'silver', side_quest_title: 'Card Crafter', side_quest_description: 'Design a custom card on the Lithic sandbox', side_quest_xp: 25, display_order: 9 },
  { id: 'sp-10', name: 'Sardine', tagline: 'Fraud and compliance platform', logo_emoji: '🐟', booth_number: 'S3', website: null, category: 'silver', side_quest_title: 'Fraud Fighter', side_quest_description: 'Spot the fraudulent transaction in the Sardine demo', side_quest_xp: 25, display_order: 10 },
  { id: 'sp-11', name: 'Synctera', tagline: 'Banking-as-a-service for fintechs', logo_emoji: '🔄', booth_number: 'S4', website: null, category: 'silver', side_quest_title: 'BaaS Explorer', side_quest_description: 'Tour the Synctera partner dashboard', side_quest_xp: 25, display_order: 11 },
  { id: 'sp-12', name: 'Upstash', tagline: 'Serverless Redis and Kafka', logo_emoji: '🔴', booth_number: 'S5', website: null, category: 'silver', side_quest_title: 'Cache Commander', side_quest_description: 'Set and get a key in the Upstash Redis playground', side_quest_xp: 25, display_order: 12 },
]

/* ─── useSponsors ─── */

export function useSponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!DEV_MODE) {
        const { data } = await supabase
          .from('sponsors')
          .select('*')
          .order('display_order', { ascending: true })
        if (data && data.length > 0) {
          setSponsors(data as Sponsor[])
          setLoading(false)
          return
        }
      }
      setSponsors(STUB_SPONSORS)
      setLoading(false)
    }
    load()
  }, [])

  return { sponsors, loading }
}

/* ─── useSponsorVisits ─── */

export function useSponsorVisits() {
  const { user } = useAuth()
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const fetchVisits = useCallback(async () => {
    if (!user || DEV_MODE) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('sponsor_visits')
      .select('sponsor_id')
      .eq('user_id', user.id)

    if (data) {
      setVisitedIds(new Set((data as SponsorVisitRow[]).map((v) => v.sponsor_id)))
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchVisits() }, [fetchVisits])

  const recordVisit = useCallback(async (sponsorId: string) => {
    if (!user) return
    setVisitedIds((prev) => new Set(prev).add(sponsorId))

    if (DEV_MODE) return

    await supabase.from('sponsor_visits').upsert({
      user_id: user.id,
      sponsor_id: sponsorId,
    }, { onConflict: 'user_id,sponsor_id' })
  }, [user])

  const hasVisited = useCallback((sponsorId: string) => visitedIds.has(sponsorId), [visitedIds])

  return { visitedIds, visitCount: visitedIds.size, hasVisited, recordVisit, loading }
}
