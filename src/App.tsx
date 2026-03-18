import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import { MapScreen } from './screens/MapScreen'
import { QuestsScreen } from './screens/QuestsScreen'
import { PartyScreen } from './screens/PartyScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { AuthProvider, useAuth } from './lib/auth'

const AgendaScreen = lazy(() => import('./screens/AgendaScreen').then(m => ({ default: m.AgendaScreen })))
const ScheduleScreen = lazy(() => import('./screens/ScheduleScreen').then(m => ({ default: m.ScheduleScreen })))

function LoadingFallback() {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center">
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
    <div className="min-h-dvh bg-void-black text-terminal-white">
      <main className="mx-auto max-w-lg pb-20">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<MapScreen />} />
            <Route path="/quests" element={<QuestsScreen />} />
            <Route path="/agenda" element={<AgendaScreen />} />
            <Route path="/schedule" element={<ScheduleScreen />} />
            <Route path="/party" element={<PartyScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
          </Routes>
        </Suspense>
      </main>
      <TabBar />
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
