import { useState } from 'react'
import { Menu, X, GraduationCap } from 'lucide-react'
import { NAV_LINKS, WEB_APP_URL, MOBILE_APP_URL } from '../config/links'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-brand-950/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <a href="#" className="flex items-center gap-2.5 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-glow group-hover:bg-brand-500 transition-colors">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold text-white tracking-tight">Tamamdır</span>
          </a>

          <nav className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-emerald-100/80 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-2">
            <a
              href={MOBILE_APP_URL}
              className="px-4 py-2 text-sm font-semibold text-emerald-100 hover:text-white transition-colors"
            >
              Mobil
            </a>
            <a
              href={WEB_APP_URL}
              className="px-5 py-2.5 rounded-xl bg-white text-brand-900 text-sm font-bold hover:bg-brand-50 shadow-soft transition-all hover:scale-[1.02]"
            >
              Web Uygulaması
            </a>
          </div>

          <button
            type="button"
            className="lg:hidden p-2 text-white"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menü"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/10 bg-brand-950 px-4 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-emerald-100 font-medium"
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            <a href={MOBILE_APP_URL} className="btn-outline-light text-center">Mobil Uygulama</a>
            <a href={WEB_APP_URL} className="btn-primary-light text-center">Web Uygulaması</a>
          </div>
        </div>
      )}
    </header>
  )
}
