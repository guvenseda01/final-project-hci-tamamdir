import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; api?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs: { email?: string; password?: string } = {};
    if (!email) errs.email = "E-posta zorunludur.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Geçerli bir e-posta girin.";
    if (!password) errs.password = "Şifre zorunludur.";
    else if (password.length < 8) errs.password = "Şifre en az 8 karakter olmalı.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await login(email, password);
      const done = localStorage.getItem("onboarding_done");
      navigate(done ? "/" : "/onboarding");
    } catch (err: unknown) {
      const e = err as {
        message?: string;
        status?: number;
        data?: { needs_verification?: boolean; email?: string };
      };
      if (e.status === 403 && e.data?.needs_verification) {
        navigate("/verify-email", {
          state: { email: e.data.email ?? email, expiresInMinutes: 15 },
        });
        return;
      }
      const msg = e.message ?? "";
      if (!msg || msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
        setErrors({ api: "Sunucuya bağlanılamadı. Backend'in çalıştığından emin olun." });
      } else if (msg === "Invalid credentials") {
        setErrors({ api: "E-posta veya şifre hatalı." });
      } else if (msg === "Email not verified") {
        navigate("/verify-email", { state: { email, expiresInMinutes: 15 } });
      } else {
        setErrors({ api: msg || "Giriş başarısız." });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center max-w-md mx-auto">
      <header className="w-full sticky top-0 z-40 bg-background flex items-center gap-4 px-margin-mobile h-16">
        <button
          onClick={() => navigate(-1)}
          className="text-primary active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[28px]">arrow_back</span>
        </button>
        <h1 className="font-bold text-2xl text-primary tracking-tight">Tamamdır</h1>
      </header>

      <main className="w-full px-margin-mobile py-lg flex flex-col gap-xl flex-grow">
        <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-card bg-surface-container-lowest">
          <img
            src="https://picsum.photos/seed/campus-login/500/500"
            alt="Campus"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-lg">
            <div className="text-white">
              <h2 className="font-bold text-2xl leading-tight">Tekrar Hoş Geldin</h2>
              <p className="text-sm opacity-90">Kampüsün hizmet merkezi seni bekliyor.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
          {errors.api && (
            <div className="bg-error/10 border border-error/30 rounded-xl px-4 py-3 text-sm text-error">
              {errors.api}
            </div>
          )}
          <div className="flex flex-col gap-gutter">
            <div className="flex flex-col gap-base">
              <label className="font-bold text-label-bold text-on-surface-variant px-1" htmlFor="email">
                E-posta
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                  className="w-full h-14 pl-12 pr-4 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
                  placeholder="ornek@mail.com"
                />
              </div>
              {errors.email && <p className="text-error text-xs px-1">{errors.email}</p>}
            </div>

            <div className="flex flex-col gap-base">
              <div className="flex justify-between items-center px-1">
                <label className="font-bold text-label-bold text-on-surface-variant" htmlFor="password">
                  Şifre
                </label>
                <button type="button" className="text-xs text-primary hover:underline">
                  Şifremi Unuttum?
                </button>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                  className="w-full h-14 pl-12 pr-12 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {errors.password && <p className="text-error text-xs px-1">{errors.password}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-primary text-on-primary rounded-xl font-bold text-lg flex items-center justify-center gap-xs shadow-btn-primary hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
              <>
                <span>Giriş Yap</span>
                <span className="material-symbols-outlined fill-icon">check_circle</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-gutter py-xs">
            <div className="h-px bg-outline-variant flex-grow" />
            <span className="text-xs text-outline uppercase tracking-wider">veya devam et</span>
            <div className="h-px bg-outline-variant flex-grow" />
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-xs h-12 bg-surface-container-lowest border border-outline-variant rounded-xl font-bold text-sm text-on-surface hover:bg-surface-container-high transition-colors active:scale-95"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google ile Devam Et
          </button>
        </form>

        <footer className="mt-auto py-lg flex justify-center items-center gap-xs">
          <span className="text-on-surface-variant text-sm">Hesabın yok mu?</span>
          <Link to="/signup" className="font-bold text-sm text-primary hover:underline">
            Kayıt Ol
          </Link>
        </footer>
      </main>
    </div>
  );
}
