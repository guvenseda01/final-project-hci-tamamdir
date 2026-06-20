import { useState, useRef } from "react";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import api from "../lib/api";

export default function AccountPage() {
  const { user, updateAvatar, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  function showToast(msg: string) {
    setToastMessage(msg);
    setToastVisible(true);
  }

  async function save() {
    updateUser({ name: form.name, email: form.email });
    try {
      if (user?.id) {
        await api.patch(`/api/users/${user.id}`, { full_name: form.name });
      }
    } catch {}
    showToast("Bilgiler kaydedildi!");
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      updateAvatar(dataUrl);
      showToast("Profil fotoğrafı güncellendi!");
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto">
      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
      <TopBar showBack title="Kişisel Bilgiler" />

      <main className="pt-20 pb-10 px-margin-mobile space-y-6">
        {/* Profile Photo */}
        <div className="flex flex-col items-center pt-4 pb-2">
          <div className="relative mb-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Profil"
                className="w-24 h-24 rounded-full object-cover border-4 border-primary-container"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-primary-container bg-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-secondary-container text-4xl">person</span>
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-sm">photo_camera</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
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
      </main>
    </div>
  );
}
