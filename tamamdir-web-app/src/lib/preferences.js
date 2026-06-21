export const STORAGE_KEY = 'tamamdir_web_preferences'

const DEFAULTS = {
  language: 'tr',
}

export function loadPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw)
    const language = parsed.language === 'en' ? 'en' : 'tr'
    return { language }
  } catch {
    return { ...DEFAULTS }
  }
}

export function savePreferences(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  applyPreferences(prefs)
}

export function applyPreferences(prefs = loadPreferences()) {
  document.documentElement.lang = prefs.language
}
