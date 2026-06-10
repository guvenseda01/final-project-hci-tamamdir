import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CheckCircle2, User, Sliders, Wrench, Shield, Settings,
  HelpCircle, LogOut, Bell, Trash2, Eye, Plus, AlertTriangle,
  Loader2, ShoppingBag, AlertCircle, Camera,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { formatPrice } from '../lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_BADGE = {
  pending:     { label: 'Pending',     cls: 'bg-yellow-100 text-yellow-700' },
  accepted:    { label: 'Accepted',    cls: 'bg-blue-100 text-blue-700'     },
  in_progress: { label: 'In Progress', cls: 'bg-orange-100 text-orange-700' },
  completed:   { label: 'Completed',   cls: 'bg-green-100 text-green-700'   },
  cancelled:   { label: 'Cancelled',   cls: 'bg-red-100 text-red-500'       },
}

// ── Tab: Personal Info ────────────────────────────────────────────────────────

function PersonalInfo({ user, onAvatarUpdated }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      await api.post(`/api/users/${user.id}/avatar`, formData)
      await onAvatarUpdated()
    } catch (err) {
      setUploadError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Personal Info</h2>
        <p className="text-gray-500 text-sm">Manage your personal information and public profile.</p>
      </div>

      <div className="card p-6 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-gray-100" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-green-pale flex items-center justify-center border-2 border-gray-100">
                <span className="text-green-primary font-bold text-2xl">{user.full_name?.[0] ?? '?'}</span>
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-primary rounded-full flex items-center justify-center border-2 border-white hover:bg-green-dark transition-colors disabled:opacity-60"
            >
              {uploading
                ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                : <Camera className="w-3.5 h-3.5 text-white" />
              }
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user.full_name}</p>
            <p className="text-sm text-gray-500">{user.department ?? 'No department set'}</p>
            {user.is_verified === 1 && (
              <div className="flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-4 h-4 text-green-primary" />
                <span className="text-xs text-green-primary font-medium">Verified Student</span>
              </div>
            )}
          </div>
        </div>

        {uploadError && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{uploadError}</p>
        )}

        {[
          { label: 'Full Name',   value: user.full_name },
          { label: 'Email',       value: user.email },
          { label: 'Department',  value: user.department ?? '—' },
          { label: 'Bio',         value: user.bio ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="text-sm font-medium text-gray-900">{value}</p>
            </div>
            <button className="text-sm text-green-primary hover:underline font-medium">Edit</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab: Service Management ───────────────────────────────────────────────────

function ServiceManagement({ userId }) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(null)

  useEffect(() => {
    if (!userId) return
    api.get(`/api/users/${userId}/services`)
      .then(setServices)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  const handleRemove = async (id) => {
    setRemoving(id)
    try {
      await api.del(`/api/services/${id}`)
      setServices(prev => prev.filter(s => s.id !== id))
    } catch {
      // stay in list on error
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Service Management</h2>
        <p className="text-gray-500 text-sm">Manage the services you offer to other students on the marketplace.</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Your Active Services</h3>
            <p className="text-sm text-gray-400">These services are currently visible to other students.</p>
          </div>
          <button className="flex items-center gap-2 bg-green-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-dark transition-colors">
            <Plus className="w-4 h-4" />
            Add New Service
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-green-primary animate-spin" />
          </div>
        ) : services.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            You haven't listed any services yet.
          </p>
        ) : (
          <div className="space-y-3 mb-4">
            {services.map(svc => (
              <div key={svc.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-pale rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-green-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{svc.title}</p>
                    <p className="text-xs text-gray-400">
                      {svc.category_name} · {formatPrice(svc.price, svc.price_unit)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(svc.id)}
                  disabled={removing === svc.id}
                  className="flex items-center gap-1.5 text-red-400 hover:text-red-600 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {removing === svc.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-center text-gray-400 py-2 bg-gray-50 rounded-lg">
          Tip: Offering high-quality services helps you earn higher ratings and peer trust.
        </p>
      </div>

      <button className="w-full flex items-center justify-between card px-5 py-4 hover:shadow-md transition-shadow group">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
            <Eye className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900 text-sm">Public Profile Preview</p>
            <p className="text-xs text-gray-400">See how others view you.</p>
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

// ── Tab: Orders ───────────────────────────────────────────────────────────────

function OrdersTab({ userId }) {
  const [role, setRole] = useState('buyer')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError('')
    api.get(`/api/users/${userId}/orders?role=${role}`)
      .then(setOrders)
      .catch(err => setError(err.message || 'Failed to load orders.'))
      .finally(() => setLoading(false))
  }, [userId, role])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Orders</h2>
        <p className="text-gray-500 text-sm">Track your orders as a buyer and provider.</p>
      </div>

      {/* Role toggle */}
      <div className="flex gap-2">
        {['buyer', 'provider'].map(r => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              role === r ? 'bg-green-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            As {r}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-green-primary animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-8 text-center">
          <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No orders yet as a {role}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const badge = STATUS_BADGE[order.status] ?? { label: order.status, cls: 'bg-gray-100 text-gray-600' }
            const other = role === 'buyer' ? order.provider_name : order.buyer_name
            return (
              <div key={order.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{order.service_title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {role === 'buyer' ? 'Provider' : 'Buyer'}: {other} · {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-gray-900">
                    ₺{order.price_at_order}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Tab: Personalization ──────────────────────────────────────────────────────

function PersonalizationTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Personalization</h2>
        <p className="text-gray-500 text-sm">Customize your experience on Tamamdır.</p>
      </div>
      <div className="card p-6">
        <p className="text-sm text-gray-500 mb-4">Update your interest categories to get better service recommendations.</p>
        <Link to="/onboarding" className="btn-primary inline-flex">
          <Sliders className="w-4 h-4" />
          Update Interests
        </Link>
      </div>
    </div>
  )
}

// ── Tab: Security ─────────────────────────────────────────────────────────────

function SecurityTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Security</h2>
        <p className="text-gray-500 text-sm">Manage your account security settings.</p>
      </div>
      <div className="card p-6 space-y-4">
        {[
          { label: 'Login Sessions',       desc: '2 active sessions',          action: 'View All' },
          { label: 'Login Notifications',  desc: 'Get notified on new logins', action: 'Enable'   },
        ].map(({ label, desc, action }) => (
          <div key={label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <button className="text-sm font-semibold text-green-primary hover:underline">{action}</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab: Account Management ───────────────────────────────────────────────────

function AccountManagement({ user }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Account Management</h2>
        <p className="text-gray-500 text-sm">View and manage your core account settings and data preferences.</p>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900 text-sm">Primary Account Details</h3>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">University Email</p>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-gray-900">{user.email}</p>
            {user.is_verified === 1 && (
              <span className="flex items-center gap-1 bg-green-pale text-green-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">This email is required for campus verification and cannot be changed.</p>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900 text-sm">Account Security</h3>
        </div>
        {[
          { label: 'Password', desc: 'Update your password', action: 'Change' },
          { label: 'Two-Factor Authentication (2FA)', desc: <span>Currently <span className="text-red-400 font-medium">disabled</span>.</span>, action: 'Manage' },
        ].map(({ label, desc, action }) => (
          <div key={label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <button className={`text-sm font-semibold px-3 py-1.5 rounded-lg border transition-colors ${action === 'Change' ? 'text-green-primary hover:bg-green-pale border-transparent' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              {action}
            </button>
          </div>
        ))}
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900 text-sm">Data & Privacy</h3>
        </div>
        <p className="text-sm text-gray-500">Control how your data is used and stored within the Tamamdır platform.</p>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-outline text-sm py-2.5 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export My Data
          </button>
          <button className="btn-outline text-sm py-2.5 flex items-center justify-center gap-2 text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Account History
          </button>
        </div>
      </div>

      <div className="card p-6 border-red-100">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h3 className="font-semibold text-red-500 text-sm">Danger Zone</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Deactivating your account will immediately hide your profile and active service listings.
        </p>
        <button className="flex items-center gap-2 border border-red-300 text-red-400 hover:bg-red-50 transition-colors text-sm font-semibold px-4 py-2.5 rounded-lg">
          <AlertTriangle className="w-4 h-4" />
          Deactivate Account
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'personal',        label: 'Personal Info',       icon: User       },
  { id: 'personalization', label: 'Personalization',     icon: Sliders    },
  { id: 'services',        label: 'Service Management',  icon: Wrench     },
  { id: 'orders',          label: 'Orders',              icon: ShoppingBag },
  { id: 'security',        label: 'Security',            icon: Shield     },
  { id: 'account',         label: 'Account Management',  icon: Settings   },
]

export default function ProfilePage() {
  const { user, logout, me } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('services')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-primary animate-spin" />
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'personal':        return <PersonalInfo user={user} onAvatarUpdated={me} />
      case 'personalization': return <PersonalizationTab />
      case 'services':        return <ServiceManagement userId={user.id} />
      case 'orders':          return <OrdersTab userId={user.id} />
      case 'security':        return <SecurityTab />
      case 'account':         return <AccountManagement user={user} />
      default:                return <ServiceManagement userId={user.id} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-56 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 text-center border-b border-gray-100">
                <div className="relative inline-block mb-3">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="w-20 h-20 rounded-full object-cover border-4 border-gray-50 shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-green-pale flex items-center justify-center border-4 border-gray-50 shadow-sm">
                      <span className="text-green-primary font-bold text-2xl">{user.full_name?.[0] ?? '?'}</span>
                    </div>
                  )}
                  {user.is_verified === 1 && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-primary rounded-full flex items-center justify-center border-2 border-white">
                      <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className="font-semibold text-gray-900 text-sm">
                  {user.full_name?.split(' ')[0]} Profile
                </p>
                {user.is_verified === 1 && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-primary" />
                    <span className="text-xs text-green-primary font-medium">Verified Student</span>
                  </div>
                )}
                <button className="mt-3 w-full bg-green-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-green-dark transition-colors">
                  Upgrade to Pro
                </button>
              </div>

              <nav className="p-3 space-y-1">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                      activeTab === id
                        ? 'bg-green-pale text-green-primary'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </nav>

              <div className="p-3 border-t border-gray-100 space-y-1">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                  <HelpCircle className="w-4 h-4" />
                  Help Center
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  )
}
