import { useState, useEffect } from 'react'
import { Heart, AlertCircle, Loader2 } from 'lucide-react'
import ServiceCard from '../components/ServiceCard'
import api from '../lib/api'

function ServiceCardSkeleton() {
  return (
    <div className="bg-amber-100 rounded-xl overflow-hidden border border-amber-200 shadow-sm animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
      </div>
    </div>
  )
}

export default function FavoritesPage() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    api.get('/api/favorites/services')
      .then(data => { if (!cancelled) setServices(data) })
      .catch(err => { if (!cancelled) setError(err.message || 'Failed to load favorites.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen bg-amber-50">
      <main className="w-full px-4 sm:px-6 lg:px-8 pt-4 pb-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-coffee mb-1">Favorites</h1>
          <p className="text-gray-500 text-sm">Services you saved for later.</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
            {Array.from({ length: 8 }).map((_, i) => <ServiceCardSkeleton key={i} />)}
          </div>
        ) : services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
            {services.map(service => <ServiceCard key={service.id} service={service} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-lg font-medium">No favorites yet</p>
            <p className="text-gray-300 text-sm mt-1">Tap the heart on a service to save it here.</p>
          </div>
        )}
      </main>
    </div>
  )
}
