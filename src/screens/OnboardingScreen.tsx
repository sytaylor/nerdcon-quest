import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hammer, Settings, Compass, ArrowRight, Loader2, Mail } from 'lucide-react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'
import { useAuth } from '../lib/auth'

type Step = 'email' | 'check-email' | 'profile' | 'quest-line'

const QUEST_LINES = [
  {
    id: 'builder' as const,
    label: "Builder's Path",
    icon: Hammer,
    color: 'cyan' as const,
    desc: 'Deep technical sessions, API workshops, architecture debates',
    emoji: '🔨',
  },
  {
    id: 'operator' as const,
    label: "Operator's Route",
    icon: Settings,
    color: 'blue' as const,
    desc: 'Strategy, scale, regulation, GTM. For PMs, product leads, execs.',
    emoji: '⚙️',
  },
  {
    id: 'explorer' as const,
    label: "Explorer's Trail",
    icon: Compass,
    color: 'green' as const,
    desc: 'Networking, social events, activations. For the connector archetype.',
    emoji: '🧭',
  },
]

export function OnboardingScreen() {
  const { signIn, updateProfile, profile } = useAuth()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  // Profile fields
  const [displayName, setDisplayName] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [lookingFor, setLookingFor] = useState('')

  async function handleSignIn() {
    if (!email.includes('@')) {
      setError('Enter a valid email')
      return
    }
    setSending(true)
    setError('')
    const { error: err } = await signIn(email)
    setSending(false)
    if (err) {
      setError(err.message)
    } else {
      setStep('check-email')
    }
  }

  async function handleProfileSave() {
    if (!displayName.trim()) {
      setError('Name is required')
      return
    }
    setError('')
    await updateProfile({
      display_name: displayName.trim(),
      company: company.trim() || null,
      role: role.trim() || null,
      looking_for: lookingFor.trim() || null,
    })
    setStep('quest-line')
  }

  async function handleQuestLine(ql: 'builder' | 'operator' | 'explorer') {
    await updateProfile({ quest_line: ql })
  }

  // If user is authed but hasn't set display_name, jump to profile step
  if (profile && !profile.display_name && step === 'email') {
    setStep('profile')
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <AnimatePresence mode="wait">
        {step === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm space-y-6 text-center"
          >
            <div>
              <h1 className="font-mono text-2xl font-bold text-terminal-white">
                NerdCon Quest
              </h1>
              <p className="mt-2 text-sm text-fog-gray">
                San Diego &middot; Nov 19–20, 2026
              </p>
              <p className="mt-4 text-sm text-fog-gray">
                The conference app that plays like a game.
              </p>
            </div>

            <Card glow="blue" className="space-y-4 text-left">
              <label className="block">
                <span className="font-mono text-xs uppercase tracking-wider text-fog-gray">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                  placeholder="you@company.com"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-void-black px-4 py-3 font-mono text-sm text-terminal-white placeholder:text-fog-gray/50 focus:border-nerdcon-blue focus:outline-none"
                />
              </label>
              {error && <p className="font-mono text-xs text-boss-magenta">{error}</p>}
              <Button
                variant="primary"
                className="w-full"
                onClick={handleSignIn}
                disabled={sending}
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Mail size={16} />
                )}
                {sending ? 'Sending...' : 'Sign In with Magic Link'}
              </Button>
            </Card>

            <p className="text-xs text-fog-gray/60">
              No password needed. We'll email you a login link.
            </p>
          </motion.div>
        )}

        {step === 'check-email' && (
          <motion.div
            key="check-email"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm space-y-6 text-center"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-nerdcon-blue/10">
              <Mail size={36} className="text-nerdcon-blue" />
            </div>
            <h1 className="font-mono text-xl font-bold text-terminal-white">Check Your Email</h1>
            <p className="text-sm text-fog-gray">
              We sent a magic link to{' '}
              <span className="font-mono text-terminal-white">{email}</span>
            </p>
            <p className="text-xs text-fog-gray/60">
              Click the link in the email to sign in. You can close this tab.
            </p>
            <Button variant="ghost" onClick={() => setStep('email')}>
              Use a different email
            </Button>
          </motion.div>
        )}

        {step === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm space-y-6"
          >
            <div className="text-center">
              <Badge color="green">
                Nerd #{String(profile?.nerd_number ?? 0).padStart(4, '0')}
              </Badge>
              <h1 className="mt-3 font-mono text-xl font-bold text-terminal-white">
                Set Up Your Character
              </h1>
              <p className="mt-1 text-sm text-fog-gray">
                This is how other nerds will see you.
              </p>
            </div>

            <Card className="space-y-4">
              <label className="block">
                <span className="font-mono text-xs uppercase tracking-wider text-fog-gray">
                  Name *
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-void-black px-4 py-3 font-mono text-sm text-terminal-white placeholder:text-fog-gray/50 focus:border-nerdcon-blue focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="font-mono text-xs uppercase tracking-wider text-fog-gray">
                  Company
                </span>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Where you work"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-void-black px-4 py-3 font-mono text-sm text-terminal-white placeholder:text-fog-gray/50 focus:border-nerdcon-blue focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="font-mono text-xs uppercase tracking-wider text-fog-gray">
                  Role
                </span>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. CTO, Product Lead, Engineer"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-void-black px-4 py-3 font-mono text-sm text-terminal-white placeholder:text-fog-gray/50 focus:border-nerdcon-blue focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="font-mono text-xs uppercase tracking-wider text-fog-gray">
                  Looking for
                </span>
                <input
                  type="text"
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  placeholder="e.g. Co-founder, API partners, investors"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-void-black px-4 py-3 font-mono text-sm text-terminal-white placeholder:text-fog-gray/50 focus:border-nerdcon-blue focus:outline-none"
                />
              </label>
              {error && <p className="font-mono text-xs text-boss-magenta">{error}</p>}
            </Card>

            <Button variant="primary" className="w-full" onClick={handleProfileSave}>
              Continue
              <ArrowRight size={16} />
            </Button>
          </motion.div>
        )}

        {step === 'quest-line' && (
          <motion.div
            key="quest-line"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm space-y-6"
          >
            <div className="text-center">
              <h1 className="font-mono text-xl font-bold text-terminal-white">
                Choose Your Path
              </h1>
              <p className="mt-1 text-sm text-fog-gray">
                This shapes your quest line and recommended sessions. You can switch later.
              </p>
            </div>

            <div className="space-y-3">
              {QUEST_LINES.map((ql) => (
                <motion.button
                  key={ql.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleQuestLine(ql.id)}
                  className="flex w-full items-start gap-4 rounded-xl border border-white/5 bg-panel-dark p-4 text-left transition-colors hover:border-nerdcon-blue/30"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-lg`}>
                    {ql.emoji}
                  </div>
                  <div>
                    <p className="font-mono text-sm font-bold text-terminal-white">{ql.label}</p>
                    <p className="mt-0.5 text-xs text-fog-gray">{ql.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
