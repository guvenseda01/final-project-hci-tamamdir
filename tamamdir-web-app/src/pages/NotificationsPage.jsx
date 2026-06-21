import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Loader2, MessageSquare, ShoppingBag, Star } from 'lucide-react'
import api from '../lib/api'
import { getSocket } from '../lib/socket'
import { useAuth } from '../context/AuthContext'
import { cn } from '../lib/utils'

function formatNotifTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function NotifIcon({ type }) {
  if (type === 'message_new') return <MessageSquare className="w-5 h-5 text-green-primary" />
  if (type?.startsWith('order')) return <ShoppingBag className="w-5 h-5 text-blue-500" />
  if (type?.startsWith('review')) return <Star className="w-5 h-5 text-yellow-500" />
  return <Bell className="w-5 h-5 text-gray-400" />
}

function getNotifLink(notification) {
  if (notification.type === 'message_new' && notification.ref_id) {
    return `/messages?conv=${notification.ref_id}`
  }
  if (notification.type?.startsWith('order') && notification.ref_id) {
    return '/profile'
  }
  if (notification.type === 'review_new' && notification.ref_id) {
    return `/services/${notification.ref_id}`
  }
  return null
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get('/api/notifications')
      setNotifications(data)
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    api.patch('/api/notifications/read-all').catch(() => {})
  }, [fetchNotifications])

  useEffect(() => {
    if (!user) return
    const socket = getSocket()
    if (!socket) return

    const onNew = (notification) => {
      setNotifications(prev => [notification, ...prev])
    }

    socket.on('notification:new', onNew)
    return () => socket.off('notification:new', onNew)
  }, [user?.id])

  const handleClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await api.patch(`/api/notifications/${notification.id}/read`)
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: 1 } : n)
        )
      } catch {
        // non-fatal
      }
    }

    const link = getNotifLink(notification)
    if (link) navigate(link)
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold text-coffee mb-1">Notifications</h1>
        <p className="text-gray-500 text-sm mb-8">Stay updated on orders, messages, and account activity.</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-primary animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">No notifications yet</p>
            <p className="text-xs text-gray-400">
              When you receive order updates or other alerts, they will appear here.
            </p>
          </div>
        ) : (
          <div className="card divide-y divide-gray-100">
            {notifications.map(notification => {
              const link = getNotifLink(notification)
              const unread = !notification.is_read

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleClick(notification)}
                  className={cn(
                    'w-full flex items-start gap-4 p-4 text-left hover:bg-gray-50 transition-colors',
                    unread && 'bg-green-pale/40'
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <NotifIcon type={notification.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-semibold text-coffee', unread && 'text-green-dark')}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-gray-400 shrink-0">
                        {formatNotifTime(notification.created_at)}
                      </span>
                    </div>
                    {notification.body && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{notification.body}</p>
                    )}
                    {link && (
                      <span className="text-xs text-green-primary font-medium mt-1 inline-block">
                        View →
                      </span>
                    )}
                  </div>
                  {unread && (
                    <span className="w-2 h-2 bg-green-primary rounded-full shrink-0 mt-2" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
