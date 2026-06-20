import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error('Failed to send reset email')
      }

      setSubmitted(true)
      setEmail('')
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
              Forgot your password?
            </h2>
            <p className="text-green-light text-lg mb-8">
              No problem! We'll send you a secure link to reset your password and regain access to your Tamamdır account.
            </p>

            <div className="space-y-4">
              {[
                'Secure reset link sent to your email',
                'Link expires in 1 hour',
                'Create a new password instantly',
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
              <Link to="/login" className="text-sm text-green-primary font-medium hover:underline">Back to Login</Link>
            </div>

            {!submitted ? (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
                  <p className="text-gray-500">Enter your email address and we'll send you a link to reset your password.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        placeholder="student@iyte.edu.tr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="input-field pl-10"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
                  )}

                  <button type="submit" disabled={loading} className={`btn-primary w-full justify-center py-3 text-base ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    <Mail className="w-4 h-4" />
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </button>
                </form>

                <div className="relative flex items-center my-6">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="mx-4 text-xs text-gray-400">or</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>

                <Link to="/login" className="flex items-center justify-center gap-2 text-green-primary font-semibold hover:underline">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-pale rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-primary" strokeWidth={2} />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Check Your Email</h1>
                  <p className="text-gray-500">We've sent a password reset link to your email.</p>
                </div>

                <div className="bg-green-pale border border-green-primary/20 rounded-lg p-6 mb-8">
                  <p className="text-sm text-gray-700">
                    <strong>Check your email inbox</strong> for a message from Tamamdır. The reset link will expire in 1 hour.
                  </p>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  <p>
                    <strong>Didn't receive an email?</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-500">
                    <li>Check your spam or junk folder</li>
                    <li>Make sure you entered the correct email address</li>
                    <li>Try requesting a new link after a few minutes</li>
                  </ul>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSubmitted(false)
                      setError('')
                    }}
                    className="btn-outline w-full justify-center py-3 text-base mb-3"
                  >
                    Try Another Email
                  </button>

                  <Link to="/login" className="flex items-center justify-center gap-2 text-green-primary font-semibold hover:underline">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                </div>
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
