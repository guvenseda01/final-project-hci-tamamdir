import { useEffect, useState } from "react";
import api from "../lib/api";

const COMMENT_MAX = 400;

interface LeaveFeedbackModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderId: string;
  isCustomer: boolean;
  revieweeName: string;
  serviceTitle?: string;
  initialRating?: number;
  initialComment?: string;
  isUpdate?: boolean;
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-0.5 active:scale-110 transition-transform"
        >
          <span
            className={`material-symbols-outlined text-3xl ${
              value >= star ? "text-tertiary fill-icon" : "text-outline-variant"
            }`}
          >
            star
          </span>
        </button>
      ))}
    </div>
  );
}

export default function LeaveFeedbackModal({
  open,
  onClose,
  onSuccess,
  orderId,
  isCustomer,
  revieweeName,
  serviceTitle,
  initialRating = 0,
  initialComment = "",
  isUpdate = false,
}: LeaveFeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setRating(initialRating ?? 0);
      setComment(initialComment ?? "");
      setError("");
    }
  }, [open, initialRating, initialComment]);

  if (!open) return null;

  async function handleSubmit() {
    if (!orderId || rating < 1) {
      setError("Lütfen yıldız puanı seç.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const endpoint = isCustomer ? "/api/reviews" : "/api/reviews/customer";
      await api.post(endpoint, {
        order_id: orderId,
        rating,
        comment: comment.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string }).message ?? "Geri bildirim gönderilemedi.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 p-4"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
          <h2 className="text-lg font-bold text-on-surface">
            {isUpdate ? "Geri bildirimi güncelle" : "Geri bildirim bırak"}
          </h2>
          <button type="button" onClick={onClose} disabled={submitting}>
            <span className="material-symbols-outlined text-outline">close</span>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="font-semibold text-on-surface">{revieweeName}</p>
            {serviceTitle && (
              <p className="text-sm text-outline truncate">{serviceTitle}</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-on-surface-variant mb-2">Puanın</p>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
              placeholder="Deneyimini kısaca yaz..."
              rows={4}
              className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary resize-none bg-surface-container-low"
            />
            <p className="text-xs text-outline mt-1">
              {comment.length}/{COMMENT_MAX}
            </p>
          </div>

          {error && (
            <p className="text-sm text-error bg-error-container/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-outline-variant/20">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 h-11 rounded-xl border border-outline-variant/30 font-bold text-sm text-on-surface-variant"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || rating < 1}
            className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-bold text-sm disabled:opacity-50"
          >
            {submitting ? "Gönderiliyor..." : isUpdate ? "Güncelle" : "Gönder"}
          </button>
        </div>
      </div>
    </div>
  );
}
