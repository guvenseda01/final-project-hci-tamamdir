const TEAM = [
  'Ceyda Fikir',
  'Refia Müleyke Kılıç',
  'Tan Aksu',
  'Buse Toklu',
  'Seda Güven',
]

export default function About() {
  return (
    <section id="hakkimizda" className="py-24 bg-brand-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-brand-400 font-bold text-sm uppercase tracking-widest mb-3">Hakkımızda</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
            Kampüs topluluğu için, kampüs topluluğu tarafından
          </h2>
          <p className="text-emerald-100/80 leading-relaxed mb-4">
            Tamamdır, CENG318 HCI final projesi kapsamında geliştirilen bir peer-to-peer kampüs hizmet
            platformudur. Öğrencilerin ders, spor, tasarım ve el yapımı ürün gibi informal hizmetleri
            birbirine sunmasını kolaylaştırmayı hedefler.
          </p>
          <p className="text-emerald-100/80 leading-relaxed">
            Amacımız kampüste sosyal etkileşimi artırmak ve öğrencilere yerel gelir fırsatları
            yaratmaktır — güvenilir, hızlı ve öğrenci odaklı bir deneyimle.
          </p>
        </div>

        <div className="rounded-3xl bg-white/5 border border-white/10 p-8">
          <h3 className="font-bold text-lg mb-4 text-emerald-100">Proje ekibi</h3>
          <ul className="grid sm:grid-cols-2 gap-3">
            {TEAM.map((name) => (
              <li
                key={name}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-emerald-50"
              >
                {name}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-emerald-200/60">
            İzmir Yüksek Teknoloji Enstitüsü · Gülbahçe Kampüsü
          </p>
        </div>
      </div>
    </section>
  )
}
