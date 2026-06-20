import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/home')
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        {/* Left green panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-green-primary flex-col justify-between p-12 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-16">
              <CheckCircle2 className="w-7 h-7 text-white" strokeWidth={2.5} />
              <span className="text-2xl font-bold text-white tracking-tight">Tamamdır!</span>
            </div>

            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Join the most reliable peer-to-peer service network for university students.
            </h2>
            <p className="text-green-light text-lg">
              Get things done, efficiently.
            </p>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex -space-x-2">
                {[5, 10, 15].map((img) => (
                  <img
                    key={img}
                    src={`https://i.pravatar.cc/150?img=${img}`}
                    alt=""
                    className="w-9 h-9 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <span className="text-white text-sm font-medium">+2k students active now</span>
            </div>
          </div>

          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-green-medium rounded-full opacity-20" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-green-dark rounded-full opacity-30" />
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-20 py-12">
          <div className="w-full max-w-md mx-auto">
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-2 mb-10">
              <CheckCircle2 className="w-6 h-6 text-green-primary" strokeWidth={2.5} />
              <span className="text-xl font-bold text-green-primary">Tamamdır!</span>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-gray-500">Secure access to your campus service dashboard.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
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
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <Link to="/forgot-password" className="text-sm text-green-primary hover:underline font-medium">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
              )}

              <button type="submit" disabled={submitting} className={`btn-primary w-full justify-center py-3 text-base ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <CheckCircle2 className="w-4 h-4" />
                {submitting ? 'Logging in…' : 'Login'}
              </button>

              <div className="relative flex items-center">
                <div className="flex-1 border-t border-gray-200" />
                <span className="mx-4 text-xs text-gray-400">or continue with</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="btn-outline flex items-center justify-center gap-2 py-2.5 text-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="btn-outline flex items-center justify-center gap-2 py-2.5 text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  GitHub
                </button>
              </div>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              New to Tamamdır?{' '}
              <Link to="/register" className="text-green-primary font-semibold hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-8 sm:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
          <div>
            <p className="font-semibold text-gray-900 mb-2">Tamamdır</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              Empowering students to achieve more through collective reliability and expert peer services.
            </p>
          </div>
          {[
            { title: 'Services', links: ['Browse Services', 'Become a Provider'] },
            { title: 'Community', links: ['Campus Safety', 'Support'] },
            { title: 'Legal', links: ['Privacy Policy'] },
          ].map((col) => (
            <div key={col.title}>
              <p className="font-semibold text-gray-900 mb-2 uppercase text-xs tracking-wide">{col.title}</p>
              {col.links.map((l) => (
                <p key={l} className="text-gray-500 hover:text-gray-700 cursor-pointer text-xs mb-1">{l}</p>
              ))}
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>© 2024 Tamamdır University Services. All rights reserved.</span>
        </div>
      </footer>

      {/* Verified badge toast */}
      <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-lg border border-green-pale px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-green-pale rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-green-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-800">Verified Campus Provider</p>
          <p className="text-xs text-gray-500">IZTECH verification status: Active</p>
        </div>
      </div>
    </div>
  )
}
