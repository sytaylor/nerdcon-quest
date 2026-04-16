import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import { XPToast } from './components/XPToast'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ConnectionStatus } from './components/ConnectionStatus'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { AuthProvider, useAuth } from './lib/auth'
import { XPProvider, useXP } from './lib/xp'
import { PartyProvider } from './lib/party'
import { ChatProvider } from './lib/chat'
import { DMProvider } from './lib/dm'
import { ConnectionsProvider } from './lib/connections'

// Code-split all screens — reduces initial bundle from 1MB
const MapScreen = lazy(() =>
  import('./screens/MapScreen').then((m) => ({ default: m.MapScreen }))
)
const MissionsTab = lazy(() =>
  import('./screens/MissionsTab').then((m) => ({ default: m.MissionsTab }))
)
const CommunityScreen = lazy(() =>
  import('./screens/CommunityScreen').then((m) => ({ default: m.CommunityScreen }))
)
const ProfileScreen = lazy(() =>
  import('./screens/ProfileScreen').then((m) => ({ default: m.ProfileScreen }))
)
const LeaderboardScreen = lazy(() =>
  import('./screens/LeaderboardScreen').then((m) => ({ default: m.LeaderboardScreen }))
)

function ScreenLoader() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <p className="animate-pulse font-mono text-xs text-fog-gray">Loading...</p>
    </div>
  )
}

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
    <ChatProvider>
    <DMProvider>
    <ConnectionsProvider>
      <AppShell />
    </ConnectionsProvider>
    </DMProvider>
    </ChatProvider>
    </PartyProvider>
    </XPProvider>
  )
}

function AppShell() {
  const xp = useXP()

  return (
    <div className="min-h-dvh bg-void-black text-terminal-white">
      <ConnectionStatus />
      <main className="mx-auto max-w-lg pb-20">
        <ErrorBoundary level="screen">
          <Suspense fallback={<ScreenLoader />}>
            <Routes>
              <Route path="/" element={<MapScreen />} />
              <Route path="/quests" element={<MissionsTab />} />
              <Route path="/community" element={<CommunityScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/leaderboard" element={<LeaderboardScreen />} />
              {/* Redirect old /party route */}
              <Route path="/party" element={<Navigate to="/community" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
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
    <ErrorBoundary level="global">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  )
}
