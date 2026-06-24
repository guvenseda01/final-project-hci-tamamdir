import { Code, Calculator, Palette, Music, Camera, Languages, Dumbbell, HeartHandshake } from 'lucide-react'

const CATEGORIES = [
  { icon: Calculator, name: 'Calculus & Matematik', color: 'bg-blue-50 text-blue-700' },
  { icon: Code, name: 'Kodlama Dersleri', color: 'bg-violet-50 text-violet-700' },
  { icon: Palette, name: 'Grafik Tasarım', color: 'bg-pink-50 text-pink-700' },
  { icon: Music, name: 'Enstrüman Dersleri', color: 'bg-amber-50 text-amber-700' },
  { icon: Camera, name: 'Fotoğrafçılık', color: 'bg-cyan-50 text-cyan-700' },
  { icon: Languages, name: 'Dil Pratiği', color: 'bg-indigo-50 text-indigo-700' },
  { icon: Dumbbell, name: 'Spor & Koçluk', color: 'bg-lime-50 text-lime-700' },
  { icon: HeartHandshake, name: 'El Yapımı Ürünler', color: 'bg-rose-50 text-rose-700' },
]

export default function Categories() {
  return (
    <section id="kategoriler" className="py-24 bg-brand-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <p className="text-brand-400 font-bold text-sm uppercase tracking-widest mb-3">Kategoriler</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold">Kampüste aranan her şey</h2>
            <p className="mt-4 text-emerald-100/70">
              Ders desteğinden tasarıma, spordan el işine — ihtiyacın olan hizmeti bul veya kendi yeteneğini paylaş.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CATEGORIES.map(({ icon: Icon, name, color }) => (
            <div
              key={name}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-500/40 transition-all"
            >
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-3 font-semibold text-sm text-emerald-50">{name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
