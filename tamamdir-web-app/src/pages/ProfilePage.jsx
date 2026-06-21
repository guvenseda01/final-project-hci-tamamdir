import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  CheckCircle2, User, Sliders, Wrench, Shield, Settings,
  HelpCircle, LogOut, Trash2, Eye, EyeOff, Plus, AlertTriangle,
  Loader2, ShoppingBag, AlertCircle, Camera, X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { formatPrice, resolveMediaUrl } from '../lib/utils'

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

const INTEREST_EMOJI = {
  code:              '💻',
  sports_tennis:     '🎾',
  yarn:              '🧶',
  palette:           '🎨',
  translate:         '🌐',
  photo_camera:      '📷',
  music_note:        '🎵',
  calculate:         '🧮',
  cleaning_services: '🧹',
  spa:               '💅',
  pets:              '🐾',
  handyman:          '🛠️',
}

// ── Tab: Personal Info ────────────────────────────────────────────────────────

const PERSONAL_FIELDS = [
  { label: 'Full Name',  key: 'full_name',  editable: true },
  { label: 'Email',      key: 'email',      editable: false },
  { label: 'Department', key: 'department', editable: true },
  { label: 'Bio',        key: 'bio',        editable: true, multiline: true },
]

function PersonalInfo({ user, onAvatarUpdated, onProfileUpdated }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const openEdit = (key) => {
    setEditingField(key)
    setEditValue(user[key] ?? '')
    setEditError('')
  }

  const closeEdit = () => {
    setEditingField(null)
    setEditValue('')
    setEditError('')
  }

  const handleSaveField = async () => {
    if (!editingField) return
    const trimmed = editValue.trim()
    if (editingField === 'full_name' && !trimmed) {
      setEditError('Full name cannot be empty.')
      return
    }
    setEditError('')
    setSaving(true)
    try {
      await api.patch(`/api/users/${user.id}`, { [editingField]: trimmed || null })
      await onProfileUpdated()
      closeEdit()
    } catch (err) {
      setEditError(err.message || 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

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
        <h2 className="text-2xl font-bold text-coffee mb-1">Personal Info</h2>
        <p className="text-gray-500 text-sm">Manage your personal information and public profile.</p>
      </div>

      <div className="card p-6 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {user.avatar_url ? (
              <img src={resolveMediaUrl(user.avatar_url)} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-gray-100" />
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
            <p className="font-semibold text-coffee">{user.full_name}</p>
            <p className="text-sm text-gray-500">{user.department ?? 'No department set'}</p>
            {user.is_verified_student && (
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

        {PERSONAL_FIELDS.map(({ label, key, editable }) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="text-sm font-medium text-gray-400">{user[key] ?? '—'}</p>
            </div>
            {editable && (
              <button
                onClick={() => openEdit(key)}
                className="text-sm text-green-primary hover:underline font-medium shrink-0"
              >
                Edit
              </button>
            )}
          </div>
        ))}
      </div>

      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-coffee">
                Edit {PERSONAL_FIELDS.find(f => f.key === editingField)?.label}
              </h3>
              <button
                onClick={closeEdit}
                disabled={saving}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {PERSONAL_FIELDS.find(f => f.key === editingField)?.multiline ? (
              <textarea
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30 resize-none"
                placeholder="Tell others a bit about yourself…"
              />
            ) : (
              <input
                type="text"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30"
              />
            )}

            {editError && (
              <p className="text-xs text-red-500 mt-2">{editError}</p>
            )}

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={closeEdit}
                disabled={saving}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveField}
                disabled={saving}
                className="btn-primary py-2 text-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Service Management ───────────────────────────────────────────────────

function ServiceManagement({ userId }) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmRemove, setConfirmRemove] = useState(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState('')

  useEffect(() => {
    if (!userId) return
    api.get(`/api/users/${userId}/services`)
      .then(setServices)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  const closeRemoveModal = () => {
    if (removing) return
    setConfirmRemove(null)
    setRemoveError('')
  }

  const handleConfirmRemove = async () => {
    if (!confirmRemove) return
    setRemoveError('')
    setRemoving(true)
    try {
      await api.del(`/api/services/${confirmRemove.id}`)
      setServices(prev => prev.filter(s => s.id !== confirmRemove.id))
      setConfirmRemove(null)
    } catch (err) {
      setRemoveError(err.message || 'Failed to remove service.')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-coffee mb-1">Service Management</h2>
        <p className="text-gray-500 text-sm">Manage the services you offer to other students on the marketplace.</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-coffee">Your Active Services</h3>
            <p className="text-sm text-gray-400">These services are currently visible to other students.</p>
          </div>
          <Link
            to="/services/new"
            className="flex items-center gap-2 bg-green-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Service
          </Link>
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
                    <p className="text-sm font-semibold text-coffee">{svc.title}</p>
                    <p className="text-xs text-gray-400">
                      {svc.category_name} · {formatPrice(svc.price, svc.price_unit)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmRemove(svc)}
                  className="flex items-center gap-1.5 text-red-400 hover:text-red-600 text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
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
            <p className="font-medium text-gray-700 text-sm">Public Profile Preview</p>
            <p className="text-xs text-gray-400">See how others view you.</p>
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-coffee">Remove Service</h3>
                <p className="text-sm text-gray-500 truncate">{confirmRemove.title}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to remove this service?
            </p>

            {removeError && (
              <p className="text-xs text-red-500 mb-4">{removeError}</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={closeRemoveModal}
                disabled={removing}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={removing}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
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
        <h2 className="text-2xl font-bold text-coffee mb-1">Orders</h2>
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
            As {r === 'buyer' ? 'Customer' : 'Provider'}
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
                  <p className="font-semibold text-coffee text-sm truncate">{order.service_title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {role === 'buyer' ? 'Provider' : 'Buyer'}: {other} · {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-coffee">
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

function PersonalizationTab({ user, onInterestsUpdated }) {
  const interests = user.interests ?? []
  const [removing, setRemoving] = useState(null)
  const [saving, setSaving] = useState(false)
  const [removeError, setRemoveError] = useState('')

  const handleConfirmRemove = async () => {
    if (!removing) return
    setRemoveError('')
    setSaving(true)
    try {
      const updatedIds = interests.filter(i => i.id !== removing.id).map(i => i.id)
      await api.put(`/api/users/${user.id}/interests`, { category_ids: updatedIds })
      await onInterestsUpdated()
      setRemoving(null)
    } catch (err) {
      setRemoveError(err.message || 'Failed to remove interest.')
    } finally {
      setSaving(false)
    }
  }

  const closeRemoveModal = () => {
    if (saving) return
    setRemoving(null)
    setRemoveError('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-coffee mb-1">Personalization</h2>
        <p className="text-gray-500 text-sm">Customize your experience on Tamamdır.</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-coffee">Your Interests</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              {interests.length === 0
                ? 'No interests selected yet.'
                : `${interests.length} interest${interests.length !== 1 ? 's' : ''} selected`}
            </p>
          </div>
          <Link to="/onboarding?from=profile" className="btn-primary inline-flex text-sm py-2">
            <Sliders className="w-4 h-4" />
            Update Interests
          </Link>
        </div>

        {interests.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <span className="text-3xl mb-3 block">✨</span>
            <p className="text-sm text-gray-500 mb-1">You haven&apos;t added any interests yet.</p>
            <p className="text-xs text-gray-400">Select interests to get better service recommendations.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {interests.map(interest => (
              <li
                key={interest.id}
                className="flex items-center justify-between gap-3 bg-gray-50 hover:bg-gray-100/80 rounded-xl px-4 py-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-gray-100 shrink-0">
                    {INTEREST_EMOJI[interest.icon] ?? '✨'}
                  </div>
                  <p className="text-sm font-semibold text-coffee truncate">{interest.name}</p>
                </div>
                <button
                  onClick={() => setRemoving(interest)}
                  className="flex items-center gap-1.5 text-red-400 hover:text-red-600 text-sm font-medium transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {removing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center text-xl shrink-0">
                {INTEREST_EMOJI[removing.icon] ?? '✨'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-coffee">Remove Interest</h3>
                <p className="text-sm text-gray-500">{removing.name}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to remove this interest?
            </p>

            {removeError && (
              <p className="text-xs text-red-500 mb-4">{removeError}</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={closeRemoveModal}
                disabled={saving}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={saving}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Security ─────────────────────────────────────────────────────────────

function SecurityTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-coffee mb-1">Security</h2>
        <p className="text-gray-500 text-sm">Manage your account security settings.</p>
      </div>
      <div className="card p-6 space-y-4">
        {[
          { label: 'Login Sessions',       desc: '2 active sessions',          action: 'View All' },
          { label: 'Login Notifications',  desc: 'Get notified on new logins', action: 'Enable'   },
        ].map(({ label, desc, action }) => (
          <div key={label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-700">{label}</p>
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

function AccountManagement({ user, onUserUpdated, logout }) {
  const navigate = useNavigate()

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  const isDeactivated = user.is_active === false

  const closePasswordModal = () => {
    if (passwordSaving) return
    setShowPasswordModal(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setPasswordSuccess('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    setPasswordSaving(true)
    try {
      await api.patch('/api/auth/password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      setPasswordSuccess('Password updated successfully.')
      setTimeout(closePasswordModal, 1200)
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleDeactivate = async () => {
    setActionError('')
    setActionLoading(true)
    try {
      await api.post('/api/auth/deactivate')
      await onUserUpdated()
      setShowDeactivateConfirm(false)
    } catch (err) {
      setActionError(err.message || 'Failed to deactivate account.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReactivate = async () => {
    setActionError('')
    setActionLoading(true)
    try {
      await api.post('/api/auth/reactivate')
      await onUserUpdated()
    } catch (err) {
      setActionError(err.message || 'Failed to reactivate account.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setActionError('')
    setActionLoading(true)
    try {
      await api.del('/api/auth/account')
      logout()
      navigate('/login')
    } catch (err) {
      setActionError(err.message || 'Failed to delete account.')
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-coffee mb-1">Account Management</h2>
        <p className="text-gray-500 text-sm">View and manage your core account settings and data preferences.</p>
      </div>

      {isDeactivated && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">
            Your account is deactivated. Your profile and service listings are hidden from other students.
          </p>
        </div>
      )}

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-400 text-sm">Primary Account Details</h3>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          {user.is_verified_student ? (
            <>
              <p className="text-xs text-gray-400 mb-1">University Email</p>
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-coffee">{user.email}</p>
                <span className="flex items-center gap-1 bg-green-pale text-green-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                This email is required for campus verification and cannot be changed.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-1">Email</p>
              <p className="text-sm font-semibold text-gray-400">{user.email}</p>
            </>
          )}
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-400 text-sm">Account Security</h3>
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Password</p>
            <p className="text-xs text-gray-400 mt-0.5">Update your password</p>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="text-sm font-semibold px-3 py-1.5 rounded-lg text-green-primary hover:bg-green-pale transition-colors"
          >
            Change
          </button>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-400 text-sm">Data & Privacy</h3>
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

        {actionError && (
          <p className="text-xs text-red-500 mb-3">{actionError}</p>
        )}

        {isDeactivated ? (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Your account is currently deactivated. You can reactivate it or permanently delete your account.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleReactivate}
                disabled={actionLoading}
                className="flex items-center gap-2 bg-green-primary text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-green-dark transition-colors disabled:opacity-60"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Reactivate Account
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={actionLoading}
                className="flex items-center gap-2 border border-red-300 text-red-500 hover:bg-red-50 transition-colors text-sm font-semibold px-4 py-2.5 rounded-lg disabled:opacity-60"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Deactivating your account will immediately hide your profile and active service listings.
            </p>
            <button
              onClick={() => setShowDeactivateConfirm(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 border border-red-300 text-red-400 hover:bg-red-50 transition-colors text-sm font-semibold px-4 py-2.5 rounded-lg disabled:opacity-60"
            >
              <AlertTriangle className="w-4 h-4" />
              Deactivate Account
            </button>
          </>
        )}
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-coffee">Change Password</h3>
              <button
                onClick={closePasswordModal}
                disabled={passwordSaving}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Current password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    className="input-field pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="input-field pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="input-field"
                />
              </div>

              {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
              {passwordSuccess && <p className="text-xs text-green-primary">{passwordSuccess}</p>}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={passwordSaving}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="btn-primary py-2 text-sm"
                >
                  {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeactivateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-coffee mb-2">Deactivate Account</h3>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to deactivate your account? Your profile and service listings will be hidden.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeactivateConfirm(false)}
                disabled={actionLoading}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={actionLoading}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-coffee mb-2">Delete Account</h3>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to permanently delete your account? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={actionLoading}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={actionLoading}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
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
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('services')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab)
    }
  }, [location.state?.tab])

  useEffect(() => {
    if (!location.state?.interestsUpdated) return
    setToast('Your interests have been updated.')
    navigate('/profile', { replace: true, state: { tab: 'personalization' } })
  }, [location.state?.interestsUpdated, navigate])

  useEffect(() => {
    if (!location.state?.serviceCreated) return
    setToast(
      location.state?.imageUploadFailed
        ? 'Service created, but photos could not be uploaded.'
        : 'Your service has been created.'
    )
    navigate('/profile', { replace: true, state: { tab: 'services' } })
  }, [location.state?.serviceCreated, location.state?.imageUploadFailed, navigate])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-primary animate-spin" />
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'personal':        return <PersonalInfo user={user} onAvatarUpdated={me} onProfileUpdated={me} />
      case 'personalization': return <PersonalizationTab user={user} onInterestsUpdated={me} />
      case 'services':        return <ServiceManagement userId={user.id} />
      case 'orders':          return <OrdersTab userId={user.id} />
      case 'security':        return <SecurityTab />
      case 'account':         return <AccountManagement user={user} onUserUpdated={me} logout={logout} />
      default:                return <ServiceManagement userId={user.id} />
    }
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-white rounded-xl shadow-lg border border-green-pale px-4 py-3 flex items-center gap-3 animate-in">
          <div className="w-8 h-8 bg-green-pale rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-green-primary" />
          </div>
          <p className="text-sm font-medium text-gray-700">{toast}</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-56 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 text-center border-b border-gray-100">
                <div className="relative inline-block mb-3">
                  {user.avatar_url ? (
                    <img
                      src={resolveMediaUrl(user.avatar_url)}
                      alt=""
                      className="w-20 h-20 rounded-full object-cover border-4 border-gray-50 shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-green-pale flex items-center justify-center border-4 border-gray-50 shadow-sm">
                      <span className="text-green-primary font-bold text-2xl">{user.full_name?.[0] ?? '?'}</span>
                    </div>
                  )}
                  {user.is_verified_student && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-primary rounded-full flex items-center justify-center border-2 border-white">
                      <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className="font-semibold text-coffee text-sm">
                  {user.full_name?.split(' ')[0]} Profile
                </p>
                {user.is_verified_student && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-primary" />
                    <span className="text-xs text-green-primary font-medium">Verified Student</span>
                  </div>
                )}
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
