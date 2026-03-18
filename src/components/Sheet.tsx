import { type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function Sheet({ open, onClose, children }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-panel-dark"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{ paddingBottom: 'var(--sab)' }}
          >
            <div className="sticky top-0 flex justify-center bg-panel-dark py-3">
              <div className="h-1 w-10 rounded-full bg-fog-gray/40" />
            </div>
            <div className="px-5 pb-24">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
