// Use a same-origin HTTPS /api proxy in production so support cookies remain first-party.
const base = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/+$/, '')
export function apiEndpoint(path) {
  return path.startsWith('/api/') ? base + path : path
}
export const apiCredentials = base ? 'include' : 'same-origin'
