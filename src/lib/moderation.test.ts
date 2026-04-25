import { describe, expect, it } from 'vitest'
import { moderateMessage } from './moderation'

describe('moderateMessage', () => {
  it('allows normal conference chat', () => {
    expect(moderateMessage('Anyone going to the payments workshop?')).toEqual({
      allowed: true,
    })
  })

  it('blocks obvious abusive content', () => {
    expect(moderateMessage('kill yourself')).toEqual({
      allowed: false,
      reason: 'Message contains inappropriate content',
    })
  })

  it('blocks URL spam', () => {
    expect(moderateMessage('check this http://spam.example')).toEqual({
      allowed: false,
      reason: 'Message looks like spam',
    })
  })
})
