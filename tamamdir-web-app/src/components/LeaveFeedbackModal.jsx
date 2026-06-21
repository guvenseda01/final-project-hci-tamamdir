import { useState, useEffect } from 'react'
import { Star, Loader2, X } from 'lucide-react'
import { cn } from '../lib/utils'
import api from '../lib/api'

const COMMENT_MAX = 400

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 rounded transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-primary"
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <Star
            className={cn(
              'w-8 h-8 transition-colors',
              (hover || value) >= star
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            )}
          />
        </button>
      ))}
    </div>
  )
}

export default function LeaveFeedbackModal({
  open,
  onClose,
  onSuccess,
  orderId,
  isCustomer,
  revieweeName,
  serviceTitle,
  initialRating = 0,
  initialComment = '',
  isUpdate = false,
}) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setRating(initialRating ?? 0)
      setComment(initialComment ?? '')
      setError('')
    }
  }, [open, initialRating, initialComment])

  if (!open) return null

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const handleSubmit = async () => {
    if (!orderId || rating < 1) {
      setError('Please select a star rating.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const endpoint = isCustomer ? '/api/reviews' : '/api/reviews/customer'
      await api.post(endpoint, {
        order_id: orderId,
        rating,
        comment: comment.trim() || undefined,
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.message || 'Could not submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 id="feedback-modal-title" className="text-lg font-bold text-gray-900">
            {isUpdate ? 'Update feedback' : 'Leave feedback'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-pale flex items-center justify-center shrink-0">
              <span className="text-green-primary font-bold text-sm">
                {revieweeName?.[0] ?? '?'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{revieweeName}</p>
              {serviceTitle && (
                <p className="text-sm text-gray-500 truncate">{serviceTitle}</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Your rating</p>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value.slice(0, COMMENT_MAX))}
              placeholder="Please enter your feedback"
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-green-primary focus:ring-1 focus:ring-green-primary resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Character limit: {comment.length}/{COMMENT_MAX}
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || rating < 1}
            className="flex items-center gap-2 bg-green-primary hover:bg-green-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isUpdate ? 'Update feedback' : 'Leave feedback'}
          </button>
        </div>
      </div>
    </div>
  )
}
