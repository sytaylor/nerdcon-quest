import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

/* ─── Types ─── */

export interface Party {
  id: string
  name: string
  created_by: string | null
  invite_code: string
  max_members: number
  created_at: string
}

export interface PartyMember {
  id: string
  user_id: string
  joined_at: string
  profile: {
    display_name: string
    company: string | null
    nerd_number: number
    quest_line: string | null
    xp: number
    level: number
  }
}

interface PartyMemberRow {
  id: string
  user_id: string
  joined_at: string
  profiles: PartyMember['profile'] | null
}

interface PartyState {
  party: Party | null
  members: PartyMember[]
  loading: boolean
  createParty: (name: string) => Promise<void>
  joinParty: (inviteCode: string) => Promise<{ error: string | null }>
  leaveParty: () => Promise<void>
  refreshParty: () => Promise<void>
}

/* ─── Mock Data ─── */

const MOCK_PARTY: Party = {
  id: 'dev-party-001',
  name: 'Brainfood Crew',
  created_by: 'dev-user-001',
  invite_code: 'NERD42',
  max_members: 6,
  created_at: '2026-03-01T00:00:00Z',
}

const MOCK_MEMBERS: PartyMember[] = [
  {
    id: 'pm-001',
    user_id: 'dev-user-001',
    joined_at: '2026-03-01T00:00:00Z',
    profile: {
      display_name: 'Dev Nerd',
      company: 'NerdCon HQ',
      nerd_number: 42,
      quest_line: 'builder',
      xp: 150,
      level: 1,
    },
  },
  {
    id: 'pm-002',
    user_id: 'dev-user-002',
    joined_at: '2026-03-01T01:00:00Z',
    profile: {
      display_name: 'Ada Lovelace',
      company: 'Plaid',
      nerd_number: 7,
      quest_line: 'operator',
      xp: 420,
      level: 2,
    },
  },
  {
    id: 'pm-003',
    user_id: 'dev-user-003',
    joined_at: '2026-03-01T02:00:00Z',
    profile: {
      display_name: 'Satoshi N.',
      company: 'Lightning Labs',
      nerd_number: 1337,
      quest_line: 'explorer',
      xp: 890,
      level: 3,
    },
  },
]

/* ─── Helpers ─── */

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/* ─── Context ─── */

const PartyContext = createContext<PartyState | null>(null)

export function PartyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [party, setParty] = useState<Party | null>(null)
  const [members, setMembers] = useState<PartyMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchParty = useCallback(async () => {
    if (!user) {
      setParty(null)
      setMembers([])
      setLoading(false)
      return
    }

    if (DEV_MODE) {
      setParty(MOCK_PARTY)
      setMembers(MOCK_MEMBERS)
      setLoading(false)
      return
    }

    try {
      // Check if user is in a party
      const { data: membership, error: memErr } = await supabase
        .from('party_members')
        .select('party_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (memErr || !membership) {
        setParty(null)
        setMembers([])
        setLoading(false)
        return
      }

      // Fetch party details
      const { data: partyData } = await supabase
        .from('parties')
        .select('*')
        .eq('id', membership.party_id)
        .single()

      if (!partyData) {
        setParty(null)
        setMembers([])
        setLoading(false)
        return
      }

      setParty(partyData as Party)

      // Fetch all members with profiles
      const { data: memberData } = await supabase
        .from('party_members')
        .select('id, user_id, joined_at, profiles(display_name, company, nerd_number, quest_line, xp, level)')
        .eq('party_id', membership.party_id)
        .order('joined_at', { ascending: true })

      if (memberData) {
        const mapped: PartyMember[] = (memberData as unknown as PartyMemberRow[]).map((m) => ({
          id: m.id,
          user_id: m.user_id,
          joined_at: m.joined_at,
          profile: m.profiles ?? {
            display_name: 'Unknown',
            company: null,
            nerd_number: 0,
            quest_line: null,
            xp: 0,
            level: 0,
          },
        }))
        setMembers(mapped)
      }
    } catch {
      console.warn('Could not fetch party, using empty state')
      setParty(null)
      setMembers([])
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchParty()
  }, [fetchParty])

  const createParty = useCallback(async (name: string) => {
    if (!user) return

    if (DEV_MODE) {
      const newParty: Party = {
        id: 'dev-party-new',
        name,
        created_by: user.id,
        invite_code: generateInviteCode(),
        max_members: 6,
        created_at: new Date().toISOString(),
      }
      setParty(newParty)
      setMembers([
        {
          id: 'pm-self',
          user_id: user.id,
          joined_at: new Date().toISOString(),
          profile: {
            display_name: 'Dev Nerd',
            company: 'NerdCon HQ',
            nerd_number: 42,
            quest_line: 'builder',
            xp: 150,
            level: 1,
          },
        },
      ])
      return
    }

    const inviteCode = generateInviteCode()

    const { data: newParty, error: createErr } = await supabase
      .from('parties')
      .insert({
        name,
        created_by: user.id,
        invite_code: inviteCode,
        max_members: 6,
      })
      .select()
      .single()

    if (createErr || !newParty) {
      console.warn('Failed to create party:', createErr?.message)
      return
    }

    await supabase.from('party_members').insert({
      party_id: newParty.id,
      user_id: user.id,
    })

    await fetchParty()
  }, [user, fetchParty])

  const joinParty = useCallback(async (inviteCode: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not signed in' }

    if (DEV_MODE) {
      setParty({
        ...MOCK_PARTY,
        invite_code: inviteCode.toUpperCase(),
      })
      setMembers([
        ...MOCK_MEMBERS,
        {
          id: 'pm-self',
          user_id: user.id,
          joined_at: new Date().toISOString(),
          profile: {
            display_name: 'Dev Nerd',
            company: 'NerdCon HQ',
            nerd_number: 42,
            quest_line: 'builder',
            xp: 150,
            level: 1,
          },
        },
      ])
      return { error: null }
    }

    const { error: joinErr } = await supabase.rpc('join_party_by_invite', {
      p_invite_code: inviteCode.trim().toUpperCase(),
    })

    if (joinErr) {
      if (joinErr.message.includes('already')) {
        return { error: 'Already in a party' }
      }
      if (joinErr.message.includes('full')) return { error: 'Party is full' }
      if (joinErr.message.includes('not found')) return { error: 'Invalid invite code' }
      return { error: joinErr.message }
    }

    await fetchParty()
    return { error: null }
  }, [user, fetchParty])

  const leaveParty = useCallback(async () => {
    if (!user || !party) return

    if (DEV_MODE) {
      setParty(null)
      setMembers([])
      return
    }

    // Remove self from party
    await supabase
      .from('party_members')
      .delete()
      .eq('party_id', party.id)
      .eq('user_id', user.id)

    // If last member, delete the party
    const { count } = await supabase
      .from('party_members')
      .select('id', { count: 'exact', head: true })
      .eq('party_id', party.id)

    if (count === 0) {
      await supabase.from('parties').delete().eq('id', party.id)
    }

    setParty(null)
    setMembers([])
  }, [user, party])

  const refreshParty = useCallback(async () => {
    await fetchParty()
  }, [fetchParty])

  return (
    <PartyContext.Provider
      value={{ party, members, loading, createParty, joinParty, leaveParty, refreshParty }}
    >
      {children}
    </PartyContext.Provider>
  )
}

export function useParty() {
  const ctx = useContext(PartyContext)
  if (!ctx) throw new Error('useParty must be used within PartyProvider')
  return ctx
}
