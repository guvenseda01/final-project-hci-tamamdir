import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'Tamamdır kimler için?',
    a: 'İYTE Gülbahçe kampüsündeki öğrenciler için tasarlandı. Hizmet almak veya sunmak isteyen herkes kayıt olabilir; doğrulanmış öğrenci rozeti @iyte.edu.tr ve @std.iyte.edu.tr e-postalarıyla otomatik gelir.',
  },
  {
    q: 'Web mi mobil mi kullanmalıyım?',
    a: 'İkisi de aynı backend\'e bağlanır. Bilgisayarda web uygulaması, telefonda mobil uygulama daha rahat olabilir. Hesabın her iki tarafta da geçerlidir.',
  },
  {
    q: 'Nasıl hizmet verebilirim?',
    a: 'Giriş yaptıktan sonra profilinden "Yeni Ekle" ile ilan oluştur. Kategori, fiyat ve açıklama ekle; mesajlar üzerinden sipariş al.',
  },
  {
    q: 'Ödeme nasıl yapılıyor?',
    a: 'MVP aşamasında ödeme platform dışında, taraflar arasında gerçekleşir. Tamamdır sipariş ve iletişim sürecini kolaylaştırır.',
  },
  {
    q: 'Verilerim güvende mi?',
    a: 'Hesap bilgilerin backend\'de saklanır. Şifre hash\'lenir; güvenlik ayarlarından şifreni değiştirebilirsin.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState(0)

  return (
    <section id="sss" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-brand-600 font-bold text-sm uppercase tracking-widest mb-3">SSS</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Sık sorulan sorular</h2>
        </div>

        <div className="space-y-3">
          {FAQS.map(({ q, a }, i) => (
            <div key={q} className="rounded-2xl border border-slate-100 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
              >
                {q}
                <ChevronDown className={`h-5 w-5 text-brand-600 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-slate-600 text-sm leading-relaxed border-t border-slate-50 pt-3">
                  {a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
