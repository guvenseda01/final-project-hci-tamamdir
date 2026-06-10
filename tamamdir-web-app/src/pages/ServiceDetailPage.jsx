import { useParams, Link, useNavigate } from 'react-router-dom'
import { Star, CheckCircle2, Clock, ArrowLeft, ChevronRight } from 'lucide-react'
import Navbar from '../components/Navbar'
import ServiceCard from '../components/ServiceCard'
import { services } from '../data/mockData'

export default function ServiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const service = services.find((s) => s.id === Number(id)) || services[2]
  const others = services.filter((s) => s.id !== service.id).slice(0, 3)

  const handleSendMessage = () => navigate('/messages')

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
            <div className="rounded-2xl overflow-hidden mb-6 shadow-sm border border-gray-100">
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-80 object-cover"
              />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {service.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">{service.title}</h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(service.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
                  />
                ))}
                <span className="text-sm font-semibold text-gray-700 ml-1">{service.rating}</span>
                <span className="text-sm text-gray-400">({service.reviews} reviews)</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1.5 text-sm text-green-primary">
                <span className="w-2 h-2 bg-green-primary rounded-full animate-pulse" />
                Active 2h ago
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-600 leading-relaxed">{service.longDescription}</p>
            </div>

            {/* Reviews */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h2>
              <div className="space-y-4">
                {service.reviewsList.map((review, idx) => (
                  <div key={idx} className="flex gap-4">
                    <img
                      src={review.avatar}
                      alt={review.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-100"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-900">{review.name}</span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 italic">"{review.text}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — pricing sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Starting from</p>
                  <p className="text-4xl font-bold text-gray-900">{service.price}</p>
                </div>
                <div className="w-10 h-10 bg-green-pale rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-primary" />
                </div>
              </div>

              <button
                onClick={handleSendMessage}
                className="btn-primary w-full justify-center py-3.5 text-base"
              >
                <CheckCircle2 className="w-5 h-5" />
                Send Message
              </button>
              <p className="text-xs text-gray-400 text-center -mt-2">Request takes less than 1 minute</p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-green-primary shrink-0" />
                  {service.deliveryInfo}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-primary shrink-0" />
                  Tamamdır Guarantee
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <img
                      src={service.provider.avatar}
                      alt={service.provider.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-primary rounded-full flex items-center justify-center border-2 border-white">
                      <CheckCircle2 className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{service.provider.fullName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{service.provider.department}</span>
                      <span className="text-xs bg-green-pale text-green-primary font-semibold px-2 py-0.5 rounded-full">
                        VERIFIED STUDENT
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-gray-900">{service.provider.ordersCount}+</p>
                    <p className="text-xs text-gray-400">Orders Done</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-gray-900">{service.provider.satisfaction}%</p>
                    <p className="text-xs text-gray-400">Satisfaction</p>
                  </div>
                </div>

                <Link
                  to="/profile"
                  className="btn-outline w-full justify-center text-sm py-2.5"
                >
                  View Profile
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* More from provider */}
        <section className="mt-14">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            More from {service.provider.fullName.split(' ')[0]}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {others.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
