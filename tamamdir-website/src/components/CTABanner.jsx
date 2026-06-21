import { ArrowRight, GraduationCap } from 'lucide-react'
import { WEB_APP_URL, MOBILE_APP_URL } from '../config/links'

export default function CTABanner() {
  return (
    <section className="py-20 bg-gradient-to-br from-brand-700 to-brand-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
          Kampüs pazarına katılmaya hazır mısın?
        </h2>
        <p className="text-emerald-100/80 text-lg mb-8 max-w-xl mx-auto">
          Hemen kayıt ol, hizmet keşfet veya kendi yeteneğini ilan et.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href={WEB_APP_URL} className="btn-primary-light">
            Web Uygulamasına Git
            <ArrowRight className="h-4 w-4" />
          </a>
          <a href={MOBILE_APP_URL} className="btn-outline-light">
            Mobil Uygulamayı Aç
          </a>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="bg-brand-950 border-t border-white/10 text-emerald-100/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-extrabold text-lg">
              <GraduationCap className="h-6 w-6 text-brand-400" />
              Tamamdır
            </div>
            <p className="mt-3 text-sm max-w-xs leading-relaxed">
              İYTE öğrencileri için peer-to-peer kampüs hizmet platformu.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
            <div>
              <p className="font-bold text-white mb-3">Platform</p>
              <ul className="space-y-2">
                <li><a href="#ozellikler" className="hover:text-white transition-colors">Özellikler</a></li>
                <li><a href="#nasil-calisir" className="hover:text-white transition-colors">Nasıl Çalışır</a></li>
                <li><a href="#kategoriler" className="hover:text-white transition-colors">Kategoriler</a></li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-white mb-3">Uygulamalar</p>
              <ul className="space-y-2">
                <li>
                  <a href={WEB_APP_URL} className="hover:text-white transition-colors">
                    Web App
                  </a>
                </li>
                <li>
                  <a href={MOBILE_APP_URL} className="hover:text-white transition-colors">
                    Mobil App
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-white mb-3">Destek</p>
              <ul className="space-y-2">
                <li><a href="#sss" className="hover:text-white transition-colors">SSS</a></li>
                <li><a href="#hakkimizda" className="hover:text-white transition-colors">Hakkımızda</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          <p>© {new Date().getFullYear()} Tamamdır · HCI Final Project</p>
          <p>İYTE Gülbahçe Kampüsü</p>
        </div>
      </div>
    </footer>
  )
}
