import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit3, LogOut, Scan, Trophy, User, Users, Zap } from 'lucide-react'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'
import { XPBar } from '../components/XPBar'
import { Button } from '../components/Button'
import { QRCode } from '../components/QRCode'
import { QRScanner } from '../components/QRScanner'
import { ProfileEditor } from '../components/ProfileEditor'
import { useAuth } from '../lib/auth'
import { useXP } from '../lib/xp'
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
  const [showScanner, setShowScanner] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)

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
          {profile && (
            <Button
              variant="secondary"
              className="mt-4 !px-4 !py-2 !text-xs"
              onClick={() => setEditingProfile(true)}
            >
              <Edit3 size={14} />
              Edit Profile
            </Button>
          )}
        </div>
      </Card>

      {profile && editingProfile ? (
        <ProfileEditor
          profile={profile}
          onCancel={() => setEditingProfile(false)}
          onSave={updateProfile}
        />
      ) : profile && (!profile.company || !profile.role || !profile.looking_for) ? (
        <Card className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge color="cyan">Profile</Badge>
              <h2 className="mt-2 font-mono text-sm font-bold text-terminal-white">
                Finish the useful bits
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-fog-gray">
                Add company, role, and what you are looking for so people know why to connect before they scan.
              </p>
            </div>
            <Button
              variant="secondary"
              className="shrink-0 !px-3 !py-2 !text-xs"
              onClick={() => setEditingProfile(true)}
            >
              Edit
            </Button>
          </div>
        </Card>
      ) : null}

      {/* QR Code */}
      {user && profile ? (
        <div className="mb-6">
          <div className="mb-2">
            <h2 className="font-mono text-xs uppercase tracking-wider text-fog-gray">
              Your connection QR
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-fog-gray/80">
              Show this to someone beside you. It is not a login step. If you are testing solo, use Community instead.
            </p>
          </div>
          <div className="mb-3 grid grid-cols-1 gap-2">
            <Button variant="secondary" className="w-full" onClick={() => setShowScanner(true)}>
              <Scan size={16} />
              Scan someone else's QR
            </Button>
            <Button variant="ghost" className="w-full !py-2 text-fog-gray" onClick={() => navigate('/community')}>
              No one nearby? Browse People
            </Button>
          </div>
          <QRCode userId={user.id} nerdNumber={profile.nerd_number} size={150} />
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
