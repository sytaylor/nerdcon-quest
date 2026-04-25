import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

export interface Profile {
  id: string
  nerd_number: number
  display_name: string | null
  company: string | null
  role: string | null
  bio: string | null
  looking_for: string | null
  avatar_url: string | null
  quest_line: 'builder' | 'operator' | 'explorer' | null
  xp: number
  level: number
  completed_missions?: string[]
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  devMode: boolean
  signIn: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const MOCK_PROFILE: Profile = {
  id: 'dev-user-001',
  nerd_number: 42,
  display_name: 'Dev Nerd',
  company: 'NerdCon HQ',
  role: 'Builder',
  bio: 'Testing the quest system',
  looking_for: 'Co-founders, API partners',
  avatar_url: null,
  quest_line: 'builder',
  xp: 150,
  level: 1,
  completed_missions: [],
}

const MOCK_USER = { id: 'dev-user-001' } as User

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(DEV_MODE ? MOCK_USER : null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(DEV_MODE ? MOCK_PROFILE : null)
  const [loading, setLoading] = useState(!DEV_MODE)

  async function fetchProfile(userId: string) {
    if (DEV_MODE) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfile(data as Profile)
  }

  async function refreshProfile() {
    if (user && !DEV_MODE) await fetchProfile(user.id)
  }

  useEffect(() => {
    if (DEV_MODE) return

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) fetchProfile(s.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) fetchProfile(s.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string) {
    if (DEV_MODE) {
      setUser(MOCK_USER)
      setProfile(MOCK_PROFILE)
      return { error: null }
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    return { error: error ? new Error(error.message) : null }
  }

  async function signOut() {
    if (DEV_MODE) {
      setUser(null)
      setProfile(null)
      return
    }
    await supabase.auth.signOut()
    setProfile(null)
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (DEV_MODE) {
      setProfile((prev) => prev ? { ...prev, ...updates } : null)
      return
    }
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    if (!error) {
      setProfile((prev) => prev ? { ...prev, ...updates } : null)
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, devMode: DEV_MODE, signIn, signOut, updateProfile, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
