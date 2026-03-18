import { useState } from 'react'
import { Compass, Flame, Users, Zap } from 'lucide-react'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'
import { Sheet } from '../components/Sheet'

const ROOMS = [
  { id: 'main-stage', label: 'Main Stage', x: 15, y: 20, w: 35, h: 25, type: 'boss' as const },
  { id: 'workshop-a', label: 'Workshop A', x: 55, y: 20, w: 25, h: 18, type: 'workshop' as const },
  { id: 'workshop-b', label: 'Workshop B', x: 55, y: 42, w: 25, h: 18, type: 'workshop' as const },
  { id: 'networking', label: 'Networking Hub', x: 15, y: 50, w: 35, h: 18, type: 'social' as const },
  { id: 'sponsors', label: 'Sponsor Hall', x: 15, y: 72, w: 35, h: 18, type: 'sponsor' as const },
  { id: 'lounge', label: 'VIP Lounge', x: 55, y: 65, w: 25, h: 25, type: 'social' as const },
]

const typeConfig = {
  boss: { color: 'text-boss-magenta', glow: 'magenta' as const, icon: Flame, badge: 'magenta' as const, label: 'Keynote' },
  workshop: { color: 'text-cyan-pulse', glow: 'cyan' as const, icon: Zap, badge: 'cyan' as const, label: 'Workshop' },
  social: { color: 'text-xp-green', glow: 'green' as const, icon: Users, badge: 'green' as const, label: 'Social' },
  sponsor: { color: 'text-loot-gold', glow: 'gold' as const, icon: Compass, badge: 'gold' as const, label: 'Sponsors' },
}

export function MapScreen() {
  const [selected, setSelected] = useState<string | null>(null)
  const room = ROOMS.find(r => r.id === selected)
  const config = room ? typeConfig[room.type] : null

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2" style={{ paddingTop: 'calc(var(--sat) + 1rem)' }}>
        <div>
          <h1 className="font-mono text-lg font-bold text-terminal-white">NerdCon Quest</h1>
          <p className="font-mono text-xs text-fog-gray">San Diego &middot; Nov 19–20</p>
        </div>
        <Badge color="magenta">LIVE NOW</Badge>
      </div>

      {/* Map */}
      <div className="flex-1 px-4 py-3">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/5 bg-panel-dark">
          <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`h${i}`} x1={0} y1={i * 10} x2={100} y2={i * 10} stroke="rgba(255,255,255,0.03)" strokeWidth={0.2} />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 10} y1={0} x2={100} y2={0 + 100} stroke="rgba(255,255,255,0.03)" strokeWidth={0.2} />
            ))}

            {/* Rooms */}
            {ROOMS.map((r) => {
              const cfg = typeConfig[r.type]
              const isSelected = selected === r.id
              return (
                <g key={r.id} onClick={() => setSelected(r.id)} className="cursor-pointer">
                  <rect
                    x={r.x} y={r.y} width={r.w} height={r.h} rx={1.5}
                    fill={isSelected ? 'rgba(53,104,255,0.15)' : 'rgba(255,255,255,0.03)'}
                    stroke={isSelected ? '#3568FF' : 'rgba(255,255,255,0.08)'}
                    strokeWidth={isSelected ? 0.5 : 0.3}
                  />
                  <text
                    x={r.x + r.w / 2} y={r.y + r.h / 2 - 1.5}
                    textAnchor="middle" fontSize={2.2} fontFamily="JetBrains Mono"
                    fill={isSelected ? '#F0F0F0' : '#888888'}
                  >
                    {r.label}
                  </text>
                  <text
                    x={r.x + r.w / 2} y={r.y + r.h / 2 + 2.5}
                    textAnchor="middle" fontSize={1.6} fontFamily="DM Sans"
                    fill={isSelected ? cfg.color.replace('text-', '#') : 'rgba(136,136,136,0.5)'}
                  >
                    {cfg.label}
                  </text>
                  {/* Activity dot */}
                  {r.type === 'boss' && (
                    <circle cx={r.x + r.w - 2} cy={r.y + 2} r={1}>
                      <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="fill" values="#FF2D78;#FF2D78" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-2 left-2 flex gap-2">
            {Object.entries(typeConfig).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1 rounded-md bg-void-black/80 px-1.5 py-0.5">
                <cfg.icon size={10} className={cfg.color} />
                <span className="font-mono text-[8px] text-fog-gray">{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Room Detail Sheet */}
      <Sheet open={!!room} onClose={() => setSelected(null)}>
        {room && config && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 ${config.color}`}>
                <config.icon size={20} />
              </div>
              <div>
                <h2 className="font-mono text-lg font-bold text-terminal-white">{room.label}</h2>
                <Badge color={config.badge}>{config.label}</Badge>
              </div>
            </div>
            <Card>
              <p className="text-sm text-fog-gray">
                Sessions and activity for this zone will appear here once the agenda is loaded.
              </p>
            </Card>
          </div>
        )}
      </Sheet>
    </div>
  )
}
