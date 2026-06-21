import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Shield, DollarSign, ThumbsUp, AlertCircle } from 'lucide-react'
import ServiceCard from '../components/ServiceCard'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

function ServiceCardSkeleton() {
  return (
    <div className="bg-amber-100 rounded-xl overflow-hidden border border-amber-200 shadow-sm animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.interests?.length) {
      setServices([])
      setLoading(false)
      return
    }

    setLoading(true)
    api.get('/api/services?sort=rating&interests=1&limit=100')
      .then(data => setServices(data.services))
      .catch(err => setError(err.message || 'Failed to load services.'))
      .finally(() => setLoading(false))
  }, [user?.interests])

  return (
    <div className="min-h-screen bg-amber-50">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero Section */}
        <section className="grid md:grid-cols-2 gap-10 items-center mb-16 w-full">
          <div>
            <div className="inline-flex items-center gap-2 bg-green-pale text-green-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              IYTE Campus Verified
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-coffee leading-tight mb-4">
              Find talent within your{' '}
              <span className="text-green-primary">campus.</span>
            </h1>
            <p className="text-gray-500 text-lg mb-8 leading-relaxed">
              Tamamdır connects IYTE students for peer-to-peer services. From calculus tutoring to tennis coaching, get things done with campus trust.
            </p>
            <Link to="/services" className="btn-primary text-base py-3 px-7 inline-flex">
              Go to marketplace
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="bg-amber-100 rounded-2xl overflow-hidden border border-amber-200 shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80"
                alt="IYTE Campus"
                className="w-full h-72 object-cover"
              />
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-coffee text-sm">Coding Lessons</p>
                  <p className="text-xs text-gray-400">by Ardıç K. • 4.9 Rating</p>
                </div>
                <div className="w-8 h-8 bg-green-primary rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Offered Services */}
        <section className="mb-16 w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-coffee">Offered Services</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                {user?.interests?.length
                  ? 'Picked for you based on your interests'
                  : 'Quality help from your classmates'}
              </p>
            </div>
            <Link
              to="/onboarding?from=profile"
              className="bg-green-primary text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md hover:bg-green-dark transition-colors whitespace-nowrap"
            >
              Update Interests
            </Link>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => <ServiceCardSkeleton key={i} />)
              : services.length > 0
                ? services.map(service => <ServiceCard key={service.id} service={service} />)
                : (
                  <div className="col-span-full text-center py-12 text-gray-400">
                    <p className="font-medium">No services in your interest categories yet.</p>
                    <p className="text-sm mt-1">Check back soon or browse all services.</p>
                  </div>
                )
            }
          </div>
        </section>

        {/* Community Section */}
        <section className="bg-amber-100/60 rounded-2xl p-10 text-center w-full">
          <h2 className="text-2xl font-bold text-coffee mb-3">Built for the IYTE Community</h2>
          <p className="text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Tamamdır isn't just a marketplace; it's a way for us to help each other succeed. Every service completed
            strengthens our campus ties and helps students earn while doing what they love.
          </p>

          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            {[
              { icon: Shield, title: 'Campus Verified', desc: 'Only users with @iyte.edu.tr emails can join.' },
              { icon: DollarSign, title: 'Fair Pricing', desc: 'Student-friendly rates for premium help.' },
              { icon: ThumbsUp, title: 'Peer Reliable', desc: 'Reviewed by your fellow classmates.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-amber-100 rounded-xl p-6 border border-amber-200 shadow-sm">
                <div className="w-10 h-10 bg-green-pale rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-5 h-5 text-green-primary" />
                </div>
                <p className="font-semibold text-coffee text-sm mb-1">{title}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
