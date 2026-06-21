import { useNavigate, useLocation } from 'react-router-dom'
import { HelpCircle, LogOut } from 'lucide-react'
import { cn, resolveMediaUrl } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import { PROFILE_TABS } from '../constants/profileNav'

export default function ProfileMenuDropdown() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { t } = usePreferences()

  if (!user) return null

  const activeTab = location.pathname === '/profile'
    ? (location.state?.tab ?? 'services')
    : null

  const goToTab = (tab) => {
    navigate('/profile', { state: { tab } })
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="relative ml-1 sm:ml-2 shrink-0 group">
      <button
        type="button"
        onClick={() => goToTab(activeTab ?? 'services')}
        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-green-primary focus-visible:ring-offset-2"
        aria-label={t('common.profileMenu')}
        aria-haspopup="true"
      >
        {user.avatar_url ? (
          <img
            src={resolveMediaUrl(user.avatar_url)}
            alt=""
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-green-pale flex items-center justify-center">
            <span className="text-green-primary text-sm font-bold">{user.full_name?.[0] ?? '?'}</span>
          </div>
        )}
      </button>

      <div className="absolute right-0 top-full pt-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-opacity duration-150">
        <div className="w-56 bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
          <nav className="p-2 space-y-0.5">
            {PROFILE_TABS.map(({ id, labelKey, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => goToTab(id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                  activeTab === id
                    ? 'bg-green-pale text-green-primary'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {t(labelKey)}
              </button>
            ))}
          </nav>

          <div className="p-2 border-t border-gray-100 space-y-0.5">
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left"
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              {t('common.helpCenter')}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {t('common.logout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
