import { describe, expect, it } from 'vitest'
import { buildMissions, getLevelInfo } from './xp'

describe('getLevelInfo', () => {
  it('maps XP to the expected level bands', () => {
    expect(getLevelInfo(0)).toMatchObject({ level: 1, label: 'Newbie' })
    expect(getLevelInfo(200)).toMatchObject({ level: 2, label: 'Apprentice' })
    expect(getLevelInfo(500)).toMatchObject({ level: 3, label: 'Operator' })
    expect(getLevelInfo(1000)).toMatchObject({ level: 4, label: 'Veteran' })
    expect(getLevelInfo(1500)).toMatchObject({ level: 5, label: 'Legend' })
  })
})

describe('buildMissions', () => {
  it('marks missions complete when trusted counts meet thresholds', () => {
    const missions = buildMissions(3, 3, 2, 10, 5)
    const completedIds = missions.filter((mission) => mission.completed).map((mission) => mission.id)

    expect(completedIds).toEqual([
      'plan-ahead',
      'first-blood',
      'party-up',
      'social-butterfly',
      'party-chatter',
      'booth-crawler',
    ])
  })

  it('caps progress at each mission target', () => {
    const missions = buildMissions(99, 99, 99, 99, 99)
    const byId = new Map(missions.map((mission) => [mission.id, mission]))

    expect(byId.get('plan-ahead')?.progress).toBe(3)
    expect(byId.get('guild-master')?.progress).toBe(10)
    expect(byId.get('sponsor-champion')?.progress).toBe(12)
  })
})
