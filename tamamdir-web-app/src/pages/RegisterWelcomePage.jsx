import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export default function RegisterWelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <div className="hidden lg:flex lg:w-1/2 bg-green-primary relative overflow-hidden">
          <div className="absolute top-12 left-12 z-10 flex items-center gap-2">
            <CheckCircle2 className="w-7 h-7 text-white" strokeWidth={2.5} />
            <span className="text-2xl font-bold text-white tracking-tight">Tamamdır!</span>
          </div>

          <div className="relative z-10 flex flex-1 flex-col justify-center px-12">
            <div className="w-16 h-16 bg-white/15 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-9 h-9 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              You&apos;re all set.
            </h2>
            <p className="text-green-light max-w-md">
              Your email is verified. Jump in and explore campus services with your peers.
            </p>
          </div>

          <div className="absolute bottom-12 left-12 z-10 text-xs text-green-light">
            © 2024 Tamamdır University Services. All rights reserved.
          </div>

          <div className="absolute -top-20 -right-20 w-80 h-80 bg-green-medium rounded-full opacity-20" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-green-dark rounded-full opacity-30" />
        </div>

        <div className="flex-1 flex flex-col justify-center items-center px-8 sm:px-16 py-12">
          <div className="w-full max-w-md text-center">
            <div className="flex lg:hidden items-center justify-center gap-2 mb-10">
              <CheckCircle2 className="w-6 h-6 text-green-primary" />
              <span className="text-xl font-bold text-green-primary">Tamamdır!</span>
            </div>

            <div className="w-16 h-16 bg-green-pale rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-9 h-9 text-green-primary" strokeWidth={2.5} />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Welcome to Tamamdır!
            </h1>
            <p className="text-lg text-gray-500 mb-8">
              Let&apos;s get started
            </p>

            <button
              type="button"
              onClick={() => navigate('/home')}
              className="btn-primary w-full justify-center py-3.5 text-base mx-auto"
            >
              Go to Tamamdır
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
