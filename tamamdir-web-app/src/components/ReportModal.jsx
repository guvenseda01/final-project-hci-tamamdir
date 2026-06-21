import { useState } from 'react'
import { Flag, Loader2, X } from 'lucide-react'
import api from '../lib/api'

const REASONS = [
  { value: 'spam', label: 'Spam or misleading listing' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'other', label: 'Other' },
]

export default function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
  targetLabel,
}) {
  const [reason, setReason] = useState('inappropriate')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!open) return null

  const handleClose = () => {
    if (submitting) return
    setReason('inappropriate')
    setDetails('')
    setError('')
    setSuccess(false)
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/api/reports', {
        target_type: targetType,
        target_id: targetId,
        reason,
        details: details.trim() || undefined,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to submit report.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        role="dialog"
        aria-labelledby="report-modal-title"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500 shrink-0" />
            <h2 id="report-modal-title" className="text-lg font-bold text-coffee">
              Report
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Thank you. Your report has been received and will be reviewed.
            </p>
            <button type="button" onClick={handleClose} className="btn-primary w-full justify-center">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {targetLabel && (
              <p className="text-sm text-gray-500">
                Reporting: <span className="font-medium text-coffee">{targetLabel}</span>
              </p>
            )}

            <div>
              <label htmlFor="report-reason" className="block text-sm font-medium text-gray-700 mb-1.5">
                Reason
              </label>
              <select
                id="report-reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="input-field"
              >
                {REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="report-details" className="block text-sm font-medium text-gray-700 mb-1.5">
                Additional details (optional)
              </label>
              <textarea
                id="report-details"
                value={details}
                onChange={e => setDetails(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Tell us what happened..."
                className="input-field resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-sm py-2.5 px-5"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
