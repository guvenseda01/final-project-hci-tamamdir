import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { CATEGORIES, CURRENT_USER } from "../data/mockData";
import { useServices } from "../context/ServicesContext";
import type { Service } from "../data/types";

const UNITS = ["Saatlik", "Proje bazlı", "Sayfa başı", "Kelime başı", "Oturum başı"];
const SERVICE_CATEGORIES = CATEGORIES.filter((c) => c !== "Tümü");

export default function AddNewServicePage() {
  const navigate = useNavigate();
  const { addService } = useServices();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState(UNITS[0]);
  const [description, setDescription] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  function handlePublish() {
    if (!title.trim() || !category || !price) return;

    const newService: Service = {
      id: `s_new_${Date.now()}`,
      title: title.trim(),
      description: description.trim() || "Yeni hizmet açıklaması.",
      price: `₺${price}/${unit === "Saatlik" ? "sa" : unit.split(" ")[0].toLowerCase()}`,
      priceNum: Number(price),
      category,
      providerId: CURRENT_USER.id,
      providerName: CURRENT_USER.name,
      providerDepartment: `${CURRENT_USER.department}, ${CURRENT_USER.year}`,
      providerAvatar: CURRENT_USER.avatar,
      providerVerified: CURRENT_USER.verified,
      rating: 0,
      reviewCount: 0,
      image: `https://picsum.photos/seed/${Date.now()}/600/400`,
      tags: [category],
      deliveryDays: 0,
      location: "Kampüs veya Online",
      status: "active",
    };

    addService(newService);
    setToastVisible(true);
    setTimeout(() => navigate(-1), 1800);
  }

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto">
      <Toast
        message="Tamamdır! Hizmet yayınlandı."
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
        <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/20">
          <img src={CURRENT_USER.avatar} alt="Profil" className="w-full h-full object-cover" />
        </div>
      </header>

      <main className="pt-[60px] pb-32 px-margin-mobile">
        <div className="pt-xl space-y-xl">
          {/* Image Upload Placeholder */}
          <section>
            <div className="aspect-video w-full rounded-xl bg-surface-container-high border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center gap-sm overflow-hidden active:bg-surface-container-highest transition-colors cursor-pointer">
              <div className="bg-primary-fixed-dim/30 p-4 rounded-full">
                <span className="material-symbols-outlined text-primary text-[32px]">add_a_photo</span>
              </div>
              <div className="text-center">
                <p className="font-label-bold text-label-bold text-on-surface">Hizmet fotoğrafı ekle</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Cihazından yükle</p>
              </div>
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
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-14 px-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 font-body-md text-body-md text-on-surface appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                >
                  <option value="" disabled>Kategori seçin</option>
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
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
                      <option key={u} value={u}>{u}</option>
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
          disabled={!title.trim() || !category || !price}
          className="w-full h-14 bg-primary text-on-primary rounded-xl font-label-bold text-body-md flex items-center justify-center gap-sm shadow-lg active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Hizmeti Yayınla</span>
          <span className="material-symbols-outlined">rocket_launch</span>
        </button>
      </div>
    </div>
  );
}
