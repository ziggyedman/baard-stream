/**
 * Thin API client that wraps fetch.
 * - Always sends cookies (credentials: 'include')
 * - Throws { status, message } on non-2xx
 * - All paths are relative so they work in both dev (proxied) and prod (same-origin)
 */

class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function request(method, path, body) {
  const opts = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  }
  if (body !== undefined) opts.body = JSON.stringify(body)

  const res = await fetch(path, opts)

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = await res.json()
      message = data.error || message
    } catch { /* ignore parse error */ }
    throw new ApiError(res.status, message)
  }

  // 204 No Content
  if (res.status === 204) return null
  return res.json()
}

const get    = (path)        => request('GET',    path)
const post   = (path, body)  => request('POST',   path, body)
const put    = (path, body)  => request('PUT',    path, body)
const del    = (path)        => request('DELETE', path)

/* ── Auth ──────────────────────────────────────────────────────────────── */
export const auth = {
  me:         ()            => get('/api/auth/me'),
  register:   (body)        => post('/api/auth/register', body),
  login:      (body)        => post('/api/auth/login', body),
  logout:     ()            => post('/api/auth/logout'),
  googleUrl:  ()            => '/api/auth/google',   // navigate to this URL
}

/* ── User ──────────────────────────────────────────────────────────────── */
export const user = {
  getProfile:    ()      => get('/api/user/profile'),
  updateProfile: (body)  => put('/api/user/profile', body),
  getSettings:   ()      => get('/api/user/settings'),
  updateSettings:(body)  => put('/api/user/settings', body),
  changePassword:(body)  => put('/api/user/password', body),
  deleteAccount: ()      => del('/api/user/account'),
}

/* ── Platforms ─────────────────────────────────────────────────────────── */
export const platforms = {
  list:    ()   => get('/api/platforms'),
  connect: (id) => post(`/api/platforms/${id}/connect`),
  revoke:  (id) => del(`/api/platforms/${id}`),
}

export { ApiError }
