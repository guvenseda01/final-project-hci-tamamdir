import { cn } from '../lib/utils'
import { usePreferences } from '../context/PreferencesContext'

export default function LanguageToggle({ variant = 'default', className }) {
  const { language, setLanguage, t } = usePreferences()

  const target = language === 'tr' ? 'en' : 'tr'
  const label = target === 'en' ? 'EN' : 'TR'

  return (
    <button
      type="button"
      onClick={() => setLanguage(target)}
      aria-label={t(`navbar.language.${target}`)}
      className={cn(
        'p-2.5 rounded-lg transition-colors text-sm font-semibold leading-none shrink-0',
        variant === 'auth'
          ? 'text-green-light hover:text-white'
          : 'text-gray-600 hover:text-coffee',
        className
      )}
    >
      {label}
    </button>
  )
}
