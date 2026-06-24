export type ThemeMode = "light" | "dark";
export type AppLanguage = "tr" | "en" | "de" | "es";

export interface AppPreferences {
  theme: ThemeMode;
  language: AppLanguage;
  highContrast: boolean;
  reduceMotion: boolean;
}

const STORAGE_KEY = "tamamdir_preferences";

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  es: "Español",
};

const DEFAULTS: AppPreferences = {
  theme: "light",
  language: "tr",
  highContrast: false,
  reduceMotion: false,
};

export function loadPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppPreferences>) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function savePreferences(prefs: AppPreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  applyPreferences(prefs);
}

export function applyPreferences(prefs: AppPreferences = loadPreferences()) {
  const root = document.documentElement;
  root.classList.toggle("dark", prefs.theme === "dark");
  root.classList.toggle("high-contrast", prefs.highContrast);
  root.classList.toggle("reduce-motion", prefs.reduceMotion);
  root.lang = prefs.language;
}

export function preferencesEqual(a: AppPreferences, b: AppPreferences) {
  return (
    a.theme === b.theme &&
    a.language === b.language &&
    a.highContrast === b.highContrast &&
    a.reduceMotion === b.reduceMotion
  );
}
