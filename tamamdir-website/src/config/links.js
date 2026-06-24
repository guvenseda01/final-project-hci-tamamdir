/** Production: aynı domain altında /app ve /mobile. Subdomain kullanırsanız .env ile tam URL verin. */
function normalizePath(url, fallback) {
  const value = (url ?? fallback).trim()
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value.replace(/\/$/, '')
  }
  const path = value.startsWith('/') ? value : `/${value}`
  return path.replace(/\/$/, '') || fallback
}

/** Web app — deploy sonrası domain URL; şimdilik .env ile ayarlanır (web-app reposuna dokunulmaz) */
export const WEB_APP_URL = normalizePath(
  import.meta.env.VITE_WEB_APP_URL,
  'http://localhost:5173'
)

/** Mobil — deploy: /mobile (aynı domain) */
export const MOBILE_APP_URL = normalizePath(import.meta.env.VITE_MOBILE_APP_URL, '/mobile')

export const NAV_LINKS = [
  { href: '#ozellikler', label: 'Özellikler' },
  { href: '#nasil-calisir', label: 'Nasıl Çalışır' },
  { href: '#kategoriler', label: 'Kategoriler' },
  { href: '#uygulamalar', label: 'Uygulamalar' },
  { href: '#sss', label: 'SSS' },
  { href: '#hakkimizda', label: 'Hakkımızda' },
]
