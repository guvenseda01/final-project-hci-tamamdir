import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, AlertCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import ServiceCard from '../components/ServiceCard'
import api from '../lib/api'

const SORT_MAP = {
  rating:     'rating',
  price_low:  'price_asc',
  price_high: 'price_desc',
  newest:     'newest',
  popular:    'popular',
}

function ServiceCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
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
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')   // '' = All (backend slug)
  const [sortBy, setSortBy] = useState('rating')

  const [categories, setCategories] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch categories once
  useEffect(() => {
    api.get('/api/categories').then(data => setCategories(data)).catch(() => {})
  }, [])

  // Fetch services — debounce search, instant for category/sort
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams({ sort: SORT_MAP[sortBy], limit: '20' })
        if (search.trim()) params.set('q', search.trim())
        if (activeCategory) params.set('category', activeCategory)

        const data = await api.get(`/api/services?${params}`)
        if (!cancelled) setServices(data.services)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load services.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    const delay = search ? 400 : 0
    const id = setTimeout(run, delay)
    return () => { cancelled = true; clearTimeout(id) }
  }, [search, activeCategory, sortBy])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Marketplace</h1>
          <p className="text-gray-500">Find the perfect campus service from your peers.</p>
        </div>

        {/* Search + sort */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex-1 min-w-64 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1"
            />
          </div>

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
            {categories.slice(0, 8).map(cat => (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <ServiceCardSkeleton key={i} />)}
          </div>
        ) : services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map(service => <ServiceCard key={service.id} service={service} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg font-medium">No services found</p>
            <p className="text-gray-300 text-sm mt-1">Try a different search or category</p>
          </div>
        )}
      </main>
    </div>
  )
}
