import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import api, { setAuthToken } from '../api/client'
import type { AuthResponse, UserResponse } from '../types'

const STORAGE_KEY = 'akilli-diyet-token'

type AuthContextValue = {
  user: UserResponse | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY))
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<UserResponse>('/api/me')
    setUser(data)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const t = localStorage.getItem(STORAGE_KEY)
      if (!t) {
        setLoading(false)
        return
      }
      setAuthToken(t)
      try {
        const { data } = await api.get<UserResponse>('/api/me')
        if (!cancelled) {
          setUser(data)
          setToken(t)
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem(STORAGE_KEY)
          setAuthToken(null)
          setUser(null)
          setToken(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password })
    localStorage.setItem(STORAGE_KEY, data.token)
    setAuthToken(data.token)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const { data } = await api.post<AuthResponse>('/api/auth/register', {
        email,
        password,
        displayName,
      })
      localStorage.setItem(STORAGE_KEY, data.token)
      setAuthToken(data.token)
      setToken(data.token)
      setUser(data.user)
    },
    [],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setAuthToken(null)
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, loading, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth AuthProvider dışında kullanılamaz')
  return ctx
}
