import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function ConnectionStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handleOnline = () => { setOnline(true); setDismissed(false) }
    const handleOffline = () => { setOnline(false); setDismissed(false) }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const show = !online && !dismissed

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-boss-magenta/90 px-4 py-2 text-center backdrop-blur-sm"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
        >
          <WifiOff size={14} className="shrink-0 text-terminal-white" />
          <span className="font-mono text-xs text-terminal-white">
            You're offline — some features may not work
          </span>
          <button
            onClick={() => setDismissed(true)}
            className="ml-2 font-mono text-xs text-terminal-white/70 hover:text-terminal-white"
            aria-label="Dismiss"
          >
            &times;
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
