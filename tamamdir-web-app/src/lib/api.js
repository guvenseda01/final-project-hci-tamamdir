const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

async function request(path, { body, ...options } = {}) {
  const token = localStorage.getItem('token')
  const isFormData = body instanceof FormData

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...(body !== undefined && { body: isFormData ? body : JSON.stringify(body) }),
  })

  if (res.status === 204) return null

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const err = new Error(data?.error ?? `HTTP ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

const api = {
  get:   (path, opts)       => request(path, { method: 'GET', ...opts }),
  post:  (path, body, opts) => request(path, { method: 'POST',   body, ...opts }),
  put:   (path, body, opts) => request(path, { method: 'PUT',    body, ...opts }),
  patch: (path, body, opts) => request(path, { method: 'PATCH',  body, ...opts }),
  del:   (path, opts)       => request(path, { method: 'DELETE', ...opts }),
}

export default api
