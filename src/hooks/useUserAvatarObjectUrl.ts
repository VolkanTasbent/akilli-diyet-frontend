import { useEffect, useRef, useState } from 'react'
import type { UserResponse } from '../types'

/**
 * JWT ile korunan /api/me/avatar için blob URL (img src doğrudan Authorization gönderemediği için).
 */
export function useUserAvatarObjectUrl(user: UserResponse | null, token: string | null) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user?.hasAvatar || !token) {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
      setObjectUrl(null)
      return
    }
    let cancelled = false
    const ac = new AbortController()
    fetch('/api/me/avatar', {
      headers: { Authorization: `Bearer ${token}` },
      signal: ac.signal,
    })
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((blob) => {
        if (cancelled) return
        if (urlRef.current) URL.revokeObjectURL(urlRef.current)
        const u = URL.createObjectURL(blob)
        urlRef.current = u
        setObjectUrl(u)
      })
      .catch(() => {
        if (cancelled) return
        if (urlRef.current) {
          URL.revokeObjectURL(urlRef.current)
          urlRef.current = null
        }
        setObjectUrl(null)
      })
    return () => {
      cancelled = true
      ac.abort()
    }
  }, [user?.hasAvatar, user?.avatarUpdatedAt, token])

  useEffect(() => {
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [])

  return objectUrl
}
