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
    <div className="rounded-xl border border-white/5 bg-panel-dark p-6 flex flex-col items-center gap-4">
      <div className="rounded-lg bg-[#0D0D0D] p-4">
        <QRCodeSVG
          value={payload}
          size={size}
          bgColor="#0D0D0D"
          fgColor="#3568FF"
          level="M"
        />
      </div>
      <p className="font-mono text-lg font-bold text-terminal-white tracking-wider">
        Nerd #{formattedNumber}
      </p>
      <p className="font-mono text-xs text-fog-gray uppercase tracking-widest">
        Scan to Connect
      </p>
    </div>
  )
}
