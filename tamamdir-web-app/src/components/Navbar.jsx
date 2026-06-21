import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { Bell, Mail, Search, Shield, Heart } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import TamamdirLogo from './TamamdirLogo'
import ProfileMenuDropdown from './ProfileMenuDropdown'
import LanguageToggle from './LanguageToggle'
import api from '../lib/api'
import { getSocket } from '../lib/socket'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = usePreferences()
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (location.pathname === '/services') {
      setSearchQuery(new URLSearchParams(location.search).get('q') ?? '')
    }
  }, [location.pathname, location.search])

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      navigate(`/services?q=${encodeURIComponent(q)}`)
    } else {
      navigate('/services')
    }
  }

  const refreshUnreadCount = useCallback(() => {
    api.get('/api/notifications/unread-count')
      .then(data => setUnreadCount(data.count ?? 0))
      .catch(() => setUnreadCount(0))
  }, [])

  useEffect(() => {
    if (!user) return
    refreshUnreadCount()

    const socket = getSocket()
    if (!socket) return

    const onNewNotification = () => refreshUnreadCount()
    socket.on('notification:new', onNewNotification)

    return () => socket.off('notification:new', onNewNotification)
  }, [user?.id, refreshUnreadCount])

  useEffect(() => {
    if (location.pathname === '/notifications') {
      setUnreadCount(0)
    }
  }, [location.pathname])

  const iconBtn = (active) => cn(
    'p-2.5 rounded-lg transition-colors relative',
    active ? 'text-coffee' : 'text-gray-600 hover:text-coffee'
  )

  return (
    <header className="sticky top-0 z-50 bg-amber-100 border-b border-amber-200">
      <div className="w-full pl-4 pr-4 sm:pl-6 sm:pr-6 flex items-center h-20 gap-4 sm:gap-6">
        <Link to="/home" className="flex items-center shrink-0">
          <TamamdirLogo className="h-[66px]" />
        </Link>

        <div className="flex flex-1 items-center gap-3 sm:gap-4 min-w-0 justify-end">
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-xl lg:max-w-2xl min-w-0 flex items-center gap-2 border border-amber-200 rounded-lg px-3 py-2.5 bg-amber-50 shadow-sm"
          >
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('navbar.searchPlaceholder')}
              className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full min-w-0"
            />
          </form>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {user?.is_admin && (
            <Link
              to="/admin/reports"
              className={iconBtn(location.pathname.startsWith('/admin'))}
              aria-label={t('navbar.adminReports')}
              title={t('navbar.adminReports')}
            >
              <Shield className="w-5 h-5" />
            </Link>
          )}
          <Link
            to="/messages"
            className={iconBtn(location.pathname.startsWith('/messages'))}
            aria-label={t('navbar.messages')}
          >
            <Mail className="w-5 h-5" />
          </Link>

          <Link
            to="/favorites"
            className={iconBtn(location.pathname === '/favorites')}
            aria-label={t('navbar.favorites')}
          >
            <Heart className="w-5 h-5" />
          </Link>

          <Link
            to="/notifications"
            className={iconBtn(location.pathname === '/notifications')}
            aria-label={t('navbar.notifications')}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <Link
            to="/services/new"
            className="hidden sm:inline-flex ml-1 bg-green-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-dark transition-colors whitespace-nowrap"
          >
            {t('navbar.addService')}
          </Link>

          <ProfileMenuDropdown />
          <LanguageToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
