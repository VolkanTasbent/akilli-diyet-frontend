import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { ActivityLevel, DietGoal, Gender, UserResponse } from '../types'

export function ProfilePage() {
  const { refreshUser } = useAuth()
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<UserResponse>>({})

  useEffect(() => {
    api
      .get<UserResponse>('/api/me')
      .then((r) => setForm(r.data))
      .catch(() => setErr('Profil yüklenemedi.'))
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    try {
      await api.patch('/api/me', {
        displayName: form.displayName,
        heightCm: form.heightCm,
        weightKg: form.weightKg,
        age: form.age,
        gender: form.gender,
        activityLevel: form.activityLevel,
        dietGoal: form.dietGoal,
        targetWeightKg: form.targetWeightKg,
        goalDurationWeeks: form.goalDurationWeeks,
        city: form.city,
        studentMode: form.studentMode,
        dailyWaterGoalMl: form.dailyWaterGoalMl,
      })
      await refreshUser()
      setMsg('Profil güncellendi.')
    } catch {
      setErr('Kaydedilemedi.')
    }
  }

  return (
    <div className="layout narrow">
      <header className="topbar">
        <div>
          <h1>Profil & hedefler</h1>
          <p className="muted small">
            <Link to="/">← Panele dön</Link>
          </p>
        </div>
      </header>

      {err && <p className="error banner">{err}</p>}
      {msg && <p className="success banner">{msg}</p>}

      <form className="card form" onSubmit={onSubmit}>
        <label>
          Görünen isim
          <input
            value={form.displayName ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
          />
        </label>
        <div className="two-col">
          <label>
            Boy (cm)
            <input
              type="number"
              step={0.1}
              value={form.heightCm ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, heightCm: e.target.value ? Number(e.target.value) : null }))
              }
            />
          </label>
          <label>
            Kilo (kg)
            <input
              type="number"
              step={0.1}
              value={form.weightKg ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, weightKg: e.target.value ? Number(e.target.value) : null }))
              }
            />
          </label>
        </div>
        <div className="two-col">
          <label>
            Yaş
            <input
              type="number"
              value={form.age ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, age: e.target.value ? Number(e.target.value) : null }))
              }
            />
          </label>
          <label>
            Cinsiyet
            <select
              value={form.gender ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  gender: (e.target.value || null) as Gender | null,
                }))
              }
            >
              <option value="">—</option>
              <option value="MALE">Erkek</option>
              <option value="FEMALE">Kadın</option>
            </select>
          </label>
        </div>
        <label>
          Aktivite
          <select
            value={form.activityLevel ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                activityLevel: (e.target.value || null) as ActivityLevel | null,
              }))
            }
          >
            <option value="">—</option>
            <option value="SEDENTARY">Hareketsiz</option>
            <option value="LIGHT">Hafif aktif</option>
            <option value="MODERATE">Orta aktif</option>
            <option value="ACTIVE">Çok aktif</option>
            <option value="VERY_ACTIVE">Aşırı aktif</option>
          </select>
        </label>
        <label>
          Diyet hedefi
          <select
            value={form.dietGoal ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                dietGoal: (e.target.value || null) as DietGoal | null,
              }))
            }
          >
            <option value="">—</option>
            <option value="LOSE_WEIGHT">Kilo verme</option>
            <option value="MAINTAIN">Koruma</option>
            <option value="GAIN_MUSCLE">Kas kütlesi artırma</option>
          </select>
        </label>
        <div className="two-col">
          <label>
            Hedef kilo (kg)
            <input
              type="number"
              step={0.1}
              value={form.targetWeightKg ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  targetWeightKg: e.target.value ? Number(e.target.value) : null,
                }))
              }
            />
          </label>
          <label>
            Hedef süre (hafta)
            <input
              type="number"
              value={form.goalDurationWeeks ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  goalDurationWeeks: e.target.value ? Number(e.target.value) : null,
                }))
              }
            />
          </label>
        </div>
        <label>
          Şehir
          <input
            value={form.city ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={!!form.studentMode}
            onChange={(e) => setForm((f) => ({ ...f, studentMode: e.target.checked }))}
          />
          Öğrenci modu (ileride ucuz protein önerileri için)
        </label>
        <label>
          Günlük su hedefi (ml)
          <input
            type="number"
            step={100}
            value={form.dailyWaterGoalMl ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                dailyWaterGoalMl: e.target.value ? Number(e.target.value) : null,
              }))
            }
          />
        </label>
        <button type="submit" className="btn primary">
          Kaydet
        </button>
      </form>
    </div>
  )
}
