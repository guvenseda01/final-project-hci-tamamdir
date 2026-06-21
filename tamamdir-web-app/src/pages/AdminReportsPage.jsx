import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Flag, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { cn } from '../lib/utils'
import api from '../lib/api'

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  reviewed: 'bg-green-pale text-green-primary border-green-100',
  dismissed: 'bg-gray-100 text-gray-600 border-gray-200',
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function targetLink(report) {
  if (report.target_type === 'service') return `/services/${report.target_id}`
  if (report.target_type === 'user') return `/users/${report.target_id}`
  if (report.target_type === 'conversation') return `/messages?conv=${report.target_id}`
  return null
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const load = () => {
    setLoading(true)
    setError('')
    api.get('/api/admin/reports')
      .then(setReports)
      .catch(err => setError(err.message || 'Failed to load reports.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id, status) => {
    setUpdatingId(id)
    try {
      await api.patch(`/api/admin/reports/${id}`, { status })
      setReports(prev => prev.map(r => (r.id === id ? { ...r, status } : r)))
    } catch (err) {
      setError(err.message || 'Failed to update report.')
    } finally {
      setUpdatingId(null)
    }
  }

  const pendingCount = reports.filter(r => r.status === 'pending').length

  return (
    <div className="min-h-screen bg-amber-50">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-start gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-green-pale flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-green-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-coffee mb-1">Admin — Reports</h1>
            <p className="text-gray-500 text-sm">
              Review user-submitted reports from services, profiles, and conversations.
            </p>
          </div>
        </div>

        {!loading && !error && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-coffee">{reports.length}</p>
              <p className="text-xs text-gray-400 mt-1">Total</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
              <p className="text-xs text-gray-400 mt-1">Pending</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-green-primary">
                {reports.filter(r => r.status === 'reviewed').length}
              </p>
              <p className="text-xs text-gray-400 mt-1">Reviewed</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-primary animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="card p-12 text-center">
            <Flag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No reports yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(report => {
              const href = targetLink(report)
              return (
                <article key={report.id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={cn(
                          'text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize',
                          STATUS_STYLES[report.status] ?? STATUS_STYLES.pending
                        )}>
                          {report.status}
                        </span>
                        <span className="text-xs text-gray-400 uppercase tracking-wide">
                          {report.target_type}
                        </span>
                      </div>
                      <h2 className="font-semibold text-coffee">
                        {report.target_label || report.target_id}
                      </h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Reported by {report.reporter_name} · {formatDate(report.created_at)}
                      </p>
                    </div>
                    {href && (
                      <Link
                        to={href}
                        className="inline-flex items-center gap-1 text-sm text-green-primary hover:underline shrink-0"
                      >
                        View target
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>

                  <div className="bg-amber-50/80 border border-amber-100 rounded-lg px-4 py-3 mb-4">
                    <p className="text-sm font-medium text-coffee">{report.reason_label}</p>
                    {report.details && (
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{report.details}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {report.status !== 'reviewed' && (
                      <button
                        type="button"
                        disabled={updatingId === report.id}
                        onClick={() => updateStatus(report.id, 'reviewed')}
                        className="text-xs font-semibold bg-green-primary text-white px-3 py-1.5 rounded-lg hover:bg-green-dark disabled:opacity-60"
                      >
                        Mark reviewed
                      </button>
                    )}
                    {report.status !== 'dismissed' && (
                      <button
                        type="button"
                        disabled={updatingId === report.id}
                        onClick={() => updateStatus(report.id, 'dismissed')}
                        className="text-xs font-semibold border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-60"
                      >
                        Dismiss
                      </button>
                    )}
                    {report.status !== 'pending' && (
                      <button
                        type="button"
                        disabled={updatingId === report.id}
                        onClick={() => updateStatus(report.id, 'pending')}
                        className="text-xs font-semibold border border-amber-200 text-coffee px-3 py-1.5 rounded-lg hover:bg-amber-50 disabled:opacity-60"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
