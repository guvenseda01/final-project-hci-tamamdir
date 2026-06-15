import { useState } from "react";
import TopBar from "../components/TopBar";
import Toast from "../components/Toast";

const LANGUAGES = ["Türkçe", "English", "Deutsch", "Español"];
const FONT_SIZES = ["Küçük", "Orta", "Büyük"];

export default function PersonalizationPage() {
  const [language, setLanguage] = useState("Türkçe");
  const [fontSize, setFontSize] = useState("Orta");
  const [darkMode, setDarkMode] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [screenReader, setScreenReader] = useState(false);

  function save() {
    setToastVisible(true);
  }

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto">
      <Toast message="Tercihler kaydedildi!" visible={toastVisible} onHide={() => setToastVisible(false)} />
      <TopBar showBack title="Kişiselleştirme" />

      <main className="pt-20 pb-10 px-margin-mobile space-y-6">
        {/* Theme */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 space-y-4">
          <h3 className="font-bold text-sm text-secondary uppercase tracking-widest">Görünüm</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-inverse-surface flex items-center justify-center">
                <span className="material-symbols-outlined text-white">dark_mode</span>
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">Karanlık Mod</p>
                <p className="text-[11px] text-secondary">Koyu renk temasına geç</p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-12 h-6 rounded-full transition-colors ${darkMode ? "bg-primary" : "bg-surface-container-highest"}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">animation</span>
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">Animasyonlar</p>
                <p className="text-[11px] text-secondary">Geçiş efektlerini etkinleştir</p>
              </div>
            </div>
            <button
              onClick={() => setAnimations(!animations)}
              className={`w-12 h-6 rounded-full transition-colors ${animations ? "bg-primary" : "bg-surface-container-highest"}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${animations ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>

        {/* Font Size */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 space-y-4">
          <h3 className="font-bold text-sm text-secondary uppercase tracking-widest">Yazı Boyutu</h3>
          <div className="flex gap-3">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${fontSize === size ? "bg-primary text-on-primary shadow-btn-primary" : "bg-surface-container-high text-on-surface-variant"}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 space-y-3">
          <h3 className="font-bold text-sm text-secondary uppercase tracking-widest">Dil</h3>
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className="w-full flex items-center justify-between p-3 rounded-xl active:bg-surface-container transition-colors"
            >
              <span className="font-bold text-sm text-on-surface">{lang}</span>
              {language === lang && <span className="material-symbols-outlined fill-icon text-primary">check_circle</span>}
            </button>
          ))}
        </div>

        {/* Accessibility */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 space-y-4">
          <h3 className="font-bold text-sm text-secondary uppercase tracking-widest">Erişilebilirlik</h3>
          {[
            { label: "Yüksek Kontrast", sub: "Daha güçlü renkler kullan", val: highContrast, set: setHighContrast },
            { label: "Ekran Okuyucu", sub: "VoiceOver / TalkBack desteği", val: screenReader, set: setScreenReader },
          ].map(({ label, sub, val, set }) => (
            <div key={label} className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-on-surface">{label}</p>
                <p className="text-[11px] text-secondary">{sub}</p>
              </div>
              <button
                onClick={() => set(!val)}
                className={`w-12 h-6 rounded-full transition-colors ${val ? "bg-primary" : "bg-surface-container-highest"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${val ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={save}
          className="w-full h-14 bg-primary text-on-primary rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-btn-primary active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined fill-icon">check_circle</span>
          Tercihleri Kaydet
        </button>
      </main>
    </div>
  );
}
