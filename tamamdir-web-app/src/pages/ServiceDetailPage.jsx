import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Star, CheckCircle2, Clock, ArrowLeft, ChevronRight, AlertCircle, Loader2, MessageCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import ServiceCard from '../components/ServiceCard'
import api from '../lib/api'
import { formatPrice, formatDelivery } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-80 bg-gray-200 rounded-2xl mb-6" />
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
        <div className="h-72 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  )
}

export default function ServiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [service, setService] = useState(null)
  const [reviews, setReviews] = useState([])
  const [moreServices, setMoreServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    Promise.all([
      api.get(`/api/services/${id}`),
      api.get(`/api/reviews/service/${id}`),
    ])
      .then(([svc, rvs]) => {
        if (cancelled) return
        setService(svc)
        setReviews(rvs)
        // Fetch provider's other services
        return api.get(`/api/users/${svc.provider_id}/services`)
          .then(list => {
            if (!cancelled) setMoreServices(list.filter(s => s.id !== id).slice(0, 3))
          })
          .catch(() => {})
      })
      .catch(err => {
        if (!cancelled) setError(err.status === 404 ? 'Service not found.' : (err.message || 'Failed to load service.'))
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [id])

  const handleSendMessage = async () => {
    if (!service) return
    const serviceQuery = `service=${id}`

    // Provider viewing own service — cannot message self; open messages with service context
    if (user?.id === service.provider_id) {
      try {
        const [convs, orders] = await Promise.all([
          api.get('/api/messages/conversations'),
          api.get('/api/orders?role=provider&status=pending').catch(() => []),
        ])
        const serviceOrder = orders.find(o => o.service_id === id)
        if (serviceOrder) {
          const conv = await api.post('/api/messages/conversations', {
            recipient_id: serviceOrder.buyer_id,
            service_id: id,
          })
          navigate(`/messages?conv=${conv.id}&${serviceQuery}`)
          return
        }
        if (convs.length === 1) {
          const conv = await api.post('/api/messages/conversations', {
            recipient_id: convs[0].other_id,
            service_id: id,
          })
          navigate(`/messages?conv=${conv.id}&${serviceQuery}`)
          return
        }
        navigate(`/messages?${serviceQuery}`)
      } catch {
        navigate(`/messages?${serviceQuery}`)
      }
      return
    }

    try {
      const conv = await api.post('/api/messages/conversations', {
        recipient_id: service.provider_id,
        service_id: id,
      })
      navigate(`/messages?conv=${conv.id}&${serviceQuery}`)
    } catch {
      navigate(`/messages?${serviceQuery}`)
    }
  }

  const isOwnService = user?.id === service?.provider_id

  const coverImage = service?.images?.find(i => i.is_cover)?.image_url
    ?? service?.images?.[0]?.image_url
    ?? null

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <DetailSkeleton />
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold text-lg mb-2">{error}</p>
          <button onClick={() => navigate('/services')} className="btn-primary mt-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Services
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/home" className="hover:text-gray-600">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/services" className="hover:text-gray-600">Services</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-700 font-medium">{service.title}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left — main content */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden mb-6 shadow-sm border border-gray-100 bg-gray-100 h-80">
              {coverImage ? (
                <img src={coverImage} alt={service.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-400 to-teal-500" />
              )}
            </div>

            {/* Category tag */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                {service.category_name}
              </span>
              {service.provider_verified === 1 && (
                <span className="text-xs font-medium bg-green-pale text-green-primary px-3 py-1 rounded-full">
                  Verified Provider
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">{service.title}</h1>

            <div className="flex items-center gap-4 mb-6">
              {service.review_count > 0 ? (
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(service.rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-200 fill-gray-200'
                      }`}
                    />
                  ))}
                  <span className="text-sm font-semibold text-gray-700 ml-1">
                    {Number(service.rating).toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-400">({service.review_count} reviews)</span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">No reviews yet</span>
              )}
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1.5 text-sm text-green-primary">
                <span className="w-2 h-2 bg-green-primary rounded-full animate-pulse" />
                Active
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{service.description}</p>
            </div>

            {/* Reviews */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Reviews {reviews.length > 0 && <span className="text-gray-400 font-normal text-base">({reviews.length})</span>}
              </h2>
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm">No reviews yet — be the first!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="flex gap-4">
                      {review.reviewer_avatar ? (
                        <img
                          src={review.reviewer_avatar}
                          alt={review.reviewer_name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-pale flex items-center justify-center shrink-0">
                          <span className="text-green-primary font-bold text-sm">
                            {review.reviewer_name?.[0] ?? '?'}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-gray-900">{review.reviewer_name}</span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-500 italic">"{review.comment}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right — pricing sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Starting from</p>
                  <p className="text-4xl font-bold text-gray-900">
                    {formatPrice(service.price, service.price_unit)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-pale rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-primary" />
                </div>
              </div>

              <button
                onClick={handleSendMessage}
                className="btn-primary w-full justify-center py-3.5 text-base"
              >
                {isOwnService ? (
                  <MessageCircle className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                {isOwnService ? 'View Messages' : 'Send Message'}
              </button>
              <p className="text-xs text-gray-400 text-center -mt-2">Request takes less than 1 minute</p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-green-primary shrink-0" />
                  {formatDelivery(service.delivery_days)}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-primary shrink-0" />
                  Tamamdır Guarantee
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    {service.provider_avatar ? (
                      <img
                        src={service.provider_avatar}
                        alt={service.provider_name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-green-pale flex items-center justify-center border-2 border-white shadow-sm">
                        <span className="text-green-primary font-bold">
                          {service.provider_name?.[0] ?? '?'}
                        </span>
                      </div>
                    )}
                    {service.provider_verified === 1 && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-primary rounded-full flex items-center justify-center border-2 border-white">
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{service.provider_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {service.provider_department && (
                        <span className="text-xs text-gray-400">{service.provider_department}</span>
                      )}
                      {service.provider_verified === 1 && (
                        <span className="text-xs bg-green-pale text-green-primary font-semibold px-2 py-0.5 rounded-full">
                          VERIFIED
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-gray-900">{service.order_count}</p>
                    <p className="text-xs text-gray-400">Orders Done</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-gray-900">
                      {service.review_count > 0 ? `${Number(service.provider_rating).toFixed(1)}★` : '—'}
                    </p>
                    <p className="text-xs text-gray-400">Provider Rating</p>
                  </div>
                </div>

                <Link to={`/users/${service.provider_id}`} className="btn-outline w-full justify-center text-sm py-2.5">
                  View Profile
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* More from provider */}
        {moreServices.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              More from {service.provider_name?.split(' ')[0]}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {moreServices.map(s => (
                <ServiceCard
                  key={s.id}
                  service={{
                    ...s,
                    provider_name: service.provider_name,
                    provider_avatar: service.provider_avatar,
                    provider_verified: service.provider_verified,
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
