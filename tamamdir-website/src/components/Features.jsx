import { Shield, MessageCircle, Star, Zap, Users, Wallet } from 'lucide-react'

const FEATURES = [
  {
    icon: Shield,
    title: 'Kampüs güveni',
    desc: 'İYTE e-postası ile doğrulanmış öğrenci profilleri; kiminle çalıştığını bilirsin.',
  },
  {
    icon: MessageCircle,
    title: 'Mesajla anlaş',
    desc: 'Doğrudan mesajlaş, sipariş ver, sağlayıcı siparişi onaylasın — net iletişim.',
  },
  {
    icon: Star,
    title: 'Gerçek değerlendirmeler',
    desc: 'Tamamlanan hizmetler sonrası puan ve yorum; kaliteli sağlayıcılar öne çıkar.',
  },
  {
    icon: Zap,
    title: 'Hızlı keşif',
    desc: 'Kategorilere göre filtrele, ilgi alanlarına göre önerileri gör, anında bul.',
  },
  {
    icon: Users,
    title: 'Öğrenciden öğrenciye',
    desc: 'Ders, spor, tasarım, el işi — kampüste zaten var olan yetenekler bir arada.',
  },
  {
    icon: Wallet,
    title: 'Şeffaf fiyat',
    desc: 'Her ilanda net fiyat ve birim; sürpriz yok, karar vermek kolay.',
  },
]

export default function Features() {
  return (
    <section id="ozellikler" className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-brand-600 font-bold text-sm uppercase tracking-widest mb-3">Neden Tamamdır?</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Kampüs hayatını kolaylaştıran özellikler
          </h2>
          <p className="text-slate-600 text-lg">
            Sadece ilan sitesi değil — mesaj, sipariş, geçmiş ve profil yönetimi tek platformda.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group p-6 rounded-2xl bg-white border border-slate-100 shadow-soft hover:shadow-glow hover:border-brand-200 transition-all duration-300"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-slate-600 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
