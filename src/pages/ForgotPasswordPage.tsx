import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { SiteFooter } from '../components/SiteFooter'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api.post('/api/auth/forgot-password', { email: email.trim() })
      setDone(true)
    } catch {
      setError('İstek gönderilemedi. Bağlantını kontrol edip tekrar dene.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Şifremi unuttum</h1>
        {done ? (
          <>
            <p className="muted">
              Bu e-posta adresine kayıtlı bir hesabın varsa, şifre sıfırlama bağlantısı gönderildi (veya geliştirme
              ortamında bağlantı sunucu günlüğüne yazıldı).
            </p>
            <p className="muted small">
              E-postayı görmüyorsan spam klasörüne bak. Bağlantı yaklaşık <strong>1 saat</strong> geçerlidir.
            </p>
            <p className="muted small">
              <Link to="/login">Girişe dön</Link>
            </p>
          </>
        ) : (
          <>
            <p className="muted">Hesabında kayıtlı e-postayı yaz; sana sıfırlama bağlantısı gönderelim.</p>
            <form onSubmit={(e) => void onSubmit(e)} className="form">
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
              {error && <p className="error">{error}</p>}
              <button type="submit" className="btn primary" disabled={busy}>
                {busy ? 'Gönderiliyor…' : 'Bağlantı gönder'}
              </button>
            </form>
            <p className="muted small">
              <Link to="/login">← Giriş</Link>
            </p>
          </>
        )}
      </div>
      <SiteFooter variant="auth" />
    </div>
  )
}
