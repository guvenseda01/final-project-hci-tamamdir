import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, AlertCircle } from 'lucide-react'
import ServiceCard from '../components/ServiceCard'
import api from '../lib/api'
import { LOCATION_OPTIONS } from '../lib/utils'

const SORT_MAP = {
  rating:     'rating',
  price_low:  'price_asc',
  price_high: 'price_desc',
  newest:     'newest',
  popular:    'popular',
}

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

export default function ServicesPage() {
  const [searchParams] = useSearchParams()
  const filterByInterests = searchParams.get('interests') === '1'
  const searchQuery = searchParams.get('q')?.trim() ?? ''

  const [activeCategory, setActiveCategory] = useState('')
  const [activeLocation, setActiveLocation] = useState('')
  const [sortBy, setSortBy] = useState('rating')

  const [categories, setCategories] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch categories once
  useEffect(() => {
    api.get('/api/categories').then(data => setCategories(data)).catch(() => {})
  }, [])

  // Fetch services — instant for category/sort
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams({ sort: SORT_MAP[sortBy], limit: '20' })
        if (activeCategory) params.set('category', activeCategory)
        if (activeLocation) params.set('location', activeLocation)
        if (searchQuery) params.set('q', searchQuery)
        if (filterByInterests) params.set('interests', '1')

        const data = await api.get(`/api/services?${params}`)
        if (!cancelled) setServices(data.services)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load services.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [activeCategory, activeLocation, sortBy, filterByInterests, searchQuery])

  return (
    <div className="min-h-screen bg-amber-50">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 w-full">
          <h1 className="text-3xl font-bold text-coffee mb-1">Marketplace</h1>
          <p className="text-gray-500">
            {searchQuery
              ? `Results for “${searchQuery}”.`
              : filterByInterests
                ? 'Services matching your interests.'
                : 'Find the perfect campus service from your peers.'}
          </p>
        </div>

        {/* Sort */}
        <div className="flex justify-end mb-8">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-transparent text-sm text-gray-700 outline-none cursor-pointer"
            >
              <option value="rating">Top Rated</option>
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Location pills */}
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            type="button"
            onClick={() => setActiveLocation('')}
            className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${
              activeLocation === ''
                ? 'bg-amber-200 text-coffee border border-amber-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All locations
          </button>
          {LOCATION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setActiveLocation(opt.value)}
              className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${
                activeLocation === opt.value
                  ? 'bg-amber-200 text-coffee border border-amber-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-8">
            <button
              onClick={() => setActiveCategory('')}
              className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${
                activeCategory === ''
                  ? 'bg-green-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${
                  activeCategory === cat.slug
                    ? 'bg-green-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8 w-full">
            {Array.from({ length: 10 }).map((_, i) => <ServiceCardSkeleton key={i} />)}
          </div>
        ) : services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8 w-full">
            {services.map(service => <ServiceCard key={service.id} service={service} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg font-medium">
              {searchQuery ? `No results for “${searchQuery}”` : 'No services found'}
            </p>
            <p className="text-gray-300 text-sm mt-1">
              {searchQuery ? 'Try a different search term or clear filters.' : 'Try a different category or sort option'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
