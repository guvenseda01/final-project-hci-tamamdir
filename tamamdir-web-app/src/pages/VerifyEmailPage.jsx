import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, Mail, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function VerifyEmailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { verifyEmail, resendVerification } = useAuth()

  const email = location.state?.email ?? ''
  const expiresInMinutes = location.state?.expiresInMinutes ?? 15

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!email) navigate('/register', { replace: true })
  }, [email, navigate])

  const handleVerify = async (e) => {
    e.preventDefault()
    if (code.length !== 6) {
      setError('Please enter the 6-digit verification code.')
      return
    }
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      await verifyEmail(email, code)
      navigate('/register/welcome', { replace: true })
    } catch (err) {
      const apiErrors = err.data?.errors
      setError(apiErrors ? apiErrors[0].msg : (err.message || 'Verification failed.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setSuccess('')
    setResending(true)
    try {
      await resendVerification(email)
      setSuccess('A new verification code has been sent to your email.')
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
        <div className="hidden lg:flex lg:w-1/2 bg-green-primary flex-col justify-between p-12 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-16">
              <CheckCircle2 className="w-7 h-7 text-white" strokeWidth={2.5} />
              <span className="text-2xl font-bold text-white tracking-tight">Tamamdır!</span>
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Verify your campus email
            </h2>
            <p className="text-green-light">
              We sent a 6-digit code to your inbox. Enter it here to activate your account and join the IYTE marketplace.
            </p>
          </div>
          <div className="relative z-10 text-xs text-green-light">
            © 2024 Tamamdır University Services. All rights reserved.
          </div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-green-medium rounded-full opacity-20" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-green-dark rounded-full opacity-30" />
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-20 py-12">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-8">
              <div className="w-12 h-12 bg-green-pale rounded-full flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-green-primary" />
              </div>
              <h1 className="text-3xl font-bold text-coffee mb-2">Check your email</h1>
              <p className="text-gray-500">
                We sent a verification code to{' '}
                <span className="font-medium text-green-primary">{email}</span>.
                The code expires in {expiresInMinutes} minutes.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-field text-center text-2xl tracking-[0.4em] font-mono"
                  autoComplete="one-time-code"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
              )}

              {success && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">{success}</p>
              )}

              <button
                type="submit"
                disabled={submitting || code.length !== 6}
                className={`btn-primary w-full justify-center py-3 text-base ${submitting || code.length !== 6 ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Verify Email
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-gray-500">
                Didn&apos;t receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-green-primary font-semibold hover:underline disabled:opacity-60"
                >
                  {resending ? 'Sending…' : 'Resend code'}
                </button>
              </p>
              <p className="text-sm text-gray-500">
                Wrong email?{' '}
                <Link to="/register" className="text-green-primary font-semibold hover:underline">
                  Register again
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
