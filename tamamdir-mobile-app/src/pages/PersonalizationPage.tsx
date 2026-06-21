import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import Toast from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";
import {
  LANGUAGE_LABELS,
  preferencesEqual,
  type AppLanguage,
  type AppPreferences,
  type ThemeMode,
} from "../lib/preferences";

export default function PersonalizationPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { preferences, setPreferences, t } = usePreferences();
  const [saved, setSaved] = useState<AppPreferences>(preferences);
  const [draft, setDraft] = useState<AppPreferences>(preferences);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    refreshUser().catch(() => {});
  }, [refreshUser]);

  useEffect(() => {
    setSaved(preferences);
    setDraft(preferences);
  }, [preferences]);

  const hasChanges = useMemo(() => !preferencesEqual(saved, draft), [saved, draft]);

  function updateDraft(partial: Partial<AppPreferences>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  function handleApply() {
    if (!hasChanges) return;
    setPreferences(draft);
    setSaved(draft);
    setToastVisible(true);
  }

  function openInterestsEditor() {
    navigate("/onboarding?from=profile", { replace: true });
  }

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto">
      <Toast message={t("personalization.saved")} visible={toastVisible} onHide={() => setToastVisible(false)} />
      <TopBar showBack backTo="/profile" title={t("personalization.title")} />

      <main className="pt-20 pb-10 px-margin-mobile space-y-6">
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 space-y-4">
          <h3 className="font-bold text-sm text-secondary uppercase tracking-widest">
            {t("personalization.appearance")}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {([
              { id: "light" as ThemeMode, labelKey: "personalization.light" as const, icon: "light_mode" },
              { id: "dark" as ThemeMode, labelKey: "personalization.dark" as const, icon: "dark_mode" },
            ]).map(({ id, labelKey, icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => updateDraft({ theme: id })}
                className={`py-4 rounded-xl font-bold text-sm flex flex-col items-center gap-2 transition-all ${
                  draft.theme === id
                    ? "bg-primary text-on-primary shadow-btn-primary"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined">{icon}</span>
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 space-y-3">
          <h3 className="font-bold text-sm text-secondary uppercase tracking-widest">
            {t("personalization.language")}
          </h3>
          {(Object.entries(LANGUAGE_LABELS) as [AppLanguage, string][]).map(([code, label]) => (
            <button
              key={code}
              type="button"
              onClick={() => updateDraft({ language: code })}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                draft.language === code ? "bg-primary/10" : "active:bg-surface-container"
              }`}
            >
              <span className="font-bold text-sm text-on-surface">{label}</span>
              {draft.language === code && (
                <span className="material-symbols-outlined fill-icon text-primary">check_circle</span>
              )}
            </button>
          ))}
          <p className="text-[11px] text-outline pt-1">{t("personalization.languageHint")}</p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 space-y-4">
          <h3 className="font-bold text-sm text-secondary uppercase tracking-widest">
            {t("personalization.accessibility")}
          </h3>
          {[
            {
              labelKey: "personalization.highContrast" as const,
              subKey: "personalization.highContrastSub" as const,
              key: "highContrast" as const,
            },
            {
              labelKey: "personalization.reduceMotion" as const,
              subKey: "personalization.reduceMotionSub" as const,
              key: "reduceMotion" as const,
            },
          ].map(({ labelKey, subKey, key }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-on-surface">{t(labelKey)}</p>
                <p className="text-[11px] text-secondary">{t(subKey)}</p>
              </div>
              <button
                type="button"
                onClick={() => updateDraft({ [key]: !draft[key] })}
                aria-pressed={draft[key]}
                className={`w-12 h-6 rounded-full transition-colors ${draft[key] ? "bg-primary" : "bg-surface-container-highest"}`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    draft[key] ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-on-surface">{t("personalization.interests")}</h3>
              <p className="text-[11px] text-secondary mt-1">
                {user?.interests?.length
                  ? t("personalization.interestsCount", { count: user.interests.length })
                  : t("personalization.interestsEmpty")}
              </p>
            </div>
            <button
              type="button"
              onClick={openInterestsEditor}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-primary/10 text-primary font-bold text-sm"
            >
              {t("personalization.edit")}
            </button>
          </div>
          {user?.interests && user.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest) => (
                <span
                  key={interest.id}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-primary/10 text-primary"
                >
                  {interest.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleApply}
          disabled={!hasChanges}
          className="w-full h-14 bg-primary text-on-primary rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-btn-primary active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none disabled:active:scale-100"
        >
          <span className="material-symbols-outlined fill-icon">check_circle</span>
          {t("personalization.apply")}
        </button>
      </main>
    </div>
  );
}
