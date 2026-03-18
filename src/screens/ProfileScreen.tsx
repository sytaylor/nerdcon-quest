import { useState, useCallback } from 'react'
import { User, LogOut, Zap, Trophy, Users, Scan } from 'lucide-react'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'
import { XPBar } from '../components/XPBar'
import { Button } from '../components/Button'
import { QRCode } from '../components/QRCode'
import { QRScanner } from '../components/QRScanner'
import { useAuth } from '../lib/auth'

const LEVEL_THRESHOLDS = [
  { level: 1, min: 0, max: 200, label: 'Newbie' },
  { level: 2, min: 200, max: 500, label: 'Apprentice' },
  { level: 3, min: 500, max: 1000, label: 'Operator' },
  { level: 4, min: 1000, max: 1500, label: 'Veteran' },
  { level: 5, min: 1500, max: 2000, label: 'Legend' },
]

function getLevelInfo(xp: number) {
  const tier = LEVEL_THRESHOLDS.find((t) => xp < t.max) ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  return tier
}

export function ProfileScreen() {
  const { profile, user, signOut } = useAuth()
  const [showScanner, setShowScanner] = useState(false)

  const handleScan = useCallback((data: { userId: string; nerdNumber: number }) => {
    setShowScanner(false)
    // TODO: create connection via Supabase
    alert(`Connected with Nerd #${String(data.nerdNumber).padStart(4, '0')}!`)
  }, [])

  const nerdNum = String(profile?.nerd_number ?? 0).padStart(4, '0')
  const levelInfo = getLevelInfo(profile?.xp ?? 0)

  return (
    <div className="min-h-[calc(100dvh-4rem)] px-5 pb-24" style={{ paddingTop: 'calc(var(--sat) + 1rem)' }}>
      <h1 className="mb-1 font-mono text-lg font-bold text-terminal-white">Character Sheet</h1>
      <p className="mb-6 font-mono text-xs text-fog-gray">Your NerdCon identity.</p>

      {/* Avatar + Info */}
      <Card glow="blue" className="mb-6">
        <div className="flex flex-col items-center py-4">
          <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full border-2 border-nerdcon-blue/40 bg-nerdcon-blue/10">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <User size={36} className="text-nerdcon-blue" />
            )}
          </div>
          <h2 className="font-mono text-lg font-bold text-terminal-white">
            {profile?.display_name ?? `Nerd #${nerdNum}`}
          </h2>
          {profile?.company && (
            <p className="text-sm text-fog-gray">{profile.company}{profile.role ? ` · ${profile.role}` : ''}</p>
          )}
          <div className="mt-2 flex gap-2">
            <Badge color="gold">Nerd #{nerdNum}</Badge>
            <Badge color="blue">Level {levelInfo.level}</Badge>
            <Badge color="green">{profile?.xp ?? 0} XP</Badge>
          </div>
          {profile?.looking_for && (
            <p className="mt-3 text-center text-xs text-fog-gray">
              Looking for: {profile.looking_for}
            </p>
          )}
        </div>
      </Card>

      {/* QR Code */}
      {user && profile ? (
        <div className="mb-6">
          <QRCode userId={user.id} nerdNumber={profile.nerd_number} size={180} />
        </div>
      ) : (
        <Card className="mb-6">
          <div className="flex flex-col items-center py-4">
            <div className="mb-3 flex h-28 w-28 items-center justify-center rounded-xl border border-dashed border-white/10 bg-void-black">
              <Scan size={48} className="text-fog-gray/40" />
            </div>
            <p className="text-xs text-fog-gray">Sign in to get your QR code</p>
          </div>
        </Card>
      )}

      {/* Scan button */}
      {user && (
        <Button variant="secondary" className="mb-6 w-full" onClick={() => setShowScanner(true)}>
          <Scan size={16} />
          Scan a Nerd's QR Code
        </Button>
      )}

      {/* XP */}
      <div className="mb-6">
        <XPBar
          current={profile?.xp ?? 0}
          max={levelInfo.max}
          level={levelInfo.level}
          label={levelInfo.label}
        />
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-2">
        <Card className="flex flex-col items-center py-3">
          <Zap size={18} className="mb-1 text-cyan-pulse" />
          <span className="font-mono text-lg font-bold text-terminal-white">0</span>
          <span className="text-[10px] text-fog-gray">Sessions</span>
        </Card>
        <Card className="flex flex-col items-center py-3">
          <Users size={18} className="mb-1 text-xp-green" />
          <span className="font-mono text-lg font-bold text-terminal-white">0</span>
          <span className="text-[10px] text-fog-gray">Connections</span>
        </Card>
        <Card className="flex flex-col items-center py-3">
          <Trophy size={18} className="mb-1 text-loot-gold" />
          <span className="font-mono text-lg font-bold text-terminal-white">0</span>
          <span className="text-[10px] text-fog-gray">Quests</span>
        </Card>
      </div>

      {/* Auth actions */}
      {user ? (
        <Button variant="ghost" className="w-full text-fog-gray" onClick={signOut}>
          <LogOut size={16} />
          Sign Out
        </Button>
      ) : (
        <p className="text-center text-xs text-fog-gray">Sign in to unlock your character sheet</p>
      )}

      {/* QR Scanner overlay */}
      {showScanner && (
        <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  )
}
