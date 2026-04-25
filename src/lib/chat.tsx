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
import { useParty } from './party'
import { moderateMessage } from './moderation'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

/* ─── Types ─── */

export interface ChatMessage {
  id: string
  party_id: string
  sender_id: string | null
  content: string
  message_type: 'text' | 'system'
  created_at: string
  /** Joined from profiles — populated client-side */
  sender?: {
    display_name: string
    nerd_number: number
    quest_line: string | null
  }
}

interface ChatState {
  messages: ChatMessage[]
  loading: boolean
  sending: boolean
  hasMore: boolean
  sendMessage: (content: string) => Promise<{ error: string | null }>
  loadMore: () => Promise<void>
  unreadCount: number
  markRead: () => void
  reportMessage: (messageId: string, reason?: string) => Promise<void>
}

/* ─── Constants ─── */

const PAGE_SIZE = 30
const SPAM_WINDOW_MS = 3000 // 3 seconds between messages (client-side)
const SPAM_BURST_LIMIT = 5 // Max messages in 30 seconds
const SPAM_BURST_WINDOW_MS = 30_000

/* ─── Mock Data ─── */

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-001',
    party_id: 'dev-party-001',
    sender_id: null,
    content: 'Dev Nerd created the party',
    message_type: 'system',
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'msg-002',
    party_id: 'dev-party-001',
    sender_id: 'dev-user-002',
    content: 'Hey everyone! Excited for NerdCon!',
    message_type: 'text',
    created_at: '2026-03-01T01:10:00Z',
    sender: { display_name: 'Ada Lovelace', nerd_number: 7, quest_line: 'operator' },
  },
  {
    id: 'msg-003',
    party_id: 'dev-party-001',
    sender_id: 'dev-user-001',
    content: 'Same! Who wants to hit the opening keynote together?',
    message_type: 'text',
    created_at: '2026-03-01T01:12:00Z',
    sender: { display_name: 'Dev Nerd', nerd_number: 42, quest_line: 'builder' },
  },
  {
    id: 'msg-004',
    party_id: 'dev-party-001',
    sender_id: null,
    content: 'Ada Lovelace earned 50 XP \u2014 Plan Ahead',
    message_type: 'system',
    created_at: '2026-03-01T02:00:00Z',
  },
  {
    id: 'msg-005',
    party_id: 'dev-party-001',
    sender_id: 'dev-user-003',
    content: 'Count me in. Also the API workshop on day 2 looks sick.',
    message_type: 'text',
    created_at: '2026-03-01T02:15:00Z',
    sender: { display_name: 'Satoshi N.', nerd_number: 1337, quest_line: 'explorer' },
  },
]

/* ─── Context ─── */

const ChatContext = createContext<ChatState | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth()
  const { party, members } = useParty()
  const [messages, setMessages] = useState<ChatMessage[]>(DEV_MODE ? MOCK_MESSAGES : [])
  const [loading, setLoading] = useState(!DEV_MODE)
  const [sending, setSending] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const lastReadRef = useRef<string>(new Date().toISOString())
  const sendTimestamps = useRef<number[]>([])
  const seenIds = useRef<Set<string>>(new Set(DEV_MODE ? MOCK_MESSAGES.map((m) => m.id) : []))

  /** Build a member lookup from party members */
  const memberLookup = useRef<Map<string, { display_name: string; nerd_number: number; quest_line: string | null }>>(new Map())

  useEffect(() => {
    const map = new Map<string, { display_name: string; nerd_number: number; quest_line: string | null }>()
    for (const m of members) {
      map.set(m.user_id, {
        display_name: m.profile.display_name,
        nerd_number: m.profile.nerd_number,
        quest_line: m.profile.quest_line,
      })
    }
    memberLookup.current = map
  }, [members])

  /** Enrich a raw message row with sender profile info */
  const enrichMessage = useCallback((row: Omit<ChatMessage, 'sender'>): ChatMessage => {
    const sender = row.sender_id ? memberLookup.current.get(row.sender_id) : undefined
    return { ...row, sender } as ChatMessage
  }, [])

  /** Fetch initial messages */
  const fetchMessages = useCallback(async () => {
    if (!party || DEV_MODE) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('party_messages')
        .select('*')
        .eq('party_id', party.id)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (error) throw error

      if (data) {
        const enriched = data.reverse().map(enrichMessage)
        setMessages(enriched)
        seenIds.current = new Set(enriched.map((m) => m.id))
        setHasMore(data.length === PAGE_SIZE)
      }
    } catch {
      console.warn('Failed to fetch party messages')
    }

    setLoading(false)
  }, [party, enrichMessage])

  /** Load older messages (pagination) */
  const loadMore = useCallback(async () => {
    if (!party || !hasMore || DEV_MODE) return

    const oldest = messages[0]
    if (!oldest) return

    const { data } = await supabase
      .from('party_messages')
      .select('*')
      .eq('party_id', party.id)
      .lt('created_at', oldest.created_at)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (data && data.length > 0) {
      const enriched = data.reverse().map(enrichMessage)
      setMessages((prev) => [...enriched, ...prev])
      for (const m of enriched) seenIds.current.add(m.id)
      setHasMore(data.length === PAGE_SIZE)
    } else {
      setHasMore(false)
    }
  }, [party, hasMore, messages, enrichMessage])

  /** Subscribe to realtime inserts with reconnection handling */
  useEffect(() => {
    if (!party || DEV_MODE) return

    const channel = supabase
      .channel(`party-chat-${party.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'party_messages',
          filter: `party_id=eq.${party.id}`,
        },
        (payload) => {
          const row = payload.new as Omit<ChatMessage, 'sender'>
          // Dedupe
          if (seenIds.current.has(row.id)) return
          seenIds.current.add(row.id)

          const enriched = enrichMessage(row)
          setMessages((prev) => [...prev, enriched])

          // Track unread if message is from someone else
          if (row.sender_id && row.sender_id !== user?.id) {
            setUnreadCount((prev) => prev + 1)
          }
        }
      )
      .subscribe((status) => {
        // On reconnect, re-fetch recent messages to fill any gaps
        if (status === 'SUBSCRIBED') {
          // Small delay to avoid race with initial fetch
          setTimeout(() => fetchMessages(), 500)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [party, user?.id, enrichMessage, fetchMessages])

  /** Fetch on mount / party change */
  useEffect(() => {
    if (party) {
      fetchMessages()
    } else {
      setMessages(DEV_MODE ? MOCK_MESSAGES : [])
      setLoading(false)
    }
  }, [party, fetchMessages])

  /** Client-side spam detection */
  function isSpamming(): boolean {
    const now = Date.now()
    const recent = sendTimestamps.current.filter((t) => now - t < SPAM_BURST_WINDOW_MS)
    sendTimestamps.current = recent

    // Check burst limit
    if (recent.length >= SPAM_BURST_LIMIT) return true

    // Check minimum interval
    const last = recent[recent.length - 1]
    if (last && now - last < SPAM_WINDOW_MS) return true

    return false
  }

  /** Send a message */
  const sendMessage = useCallback(async (content: string): Promise<{ error: string | null }> => {
    const trimmed = content.trim()
    if (!trimmed) return { error: 'Message cannot be empty' }
    if (trimmed.length > 500) return { error: 'Message too long (500 chars max)' }
    if (!party || !user) return { error: 'Not in a party' }

    if (isSpamming()) {
      return { error: 'Slow down! Wait a few seconds between messages.' }
    }

    // Content moderation
    const modResult = moderateMessage(trimmed)
    if (!modResult.allowed) {
      return { error: modResult.reason ?? 'Message blocked' }
    }

    setSending(true)

    if (DEV_MODE) {
      const mockMsg: ChatMessage = {
        id: `msg-dev-${Date.now()}`,
        party_id: party.id,
        sender_id: user.id,
        content: trimmed,
        message_type: 'text',
        created_at: new Date().toISOString(),
        sender: profile ? {
          display_name: profile.display_name ?? 'You',
          nerd_number: profile.nerd_number,
          quest_line: profile.quest_line,
        } : undefined,
      }
      setMessages((prev) => [...prev, mockMsg])
      sendTimestamps.current.push(Date.now())
      setSending(false)
      return { error: null }
    }

    const { error } = await supabase.from('party_messages').insert({
      party_id: party.id,
      sender_id: user.id,
      content: trimmed,
      message_type: 'text',
    })

    sendTimestamps.current.push(Date.now())
    setSending(false)

    if (error) {
      // Rate limit hit at DB level
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        return { error: 'Slow down! Wait a moment before sending again.' }
      }
      return { error: 'Failed to send message' }
    }

    return { error: null }
  }, [party, user, profile])

  /** Report a message */
  const reportMessage = useCallback(async (messageId: string, reason?: string) => {
    if (!user || DEV_MODE) return

    await supabase.from('message_reports').insert({
      reporter_id: user.id,
      message_id: messageId,
      message_table: 'party_messages',
      reason: reason ?? 'inappropriate',
    })
  }, [user])

  /** Mark messages as read */
  const markRead = useCallback(() => {
    setUnreadCount(0)
    const now = new Date().toISOString()
    lastReadRef.current = now

    if (!party || !user || DEV_MODE) return

    // Upsert last read time
    supabase
      .from('party_chat_reads')
      .upsert({
        user_id: user.id,
        party_id: party.id,
        last_read_at: now,
      })
      .then(() => {}) // fire and forget
  }, [party, user])

  return (
    <ChatContext.Provider
      value={{
        messages,
        loading,
        sending,
        hasMore,
        sendMessage,
        loadMore,
        unreadCount,
        markRead,
        reportMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
