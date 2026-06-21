import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Loader2, ArrowLeft } from 'lucide-react'
import api from '../lib/api'
import TamamdirLogo from '../components/TamamdirLogo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const data = await api.post('/api/auth/forgot-password', { email: email.trim() })
      navigate('/reset-password', {
        state: {
          email: data.email ?? email.trim(),
          expiresInMinutes: data.expires_in_minutes ?? 15,
        },
      })
    } catch (err) {
      const apiErrors = err.data?.errors
      setError(apiErrors ? apiErrors[0].msg : (err.message || 'Could not send reset code.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-amber-50">
      <div className="flex flex-1">
        <div className="hidden lg:flex lg:w-1/2 bg-amber-50 flex-col justify-between p-12 relative overflow-hidden border-r border-amber-100">
          <div className="relative z-10">
            <TamamdirLogo className="h-[66px] mb-16" />
            <h2 className="text-4xl font-bold text-coffee leading-tight mb-4">
              Reset your password securely
            </h2>
            <p className="text-gray-600 text-lg">
              We&apos;ll send a 6-digit code to your email so you can choose a new password.
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-20 py-12 bg-green-primary relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-green-medium rounded-full opacity-20" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-green-dark rounded-full opacity-30" />

          <div className="relative z-10 w-full max-w-md mx-auto">
            <div className="lg:hidden mb-8">
              <TamamdirLogo className="h-12 mb-6" />
            </div>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-green-light hover:text-white font-medium mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Forgot password?</h1>
              <p className="text-green-light">
                Enter your email address and we&apos;ll send you a 6-digit code to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="student@iyte.edu.tr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10 bg-amber-50 border-amber-100"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-amber-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !email.trim()}
                className={`w-full flex items-center justify-center gap-2 bg-amber-50 text-green-primary font-semibold py-3 rounded-lg hover:bg-amber-100 transition-colors text-base ${submitting || !email.trim() ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send reset code'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
