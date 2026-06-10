import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const me = useCallback(async () => {
    const data = await api.get('/api/auth/me')
    setUser(data)
    return data
  }, [])

  useEffect(() => {
    if (!localStorage.getItem('token')) { setLoading(false); return }
    me()
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [me])

  async function login(email, password) {
    const data = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    setUser(data.user)
    return data
  }

  async function register(full_name, email, password) {
    const data = await api.post('/api/auth/register', { full_name, email, password })
    localStorage.setItem('token', data.token)
    setUser(data.user)
    return data
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, me }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
