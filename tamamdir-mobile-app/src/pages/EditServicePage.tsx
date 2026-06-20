import { useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import Toast from "../components/Toast";
import { useServices } from "../context/ServicesContext";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import type { Service } from "../data/types";

type Status = "active" | "paused" | "draft";

export default function EditServicePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { services, updateService, refresh } = useServices();
  const { user } = useAuth();

  const service = services.find((s) => s.id === id);

  const [title, setTitle] = useState(service?.title ?? "");
  const [price, setPrice] = useState(String(service?.priceNum ?? ""));
  const [delivery, setDelivery] = useState(
    service?.deliveryDays ? `${service.deliveryDays} Gün` : "0 Gün"
  );
  const [description, setDescription] = useState(service?.description ?? "");
  const [tags, setTags] = useState<string[]>(service?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<Status>((service?.status ?? "active") as Status);
  const [toastVisible, setToastVisible] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!service) return <Navigate to="/services" replace />;
  if (service.providerId !== user?.id) return <Navigate to={`/services/${id}`} replace />;

  function addTag() {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleSave() {
    const deliveryDays = parseInt(delivery) || 0;
    try {
      await api.patch(`/api/services/${id}`, {
        title: title.trim() || service!.title,
        description: description.trim() || service!.description,
        price: Number(price) || service!.priceNum,
        delivery_days: deliveryDays,
        is_active: status === "active",
      });
      await refresh();
    } catch {}
    const updated: Service = {
      ...service!,
      title: title.trim() || service!.title,
      priceNum: Number(price) || service!.priceNum,
      price: `₺${price || service!.priceNum}`,
      description: description.trim() || service!.description,
      tags,
      deliveryDays,
      status,
    };
    updateService(updated);
    setToastVisible(true);
    setTimeout(() => navigate(`/services/${id}/manage`), 1800);
  }

  const statusOptions: { key: Status; label: string }[] = [
    { key: "active", label: "Aktif" },
    { key: "paused", label: "Durdur" },
    { key: "draft", label: "Taslak" },
  ];

  return (
    <div className="bg-surface min-h-screen max-w-md mx-auto text-on-surface">
      <Toast
        message="Tamamdır! Değişiklikler kaydedildi."
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />

      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest shadow-sm border-b border-outline-variant/20 flex justify-between items-center h-[60px] px-margin-mobile max-w-md">
        <div className="flex items-center gap-md">
          <button
            onClick={() => navigate(-1)}
            className="active:scale-95 transition-transform duration-200 text-on-surface-variant"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-md-mobile text-headline-md-mobile font-bold text-on-surface">
            İlanı Düzenle
          </h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-secondary-container overflow-hidden flex items-center justify-center">
          {user?.avatar ? (
            <img src={user.avatar} alt="Profil" className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-on-secondary-container text-xl">person</span>
          )}
        </div>
      </header>

      <main className="pt-[60px] pb-32">
        {/* Hero Image */}
        <section className="relative w-full h-[240px] overflow-hidden group">
          <img
            src={service.image}
            alt={service.title}
            className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
          />
          <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center backdrop-blur-[2px]">
            <button className="bg-surface-container-lowest/90 backdrop-blur px-lg py-sm rounded-xl flex items-center gap-2 active:scale-95 transition-transform shadow-lg">
              <span className="material-symbols-outlined text-primary">add_a_photo</span>
              <span className="font-label-bold text-label-bold text-on-surface">Fotoğraf Değiştir</span>
            </button>
            <p className="mt-xs text-white/80 font-micro text-micro uppercase tracking-wider">
              İlanın vitrin görseli
            </p>
          </div>
        </section>

        {/* Form */}
        <form
          className="px-margin-mobile mt-xl flex flex-col gap-xl"
          onSubmit={(e) => { e.preventDefault(); handleSave(); }}
        >
          {/* Status Picker */}
          <div className="space-y-sm">
            <span className="font-label-bold text-label-bold text-on-surface-muted ml-1">İlan Durumu</span>
            <div className="grid grid-cols-3 gap-xs bg-surface-container p-1 rounded-xl">
              {statusOptions.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatus(key)}
                  className={`font-label-sm text-label-sm py-sm rounded-lg transition-all ${
                    status === key
                      ? "bg-emerald-brand text-white shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-base">
            <label className="font-label-bold text-label-bold text-on-surface-muted ml-1" htmlFor="edit-title">
              İlan Başlığı
            </label>
            <div className="border border-outline-variant/40 rounded-xl bg-surface-container-lowest px-md py-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <input
                id="edit-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ne sunuyorsunuz?"
                className="w-full bg-transparent border-none focus:ring-0 p-0 font-body-md text-body-md text-on-surface outline-none"
              />
            </div>
            <p className="font-micro text-micro text-on-surface-variant/60 ml-1">
              Kısa ve açıklayıcı bir başlık seçin.
            </p>
          </div>

          {/* Price & Delivery */}
          <div className="grid grid-cols-2 gap-md">
            <div className="flex flex-col gap-base">
              <label className="font-label-bold text-label-bold text-on-surface-muted ml-1" htmlFor="edit-price">
                Başlangıç Fiyatı
              </label>
              <div className="border border-outline-variant/40 rounded-xl bg-surface-container-lowest px-md py-sm flex items-center gap-xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                <span className="font-label-bold text-on-surface-variant">₺</span>
                <input
                  id="edit-price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 p-0 font-body-md text-body-md text-on-surface outline-none"
                />
              </div>
            </div>
            <div className="flex flex-col gap-base">
              <label className="font-label-bold text-label-bold text-on-surface-muted ml-1" htmlFor="edit-delivery">
                Teslim Süresi
              </label>
              <div className="border border-outline-variant/40 rounded-xl bg-surface-container-lowest px-md py-sm flex items-center gap-xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                <input
                  id="edit-delivery"
                  type="text"
                  value={delivery}
                  onChange={(e) => setDelivery(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 p-0 font-body-md text-body-md text-on-surface outline-none"
                />
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">schedule</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-base">
            <label className="font-label-bold text-label-bold text-on-surface-muted ml-1">Etiketler</label>
            <div className="flex flex-wrap gap-xs mb-xs">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="bg-secondary-container text-on-secondary-container px-sm py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <span className="material-symbols-outlined text-[14px] cursor-pointer">close</span>
                  </button>
                </div>
              ))}
            </div>
            <div className="border border-outline-variant/40 rounded-xl bg-surface-container-lowest px-md py-sm transition-all flex items-center gap-xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Yeni etiket ekle..."
                className="w-full bg-transparent border-none focus:ring-0 p-0 font-body-md text-body-md text-on-surface outline-none"
              />
              <button type="button" onClick={addTag} className="text-primary font-label-bold">
                Ekle
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-base">
            <label className="font-label-bold text-label-bold text-on-surface-muted ml-1" htmlFor="edit-description">
              Hizmet Açıklaması
            </label>
            <div className="border border-outline-variant/40 rounded-xl bg-surface-container-lowest px-md py-sm transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
              <textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full bg-transparent border-none focus:ring-0 p-0 font-body-md text-body-md text-on-surface resize-none outline-none"
              />
            </div>
          </div>

          {/* Help & Delete */}
          <div className="mt-lg p-lg border border-outline-variant/20 rounded-2xl bg-surface-container-low flex flex-col gap-md">
            <div className="flex items-center gap-md">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">help_outline</span>
              </div>
              <div className="flex-1">
                <p className="font-label-bold text-label-bold">Daha fazla yardıma mı ihtiyacınız var?</p>
                <p className="font-caption text-caption text-on-surface-variant">
                  Hizmet rehberimizi inceleyin veya destek ekibine yazın.
                </p>
              </div>
            </div>
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-error font-label-bold text-left px-1 flex items-center gap-2 active:opacity-70"
              >
                <span className="material-symbols-outlined text-[20px]">delete_outline</span>
                İlanı Kalıcı Olarak Sil
              </button>
            ) : (
              <div className="space-y-sm">
                <p className="font-label-sm text-label-sm text-error">Bu ilanı silmek istediğinize emin misiniz?</p>
                <div className="flex gap-sm">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-sm rounded-xl border border-outline-variant font-label-bold text-on-surface-variant active:bg-surface-container transition-colors"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      api.del(`/api/services/${id}`).catch(() => {});
                      navigate("/profile/manage");
                    }}
                    className="flex-1 py-sm rounded-xl bg-error text-white font-label-bold active:opacity-80 transition-opacity"
                  >
                    Sil
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </main>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 w-full bg-surface-container-lowest/80 backdrop-blur-xl border-t border-outline-variant/10 px-margin-mobile pt-md pb-gutter z-50 max-w-md">
        <button
          onClick={handleSave}
          className="w-full bg-emerald-brand text-white py-md rounded-2xl font-label-bold text-[16px] shadow-lg shadow-emerald-brand/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">save</span>
          Değişiklikleri Kaydet
        </button>
      </div>
    </div>
  );
}
