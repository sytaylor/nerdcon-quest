import { NavLink } from 'react-router-dom'
import { Map, Swords, Users, User } from 'lucide-react'
import { useChat } from '../lib/chat'

const tabs = [
  { to: '/', icon: Map, label: 'Map' },
  { to: '/quests', icon: Swords, label: 'Quests' },
  { to: '/party', icon: Users, label: 'Party' },
  { to: '/profile', icon: User, label: 'Profile' },
] as const

export function TabBar() {
  const { unreadCount, markRead } = useChat()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-panel-dark/95 backdrop-blur-md"
      style={{ paddingBottom: 'var(--sab)' }}>
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => {
              if (to === '/party') markRead()
            }}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 px-4 py-2 text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'text-nerdcon-blue [filter:drop-shadow(0_0_8px_rgba(53,104,255,0.6))]'
                  : 'text-fog-gray hover:text-terminal-white'
              }`
            }
          >
            <div className="relative">
              <Icon size={22} strokeWidth={1.8} />
              {to === '/party' && unreadCount > 0 && (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-boss-magenta px-1 font-mono text-[9px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
