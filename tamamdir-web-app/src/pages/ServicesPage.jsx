import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import ServiceCard from '../components/ServiceCard'
import api from '../lib/api'
import { cn, LOCATION_OPTIONS } from '../lib/utils'

const SORT_MAP = {
  rating:     'rating',
  price_low:  'price_asc',
  price_high: 'price_desc',
  newest:     'newest',
  popular:    'popular',
}

function filterPillClass(active) {
  return cn(
    'text-sm font-semibold px-4 py-2 rounded-full transition-colors',
    active
      ? 'bg-green-pale text-green-primary ring-2 ring-green-primary'
      : 'bg-green-pale text-green-primary hover:bg-green-badge'
  )
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
  const [searchParams, setSearchParams] = useSearchParams()
  const filterByInterests = searchParams.get('interests') === '1'
  const searchQuery = searchParams.get('q')?.trim() ?? ''
  const activeLocation = searchParams.get('location_type') ?? ''
  const minPrice = searchParams.get('min_price') ?? ''
  const maxPrice = searchParams.get('max_price') ?? ''

  const [activeCategory, setActiveCategory] = useState('')

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
      setServices([])
      setError('')
      try {
        const params = new URLSearchParams({ sort: SORT_MAP.rating, limit: '20' })
        if (activeCategory) params.set('category', activeCategory)
        if (activeLocation) params.set('location_type', activeLocation)
        if (searchQuery) params.set('q', searchQuery)
        if (filterByInterests) params.set('interests', '1')
        if (minPrice) params.set('min_price', minPrice)
        if (maxPrice) params.set('max_price', maxPrice)

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
  }, [activeCategory, activeLocation, filterByInterests, searchQuery, minPrice, maxPrice])

  const setLocationFilter = (value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set('location_type', value)
      else next.delete('location_type')
      return next
    }, { replace: true })
  }

  const setPriceFilter = (key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      const trimmed = value.trim()
      if (trimmed) next.set(key, trimmed)
      else next.delete(key)
      return next
    }, { replace: true })
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <main className="w-full px-4 sm:px-6 lg:px-8 pt-4 pb-10">
        <div className="mb-4 w-full">
          <h1 className="text-3xl font-bold text-coffee mb-1">Marketplace</h1>
          <p className="text-gray-500 text-sm">
            {searchQuery
              ? `Results for “${searchQuery}”.`
              : filterByInterests
                ? 'Services matching your interests.'
                : 'Find the perfect campus service from your peers.'}
          </p>
        </div>

        {/* Location pills */}
        <div className="flex gap-2 flex-wrap mb-3">
          <button
            type="button"
            onClick={() => setLocationFilter('')}
            className={filterPillClass(activeLocation === '')}
          >
            All locations
          </button>
          {LOCATION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setLocationFilter(opt.value)}
              className={filterPillClass(activeLocation === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            <button
              type="button"
              onClick={() => setActiveCategory('')}
              className={filterPillClass(activeCategory === '')}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.slug)}
                className={filterPillClass(activeCategory === cat.slug)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Price range */}
        <div className="flex flex-wrap items-end gap-3 mb-6">
          <div>
            <label htmlFor="min-price" className="block text-xs font-medium text-gray-500 mb-1">Min price (₺)</label>
            <input
              id="min-price"
              type="number"
              min="0"
              placeholder="0"
              value={minPrice}
              onChange={e => setPriceFilter('min_price', e.target.value)}
              className="w-28 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-coffee outline-none focus:border-green-primary focus:ring-1 focus:ring-green-primary"
            />
          </div>
          <div>
            <label htmlFor="max-price" className="block text-xs font-medium text-gray-500 mb-1">Max price (₺)</label>
            <input
              id="max-price"
              type="number"
              min="0"
              placeholder="Any"
              value={maxPrice}
              onChange={e => setPriceFilter('max_price', e.target.value)}
              className="w-28 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-coffee outline-none focus:border-green-primary focus:ring-1 focus:ring-green-primary"
            />
          </div>
          {(minPrice || maxPrice) && (
            <button
              type="button"
              onClick={() => setSearchParams(prev => {
                const next = new URLSearchParams(prev)
                next.delete('min_price')
                next.delete('max_price')
                return next
              }, { replace: true })}
              className="text-sm font-medium text-green-primary hover:underline pb-2"
            >
              Clear price
            </button>
          )}
        </div>

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
              {searchQuery
                ? `No results for “${searchQuery}”`
                : activeLocation
                  ? `No services in ${LOCATION_OPTIONS.find(o => o.value === activeLocation)?.label ?? 'this location'}`
                  : 'No services found'}
            </p>
            <p className="text-gray-300 text-sm mt-1">
              {searchQuery ? 'Try a different search term or clear filters.' : 'Try a different category or location'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
