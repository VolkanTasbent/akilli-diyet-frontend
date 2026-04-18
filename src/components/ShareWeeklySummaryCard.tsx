import { useMemo, useState } from 'react'
import type { TrendRangeDto, WeeklyScoreDto } from '../types'

type Props = {
  displayName?: string
  weeklyScore: WeeklyScoreDto
  trends: TrendRangeDto | null
  streakDays?: number
}

type WeeklyMetrics = {
  avgCalories: number
  avgNetCalories: number
  avgWaterMl: number
  activeDays: number
  weightChangeText: string
}

function computeMetrics(trends: TrendRangeDto | null): WeeklyMetrics | null {
  if (!trends || trends.days.length === 0) return null
  const total = trends.days.length
  const sumCalories = trends.days.reduce((a, d) => a + d.calories, 0)
  const sumNet = trends.days.reduce((a, d) => a + (d.calories - d.exerciseCalories), 0)
  const sumWater = trends.days.reduce((a, d) => a + d.waterMl, 0)
  const activeDays = trends.days.filter((d) => d.calories > 0 || d.waterMl > 0 || d.exerciseCalories > 0).length
  const withWeight = trends.days.filter((d) => d.weightKg != null)
  let weightChangeText = 'Kilo verisi yok'
  if (withWeight.length >= 2) {
    const first = withWeight[0].weightKg as number
    const last = withWeight[withWeight.length - 1].weightKg as number
    const diff = Math.round((last - first) * 10) / 10
    const sign = diff > 0 ? '+' : ''
    weightChangeText = `${sign}${diff.toFixed(1)} kg`
  } else if (withWeight.length === 1) {
    weightChangeText = `${withWeight[0].weightKg?.toFixed(1)} kg (tek ölçüm)`
  }
  return {
    avgCalories: Math.round(sumCalories / total),
    avgNetCalories: Math.round(sumNet / total),
    avgWaterMl: Math.round(sumWater / total),
    activeDays,
    weightChangeText,
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('Görsel üretilemedi'))
      else resolve(blob)
    }, 'image/png')
  })
}

function buildShareCanvas(
  displayName: string,
  weeklyScore: WeeklyScoreDto,
  metrics: WeeklyMetrics | null,
  streakDays: number,
): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = 1080
  c.height = 1350
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('Canvas desteklenmiyor')

  const g = ctx.createLinearGradient(0, 0, 1080, 1350)
  g.addColorStop(0, '#0f766e')
  g.addColorStop(1, '#0b4f4a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, c.width, c.height)

  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.fillRect(60, 60, 960, 1230)

  ctx.fillStyle = '#e6fffa'
  ctx.font = '600 44px Inter, Arial, sans-serif'
  ctx.fillText('Akilli Diyet · Haftalik Ozet', 110, 160)

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 68px Inter, Arial, sans-serif'
  ctx.fillText(`${weeklyScore.score}/100`, 110, 270)
  ctx.font = '500 34px Inter, Arial, sans-serif'
  ctx.fillText(weeklyScore.periodLabelTr, 110, 320)

  ctx.font = '500 30px Inter, Arial, sans-serif'
  ctx.fillText(`Kullanici: ${displayName}`, 110, 390)
  ctx.fillText(`Kayit serisi: ${Math.max(0, streakDays)} gun`, 110, 435)

  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(110, 470)
  ctx.lineTo(970, 470)
  ctx.stroke()

  let y = 550
  const line = (label: string, value: string) => {
    ctx.fillStyle = '#ccfbf1'
    ctx.font = '500 29px Inter, Arial, sans-serif'
    ctx.fillText(label, 110, y)
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 33px Inter, Arial, sans-serif'
    ctx.fillText(value, 620, y)
    y += 86
  }

  if (metrics) {
    line('Gunluk ort. kalori', `${metrics.avgCalories} kcal`)
    line('Gunluk ort. net alim', `${metrics.avgNetCalories} kcal`)
    line('Gunluk ort. su', `${metrics.avgWaterMl} ml`)
    line('Aktif gun', `${metrics.activeDays} / 7`)
    line('Haftalik kilo degisimi', metrics.weightChangeText)
  }

  y += 15
  ctx.fillStyle = '#e6fffa'
  ctx.font = '600 33px Inter, Arial, sans-serif'
  ctx.fillText('Haftalik notlar', 110, y)
  y += 55

  const hints = (weeklyScore.hintsTr ?? []).slice(0, 3)
  hints.forEach((hint, idx) => {
    const maxLen = 62
    const text = hint.length > maxLen ? `${hint.slice(0, maxLen - 1)}…` : hint
    ctx.fillStyle = '#ffffff'
    ctx.font = '500 28px Inter, Arial, sans-serif'
    ctx.fillText(`${idx + 1}. ${text}`, 110, y)
    y += 52
  })

  ctx.fillStyle = 'rgba(230,255,250,0.95)'
  ctx.font = '500 24px Inter, Arial, sans-serif'
  ctx.fillText('akillidiyet.app', 110, 1245)
  ctx.fillText(new Date().toLocaleDateString('tr-TR'), 870, 1245)
  return c
}

export function ShareWeeklySummaryCard({ displayName, weeklyScore, trends, streakDays = 0 }: Props) {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const metrics = useMemo(() => computeMetrics(trends), [trends])

  async function onExport(mode: 'share' | 'download') {
    setBusy(true)
    setNote(null)
    try {
      const canvas = buildShareCanvas(displayName ?? 'Kullanici', weeklyScore, metrics, streakDays)
      const blob = await canvasToBlob(canvas)
      const filename = `haftalik-ozet-${new Date().toISOString().slice(0, 10)}.png`
      const file = new File([blob], filename, { type: 'image/png' })

      if (
        mode === 'share' &&
        navigator.share &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: 'Haftalik Ozet',
          text: 'Akilli Diyet haftalik ozetim',
          files: [file],
        })
        setNote('Ozet gorseli paylasildi.')
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
        setNote(mode === 'share' ? 'Paylasim desteklenmiyor; PNG indirildi.' : 'PNG indirildi.')
      }
    } catch {
      setNote('Gorsel olusturulamadi. Tekrar dene.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card share-card">
      <h2>Haftalik ozeti paylas</h2>
      <p className="muted small">
        Skor, haftalik ortalamalar ve oneriler tek gorselde toplanir. Sosyal medyada veya arkadaslarinla kolayca
        paylasabilirsin.
      </p>
      <div className="share-preview">
        <p>
          <strong>Skor:</strong> {weeklyScore.score}/100
        </p>
        {metrics && (
          <>
            <p>
              <strong>Ort. kalori:</strong> {metrics.avgCalories} kcal
            </p>
            <p>
              <strong>Ort. su:</strong> {metrics.avgWaterMl} ml
            </p>
          </>
        )}
      </div>
      <div className="share-actions">
        <button type="button" className="btn secondary" disabled={busy} onClick={() => onExport('download')}>
          PNG indir
        </button>
        <button type="button" className="btn primary" disabled={busy} onClick={() => onExport('share')}>
          {busy ? 'Hazirlaniyor…' : 'Paylas'}
        </button>
      </div>
      {note && <p className="muted small">{note}</p>}
    </section>
  )
}
