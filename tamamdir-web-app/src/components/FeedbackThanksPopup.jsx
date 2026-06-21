import { CheckCircle2 } from 'lucide-react'

export default function FeedbackThanksPopup({ open, onClose }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-thanks-title"
      >
        <div className="w-14 h-14 rounded-full bg-green-pale flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-primary" />
        </div>
        <h2 id="feedback-thanks-title" className="text-lg font-bold text-gray-900 mb-2">
          Thanks!
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Your feedback has been received.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-green-primary hover:bg-green-dark text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  )
}
