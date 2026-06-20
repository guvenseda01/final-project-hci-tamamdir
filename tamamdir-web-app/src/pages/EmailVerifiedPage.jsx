import { Link } from 'react-router-dom'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export default function EmailVerifiedPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        {/* Left green panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-green-primary flex-col justify-center p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-lg">
            <div className="flex items-center gap-2 mb-12">
              <CheckCircle2 className="w-7 h-7 text-white" strokeWidth={2.5} />
              <span className="text-2xl font-bold text-white tracking-tight">Tamamdır!</span>
            </div>

            <h2 className="text-4xl font-bold text-white leading-tight mb-6">
              Your email is verified!
            </h2>
            <p className="text-green-light text-lg mb-8">
              You're all set to start using Tamamdır. Access your account, browse services, and connect with fellow IYTE students.
            </p>

            <div className="space-y-4">
              {[
                'Browse verified campus services',
                'Connect with peer providers',
                'Complete your profile',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-light rounded-full" />
                  <p className="text-green-light">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute -top-20 -right-20 w-80 h-80 bg-green-medium rounded-full opacity-20" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-green-dark rounded-full opacity-30" />
        </div>

        {/* Right content panel */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-20 py-12">
          <div className="w-full max-w-md mx-auto">
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-2 mb-10">
              <CheckCircle2 className="w-6 h-6 text-green-primary" strokeWidth={2.5} />
              <span className="text-xl font-bold text-green-primary">Tamamdır!</span>
            </div>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-pale rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-primary" strokeWidth={2} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Verified!</h1>
              <p className="text-gray-500">Your email address has been successfully verified.</p>
            </div>

            <div className="bg-green-pale border border-green-primary/20 rounded-lg p-6 mb-8">
              <p className="text-sm text-gray-700">
                You can now access all features of Tamamdır and connect with other IYTE students. Your account is fully activated and ready to use.
              </p>
            </div>

            <Link to="/login" className="btn-primary w-full justify-center py-3 text-base mb-4">
              <CheckCircle2 className="w-4 h-4" />
              Go to Login
            </Link>

            <div className="relative flex items-center mb-6">
              <div className="flex-1 border-t border-gray-200" />
              <span className="mx-4 text-xs text-gray-400">or</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            <p className="text-center text-sm">
              <span className="text-gray-600">Ready to explore? </span>
              <Link to="/login" className="text-green-primary font-semibold hover:underline flex items-center justify-center gap-2">
                Login now <ArrowRight className="w-4 h-4" />
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-8 sm:px-16">
        <div className="max-w-7xl mx-auto text-xs text-gray-400 text-center">
          © 2024 Tamamdır University Services. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
