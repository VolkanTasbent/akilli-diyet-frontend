function normalizeBase(u: string | undefined): string {
  if (u == null || u === '') return ''
  return u.replace(/\/$/, '')
}

const raw = normalizeBase(import.meta.env.VITE_API_BASE_URL)

/** Üretim: API kökü (örn. https://api-xxx.fly.dev). Geliştirme: boş → göreli /api. */
export const API_BASE_URL = raw

/** fetch için mutlak URL; path / ile başlamalı. */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return API_BASE_URL ? `${API_BASE_URL}${p}` : p
}
