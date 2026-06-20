import { useState } from "react";
import { useNavigate } from "react-router-dom";

const INTERESTS = [
  { id: "egitim",      label: "Eğitim",       icon: "school" },
  { id: "spor",        label: "Spor",          icon: "fitness_center" },
  { id: "tasarim",     label: "Tasarım",       icon: "palette" },
  { id: "teknik",      label: "Teknik",        icon: "build" },
  { id: "el-sanatlari",label: "El Sanatları",  icon: "hub" },
  { id: "muzik",       label: "Müzik",         icon: "music_note" },
  { id: "yaratici",    label: "Yaratıcı",      icon: "auto_awesome" },
  { id: "teslimat",    label: "Teslimat",      icon: "local_shipping" },
  { id: "fotograf",    label: "Fotoğraf",      icon: "photo_camera" },
  { id: "yemek",       label: "Yemek",         icon: "restaurant" },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleContinue() {
    localStorage.setItem("onboarding_done", "true");
    navigate("/");
  }

  function handleSkip() {
    localStorage.setItem("onboarding_done", "true");
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center max-w-md mx-auto">
      <header className="w-full sticky top-0 z-40 bg-background px-margin-mobile h-16 flex items-center justify-end">
        <button
          onClick={handleSkip}
          className="text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Atla
        </button>
      </header>

      <main className="w-full px-margin-mobile flex flex-col gap-xl flex-grow pb-10">
        {/* Başlık */}
        <div className="pt-4 pb-2">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-btn-primary">
            <span className="material-symbols-outlined fill-icon text-white text-3xl">interests</span>
          </div>
          <h1 className="font-bold text-2xl text-on-surface leading-tight">
            İlgi alanlarını<br />bize anlat
          </h1>
          <p className="text-on-surface-variant text-sm mt-2">
            Sana uygun hizmetleri öne çıkaralım. En az 1 seçim yap.
          </p>
        </div>

        {/* İlgi alanı kartları */}
        <div className="grid grid-cols-2 gap-3">
          {INTERESTS.map(({ id, label, icon }) => {
            const active = selected.has(id);
            return (
              <button
                key={id}
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
                  <span className="material-symbols-outlined text-2xl">{icon}</span>
                </div>
                <span className={`font-bold text-sm ${active ? "text-primary" : "text-on-surface"}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Seçim sayısı */}
        {selected.size > 0 && (
          <p className="text-center text-xs text-on-surface-variant">
            <span className="font-bold text-primary">{selected.size}</span> alan seçildi
          </p>
        )}

        {/* Devam Et butonu */}
        <div className="mt-auto pt-4">
          <button
            onClick={handleContinue}
            disabled={selected.size === 0}
            className="w-full h-14 bg-primary text-on-primary rounded-xl font-bold text-lg flex items-center justify-center gap-xs shadow-btn-primary hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            <span>Devam Et</span>
            <span className="material-symbols-outlined fill-icon">arrow_forward</span>
          </button>
        </div>
      </main>
    </div>
  );
}
