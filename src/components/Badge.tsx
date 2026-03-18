import type { ReactNode } from 'react'

type BadgeColor = 'blue' | 'cyan' | 'green' | 'magenta' | 'gold' | 'gray'

interface BadgeProps {
  children: ReactNode
  color?: BadgeColor
}

const colorStyles: Record<BadgeColor, string> = {
  blue: 'bg-nerdcon-blue/15 text-nerdcon-blue border-nerdcon-blue/30',
  cyan: 'bg-cyan-pulse/15 text-cyan-pulse border-cyan-pulse/30',
  green: 'bg-xp-green/15 text-xp-green border-xp-green/30',
  magenta: 'bg-boss-magenta/15 text-boss-magenta border-boss-magenta/30',
  gold: 'bg-loot-gold/15 text-loot-gold border-loot-gold/30',
  gray: 'bg-fog-gray/15 text-fog-gray border-fog-gray/30',
}

export function Badge({ children, color = 'blue' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider ${colorStyles[color]}`}
    >
      {children}
    </span>
  )
}
