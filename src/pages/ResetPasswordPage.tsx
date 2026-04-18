import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import { SiteFooter } from '../components/SiteFooter'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const tokenFromUrl = params.get('token')?.trim() ?? ''

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!tokenFromUrl) {
      setError('Geçersiz bağlantı. E-postadaki bağlantıyı kullan veya yeni istek oluştur.')
      return
    }
    if (password !== passwordConfirm) {
      setError('Şifreler eşleşmiyor.')
      return
    }
    setBusy(true)
    try {
      await api.post('/api/auth/reset-password', { token: tokenFromUrl, newPassword: password })
      navigate('/login', { replace: true, state: { resetOk: true } })
    } catch {
      setError('Bağlantı geçersiz, süresi dolmuş veya zaten kullanılmış olabilir. Yeni istek oluştur.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Yeni şifre</h1>
        <p className="muted">Yeni şifren en az 8 karakter olsun.</p>
        {!tokenFromUrl && (
          <p className="error">
            Bağlantıda token yok. <Link to="/forgot-password">Şifremi unuttum</Link> sayfasından tekrar iste.
          </p>
        )}
        <form onSubmit={(e) => void onSubmit(e)} className="form">
          <label>
            Yeni şifre
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
            Yeni şifre (tekrar)
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
          <button type="submit" className="btn primary" disabled={busy || !tokenFromUrl}>
            {busy ? 'Kaydediliyor…' : 'Şifreyi güncelle'}
          </button>
        </form>
        <p className="muted small">
          <Link to="/login">← Giriş</Link>
        </p>
      </div>
      <SiteFooter variant="auth" />
    </div>
  )
}
