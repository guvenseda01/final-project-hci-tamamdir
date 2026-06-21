import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import Toast from "../components/Toast";

interface Category {
  id: string;
  name: string;
  icon?: string;
  slug?: string;
}

const ICON_MAP: Record<string, string> = {
  code: "code",
  sports_tennis: "sports_tennis",
  yarn: "hub",
  palette: "palette",
  translate: "translate",
  photo_camera: "photo_camera",
  music_note: "music_note",
  calculate: "calculate",
  cleaning_services: "cleaning_services",
  spa: "spa",
  pets: "pets",
  handyman: "handyman",
};

function categoryIcon(icon?: string) {
  return ICON_MAP[icon ?? ""] ?? "category";
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromProfile = searchParams.get("from") === "profile";
  const { user, refreshUser } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingCats, setLoadingCats] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    api.get("/api/categories")
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {
        setToastMessage("Kategoriler yüklenemedi.");
        setToastVisible(true);
      })
      .finally(() => setLoadingCats(false));
  }, []);

  useEffect(() => {
    if (!user?.interests?.length) return;
    setSelected(new Set(user.interests.map((i) => i.id)));
  }, [user?.interests]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleContinue() {
    if (!user?.id || saving || selected.size === 0) return;
    setSaving(true);
    try {
      await api.put(`/api/users/${user.id}/interests`, { category_ids: [...selected] });
      await refreshUser();
      localStorage.setItem("onboarding_done", "true");
      if (fromProfile) {
        navigate("/personalization", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string }; message?: string }).message
        ?? "İlgi alanları kaydedilemedi.";
      setToastMessage(msg);
      setToastVisible(true);
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    localStorage.setItem("onboarding_done", "true");
    navigate(fromProfile ? "/personalization" : "/", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center max-w-md mx-auto">
      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />

      <header className="w-full sticky top-0 z-40 bg-background px-margin-mobile h-16 flex items-center justify-end">
        <button
          type="button"
          onClick={handleSkip}
          className="text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors"
        >
          {fromProfile ? "Geri" : "Atla"}
        </button>
      </header>

      <main className="w-full px-margin-mobile flex flex-col gap-xl flex-grow pb-10">
        <div className="pt-4 pb-2">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-btn-primary">
            <span className="material-symbols-outlined fill-icon text-white text-3xl">interests</span>
          </div>
          <h1 className="font-bold text-2xl text-on-surface leading-tight">
            {fromProfile ? "İlgi alanlarını güncelle" : "İlgi alanlarını bize anlat"}
          </h1>
          <p className="text-on-surface-variant text-sm mt-2">
            Sana uygun hizmetleri öne çıkaralım. En az 1 seçim yap.
          </p>
        </div>

        {loadingCats ? (
          <div className="flex justify-center py-16">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {categories.map(({ id, name, icon }) => {
              const active = selected.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  className={`relative flex flex-col items-center justify-center gap-2 py-5 px-4 rounded-2xl border-2 transition-all active:scale-95 ${
                    active
                      ? "bg-primary/10 border-primary shadow-sm"
                      : "bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant"
                  }`}
                >
                  {active && (
                    <span className="absolute top-2 right-2 material-symbols-outlined fill-icon text-primary text-base leading-none">
                      check_circle
                    </span>
                  )}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      active ? "bg-primary text-on-primary" : "bg-secondary-container text-on-secondary-container"
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">{categoryIcon(icon)}</span>
                  </div>
                  <span className={`font-bold text-sm text-center ${active ? "text-primary" : "text-on-surface"}`}>
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {selected.size > 0 && (
          <p className="text-center text-xs text-on-surface-variant">
            <span className="font-bold text-primary">{selected.size}</span> alan seçildi
          </p>
        )}

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={handleContinue}
            disabled={selected.size === 0 || saving || loadingCats}
            className="w-full h-14 bg-primary text-on-primary rounded-xl font-bold text-lg flex items-center justify-center gap-xs shadow-btn-primary hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            <span>{saving ? "Kaydediliyor..." : fromProfile ? "Kaydet" : "Devam Et"}</span>
            {!saving && <span className="material-symbols-outlined fill-icon">arrow_forward</span>}
          </button>
        </div>
      </main>
    </div>
  );
}
