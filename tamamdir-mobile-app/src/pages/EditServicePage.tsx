import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Navigate, useLocation } from "react-router-dom";
import Toast from "../components/Toast";
import { useServices } from "../context/ServicesContext";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { mapApiService, formatPrice } from "../lib/serviceMapper";
import type { Service } from "../data/types";

type Status = "active" | "paused" | "draft";

const UNITS: { label: string; value: string }[] = [
  { label: "Saatlik", value: "hour" },
  { label: "Seans", value: "session" },
  { label: "Günlük", value: "day" },
  { label: "Adet", value: "item" },
];

export default function EditServicePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateService, refresh } = useServices();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("session");
  const [deliveryDays, setDeliveryDays] = useState("1");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("active");
  const [imagePreview, setImagePreview] = useState("");
  const [coverImageId, setCoverImageId] = useState<string | undefined>();
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("Tamamdır! Değişiklikler kaydedildi.");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadService = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setSaveError(null);
    setLoadError(null);
    try {
      const data = await api.get(`/api/services/${id}`);
      const mapped = mapApiService(data);
      setService(mapped);
      setTitle(mapped.title);
      setPrice(String(mapped.priceNum));
      setPriceUnit(mapped.priceUnit);
      setDeliveryDays(String(mapped.deliveryDays));
      setDescription(mapped.description);
      setStatus(mapped.status ?? "active");
      setImagePreview(mapped.image);
      setCoverImageId(mapped.coverImageId);
      setPendingPhoto(null);
    } catch (err: unknown) {
      setService(null);
      const msg = (err as { message?: string }).message;
      setLoadError(msg || "İlan yüklenemedi. Backend çalışıyor mu?");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadService();
  }, [loadService, location.key]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface max-w-md mx-auto">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-surface max-w-md mx-auto px-6 flex flex-col items-center justify-center gap-4 text-center">
        <span className="material-symbols-outlined text-5xl text-error">error</span>
        <p className="text-on-surface font-bold">{loadError ?? "İlan bulunamadı."}</p>
        <button type="button" onClick={loadService} className="px-6 py-3 bg-primary text-white rounded-xl font-bold">
          Tekrar Dene
        </button>
        <button type="button" onClick={() => navigate("/profile/manage")} className="text-primary font-bold">
          Geri Dön
        </button>
      </div>
    );
  }

  if (!user || service.providerId !== user.id) return <Navigate to={`/services/${id}`} replace />;

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleSave() {
    const parsedPrice = Number(price);
    const parsedDelivery = parseInt(deliveryDays, 10);

    if (!title.trim()) {
      setSaveError("İlan başlığı zorunludur.");
      return;
    }
    if (!parsedPrice || parsedPrice < 1) {
      setSaveError("Geçerli bir fiyat girin.");
      return;
    }
    if (!parsedDelivery || parsedDelivery < 1) {
      setSaveError("Teslim süresi en az 1 gün olmalı.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const updated = await api.patch(`/api/services/${id}`, {
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        price_unit: priceUnit,
        delivery_days: parsedDelivery,
        is_active: status === "active",
      });

      if (pendingPhoto) {
        if (coverImageId) {
          await api.del(`/api/services/${id}/images/${coverImageId}`).catch(() => {});
        }
        const formData = new FormData();
        formData.append("images", pendingPhoto);
        await api.post(`/api/services/${id}/images`, formData);
      }

      const fresh = pendingPhoto
        ? await api.get(`/api/services/${id}`)
        : updated;
      const mapped = mapApiService(fresh);
      updateService(mapped);
      await refresh();
      await refreshUser();

      setService(mapped);
      setTitle(mapped.title);
      setPrice(String(mapped.priceNum));
      setPriceUnit(mapped.priceUnit);
      setDeliveryDays(String(mapped.deliveryDays));
      setDescription(mapped.description);
      setStatus(mapped.status ?? "active");
      setImagePreview(mapped.image);
      setCoverImageId(mapped.coverImageId);
      setPendingPhoto(null);

      setToastMessage("Tamamdır! Değişiklikler kaydedildi.");
      setToastVisible(true);
      setTimeout(
        () => navigate(`/services/${id}/manage`, { state: { refresh: Date.now() } }),
        1000
      );
    } catch (err: unknown) {
      const e = err as { message?: string; data?: { errors?: { msg: string }[]; error?: string } };
      const apiErrs = e.data?.errors;
      if (Array.isArray(apiErrs) && apiErrs.length > 0) {
        setSaveError(apiErrs.map((x) => x.msg).join(" · "));
      } else {
        setSaveError(e.data?.error ?? e.message ?? "Kaydedilemedi. Backend çalışıyor mu?");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await api.del(`/api/services/${id}`);
      await refresh();
      await refreshUser();
      navigate("/profile/manage", { replace: true });
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      setSaveError(msg || "Silinemedi.");
      setShowDeleteConfirm(false);
    } finally {
      setSaving(false);
    }
  }

  const statusOptions: { key: Status; label: string }[] = [
    { key: "active", label: "Aktif" },
    { key: "paused", label: "Durdur" },
    { key: "draft", label: "Taslak" },
  ];

  return (
    <div className="bg-surface min-h-screen max-w-md mx-auto text-on-surface">
      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />

      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest shadow-sm border-b border-outline-variant/20 flex items-center h-[60px] px-margin-mobile max-w-md mx-auto">
        <div className="flex items-center gap-md min-w-0">
          <button type="button" onClick={() => navigate(-1)} className="active:scale-95 transition-transform duration-200 text-on-surface-variant shrink-0">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-md-mobile text-headline-md-mobile font-bold text-on-surface truncate">İlanı Düzenle</h1>
        </div>
      </header>

      <main className="pt-[60px] pb-32">
        <section className="relative w-full h-[240px] overflow-hidden group">
          <img src={imagePreview || service.image} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center backdrop-blur-[2px]">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-surface-container-lowest/90 backdrop-blur px-lg py-sm rounded-xl flex items-center gap-2 active:scale-95 transition-transform shadow-lg"
            >
              <span className="material-symbols-outlined text-primary">add_a_photo</span>
              <span className="font-label-bold text-label-bold text-on-surface">Fotoğraf Değiştir</span>
            </button>
            <p className="mt-xs text-white/80 font-micro text-micro uppercase tracking-wider">İlanın vitrin görseli</p>
          </div>
        </section>

        <form className="px-margin-mobile mt-xl flex flex-col gap-xl" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          {saveError && (
            <div className="bg-error/10 border border-error/30 rounded-xl px-4 py-3 text-sm text-error">{saveError}</div>
          )}

          <div className="space-y-sm">
            <span className="font-label-bold text-label-bold text-on-surface-muted ml-1">İlan Durumu</span>
            <div className="grid grid-cols-3 gap-xs bg-surface-container p-1 rounded-xl">
              {statusOptions.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatus(key)}
                  className={`font-label-sm text-label-sm py-sm rounded-lg transition-all ${
                    status === key ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {status !== "active" && (
              <p className="font-micro text-micro text-on-surface-variant ml-1">
                Durdurulan veya taslak ilanlar müşterilere görünmez.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-base">
            <label className="font-label-bold text-label-bold text-on-surface-muted ml-1" htmlFor="edit-title">İlan Başlığı</label>
            <div className="border border-outline-variant/40 rounded-xl bg-surface-container-lowest px-md py-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <input
                id="edit-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 p-0 font-body-md text-body-md text-on-surface outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-md">
            <div className="flex flex-col gap-base">
              <label className="font-label-bold text-label-bold text-on-surface-muted ml-1" htmlFor="edit-price">Başlangıç Fiyatı</label>
              <div className="border border-outline-variant/40 rounded-xl bg-surface-container-lowest px-md py-sm flex items-center gap-xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                <span className="font-label-bold text-on-surface-variant">₺</span>
                <input
                  id="edit-price"
                  type="number"
                  min={1}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 p-0 font-body-md text-body-md text-on-surface outline-none"
                />
              </div>
            </div>
            <div className="flex flex-col gap-base">
              <label className="font-label-bold text-label-bold text-on-surface-muted ml-1" htmlFor="edit-delivery">Teslim (gün)</label>
              <div className="border border-outline-variant/40 rounded-xl bg-surface-container-lowest px-md py-sm flex items-center gap-xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                <input
                  id="edit-delivery"
                  type="number"
                  min={1}
                  max={90}
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 p-0 font-body-md text-body-md text-on-surface outline-none"
                />
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">schedule</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-base">
            <label className="font-label-bold text-label-bold text-on-surface-muted ml-1" htmlFor="edit-unit">Fiyat Birimi</label>
            <select
              id="edit-unit"
              value={priceUnit}
              onChange={(e) => setPriceUnit(e.target.value)}
              className="border border-outline-variant/40 rounded-xl bg-surface-container-lowest px-md py-3 font-body-md text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            >
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
            <p className="font-micro text-micro text-on-surface-variant ml-1">
              Önizleme: {formatPrice(Number(price) || service.priceNum, priceUnit)}
            </p>
          </div>

          <div className="flex flex-col gap-base">
            <label className="font-label-bold text-label-bold text-on-surface-muted ml-1">Kategori</label>
            <div className="px-md py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-on-surface-variant font-body-md">
              {service.category}
            </div>
          </div>

          <div className="flex flex-col gap-base">
            <label className="font-label-bold text-label-bold text-on-surface-muted ml-1" htmlFor="edit-description">Hizmet Açıklaması</label>
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

          <div className="mt-lg p-lg border border-outline-variant/20 rounded-2xl bg-surface-container-low flex flex-col gap-md">
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
                  <button type="button" onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-sm rounded-xl border border-outline-variant font-label-bold text-on-surface-variant">
                    Vazgeç
                  </button>
                  <button type="button" onClick={handleDelete} disabled={saving} className="flex-1 py-sm rounded-xl bg-error text-white font-label-bold disabled:opacity-60">
                    Sil
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/10 px-margin-mobile pt-3 pb-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary text-on-primary py-4 rounded-2xl font-label-bold text-base shadow-btn-primary active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? (
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
          ) : (
            <>
              <span className="material-symbols-outlined">save</span>
              Değişiklikleri Kaydet
            </>
          )}
        </button>
      </div>
    </div>
  );
}
