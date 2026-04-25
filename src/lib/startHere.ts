export interface LaunchChecklistInput {
  hasProfile: boolean
  questLine: string | null | undefined
  scheduleCount: number
  connectionCount: number
}

export interface LaunchChecklistItem {
  id: 'profile' | 'quest-line' | 'schedule' | 'connection'
  label: string
  detail: string
  complete: boolean
  actionLabel: string
  href: string
}

export function formatNerdNumber(nerdNumber: number | null | undefined): string {
  return `#${String(nerdNumber ?? 0).padStart(4, '0')}`
}

export function buildLaunchChecklist(input: LaunchChecklistInput): LaunchChecklistItem[] {
  return [
    {
      id: 'profile',
      label: 'Claim your Nerd Number',
      detail: 'This is your event handle for QR scans, rankings, and introductions.',
      complete: input.hasProfile,
      actionLabel: 'Finish profile',
      href: '/profile',
    },
    {
      id: 'quest-line',
      label: 'Pick your quest line',
      detail: 'Choose Builder, Operator, or Explorer so the app can bias your missions.',
      complete: Boolean(input.questLine),
      actionLabel: 'Pick path',
      href: '/profile',
    },
    {
      id: 'schedule',
      label: 'Save 3 sessions',
      detail: `${Math.min(input.scheduleCount, 3)}/3 saved for the Plan Ahead mission.`,
      complete: input.scheduleCount >= 3,
      actionLabel: 'Build schedule',
      href: '/quests',
    },
    {
      id: 'connection',
      label: 'Make your first connection',
      detail: input.connectionCount > 0 ? 'First scan complete.' : 'Open your QR scanner and trade badges with someone nearby.',
      complete: input.connectionCount >= 1,
      actionLabel: 'Scan QR',
      href: '/profile',
    },
  ]
}

export function getNextLaunchAction(items: LaunchChecklistItem[]): LaunchChecklistItem | null {
  return items.find((item) => !item.complete) ?? null
}
