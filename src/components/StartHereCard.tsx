import { ArrowRight, CheckCircle2, Circle, Hash } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from './Badge'
import { Button } from './Button'
import { Card } from './Card'
import { useAuth } from '../lib/auth'
import { useXP } from '../lib/xp'
import { buildLaunchChecklist, formatNerdNumber, getNextLaunchAction } from '../lib/startHere'

export function StartHereCard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const xp = useXP()
  const checklist = buildLaunchChecklist({
    hasProfile: Boolean(profile?.display_name),
    questLine: profile?.quest_line,
    scheduleCount: xp.scheduleCount,
    connectionCount: xp.connectionCount,
  })
  const nextAction = getNextLaunchAction(checklist)
  const completeCount = checklist.filter((item) => item.complete).length

  return (
    <Card glow="cyan" className="mx-5 mt-3 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge color="cyan">Start Here</Badge>
          <h2 className="mt-2 font-mono text-lg font-bold text-terminal-white">
            Your first 5 minutes
          </h2>
          <p className="mt-1 text-sm text-fog-gray">
            Do these before the first session so the app becomes useful in the room.
          </p>
        </div>
        <div className="rounded-xl border border-loot-gold/30 bg-loot-gold/10 px-3 py-2 text-right">
          <div className="flex items-center justify-end gap-1 text-loot-gold">
            <Hash size={13} />
            <span className="font-mono text-sm font-bold">
              {formatNerdNumber(profile?.nerd_number).slice(1)}
            </span>
          </div>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-fog-gray">
            Nerd Number
          </p>
        </div>
      </div>

      <p className="rounded-lg border border-white/5 bg-void-black/60 p-3 text-xs leading-relaxed text-fog-gray">
        Your Nerd Number is your event handle. It gives every attendee a short, memorable ID for QR scans,
        leaderboards, and “find me later” conversations without exposing email or phone details.
      </p>

      <div className="space-y-2">
        {checklist.map((item) => {
          const Icon = item.complete ? CheckCircle2 : Circle
          return (
            <div key={item.id} className="flex items-start gap-3 rounded-lg bg-white/[0.03] p-3">
              <Icon
                size={18}
                className={item.complete ? 'mt-0.5 shrink-0 text-xp-green' : 'mt-0.5 shrink-0 text-fog-gray/50'}
              />
              <div>
                <p className="font-mono text-xs font-bold text-terminal-white">{item.label}</p>
                <p className="mt-0.5 text-xs text-fog-gray">{item.detail}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-fog-gray">
          {completeCount}/{checklist.length} complete
        </span>
        <Button
          variant={nextAction ? 'primary' : 'secondary'}
          onClick={() => navigate(nextAction?.href ?? '/quests')}
        >
          {nextAction?.actionLabel ?? 'Open quests'}
          <ArrowRight size={16} />
        </Button>
      </div>
    </Card>
  )
}
