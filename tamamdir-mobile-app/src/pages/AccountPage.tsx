import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";

function isIyteEmail(email: string) {
  return email.endsWith("@std.iyte.edu.tr") || email.endsWith("@iyte.edu.tr");
}

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [notifSettings, setNotifSettings] = useState([
    { label: "Mesaj bildirimleri", sub: "Yeni mesaj geldiğinde bildir", on: true },
    { label: "Hizmet güncellemeleri", sub: "Rezervasyon değişikliklerinde bildir", on: true },
    { label: "Promosyonlar", sub: "Kampanya ve fırsatlardan haberdar ol", on: false },
  ]);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [iyteEmail, setIyteEmail] = useState("");
  const [iyteEmailError, setIyteEmailError] = useState("");

  function toggleNotif(index: number) {
    setNotifSettings((prev) => prev.map((n, i) => i === index ? { ...n, on: !n.on } : n));
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setToastVisible(true);
  }

  function save() {
    showToast("Bilgiler kaydedildi!");
  }

  function handleIyteVerify() {
    if (!iyteEmail) {
      setIyteEmailError("E-posta zorunludur.");
      return;
    }
    if (!isIyteEmail(iyteEmail)) {
      setIyteEmailError("Yalnızca @std.iyte.edu.tr veya @iyte.edu.tr uzantılı e-posta kabul edilir.");
      return;
    }
    setIyteEmailError("");
    showToast("Doğrulama bağlantısı e-postanıza gönderildi!");
    setIyteEmail("");
  }

  const verified = isIyteEmail(user?.email ?? "");

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto">
      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
      <TopBar showBack title="Hesap Yönetimi" />

      <main className="pt-20 pb-10 px-margin-mobile space-y-6">
        {/* Profile Photo */}
        <div className="flex flex-col items-center pt-4 pb-2">
          <div className="relative mb-3">
            <img
              src={user?.avatar || "https://i.pravatar.cc/150?img=3"}
              alt="Profil"
              className="w-24 h-24 rounded-full object-cover border-4 border-primary-container"
            />
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-sm">photo_camera</span>
            </button>
          </div>
          <p className="font-bold text-on-surface">{form.name}</p>
          <p className="text-xs text-on-surface-variant">{form.email}</p>
        </div>

        {/* Personal Info */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 space-y-4">
          <h3 className="font-bold text-sm text-secondary uppercase tracking-widest">Kişisel Bilgiler</h3>
          {[
            { id: "name", label: "Ad Soyad", icon: "person", type: "text" },
            { id: "email", label: "E-posta", icon: "mail", type: "email" },
          ].map(({ id, label, icon, type }) => (
            <div key={id} className="flex flex-col gap-1">
              <label className="font-bold text-xs text-on-surface-variant">{label}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">{icon}</span>
                <input
                  type={type}
                  value={form[id as keyof typeof form]}
                  onChange={(e) => setForm((p) => ({ ...p, [id]: e.target.value }))}
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                />
              </div>
            </div>
          ))}
          <button
            onClick={save}
            className="w-full h-12 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-btn-primary active:scale-[0.98] transition-all mt-2"
          >
            <span className="material-symbols-outlined fill-icon text-sm">check_circle</span>
            Değişiklikleri Kaydet
          </button>
        </div>

        {/* Notifications */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 divide-y divide-outline-variant/10">
          <h3 className="font-bold text-xs text-secondary uppercase tracking-widest px-5 pt-4 pb-2">Bildirimler</h3>
          {notifSettings.map(({ label, sub }, i) => (
            <div key={label} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-bold text-sm text-on-surface">{label}</p>
                <p className="text-[11px] text-secondary">{sub}</p>
              </div>
              <button
                onClick={() => toggleNotif(i)}
                className={`w-12 h-6 rounded-full transition-colors ${notifSettings[i].on ? "bg-primary" : "bg-surface-container-highest"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${notifSettings[i].on ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>

        {/* Student Verification */}
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
              <span className="font-bold">{user?.email}</span> adresiyle giriş yaparak İYTE öğrenci rozeti aldınız. Diğer kullanıcılar profilinizde doğrulama işaretini görebilir.
            </p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <span className="material-symbols-outlined">school</span>
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">İYTE Öğrenci Doğrulaması</p>
                <p className="text-[11px] text-secondary">Doğrulanmamış hesap</p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant">
              İYTE öğrenciyseniz üniversite e-postanızı ekleyerek doğrulanmış öğrenci rozeti alabilirsiniz.
            </p>

            <div className="flex flex-col gap-2">
              <label className="font-bold text-xs text-on-surface-variant">İYTE E-postası</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">mail</span>
                <input
                  type="email"
                  value={iyteEmail}
                  onChange={(e) => { setIyteEmail(e.target.value); setIyteEmailError(""); }}
                  placeholder="ad.soyad@std.iyte.edu.tr"
                  className={`w-full h-12 pl-10 pr-4 rounded-xl border bg-surface-container-low focus:ring-1 outline-none text-sm transition-all ${
                    iyteEmailError
                      ? "border-error focus:border-error focus:ring-error"
                      : "border-outline-variant focus:border-primary focus:ring-primary"
                  }`}
                />
              </div>
              {iyteEmailError && (
                <p className="text-error text-xs">{iyteEmailError}</p>
              )}
              <p className="text-[11px] text-outline">
                Kabul edilen uzantılar: @std.iyte.edu.tr · @iyte.edu.tr
              </p>
              <button
                onClick={handleIyteVerify}
                className="w-full h-11 bg-secondary-container text-on-secondary-container rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-sm">verified</span>
                Doğrula
              </button>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="bg-error-container/20 rounded-2xl border border-error/20 p-5 space-y-3">
          <h3 className="font-bold text-sm text-error uppercase tracking-widest">Tehlikeli Alan</h3>
          <p className="text-xs text-on-surface-variant">Bu işlemler geri alınamaz.</p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 border-2 border-error/30 text-error font-bold rounded-xl text-sm active:bg-error/5 transition-colors"
            >
              Hesabı Sil
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-bold text-error">Emin misiniz? Bu işlem geri alınamaz.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { logout(); navigate("/login"); }}
                  className="flex-1 py-3 bg-error text-on-error font-bold rounded-xl text-sm"
                >
                  Evet, Sil
                </button>
                <button
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
