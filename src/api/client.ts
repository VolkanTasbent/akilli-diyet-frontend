import axios from 'axios'
import { API_BASE_URL, apiUrl } from './baseUrl'

export { apiUrl }

/** Sunucudan gelen hata metnini oku (Problem Details veya eski Spring gövdesi). */
export function getApiErrorMessage(err: unknown): string | null {
  if (!axios.isAxiosError(err)) {
    return null
  }
  const data = err.response?.data
  if (typeof data === 'string' && data.trim()) {
    return data.trim()
  }
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    if (typeof d.detail === 'string' && d.detail.trim()) {
      return d.detail.trim()
    }
    if (typeof d.message === 'string' && d.message.trim()) {
      return d.message.trim()
    }
  }
  return null
}

const api = axios.create({
  baseURL: API_BASE_URL || '/',
  headers: { 'Content-Type': 'application/json' },
})

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

export default api
