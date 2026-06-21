import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Eye, EyeOff, Info, Users, BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import TamamdirLogo from '../components/TamamdirLogo'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { register } = useAuth()
  const { t } = usePreferences()
  const navigate = useNavigate()

  const isIyte = form.email.endsWith('@iyte.edu.tr') || form.email.endsWith('@std.iyte.edu.tr')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError(t('register.nameRequired')); return }
    if (form.password.length < 8) { setError(t('register.passwordMin')); return }
    if (form.password !== form.confirm) { setError(t('register.passwordMismatch')); return }
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
      setError(apiErrors ? apiErrors[0].msg : (err.message || t('register.failed')))
    } finally {
      setSubmitting(false)
    }
  }

  const features = [
    { icon: Users, titleKey: 'register.connectTitle', descKey: 'register.connectDesc' },
    { icon: BookOpen, titleKey: 'register.offerTitle', descKey: 'register.offerDesc' },
  ]

  const footerCols = [
    { titleKey: 'footer.platform', links: ['footer.browseServices', 'footer.becomeProvider'] },
    { titleKey: 'footer.support', links: ['footer.campusSafety', 'footer.supportCenter'] },
    { titleKey: 'footer.legal', links: ['footer.privacyPolicy', 'footer.termsOfUse'] },
  ]

  return (
    <div className="bg-amber-50">
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 bg-amber-50 flex-col p-12 relative overflow-hidden border-r border-amber-100">
          <div className="relative z-10 shrink-0">
            <TamamdirLogo className="h-[66px]" />
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-center py-8">
            <h2 className="text-4xl font-bold text-coffee leading-tight mb-4">
              {t('register.heroTitle')}
            </h2>
            <p className="text-gray-600 mb-10">
              {t('register.heroDesc')}
            </p>

            <div className="space-y-4">
              {features.map(({ icon: Icon, titleKey, descKey }) => (
                <div key={titleKey} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-pale rounded-full flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-green-primary" />
                  </div>
                  <div>
                    <p className="text-coffee font-semibold text-sm">{t(titleKey)}</p>
                    <p className="text-gray-600 text-sm">{t(descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 shrink-0 text-xs text-gray-400">
            {t('common.copyright')}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-20 py-12 bg-green-primary relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-green-medium rounded-full opacity-20" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-green-dark rounded-full opacity-30" />

          <div className="relative z-10 w-full max-w-md mx-auto">
            <div className="flex lg:hidden justify-end mb-6">
              <Link to="/login" className="text-sm text-green-light font-medium hover:text-white hover:underline">{t('login.submit')}</Link>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">{t('register.title')}</h1>
              <p className="text-green-light">{t('register.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">{t('register.fullName')}</label>
                <input
                  name="name"
                  type="text"
                  placeholder={t('register.fullNamePlaceholder')}
                  value={form.name}
                  onChange={handleChange}
                  className="input-field bg-amber-50 border-amber-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1.5">{t('common.emailAddress')}</label>
                <div className="relative">
                  <input
                    name="email"
                    type="email"
                    placeholder={t('register.emailPlaceholder')}
                    value={form.email}
                    onChange={handleChange}
                    className={`input-field pr-10 bg-amber-50 border-amber-100 ${isIyte ? 'border-green-primary ring-2 ring-green-primary/20' : ''}`}
                  />
                  {isIyte && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle2 className="w-5 h-5 text-green-primary" />
                    </div>
                  )}
                </div>
                {isIyte ? (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-light" />
                    <p className="text-xs text-green-light font-medium">
                      {t('register.iyteDetected')}
                    </p>
                  </div>
                ) : form.email ? (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Info className="w-3.5 h-3.5 text-green-light" />
                    <p className="text-xs text-green-light">{t('register.verificationHint')}</p>
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1.5">{t('common.password')}</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('register.passwordPlaceholder')}
                    value={form.password}
                    onChange={handleChange}
                    className="input-field pr-10 bg-amber-50 border-amber-100"
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
                  <p className="text-xs text-red-200 mt-1">{t('register.passwordMin')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1.5">{t('common.confirmPassword')}</label>
                <input
                  name="confirm"
                  type="password"
                  placeholder={t('register.confirmPlaceholder')}
                  value={form.confirm}
                  onChange={handleChange}
                  className={`input-field bg-amber-50 border-amber-100 ${form.confirm && form.confirm !== form.password ? 'border-red-400' : ''}`}
                />
                {form.confirm && form.confirm !== form.password && (
                  <p className="text-xs text-red-200 mt-1">{t('register.passwordMismatch')}</p>
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
                <label htmlFor="terms" className="text-sm text-green-light cursor-pointer leading-relaxed">
                  {t('register.termsPrefix')}{' '}
                  <span className="text-white font-medium hover:underline cursor-pointer">{t('register.termsOfService')}</span>
                  {' '}{t('register.and')}{' '}
                  <span className="text-white font-medium hover:underline cursor-pointer">{t('register.privacyPolicy')}</span>.
                </label>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-amber-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={!agreed || submitting}
                className={`w-full flex items-center justify-center gap-2 bg-amber-50 text-green-primary font-semibold py-3 rounded-lg hover:bg-amber-100 transition-colors text-base mt-2 ${!agreed || submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <CheckCircle2 className="w-5 h-5" />
                {submitting ? t('register.creating') : t('register.submit')}
              </button>
            </form>
          </div>
        </div>
      </div>

      <footer className="w-full border-t border-amber-100 py-8 px-8 sm:px-16 lg:px-20 bg-amber-50">
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-8 lg:gap-12 text-sm">
          <div>
            <TamamdirLogo className="h-10 mb-2" />
            <p className="text-gray-500 text-xs leading-relaxed">
              {t('footer.iyteTagline')}
            </p>
          </div>
          {footerCols.map((col) => (
            <div key={col.titleKey}>
              <p className="font-semibold text-coffee mb-2 uppercase text-xs tracking-wide">{t(col.titleKey)}</p>
              {col.links.map((linkKey) => (
                <p key={linkKey} className="text-gray-500 hover:text-gray-700 cursor-pointer text-xs mb-1">{t(linkKey)}</p>
              ))}
            </div>
          ))}
        </div>
        <div className="w-full mt-6 pt-6 border-t border-amber-100 text-xs text-gray-400">
          {t('common.copyright')}
        </div>
      </footer>
    </div>
  )
}
