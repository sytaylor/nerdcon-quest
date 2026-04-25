import { describe, expect, it } from 'vitest'
import { fmtTime } from './format'

describe('fmtTime', () => {
  it('keeps hour and minute for HH:MM input', () => {
    expect(fmtTime('09:30')).toBe('09:30')
  })

  it('drops seconds for HH:MM:SS input', () => {
    expect(fmtTime('14:05:00')).toBe('14:05')
  })
})
