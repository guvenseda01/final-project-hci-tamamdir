import { useState } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '../lib/utils'
import { useFavorites } from '../context/FavoritesContext'

export default function FavoriteButton({ serviceId, className, size = 'md' }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const [busy, setBusy] = useState(false)
  const active = isFavorite(serviceId)

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  const btnSize = size === 'sm' ? 'p-1.5' : 'p-2'

  const handleClick = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    try {
      await toggleFavorite(serviceId)
    } catch {
      // ignore — state reverted in context
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      className={cn(
        btnSize,
        'rounded-full bg-white/90 shadow-sm border border-amber-200 hover:bg-white transition-colors disabled:opacity-60',
        className
      )}
    >
      <Heart
        className={cn(iconSize, active ? 'fill-red-500 text-red-500' : 'text-gray-400')}
      />
    </button>
  )
}
