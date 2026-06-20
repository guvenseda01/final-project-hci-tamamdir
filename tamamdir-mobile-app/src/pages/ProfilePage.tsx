import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";

interface SettingsRow {
  icon: string;
  label: string;
  sub: string;
  to?: string;
}

function isIyteStudent(email?: string) {
  return (email?.endsWith("@std.iyte.edu.tr") || email?.endsWith("@iyte.edu.tr")) ?? false;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const verified = isIyteStudent(user?.email);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const accountRows: SettingsRow[] = [
    { icon: "person", label: "Kişisel Bilgiler", sub: "Ad, E-posta, Öğrenci No", to: "/account" },
    { icon: "edit_attributes", label: "Kişiselleştirme", sub: "Tema, Dil, Erişilebilirlik", to: "/personalization" },
  ];

  const privacyRows: SettingsRow[] = [
    { icon: "shield", label: "Güvenlik", sub: "Şifre, 2FA, Giriş Cihazları" },
    { icon: "settings_account_box", label: "Hesap Yönetimi", sub: "Deaktif, Gizlilik, Veri", to: "/account" },
  ];

  return (
    <div className="bg-surface font-sans text-on-surface min-h-screen max-w-md mx-auto">
      {/* Fixed TopBar */}
      <header className="bg-white flex justify-between items-center w-full px-6 py-3 border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <span className="text-xl font-extrabold text-primary">Tamamdır</span>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-slate-50 transition-colors rounded-full">
            <span className="material-symbols-outlined text-slate-500">notifications</span>
          </button>
          <button className="p-2 hover:bg-slate-50 transition-colors rounded-full">
            <span className="material-symbols-outlined text-slate-500">help</span>
          </button>
        </div>
      </header>

      <main className="pb-24">
        {/* Profile Header — Navy Background */}
        <section className="bg-inverse-surface text-white px-6 py-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full border-4 border-primary-container p-1 bg-surface-container-lowest">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profil"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-secondary-container text-4xl">person</span>
                  </div>
                )}
              </div>
              {verified && (
                <div className="absolute bottom-1 right-1 bg-primary-container text-on-primary-container rounded-full p-1 border-2 border-inverse-surface">
                  <span className="material-symbols-outlined fill-icon text-sm leading-none">verified</span>
                </div>
              )}
            </div>
            <h1 className="font-bold text-xl mb-1">{user?.name || "Kullanıcı"}</h1>
            <p className="text-sm opacity-80 mb-3">{user?.department} • {user?.year}</p>
            {verified ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-container/20 border border-primary-container/30 rounded-full">
                <span className="material-symbols-outlined fill-icon text-xs text-primary-fixed">school</span>
                <span className="text-xs font-bold text-primary-fixed uppercase tracking-wider">Doğrulanmış İYTE Öğrencisi</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container/30 border border-outline-variant/30 rounded-full">
                <span className="material-symbols-outlined text-xs text-outline">person</span>
                <span className="text-xs font-bold text-outline uppercase tracking-wider">Kullanıcı</span>
              </div>
            )}
          </div>
        </section>

        {/* Stats */}
        <section className="px-gutter -mt-6 relative z-20">
          <div className="grid grid-cols-3 gap-3 bg-surface-container-lowest shadow-card rounded-xl p-4 border border-outline-variant/30">
            {[
              { val: user?.completedServices ?? 0, label: "Tamamlanan" },
              { val: user?.rating ? user.rating.toFixed(1) : "—", label: "Puan" },
              { val: user?.activeServices ?? 0, label: "Hizmet" },
            ].map((s, i) => (
              <div key={i} className={`text-center ${i < 2 ? "border-r border-outline-variant/30" : ""}`}>
                <div className="text-xl font-bold text-primary">{s.val}</div>
                <div className="text-[10px] font-bold text-secondary uppercase tracking-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-gutter pt-8 space-y-6">
          {/* Account & Profile */}
          <div>
            <h3 className="text-xs font-bold text-secondary px-2 mb-2 uppercase tracking-widest">Hesap & Profil</h3>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 divide-y divide-outline-variant/10">
              {accountRows.map((row) => (
                <button
                  key={row.label}
                  onClick={() => row.to && navigate(row.to)}
                  className="w-full flex items-center justify-between p-4 active:bg-surface-container transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
                      <span className="material-symbols-outlined">{row.icon}</span>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-on-surface">{row.label}</p>
                      <p className="text-[11px] text-secondary">{row.sub}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-outline">chevron_right</span>
                </button>
              ))}
            </div>
          </div>

          {/* Services Management */}
          <div>
            <h3 className="text-xs font-bold text-secondary px-2 mb-2 uppercase tracking-widest">Hizmetlerim</h3>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">design_services</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-on-surface">Hizmet Yönetimi</p>
                  <p className="text-[11px] text-secondary">Sunduklarınızı kontrol edin</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate("/services/new")}
                  className="flex items-center justify-center gap-2 py-3 bg-primary-container text-on-primary-container font-bold text-sm rounded-xl active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  Yeni Ekle
                </button>
                <button
                  onClick={() => navigate("/profile/manage")}
                  className="flex items-center justify-center gap-2 py-3 bg-secondary-container text-on-secondary-container font-bold text-sm rounded-xl active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-sm">manage_accounts</span>
                  Yönet
                </button>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div>
            <h3 className="text-xs font-bold text-secondary px-2 mb-2 uppercase tracking-widest">Gizlilik & Güvenlik</h3>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 divide-y divide-outline-variant/10">
              {privacyRows.map((row) => (
                <button
                  key={row.label}
                  onClick={() => row.to && navigate(row.to)}
                  className="w-full flex items-center justify-between p-4 active:bg-surface-container transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
                      <span className="material-symbols-outlined">{row.icon}</span>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-on-surface">{row.label}</p>
                      <p className="text-[11px] text-secondary">{row.sub}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-outline">chevron_right</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="space-y-3">
            <button className="w-full py-4 flex items-center justify-center gap-2 text-secondary font-bold bg-white rounded-2xl border border-outline-variant/20 active:bg-slate-50 transition-colors text-sm">
              <span className="material-symbols-outlined">help</span>
              Yardım Merkezi & Destek
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-4 flex items-center justify-center gap-2 text-error font-bold bg-white rounded-2xl border border-error/10 active:bg-error/5 transition-colors text-sm"
            >
              <span className="material-symbols-outlined">logout</span>
              Çıkış Yap
            </button>
          </div>
          <div className="text-center pb-8">
            <p className="text-[10px] text-outline uppercase tracking-widest opacity-60">Tamamdır Sürüm 2.4.0</p>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
