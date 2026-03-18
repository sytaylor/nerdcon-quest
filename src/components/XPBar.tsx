import { motion } from 'framer-motion'

interface XPBarProps {
  current: number
  max: number
  level: number
  label?: string
}

export function XPBar({ current, max, level, label }: XPBarProps) {
  const pct = Math.min((current / max) * 100, 100)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="text-xp-green">
          LVL {level} {label && `— ${label}`}
        </span>
        <span className="text-fog-gray">
          {current} / {max} XP
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-full bg-xp-green"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          style={{ boxShadow: '0 0 8px rgba(57, 255, 20, 0.5)' }}
        />
      </div>
    </div>
  )
}
