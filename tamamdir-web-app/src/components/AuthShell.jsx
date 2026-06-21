import LanguageToggle from './LanguageToggle'

export default function AuthShell({ children }) {
  return (
    <div className="relative min-h-screen">
      <div className="fixed top-5 right-4 sm:right-6 z-[60]">
        <LanguageToggle variant="auth" />
      </div>
      {children}
    </div>
  )
}
