import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import { XPToast } from './components/XPToast'
import { MapScreen } from './screens/MapScreen'
import { MissionsTab } from './screens/MissionsTab'
import { PartyScreen } from './screens/PartyScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { AuthProvider, useAuth } from './lib/auth'
import { XPProvider, useXP } from './lib/xp'
import { PartyProvider } from './lib/party'

const LeaderboardScreen = lazy(() =>
  import('./screens/LeaderboardScreen').then((m) => ({ default: m.LeaderboardScreen }))
)

function AppContent() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-void-black">
        <div className="text-center">
          <h1 className="font-mono text-xl font-bold text-nerdcon-blue">NerdCon Quest</h1>
          <p className="mt-2 animate-pulse font-mono text-xs text-fog-gray">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || (profile && !profile.display_name) || (profile && !profile.quest_line)) {
    return <OnboardingScreen />
  }

  return (
    <XPProvider>
    <PartyProvider>
      <AppShell />
    </PartyProvider>
    </XPProvider>
  )
}

function AppShell() {
  const xp = useXP()

  return (
    <div className="min-h-dvh bg-void-black text-terminal-white">
      <main className="mx-auto max-w-lg pb-20">
        <Suspense fallback={<div className="flex min-h-dvh items-center justify-center"><p className="animate-pulse font-mono text-xs text-fog-gray">Loading...</p></div>}>
          <Routes>
            <Route path="/" element={<MapScreen />} />
            <Route path="/quests" element={<MissionsTab />} />
            <Route path="/party" element={<PartyScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/leaderboard" element={<LeaderboardScreen />} />
          </Routes>
        </Suspense>
      </main>
      <TabBar />
      {xp.toasts.map((toast) => (
        <XPToast
          key={toast.id}
          message={toast.message}
          xp={toast.xp}
          visible
          onDone={() => xp.dismissToast(toast.id)}
        />
      ))}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
