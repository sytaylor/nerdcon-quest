import { useEffect, useState } from 'react'
import { Save, X } from 'lucide-react'
import type { Profile } from '../lib/auth'
import { Button } from './Button'
import { Card } from './Card'

interface ProfileEditorProps {
  profile: Profile
  onCancel: () => void
  onSave: (updates: Partial<Profile>) => Promise<void>
}

const inputClass =
  'mt-1 w-full rounded-lg border border-white/10 bg-void-black px-4 py-3 font-sans text-sm text-terminal-white placeholder:text-fog-gray/50 outline-none focus:border-nerdcon-blue/60'

export function ProfileEditor({ profile, onCancel, onSave }: ProfileEditorProps) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [company, setCompany] = useState(profile.company ?? '')
  const [role, setRole] = useState(profile.role ?? '')
  const [lookingFor, setLookingFor] = useState(profile.looking_for ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setDisplayName(profile.display_name ?? '')
    setCompany(profile.company ?? '')
    setRole(profile.role ?? '')
    setLookingFor(profile.looking_for ?? '')
  }, [profile])

  async function handleSave() {
    if (!displayName.trim()) {
      setError('Name is required')
      return
    }

    setSaving(true)
    setError('')
    await onSave({
      display_name: displayName.trim(),
      company: company.trim() || null,
      role: role.trim() || null,
      looking_for: lookingFor.trim() || null,
    })
    setSaving(false)
    onCancel()
  }

  return (
    <Card glow="cyan" className="mb-6 space-y-4">
      <div>
        <h2 className="font-mono text-sm font-bold text-terminal-white">Edit public profile</h2>
        <p className="mt-1 text-xs text-fog-gray">
          These details help other attendees decide why to connect.
        </p>
      </div>

      <label className="block">
        <span className="font-mono text-xs uppercase tracking-wider text-fog-gray">Name *</span>
        <input
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Your name"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="font-mono text-xs uppercase tracking-wider text-fog-gray">Company</span>
        <input
          type="text"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          placeholder="Where you work"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="font-mono text-xs uppercase tracking-wider text-fog-gray">Role</span>
        <input
          type="text"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          placeholder="e.g. CTO, Product Lead, Engineer"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="font-mono text-xs uppercase tracking-wider text-fog-gray">Looking for</span>
        <input
          type="text"
          value={lookingFor}
          onChange={(event) => setLookingFor(event.target.value)}
          placeholder="e.g. Co-founders, API partners, investors"
          className={inputClass}
        />
      </label>

      {error && <p className="font-mono text-xs text-boss-magenta">{error}</p>}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          <X size={16} />
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          <Save size={16} />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </Card>
  )
}
