import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn, resolveMediaUrl } from '../lib/utils'

export default function ServiceImageGallery({ images = [], title = 'Service', serviceId }) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef(null)

  useEffect(() => {
    setIndex(0)
  }, [serviceId])

  if (!images.length) {
    return (
      <div className="rounded-2xl overflow-hidden mb-6 shadow-sm border border-amber-200 bg-gray-100 h-80">
        <div className="w-full h-full bg-gradient-to-br from-green-400 to-teal-500" />
      </div>
    )
  }

  const count = images.length
  const hasMultiple = count > 1
  const current = images[index]

  const goPrev = () => setIndex(i => (i - 1 + count) % count)
  const goNext = () => setIndex(i => (i + 1) % count)

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e) => {
    if (touchStartX.current == null || !hasMultiple) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 40) {
      if (delta < 0) goNext()
      else goPrev()
    }
    touchStartX.current = null
  }

  return (
    <div className="mb-6 space-y-3">
      <div
        className="relative rounded-2xl overflow-hidden shadow-sm border border-amber-200 bg-gray-100 h-80 select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          key={current.id ?? current.image_url}
          src={resolveMediaUrl(current.image_url)}
          alt={`${title} — photo ${index + 1}`}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-amber-200 shadow-md flex items-center justify-center text-coffee hover:bg-white transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-amber-200 shadow-md flex items-center justify-center text-coffee hover:bg-white transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <span className="absolute bottom-3 right-3 text-xs font-semibold bg-black/50 text-white px-2.5 py-1 rounded-full">
              {index + 1} / {count}
            </span>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {images.map((img, i) => (
                <button
                  key={img.id ?? img.image_url ?? i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    i === index ? 'bg-white scale-110' : 'bg-white/50 hover:bg-white/80'
                  )}
                  aria-label={`Go to photo ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((img, i) => (
            <button
              key={img.id ?? img.image_url ?? i}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                'shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all',
                i === index ? 'border-green-primary ring-2 ring-green-primary/30' : 'border-amber-200 opacity-70 hover:opacity-100'
              )}
              aria-label={`Show photo ${i + 1}`}
            >
              <img
                src={resolveMediaUrl(img.image_url)}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
