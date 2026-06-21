import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { applyPreferences, loadPreferences, savePreferences } from '../lib/preferences'
import { translate } from '../lib/i18n'

const PreferencesContext = createContext(null)

export function PreferencesProvider({ children }) {
  const [preferences, setPreferencesState] = useState(() => {
    const prefs = loadPreferences()
    applyPreferences(prefs)
    return prefs
  })

  const setLanguage = useCallback((language) => {
    const next = { language: language === 'en' ? 'en' : 'tr' }
    savePreferences(next)
    setPreferencesState(next)
  }, [])

  const t = useCallback(
    (key, params) => translate(preferences.language, key, params),
    [preferences.language]
  )

  const value = useMemo(
    () => ({ language: preferences.language, setLanguage, t }),
    [preferences.language, setLanguage, t]
  )

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) {
    throw new Error('usePreferences must be used within PreferencesProvider')
  }
  return ctx
}
