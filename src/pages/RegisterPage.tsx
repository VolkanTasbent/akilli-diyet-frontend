import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== passwordConfirm) {
      setError('Şifreler eşleşmiyor.')
      return
    }
    setBusy(true)
    try {
      await register(email, password, displayName)
      navigate('/')
    } catch (e) {
      setError(
        getApiErrorMessage(e) ??
          'Kayıt başarısız. E-posta kullanımda olabilir veya veriler geçersiz.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Kayıt</h1>
        <p className="muted">Şifre en az 8 karakter olmalıdır.</p>
        <form onSubmit={onSubmit} className="form">
          <label>
            Ad / görünen isim
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={80}
              autoComplete="name"
            />
          </label>
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
              autoComplete="new-password"
            />
          </label>
          <label>
            Şifre (tekrar)
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? 'Kaydediliyor…' : 'Hesap oluştur'}
          </button>
        </form>
        <p className="muted small">
          Zaten hesabınız var mı? <Link to="/login">Giriş yapın</Link>
        </p>
      </div>
    </div>
  )
}
