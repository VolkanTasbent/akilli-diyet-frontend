/** Pazartesi (hafta başı) ISO tarihi yyyy-MM-dd */
export function mondayOfWeek(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const day = (dt.getDay() + 6) % 7
  dt.setDate(dt.getDate() - day)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export function formatWeekStartTr(isoMonday: string): string {
  const [y, m, d] = isoMonday.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

export type WeeklyWeightStats = {
  weekStart: string
  label: string
  /** Hafta içi tüm ölçümlerin ortalaması */
  avgKg: number
  /** Hafta içi kronolojik son ölçüm */
  lastKg: number
  minKg: number
  maxKg: number
  count: number
}

/** Günler kronolojik sırada; hafta başına özet (ortalama, son, min, max). */
export function weeklyWeightStats(days: { date: string; weightKg: number | null }[]): WeeklyWeightStats[] {
  const byWeek = new Map<string, number[]>()
  for (const day of days) {
    if (day.weightKg == null) continue
    const wk = mondayOfWeek(day.date)
    const arr = byWeek.get(wk) ?? []
    arr.push(day.weightKg)
    byWeek.set(wk, arr)
  }
  return Array.from(byWeek.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, weights]) => {
      const sum = weights.reduce((s, w) => s + w, 0)
      const avg = sum / weights.length
      const min = Math.min(...weights)
      const max = Math.max(...weights)
      const last = weights[weights.length - 1] ?? min
      return {
        weekStart,
        label: formatWeekStartTr(weekStart),
        avgKg: Math.round(avg * 10) / 10,
        lastKg: Math.round(last * 10) / 10,
        minKg: Math.round(min * 10) / 10,
        maxKg: Math.round(max * 10) / 10,
        count: weights.length,
      }
    })
}
