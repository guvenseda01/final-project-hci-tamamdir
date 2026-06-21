import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import TamamdirLogo from '../components/TamamdirLogo'
import { usePreferences } from '../context/PreferencesContext'

export default function RegisterWelcomePage() {
  const navigate = useNavigate()
  const { t } = usePreferences()

  return (
    <div className="min-h-screen flex flex-col bg-amber-50">
      <div className="flex flex-1">
        <div className="hidden lg:flex lg:w-1/2 bg-amber-50 relative overflow-hidden border-r border-amber-100">
          <div className="absolute top-12 left-12 z-10">
            <TamamdirLogo className="h-[66px]" />
          </div>

          <div className="relative z-10 flex flex-1 flex-col justify-center px-12">
            <div className="w-16 h-16 bg-amber-50 ring-1 ring-amber-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-9 h-9 text-green-primary" strokeWidth={2.5} />
            </div>
            <h2 className="text-4xl font-bold text-coffee leading-tight mb-4">
              {t('welcome.leftTitle')}
            </h2>
            <p className="text-gray-600 max-w-md">
              {t('welcome.leftDesc')}
            </p>
          </div>

          <div className="absolute bottom-12 left-12 z-10 text-xs text-gray-400">
            {t('common.copyright')}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center px-8 sm:px-16 py-12 bg-green-primary relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-green-medium rounded-full opacity-20" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-green-dark rounded-full opacity-30" />

          <div className="relative z-10 w-full max-w-md text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-9 h-9 text-green-primary" strokeWidth={2.5} />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              {t('welcome.title')}
            </h1>
            <p className="text-lg text-green-light mb-8">
              {t('welcome.subtitle')}
            </p>

            <button
              type="button"
              onClick={() => navigate('/onboarding')}
              className="w-full flex items-center justify-center gap-2 bg-amber-50 text-green-primary font-semibold py-3.5 px-6 rounded-lg hover:bg-amber-100 transition-colors text-base"
            >
              {t('common.continue')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
