import { useState, useEffect } from 'react'
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { CheckCircle2, Star, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import ServiceCard from '../components/ServiceCard'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="card p-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-3 w-full">
          <div className="h-7 bg-gray-200 rounded w-48 mx-auto sm:mx-0" />
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto sm:mx-0" />
          <div className="h-4 bg-gray-200 rounded w-full max-w-md" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function UserProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  const [profile, setProfile] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (currentUser?.id === id) return

    let cancelled = false
    setLoading(true)
    setError('')

    Promise.all([
      api.get(`/api/users/${id}`),
      api.get(`/api/users/${id}/services`),
    ])
      .then(([user, svcList]) => {
        if (cancelled) return
        setProfile(user)
        setServices(svcList.map(s => ({
          ...s,
          provider_name: user.full_name,
          provider_avatar: user.avatar_url,
          provider_verified: user.is_verified_student ? 1 : 0,
        })))
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.status === 404 ? 'User not found.' : (err.message || 'Failed to load profile.'))
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [id, currentUser?.id])

  if (currentUser?.id === id) {
    return <Navigate to="/profile" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {loading && <ProfileSkeleton />}

        {error && (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-700 font-semibold text-lg mb-2">{error}</p>
            <Link to="/services" className="btn-primary mt-4 inline-flex">
              Browse Services
            </Link>
          </div>
        )}

        {!loading && !error && profile && (
          <>
            <div className="card p-8 mb-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative shrink-0">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-green-pale flex items-center justify-center border-4 border-white shadow-sm">
                      <span className="text-green-primary font-bold text-3xl">
                        {profile.full_name?.[0] ?? '?'}
                      </span>
                    </div>
                  )}
                  {profile.is_verified_student && (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-primary rounded-full flex items-center justify-center border-2 border-white">
                      <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{profile.full_name}</h1>
                  {profile.department && (
                    <p className="text-gray-500 text-sm mb-2">{profile.department}</p>
                  )}
                  {profile.is_verified_student && (
                    <div className="inline-flex items-center gap-1.5 bg-green-pale text-green-primary text-xs font-semibold px-3 py-1 rounded-full mb-3">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified Student
                    </div>
                  )}
                  {profile.bio && (
                    <p className="text-gray-600 text-sm leading-relaxed max-w-2xl mt-2">{profile.bio}</p>
                  )}

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      {profile.review_count > 0 ? (
                        <span>
                          <span className="font-semibold text-gray-900">
                            {Number(profile.rating).toFixed(1)}
                          </span>
                          {' '}({profile.review_count} reviews)
                        </span>
                      ) : (
                        <span className="text-gray-400">No reviews yet</span>
                      )}
                    </div>
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    <span className="text-sm text-gray-500">
                      {services.length} active service{services.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Services by {profile.full_name?.split(' ')[0]}
              </h2>
              {services.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-12 card">
                  This provider hasn&apos;t listed any services yet.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {services.map(service => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
