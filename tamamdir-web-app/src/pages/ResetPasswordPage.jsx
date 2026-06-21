import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import api from '../lib/api'
import { usePreferences } from '../context/PreferencesContext'
import TamamdirLogo from '../components/TamamdirLogo'

export default function ResetPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = usePreferences()

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
      setError(t('reset.codeRequired'))
      return
    }
    if (newPassword.length < 8) {
      setError(t('register.passwordMin'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('register.passwordMismatch'))
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
      setSuccess(t('reset.success'))
      setTimeout(() => navigate('/login', { replace: true }), 1500)
    } catch (err) {
      const apiErrors = err.data?.errors
      setError(apiErrors ? apiErrors[0].msg : (err.message || t('reset.failed')))
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
      setSuccess(t('reset.resendSuccess'))
    } catch (err) {
      setError(err.message || t('reset.resendFailed'))
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
              {t('reset.heroTitle')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('reset.heroDesc')}
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
              <h1 className="text-3xl font-bold text-white mb-2">{t('reset.title')}</h1>
              <p className="text-green-light">
                {t('reset.subtitle')}{' '}
                <span className="font-medium text-white">{email}</span>.
                {' '}{t('reset.expiresIn', { minutes: expiresInMinutes })}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">
                  {t('reset.codeLabel')}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder={t('reset.codePlaceholder')}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-field text-center text-2xl tracking-[0.4em] font-mono bg-amber-50 border-amber-100"
                  autoComplete="one-time-code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1.5">
                  {t('common.newPassword')}
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
                  {t('common.confirmPassword')}
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
                    {t('reset.resetting')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    {t('reset.submit')}
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-green-light">
                {t('reset.noCode')}{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-white font-semibold hover:underline disabled:opacity-60"
                >
                  {resending ? t('common.sending') : t('common.resendCode')}
                </button>
              </p>
              <p className="text-sm text-green-light">
                {t('reset.wrongEmail')}{' '}
                <Link to="/forgot-password" className="text-white font-semibold hover:underline">
                  {t('common.tryAgain')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
