import { Link, useLocation } from 'react-router-dom'
import { Bell, Mail, Search } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import TamamdirLogo from './TamamdirLogo'

export default function Navbar() {
  const location = useLocation()
  const { user } = useAuth()

  const links = [
    { to: '/home', label: 'Home' },
    { to: '/services', label: 'Marketplace' },
    { to: '/messages', label: 'Messages' },
  ]

  const iconBtn = (active) => cn(
    'p-2 rounded-lg transition-colors relative',
    active ? 'bg-green-pale text-green-primary' : 'hover:bg-gray-100 text-gray-500'
  )

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="w-full px-6 flex items-center justify-between h-20">
        <Link to="/home" className="flex items-center shrink-0">
          <TamamdirLogo />
        </Link>

        <nav className="hidden md:flex items-center gap-14">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'text-sm font-medium transition-colors',
                location.pathname === link.to
                  ? 'text-green-primary border-b-2 border-green-primary pb-0.5'
                  : 'text-gray-500 hover:text-gray-900'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-48">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full"
            />
          </div>

          <Link
            to="/notifications"
            className={iconBtn(location.pathname === '/notifications')}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
          </Link>

          <Link
            to="/messages"
            className={iconBtn(location.pathname.startsWith('/messages'))}
            aria-label="Messages"
          >
            <Mail className="w-5 h-5" />
          </Link>

          <Link to="/profile" className="ml-1">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Profile"
                className="w-9 h-9 rounded-full border-2 border-green-primary object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full border-2 border-green-primary bg-green-pale flex items-center justify-center">
                <span className="text-green-primary text-sm font-bold">{user?.full_name?.[0] ?? '?'}</span>
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
