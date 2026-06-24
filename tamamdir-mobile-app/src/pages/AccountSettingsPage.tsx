import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import api from "../lib/api";

function isIyteEmail(email: string) {
  return email.endsWith("@std.iyte.edu.tr") || email.endsWith("@iyte.edu.tr");
}

type NotifSetting = { label: string; sub: string; on: boolean };

const DEFAULT_NOTIFS: NotifSetting[] = [
  { label: "Mesaj bildirimleri", sub: "Yeni mesaj geldiğinde bildir", on: true },
  { label: "Sipariş bildirimleri", sub: "Sipariş durumu değişince bildir", on: true },
  { label: "Promosyonlar", sub: "Kampanya ve fırsatlardan haberdar ol", on: false },
];

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [notifSettings, setNotifSettings] = useState<NotifSetting[]>(() => {
    try {
      const saved = localStorage.getItem("notifSettings");
      return saved ? (JSON.parse(saved) as NotifSetting[]) : DEFAULT_NOTIFS;
    } catch {
      return DEFAULT_NOTIFS;
    }
  });

  function showToast(msg: string) {
    setToastMessage(msg);
    setToastVisible(true);
  }

  function toggleNotif(index: number) {
    setNotifSettings((prev) => {
      const updated = prev.map((n, i) => (i === index ? { ...n, on: !n.on } : n));
      localStorage.setItem("notifSettings", JSON.stringify(updated));
      return updated;
    });
  }

  async function handleDeactivate() {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await api.post("/api/auth/deactivate");
      logout();
      navigate("/login");
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string }; message?: string }).data?.error
        ?? (err as { message?: string }).message
        ?? "Hesap devre dışı bırakılamadı.";
      showToast(msg);
    } finally {
      setActionLoading(false);
      setShowDeactivateConfirm(false);
    }
  }

  async function handleDeleteAccount() {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await api.del("/api/auth/account");
      logout();
      navigate("/login");
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string }; message?: string }).data?.error
        ?? (err as { message?: string }).message
        ?? "Hesap silinemedi.";
      showToast(msg);
    } finally {
      setActionLoading(false);
      setShowDeleteConfirm(false);
    }
  }

  const verified = isIyteEmail(user?.email ?? "");

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto">
      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
      <TopBar showBack title="Hesap Yönetimi" />

      <main className="pt-20 pb-10 px-margin-mobile space-y-6">
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 divide-y divide-outline-variant/10">
          <h3 className="font-bold text-xs text-secondary uppercase tracking-widest px-5 pt-4 pb-2">Bildirimler</h3>
          {notifSettings.map(({ label, sub }, i) => (
            <div key={label} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-bold text-sm text-on-surface">{label}</p>
                <p className="text-[11px] text-secondary">{sub}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleNotif(i)}
                className={`w-12 h-6 rounded-full transition-colors ${notifSettings[i].on ? "bg-primary" : "bg-surface-container-highest"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${notifSettings[i].on ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
          <p className="px-5 py-3 text-[11px] text-outline">
            Bildirim tercihleri bu cihazda saklanır. Uygulama içi zil bildirimleri backend ile çalışmaya devam eder.
          </p>
        </div>

        {verified ? (
          <div className="bg-primary/5 rounded-2xl border border-primary/20 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined fill-icon">verified</span>
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">İYTE Öğrenci Doğrulaması</p>
                <p className="text-[11px] text-secondary">Hesabınız doğrulanmış</p>
              </div>
              <span className="ml-auto text-xs bg-primary text-on-primary px-2.5 py-1 rounded-full font-bold">Aktif</span>
            </div>
            <p className="text-xs text-on-surface-variant">
              <span className="font-bold">{user?.email}</span> ile kayıtlı İYTE öğrenci hesabı.
            </p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5">
            <p className="font-bold text-sm text-on-surface mb-1">İYTE Öğrenci Doğrulaması</p>
            <p className="text-xs text-on-surface-variant">
              Kayıt sırasında @std.iyte.edu.tr veya @iyte.edu.tr e-postası kullanarak doğrulanmış rozet alabilirsiniz.
            </p>
          </div>
        )}

        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-3">
          <h3 className="font-bold text-sm text-amber-900 uppercase tracking-widest">Hesabı Dondur</h3>
          <p className="text-xs text-amber-900/80">
            Hesabını geçici olarak devre dışı bırakır. İlanların görünmez olur; tekrar giriş yaparak aktifleştirebilirsin.
          </p>
          {!showDeactivateConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeactivateConfirm(true)}
              className="w-full py-3 border-2 border-amber-300 text-amber-900 font-bold rounded-xl text-sm"
            >
              Hesabı Devre Dışı Bırak
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={actionLoading}
                className="flex-1 py-3 bg-amber-600 text-white font-bold rounded-xl text-sm disabled:opacity-60"
              >
                {actionLoading ? "..." : "Onayla"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeactivateConfirm(false)}
                className="flex-1 py-3 bg-white text-on-surface font-bold rounded-xl text-sm"
              >
                İptal
              </button>
            </div>
          )}
        </div>

        <div className="bg-error-container/20 rounded-2xl border border-error/20 p-5 space-y-3">
          <h3 className="font-bold text-sm text-error uppercase tracking-widest">Tehlikeli Alan</h3>
          <p className="text-xs text-on-surface-variant">Hesabın kalıcı olarak silinir. Bu işlem geri alınamaz.</p>
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 border-2 border-error/30 text-error font-bold rounded-xl text-sm active:bg-error/5 transition-colors"
            >
              Hesabı Kalıcı Sil
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-bold text-error">Emin misiniz? Tüm verileriniz silinecek.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-error text-on-error font-bold rounded-xl text-sm disabled:opacity-60"
                >
                  {actionLoading ? "..." : "Evet, Sil"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-surface-container-high text-on-surface font-bold rounded-xl text-sm"
                >
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
