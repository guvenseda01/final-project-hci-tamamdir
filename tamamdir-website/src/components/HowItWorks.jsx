import { Search, MessageSquare, CheckCircle } from 'lucide-react'

const STEPS = [
  {
    step: '01',
    icon: Search,
    title: 'Keşfet',
    desc: 'Hizmetleri kategorilere göre incele veya arama yap. İlgi alanlarına göre önerileri gör.',
  },
  {
    step: '02',
    icon: MessageSquare,
    title: 'Mesajla & sipariş ver',
    desc: 'Sağlayıcıyla konuş, detayları netleştir ve Tamamdır! ile sipariş oluştur.',
  },
  {
    step: '03',
    icon: CheckCircle,
    title: 'Tamamla & değerlendir',
    desc: 'Hizmet bitince geçmişe düşer; puan ver, kampüs topluluğuna katkı sağla.',
  },
]

export default function HowItWorks() {
  return (
    <section id="nasil-calisir" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-brand-600 font-bold text-sm uppercase tracking-widest mb-3">Nasıl çalışır?</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Üç adımda hizmet al veya sun</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-brand-200 via-brand-400 to-brand-200" />
          {STEPS.map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="relative text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-glow relative z-10">
                <Icon className="h-7 w-7" />
              </div>
              <span className="inline-block mt-4 text-xs font-bold text-brand-600 tracking-widest">{step}</span>
              <h3 className="mt-2 text-xl font-bold text-slate-900">{title}</h3>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
