import { describe, expect, it } from 'vitest'
import { buildLaunchChecklist, formatNerdNumber, getNextLaunchAction } from './startHere'

describe('startHere', () => {
  it('formats event handles consistently', () => {
    expect(formatNerdNumber(42)).toBe('#0042')
    expect(formatNerdNumber(null)).toBe('#0000')
  })

  it('prioritizes the first incomplete launch action', () => {
    const items = buildLaunchChecklist({
      hasProfile: true,
      questLine: 'builder',
      scheduleCount: 2,
      connectionCount: 0,
    })

    expect(items.map((item) => item.complete)).toEqual([true, true, false, false])
    expect(getNextLaunchAction(items)?.id).toBe('schedule')
  })

  it('sends solo connection work to Community instead of the camera scanner', () => {
    const items = buildLaunchChecklist({
      hasProfile: true,
      questLine: 'operator',
      scheduleCount: 3,
      connectionCount: 0,
    })

    const connection = getNextLaunchAction(items)

    expect(connection?.id).toBe('connection')
    expect(connection?.actionLabel).toBe('Browse people')
    expect(connection?.href).toBe('/community')
  })

  it('returns no action once the launch checklist is complete', () => {
    const items = buildLaunchChecklist({
      hasProfile: true,
      questLine: 'explorer',
      scheduleCount: 3,
      connectionCount: 1,
    })

    expect(getNextLaunchAction(items)).toBeNull()
  })
})
