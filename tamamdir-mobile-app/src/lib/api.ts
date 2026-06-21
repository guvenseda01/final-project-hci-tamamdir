// In dev, use same-origin + Vite proxy (/api → backend). Avoid localhost:3000 on phone/LAN testing.
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

async function request(path: string, { body, ...options }: Omit<RequestInit, 'body'> & { body?: unknown } = {}) {
  const token = localStorage.getItem('token')
  const isFormData = body instanceof FormData

  const serializedBody: BodyInit | undefined = body === undefined
    ? undefined
    : isFormData
      ? body
      : JSON.stringify(body)

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers as Record<string, string>),
    },
    body: serializedBody,
  })

  if (res.status === 204) return null

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const err = new Error(data?.error ?? `HTTP ${res.status}`) as Error & { status: number; data: unknown }
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

const api = {
  get:   (path: string, opts?: RequestInit)                 => request(path, { method: 'GET', ...opts }),
  post:  (path: string, body?: unknown, opts?: RequestInit) => request(path, { method: 'POST',   body, ...opts }),
  put:   (path: string, body?: unknown, opts?: RequestInit) => request(path, { method: 'PUT',    body, ...opts }),
  patch: (path: string, body?: unknown, opts?: RequestInit) => request(path, { method: 'PATCH',  body, ...opts }),
  del:   (path: string, opts?: RequestInit)                 => request(path, { method: 'DELETE', ...opts }),
}

export default api
