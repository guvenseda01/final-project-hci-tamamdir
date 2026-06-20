import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification } = useAuth();

  const email = (location.state as { email?: string } | null)?.email ?? "";
  const expiresInMinutes =
    (location.state as { expiresInMinutes?: number } | null)?.expiresInMinutes ?? 15;

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) navigate("/signup", { replace: true });
  }, [email, navigate]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      setError("6 haneli doğrulama kodunu girin.");
      return;
    }
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await verifyEmail(email, code);
      const done = localStorage.getItem("onboarding_done");
      navigate(done ? "/" : "/onboarding", { replace: true });
    } catch (err: unknown) {
      const e = err as { message?: string; data?: { errors?: { msg: string }[] } };
      const apiErrors = e.data?.errors;
      setError(apiErrors?.[0]?.msg ?? e.message ?? "Doğrulama başarısız.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError("");
    setSuccess("");
    setResending(true);
    try {
      await resendVerification(email);
      setSuccess("Yeni doğrulama kodu e-postanıza gönderildi.");
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      setError(msg || "Kod gönderilemedi.");
    } finally {
      setResending(false);
    }
  }

  if (!email) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center max-w-md mx-auto">
      <header className="w-full sticky top-0 z-40 bg-background flex items-center gap-4 px-margin-mobile h-16">
        <button
          type="button"
          onClick={() => navigate("/signup")}
          className="text-primary active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[28px]">arrow_back</span>
        </button>
        <h1 className="font-bold text-2xl text-primary tracking-tight">Tamamdır</h1>
      </header>

      <main className="w-full px-margin-mobile py-lg flex flex-col gap-xl flex-grow pb-10">
        <div className="text-center pt-2">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined fill-icon text-primary text-3xl">mark_email_read</span>
          </div>
          <h2 className="font-bold text-2xl text-on-surface">E-postanı Doğrula</h2>
          <p className="text-on-surface-variant text-sm mt-2 px-2">
            <span className="font-medium text-on-surface">{email}</span> adresine 6 haneli bir kod gönderdik.
            Kod {expiresInMinutes} dakika içinde geçerliliğini yitirir.
          </p>
        </div>

        <form onSubmit={handleVerify} className="flex flex-col gap-gutter">
          <div className="flex flex-col gap-base">
            <label className="font-bold text-label-bold text-on-surface-variant px-1" htmlFor="code">
              Doğrulama Kodu
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full h-14 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-2xl text-center tracking-[0.4em] font-mono"
              autoComplete="one-time-code"
            />
          </div>

          {error && (
            <div className="bg-error/10 border border-error/30 rounded-xl px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 text-sm text-primary">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || code.length !== 6}
            className="w-full h-14 bg-primary text-on-primary rounded-xl font-bold text-lg flex items-center justify-center gap-xs shadow-btn-primary hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 mt-2"
          >
            {submitting ? (
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
              <>
                <span>Doğrula</span>
                <span className="material-symbols-outlined fill-icon">verified</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center space-y-3">
          <p className="text-sm text-on-surface-variant">
            Kod gelmedi mi?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-primary font-bold hover:underline disabled:opacity-60"
            >
              {resending ? "Gönderiliyor…" : "Tekrar gönder"}
            </button>
          </p>
          <p className="text-sm text-on-surface-variant">
            Yanlış e-posta mı?{" "}
            <Link to="/signup" className="text-primary font-bold hover:underline">
              Tekrar kayıt ol
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
