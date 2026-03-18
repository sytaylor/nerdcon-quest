import {
  Flame,
  MessageSquare,
  Wrench,
  Coffee,
  Zap,
  Users,
  Clock,
  MapPin,
  Calendar,
  Plus,
  X,
} from 'lucide-react'
import { Sheet } from '../components/Sheet'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import type { Session } from '../lib/sessions'
import { useUserSchedule } from '../lib/sessions'
import { fmtTime } from '../lib/format'

/* ─── Track / Type Configs ─── */

const trackColor: Record<Session['track'], 'cyan' | 'blue' | 'green' | 'gray'> = {
  builder: 'cyan',
  operator: 'blue',
  explorer: 'green',
  general: 'gray',
}

const typeIcon: Record<Session['session_type'], typeof Flame> = {
  keynote: Flame,
  panel: MessageSquare,
  workshop: Wrench,
  fireside: Coffee,
  lightning: Zap,
  social: Users,
}

const typeColor: Record<Session['session_type'], string> = {
  keynote: 'text-boss-magenta',
  panel: 'text-nerdcon-blue',
  workshop: 'text-cyan-pulse',
  fireside: 'text-loot-gold',
  lightning: 'text-cyan-pulse',
  social: 'text-xp-green',
}

/* ─── Component ─── */

interface Props {
  session: Session | null
  open: boolean
  onClose: () => void
}

export function SessionDetailSheet({ session, open, onClose }: Props) {
  const { isInSchedule, addSession, removeSession } = useUserSchedule()

  if (!session) return <Sheet open={false} onClose={onClose}><div /></Sheet>

  const Icon = typeIcon[session.session_type]
  const inSchedule = isInSchedule(session.id)

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="space-y-5">
        {/* Type + Track badges */}
        <div className="flex items-center gap-2">
          <Badge color={trackColor[session.track]}>{session.track}</Badge>
          <Badge color="gray">
            <Icon size={11} className={`mr-0.5 inline ${typeColor[session.session_type]}`} />
            {session.session_type}
          </Badge>
        </div>

        {/* Title */}
        <h2 className="font-mono text-xl font-bold leading-tight text-terminal-white">
          {session.title}
        </h2>

        {/* Meta */}
        <div className="flex flex-wrap gap-3 text-sm text-fog-gray">
          <span className="inline-flex items-center gap-1">
            <Clock size={14} className="text-nerdcon-blue" />
            {fmtTime(session.start_time)}–{fmtTime(session.end_time)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} className="text-nerdcon-blue" />
            {session.room}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar size={14} className="text-nerdcon-blue" />
            Day {session.day} &middot; Nov {session.day === 1 ? 19 : 20}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-fog-gray">{session.description}</p>

        {/* Speakers */}
        {session.speaker_bios.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-terminal-white">
              Speakers
            </h3>
            {session.speaker_bios.map((speaker) => (
              <Card key={speaker.name}>
                <div>
                  <p className="font-mono text-sm font-bold text-terminal-white">
                    {speaker.name}
                  </p>
                  <p className="text-xs text-nerdcon-blue">
                    {speaker.role} · {speaker.company}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-fog-gray">{speaker.bio}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Tags */}
        {session.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {session.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[10px] text-fog-gray"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Party placeholder */}
        <p className="text-center font-mono text-xs text-fog-gray/50">
          See who from your party is going — coming soon
        </p>

        {/* Schedule toggle */}
        {inSchedule ? (
          <Button
            variant="secondary"
            className="w-full border-boss-magenta/30 text-boss-magenta"
            onClick={() => removeSession(session.id)}
          >
            <X size={16} />
            Remove from Schedule
          </Button>
        ) : (
          <Button className="w-full" onClick={() => addSession(session.id)}>
            <Plus size={16} />
            Add to My Schedule
          </Button>
        )}
      </div>
    </Sheet>
  )
}
