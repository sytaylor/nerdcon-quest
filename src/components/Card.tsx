import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  glow?: 'blue' | 'cyan' | 'green' | 'magenta' | 'gold' | 'none'
}

const glowStyles = {
  blue: 'shadow-glow-blue',
  cyan: 'shadow-glow-cyan',
  green: 'shadow-glow-green',
  magenta: 'shadow-glow-magenta',
  gold: 'shadow-glow-gold',
  none: '',
}

export function Card({ children, className = '', glow = 'none' }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-white/5 bg-panel-dark p-4 ${glowStyles[glow]} ${className}`}
    >
      {children}
    </div>
  )
}
