import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { useServices } from "../context/ServicesContext";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

const UNITS: { label: string; value: string }[] = [
  { label: "Saatlik", value: "hour" },
  { label: "Oturum başı", value: "session" },
  { label: "Günlük", value: "day" },
  { label: "Haftalık", value: "week" },
  { label: "Proje bazlı", value: "session" },
];

const FALLBACK_CATEGORIES = ["Eğitim", "Tasarım", "Teknik", "El Sanatları", "Spor", "Teslimat", "Yaratıcı"];

export default function AddNewServicePage() {
  const navigate = useNavigate();
  const { refresh } = useServices();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState(UNITS[0].value);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<{ url: string; file: File }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("Tamamdır! Hizmet yayınlandı.");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/api/categories')
      .then((data: any) => {
        const list = Array.isArray(data) ? data : [];
        if (list.length > 0) {
          const mapped = list.map((c: any) => ({ id: String(c.id), name: c.name }));
          const others = mapped.filter((c: any) => c.name === 'Other');
          const rest = mapped.filter((c: any) => c.name !== 'Other');
          setCategories([...rest, ...others]);
        } else {
          setCategories(FALLBACK_CATEGORIES.map((name, i) => ({ id: String(i + 1), name })));
        }
      })
      .catch(() => {
        setCategories(FALLBACK_CATEGORIES.map((name, i) => ({ id: String(i + 1), name })));
      });
  }, []);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = 4 - photos.length;
    files.slice(0, remaining).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos((prev) =>
          prev.length < 4
            ? [...prev, { url: ev.target?.result as string, file }]
            : prev
        );
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handlePublish() {
    if (!title.trim() || !categoryId || !price || saving) return;
    setSaving(true);
    try {
      const created: any = await api.post('/api/services', {
        category_id: categoryId,
        title: title.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        price_unit: unit,
        delivery_days: 1,
      });

      if (photos.length > 0 && created?.id) {
        const formData = new FormData();
        photos.forEach((p) => formData.append("images", p.file));
        await api.post(`/api/services/${created.id}/images`, formData);
      }

      await refresh();
      setToastMessage("Tamamdır! Hizmet yayınlandı.");
      setToastVisible(true);
      setTimeout(() => navigate(-1), 1800);
    } catch {
      setToastMessage("Hizmet yayınlanamadı, tekrar deneyin.");
      setToastVisible(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto">
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />

      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest border-b border-outline-variant/20 shadow-sm flex justify-between items-center h-[60px] px-margin-mobile max-w-md">
        <div className="flex items-center gap-md">
          <button
            onClick={() => navigate(-1)}
            className="text-primary active:scale-95 transition-transform duration-200"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-md-mobile text-headline-md-mobile text-on-surface font-bold">
            Yeni Hizmet Ekle
          </h1>
        </div>
        <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/20 bg-secondary-container flex items-center justify-center">
          {user?.avatar ? (
            <img src={user.avatar} alt="Profil" className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-on-secondary-container text-xl">person</span>
          )}
        </div>
      </header>

      <main className="pt-[60px] pb-32 px-margin-mobile">
        <div className="pt-xl space-y-xl">
          {/* Image Upload */}
          <section>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoSelect}
            />
            <div className="space-y-sm">
              <div className="flex items-center justify-between px-1">
                <p className="font-label-bold text-label-bold text-on-surface-variant">
                  Hizmet Fotoğrafları
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {photos.length}/4
                </p>
              </div>

              {photos.length === 0 ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video w-full rounded-xl bg-surface-container-high border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center gap-sm active:bg-surface-container-highest transition-colors"
                >
                  <div className="bg-primary-fixed-dim/30 p-4 rounded-full">
                    <span className="material-symbols-outlined text-primary text-[32px]">add_a_photo</span>
                  </div>
                  <div className="text-center">
                    <p className="font-label-bold text-label-bold text-on-surface">Fotoğraf ekle</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">En fazla 4 fotoğraf</p>
                  </div>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {photos.map((p, i) => (
                    <div key={i} className={`relative rounded-xl overflow-hidden bg-surface-container-highest ${i === 0 && photos.length === 1 ? "col-span-2 aspect-video" : "aspect-square"}`}>
                      <img src={p.url} alt={`Fotoğraf ${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-2 left-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full font-bold">
                          Ana
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  ))}
                  {photos.length < 4 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-outline-variant/50 bg-surface-container-high flex flex-col items-center justify-center gap-1 active:bg-surface-container-highest transition-colors"
                    >
                      <span className="material-symbols-outlined text-primary text-[28px]">add_photo_alternate</span>
                      <p className="font-label-sm text-label-sm text-on-surface-variant text-xs">Ekle</p>
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Form Fields */}
          <div className="space-y-lg">
            {/* Title */}
            <div className="space-y-xs">
              <label className="font-label-bold text-label-bold text-on-surface-variant px-1" htmlFor="service-title">
                Hizmet Başlığı
              </label>
              <input
                id="service-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Tez Düzenleme & Formatlama"
                className="w-full h-14 px-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Category */}
            <div className="space-y-xs">
              <label className="font-label-bold text-label-bold text-on-surface-variant px-1" htmlFor="service-category">
                Kategori
              </label>
              <div className="relative">
                <select
                  id="service-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-14 px-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 font-body-md text-body-md text-on-surface appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                >
                  <option value="" disabled>Kategori seçin</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                  expand_more
                </span>
              </div>
            </div>

            {/* Price & Unit */}
            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-xs">
                <label className="font-label-bold text-label-bold text-on-surface-variant px-1" htmlFor="service-price">
                  Fiyat (₺)
                </label>
                <input
                  id="service-price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className="w-full h-14 px-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-xs">
                <label className="font-label-bold text-label-bold text-on-surface-variant px-1" htmlFor="service-unit">
                  Birim
                </label>
                <div className="relative">
                  <select
                    id="service-unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full h-14 px-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 font-body-md text-body-md text-on-surface appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  >
                    {UNITS.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-xs">
              <label className="font-label-bold text-label-bold text-on-surface-variant px-1" htmlFor="service-desc">
                Hizmet Açıklaması
              </label>
              <textarea
                id="service-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Sunduğunuz hizmeti detaylıca açıklayın..."
                rows={5}
                className="w-full p-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 font-body-md text-body-md text-on-surface resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Info Banner */}
            <div className="bg-secondary-container/20 p-md rounded-xl border border-secondary-container/50 flex gap-md">
              <span className="material-symbols-outlined text-secondary fill-icon flex-shrink-0">info</span>
              <p className="font-label-sm text-label-sm text-on-secondary-container">
                Hizmetiniz yayınlandıktan sonra platformdaki tüm üniversite öğrencileri tarafından görülebilir olacaktır.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 w-full bg-surface-container-lowest/90 backdrop-blur-md border-t border-outline-variant/20 p-margin-mobile z-50 max-w-md">
        <button
          onClick={handlePublish}
          disabled={!title.trim() || !categoryId || !price || saving}
          className="w-full h-14 bg-primary text-on-primary rounded-xl font-label-bold text-body-md flex items-center justify-center gap-sm shadow-lg active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{saving ? "Yayınlanıyor..." : "Hizmeti Yayınla"}</span>
          <span className="material-symbols-outlined">rocket_launch</span>
        </button>
      </div>
    </div>
  );
}
