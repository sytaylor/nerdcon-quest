/**
 * Client-side content moderation for chat messages.
 * Lightweight blocklist — catches obvious stuff without being heavy-handed.
 * Not a replacement for real moderation, but good enough for 6-person party chats.
 */

// Common slurs and hate speech fragments (lowercase)
// Intentionally kept short — false positives in a conference app are worse than misses
const BLOCKLIST = [
  'fuck you',
  'kill yourself',
  'kys',
  'faggot',
  'nigger',
  'nigga',
  'retard',
  'go die',
  'neck yourself',
]

// Regex patterns for common spam
const SPAM_PATTERNS = [
  /(.)\1{8,}/,                    // Same char repeated 9+ times
  /https?:\/\/\S+/gi,            // URLs (conference app doesn't need links)
  /(\b\w+\b)(\s+\1){4,}/i,      // Same word repeated 5+ times
]

export interface ModerationResult {
  allowed: boolean
  reason?: string
}

export function moderateMessage(content: string): ModerationResult {
  const lower = content.toLowerCase().trim()

  // Check blocklist
  for (const term of BLOCKLIST) {
    if (lower.includes(term)) {
      return { allowed: false, reason: 'Message contains inappropriate content' }
    }
  }

  // Check spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(content)) {
      return { allowed: false, reason: 'Message looks like spam' }
    }
  }

  return { allowed: true }
}
