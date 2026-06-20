import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import TamamdirButton from "../components/TamamdirButton";
import Toast from "../components/Toast";
import VerificationBadge from "../components/VerificationBadge";
import { useServices } from "../context/ServicesContext";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { mapApiService } from "../lib/serviceMapper";
import type { Review, Service } from "../data/types";

export default function ServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { services } = useServices();
  const { user } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const reviews: Review[] = [];
  const moreServices = service
    ? services.filter((s) => s.providerId === service.providerId && s.id !== service.id).slice(0, 3)
    : [];

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/api/services/${id}`)
      .then((data) => setService(mapApiService(data)))
      .catch(() => setService(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;
    api.get(`/api/favorites/${id}`)
      .then((data: { favorited?: boolean }) => setFavorited(!!data?.favorited))
      .catch(() => setFavorited(false));
  }, [id, user]);

  async function toggleFavorite() {
    if (!id || !user || favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      if (favorited) {
        await api.del(`/api/favorites/${id}`);
        setFavorited(false);
      } else {
        await api.post(`/api/favorites/${id}`);
        setFavorited(true);
      }
    } catch {
      setToastMessage("Favori kaydedilemedi.");
      setToastVisible(true);
    } finally {
      setFavoriteLoading(false);
    }
  }

  async function handleTamamdir() {
    if (!service) return;
    if (user?.id === service.providerId) {
      setToastMessage("Kendi hizmetinize mesaj gönderemezsiniz.");
      setToastVisible(true);
      return;
    }
    setSendingMessage(true);
    try {
      const conv: any = await api.post("/api/messages/conversations", {
        recipient_id: service.providerId,
      });
      navigate("/messages", {
        state: {
          openConversation: {
            id: conv.id,
            participantId: service.providerId,
            participantName: service.providerName,
            participantAvatar: service.providerAvatar,
            lastMessage: "",
            lastTime: "",
            unread: false,
            messages: [],
          },
          serviceContext: {
            id: service.id,
            title: service.title,
            price: service.price,
            image: service.image,
          },
        },
      });
    } catch {
      setToastMessage("Mesaj başlatılamadı, tekrar deneyin.");
      setToastVisible(true);
    } finally {
      setSendingMessage(false);
    }
  }

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto pb-36">
      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />

      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
        </div>
      ) : !service ? (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="material-symbols-outlined text-5xl text-error">error</span>
          <p className="font-bold text-on-surface">Hizmet bulunamadı.</p>
          <button type="button" onClick={() => navigate(-1)} className="text-primary font-bold">
            Geri Dön
          </button>
        </div>
      ) : (
      <>
      {/* Glassmorphism Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 transition-all duration-300 px-4 py-3 flex justify-between items-center max-w-md mx-auto"
        style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <span className="text-xl font-extrabold text-primary">Tamamdır</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleFavorite}
            disabled={favoriteLoading || !user}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors active:scale-90 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-primary ${favorited ? "fill-icon" : ""}`}>favorite</span>
          </button>
          <button className="p-2 rounded-full hover:bg-slate-100 transition-colors active:scale-90">
            <span className="material-symbols-outlined text-primary">share</span>
          </button>
        </div>
      </header>

      <main className="mt-[60px]">
        {/* Hero Image */}
        <section className="relative w-full aspect-[4/3] bg-surface-container-highest overflow-hidden">
          <img
            src={service.image}
            alt={service.title}
            className="w-full h-full object-cover"
          />
        </section>

        {/* Main Info Card */}
        <section className="px-margin-mobile -mt-8 relative z-10">
          <div className="bg-surface-container-lowest rounded-xl p-md shadow-card border border-slate-100">
            <div className="flex justify-between items-start mb-base">
              <div className="space-y-1">
                <VerificationBadge small />
                <h1 className="font-bold text-xl text-on-surface">{service.title}</h1>
              </div>
              <div className="text-right">
                <p className="text-primary font-bold text-xl">{service.price}</p>
                <p className="text-slate-500 text-xs">Başlangıç fiyatı</p>
              </div>
            </div>

            {/* Provider */}
            <div className="flex items-center gap-md py-md border-t border-b border-slate-50 mt-md">
              <img
                src={service.providerAvatar}
                alt={service.providerName}
                className="w-10 h-10 rounded-full border-2 border-primary object-cover"
              />
              <div>
                <p className="font-bold text-sm text-on-surface">{service.providerName}</p>
                <p className="text-slate-500 text-xs">{service.providerDepartment}</p>
              </div>
              <div className="ml-auto flex flex-col items-end">
                <div className="flex items-center text-tertiary">
                  <span className="material-symbols-outlined fill-icon text-sm">star</span>
                  <span className="font-bold text-sm ml-0.5">{service.rating}</span>
                </div>
                <p className="text-slate-400 text-xs">({service.reviewCount} yorum)</p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-md">
              {service.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-surface-container rounded-full text-slate-700 text-xs font-medium border border-slate-200">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="px-margin-mobile mt-xl">
          <h2 className="font-bold text-lg mb-md text-on-surface">Hizmet Hakkında</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">{service.description}</p>
          <div className="mt-md space-y-2">
            {service.deliveryDays > 0 && (
              <div className="flex items-center gap-3 text-on-surface-variant">
                <span className="material-symbols-outlined text-primary">schedule</span>
                <span className="font-bold text-sm">{service.deliveryDays} günde teslimat</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <span className="font-bold text-sm">{service.location}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-sm mt-md">
            <div className="p-md bg-surface-container-low rounded-xl border border-outline-variant/20">
              <span className="material-symbols-outlined text-primary mb-2">timer</span>
              <p className="font-bold text-sm text-on-surface">{service.deliveryDays > 0 ? `${service.deliveryDays} Gün` : "Randevuya Göre"}</p>
              <p className="text-xs text-on-surface-variant">Ort. Teslim</p>
            </div>
            <div className="p-md bg-surface-container-low rounded-xl border border-outline-variant/20">
              <span className="material-symbols-outlined text-primary mb-2">palette</span>
              <p className="font-bold text-sm text-on-surface">Özel</p>
              <p className="text-xs text-on-surface-variant">Renk Seçimi</p>
            </div>
          </div>
        </section>

        {/* Portfolio */}
        <section className="mt-xl">
          <div className="px-margin-mobile flex justify-between items-center mb-md">
            <h2 className="font-bold text-lg text-on-surface">Portfolyo</h2>
            <button className="text-primary font-bold text-sm">Tümünü Gör</button>
          </div>
          <div className="flex gap-md overflow-x-auto px-margin-mobile no-scrollbar pb-1">
            {[`${service.id}-p1`, `${service.id}-p2`, `${service.id}-p3`].map((seed, i) => (
              <div key={i} className="min-w-[140px] aspect-square rounded-xl overflow-hidden bg-surface-container border border-slate-100 flex-shrink-0">
                <img
                  src={`https://picsum.photos/seed/${seed}/200/200`}
                  alt={`Portfolyo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Reviews */}
        <section className="px-margin-mobile mt-xl">
          <div className="flex justify-between items-center mb-md">
            <h2 className="font-bold text-lg text-on-surface">Yorumlar</h2>
            <div className="flex items-center text-primary">
              <span className="material-symbols-outlined fill-icon text-tertiary">star</span>
              <span className="font-bold text-lg ml-1">{service.rating}</span>
            </div>
          </div>
          {reviews.length > 0 ? (
            <div className="space-y-md">
              {reviews.map((r) => (
                <div key={r.id} className="p-md bg-surface-container-low rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={r.reviewerAvatar} alt={r.reviewerName} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <p className="font-bold text-sm text-on-surface">{r.reviewerName}</p>
                      <div className="flex text-tertiary">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <span key={i} className="material-symbols-outlined fill-icon text-xs">star</span>
                        ))}
                      </div>
                    </div>
                    <span className="ml-auto text-slate-400 text-xs">{r.date}</span>
                  </div>
                  <p className="text-on-surface-variant text-sm italic">"{r.comment}"</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-md bg-surface-container-low rounded-xl border border-slate-100 text-center">
              <p className="text-on-surface-variant text-sm">Henüz yorum yok. İlk sen yap!</p>
            </div>
          )}
          <button className="w-full mt-md py-3 border-2 border-primary/20 text-primary font-bold rounded-xl active:bg-primary/5 transition-colors text-sm">
            {service.reviewCount} Yorumun Tamamını Gör
          </button>
        </section>

        {/* More from provider */}
        {moreServices.length > 0 && (
          <section className="mt-xl pb-4">
            <div className="px-margin-mobile mb-md">
              <h2 className="font-bold text-lg text-on-surface">{service.providerName} tarafından daha fazlası</h2>
            </div>
            <div className="flex gap-md overflow-x-auto px-margin-mobile no-scrollbar">
              {moreServices.map((s) => (
                <div
                  key={s.id}
                  onClick={() => navigate(`/services/${s.id}`)}
                  className="min-w-[180px] bg-surface-container-lowest rounded-xl overflow-hidden border border-slate-100 shadow-card cursor-pointer"
                >
                  <div className="h-28 bg-slate-200">
                    <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm truncate">{s.title}</p>
                    <p className="text-primary font-bold text-sm">{s.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-margin-mobile z-[60] bg-white border-t border-slate-100 p-gutter pb-4 max-w-md mx-auto">
        <TamamdirButton
          label={sendingMessage ? "Açılıyor..." : "Mesaj Gönder"}
          onClick={handleTamamdir}
        />
      </div>

      <BottomNav />
      </>
      )}
    </div>
  );
}
