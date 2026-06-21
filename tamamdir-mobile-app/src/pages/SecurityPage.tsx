import { useState } from "react";
import TopBar from "../components/TopBar";
import Toast from "../components/Toast";
import api from "../lib/api";

type Device = { id: string; name: string; os: string; lastSeen: string; current: boolean };

const MOCK_DEVICES: Device[] = [
  { id: "d1", name: "Bu Cihaz", os: "Chrome · Windows", lastSeen: "Şu an aktif", current: true },
  { id: "d2", name: "iPhone 14", os: "Safari · iOS 17", lastSeen: "2 gün önce", current: false },
  { id: "d3", name: "MacBook Pro", os: "Chrome · macOS", lastSeen: "5 gün önce", current: false },
];

export default function SecurityPage() {
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  // step 0 = verify current password, step 1 = enter new password
  const [pwStep, setPwStep] = useState<0 | 1>(0);

  const [currentPassword, setCurrentPassword] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [saving, setSaving] = useState(false);

  // 2FA
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [showTwoFaSetup, setShowTwoFaSetup] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaError, setTwoFaError] = useState("");

  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);

  function showToast(msg: string) {
    setToastMessage(msg);
    setToastVisible(true);
  }

  function resetPasswordForm() {
    setShowPasswordForm(false);
    setPwStep(0);
    setCurrentPassword("");
    setCurrentPasswordError("");
    setNewPassword("");
    setConfirmPassword("");
    setNewPasswordError("");
    setConfirmPasswordError("");
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
  }

  async function handleVerifyCurrentPassword() {
    if (!currentPassword) {
      setCurrentPasswordError("Mevcut şifrenizi girin.");
      return;
    }
    setCurrentPasswordError("");
    setVerifying(true);
    try {
      await api.post("/api/auth/verify-password", { password: currentPassword });
      setPwStep(1);
    } catch {
      setCurrentPasswordError("Şifreniz yanlış, tekrar deneyin.");
    } finally {
      setVerifying(false);
    }
  }

  async function handlePasswordSave() {
    let hasError = false;
    if (newPassword.length < 8) {
      setNewPasswordError("Şifre en az 8 karakter olmalı.");
      hasError = true;
    } else {
      setNewPasswordError("");
    }
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Şifreler eşleşmiyor.");
      hasError = true;
    } else {
      setConfirmPasswordError("");
    }
    if (hasError) return;

    setSaving(true);
    try {
      await api.patch("/api/auth/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      resetPasswordForm();
      showToast("Şifreniz başarıyla değiştirildi!");
    } catch {
      showToast("Şifre güncellenemedi, tekrar deneyin.");
    } finally {
      setSaving(false);
    }
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
            onClick={() => {
              if (showPasswordForm) {
                resetPasswordForm();
              } else {
                setShowPasswordForm(true);
              }
            }}
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
            <span className={`material-symbols-outlined text-outline transition-transform duration-200 ${showPasswordForm ? "rotate-180" : ""}`}>
              expand_more
            </span>
          </button>

          {showPasswordForm && (
            <div className="px-5 pb-5 space-y-3 border-t border-outline-variant/10">
              <div className="pt-3" />

              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-1">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${pwStep >= 0 ? "bg-primary text-on-primary" : "bg-surface-container-high text-secondary"}`}>1</div>
                <div className={`flex-1 h-0.5 rounded ${pwStep >= 1 ? "bg-primary" : "bg-surface-container-high"}`} />
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${pwStep >= 1 ? "bg-primary text-on-primary" : "bg-surface-container-high text-secondary"}`}>2</div>
              </div>

              {pwStep === 0 ? (
                /* Step 0: Verify current password */
                <>
                  <p className="text-xs text-secondary font-bold">Mevcut şifrenizi doğrulayın</p>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-xs text-on-surface-variant">Mevcut Şifre</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">lock</span>
                      <input
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => { setCurrentPassword(e.target.value); setCurrentPasswordError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleVerifyCurrentPassword()}
                        placeholder="••••••••"
                        autoFocus
                        className={`w-full h-12 pl-10 pr-10 rounded-xl border bg-surface-container-low outline-none text-sm transition-all ${
                          currentPasswordError
                            ? "border-error focus:border-error focus:ring-1 focus:ring-error"
                            : "border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-outline"
                      >
                        <span className="material-symbols-outlined text-sm">{showCurrentPw ? "visibility_off" : "visibility"}</span>
                      </button>
                    </div>
                    {currentPasswordError && <p className="text-error text-xs">{currentPasswordError}</p>}
                  </div>
                  <button
                    onClick={handleVerifyCurrentPassword}
                    disabled={verifying}
                    className="w-full h-11 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60"
                  >
                    {verifying ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    )}
                    {verifying ? "Doğrulanıyor..." : "Devam Et"}
                  </button>
                </>
              ) : (
                /* Step 1: Enter new password */
                <>
                  <p className="text-xs text-secondary font-bold">Yeni şifrenizi belirleyin</p>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-xs text-on-surface-variant">Yeni Şifre</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">lock_reset</span>
                      <input
                        type={showNewPw ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setNewPasswordError(""); }}
                        placeholder="En az 8 karakter"
                        autoFocus
                        className={`w-full h-12 pl-10 pr-10 rounded-xl border bg-surface-container-low outline-none text-sm transition-all ${
                          newPasswordError
                            ? "border-error focus:border-error focus:ring-1 focus:ring-error"
                            : "border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-outline"
                      >
                        <span className="material-symbols-outlined text-sm">{showNewPw ? "visibility_off" : "visibility"}</span>
                      </button>
                    </div>
                    {newPasswordError && <p className="text-error text-xs">{newPasswordError}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-xs text-on-surface-variant">Yeni Şifre Tekrar</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">lock</span>
                      <input
                        type={showConfirmPw ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPasswordError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handlePasswordSave()}
                        placeholder="••••••••"
                        className={`w-full h-12 pl-10 pr-10 rounded-xl border bg-surface-container-low outline-none text-sm transition-all ${
                          confirmPasswordError
                            ? "border-error focus:border-error focus:ring-1 focus:ring-error"
                            : "border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-outline"
                      >
                        <span className="material-symbols-outlined text-sm">{showConfirmPw ? "visibility_off" : "visibility"}</span>
                      </button>
                    </div>
                    {confirmPasswordError && <p className="text-error text-xs">{confirmPasswordError}</p>}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => { setPwStep(0); setNewPassword(""); setConfirmPassword(""); setNewPasswordError(""); setConfirmPasswordError(""); }}
                      className="flex-1 h-11 border border-outline-variant text-on-surface rounded-xl font-bold text-sm active:scale-[0.98] transition-all"
                    >
                      Geri
                    </button>
                    <button
                      onClick={handlePasswordSave}
                      disabled={saving}
                      className="flex-1 h-11 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60"
                    >
                      {saving ? (
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined fill-icon text-sm">check_circle</span>
                      )}
                      {saving ? "Kaydediliyor..." : "Şifreyi Güncelle"}
                    </button>
                  </div>
                </>
              )}
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
