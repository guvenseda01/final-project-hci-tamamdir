import { ArrowRight, CheckCircle2, Globe, Smartphone, Sparkles } from 'lucide-react'
import { WEB_APP_URL, MOBILE_APP_URL } from '../config/links'

export default function Hero() {
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-brand-950 pt-16">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.25),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(6,95,70,0.4),_transparent_55%)]" />
      <div
        className="absolute inset-0 opacity-20 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80')" }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-800/60 border border-brand-600/30 text-emerald-200 text-xs font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            İYTE Gülbahçe Kampüsü
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            Kampüste ihtiyacın olan hizmet,{' '}
            <span className="text-gradient from-emerald-300 to-brand-400">bir tık uzağında.</span>
          </h1>
          <p className="text-lg text-emerald-100/80 max-w-xl mb-8 leading-relaxed">
            Tamamdır, öğrencilerin birbirine ders, spor, tasarım ve el yapımı ürünler sunabildiği
            güvenilir kampüs pazaryeridir. Web veya mobil — sen nasıl istersen.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <a href={WEB_APP_URL} className="btn-primary-light group">
              <Globe className="h-5 w-5" />
              Web&apos;den Başla
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a href={MOBILE_APP_URL} className="btn-outline-light group">
              <Smartphone className="h-5 w-5" />
              Mobil Uygulamayı Aç
            </a>
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-emerald-200/90">
            {['Doğrulanmış öğrenci profilleri', 'Mesajla sipariş', 'Güvenli değerlendirme'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-400 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative hidden lg:block">
          <div className="absolute -inset-4 bg-brand-500/20 blur-3xl rounded-full" />
          <div className="relative grid gap-4">
            <div className="ml-auto w-[85%] rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-5 shadow-2xl">
              <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">Popüler</p>
              <p className="text-white font-bold text-lg">Calculus Tutoring</p>
              <p className="text-emerald-100/70 text-sm mt-1">₺100/sa · Bora Tekin</p>
              <div className="mt-3 flex items-center gap-1 text-amber-300 text-sm font-semibold">★ 5.0</div>
            </div>
            <div className="w-[90%] rounded-2xl bg-white shadow-glow p-5">
              <p className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-2">Yeni mesaj</p>
              <p className="text-slate-800 font-semibold">Siparişin onaylandı!</p>
              <p className="text-slate-500 text-sm mt-1">Tennis Coaching · Yarın 14:00</p>
            </div>
            <div className="ml-8 w-[75%] rounded-2xl bg-brand-800/80 backdrop-blur border border-brand-600/30 p-4">
              <p className="text-emerald-100 text-sm">12+ aktif hizmet · 9 kategori</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
