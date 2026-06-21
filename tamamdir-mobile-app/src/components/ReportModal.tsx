import { useState } from "react";
import api from "../lib/api";

const REASONS = [
  { value: "spam", label: "Spam veya yanıltıcı ilan" },
  { value: "inappropriate", label: "Uygunsuz içerik" },
  { value: "scam", label: "Dolandırıcılık" },
  { value: "harassment", label: "Taciz" },
  { value: "other", label: "Diğer" },
];

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetType: string;
  targetId: string;
  targetLabel?: string;
}

export default function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
  targetLabel,
}: ReportModalProps) {
  const [reason, setReason] = useState("inappropriate");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  function handleClose() {
    if (submitting) return;
    setReason("inappropriate");
    setDetails("");
    setError("");
    setSuccess(false);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/api/reports", {
        target_type: targetType,
        target_id: targetId,
        reason,
        details: details.trim() || undefined,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string }).message ?? "Şikayet gönderilemedi.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[220] flex items-end sm:items-center justify-center bg-black/40 p-4"
      onClick={() => !submitting && handleClose()}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="report-modal-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-xl">flag</span>
            <h2 id="report-modal-title" className="text-lg font-bold text-on-surface">
              Şikayet et
            </h2>
          </div>
          <button type="button" onClick={handleClose} disabled={submitting}>
            <span className="material-symbols-outlined text-outline">close</span>
          </button>
        </div>

        {success ? (
          <div className="px-5 py-6 space-y-4">
            <p className="text-sm text-on-surface-variant">
              Teşekkürler. Şikayetin alındı ve incelenecek.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="w-full h-11 rounded-xl bg-primary text-on-primary font-bold text-sm"
            >
              Kapat
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            {targetLabel && (
              <p className="text-sm text-outline">
                Şikayet edilen:{" "}
                <span className="font-medium text-on-surface">{targetLabel}</span>
              </p>
            )}

            <div>
              <label
                htmlFor="report-reason"
                className="block text-sm font-medium text-on-surface-variant mb-1.5"
              >
                Sebep
              </label>
              <select
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary bg-surface-container-low"
              >
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="report-details"
                className="block text-sm font-medium text-on-surface-variant mb-1.5"
              >
                Ek açıklama (isteğe bağlı)
              </label>
              <textarea
                id="report-details"
                value={details}
                onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
                maxLength={1000}
                rows={3}
                placeholder="Ne olduğunu kısaca anlat..."
                className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary resize-none bg-surface-container-low"
              />
            </div>

            {error && (
              <p className="text-sm text-error bg-error-container/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 h-11 rounded-xl border border-outline-variant/30 font-bold text-sm text-on-surface-variant"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-bold text-sm disabled:opacity-50"
              >
                {submitting ? "Gönderiliyor..." : "Gönder"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
