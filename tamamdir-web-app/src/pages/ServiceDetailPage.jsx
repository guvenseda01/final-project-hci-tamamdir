import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Star, CheckCircle2, Clock, ArrowLeft, ChevronRight, AlertCircle, Loader2, MessageCircle, MapPin, Flag } from 'lucide-react'
import ServiceCard from '../components/ServiceCard'
import ServiceImageGallery from '../components/ServiceImageGallery'
import ReportModal from '../components/ReportModal'
import FavoriteButton from '../components/FavoriteButton'
import api from '../lib/api'
import { resolveMediaUrl } from '../lib/utils'
import { formatLocalizedPrice, formatLocalizedDelivery, tLocation, tCategory } from '../lib/i18n'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'

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
  const { t } = usePreferences()

  const [service, setService] = useState(null)
  const [reviews, setReviews] = useState([])
  const [moreServices, setMoreServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showReportModal, setShowReportModal] = useState(false)

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
        if (!cancelled) setError(err.status === 404 ? t('serviceDetail.notFound') : (err.message || t('serviceDetail.loadFailed')))
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
          const existing = convs.find(
            c => c.service_id === id && c.other_id === serviceOrder.buyer_id
          )
          if (existing) {
            navigate(`/messages?conv=${existing.id}&${serviceQuery}`)
            return
          }
          const conv = await api.post('/api/messages/conversations', {
            recipient_id: serviceOrder.buyer_id,
            service_id: id,
          })
          navigate(`/messages?conv=${conv.id}&${serviceQuery}`)
          return
        }
        const existingForService = convs.find(c => c.service_id === id)
        if (existingForService) {
          navigate(`/messages?conv=${existingForService.id}&${serviceQuery}`)
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
      const convs = await api.get('/api/messages/conversations')
      const existing = convs.find(
        c => c.service_id === id && c.other_id === service.provider_id
      )
      if (existing) {
        navigate(`/messages?conv=${existing.id}&${serviceQuery}`)
        return
      }

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

  const galleryImages = service?.images ?? []

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <DetailSkeleton />
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-amber-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold text-lg mb-2">{error}</p>
          <button onClick={() => navigate('/services')} className="btn-primary mt-4">
            <ArrowLeft className="w-4 h-4" />
            {t('serviceDetail.backToServices')}
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/home" className="hover:text-gray-600">{t('common.home')}</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/services" className="hover:text-gray-600">{t('common.services')}</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-700 font-medium">{service.title}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left — main content */}
          <div className="lg:col-span-2">
            <ServiceImageGallery serviceId={service.id} images={galleryImages} title={service.title} />

            {/* Category tag */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                {tCategory(t, { slug: service.category_slug, name: service.category_name })}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-coffee px-3 py-1 rounded-full border border-amber-200">
                <MapPin className="w-3 h-3" />
                {tLocation(t, service.location_type)}
              </span>
              {service.provider_verified === 1 && (
                <span className="text-xs font-medium bg-green-pale text-green-primary px-3 py-1 rounded-full">
                  {t('serviceDetail.verifiedProvider')}
                </span>
              )}
            </div>

            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-3xl font-bold text-coffee">{service.title}</h1>
              <div className="flex items-center gap-2 shrink-0 mt-1">
                {!isOwnService && <FavoriteButton serviceId={service.id} />}
                {!isOwnService && (
                  <button
                    type="button"
                    onClick={() => setShowReportModal(true)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-600"
                  >
                    <Flag className="w-4 h-4" />
                    {t('common.report')}
                  </button>
                )}
              </div>
            </div>

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
                  <span className="text-sm text-gray-400">({t('serviceDetail.reviews', { count: service.review_count })})</span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">{t('serviceDetail.noReviewsYet')}</span>
              )}
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1.5 text-sm text-green-primary">
                <span className="w-2 h-2 bg-green-primary rounded-full animate-pulse" />
                {t('common.active')}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-semibold text-coffee mb-3">{t('serviceDetail.description')}</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{service.description}</p>
            </div>

            {/* Reviews */}
            <div>
              <h2 className="text-lg font-semibold text-coffee mb-4">
                {t('serviceDetail.reviewsTitle')} {reviews.length > 0 && <span className="text-coffee/60 font-normal text-base">({reviews.length})</span>}
              </h2>
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm">{t('serviceDetail.beFirstReview')}</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="flex gap-4">
                      {review.reviewer_avatar ? (
                        <img
                          src={resolveMediaUrl(review.reviewer_avatar)}
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
                          <span className="font-semibold text-sm text-coffee">{review.reviewer_name}</span>
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
                  <p className="text-xs text-gray-400 mb-0.5">{t('serviceDetail.startingFrom')}</p>
                  <p className="text-4xl font-bold text-coffee">
                    {formatLocalizedPrice(t, service.price, service.price_unit)}
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
                {isOwnService ? t('serviceDetail.viewMessages') : t('serviceDetail.sendMessage')}
              </button>
              <p className="text-xs text-gray-400 text-center -mt-2">{t('serviceDetail.requestTime')}</p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-green-primary shrink-0" />
                  {formatLocalizedDelivery(t, service.delivery_days)}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-primary shrink-0" />
                  {t('serviceDetail.guarantee')}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    {service.provider_avatar ? (
                      <img
                        src={resolveMediaUrl(service.provider_avatar)}
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
                    <p className="font-semibold text-coffee text-sm">{service.provider_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {service.provider_department && (
                        <span className="text-xs text-gray-400">{service.provider_department}</span>
                      )}
                      {service.provider_verified === 1 && (
                        <span className="text-xs bg-green-pale text-green-primary font-semibold px-2 py-0.5 rounded-full">
                          {t('common.verified').toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 text-center mb-4">
                  <p className="text-lg font-bold text-coffee">
                    {Number(service.provider_rating ?? 0).toFixed(1)}★
                  </p>
                  <p className="text-xs text-gray-400">
                    {t('serviceDetail.providerRating')}
                    {(service.provider_review_count ?? 0) > 0 && (
                      <span className="text-gray-400"> · {t('serviceDetail.providerReviews', { count: service.provider_review_count })}</span>
                    )}
                  </p>
                </div>

                <Link to={`/users/${service.provider_id}`} className="btn-outline text-coffee w-full justify-center text-sm py-2.5">
                  {t('serviceDetail.viewProfile')}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* More from provider */}
        {moreServices.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-bold text-coffee mb-6">
              {t('serviceDetail.moreFrom', { name: service.provider_name?.split(' ')[0] })}
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

      <ReportModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="service"
        targetId={service?.id}
        targetLabel={service?.title}
      />
    </div>
  )
}
