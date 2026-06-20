import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function set(k: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Ad Soyad zorunludur.";
    if (!form.email) errs.email = "E-posta zorunludur.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Geçerli bir e-posta girin.";
    if (!form.password || form.password.length < 8) errs.password = "Şifre en az 8 karakter.";
    if (!form.confirm) errs.confirm = "Şifreyi tekrar girin.";
    else if (form.password !== form.confirm) errs.confirm = "Şifreler eşleşmiyor.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setApiError(null);
    try {
      await register(form.name, form.email, form.password);
      navigate("/login");
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? "";
      if (!msg || msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
        setApiError("Sunucuya bağlanılamadı. Backend'in çalıştığından emin olun.");
      } else if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already")) {
        setApiError("Bu e-posta zaten kayıtlı.");
      } else {
        setApiError(msg || "Kayıt başarısız.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center max-w-md mx-auto">
      <header className="w-full sticky top-0 z-40 bg-background flex items-center gap-4 px-margin-mobile h-16">
        <button onClick={() => navigate(-1)} className="text-primary active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-[28px]">arrow_back</span>
        </button>
        <h1 className="font-bold text-2xl text-primary tracking-tight">Tamamdır</h1>
      </header>

      <main className="w-full px-margin-mobile py-lg flex flex-col gap-xl flex-grow pb-10">
        <div className="text-center pt-2">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-btn-primary">
            <span className="material-symbols-outlined fill-icon text-white text-3xl">school</span>
          </div>
          <h2 className="font-bold text-2xl text-on-surface">Hesap Oluştur</h2>
          <p className="text-on-surface-variant text-sm mt-1">İYTE öğrenci topluluğuna katıl</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-gutter">
          {apiError && (
            <div className="bg-error/10 border border-error/30 rounded-xl px-4 py-3 text-sm text-error">
              {apiError}
            </div>
          )}

          {/* Ad Soyad */}
          <div className="flex flex-col gap-base">
            <label className="font-bold text-label-bold text-on-surface-variant px-1" htmlFor="name">Ad Soyad</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">person</span>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={set("name")}
                className="w-full h-14 pl-12 pr-4 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
                placeholder="Adın Soyadın"
              />
            </div>
            {errors.name && <p className="text-error text-xs px-1">{errors.name}</p>}
          </div>

          {/* E-posta */}
          <div className="flex flex-col gap-base">
            <label className="font-bold text-label-bold text-on-surface-variant px-1" htmlFor="email">E-posta</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">mail</span>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={set("email")}
                className="w-full h-14 pl-12 pr-4 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
                placeholder="ornek@mail.com"
              />
            </div>
            {errors.email && <p className="text-error text-xs px-1">{errors.email}</p>}
          </div>

          {/* Şifre */}
          <div className="flex flex-col gap-base">
            <label className="font-bold text-label-bold text-on-surface-variant px-1" htmlFor="signup-password">Şifre</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock</span>
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                className="w-full h-14 pl-12 pr-12 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
                placeholder="Minimum 8 karakter"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
                <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
            {errors.password && <p className="text-error text-xs px-1">{errors.password}</p>}
          </div>

          {/* Şifre Tekrar */}
          <div className="flex flex-col gap-base">
            <label className="font-bold text-label-bold text-on-surface-variant px-1" htmlFor="signup-confirm">Şifre Tekrar</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock_reset</span>
              <input
                id="signup-confirm"
                type={showConfirm ? "text" : "password"}
                value={form.confirm}
                onChange={set("confirm")}
                className={`w-full h-14 pl-12 pr-12 rounded-xl border bg-surface-container-low focus:ring-1 outline-none transition-all text-body-md ${
                  errors.confirm
                    ? "border-error focus:border-error focus:ring-error"
                    : "border-outline-variant focus:border-primary focus:ring-primary"
                }`}
                placeholder="Şifreni tekrar gir"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
                <span className="material-symbols-outlined">{showConfirm ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
            {errors.confirm && <p className="text-error text-xs px-1">{errors.confirm}</p>}
          </div>

          <div className="bg-primary/5 rounded-xl p-3 flex items-start gap-2">
            <span className="material-symbols-outlined fill-icon text-primary text-sm mt-0.5">info</span>
            <p className="text-xs text-on-surface-variant">
              İYTE öğrenciyseniz <span className="font-bold">@std.iyte.edu.tr</span> e-postanızla kayıt olarak doğrulanmış öğrenci rozeti alabilirsiniz.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-primary text-on-primary rounded-xl font-bold text-lg flex items-center justify-center gap-xs shadow-btn-primary hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 mt-2"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
              <>
                <span>Hesap Oluştur</span>
                <span className="material-symbols-outlined fill-icon">check_circle</span>
              </>
            )}
          </button>
        </form>

        <footer className="mt-auto py-lg flex justify-center items-center gap-xs">
          <span className="text-on-surface-variant text-sm">Zaten hesabın var mı?</span>
          <Link to="/login" className="font-bold text-sm text-primary hover:underline">Giriş Yap</Link>
        </footer>
      </main>
    </div>
  );
}
