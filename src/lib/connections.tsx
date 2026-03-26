import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from './supabase'
import { useAuth, type Profile } from './auth'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'
const MAX_PENDING_REQUESTS = 20

/* ─── Types ─── */

export interface ConnectionRequest {
  id: string
  sender_id: string
  recipient_id: string
  status: 'pending' | 'accepted' | 'declined'
  message: string | null
  created_at: string
  /** Joined profile */
  profile?: Pick<Profile, 'display_name' | 'nerd_number' | 'company' | 'role' | 'quest_line'>
}

export interface ConnectedUser {
  id: string
  display_name: string
  nerd_number: number
  company: string | null
  quest_line: string | null
}

interface ConnectionsState {
  /** People I'm connected with */
  connections: ConnectedUser[]
  /** Requests I've received (pending) */
  incomingRequests: ConnectionRequest[]
  /** Request IDs I've sent (pending) — for UI state */
  pendingOutboundIds: Set<string> // recipient user IDs
  /** Connected user IDs — for fast lookup */
  connectedIds: Set<string>
  loading: boolean
  /** Total notifications: incoming requests */
  requestCount: number

  sendRequest: (recipientId: string, message?: string) => Promise<{ error: string | null }>
  acceptRequest: (requestId: string) => Promise<void>
  declineRequest: (requestId: string) => Promise<void>
  isConnected: (userId: string) => boolean
  isPending: (userId: string) => boolean
  refresh: () => Promise<void>
}

/* ─── Mock Data ─── */

const MOCK_CONNECTIONS: ConnectedUser[] = [
  { id: 'dev-user-002', display_name: 'Ada Lovelace', nerd_number: 7, company: 'Plaid', quest_line: 'operator' },
  { id: 'dev-user-003', display_name: 'Satoshi N.', nerd_number: 1337, company: 'Lightning Labs', quest_line: 'explorer' },
]

const MOCK_REQUESTS: ConnectionRequest[] = [
  {
    id: 'cr-001', sender_id: 'dev-user-004', recipient_id: 'dev-user-001',
    status: 'pending', message: 'Hey! Loved your talk on payments infra. Would love to connect.',
    created_at: '2026-03-25T10:00:00Z',
    profile: { display_name: 'Jordan Kim', nerd_number: 69, company: 'Revolut', role: 'Design Lead', quest_line: 'explorer' },
  },
  {
    id: 'cr-002', sender_id: 'dev-user-005', recipient_id: 'dev-user-001',
    status: 'pending', message: null,
    created_at: '2026-03-25T11:00:00Z',
    profile: { display_name: 'Priya Patel', nerd_number: 101, company: 'Wise', role: 'Head of Product', quest_line: 'operator' },
  },
]

/* ─── Context ─── */

const ConnectionsContext = createContext<ConnectionsState | null>(null)

export function ConnectionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [connections, setConnections] = useState<ConnectedUser[]>(DEV_MODE ? MOCK_CONNECTIONS : [])
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set(DEV_MODE ? MOCK_CONNECTIONS.map(c => c.id) : []))
  const [incomingRequests, setIncomingRequests] = useState<ConnectionRequest[]>(DEV_MODE ? MOCK_REQUESTS : [])
  const [pendingOutboundIds, setPendingOutboundIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(!DEV_MODE)

  const requestCount = incomingRequests.length

  /** Fetch connections (from connections table) */
  const fetchConnections = useCallback(async () => {
    if (!user || DEV_MODE) return

    const { data } = await supabase
      .from('connections')
      .select('user_a, user_b')
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)

    if (!data) return

    const otherIds = data.map((c: any) => c.user_a === user.id ? c.user_b : c.user_a)

    if (otherIds.length === 0) {
      setConnections([])
      setConnectedIds(new Set())
      return
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, nerd_number, company, quest_line')
      .in('id', otherIds)

    if (profiles) {
      setConnections(profiles as ConnectedUser[])
      setConnectedIds(new Set(profiles.map((p: any) => p.id)))
    }
  }, [user])

  /** Fetch incoming requests */
  const fetchRequests = useCallback(async () => {
    if (!user || DEV_MODE) return

    const { data } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('recipient_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (!data) return

    // Enrich with sender profiles
    const senderIds = data.map((r: any) => r.sender_id)
    if (senderIds.length === 0) { setIncomingRequests([]); return }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, nerd_number, company, role, quest_line')
      .in('id', senderIds)

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]))

    setIncomingRequests(data.map((r: any) => ({
      ...r,
      profile: profileMap.get(r.sender_id),
    })))
  }, [user])

  /** Fetch pending outbound */
  const fetchOutbound = useCallback(async () => {
    if (!user || DEV_MODE) return

    const { data } = await supabase
      .from('connection_requests')
      .select('recipient_id')
      .eq('sender_id', user.id)
      .eq('status', 'pending')

    if (data) {
      setPendingOutboundIds(new Set(data.map((r: any) => r.recipient_id)))
    }
  }, [user])

  const refresh = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchConnections(), fetchRequests(), fetchOutbound()])
    setLoading(false)
  }, [fetchConnections, fetchRequests, fetchOutbound])

  useEffect(() => { if (user) refresh() }, [user?.id])

  /** Realtime: new incoming requests */
  useEffect(() => {
    if (!user || DEV_MODE) return

    const channel = supabase
      .channel('connection-requests')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'connection_requests',
        filter: `recipient_id=eq.${user.id}`,
      }, () => { fetchRequests() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, fetchRequests])

  /** Send connection request */
  const sendRequest = useCallback(async (recipientId: string, message?: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not signed in' }

    if (connectedIds.has(recipientId)) return { error: 'Already connected' }
    if (pendingOutboundIds.has(recipientId)) return { error: 'Request already sent' }
    if (pendingOutboundIds.size >= MAX_PENDING_REQUESTS) return { error: 'Too many pending requests. Wait for responses.' }

    if (DEV_MODE) {
      setPendingOutboundIds(prev => new Set(prev).add(recipientId))
      return { error: null }
    }

    const { error } = await supabase.from('connection_requests').insert({
      sender_id: user.id,
      recipient_id: recipientId,
      message: message?.trim() || null,
    })

    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return { error: 'Request already sent' }
      }
      return { error: 'Failed to send request' }
    }

    setPendingOutboundIds(prev => new Set(prev).add(recipientId))
    return { error: null }
  }, [user, connectedIds, pendingOutboundIds])

  /** Accept connection request — creates mutual connection */
  const acceptRequest = useCallback(async (requestId: string) => {
    const req = incomingRequests.find(r => r.id === requestId)
    if (!req || !user) return

    if (DEV_MODE) {
      setIncomingRequests(prev => prev.filter(r => r.id !== requestId))
      if (req.profile) {
        const newConn: ConnectedUser = {
          id: req.sender_id,
          display_name: req.profile.display_name ?? 'Unknown',
          nerd_number: req.profile.nerd_number,
          company: req.profile.company ?? null,
          quest_line: req.profile.quest_line ?? null,
        }
        setConnections(prev => [...prev, newConn])
        setConnectedIds(prev => new Set(prev).add(req.sender_id))
      }
      return
    }

    // Update request status
    await supabase.from('connection_requests').update({
      status: 'accepted',
      responded_at: new Date().toISOString(),
    }).eq('id', requestId)

    // Create mutual connection (user_a < user_b)
    const [userA, userB] = [user.id, req.sender_id].sort()
    await supabase.from('connections').upsert(
      { user_a: userA, user_b: userB },
      { onConflict: 'user_a,user_b' }
    )

    await refresh()
  }, [user, incomingRequests, refresh])

  /** Decline connection request */
  const declineRequest = useCallback(async (requestId: string) => {
    if (DEV_MODE) {
      setIncomingRequests(prev => prev.filter(r => r.id !== requestId))
      return
    }

    await supabase.from('connection_requests').update({
      status: 'declined',
      responded_at: new Date().toISOString(),
    }).eq('id', requestId)

    await fetchRequests()
  }, [fetchRequests])

  const isConnected = useCallback((userId: string) => connectedIds.has(userId), [connectedIds])
  const isPending = useCallback((userId: string) => pendingOutboundIds.has(userId), [pendingOutboundIds])

  return (
    <ConnectionsContext.Provider value={{
      connections, incomingRequests, pendingOutboundIds, connectedIds,
      loading, requestCount,
      sendRequest, acceptRequest, declineRequest,
      isConnected, isPending, refresh,
    }}>
      {children}
    </ConnectionsContext.Provider>
  )
}

export function useConnections() {
  const ctx = useContext(ConnectionsContext)
  if (!ctx) throw new Error('useConnections must be used within ConnectionsProvider')
  return ctx
}
