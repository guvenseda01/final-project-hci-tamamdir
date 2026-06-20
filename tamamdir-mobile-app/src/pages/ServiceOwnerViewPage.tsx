import { useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { CURRENT_USER, REVIEWS } from "../data/mockData";
import { useServices } from "../context/ServicesContext";

export default function ServiceOwnerViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { services } = useServices();

  const service = services.find((s) => s.id === id);
  const reviews = REVIEWS.filter((r) => r.id && r.serviceId === id);

  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [submittedReplies, setSubmittedReplies] = useState<Record<string, string>>({});

  if (!service) return <Navigate to="/services" replace />;
  if (service.providerId !== CURRENT_USER.id) return <Navigate to={`/services/${id}`} replace />;

  function submitReply(reviewId: string) {
    const text = replyInputs[reviewId]?.trim();
    if (!text) return;
    setSubmittedReplies((prev) => ({ ...prev, [reviewId]: text }));
    setReplyInputs((prev) => ({ ...prev, [reviewId]: "" }));
  }

  const statusLabel: Record<string, string> = {
    active: "Active Service",
    paused: "Paused",
    draft: "Draft",
  };

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen max-w-md mx-auto mb-24 overflow-x-hidden">
      {/* Top AppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest border-b border-outline-variant/20 shadow-sm flex justify-between items-center h-[60px] px-margin-mobile max-w-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="material-symbols-outlined text-primary active:scale-95 transition-transform duration-200"
          >
            arrow_back
          </button>
          <h1 className="font-headline-md-mobile text-headline-md-mobile font-bold text-emerald-brand">
            Tamamdır!
          </h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border border-outline-variant/30">
          <img src={CURRENT_USER.avatar} alt="Owner Profile" className="w-full h-full object-cover" />
        </div>
      </header>

      <main className="mt-[60px]">
        {/* Hero Service Image */}
        <div className="relative w-full h-[280px] overflow-hidden">
          <img
            src={service.image}
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

        {/* Service Info */}
        <section className="px-margin-mobile mt-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="font-headline-md text-headline-md text-on-surface">{service.title}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {service.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm border border-outline-variant/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-headline-md text-headline-md text-primary">{service.price}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">per session</p>
            </div>
          </div>
        </section>

        {/* Stats Bento */}
        <section className="px-margin-mobile mt-xl">
          <div className="grid grid-cols-3 gap-sm">
            <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/20 shadow-sm flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-primary mb-1">visibility</span>
              <span className="font-label-bold text-label-bold">1,240</span>
              <span className="font-micro text-micro text-on-surface-variant uppercase">Views</span>
            </div>
            <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/20 shadow-sm flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-emerald-brand mb-1">shopping_bag</span>
              <span className="font-label-bold text-label-bold">{service.reviewCount}</span>
              <span className="font-micro text-micro text-on-surface-variant uppercase">Orders</span>
            </div>
            <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/20 shadow-sm flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-tertiary">
                <span className="material-symbols-outlined text-[18px] fill-icon">star</span>
                <span className="font-label-bold text-label-bold">
                  {service.rating > 0 ? service.rating : "–"}
                </span>
              </div>
              <span className="font-micro text-micro text-on-surface-variant uppercase">Rating</span>
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="px-margin-mobile mt-xl">
          <h3 className="font-label-bold text-label-bold mb-md uppercase tracking-widest text-on-surface-variant">
            Service Description
          </h3>
          <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant/20 shadow-sm">
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {service.description}
            </p>
          </div>
        </section>

        {/* Reviews */}
        <section className="px-margin-mobile mt-xl pb-12">
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant">
              Customer Reviews
            </h3>
            <span className="text-primary font-label-sm text-label-sm">{reviews.length} total</span>
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

                  <p className="font-body-md text-body-md text-on-surface-variant mb-md">
                    {review.comment}
                  </p>

                  {/* Reply section */}
                  <div className="border-t border-outline-variant/10 pt-md">
                    {submittedReplies[review.id] ? (
                      <div className="bg-surface-container-low p-sm rounded-lg border-l-4 border-primary">
                        <p className="font-label-sm text-label-sm font-bold text-primary mb-1">
                          {CURRENT_USER.name} (Sen)
                        </p>
                        <p className="font-body-md text-body-md text-on-surface-variant">
                          {submittedReplies[review.id]}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-primary-fixed">
                            <img
                              src={CURRENT_USER.avatar}
                              alt={CURRENT_USER.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="font-label-sm text-label-sm font-bold text-primary">
                            Your Reply
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={replyInputs[review.id] ?? ""}
                            onChange={(e) =>
                              setReplyInputs((prev) => ({ ...prev, [review.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") submitReply(review.id);
                            }}
                            placeholder="Type your reply..."
                            className="w-full bg-surface-container-low rounded-lg font-body-md text-body-md focus:ring-1 focus:ring-primary/30 px-3 py-2 pr-10 border-none outline-none"
                          />
                          <button
                            onClick={() => submitReply(review.id)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-[20px]"
                          >
                            send
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 w-full bg-surface-container-lowest border-t border-outline-variant/20 p-md flex flex-col gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50 max-w-md">
        <button
          onClick={() => navigate(`/services/${id}/edit`)}
          className="w-full bg-primary text-on-primary font-label-bold py-3.5 rounded-xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">edit</span>
          Edit Service
        </button>
        <button
          onClick={() => navigate(`/services/${id}`)}
          className="text-center font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors py-1"
        >
          Preview as Customer
        </button>
      </div>
    </div>
  );
}
