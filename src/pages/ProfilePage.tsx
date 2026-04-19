import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import api, { apiUrl } from '../api/client'
import { SiteFooter } from '../components/SiteFooter'
import { useAuth } from '../context/AuthContext'
import { useUserAvatarObjectUrl } from '../hooks/useUserAvatarObjectUrl'
import type { ActivityLevel, DietGoal, Gender, FoodResponse, UserResponse } from '../types'

type FoodEditDraft = {
  id: number
  name: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  tablespoonGrams: number | null
  sliceGrams: number | null
}

export function ProfilePage() {
  const { refreshUser, token, user, logout } = useAuth()
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<UserResponse>>({})
  const [customFoods, setCustomFoods] = useState<FoodResponse[]>([])
  const [foodBusy, setFoodBusy] = useState(false)
  const [foodErr, setFoodErr] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<FoodEditDraft | null>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)

  const mergedUser = user ? ({ ...user, ...form } as UserResponse) : null
  const avatarPreviewUrl = useUserAvatarObjectUrl(mergedUser, token)

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

  async function onAvatarFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !token) return
    setErr(null)
    setMsg(null)
    setAvatarBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(apiUrl('/api/me/avatar'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!res.ok) {
        const text = await res.text()
        setErr(text.trim() || 'Fotoğraf yüklenemedi.')
        return
      }
      const data = (await res.json()) as UserResponse
      setForm((f) => ({ ...f, hasAvatar: data.hasAvatar, avatarUpdatedAt: data.avatarUpdatedAt }))
      await refreshUser()
      setMsg('Profil fotoğrafı güncellendi.')
    } catch {
      setErr('Fotoğraf yüklenemedi.')
    } finally {
      setAvatarBusy(false)
    }
  }

  async function onRemoveAvatar() {
    if (!token) return
    setErr(null)
    setMsg(null)
    setAvatarBusy(true)
    try {
      const res = await fetch(apiUrl('/api/me/avatar'), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        setErr('Fotoğraf kaldırılamadı.')
        return
      }
      const data = (await res.json()) as UserResponse
      setForm((f) => ({ ...f, hasAvatar: data.hasAvatar, avatarUpdatedAt: data.avatarUpdatedAt }))
      await refreshUser()
      setMsg('Profil fotoğrafı kaldırıldı.')
    } catch {
      setErr('Fotoğraf kaldırılamadı.')
    } finally {
      setAvatarBusy(false)
    }
  }

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
      tablespoonGrams: f.tablespoonGrams ?? null,
      sliceGrams: f.sliceGrams ?? null,
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
        tablespoonGrams: editDraft.tablespoonGrams,
        sliceGrams: editDraft.sliceGrams,
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
    <div className="layout layout-dash">
      <header className="topbar topbar-dash">
        <div className="topbar-brand">
          {avatarPreviewUrl ? (
            <img src={avatarPreviewUrl} alt="" className="user-avatar user-avatar--sm" width={40} height={40} />
          ) : (
            <span className="brand-mark" aria-hidden />
          )}
          <div>
            <h1>Profil ve hedefler</h1>
            <p className="muted small topbar-tagline">
              <Link to="/">← Panele dön</Link>
            </p>
          </div>
        </div>
        <button type="button" className="btn ghost" onClick={logout}>
          Çıkış
        </button>
      </header>

      {err && <p className="error banner">{err}</p>}
      {msg && <p className="success banner">{msg}</p>}

      <header className="tab-panel-intro" aria-label="Profil özeti">
        <span className="tab-panel-kicker">Hesap</span>
        <p className="tab-panel-lead">Profil, hedefler ve özel besinler</p>
        <p className="tab-panel-desc muted small">
          Görünen isim, vücut ölçüleri ve diyet hedeflerin günlük özet ve koç önerilerinde kullanılır. Özel besinlerini
          buradan yönetirsin.
        </p>
      </header>

      <div className="grid profile-page-grid tab-panel-block">
        <div className="profile-page-primary">
      <section className="card profile-avatar-card">
        <h2>Profil fotoğrafı</h2>
        <p className="muted small">JPEG, PNG, WebP veya GIF; en fazla 2 MB.</p>
        <div className="profile-avatar-row">
          {avatarPreviewUrl ? (
            <img
              src={avatarPreviewUrl}
              alt="Profil"
              className="user-avatar user-avatar--lg"
              width={96}
              height={96}
            />
          ) : (
            <div className="user-avatar user-avatar--lg user-avatar--placeholder" aria-hidden>
              {(form.displayName ?? user?.displayName ?? '?').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="profile-avatar-actions">
            <label className="btn ghost small">
              {avatarBusy ? 'Yükleniyor…' : 'Fotoğraf seç'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="sr-only"
                disabled={avatarBusy}
                onChange={(ev) => void onAvatarFile(ev)}
              />
            </label>
            {(form.hasAvatar ?? user?.hasAvatar) && (
              <button
                type="button"
                className="btn ghost small"
                disabled={avatarBusy}
                onClick={() => void onRemoveAvatar()}
              >
                Kaldır
              </button>
            )}
          </div>
        </div>
      </section>

      <form className="card form profile-settings-form" onSubmit={onSubmit}>
        <h2 className="profile-card-heading">Kişisel bilgiler ve hedefler</h2>
        <p className="muted small profile-card-lead">
          Kalori hedefi ve makrolar bu bilgilere göre hesaplanır; istediğin zaman güncelleyebilirsin.
        </p>
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
                    {f.tablespoonGrams != null ? ` · 1yk ~${f.tablespoonGrams}g` : ''}
                    {f.sliceGrams != null ? ` · 1 dilim ~${f.sliceGrams}g` : ''}
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
            <div className="macro-inputs">
              <label>
                1 yk ~g (boş = yok)
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={editDraft.tablespoonGrams ?? ''}
                  onChange={(e) =>
                    setEditDraft((d) =>
                      d
                        ? {
                            ...d,
                            tablespoonGrams:
                              e.target.value === '' ? null : Number(e.target.value),
                          }
                        : d,
                    )
                  }
                />
              </label>
              <label>
                1 dilim ~g (boş = yok)
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={editDraft.sliceGrams ?? ''}
                  onChange={(e) =>
                    setEditDraft((d) =>
                      d ? { ...d, sliceGrams: e.target.value === '' ? null : Number(e.target.value) } : d,
                    )
                  }
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
      </div>
      <SiteFooter />
    </div>
  )
}
