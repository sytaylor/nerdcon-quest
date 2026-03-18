import { Users, Plus, QrCode, MapPin, Share2 } from 'lucide-react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'

export function PartyScreen() {
  return (
    <div className="min-h-[calc(100dvh-4rem)] px-5 pb-24" style={{ paddingTop: 'calc(var(--sat) + 1rem)' }}>
      <h1 className="mb-1 font-mono text-lg font-bold text-terminal-white">Party Hub</h1>
      <p className="mb-6 font-mono text-xs text-fog-gray">Team up. See each other on the map. Conquer quests together.</p>

      {/* No party state */}
      <Card glow="blue" className="mb-6">
        <div className="flex flex-col items-center py-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-nerdcon-blue/10">
            <Users size={28} className="text-nerdcon-blue" />
          </div>
          <h2 className="mb-1 font-mono text-base font-bold text-terminal-white">No Party Yet</h2>
          <p className="mb-5 max-w-xs text-sm text-fog-gray">
            Form a party of 2-6 nerds. Share schedules, see each other on the map, and earn bonus XP together.
          </p>
          <div className="flex gap-3">
            <Button variant="primary">
              <Plus size={16} />
              Create Party
            </Button>
            <Button variant="secondary">
              <QrCode size={16} />
              Join
            </Button>
          </div>
        </div>
      </Card>

      {/* Preview of what it looks like with a party */}
      <div className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-fog-gray">What You'll See</h2>

        <Card>
          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-cyan-pulse" />
            <div>
              <p className="text-sm font-medium text-terminal-white">Live member locations</p>
              <p className="text-xs text-fog-gray">See where your party is on the venue map</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Share2 size={16} className="text-xp-green" />
            <div>
              <p className="text-sm font-medium text-terminal-white">Schedule overlap</p>
              <p className="text-xs text-fog-gray">"3/4 of your party is going to this session"</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Badge color="gold">XP</Badge>
            <div>
              <p className="text-sm font-medium text-terminal-white">Party activity feed</p>
              <p className="text-xs text-fog-gray">See quest completions, RSVPs, and milestones</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
