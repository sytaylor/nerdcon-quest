import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface QRScannerProps {
  onScan: (data: { userId: string; nerdNumber: number }) => void
  onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerId = 'qr-reader'

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText)
            if (
              data.type === 'nerdcon-connect' &&
              typeof data.userId === 'string' &&
              typeof data.nerdNumber === 'number'
            ) {
              scanner.stop().catch(() => {})
              onScan({ userId: data.userId, nerdNumber: data.nerdNumber })
            }
          } catch {
            // Ignore non-JSON or invalid QR codes
          }
        },
        () => {
          // Scan failure per frame — not an error
        },
      )
      .catch(() => {
        setError('Camera access is blocked. Allow camera permissions in Safari and make sure you are on HTTPS, or close this and browse People instead.')
      })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [onScan])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-void-black/95"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 rounded-full border border-white/10 bg-panel-dark p-2 text-fog-gray transition-colors hover:text-terminal-white"
          aria-label="Close scanner"
        >
          <X size={24} />
        </button>

        {error ? (
          <motion.div
            className="flex flex-col items-center gap-6 px-6 text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="rounded-xl border border-boss-magenta/30 bg-boss-magenta/10 p-6">
              <p className="font-mono text-sm text-boss-magenta">{error}</p>
              <p className="mt-3 text-xs text-fog-gray">
                QR scanning is only for when another attendee is beside you. You can still connect from Community.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-panel-dark px-6 py-3 font-mono text-sm text-terminal-white transition-colors hover:border-nerdcon-blue/50"
            >
              Close
            </button>
          </motion.div>
        ) : (
          <motion.div
            className="flex flex-col items-center gap-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <p className="font-mono text-xs uppercase tracking-widest text-fog-gray">
              Scanning...
            </p>

            {/* Viewfinder with cyan-pulse border animation */}
            <div className="relative rounded-2xl border-2 border-cyan-pulse/40 p-1 animate-pulse shadow-glow-cyan">
              <div
                id={containerId}
                className="h-[280px] w-[280px] overflow-hidden rounded-xl bg-panel-dark"
              />
            </div>

            <p className="font-mono text-xs text-fog-gray">
              Point at another attendee's Nerd QR code
            </p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
