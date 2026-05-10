import { QRCodeSVG } from 'qrcode.react'

interface QRCodeProps {
  userId: string
  nerdNumber: number
  size?: number
}

export function QRCode({ userId, nerdNumber, size = 200 }: QRCodeProps) {
  const payload = JSON.stringify({
    type: 'nerdcon-connect',
    userId,
    nerdNumber,
  })

  const formattedNumber = String(nerdNumber).padStart(4, '0')

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-white/5 bg-panel-dark p-4">
      <div className="rounded-lg bg-[#0D0D0D] p-3">
        <QRCodeSVG
          value={payload}
          size={size}
          bgColor="#0D0D0D"
          fgColor="#3568FF"
          level="M"
        />
      </div>
      <p className="font-mono text-base font-bold tracking-wider text-terminal-white">
        Nerd #{formattedNumber}
      </p>
      <p className="font-mono text-xs text-fog-gray uppercase tracking-widest">
        Show this to connect
      </p>
    </div>
  )
}
