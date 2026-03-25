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

/* ─── Types ─── */

export interface DMRequest {
  id: string
  sender_id: string
  recipient_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  responded_at: string | null
  /** Joined profile info */
  sender_profile?: { display_name: string; nerd_number: number; company: string | null }
}

export interface DMConversation {
  id: string
  user_a: string
  user_b: string
  created_at: string
  /** The other person's profile */
  other_user?: { id: string; display_name: string; nerd_number: number; company: string | null; quest_line: string | null }
  last_message?: { content: string; created_at: string }
  unread_count: number
}

export interface DirectMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

interface DMState {
  /** Pending requests received */
  incomingRequests: DMRequest[]
  /** Active conversations */
  conversations: DMConversation[]
  /** Messages in active conversation */
  activeMessages: DirectMessage[]
  /** Currently viewing conversation */
  activeConversationId: string | null
  loading: boolean
  sending: boolean
  /** Total unread across all convos */
  totalUnread: number

  sendRequest: (recipientId: string) => Promise<{ error: string | null }>
  acceptRequest: (requestId: string) => Promise<{ error: string | null }>
  declineRequest: (requestId: string) => Promise<void>
  openConversation: (conversationId: string) => void
  closeConversation: () => void
  sendMessage: (content: string) => Promise<{ error: string | null }>
  refresh: () => Promise<void>
}

/* ─── Mock Data ─── */

const MOCK_REQUESTS: DMRequest[] = [
  {
    id: 'dmr-001',
    sender_id: 'dev-user-002',
    recipient_id: 'dev-user-001',
    status: 'pending',
    created_at: '2026-03-01T03:00:00Z',
    responded_at: null,
    sender_profile: { display_name: 'Ada Lovelace', nerd_number: 7, company: 'Plaid' },
  },
]

const MOCK_CONVERSATIONS: DMConversation[] = [
  {
    id: 'dmc-001',
    user_a: 'dev-user-001',
    user_b: 'dev-user-003',
    created_at: '2026-03-01T02:00:00Z',
    other_user: { id: 'dev-user-003', display_name: 'Satoshi N.', nerd_number: 1337, company: 'Lightning Labs', quest_line: 'explorer' },
    last_message: { content: 'See you at the API workshop!', created_at: '2026-03-01T04:00:00Z' },
    unread_count: 1,
  },
]

const MOCK_MESSAGES: DirectMessage[] = [
  { id: 'dm-001', conversation_id: 'dmc-001', sender_id: 'dev-user-003', content: 'Hey! Saw you at the keynote', created_at: '2026-03-01T02:30:00Z' },
  { id: 'dm-002', conversation_id: 'dmc-001', sender_id: 'dev-user-001', content: 'Yeah it was great! Are you going to the workshop?', created_at: '2026-03-01T03:00:00Z' },
  { id: 'dm-003', conversation_id: 'dmc-001', sender_id: 'dev-user-003', content: 'See you at the API workshop!', created_at: '2026-03-01T04:00:00Z' },
]

/* ─── Context ─── */

const DMContext = createContext<DMState | null>(null)

export function DMProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [incomingRequests, setIncomingRequests] = useState<DMRequest[]>(DEV_MODE ? MOCK_REQUESTS : [])
  const [conversations, setConversations] = useState<DMConversation[]>(DEV_MODE ? MOCK_CONVERSATIONS : [])
  const [activeMessages, setActiveMessages] = useState<DirectMessage[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(!DEV_MODE)
  const [sending, setSending] = useState(false)
  const sendTimestamps = useRef<number[]>([])

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0) + incomingRequests.length

  /** Fetch incoming DM requests */
  const fetchRequests = useCallback(async () => {
    if (!user || DEV_MODE) return

    const { data } = await supabase
      .from('dm_requests')
      .select('*, profiles!dm_requests_sender_id_fkey(display_name, nerd_number, company)')
      .eq('recipient_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (data) {
      setIncomingRequests(data.map((r: any) => ({
        ...r,
        sender_profile: r.profiles ?? undefined,
      })))
    }
  }, [user])

  /** Fetch conversations with last message */
  const fetchConversations = useCallback(async () => {
    if (!user || DEV_MODE) return

    const { data } = await supabase
      .from('dm_conversations')
      .select('*')
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!data) return

    // Enrich with other user profile and last message
    const enriched: DMConversation[] = await Promise.all(
      data.map(async (c: any) => {
        const otherId = c.user_a === user.id ? c.user_b : c.user_a

        const [profileRes, msgRes, readRes] = await Promise.all([
          supabase.from('profiles').select('id, display_name, nerd_number, company, quest_line').eq('id', otherId).single(),
          supabase.from('direct_messages').select('content, created_at').eq('conversation_id', c.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('dm_reads').select('last_read_at').eq('user_id', user.id).eq('conversation_id', c.id).maybeSingle(),
        ])

        // Count unread
        let unread = 0
        if (readRes.data?.last_read_at && msgRes.data) {
          const { count } = await supabase
            .from('direct_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', c.id)
            .neq('sender_id', user.id)
            .gt('created_at', readRes.data.last_read_at)
          unread = count ?? 0
        } else if (msgRes.data) {
          // No read marker = all messages from other person are unread
          const { count } = await supabase
            .from('direct_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', c.id)
            .neq('sender_id', user.id)
          unread = count ?? 0
        }

        return {
          ...c,
          other_user: profileRes.data ?? undefined,
          last_message: msgRes.data ?? undefined,
          unread_count: unread,
        }
      })
    )

    // Sort by last message time (most recent first)
    enriched.sort((a, b) => {
      const ta = a.last_message?.created_at ?? a.created_at
      const tb = b.last_message?.created_at ?? b.created_at
      return tb.localeCompare(ta)
    })

    setConversations(enriched)
  }, [user])

  /** Full refresh */
  const refresh = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchRequests(), fetchConversations()])
    setLoading(false)
  }, [fetchRequests, fetchConversations])

  useEffect(() => {
    if (user) refresh()
  }, [user?.id])

  /** Subscribe to new DM requests */
  useEffect(() => {
    if (!user || DEV_MODE) return

    const channel = supabase
      .channel('dm-requests')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'dm_requests',
        filter: `recipient_id=eq.${user.id}`,
      }, () => { fetchRequests() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, fetchRequests])

  /** Subscribe to messages in active conversation */
  useEffect(() => {
    if (!activeConversationId || DEV_MODE) return

    // Fetch existing messages
    supabase
      .from('direct_messages')
      .select('*')
      .eq('conversation_id', activeConversationId)
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data) setActiveMessages(data)
      })

    // Subscribe to new
    const channel = supabase
      .channel(`dm-${activeConversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `conversation_id=eq.${activeConversationId}`,
      }, (payload) => {
        const msg = payload.new as DirectMessage
        setActiveMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      })
      .subscribe()

    // Mark as read
    if (user) {
      supabase.from('dm_reads').upsert({
        user_id: user.id,
        conversation_id: activeConversationId,
        last_read_at: new Date().toISOString(),
      }).then(() => {})
    }

    return () => { supabase.removeChannel(channel) }
  }, [activeConversationId, user?.id])

  /** Send DM request */
  const sendRequest = useCallback(async (recipientId: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not signed in' }

    if (DEV_MODE) return { error: null }

    const { error } = await supabase.from('dm_requests').insert({
      sender_id: user.id,
      recipient_id: recipientId,
    })

    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return { error: 'Request already sent' }
      }
      return { error: 'Failed to send request' }
    }

    return { error: null }
  }, [user])

  /** Accept DM request — creates conversation */
  const acceptRequest = useCallback(async (requestId: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not signed in' }

    if (DEV_MODE) {
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId))
      return { error: null }
    }

    // Find the request
    const { data: req } = await supabase
      .from('dm_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (!req) return { error: 'Request not found' }

    // Update request status
    await supabase.from('dm_requests').update({
      status: 'accepted',
      responded_at: new Date().toISOString(),
    }).eq('id', requestId)

    // Create conversation (user_a < user_b)
    const userA = req.sender_id < user.id ? req.sender_id : user.id
    const userB = req.sender_id < user.id ? user.id : req.sender_id

    await supabase.from('dm_conversations').upsert({
      user_a: userA,
      user_b: userB,
    }, { onConflict: 'user_a,user_b' })

    // Refresh lists
    await Promise.all([fetchRequests(), fetchConversations()])

    return { error: null }
  }, [user, fetchRequests, fetchConversations])

  /** Decline DM request */
  const declineRequest = useCallback(async (requestId: string) => {
    if (DEV_MODE) {
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId))
      return
    }

    await supabase.from('dm_requests').update({
      status: 'declined',
      responded_at: new Date().toISOString(),
    }).eq('id', requestId)

    await fetchRequests()
  }, [fetchRequests])

  /** Open a conversation */
  const openConversation = useCallback((conversationId: string) => {
    if (DEV_MODE) {
      setActiveMessages(MOCK_MESSAGES.filter((m) => m.conversation_id === conversationId))
    }
    setActiveConversationId(conversationId)

    // Clear unread for this convo
    setConversations((prev) =>
      prev.map((c) => c.id === conversationId ? { ...c, unread_count: 0 } : c)
    )
  }, [])

  /** Close conversation view */
  const closeConversation = useCallback(() => {
    setActiveConversationId(null)
    setActiveMessages([])
  }, [])

  /** Send DM */
  const sendMessage = useCallback(async (content: string): Promise<{ error: string | null }> => {
    const trimmed = content.trim()
    if (!trimmed || !activeConversationId || !user) return { error: 'Cannot send message' }
    if (trimmed.length > 500) return { error: 'Message too long (500 chars max)' }

    // Spam check
    const now = Date.now()
    const recent = sendTimestamps.current.filter((t) => now - t < 30_000)
    sendTimestamps.current = recent
    if (recent.length >= 5) return { error: 'Slow down! Wait a few seconds.' }
    const last = recent[recent.length - 1]
    if (last && now - last < 3000) return { error: 'Slow down!' }

    setSending(true)

    if (DEV_MODE) {
      const msg: DirectMessage = {
        id: `dm-dev-${Date.now()}`,
        conversation_id: activeConversationId,
        sender_id: user.id,
        content: trimmed,
        created_at: new Date().toISOString(),
      }
      setActiveMessages((prev) => [...prev, msg])
      sendTimestamps.current.push(now)
      setSending(false)
      return { error: null }
    }

    const { error } = await supabase.from('direct_messages').insert({
      conversation_id: activeConversationId,
      sender_id: user.id,
      content: trimmed,
    })

    sendTimestamps.current.push(now)
    setSending(false)

    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return { error: 'Slow down!' }
      }
      return { error: 'Failed to send' }
    }

    return { error: null }
  }, [activeConversationId, user])

  return (
    <DMContext.Provider value={{
      incomingRequests,
      conversations,
      activeMessages,
      activeConversationId,
      loading,
      sending,
      totalUnread,
      sendRequest,
      acceptRequest,
      declineRequest,
      openConversation,
      closeConversation,
      sendMessage,
      refresh,
    }}>
      {children}
    </DMContext.Provider>
  )
}

export function useDM() {
  const ctx = useContext(DMContext)
  if (!ctx) throw new Error('useDM must be used within DMProvider')
  return ctx
}
