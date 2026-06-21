import { useState } from "react";
import TopBar from "../components/TopBar";
import Toast from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

type Device = { id: string; name: string; os: string; lastSeen: string; current: boolean };

const MOCK_DEVICES: Device[] = [
  { id: "d1", name: "Bu Cihaz", os: "Chrome · Windows", lastSeen: "Şu an aktif", current: true },
  { id: "d2", name: "iPhone 14", os: "Safari · iOS 17", lastSeen: "2 gün önce", current: false },
  { id: "d3", name: "MacBook Pro", os: "Chrome · macOS", lastSeen: "5 gün önce", current: false },
];

export default function SecurityPage() {
  const { user } = useAuth();
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordStep, setPasswordStep] = useState<1 | 2>(1);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordErrors, setPasswordErrors] = useState({ current: "", next: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [devices, setDevices] = useState<Device[]>(() => {
    try {
      const removed = JSON.parse(localStorage.getItem("removed_devices") ?? "[]") as string[];
      return MOCK_DEVICES.filter((d) => !removed.includes(d.id));
    } catch { return MOCK_DEVICES; }
  });
  const [removingId, setRemovingId] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setToastVisible(true);
  }

  async function handleVerifyCurrentPassword() {
    if (!passwords.current) {
      setPasswordErrors((e) => ({ ...e, current: "Mevcut şifrenizi girin." }));
      return;
    }
    setPasswordLoading(true);
    try {
      await api.post("/api/auth/login", { email: user?.email, password: passwords.current });
      setPasswordErrors({ current: "", next: "", confirm: "" });
      setPasswordStep(2);
    } catch {
      setPasswordErrors((e) => ({ ...e, current: "Mevcut şifre hatalı." }));
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handlePasswordSave() {
    const errs = { current: "", next: "", confirm: "" };
    if (passwords.next.length < 8) errs.next = "Şifre en az 8 karakter olmalı.";
    if (passwords.next !== passwords.confirm) errs.confirm = "Şifreler eşleşmiyor.";
    setPasswordErrors(errs);
    if (errs.next || errs.confirm) return;
    setPasswordLoading(true);
    try {
      await api.patch("/api/auth/password", {
        current_password: passwords.current,
        new_password: passwords.next,
      });
      setPasswords({ current: "", next: "", confirm: "" });
      setPasswordStep(1);
      setShowPasswordForm(false);
      showToast("Şifreniz başarıyla değiştirildi!");
    } catch {
      setPasswordErrors((e) => ({ ...e, next: "Şifre güncellenemedi. Tekrar deneyin." }));
    } finally {
      setPasswordLoading(false);
    }
  }

  async function removeDevice(id: string) {
    setRemovingId(id);
    await new Promise((r) => setTimeout(r, 600));
    setDevices((prev) => prev.filter((d) => d.id !== id));
    try {
      const removed = JSON.parse(localStorage.getItem("removed_devices") ?? "[]") as string[];
      localStorage.setItem("removed_devices", JSON.stringify([...removed, id]));
    } catch {}
    setRemovingId(null);
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
            onClick={() => { setShowPasswordForm((v) => !v); setPasswordErrors({ current: "", next: "", confirm: "" }); setPasswordStep(1); setPasswords({ current: "", next: "", confirm: "" }); }}
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

              {passwordStep === 1 && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-xs text-on-surface-variant">Mevcut Şifre</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">lock</span>
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwords.current}
                        onChange={(e) => {
                          setPasswords((p) => ({ ...p, current: e.target.value }));
                          setPasswordErrors((p) => ({ ...p, current: "" }));
                        }}
                        placeholder="••••••••"
                        className={`w-full h-12 pl-10 pr-10 rounded-xl border bg-surface-container-low outline-none text-sm transition-all ${
                          passwordErrors.current
                            ? "border-error focus:border-error focus:ring-1 focus:ring-error"
                            : "border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((p) => ({ ...p, current: !p.current }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-outline"
                      >
                        <span className="material-symbols-outlined text-sm">{showPasswords.current ? "visibility_off" : "visibility"}</span>
                      </button>
                    </div>
                    {passwordErrors.current && <p className="text-error text-xs">{passwordErrors.current}</p>}
                  </div>
                  <button
                    onClick={handleVerifyCurrentPassword}
                    disabled={passwordLoading}
                    className="w-full h-11 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all mt-1 disabled:opacity-60"
                  >
                    {passwordLoading
                      ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                      : <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    }
                    İleri
                  </button>
                </>
              )}

              {passwordStep === 2 && (
                <>
                  {(["next", "confirm"] as const).map((key) => {
                    const labels = { next: "Yeni Şifre", confirm: "Yeni Şifre Tekrar" };
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
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => { setPasswordStep(1); setPasswordErrors({ current: "", next: "", confirm: "" }); }}
                      className="h-11 px-4 bg-surface-container-high text-on-surface rounded-xl font-bold text-sm active:scale-[0.98] transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                    </button>
                    <button
                      onClick={handlePasswordSave}
                      disabled={passwordLoading}
                      className="flex-1 h-11 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60"
                    >
                      {passwordLoading
                        ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        : <span className="material-symbols-outlined fill-icon text-sm">check_circle</span>
                      }
                      Şifreyi Güncelle
                    </button>
                  </div>
                </>
              )}
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
                    disabled={removingId === device.id}
                    className="text-error text-[11px] font-bold px-2 py-1 rounded-lg active:bg-error/10 transition-colors disabled:opacity-50"
                  >
                    {removingId === device.id ? "..." : "Çıkış"}
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
