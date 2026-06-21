import { Globe, Smartphone, Monitor, ArrowUpRight } from 'lucide-react'
import { WEB_APP_URL, MOBILE_APP_URL } from '../config/links'

const APPS = [
  {
    id: 'web',
    icon: Monitor,
    title: 'Web Uygulaması',
    desc: 'Masaüstü ve tablet için tam marketplace deneyimi. Geniş ekranda hizmetleri keşfet, mesajlaş ve profilini yönet.',
    href: WEB_APP_URL,
    cta: 'Web\'e Git',
    accent: 'from-brand-600 to-emerald-500',
    features: ['Geniş marketplace görünümü', 'Profil & hizmet yönetimi', 'Bildirimler & mesajlar'],
  },
  {
    id: 'mobile',
    icon: Smartphone,
    title: 'Mobil Uygulama',
    desc: 'Kampüste hareket halindeyken kullan. Hızlı arama, favoriler, sipariş geçmişi ve kişiselleştirme — cebinde.',
    href: MOBILE_APP_URL,
    cta: 'Mobil\'i Aç',
    accent: 'from-emerald-600 to-teal-500',
    features: ['Mobil-first arayüz', 'Favoriler & geçmiş', 'Tema, dil & erişilebilirlik'],
  },
]

export default function AppPlatforms() {
  return (
    <section id="uygulamalar" className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-brand-600 font-bold text-sm uppercase tracking-widest mb-3">Uygulamalar</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Web veya mobil — sen seç
          </h2>
          <p className="text-slate-600">
            Aynı hesap, aynı veriler. İstediğin platformdan giriş yap, kaldığın yerden devam et.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {APPS.map(({ icon: Icon, title, desc, href, cta, accent, features }) => (
            <div
              key={title}
              className="relative overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-soft p-8 flex flex-col"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${accent} opacity-10 rounded-full blur-2xl -mr-8 -mt-8`} />
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <Icon className="h-7 w-7" />
              </span>
              <h3 className="mt-6 text-2xl font-extrabold text-slate-900">{title}</h3>
              <p className="mt-3 text-slate-600 leading-relaxed flex-1">{desc}</p>
              <ul className="mt-6 space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <Globe className="h-4 w-4 text-brand-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={href}
                className="mt-8 inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-brand-700 text-white font-bold hover:bg-brand-800 transition-colors group"
              >
                {cta}
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
