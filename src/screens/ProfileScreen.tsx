import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, LogOut, Zap, Trophy, Users, Scan, MessageCircle } from 'lucide-react'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'
import { XPBar } from '../components/XPBar'
import { Button } from '../components/Button'
import { QRCode } from '../components/QRCode'
import { QRScanner } from '../components/QRScanner'
import { DMInbox } from '../components/DMInbox'
import { useAuth } from '../lib/auth'
import { useXP } from '../lib/xp'
import { useDM } from '../lib/dm'
import { supabase } from '../lib/supabase'

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
  const navigate = useNavigate()
  const { profile, user, signOut, updateProfile } = useAuth()
  const xp = useXP()
  const dm = useDM()
  const [showScanner, setShowScanner] = useState(false)
  const [showDMs, setShowDMs] = useState(false)

  const handleScan = useCallback(async (data: { userId: string; nerdNumber: number }) => {
    setShowScanner(false)
    if (!user) return

    // Anti-gaming: prevent self-scan
    if (data.userId === user.id) {
      alert("Nice try! You can't scan your own QR code.")
      return
    }

    // Order user IDs so user_a < user_b (schema constraint)
    const [userA, userB] = [user.id, data.userId].sort()

    const { error } = await supabase
      .from('connections')
      .upsert({ user_a: userA, user_b: userB }, { onConflict: 'user_a,user_b' })

    if (error) {
      alert('Connection failed — try again')
    } else {
      alert(`Connected with Nerd #${String(data.nerdNumber).padStart(4, '0')}!`)
      xp.checkMissions()
    }
  }, [user, xp])

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
          <span className="font-mono text-lg font-bold text-terminal-white">{xp.scheduleCount}</span>
          <span className="text-[10px] text-fog-gray">Sessions</span>
        </Card>
        <Card className="flex flex-col items-center py-3">
          <Users size={18} className="mb-1 text-xp-green" />
          <span className="font-mono text-lg font-bold text-terminal-white">{xp.connectionCount}</span>
          <span className="text-[10px] text-fog-gray">Connections</span>
        </Card>
        <Card className="flex flex-col items-center py-3">
          <Trophy size={18} className="mb-1 text-loot-gold" />
          <span className="font-mono text-lg font-bold text-terminal-white">{xp.missions.filter(m => m.completed).length}</span>
          <span className="text-[10px] text-fog-gray">Quests</span>
        </Card>
      </div>

      {/* Leaderboard */}
      <Button variant="secondary" className="mb-6 w-full" onClick={() => navigate('/leaderboard')}>
        <Trophy size={16} />
        Leaderboard
      </Button>

      {/* Messages */}
      {user && (
        <div className="mb-6">
          {showDMs ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-mono text-xs uppercase tracking-wider text-fog-gray">Messages</h2>
                <button
                  onClick={() => { setShowDMs(false); dm.closeConversation() }}
                  className="font-mono text-[10px] text-fog-gray hover:text-terminal-white"
                >
                  Close
                </button>
              </div>
              <DMInbox />
            </>
          ) : (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowDMs(true)}
            >
              <MessageCircle size={16} />
              Messages
              {dm.totalUnread > 0 && (
                <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-boss-magenta px-1.5 font-mono text-[10px] font-bold text-white">
                  {dm.totalUnread}
                </span>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Quest Line Switcher */}
      {user && profile && (
        <div className="mb-6">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-wider text-fog-gray">Quest Line</h2>
          <div className="grid grid-cols-3 gap-2">
            {(['builder', 'operator', 'explorer'] as const).map((ql) => {
              const isActive = profile.quest_line === ql
              const labels = { builder: "Builder's Path", operator: "Operator's Route", explorer: "Explorer's Trail" }
              const colors = { builder: 'text-cyan-pulse', operator: 'text-nerdcon-blue', explorer: 'text-xp-green' }
              return (
                <button
                  key={ql}
                  onClick={() => !isActive && updateProfile({ quest_line: ql })}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-colors ${
                    isActive
                      ? 'border-nerdcon-blue/40 bg-nerdcon-blue/10'
                      : 'border-white/5 bg-panel-dark hover:border-white/20'
                  }`}
                >
                  <span className={`font-mono text-[10px] ${isActive ? colors[ql] : 'text-fog-gray'}`}>
                    {labels[ql]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

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
