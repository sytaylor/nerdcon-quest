import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface XPToastProps {
  message: string
  xp: number
  visible: boolean
  onDone: () => void
}

export function XPToast({ message, xp, visible, onDone }: XPToastProps) {
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(onDone, 3000)
    return () => clearTimeout(timer)
  }, [visible, onDone])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed left-1/2 top-6 z-60 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-xl border border-xp-green/30 bg-panel-dark/95 px-4 py-2.5 shadow-glow-green backdrop-blur">
            <span className="font-mono text-sm text-terminal-white">{message}</span>
            <span className="font-mono text-sm font-bold text-xp-green">+{xp} XP</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
