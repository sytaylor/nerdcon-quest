import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface Segment {
  key: string
  label: string
  icon?: LucideIcon
  badge?: number | null
  dot?: boolean
  pulse?: boolean
}

interface SegmentedControlProps {
  segments: Segment[]
  active: string
  onChange: (key: string) => void
}

export function SegmentedControl({ segments, active, onChange }: SegmentedControlProps) {
  return (
    <div className="inline-flex w-full rounded-full border border-white/5 bg-panel-dark p-1">
      {segments.map((segment) => {
        const isActive = segment.key === active
        const Icon = segment.icon
        return (
          <button
            key={segment.key}
            onClick={() => onChange(segment.key)}
            className="relative flex-1 inline-flex items-center justify-center rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors"
          >
            {isActive && (
              <motion.div
                layoutId="segment-indicator"
                className="absolute inset-0 rounded-full bg-nerdcon-blue shadow-glow-blue"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span
              className={`relative z-10 inline-flex items-center gap-1.5 ${
                isActive
                  ? 'text-terminal-white'
                  : 'text-fog-gray hover:text-terminal-white'
              }`}
            >
              {Icon && (
                <Icon
                  size={13}
                  className={segment.pulse && !isActive ? 'animate-pulse text-loot-gold' : ''}
                />
              )}
              {segment.label}
            </span>

            {segment.badge != null && segment.badge > 0 && (
              <span className="relative z-10 ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-nerdcon-blue px-1 text-[9px] font-bold text-terminal-white">
                {segment.badge}
              </span>
            )}

            {segment.dot && (
              <span className="absolute right-2 top-1 z-10 h-1.5 w-1.5 rounded-full bg-boss-magenta" />
            )}
          </button>
        )
      })}
    </div>
  )
}
