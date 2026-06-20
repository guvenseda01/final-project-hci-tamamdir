import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Lock, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.')
    }
  }, [token])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (form.password !== form.confirm) {
      setError("Passwords don't match.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          new_password: form.password,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reset password')
      }

      setSuccess(true)
      setForm({ password: '', confirm: '' })

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        {/* Left green panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-green-primary flex-col justify-center p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-lg">
            <div className="flex items-center gap-2 mb-12">
              <CheckCircle2 className="w-7 h-7 text-white" strokeWidth={2.5} />
              <span className="text-2xl font-bold text-white tracking-tight">Tamamdır!</span>
            </div>

            <h2 className="text-4xl font-bold text-white leading-tight mb-6">
              Reset Your Password
            </h2>
            <p className="text-green-light text-lg mb-8">
              Create a new, secure password for your Tamamdır account and regain full access to all features.
            </p>

            <div className="space-y-4">
              {[
                'Use a strong, unique password',
                'At least 8 characters required',
                'Change your password regularly for security',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-light rounded-full" />
                  <p className="text-green-light">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute -top-20 -right-20 w-80 h-80 bg-green-medium rounded-full opacity-20" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-green-dark rounded-full opacity-30" />
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-20 py-12">
          <div className="w-full max-w-md mx-auto">
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center justify-between mb-10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-primary" strokeWidth={2.5} />
                <span className="text-xl font-bold text-green-primary">Tamamdır!</span>
              </div>
              <Link to="/login" className="text-sm text-green-primary font-medium hover:underline">Back</Link>
            </div>

            {!success ? (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
                  <p className="text-gray-500">Enter a new password for your account.</p>
                </div>

                {!token ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">Invalid Reset Link</p>
                      <p className="text-sm text-red-600 mt-1">
                        The reset link is missing or invalid. Please request a new password reset.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          New Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Min. 8 characters"
                            value={form.password}
                            onChange={handleChange}
                            className="input-field pl-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {form.password && form.password.length < 8 && (
                          <p className="text-xs text-red-400 mt-1">Password must be at least 8 characters.</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type={showConfirm ? 'text' : 'password'}
                            name="confirm"
                            placeholder="Repeat your password"
                            value={form.confirm}
                            onChange={handleChange}
                            className={`input-field pl-10 pr-10 ${form.confirm && form.confirm !== form.password ? 'border-red-400' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {form.confirm && form.confirm !== form.password && (
                          <p className="text-xs text-red-400 mt-1">Passwords don't match.</p>
                        )}
                      </div>

                      {error && (
                        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
                      )}

                      <button type="submit" disabled={loading} className={`btn-primary w-full justify-center py-3 text-base ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        <CheckCircle2 className="w-4 h-4" />
                        {loading ? 'Resetting…' : 'Reset Password'}
                      </button>
                    </form>

                    <div className="relative flex items-center my-6">
                      <div className="flex-1 border-t border-gray-200" />
                      <span className="mx-4 text-xs text-gray-400">or</span>
                      <div className="flex-1 border-t border-gray-200" />
                    </div>

                    <Link to="/login" className="text-center text-sm text-green-primary font-semibold hover:underline block">
                      Back to Login
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-pale rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-primary" strokeWidth={2} />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Password Reset Successful</h1>
                  <p className="text-gray-500">Your password has been updated. Redirecting to login…</p>
                </div>

                <div className="bg-green-pale border border-green-primary/20 rounded-lg p-6 mb-8">
                  <p className="text-sm text-gray-700">
                    You can now login to your Tamamdır account with your new password. Make sure to remember it for future logins.
                  </p>
                </div>

                <Link to="/login" className="btn-primary w-full justify-center py-3 text-base">
                  <CheckCircle2 className="w-4 h-4" />
                  Go to Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-8 sm:px-16">
        <div className="max-w-7xl mx-auto text-xs text-gray-400 text-center">
          © 2024 Tamamdır University Services. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
