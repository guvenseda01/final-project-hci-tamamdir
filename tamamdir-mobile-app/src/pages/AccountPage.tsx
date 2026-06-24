import { useState, useRef, useEffect } from "react";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import api from "../lib/api";

export default function AccountPage() {
  const { user, updateAvatar, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    bio: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name,
      email: user.email,
      department: user.department,
      bio: user.bio,
    });
  }, [user]);

  function showToast(msg: string) {
    setToastMessage(msg);
    setToastVisible(true);
  }

  async function save() {
    if (!user?.id || saving) return;
    setSaving(true);
    try {
      await api.patch(`/api/users/${user.id}`, {
        full_name: form.name.trim(),
        department: form.department.trim() || null,
        bio: form.bio.trim() || null,
      });
      await refreshUser();
      showToast("Bilgiler kaydedildi!");
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string }; message?: string }).data?.error
        ?? (err as { message?: string }).message
        ?? "Kaydedilemedi.";
      showToast(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.id || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.post(`/api/users/${user.id}/avatar`, formData);
      updateAvatar(res.avatar_url);
      showToast("Profil fotoğrafı güncellendi!");
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string }; message?: string }).data?.error
        ?? (err as { message?: string }).message
        ?? "Fotoğraf yüklenemedi.";
      showToast(msg);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto">
      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
      <TopBar showBack title="Kişisel Bilgiler" />

      <main className="pt-20 pb-10 px-margin-mobile space-y-6">
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
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform disabled:opacity-60"
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
          <p className="font-bold text-on-surface">{form.name || "Kullanıcı"}</p>
          <p className="text-xs text-on-surface-variant">{form.email}</p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 space-y-4">
          <h3 className="font-bold text-sm text-secondary uppercase tracking-widest">Kişisel Bilgiler</h3>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-xs text-on-surface-variant">Ad Soyad</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-xs text-on-surface-variant">E-posta</label>
            <input
              type="email"
              value={form.email}
              readOnly
              className="w-full h-12 px-4 rounded-xl border border-outline-variant/30 bg-surface-container text-sm text-on-surface-variant"
            />
            <p className="text-[11px] text-outline">E-posta değişikliği desteklenmiyor.</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-xs text-on-surface-variant">Bölüm</label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
              placeholder="Örn. Bilgisayar Mühendisliği"
              className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-xs text-on-surface-variant">Hakkımda</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Kendini kısaca tanıt..."
              rows={4}
              maxLength={500}
              className="w-full p-4 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm resize-none"
            />
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="w-full h-12 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-btn-primary active:scale-[0.98] transition-all disabled:opacity-60 mt-2"
          >
            <span className="material-symbols-outlined fill-icon text-sm">check_circle</span>
            {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </button>
        </div>
      </main>
    </div>
  );
}
