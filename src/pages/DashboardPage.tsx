import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { RemindersPanel } from '../components/RemindersPanel'
import { ShareWeeklySummaryCard } from '../components/ShareWeeklySummaryCard'
import { WeightWeeklySummaryChart } from '../components/WeightWeeklySummaryChart'
import { WeeklyTrendChart } from '../components/WeeklyTrendChart'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import type {
  DailySummaryDto,
  ExerciseLogResponseDto,
  FoodLogResponseDto,
  FoodResponse,
  MealType,
  TrendRangeDto,
  WeeklyScoreDto,
} from '../types'

const MEAL_LABEL: Record<MealType, string> = {
  BREAKFAST: 'Kahvaltı',
  LUNCH: 'Öğle',
  DINNER: 'Akşam',
  SNACK: 'Ara öğün',
}

function localISODate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayISO() {
  return localISODate(new Date())
}

function trendRange(numDays: number) {
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - (numDays - 1))
  return { from: localISODate(from), to: localISODate(to) }
}

function addDaysISO(iso: string, deltaDays: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + deltaDays)
  return localISODate(dt)
}

function formatDayNavLabel(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function DashboardPage() {
  const { logout, user } = useAuth()
  const [summaryDate, setSummaryDate] = useState(() => todayISO())
  const [summary, setSummary] = useState<DailySummaryDto | null>(null)
  const [weeklyScore, setWeeklyScore] = useState<WeeklyScoreDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [foods, setFoods] = useState<FoodResponse[]>([])
  const [foodQuery, setFoodQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodResponse | null>(null)
  const [grams, setGrams] = useState(100)
  const [mealType, setMealType] = useState<MealType>('BREAKFAST')
  const [waterAdd, setWaterAdd] = useState(250)
  const [weightKg, setWeightKg] = useState(70)
  const [exerciseKcal, setExerciseKcal] = useState(200)
  const [exerciseLabel, setExerciseLabel] = useState('')
  const [exerciseRows, setExerciseRows] = useState<ExerciseLogResponseDto[]>([])
  const [sleepHours, setSleepHours] = useState(7.5)
  const [busy, setBusy] = useState(false)
  const [trends, setTrends] = useState<TrendRangeDto | null>(null)
  const [trendDays, setTrendDays] = useState<7 | 14 | 30>(7)
  const [weightTrends12w, setWeightTrends12w] = useState<TrendRangeDto | null>(null)
  const [foodLogs, setFoodLogs] = useState<FoodLogResponseDto[]>([])
  const [editingLog, setEditingLog] = useState<{
    id: number
    mealType: MealType
    grams: number
    foodId: number
    foodName: string
  } | null>(null)
  const [customName, setCustomName] = useState('')
  const [customKcal, setCustomKcal] = useState(200)
  const [customP, setCustomP] = useState(10)
  const [customC, setCustomC] = useState(20)
  const [customF, setCustomF] = useState(5)

  const load = useCallback(async () => {
    setError(null)
    const { data } = await api.get<DailySummaryDto>('/api/me/summary', {
      params: { date: summaryDate },
    })
    setSummary(data)
  }, [summaryDate])

  const loadWeeklyScore = useCallback(async () => {
    const { data } = await api.get<WeeklyScoreDto>('/api/me/weekly-score', {
      params: { endDate: todayISO() },
    })
    setWeeklyScore(data)
  }, [])

  const loadTrends = useCallback(async () => {
    const { from, to } = trendRange(trendDays)
    const { data } = await api.get<TrendRangeDto>('/api/me/trends', { params: { from, to } })
    setTrends(data)
  }, [trendDays])

  const loadWeightTrends12w = useCallback(async () => {
    const { from, to } = trendRange(84)
    const { data } = await api.get<TrendRangeDto>('/api/me/trends', { params: { from, to } })
    setWeightTrends12w(data)
  }, [])

  const loadExerciseRows = useCallback(async () => {
    const { data } = await api.get<ExerciseLogResponseDto[]>('/api/logs/exercise', {
      params: { date: summaryDate },
    })
    setExerciseRows(data)
  }, [summaryDate])

  const loadFoodLogs = useCallback(async () => {
    const { data } = await api.get<FoodLogResponseDto[]>('/api/logs/food', {
      params: { date: summaryDate },
    })
    setFoodLogs(data)
  }, [summaryDate])

  useEffect(() => {
    load().catch(() => setError('Özet yüklenemedi.'))
  }, [load])

  useEffect(() => {
    loadExerciseRows().catch(() => setExerciseRows([]))
  }, [loadExerciseRows])

  useEffect(() => {
    loadFoodLogs().catch(() => setFoodLogs([]))
  }, [loadFoodLogs])

  useEffect(() => {
    loadWeeklyScore().catch(() => {})
  }, [loadWeeklyScore, summaryDate, trendDays])

  useEffect(() => {
    loadTrends().catch(() => {})
  }, [loadTrends])

  useEffect(() => {
    loadWeightTrends12w().catch(() => setWeightTrends12w(null))
  }, [loadWeightTrends12w, user?.targetWeightKg])

  useEffect(() => {
    if (user?.weightKg != null) setWeightKg(user.weightKg)
  }, [user?.weightKg])

  useEffect(() => {
    if (summary?.sleepHours != null) setSleepHours(summary.sleepHours)
  }, [summary?.sleepHours])

  useEffect(() => {
    const h = window.setTimeout(() => {
      api
        .get<FoodResponse[]>('/api/foods', { params: { q: foodQuery } })
        .then((r) => setFoods(r.data))
        .catch(() => setFoods([]))
    }, 250)
    return () => window.clearTimeout(h)
  }, [foodQuery])

  async function onAddFood(e: FormEvent) {
    e.preventDefault()
    if (!selectedFood) return
    setBusy(true)
    try {
      await api.post('/api/logs/food', {
        date: summaryDate,
        mealType,
        foodId: selectedFood.id,
        grams,
      })
      setSelectedFood(null)
      await Promise.all([load(), loadTrends(), loadWeeklyScore(), loadExerciseRows(), loadFoodLogs()])
    } catch {
      setError('Öğün eklenemedi.')
    } finally {
      setBusy(false)
    }
  }

  async function onCreateCustomFood(e: FormEvent) {
    e.preventDefault()
    const name = customName.trim()
    if (name.length < 2) {
      setError('Özel besin adı en az 2 karakter olsun.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await api.post('/api/foods', {
        name,
        caloriesPer100g: customKcal,
        proteinPer100g: customP,
        carbsPer100g: customC,
        fatPer100g: customF,
      })
      setCustomName('')
      setFoodQuery(name)
      await Promise.all([loadFoodLogs()])
    } catch {
      setError('Özel besin kaydedilemedi.')
    } finally {
      setBusy(false)
    }
  }

  async function onDeleteFoodLog(id: number) {
    setBusy(true)
    setError(null)
    try {
      await api.delete(`/api/logs/food/${id}`)
      if (editingLog?.id === id) {
        setEditingLog(null)
        setSelectedFood(null)
      }
      await Promise.all([load(), loadTrends(), loadWeeklyScore(), loadFoodLogs()])
    } catch {
      setError('Besin kaydı silinemedi.')
    } finally {
      setBusy(false)
    }
  }

  async function onSaveFoodLogEdit(e: FormEvent) {
    e.preventDefault()
    if (!editingLog) return
    const foodId = selectedFood?.id ?? editingLog.foodId
    setBusy(true)
    setError(null)
    try {
      await api.patch(`/api/logs/food/${editingLog.id}`, {
        date: summaryDate,
        mealType: editingLog.mealType,
        foodId,
        grams: editingLog.grams,
      })
      setEditingLog(null)
      setSelectedFood(null)
      await Promise.all([load(), loadTrends(), loadWeeklyScore(), loadFoodLogs()])
    } catch {
      setError('Kayıt güncellenemedi.')
    } finally {
      setBusy(false)
    }
  }

  async function onAddWater(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/api/logs/water', { date: summaryDate, addMl: waterAdd })
      await Promise.all([load(), loadTrends(), loadWeeklyScore(), loadExerciseRows()])
    } catch {
      setError('Su kaydı eklenemedi.')
    } finally {
      setBusy(false)
    }
  }

  async function onLogExercise(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/api/logs/exercise', {
        date: summaryDate,
        caloriesBurned: exerciseKcal,
        label: exerciseLabel.trim() || undefined,
      })
      setExerciseLabel('')
      await Promise.all([load(), loadTrends(), loadWeeklyScore(), loadExerciseRows()])
    } catch {
      setError('Egzersiz kaydı eklenemedi.')
    } finally {
      setBusy(false)
    }
  }

  async function onDeleteExercise(id: number) {
    setBusy(true)
    try {
      await api.delete(`/api/logs/exercise/${id}`)
      await Promise.all([load(), loadTrends(), loadWeeklyScore(), loadExerciseRows()])
    } catch {
      setError('Egzersiz silinemedi.')
    } finally {
      setBusy(false)
    }
  }

  async function onLogSleep(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/api/logs/sleep', { date: summaryDate, hoursSlept: sleepHours })
      await Promise.all([load(), loadTrends(), loadWeeklyScore(), loadExerciseRows()])
    } catch {
      setError('Uyku kaydı eklenemedi.')
    } finally {
      setBusy(false)
    }
  }

  async function onLogWeight(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/api/logs/weight', { date: summaryDate, weightKg })
      await Promise.all([
        load(),
        loadTrends(),
        loadWeightTrends12w(),
        loadWeeklyScore(),
        loadExerciseRows(),
      ])
    } catch {
      setError('Kilo kaydedilemedi.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="layout">
      <header className="topbar">
        <div>
          <h1>Akıllı diyet</h1>
          <p className="muted small">
            Merhaba, {user?.displayName} · <Link to="/profile">Profil & hedefler</Link>
          </p>
        </div>
        <button type="button" className="btn ghost" onClick={logout}>
          Çıkış
        </button>
      </header>

      {error && <p className="error banner">{error}</p>}

      <RemindersPanel />

      {weeklyScore && (
        <>
          <section className="card score-card">
            <div className="score-row">
              <div>
                <h2 className="score-title">Haftalık başarı</h2>
                <p className="muted small">{weeklyScore.periodLabelTr} (bugüne kadar 7 gün)</p>
              </div>
              <div className="score-circle" aria-label={`Skor ${weeklyScore.score}`}>
                <span className="score-num">{weeklyScore.score}</span>
                <span className="score-max">/100</span>
              </div>
            </div>
            <ul className="list">
              {weeklyScore.hintsTr.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </section>
          <ShareWeeklySummaryCard
            displayName={user?.displayName}
            weeklyScore={weeklyScore}
            trends={trends}
            streakDays={summary?.logStreakDays ?? 0}
          />
        </>
      )}

      {trends && trends.days.length > 0 && (
        <section className="card trend-card">
          <div className="trend-head">
            <h2>Trend</h2>
            <div className="segmented" role="group" aria-label="Gün aralığı">
              {([7, 14, 30] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={trendDays === n ? 'seg active' : 'seg'}
                  onClick={() => setTrendDays(n)}
                >
                  {n} gün
                </button>
              ))}
            </div>
          </div>
          <p className="muted small">
            {trends.from} — {trends.to} · hedef ~{trends.targetCalories} kcal / gün
          </p>
          <WeeklyTrendChart trends={trends} />
        </section>
      )}

      {weightTrends12w && (
        <section className="card weight-weekly-card">
          <h2>Kilo — haftalık özet</h2>
          <p className="muted small">
            Son 12 hafta ({weightTrends12w.from} — {weightTrends12w.to}). Haftalık <strong>ortalama</strong>,{' '}
            <strong>min–max bant</strong> ve haftanın <strong>son ölçümü</strong> birlikte gösterilir.
          </p>
          <WeightWeeklySummaryChart trends={weightTrends12w} />
        </section>
      )}

      {summary && (
        <div className="grid">
          <section className="card">
            <div className="day-nav">
              <button
                type="button"
                className="btn ghost day-nav-btn"
                onClick={() => setSummaryDate((d) => addDaysISO(d, -1))}
                aria-label="Önceki gün"
              >
                ←
              </button>
              <div className="day-nav-center">
                <h2 className="day-nav-title">
                  {summaryDate === todayISO() ? 'Bugünkü özet' : 'Özet'}
                </h2>
                <p className="muted small day-nav-date">{formatDayNavLabel(summaryDate)}</p>
              </div>
              <button
                type="button"
                className="btn ghost day-nav-btn"
                disabled={summaryDate >= todayISO()}
                onClick={() => setSummaryDate((d) => addDaysISO(d, 1))}
                aria-label="Sonraki gün"
              >
                →
              </button>
            </div>
            <p className="muted small">
              {summaryDate < todayISO()
                ? 'Geçmiş güne bakıyorsun; yeni kayıtlar seçili güne yazılır.'
                : 'Kayıtlar bugüne eklenir.'}
            </p>
            {summaryDate !== todayISO() && (
              <button type="button" className="btn-link" onClick={() => setSummaryDate(todayISO())}>
                Bugüne dön
              </button>
            )}
            <p className="stat">
              <span className="stat-label">Alınan (yemek)</span>
              <span className="stat-value">
                {summary.consumedCalories} / {summary.targets.targetCalories} kcal
              </span>
            </p>
            {summary.exerciseCaloriesBurned > 0 && (
              <p className="stat">
                <span className="stat-label">Egzersiz (yakılan)</span>
                <span className="stat-value">−{summary.exerciseCaloriesBurned} kcal</span>
              </p>
            )}
            <p className="stat">
              <span className="stat-label">Net alım</span>
              <span className="stat-value">{summary.netEnergyCalories} kcal</span>
            </p>
            <p className="stat">
              <span className="stat-label">Kalan bütçe</span>
              <span className="stat-value">{summary.caloriesRemaining} kcal</span>
            </p>
            <p className="muted small">{summary.targets.explanationTr}</p>
            <div className="macro-row">
              <div>
                <span className="macro-title">Protein</span>
                <strong>
                  {summary.proteinG}g / {summary.targets.targetProteinG}g
                </strong>
              </div>
              <div>
                <span className="macro-title">Karbonhidrat</span>
                <strong>
                  {summary.carbsG}g / {summary.targets.targetCarbsG}g
                </strong>
              </div>
              <div>
                <span className="macro-title">Yağ</span>
                <strong>
                  {summary.fatG}g / {summary.targets.targetFatG}g
                </strong>
              </div>
            </div>
            <p className="stat">
              <span className="stat-label">Su</span>
              <span className="stat-value">
                {summary.waterMl} ml / {summary.waterGoalMl} ml
              </span>
            </p>
            <p className="stat">
              <span className="stat-label">Uyku</span>
              <span className="stat-value">
                {summary.sleepHours != null ? `${summary.sleepHours} saat` : '—'}
              </span>
            </p>
            <p className="stat streak-row">
              <span className="stat-label">Kayıt serisi</span>
              <span className="stat-value streak-badge">
                {(summary.logStreakDays ?? 0) > 0
                  ? `${summary.logStreakDays} gün`
                  : 'Başlangıç — bugün kayıt ekle'}
              </span>
            </p>
            <p className="muted small streak-hint">
              Ardışık günlerde yemek, su, egzersiz, kilo veya uyku kaydı tuttuğunda artar (dün ve öncesi sayılır).
            </p>
            <h3 className="h3">Günlük mini görevler</h3>
            <ul className="task-list">
              {(summary.dailyTasks ?? []).map((t) => (
                <li key={t.id} className={t.done ? 'task done' : 'task'}>
                  <span className="task-mark">{t.done ? '✓' : '○'}</span>
                  <span>{t.labelTr}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2>Koç mesajları</h2>
            <ul className="list">
              {summary.coachMessagesTr.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            {summary.suggestionsTr.length > 0 && (
              <>
                <h3 className="h3">Öneriler</h3>
                <ul className="list">
                  {summary.suggestionsTr.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="card">
            <h2>Öğünlere göre</h2>
            <div className="meal-grid">
              {(Object.keys(MEAL_LABEL) as MealType[]).map((k) => (
                <div key={k} className="meal-pill">
                  <div className="meal-name">{MEAL_LABEL[k]}</div>
                  <div className="meal-kcal">{summary.byMeal[k].calories} kcal</div>
                  <div className="muted small">
                    P {summary.byMeal[k].proteinG}g · K {summary.byMeal[k].carbsG}g · Y{' '}
                    {summary.byMeal[k].fatG}g
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>Öğün ekle</h2>
            <h3 className="h3">Özel besin (100 g)</h3>
            <form onSubmit={onCreateCustomFood} className="form compact food-custom-form">
              <label>
                Ad
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="örn. Anne kurabiyesi"
                  maxLength={200}
                />
              </label>
              <div className="macro-inputs">
                <label>
                  kcal
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={customKcal}
                    onChange={(e) => setCustomKcal(Number(e.target.value))}
                  />
                </label>
                <label>
                  P g
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={customP}
                    onChange={(e) => setCustomP(Number(e.target.value))}
                  />
                </label>
                <label>
                  K g
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={customC}
                    onChange={(e) => setCustomC(Number(e.target.value))}
                  />
                </label>
                <label>
                  Y g
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={customF}
                    onChange={(e) => setCustomF(Number(e.target.value))}
                  />
                </label>
              </div>
              <button type="submit" className="btn secondary" disabled={busy}>
                Özel besini kaydet
              </button>
            </form>
            <p className="muted small">Kaydettikten sonra aşağıdan arayıp günlüğe ekleyebilirsin.</p>

            <form onSubmit={onAddFood} className="form compact">
              <label>
                Besin ara
                <input value={foodQuery} onChange={(e) => setFoodQuery(e.target.value)} />
              </label>
              {foods.length > 0 && (
                <div className="food-pick">
                  {foods.slice(0, 8).map((f) => (
                    <button
                      type="button"
                      key={f.id}
                      className={selectedFood?.id === f.id ? 'chip active' : 'chip'}
                      onClick={() => {
                        setSelectedFood(f)
                        if (editingLog) {
                          setEditingLog({ ...editingLog, foodId: f.id, foodName: f.name })
                        }
                      }}
                    >
                      {f.custom ? '★ ' : ''}
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
              {selectedFood && (
                <p className="muted small">
                  Seçili: {selectedFood.name} — {selectedFood.caloriesPer100g} kcal / 100g
                  {selectedFood.tablespoonGrams != null
                    ? ` · 1 yemek kaşığı ~${selectedFood.tablespoonGrams} g`
                    : ''}
                </p>
              )}
              <label>
                Öğün
                <select value={mealType} onChange={(e) => setMealType(e.target.value as MealType)}>
                  {(Object.keys(MEAL_LABEL) as MealType[]).map((k) => (
                    <option key={k} value={k}>
                      {MEAL_LABEL[k]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Gram
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={grams}
                  onChange={(e) => setGrams(Number(e.target.value))}
                />
              </label>
              <button type="submit" className="btn primary" disabled={busy || !selectedFood}>
                Kaydet
              </button>
            </form>

            <h3 className="h3">Seçili güne ait besin kayıtları</h3>
            {foodLogs.length === 0 ? (
              <p className="muted small">Bu gün için henüz besin kaydı yok.</p>
            ) : (
              <ul className="food-log-list">
                {foodLogs.map((row) => (
                  <li key={row.id} className="food-log-item">
                    {editingLog?.id === row.id ? (
                      <form onSubmit={onSaveFoodLogEdit} className="food-log-edit form compact">
                        <span className="muted small">
                          Besin: {selectedFood?.name ?? editingLog.foodName}
                        </span>
                        <label>
                          Öğün
                          <select
                            value={editingLog.mealType}
                            onChange={(e) =>
                              setEditingLog({
                                ...editingLog,
                                mealType: e.target.value as MealType,
                              })
                            }
                          >
                            {(Object.keys(MEAL_LABEL) as MealType[]).map((k) => (
                              <option key={k} value={k}>
                                {MEAL_LABEL[k]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Gram
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={editingLog.grams}
                            onChange={(e) =>
                              setEditingLog({
                                ...editingLog,
                                grams: Number(e.target.value),
                              })
                            }
                          />
                        </label>
                        <p className="muted small">Besini değiştirmek için yukarıdan ara ve seç.</p>
                        <div className="food-log-actions">
                          <button type="submit" className="btn primary small" disabled={busy}>
                            Güncelle
                          </button>
                          <button
                            type="button"
                            className="btn ghost small"
                            disabled={busy}
                            onClick={() => {
                              setEditingLog(null)
                              setSelectedFood(null)
                            }}
                          >
                            Vazgeç
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="food-log-main">
                          <strong>{MEAL_LABEL[row.mealType]}</strong>
                          <span>
                            {' '}
                            · {row.foodName} · {row.grams} g · ~{row.caloriesEstimate} kcal
                          </span>
                        </div>
                        <div className="food-log-actions">
                          <button
                            type="button"
                            className="btn ghost small"
                            disabled={busy}
                            onClick={() => {
                              setEditingLog({
                                id: row.id,
                                mealType: row.mealType,
                                grams: row.grams,
                                foodId: row.foodId,
                                foodName: row.foodName,
                              })
                              setSelectedFood(null)
                              setFoodQuery(row.foodName)
                            }}
                          >
                            Düzenle
                          </button>
                          <button
                            type="button"
                            className="btn ghost small"
                            disabled={busy}
                            onClick={() => onDeleteFoodLog(row.id)}
                          >
                            Sil
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <h3 className="h3">Egzersiz</h3>
            <form onSubmit={onLogExercise} className="form compact">
              <label>
                Yakılan kcal (tahmini)
                <input
                  type="number"
                  min={1}
                  max={4000}
                  step={1}
                  value={exerciseKcal}
                  onChange={(e) => setExerciseKcal(Number(e.target.value))}
                />
              </label>
              <label>
                Not (isteğe bağlı)
                <input
                  value={exerciseLabel}
                  onChange={(e) => setExerciseLabel(e.target.value)}
                  placeholder="örn. Koşu 30 dk"
                  maxLength={120}
                />
              </label>
              <button type="submit" className="btn secondary" disabled={busy}>
                Egzersiz ekle
              </button>
            </form>
            {exerciseRows.length > 0 && (
              <ul className="exercise-list">
                {exerciseRows.map((row) => (
                  <li key={row.id} className="exercise-list-item">
                    <span>
                      <strong>{row.caloriesBurned} kcal</strong>
                      {row.label ? ` · ${row.label}` : ''}
                    </span>
                    <button
                      type="button"
                      className="btn ghost small"
                      disabled={busy}
                      onClick={() => onDeleteExercise(row.id)}
                    >
                      Sil
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="muted small">Birden fazla kayıt ekleyebilirsin; gün toplamı özette görünür.</p>

            <h3 className="h3">Uyku</h3>
            <form onSubmit={onLogSleep} className="form compact">
              <label>
                Süre (saat)
                <input
                  type="number"
                  min={0.5}
                  max={24}
                  step={0.5}
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                />
              </label>
              <button type="submit" className="btn secondary" disabled={busy}>
                Uykuyu kaydet
              </button>
            </form>
            <p className="muted small">Seçili güne yazar; aynı günü tekrar kaydedersen güncellenir.</p>

            <h3 className="h3">Su ekle</h3>
            <form onSubmit={onAddWater} className="form row">
              <label>
                ml
                <input
                  type="number"
                  min={50}
                  step={50}
                  value={waterAdd}
                  onChange={(e) => setWaterAdd(Number(e.target.value))}
                />
              </label>
              <button type="submit" className="btn secondary" disabled={busy}>
                + Ekle
              </button>
            </form>

            <h3 className="h3">Kilo (bugün)</h3>
            <form onSubmit={onLogWeight} className="form row">
              <label>
                kg
                <input
                  type="number"
                  min={30}
                  max={250}
                  step={0.1}
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                />
              </label>
              <button type="submit" className="btn secondary" disabled={busy}>
                Kaydet
              </button>
            </form>
            <p className="muted small">Aynı güne tekrar kaydedersen değer güncellenir.</p>
          </section>
        </div>
      )}
    </div>
  )
}
