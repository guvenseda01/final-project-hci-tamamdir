import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { mapApiService } from "../lib/serviceMapper";
import { mapReviews } from "../lib/reviewMapper";
import api from "../lib/api";
import NotificationsDropdown from "../components/NotificationsDropdown";
import ProfileMenuDropdown from "../components/ProfileMenuDropdown";
import ServiceImage from "../components/ServiceImage";
import type { Review, Service } from "../data/types";

export default function ServiceOwnerViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [svc, rvs] = await Promise.all([
        api.get(`/api/services/${id}`),
        api.get(`/api/reviews/service/${id}`),
      ]);
      setService(mapApiService(svc));
      setReviews(mapReviews(rvs));
    } catch {
      setError("Hizmet yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData, (location.state as { refresh?: number } | null)?.refresh]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface max-w-md mx-auto">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  if (error || !service) return <Navigate to="/profile/manage" replace />;
  if (service.providerId !== user?.id) return <Navigate to={`/services/${id}`} replace />;

  const statusLabel: Record<string, string> = {
    active: "Aktif İlan",
    paused: "Durduruldu",
    draft: "Taslak",
  };

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen max-w-md mx-auto mb-24 overflow-x-hidden">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest border-b border-outline-variant/20 shadow-sm flex justify-between items-center h-[60px] px-margin-mobile max-w-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="material-symbols-outlined text-primary active:scale-95 transition-transform duration-200"
          >
            arrow_back
          </button>
          <h1 className="font-headline-md-mobile text-headline-md-mobile font-bold text-emerald-brand">
            Tamamdır!
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <NotificationsDropdown />
          <ProfileMenuDropdown />
        </div>
      </header>

      <main className="mt-[60px]">
        <div className="relative w-full h-[280px] overflow-hidden">
          <ServiceImage
            src={service.image}
            serviceId={service.id}
            alt={service.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-4 left-margin-mobile">
            <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full font-label-sm text-label-sm uppercase tracking-wider">
              {statusLabel[service.status ?? "active"]}
            </span>
          </div>
        </div>

        <section className="px-margin-mobile mt-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="font-headline-md text-headline-md text-on-surface">{service.title}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm border border-outline-variant/20">
                  {service.category}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-headline-md text-headline-md text-primary">{service.price}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {service.deliveryDays} gün teslim
              </p>
            </div>
          </div>
        </section>

        <section className="px-margin-mobile mt-xl">
          <div className="grid grid-cols-3 gap-sm">
            <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/20 shadow-sm flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-emerald-brand mb-1">shopping_bag</span>
              <span className="font-label-bold text-label-bold">{service.orderCount}</span>
              <span className="font-micro text-micro text-on-surface-variant uppercase">Sipariş</span>
            </div>
            <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/20 shadow-sm flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-tertiary">
                <span className="material-symbols-outlined text-[18px] fill-icon">star</span>
                <span className="font-label-bold text-label-bold">
                  {service.rating > 0 ? service.rating : "–"}
                </span>
              </div>
              <span className="font-micro text-micro text-on-surface-variant uppercase">Puan</span>
            </div>
            <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/20 shadow-sm flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-primary mb-1">rate_review</span>
              <span className="font-label-bold text-label-bold">{service.reviewCount}</span>
              <span className="font-micro text-micro text-on-surface-variant uppercase">Yorum</span>
            </div>
          </div>
        </section>

        <section className="px-margin-mobile mt-xl">
          <h3 className="font-label-bold text-label-bold mb-md uppercase tracking-widest text-on-surface-variant">
            Hizmet Açıklaması
          </h3>
          <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant/20 shadow-sm">
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {service.description || "Açıklama eklenmemiş."}
            </p>
          </div>
        </section>

        <section className="px-margin-mobile mt-xl pb-12">
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant">
              Müşteri Yorumları
            </h3>
            <span className="text-primary font-label-sm text-label-sm">{reviews.length} toplam</span>
          </div>

          {reviews.length === 0 ? (
            <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant/20 text-center">
              <span className="material-symbols-outlined text-3xl text-outline-variant">rate_review</span>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">
                Henüz yorum yok.
              </p>
            </div>
          ) : (
            <div className="space-y-md">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/20 shadow-sm"
                >
                  <div className="flex justify-between mb-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-surface-container overflow-hidden flex items-center justify-center">
                        <img
                          src={review.reviewerAvatar}
                          alt={review.reviewerName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-label-bold text-label-bold">{review.reviewerName}</p>
                        <p className="font-caption text-caption text-on-surface-muted">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex text-tertiary">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`material-symbols-outlined text-[16px] ${i < review.rating ? "fill-icon" : ""}`}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <div className="fixed bottom-0 w-full bg-surface-container-lowest border-t border-outline-variant/20 p-md flex flex-col gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50 max-w-md">
        <button
          type="button"
          onClick={() => navigate(`/services/${id}/edit`)}
          className="w-full bg-primary text-on-primary font-label-bold py-3.5 rounded-xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">edit</span>
          İlanı Düzenle
        </button>
        <button
          type="button"
          onClick={() => navigate(`/services/${id}`)}
          className="text-center font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors py-1"
        >
          Müşteri Görünümü
        </button>
      </div>
    </div>
  );
}
