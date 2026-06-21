import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import api from '../lib/api'
import TamamdirLogo from '../components/TamamdirLogo'

export default function ResetPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const email = location.state?.email ?? ''
  const expiresInMinutes = location.state?.expiresInMinutes ?? 15

  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!email) navigate('/forgot-password', { replace: true })
  }, [email, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (code.length !== 6) {
      setError('Please enter the 6-digit reset code.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      await api.post('/api/auth/reset-password', {
        email,
        code,
        new_password: newPassword,
      })
      setSuccess('Password reset successfully. Redirecting to login…')
      setTimeout(() => navigate('/login', { replace: true }), 1500)
    } catch (err) {
      const apiErrors = err.data?.errors
      setError(apiErrors ? apiErrors[0].msg : (err.message || 'Password reset failed.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setSuccess('')
    setResending(true)
    try {
      await api.post('/api/auth/forgot-password', { email })
      setSuccess('A new reset code has been sent to your email.')
    } catch (err) {
      setError(err.message || 'Could not resend code.')
    } finally {
      setResending(false)
    }
  }

  if (!email) return null

  return (
    <div className="min-h-screen flex flex-col bg-amber-50">
      <div className="flex flex-1">
        <div className="hidden lg:flex lg:w-1/2 bg-amber-50 flex-col justify-between p-12 relative overflow-hidden border-r border-amber-100">
          <div className="relative z-10">
            <TamamdirLogo className="h-[66px] mb-16" />
            <h2 className="text-4xl font-bold text-coffee leading-tight mb-4">
              Choose a new password
            </h2>
            <p className="text-gray-600 text-lg">
              Enter the code from your email and set a strong new password for your account.
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

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Reset your password</h1>
              <p className="text-green-light">
                Enter the code sent to{' '}
                <span className="font-medium text-white">{email}</span>.
                The code expires in {expiresInMinutes} minutes.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">
                  Reset Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-field text-center text-2xl tracking-[0.4em] font-mono bg-amber-50 border-amber-100"
                  autoComplete="one-time-code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field pl-10 pr-10 bg-amber-50 border-amber-100"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pl-10 bg-amber-50 border-amber-100"
                    minLength={8}
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-amber-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
              )}

              {success && (
                <p className="text-sm text-green-700 bg-amber-50 border border-green-200 rounded-lg px-4 py-2">{success}</p>
              )}

              <button
                type="submit"
                disabled={submitting || code.length !== 6 || !newPassword || !confirmPassword}
                className={`w-full flex items-center justify-center gap-2 bg-amber-50 text-green-primary font-semibold py-3 rounded-lg hover:bg-amber-100 transition-colors text-base ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Resetting…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Reset Password
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-green-light">
                Didn&apos;t receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-white font-semibold hover:underline disabled:opacity-60"
                >
                  {resending ? 'Sending…' : 'Resend code'}
                </button>
              </p>
              <p className="text-sm text-green-light">
                Wrong email?{' '}
                <Link to="/forgot-password" className="text-white font-semibold hover:underline">
                  Try again
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
