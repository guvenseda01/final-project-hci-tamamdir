import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import { tCategory } from '../lib/i18n'

const EMOJI = {
  code:              '💻',
  sports_tennis:     '🎾',
  yarn:              '🧶',
  palette:           '🎨',
  translate:         '🌐',
  photo_camera:      '📷',
  music_note:        '🎵',
  calculate:         '🧮',
  cleaning_services: '🧹',
  spa:               '💅',
  pets:              '🐾',
  handyman:          '🛠️',
}

export default function OnboardingPage() {
  const [categories, setCategories] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loadingCats, setLoadingCats] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const { user, me } = useAuth()
  const { t } = usePreferences()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isFromProfile = searchParams.get('from') === 'profile'

  useEffect(() => {
    api.get('/api/categories')
      .then(data => setCategories(data))
      .catch(() => setFetchError(t('onboarding.fetchFailed')))
      .finally(() => setLoadingCats(false))
  }, [t])

  useEffect(() => {
    if (!user?.interests?.length) return
    setSelected(new Set(user.interests.map(i => i.id)))
  }, [user?.interests])

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleCancel = () => {
    if (isFromProfile) {
      navigate('/profile', { state: { tab: 'personalization' } })
    } else {
      navigate('/home')
    }
  }

  const handleSave = async () => {
    if (!user?.id) return
    setSaveError('')
    setSaving(true)
    try {
      await api.put(`/api/users/${user.id}/interests`, { category_ids: [...selected] })
      await me()
      if (isFromProfile) {
        navigate('/profile', { state: { interestsUpdated: true, tab: 'personalization' } })
      } else {
        navigate('/home')
      }
    } catch (err) {
      setSaveError(err.message || t('onboarding.saveFailed'))
      setSaving(false)
    }
  }

  const interestsLabel = selected.size === 1
    ? t('onboarding.interestsSelected_one', { count: selected.size })
    : t('onboarding.interestsSelected', { count: selected.size })

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-amber-50">
      <div className="flex-1 flex flex-col w-full px-4 sm:px-6 lg:px-10 xl:px-14 pt-6 sm:pt-8 pb-28 min-h-0">
        <div className="mb-4 sm:mb-6 shrink-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-primary mb-2">
            {isFromProfile ? t('onboarding.titleUpdate') : t('onboarding.title')}
          </h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-3xl">
            {t('onboarding.subtitle')}
          </p>
        </div>

        {fetchError && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 shrink-0">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{fetchError}</span>
          </div>
        )}

        {loadingCats && !fetchError && (
          <div className="flex-1 min-h-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 auto-rows-fr gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-full min-h-[88px] rounded-xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        )}

        {!loadingCats && categories.length > 0 && (
          <div className="flex-1 min-h-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 auto-rows-fr gap-3 sm:gap-4">
            {categories.map((cat) => {
              const isSelected = selected.has(cat.id)
              const emoji = EMOJI[cat.icon] ?? '✨'
              return (
                <button
                  key={cat.id}
                  onClick={() => toggle(cat.id)}
                  className={`relative h-full min-h-[88px] rounded-xl overflow-hidden text-left transition-all duration-200 bg-amber-100 ${
                    isSelected
                      ? 'ring-2 ring-green-primary ring-offset-2 shadow-lg scale-[1.02]'
                      : 'hover:shadow-md hover:scale-[1.01] hover:bg-amber-200/60'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-7 h-7 bg-amber-50 rounded-full flex items-center justify-center shadow">
                      <CheckCircle2 className="w-4 h-4 text-green-primary" strokeWidth={2.5} />
                    </div>
                  )}

                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 sm:p-4">
                    <span className="text-3xl sm:text-4xl lg:text-5xl select-none">{emoji}</span>
                    <p className="text-coffee font-semibold text-xs sm:text-sm lg:text-base text-center leading-tight">
                      {tCategory(t, cat)}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-amber-50 border-t border-amber-100 px-4 sm:px-6 lg:px-10 xl:px-14 py-4 shadow-lg">
        {saveError && (
          <div className="flex items-center gap-2 text-red-600 text-sm mb-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {saveError}
          </div>
        )}
        <div className="flex items-center justify-end gap-3">
          <span className="text-sm text-gray-400 mr-auto">
            {interestsLabel}
          </span>
          {!isFromProfile ? null : (
            <button
              onClick={handleCancel}
              className="text-sm text-gray-500 font-medium hover:text-gray-700 px-4 py-2.5"
            >
              {t('common.cancel')}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || loadingCats}
            className={`btn-primary py-2.5 ${saving || loadingCats ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {saving ? t('onboarding.saving') : isFromProfile ? t('onboarding.save') : t('common.continue')}
          </button>
        </div>
      </div>
    </div>
  )
}
