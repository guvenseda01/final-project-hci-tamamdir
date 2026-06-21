import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import { useAuth } from './AuthContext'

const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  const { user } = useAuth()
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set())
      return
    }
    setLoading(true)
    try {
      const ids = await api.get('/api/favorites')
      setFavoriteIds(new Set(ids))
    } catch {
      setFavoriteIds(new Set())
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  const isFavorite = useCallback(
    (serviceId) => favoriteIds.has(serviceId),
    [favoriteIds]
  )

  const toggleFavorite = useCallback(async (serviceId) => {
    if (!user) return false
    const wasFavorite = favoriteIds.has(serviceId)
    setFavoriteIds(prev => {
      const next = new Set(prev)
      if (wasFavorite) next.delete(serviceId)
      else next.add(serviceId)
      return next
    })
    try {
      if (wasFavorite) {
        await api.del(`/api/favorites/${serviceId}`)
        return false
      }
      await api.post(`/api/favorites/${serviceId}`)
      return true
    } catch (err) {
      setFavoriteIds(prev => {
        const next = new Set(prev)
        if (wasFavorite) next.add(serviceId)
        else next.delete(serviceId)
        return next
      })
      throw err
    }
  }, [user, favoriteIds])

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite, refresh, loading, count: favoriteIds.size }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}
