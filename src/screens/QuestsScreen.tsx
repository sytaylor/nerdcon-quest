import { useNavigate } from 'react-router-dom'
import { Swords, Hammer, Settings, Compass, Lock, CalendarDays, CalendarCheck } from 'lucide-react'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'
import { XPBar } from '../components/XPBar'
import { Button } from '../components/Button'
import { useAuth } from '../lib/auth'

const QUEST_LINES = [
  { id: 'builder', label: "Builder's Path", icon: Hammer, color: 'cyan' as const, desc: 'Deep technical sessions, API workshops, architecture debates' },
  { id: 'operator', label: "Operator's Route", icon: Settings, color: 'blue' as const, desc: 'Strategy, scale, regulation, GTM' },
  { id: 'explorer', label: "Explorer's Trail", icon: Compass, color: 'green' as const, desc: 'Networking, social events, activations' },
]

const SAMPLE_QUESTS = [
  { name: 'First Blood', xp: 50, desc: 'Connect with your first fellow nerd via QR scan', type: 'Social', status: 'available' },
  { name: 'Plan Ahead', xp: 50, desc: 'Add 3+ sessions to your schedule', type: 'Content', status: 'available' },
  { name: 'Deep Dive', xp: 100, desc: 'Attend 3 sessions in your quest line and rate each', type: 'Content', status: 'available' },
  { name: 'Party Up', xp: 75, desc: 'Form or join a party of 3+ members', type: 'Social', status: 'available' },
  { name: 'Social Butterfly', xp: 75, desc: 'RSVP to 2+ social events or parties', type: 'Social', status: 'available' },
  { name: 'Cartographer', xp: 50, desc: 'Visit every zone on the venue map', type: 'Explore', status: 'locked' },
  { name: 'Boss Fight: Keynote', xp: 150, desc: 'Attend keynote and submit a reaction', type: 'Content', status: 'locked' },
]

export function QuestsScreen() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  return (
    <div className="min-h-[calc(100dvh-4rem)] px-5 pb-24" style={{ paddingTop: 'calc(var(--sat) + 1rem)' }}>
      <h1 className="mb-1 font-mono text-lg font-bold text-terminal-white">Quest Log</h1>
      <p className="mb-5 font-mono text-xs text-fog-gray">Choose your path. Complete quests. Level up.</p>

      {/* Quick nav to Agenda + Schedule */}
      <div className="mb-6 grid grid-cols-2 gap-2">
        <Button variant="secondary" className="w-full" onClick={() => navigate('/agenda')}>
          <CalendarDays size={16} />
          Agenda
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => navigate('/schedule')}>
          <CalendarCheck size={16} />
          My Schedule
        </Button>
      </div>

      {/* Quest Lines — display only, shows your active path */}
      <div className="mb-6 space-y-2">
        <h2 className="font-mono text-xs uppercase tracking-wider text-fog-gray">Your Quest Line</h2>
        <div className="grid grid-cols-3 gap-2">
          {QUEST_LINES.map((ql) => {
            const isActive = profile?.quest_line === ql.id
            return (
              <div
                key={ql.id}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 ${
                  isActive
                    ? 'border-nerdcon-blue/40 bg-nerdcon-blue/10'
                    : 'border-white/5 bg-panel-dark opacity-40'
                }`}
              >
                <ql.icon size={20} className={`text-${ql.color === 'cyan' ? 'cyan-pulse' : ql.color === 'blue' ? 'nerdcon-blue' : 'xp-green'}`} />
                <span className="font-mono text-[10px] text-terminal-white">{ql.label}</span>
                {isActive && <Badge color="blue">Active</Badge>}
              </div>
            )
          })}
        </div>
      </div>

      {/* XP Progress */}
      <div className="mb-6">
        <XPBar current={profile?.xp ?? 0} max={200} level={profile?.level ?? 1} label="Newbie" />
      </div>

      {/* Quests */}
      <div className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-fog-gray">Available Quests</h2>
        {SAMPLE_QUESTS.map((q) => (
          <Card key={q.name} className={q.status === 'locked' ? 'opacity-50' : ''}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {q.status === 'locked' ? (
                    <Lock size={14} className="text-fog-gray" />
                  ) : (
                    <Swords size={14} className="text-nerdcon-blue" />
                  )}
                  <span className="font-mono text-sm font-bold text-terminal-white">{q.name}</span>
                </div>
                <p className="mt-1 text-xs text-fog-gray">{q.desc}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge color="green">+{q.xp} XP</Badge>
                <Badge color="gray">{q.type}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
