import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Loader2, Plus, ImagePlus, X } from 'lucide-react'
import api from '../lib/api'
import { LOCATION_OPTIONS } from '../lib/utils'
import { usePreferences } from '../context/PreferencesContext'
import { tCategory } from '../lib/i18n'

const MAX_IMAGES = 10
const MAX_FILE_SIZE = 10 * 1024 * 1024

const PRICE_UNITS = ['session', 'hour', 'day', 'item', 'piece']

export default function CreateServicePage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const { t } = usePreferences()

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
  const [locationType, setLocationType] = useState('on_campus')
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
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        const others = list.filter(c => c.slug === 'others' || c.name === 'Other');
        const rest = list.filter(c => c.slug !== 'others' && c.name !== 'Other');
        setCategories([...rest, ...others]);
      })
      .catch(() => setError(t('createService.loadCategoriesFailed')))
      .finally(() => setLoadingCats(false))
  }, [t])

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    setError('')
    const remaining = MAX_IMAGES - images.length
    if (remaining <= 0) {
      setError(t('createService.maxPhotos', { max: MAX_IMAGES }))
      return
    }

    const toAdd = []
    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith('image/')) {
        setError(t('createService.imagesOnly'))
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(t('createService.fileSizeMax'))
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
      setError(t('createService.titleRequired'))
      return
    }
    if (!categoryId) {
      setError(t('createService.categoryRequired'))
      return
    }
    if (!parsedPrice || parsedPrice < 1) {
      setError(t('createService.priceMin'))
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
        location_type: locationType,
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
      const msg = err.data?.errors?.[0]?.msg ?? err.message ?? t('createService.failed')
      setError(msg)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/profile"
          state={{ tab: 'services' }}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('createService.back')}
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-coffee mb-1">{t('createService.title')}</h1>
          <p className="text-gray-500 text-sm">
            {t('createService.subtitle')}
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
              {t('createService.photos')}
            </label>
            <p className="text-xs text-gray-400 mb-3">
              {t('createService.photosHint', { max: MAX_IMAGES })}
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
                        {t('common.cover')}
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
                  {images.length === 0 ? t('createService.addPhotos') : t('createService.addMorePhotos')}
                </span>
                <span className="text-xs">{t('createService.uploaded', { current: images.length, max: MAX_IMAGES })}</span>
              </button>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('createService.titleLabel')} <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={120}
              placeholder={t('createService.titlePlaceholder')}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('createService.description')}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder={t('createService.descriptionPlaceholder')}
              className="input-field resize-none"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('createService.category')} <span className="text-red-400">*</span>
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              disabled={loadingCats}
              className="input-field"
            >
              <option value="">{t('createService.selectCategory')}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{tCategory(t, cat)}</option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('createService.price')} <span className="text-red-400">*</span>
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
                {t('createService.priceUnit')}
              </label>
              <select
                id="priceUnit"
                value={priceUnit}
                onChange={e => setPriceUnit(e.target.value)}
                className="input-field"
              >
                {PRICE_UNITS.map(u => (
                  <option key={u} value={u}>{t(`priceUnit.${u}`)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="locationType" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('createService.meetingLocation')}
            </label>
            <select
              id="locationType"
              value={locationType}
              onChange={e => setLocationType(e.target.value)}
              className="input-field"
            >
              {LOCATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{t(`location.${opt.value}`)}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1.5">{t('createService.meetingLocationHint')}</p>
          </div>

          <div>
            <label htmlFor="deliveryDays" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('createService.deliveryTime')}
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
            <p className="text-xs text-gray-400 mt-1.5">{t('createService.deliveryTimeHint')}</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              to="/profile"
              state={{ tab: 'services' }}
              className="btn-outline text-sm py-2.5"
            >
              {t('common.cancel')}
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
              {submitting ? t('createService.creating') : t('createService.submit')}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
