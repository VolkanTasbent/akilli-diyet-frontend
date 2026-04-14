import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [resetMsg, setResetMsg] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const st = location.state as { resetOk?: boolean } | null
    if (st?.resetOk) {
      setResetMsg('Şifren güncellendi. Yeni şifrenle giriş yapabilirsin.')
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.state, navigate])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Giriş başarısız. E-posta ve şifreyi kontrol edin.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Giriş</h1>
        <p className="muted">Akıllı diyet paneline hoş geldiniz.</p>
        {resetMsg && <p className="success banner">{resetMsg}</p>}
        <form onSubmit={onSubmit} className="form">
          <label>
            E-posta
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Şifre
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="current-password"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? 'Giriş…' : 'Giriş yap'}
          </button>
        </form>
        <p className="muted small">
          <Link to="/forgot-password">Şifremi unuttum</Link>
          {' · '}
          Hesabınız yok mu? <Link to="/register">Kayıt olun</Link>
        </p>
      </div>
    </div>
  )
}
