import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  applyPreferences,
  loadPreferences,
  savePreferences,
  type AppPreferences,
} from "../lib/preferences";
import { translate, type TranslationKey } from "../lib/i18n";

interface PreferencesContextType {
  preferences: AppPreferences;
  setPreferences: (prefs: AppPreferences) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const PreferencesContext = createContext<PreferencesContextType>({
  preferences: loadPreferences(),
  setPreferences: () => {},
  t: (key) => translate("tr", key),
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferencesState] = useState<AppPreferences>(() => {
    const prefs = loadPreferences();
    applyPreferences(prefs);
    return prefs;
  });

  const setPreferences = useCallback((prefs: AppPreferences) => {
    savePreferences(prefs);
    setPreferencesState(prefs);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(preferences.language, key, params),
    [preferences.language]
  );

  const value = useMemo(
    () => ({ preferences, setPreferences, t }),
    [preferences, setPreferences, t]
  );

  return (
    <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
