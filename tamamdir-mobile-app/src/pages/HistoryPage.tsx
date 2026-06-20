import { useCallback, useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import NotificationsDropdown from "../components/NotificationsDropdown";
import ProfileMenuDropdown from "../components/ProfileMenuDropdown";
import BottomNav from "../components/BottomNav";
import Toast from "../components/Toast";
import type { ServiceHistory } from "../data/types";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { mapOrder, ORDER_STATUS_LABEL } from "../lib/orderMapper";

type Tab = "requested" | "provided";

export default function HistoryPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("requested");
  const [history, setHistory] = useState<ServiceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await api.get("/api/orders?role=all");
      const list = Array.isArray(data) ? data : [];
      setHistory(list.map((o) => mapOrder(o as Record<string, unknown>, user.id)));
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function submitReview(orderId: string) {
    if (submittingReview) return;
    setSubmittingReview(true);
    try {
      await api.post("/api/reviews", {
        order_id: orderId,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setToastMessage("Yorumunuz kaydedildi.");
      setToastVisible(true);
      setReviewingId(null);
      setReviewComment("");
      setReviewRating(5);
      await loadHistory();
    } catch (err: unknown) {
      const msg = (err as { message?: string; data?: { error?: string } }).data?.error
        ?? (err as { message?: string }).message
        ?? "Yorum kaydedilemedi.";
      setToastMessage(msg);
      setToastVisible(true);
    } finally {
      setSubmittingReview(false);
    }
  }

  const filtered = history.filter((h) => h.type === tab);
  const totalCompleted = history.filter((h) => h.status === "completed").length;
  const totalEarnings = history
    .filter((h) => h.type === "provided" && h.status === "completed")
    .reduce((sum, h) => sum + parseInt(h.amount.replace(/\D/g, ""), 10), 0);

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto">
      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />

      <TopBar
        rightContent={
          <div className="flex items-center gap-1">
            <NotificationsDropdown />
            <ProfileMenuDropdown />
          </div>
        }
      />

      <main className="pt-16 px-gutter pb-24 max-w-md mx-auto">
        <div className="mt-8 mb-6">
          <h1 className="font-bold text-2xl text-on-surface">Hizmet Geçmişi</h1>
          <p className="text-on-surface-variant text-sm">Tamamlanan kampüs görevlerinizi inceleyin</p>
        </div>

        <div className="grid grid-cols-2 gap-sm mb-lg">
          <div className="bg-white p-md rounded-xl shadow-card border border-slate-50">
            <div className="flex items-center gap-base mb-xs">
              <span className="material-symbols-outlined text-primary text-xl">assignment_turned_in</span>
              <span className="text-xs text-on-surface-variant">Tamamlanan</span>
            </div>
            <p className="font-bold text-2xl text-on-surface">{totalCompleted}</p>
            <p className="text-primary font-bold text-[10px]">Geçmiş hizmetler</p>
          </div>
          <div className="bg-white p-md rounded-xl shadow-card border border-slate-50">
            <div className="flex items-center gap-base mb-xs">
              <span className="material-symbols-outlined text-tertiary text-xl">payments</span>
              <span className="text-xs text-on-surface-variant">Toplam Kazanç</span>
            </div>
            <p className="font-bold text-2xl text-on-surface">₺{totalEarnings.toLocaleString("tr-TR")}</p>
            <p className="text-tertiary font-bold text-[10px]">Sağladığım hizmetler</p>
          </div>
        </div>

        <div className="sticky top-16 bg-background/80 backdrop-blur-md z-40 py-sm">
          <div className="relative flex bg-surface-container rounded-full p-1">
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-transform duration-300"
              style={{ transform: tab === "provided" ? "translateX(100%)" : "translateX(0)" }}
            />
            {(["requested", "provided"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-center z-10 font-bold text-sm transition-colors ${tab === t ? "text-primary" : "text-on-surface-variant"}`}
              >
                {t === "requested" ? "Talep Ettim" : "Sağladım"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-sm space-y-gutter">
          {loading ? (
            <div className="flex justify-center py-16">
              <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-2">history</span>
              <p className="text-on-surface-variant">Henüz kayıt yok.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const statusInfo = ORDER_STATUS_LABEL[item.status];
              const canReview = item.type === "requested" && item.status === "completed" && !item.hasReview;
              const isReviewOpen = reviewingId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-card border border-slate-50"
                >
                  <div className="p-md flex gap-gutter">
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container">
                      {item.partnerAvatar ? (
                        <img src={item.partnerAvatar} alt={item.partnerName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-outline-variant">person</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-base text-on-surface">{item.serviceTitle}</h3>
                        <span className="font-bold text-sm text-on-surface flex-shrink-0">{item.amount}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mb-xs mt-0.5">
                        {item.type === "requested" ? "Sağlayan" : "Müşteri"}: {item.partnerName}
                      </p>
                      {item.note && (
                        <p className="text-xs text-on-surface-variant mb-xs line-clamp-2 italic">
                          &ldquo;{item.note}&rdquo;
                        </p>
                      )}
                      <div className="flex items-center gap-xs flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${statusInfo.className}`}>
                          {item.status === "completed" && (
                            <span className="material-symbols-outlined fill-icon text-xs">check_circle</span>
                          )}
                          {statusInfo.text}
                        </span>
                        <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wide">
                          {item.date}
                        </span>
                        {item.hasReview && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            Yorumlandı
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {canReview && !isReviewOpen && (
                    <div className="px-md pb-md">
                      <button
                        type="button"
                        onClick={() => {
                          setReviewingId(item.id);
                          setReviewRating(5);
                          setReviewComment("");
                        }}
                        className="w-full py-2.5 rounded-xl border-2 border-primary/20 text-primary font-bold text-sm active:bg-primary/5"
                      >
                        Yorum Yap
                      </button>
                    </div>
                  )}

                  {isReviewOpen && (
                    <div className="px-md pb-md border-t border-slate-100 pt-md space-y-3">
                      <p className="font-bold text-sm text-on-surface">Hizmeti değerlendir</p>
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
                        placeholder="Deneyimini kısaca yaz (isteğe bağlı)"
                        rows={3}
                        className="w-full p-3 rounded-xl border border-outline-variant/30 text-sm resize-none outline-none focus:border-primary"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setReviewingId(null)}
                          className="flex-1 py-2.5 rounded-xl border border-outline-variant/30 font-bold text-sm text-on-surface-variant"
                        >
                          Vazgeç
                        </button>
                        <button
                          type="button"
                          onClick={() => submitReview(item.id)}
                          disabled={submittingReview}
                          className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm disabled:opacity-60"
                        >
                          {submittingReview ? "Kaydediliyor..." : "Gönder"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
