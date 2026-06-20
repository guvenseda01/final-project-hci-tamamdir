import { useState } from "react";
import TopBar from "../components/TopBar";
import Toast from "../components/Toast";

type Device = { id: string; name: string; os: string; lastSeen: string; current: boolean };

const MOCK_DEVICES: Device[] = [
  { id: "d1", name: "Bu Cihaz", os: "Chrome · Windows", lastSeen: "Şu an aktif", current: true },
  { id: "d2", name: "iPhone 14", os: "Safari · iOS 17", lastSeen: "2 gün önce", current: false },
  { id: "d3", name: "MacBook Pro", os: "Chrome · macOS", lastSeen: "5 gün önce", current: false },
];

export default function SecurityPage() {
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordErrors, setPasswordErrors] = useState({ current: "", next: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false });

  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [showTwoFaSetup, setShowTwoFaSetup] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaError, setTwoFaError] = useState("");

  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);

  function showToast(msg: string) {
    setToastMessage(msg);
    setToastVisible(true);
  }

  function handlePasswordSave() {
    const errs = { current: "", next: "", confirm: "" };
    if (!passwords.current) errs.current = "Mevcut şifrenizi girin.";
    if (passwords.next.length < 8) errs.next = "Şifre en az 8 karakter olmalı.";
    if (passwords.next !== passwords.confirm) errs.confirm = "Şifreler eşleşmiyor.";
    setPasswordErrors(errs);
    if (errs.current || errs.next || errs.confirm) return;
    setPasswords({ current: "", next: "", confirm: "" });
    setShowPasswordForm(false);
    showToast("Şifreniz başarıyla değiştirildi!");
  }

  function handleTwoFaToggle() {
    if (twoFaEnabled) {
      setTwoFaEnabled(false);
      showToast("İki adımlı doğrulama devre dışı bırakıldı.");
    } else {
      setShowTwoFaSetup(true);
    }
  }

  function handleTwoFaConfirm() {
    if (twoFaCode.length !== 6 || !/^\d+$/.test(twoFaCode)) {
      setTwoFaError("6 haneli doğrulama kodunu girin.");
      return;
    }
    setTwoFaEnabled(true);
    setShowTwoFaSetup(false);
    setTwoFaCode("");
    setTwoFaError("");
    showToast("İki adımlı doğrulama aktif edildi!");
  }

  function removeDevice(id: string) {
    setDevices((prev) => prev.filter((d) => d.id !== id));
    showToast("Cihazdan çıkış yapıldı.");
  }

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto">
      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
      <TopBar showBack title="Güvenlik" />

      <main className="pt-20 pb-10 px-margin-mobile space-y-6">

        {/* Password Change */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
          <button
            onClick={() => { setShowPasswordForm((v) => !v); setPasswordErrors({ current: "", next: "", confirm: "" }); }}
            className="w-full flex items-center justify-between px-5 py-4 active:bg-surface-container-low transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">lock</span>
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-on-surface">Şifre Değiştir</p>
                <p className="text-[11px] text-secondary">Hesap şifrenizi güncelleyin</p>
              </div>
            </div>
            <span className={`material-symbols-outlined text-outline transition-transform duration-200 ${showPasswordForm ? "rotate-180" : ""}`}>expand_more</span>
          </button>

          {showPasswordForm && (
            <div className="px-5 pb-5 space-y-3 border-t border-outline-variant/10">
              <div className="pt-3" />
              {(["current", "next", "confirm"] as const).map((key) => {
                const labels = { current: "Mevcut Şifre", next: "Yeni Şifre", confirm: "Yeni Şifre Tekrar" };
                return (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="font-bold text-xs text-on-surface-variant">{labels[key]}</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">lock</span>
                      <input
                        type={showPasswords[key] ? "text" : "password"}
                        value={passwords[key]}
                        onChange={(e) => {
                          setPasswords((p) => ({ ...p, [key]: e.target.value }));
                          setPasswordErrors((p) => ({ ...p, [key]: "" }));
                        }}
                        placeholder="••••••••"
                        className={`w-full h-12 pl-10 pr-10 rounded-xl border bg-surface-container-low outline-none text-sm transition-all ${
                          passwordErrors[key]
                            ? "border-error focus:border-error focus:ring-1 focus:ring-error"
                            : "border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((p) => ({ ...p, [key]: !p[key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-outline"
                      >
                        <span className="material-symbols-outlined text-sm">{showPasswords[key] ? "visibility_off" : "visibility"}</span>
                      </button>
                    </div>
                    {passwordErrors[key] && <p className="text-error text-xs">{passwordErrors[key]}</p>}
                  </div>
                );
              })}
              <button
                onClick={handlePasswordSave}
                className="w-full h-11 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all mt-1"
              >
                <span className="material-symbols-outlined fill-icon text-sm">check_circle</span>
                Şifreyi Güncelle
              </button>
            </div>
          )}
        </div>

        {/* Two-Factor Auth */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">phonelink_lock</span>
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">İki Adımlı Doğrulama</p>
                <p className="text-[11px] text-secondary">
                  {twoFaEnabled ? "Aktif — ekstra koruma açık" : "Hesabınızı daha güvenli hale getirin"}
                </p>
              </div>
            </div>
            <button
              onClick={handleTwoFaToggle}
              className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${twoFaEnabled ? "bg-primary" : "bg-surface-container-highest"}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${twoFaEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>

          {showTwoFaSetup && (
            <div className="mx-5 mb-5 p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">info</span>
                <p className="text-xs text-on-surface font-bold">Telefon numaranıza doğrulama kodu gönderildi.</p>
              </div>
              <input
                type="tel"
                maxLength={6}
                value={twoFaCode}
                onChange={(e) => { setTwoFaCode(e.target.value.replace(/\D/g, "")); setTwoFaError(""); }}
                placeholder="6 haneli kod"
                className={`w-full h-12 px-4 rounded-xl border bg-surface-container-low outline-none text-sm text-center tracking-[0.4em] font-bold transition-all ${
                  twoFaError
                    ? "border-error focus:ring-1 focus:ring-error"
                    : "border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
                }`}
              />
              {twoFaError && <p className="text-error text-xs">{twoFaError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleTwoFaConfirm}
                  className="flex-1 h-10 bg-primary text-on-primary rounded-xl font-bold text-sm active:scale-[0.98] transition-all"
                >
                  Onayla
                </button>
                <button
                  onClick={() => { setShowTwoFaSetup(false); setTwoFaCode(""); setTwoFaError(""); }}
                  className="flex-1 h-10 bg-surface-container-high text-on-surface rounded-xl font-bold text-sm active:scale-[0.98] transition-all"
                >
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Login Devices */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 space-y-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">devices</span>
            </div>
            <div>
              <p className="font-bold text-sm text-on-surface">Giriş Cihazları</p>
              <p className="text-[11px] text-secondary">{devices.length} aktif oturum</p>
            </div>
          </div>
          <div className="space-y-2">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  device.current
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-surface-container-low"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-outline text-[20px]">
                    {device.os.includes("iOS") || device.os.includes("iPhone")
                      ? "smartphone"
                      : device.os.includes("MacBook")
                      ? "laptop_mac"
                      : "computer"}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-xs text-on-surface">{device.name}</p>
                      {device.current && (
                        <span className="text-[10px] bg-primary text-on-primary px-1.5 py-0.5 rounded-full font-bold">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-secondary">{device.os} · {device.lastSeen}</p>
                  </div>
                </div>
                {!device.current && (
                  <button
                    onClick={() => removeDevice(device.id)}
                    className="text-error text-[11px] font-bold px-2 py-1 rounded-lg active:bg-error/10 transition-colors"
                  >
                    Çıkış
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
