import { Link, useLocation } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { cn } from '../lib/utils'

export default function Navbar() {
  const location = useLocation()

  const links = [
    { to: '/home', label: 'Home' },
    { to: '/services', label: 'Marketplace' },
    { to: '/messages', label: 'Messages' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="w-full px-6 flex items-center justify-between h-20">
        <Link to="/home" className="flex items-center shrink-0">
          <img src="/tamamdir-logo.png" alt="Tamamdır" className="h-12 w-auto object-contain" />
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

        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-48">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full"
            />
          </div>
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
            <Bell className="w-5 h-5 text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
          </button>
          <Link to="/profile">
            <img
              src="https://i.pravatar.cc/150?img=49"
              alt="Profile"
              className="w-9 h-9 rounded-full border-2 border-green-primary object-cover"
            />
          </Link>
        </div>
      </div>
    </header>
  )
}
