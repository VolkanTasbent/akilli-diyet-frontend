import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { ActivityLevel, DietGoal, Gender, FoodResponse, UserResponse } from '../types'

type FoodEditDraft = {
  id: number
  name: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
}

export function ProfilePage() {
  const { refreshUser } = useAuth()
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<UserResponse>>({})
  const [customFoods, setCustomFoods] = useState<FoodResponse[]>([])
  const [foodBusy, setFoodBusy] = useState(false)
  const [foodErr, setFoodErr] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<FoodEditDraft | null>(null)

  const loadCustomFoods = useCallback(async () => {
    const { data } = await api.get<FoodResponse[]>('/api/foods/mine')
    setCustomFoods(data)
  }, [])

  useEffect(() => {
    api
      .get<UserResponse>('/api/me')
      .then((r) => setForm(r.data))
      .catch(() => setErr('Profil yüklenemedi.'))
  }, [])

  useEffect(() => {
    loadCustomFoods().catch(() => setCustomFoods([]))
  }, [loadCustomFoods])

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

  function startFoodEdit(f: FoodResponse) {
    setFoodErr(null)
    setEditDraft({
      id: f.id,
      name: f.name,
      caloriesPer100g: f.caloriesPer100g,
      proteinPer100g: f.proteinPer100g,
      carbsPer100g: f.carbsPer100g,
      fatPer100g: f.fatPer100g,
    })
  }

  async function onSaveFoodEdit(e: FormEvent) {
    e.preventDefault()
    if (!editDraft || editDraft.name.trim().length < 2) {
      setFoodErr('Besin adı en az 2 karakter olsun.')
      return
    }
    setFoodBusy(true)
    setFoodErr(null)
    try {
      await api.put(`/api/foods/${editDraft.id}`, {
        name: editDraft.name.trim(),
        caloriesPer100g: editDraft.caloriesPer100g,
        proteinPer100g: editDraft.proteinPer100g,
        carbsPer100g: editDraft.carbsPer100g,
        fatPer100g: editDraft.fatPer100g,
      })
      setEditDraft(null)
      await loadCustomFoods()
      setMsg('Özel besin güncellendi.')
    } catch {
      setFoodErr('Besin güncellenemedi.')
    } finally {
      setFoodBusy(false)
    }
  }

  async function onDeleteFood(f: FoodResponse) {
    if (f.usedInLogs) return
    setFoodBusy(true)
    setFoodErr(null)
    try {
      await api.delete(`/api/foods/${f.id}`)
      if (editDraft?.id === f.id) setEditDraft(null)
      await loadCustomFoods()
      setMsg('Özel besin silindi.')
    } catch (ex: unknown) {
      const status = (ex as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        setFoodErr('Bu besin günlük kayıtlarında kullanılıyor; önce kayıtları kaldır.')
      } else {
        setFoodErr('Besin silinemedi.')
      }
    } finally {
      setFoodBusy(false)
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

      <section className="card food-mine-section">
        <h2>Özel besinlerim</h2>
        <p className="muted small">
          Panelde eklediğin besinleri burada düzenleyebilir veya silebilirsin. Günlükte kullanılan besin önce
          kayıttan çıkarılmalıdır.
        </p>
        {foodErr && <p className="error banner">{foodErr}</p>}
        {customFoods.length === 0 ? (
          <p className="muted small">Henüz özel besin yok; panelden &quot;Özel besin&quot; ile ekleyebilirsin.</p>
        ) : (
          <ul className="food-mine-list">
            {customFoods.map((f) => (
              <li key={f.id} className="food-mine-row">
                <div className="food-mine-info">
                  <strong>{f.name}</strong>
                  <span className="muted small">
                    {' '}
                    · {Math.round(f.caloriesPer100g)} kcal / 100g · P {f.proteinPer100g} · K {f.carbsPer100g} · Y{' '}
                    {f.fatPer100g}
                    {f.usedInLogs ? ' · günlükte kullanılıyor' : ''}
                  </span>
                </div>
                <div className="food-mine-actions">
                  <button
                    type="button"
                    className="btn ghost small"
                    disabled={foodBusy}
                    onClick={() => startFoodEdit(f)}
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    className="btn ghost small"
                    disabled={foodBusy || !!f.usedInLogs}
                    title={f.usedInLogs ? 'Önce günlük kayıtlarını kaldır' : undefined}
                    onClick={() => void onDeleteFood(f)}
                  >
                    Sil
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {editDraft && (
          <form className="form compact food-mine-edit" onSubmit={(e) => void onSaveFoodEdit(e)}>
            <h3 className="h3">Düzenle</h3>
            <label>
              Ad
              <input
                value={editDraft.name}
                onChange={(e) => setEditDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                maxLength={200}
              />
            </label>
            <div className="macro-inputs">
              <label>
                kcal / 100g
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={editDraft.caloriesPer100g}
                  onChange={(e) =>
                    setEditDraft((d) => (d ? { ...d, caloriesPer100g: Number(e.target.value) } : d))
                  }
                />
              </label>
              <label>
                P
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={editDraft.proteinPer100g}
                  onChange={(e) =>
                    setEditDraft((d) => (d ? { ...d, proteinPer100g: Number(e.target.value) } : d))
                  }
                />
              </label>
              <label>
                K
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={editDraft.carbsPer100g}
                  onChange={(e) =>
                    setEditDraft((d) => (d ? { ...d, carbsPer100g: Number(e.target.value) } : d))
                  }
                />
              </label>
              <label>
                Y
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={editDraft.fatPer100g}
                  onChange={(e) => setEditDraft((d) => (d ? { ...d, fatPer100g: Number(e.target.value) } : d))}
                />
              </label>
            </div>
            <div className="food-mine-actions">
              <button type="submit" className="btn primary small" disabled={foodBusy}>
                Kaydet
              </button>
              <button
                type="button"
                className="btn ghost small"
                disabled={foodBusy}
                onClick={() => setEditDraft(null)}
              >
                Vazgeç
              </button>
            </div>
          </form>
        )}
      </section>

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
