import { useState } from "react";
import TopBar from "../components/TopBar";
import Toast from "../components/Toast";
import api from "../lib/api";

export default function SecurityPage() {
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordErrors, setPasswordErrors] = useState({ current: "", next: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);

  function showToast(msg: string) {
    setToastMessage(msg);
    setToastVisible(true);
  }

  async function handlePasswordSave() {
    const errs = { current: "", next: "", confirm: "" };
    if (!passwords.current) errs.current = "Mevcut şifrenizi girin.";
    if (passwords.next.length < 8) errs.next = "Şifre en az 8 karakter olmalı.";
    if (passwords.next !== passwords.confirm) errs.confirm = "Şifreler eşleşmiyor.";
    setPasswordErrors(errs);
    if (errs.current || errs.next || errs.confirm || saving) return;

    setSaving(true);
    try {
      await api.patch("/api/auth/password", {
        current_password: passwords.current,
        new_password: passwords.next,
      });
      setPasswords({ current: "", next: "", confirm: "" });
      setShowPasswordForm(false);
      showToast("Şifreniz başarıyla değiştirildi!");
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string }; message?: string }).data?.error
        ?? (err as { message?: string }).message
        ?? "Şifre güncellenemedi.";
      showToast(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto">
      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
      <TopBar showBack title="Güvenlik" />

      <main className="pt-20 pb-10 px-margin-mobile space-y-6">
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
          <button
            type="button"
            onClick={() => {
              setShowPasswordForm((v) => !v);
              setPasswordErrors({ current: "", next: "", confirm: "" });
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
                        <span className="material-symbols-outlined text-sm">
                          {showPasswords[key] ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    {passwordErrors[key] && <p className="text-error text-xs">{passwordErrors[key]}</p>}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={handlePasswordSave}
                disabled={saving}
                className="w-full h-11 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 mt-1"
              >
                <span className="material-symbols-outlined fill-icon text-sm">check_circle</span>
                {saving ? "Güncelleniyor..." : "Şifreyi Güncelle"}
              </button>
            </div>
          )}
        </div>

        <div className="bg-surface-container-low rounded-2xl border border-outline-variant/20 p-4">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            İki adımlı doğrulama ve oturum yönetimi şu an yalnızca web sürümünde planlanmıştır. Mobil tarafta şifre değiştirme backend ile senkron çalışır.
          </p>
        </div>
      </main>
    </div>
  );
}
