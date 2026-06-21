import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Eye, EyeOff, Info, Users, BookOpen, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const isIyte = form.email.endsWith('@iyte.edu.tr') || form.email.endsWith('@std.iyte.edu.tr')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Full name is required.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (form.password !== form.confirm) { setError("Passwords don't match."); return }
    setError('')
    setSubmitting(true)
    try {
      const data = await register(form.name.trim(), form.email.trim(), form.password)
      navigate('/verify-email', {
        state: {
          email: data.email,
          expiresInMinutes: data.expires_in_minutes,
        },
      })
    } catch (err) {
      const apiErrors = err.data?.errors
      setError(apiErrors ? apiErrors[0].msg : (err.message || 'Registration failed.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-amber-50">
      <div className="flex flex-1">
        {/* Left green panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-green-primary flex-col justify-between p-12 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-16">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-7 h-7 text-white" strokeWidth={2.5} />
                <span className="text-2xl font-bold text-white tracking-tight">Tamamdır!</span>
              </div>
              <Link to="/login" className="text-sm text-green-light hover:text-white transition-colors">
                Already have an account? <span className="font-semibold text-white">Login</span>
              </Link>
            </div>

            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Join the IYTE Community Marketplace
            </h2>
            <p className="text-green-light mb-10">
              The exclusive peer-to-peer platform for Izmir Institute of Technology students. Solve daily tasks, share skills, and build a safer campus together.
            </p>

            <div className="space-y-4">
              {[
                { icon: Users, title: 'Connect with peers', desc: 'Engage with fellow IYTE students directly.' },
                { icon: BookOpen, title: 'Offer your skills', desc: 'Turn your talents into helpful campus services.' },
                { icon: Shield, title: 'Safe campus-only network', desc: 'Verified @iyte.edu.tr access only.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-medium rounded-full flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{title}</p>
                    <p className="text-green-light text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 text-xs text-green-light">
            © 2024 Tamamdır University Services. All rights reserved.
          </div>

          <div className="absolute -top-20 -right-20 w-80 h-80 bg-green-medium rounded-full opacity-20" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-green-dark rounded-full opacity-30" />
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-20 py-12">
          <div className="w-full max-w-md mx-auto">
            <div className="flex lg:hidden justify-end mb-6">
              <Link to="/login" className="text-sm text-green-primary font-medium hover:underline">Login</Link>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-coffee mb-2">Create your account</h1>
              <p className="text-gray-500">Start your journey at IYTE today.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1.5">Full Name</label>
                <input
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className={`input-field pr-10 ${isIyte ? 'border-green-primary ring-2 ring-green-primary/20' : ''}`}
                  />
                  {isIyte && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle2 className="w-5 h-5 text-green-primary" />
                    </div>
                  )}
                </div>
                {isIyte ? (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-primary" />
                    <p className="text-xs text-green-primary font-medium">
                      IYTE email detected — after email verification you&apos;ll get the Verified Student badge.
                    </p>
                  </div>
                ) : form.email ? (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Info className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs text-gray-400">We&apos;ll send a verification code to your email.</p>
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={handleChange}
                    className="input-field pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password && form.password.length < 8 && (
                  <p className="text-xs text-red-400 mt-1">Password must be at least 8 characters.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <input
                  name="confirm"
                  type="password"
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={handleChange}
                  className={`input-field ${form.confirm && form.confirm !== form.password ? 'border-red-400' : ''}`}
                />
                {form.confirm && form.confirm !== form.password && (
                  <p className="text-xs text-red-400 mt-1">Passwords don't match.</p>
                )}
              </div>

              <div className="flex items-start gap-3 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-green-primary cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
                  I agree to the{' '}
                  <span className="text-green-primary font-medium hover:underline cursor-pointer">Terms of Service</span>
                  {' '}and{' '}
                  <span className="text-green-primary font-medium hover:underline cursor-pointer">Privacy Policy</span>.
                </label>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={!agreed || submitting}
                className={`btn-primary w-full justify-center py-3 text-base mt-2 ${!agreed || submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <CheckCircle2 className="w-5 h-5" />
                {submitting ? 'Creating account…' : 'Join Tamamdır!'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-green-primary font-semibold hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
          <div>
            <p className="font-semibold text-coffee mb-2">Tamamdır</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              The trusted marketplace for IYTE campus services. Efficiency and community combined.
            </p>
          </div>
          {[
            { title: 'Platform', links: ['Browse Services', 'Become a Provider'] },
            { title: 'Support', links: ['Campus Safety', 'Support Center'] },
            { title: 'Legal', links: ['Privacy Policy', 'Terms of Use'] },
          ].map((col) => (
            <div key={col.title}>
              <p className="font-semibold text-coffee mb-2 uppercase text-xs tracking-wide">{col.title}</p>
              {col.links.map((l) => (
                <p key={l} className="text-gray-500 hover:text-gray-700 cursor-pointer text-xs mb-1">{l}</p>
              ))}
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-gray-100 text-xs text-gray-400 text-center">
          © 2024 Tamamdır University Services. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
