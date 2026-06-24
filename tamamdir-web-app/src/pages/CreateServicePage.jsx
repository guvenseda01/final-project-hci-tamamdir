import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Loader2, Plus, ImagePlus, X } from 'lucide-react'
import Navbar from '../components/Navbar'
import api from '../lib/api'

const MAX_IMAGES = 10
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const PRICE_UNITS = [
  { value: 'session', label: 'Per session' },
  { value: 'hour',    label: 'Per hour'    },
  { value: 'day',     label: 'Per day'     },
  { value: 'item',    label: 'Per item'    },
  { value: 'piece',   label: 'Per piece'   },
]

export default function CreateServicePage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [categories, setCategories] = useState([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState('')
  const [priceUnit, setPriceUnit] = useState('session')
  const [deliveryDays, setDeliveryDays] = useState('1')
  const [images, setImages] = useState([])
  const imagesRef = useRef(images)
  imagesRef.current = images

  useEffect(() => {
    return () => {
      imagesRef.current.forEach(img => URL.revokeObjectURL(img.preview))
    }
  }, [])

  useEffect(() => {
    api.get('/api/categories')
      .then(data => setCategories(data))
      .catch(() => setError('Could not load categories.'))
      .finally(() => setLoadingCats(false))
  }, [])

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    setError('')
    const remaining = MAX_IMAGES - images.length
    if (remaining <= 0) {
      setError(`You can upload up to ${MAX_IMAGES} photos.`)
      return
    }

    const toAdd = []
    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed.')
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('Each photo must be 10 MB or smaller.')
        continue
      }
      toAdd.push({ file, preview: URL.createObjectURL(file) })
    }

    if (toAdd.length > 0) {
      setImages(prev => [...prev, ...toAdd])
    }
  }

  const removeImage = (index) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const uploadImages = async (serviceId) => {
    const formData = new FormData()
    images.forEach(({ file }) => formData.append('images', file))
    await api.post(`/api/services/${serviceId}/images`, formData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedTitle = title.trim()
    const parsedPrice = parseFloat(price)
    const parsedDays = parseInt(deliveryDays, 10)

    if (!trimmedTitle) {
      setError('Title is required.')
      return
    }
    if (!categoryId) {
      setError('Please select a category.')
      return
    }
    if (!parsedPrice || parsedPrice < 1) {
      setError('Price must be at least ₺1.')
      return
    }

    setSubmitting(true)
    try {
      const service = await api.post('/api/services', {
        title: trimmedTitle,
        description: description.trim() || undefined,
        category_id: categoryId,
        price: parsedPrice,
        price_unit: priceUnit,
        delivery_days: parsedDays >= 1 ? parsedDays : 1,
      })

      let imageUploadFailed = false
      if (images.length > 0) {
        try {
          await uploadImages(service.id)
        } catch {
          imageUploadFailed = true
        }
      }

      navigate('/profile', {
        state: {
          tab: 'services',
          serviceCreated: true,
          imageUploadFailed,
        },
      })
    } catch (err) {
      const msg = err.data?.errors?.[0]?.msg ?? err.message ?? 'Failed to create service.'
      setError(msg)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/profile"
          state={{ tab: 'services' }}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Service Management
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Add New Service</h1>
          <p className="text-gray-500 text-sm">
            Create a listing so other students can find and book your service.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Photos
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Add up to {MAX_IMAGES} photos. The first photo will be used as the cover image.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                {images.map((img, index) => (
                  <div key={img.preview} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    {index === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-green-primary text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 text-gray-400 hover:border-green-primary hover:text-green-primary hover:bg-green-pale/30 transition-colors"
              >
                <ImagePlus className="w-8 h-8" />
                <span className="text-sm font-medium">
                  {images.length === 0 ? 'Add photos' : 'Add more photos'}
                </span>
                <span className="text-xs">{images.length}/{MAX_IMAGES} uploaded</span>
              </button>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={120}
              placeholder="e.g. Python Coding Lessons"
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Describe what you offer, your experience, and what students can expect…"
              className="input-field resize-none"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              disabled={loadingCats}
              className="input-field"
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1.5">
                Price (₺) <span className="text-red-400">*</span>
              </label>
              <input
                id="price"
                type="number"
                min="1"
                step="1"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="250"
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="priceUnit" className="block text-sm font-medium text-gray-700 mb-1.5">
                Price unit
              </label>
              <select
                id="priceUnit"
                value={priceUnit}
                onChange={e => setPriceUnit(e.target.value)}
                className="input-field"
              >
                {PRICE_UNITS.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="deliveryDays" className="block text-sm font-medium text-gray-700 mb-1.5">
              Delivery time (days)
            </label>
            <input
              id="deliveryDays"
              type="number"
              min="1"
              max="90"
              value={deliveryDays}
              onChange={e => setDeliveryDays(e.target.value)}
              className="input-field"
            />
            <p className="text-xs text-gray-400 mt-1.5">How many days until the service is delivered.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              to="/profile"
              state={{ tab: 'services' }}
              className="btn-outline text-sm py-2.5"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || loadingCats}
              className={`btn-primary py-2.5 ${submitting || loadingCats ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {submitting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Plus className="w-4 h-4" />
              }
              {submitting ? 'Creating…' : 'Create Service'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
