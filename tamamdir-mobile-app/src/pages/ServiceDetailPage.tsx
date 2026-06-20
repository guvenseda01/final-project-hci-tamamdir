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
import { mapReviews } from "../lib/reviewMapper";
import type { Review, Service } from "../data/types";

function StarRow({ rating, size = "text-xs" }: { rating: number; size?: string }) {
  return (
    <div className="flex text-tertiary">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`material-symbols-outlined ${size} ${i < rating ? "fill-icon" : ""}`}>
          star
        </span>
      ))}
    </div>
  );
}

export default function ServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { services } = useServices();
  const { user } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [reviewableOrderId, setReviewableOrderId] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const moreServices = service
    ? services.filter((s) => s.providerId === service.providerId && s.id !== service.id).slice(0, 3)
    : [];

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/api/services/${id}`),
      api.get(`/api/reviews/service/${id}`),
    ])
      .then(([svc, rvs]) => {
        setService(mapApiService(svc));
        setReviews(mapReviews(rvs));
      })
      .catch(() => {
        setService(null);
        setReviews([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function reloadServiceAndReviews() {
    if (!id) return;
    const [svc, rvs] = await Promise.all([
      api.get(`/api/services/${id}`),
      api.get(`/api/reviews/service/${id}`),
    ]);
    setService(mapApiService(svc));
    setReviews(mapReviews(rvs));
  }

  useEffect(() => {
    if (!id || !user || !service) return;
    if (user.id === service.providerId) {
      setReviewableOrderId(null);
      return;
    }
    api.get("/api/orders?role=buyer&status=completed")
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const match = list.find(
          (o: { service_id?: string; review_id?: string | null }) =>
            o.service_id === id && !o.review_id
        );
        setReviewableOrderId(match?.id ? String(match.id) : null);
      })
      .catch(() => setReviewableOrderId(null));
  }, [id, user, service?.id, service?.providerId]);

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

  async function handleMessage() {
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
            providerId: service.providerId,
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

  async function submitReview() {
    if (!reviewableOrderId || submittingReview) return;
    setSubmittingReview(true);
    try {
      await api.post("/api/reviews", {
        order_id: reviewableOrderId,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setShowReviewForm(false);
      setReviewComment("");
      setReviewRating(5);
      setReviewableOrderId(null);
      await reloadServiceAndReviews();
      setToastMessage("Yorumun kaydedildi.");
      setToastVisible(true);
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string }; message?: string }).data?.error
        ?? (err as { message?: string }).message
        ?? "Yorum kaydedilemedi.";
      setToastMessage(msg);
      setToastVisible(true);
    } finally {
      setSubmittingReview(false);
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
                {service.providerVerified && <VerificationBadge small />}
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
                  <span className="font-bold text-sm ml-0.5">
                    {service.rating > 0 ? service.rating : "–"}
                  </span>
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
        <section className="px-margin-mobile mt-xl pb-4">
          <div className="flex justify-between items-center mb-md gap-2">
            <h2 className="font-bold text-lg text-on-surface">Yorumlar</h2>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center text-primary gap-1">
                <span className="material-symbols-outlined fill-icon text-tertiary text-sm">star</span>
                <span className="font-bold text-lg">
                  {service.rating > 0 ? service.rating : "–"}
                </span>
                <span className="text-slate-400 text-sm font-medium">({reviews.length})</span>
              </div>
              {reviewableOrderId && !showReviewForm && (
                <button
                  type="button"
                  onClick={() => setShowReviewForm(true)}
                  className="text-xs font-bold text-primary px-2.5 py-1.5 rounded-lg bg-primary/10 active:bg-primary/20"
                >
                  Yorum Ekle
                </button>
              )}
            </div>
          </div>

          {showReviewForm && reviewableOrderId && (
            <div className="mb-md p-md bg-surface-container-low rounded-xl border border-primary/20 space-y-3">
              <p className="font-bold text-sm text-on-surface">Deneyimini paylaş</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 active:scale-90 transition-transform"
                  >
                    <span
                      className={`material-symbols-outlined text-2xl text-tertiary ${star <= reviewRating ? "fill-icon" : ""}`}
                    >
                      star
                    </span>
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Hizmet hakkında düşüncelerini yaz..."
                rows={3}
                className="w-full p-3 rounded-xl border border-outline-variant/30 text-sm resize-none outline-none focus:border-primary bg-white"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewComment("");
                    setReviewRating(5);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-outline-variant/30 font-bold text-sm text-on-surface-variant"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={submitReview}
                  disabled={submittingReview}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm disabled:opacity-60"
                >
                  {submittingReview ? "Kaydediliyor..." : "Gönder"}
                </button>
              </div>
            </div>
          )}

          {reviews.length > 0 ? (
            <div className="space-y-md">
              {reviews.map((r) => (
                <div key={r.id} className="p-md bg-surface-container-low rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={r.reviewerAvatar} alt={r.reviewerName} className="w-8 h-8 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-on-surface">{r.reviewerName}</p>
                      <StarRow rating={r.rating} />
                    </div>
                    <span className="text-slate-400 text-xs flex-shrink-0">{r.date}</span>
                  </div>
                  {r.comment ? (
                    <p className="text-on-surface-variant text-sm leading-relaxed">{r.comment}</p>
                  ) : (
                    <p className="text-on-surface-variant text-sm italic">Yorum metni eklenmemiş.</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-md bg-surface-container-low rounded-xl border border-slate-100 text-center">
              <span className="material-symbols-outlined text-3xl text-outline-variant">rate_review</span>
              <p className="text-on-surface-variant text-sm mt-2">Henüz yorum yok.</p>
              {reviewableOrderId && !showReviewForm && (
                <button
                  type="button"
                  onClick={() => setShowReviewForm(true)}
                  className="mt-3 w-full py-2.5 rounded-xl border-2 border-primary/20 text-primary font-bold text-sm active:bg-primary/5"
                >
                  İlk yorumu sen bırak
                </button>
              )}
              {user && user.id !== service.providerId && !reviewableOrderId && (
                <p className="text-xs text-on-surface-variant mt-2">
                  Yorum bırakmak için tamamlanmış bir siparişin olmalı.
                </p>
              )}
            </div>
          )}
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

      {/* Sticky CTA — web gibi: mesajla başla, sipariş sohbette */}
      <div className="fixed bottom-0 left-0 right-0 px-margin-mobile z-[60] bg-white border-t border-slate-100 p-gutter pb-4 max-w-md mx-auto">
        <TamamdirButton
          label={sendingMessage ? "Açılıyor..." : "Mesaj Gönder"}
          onClick={handleMessage}
          disabled={sendingMessage || user?.id === service.providerId}
        />
        <p className="text-xs text-on-surface-variant text-center mt-2">
          Sohbette Tamamdır! ile sipariş verebilirsin.
        </p>
      </div>

      <BottomNav />
      </>
      )}
    </div>
  );
}
