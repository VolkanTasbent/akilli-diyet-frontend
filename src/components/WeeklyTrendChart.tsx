import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TrendRangeDto } from '../types'

type Props = {
  trends: TrendRangeDto
}

type ChartRow = {
  label: string
  netCalories: number
  grossCalories: number
  exercise: number
  weight?: number
  protein: number
  water: number
  sleepHours?: number
}

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: ChartRow }[]
}) {
  if (!active || !payload?.length) return null
  const pt = payload[0].payload
  return (
    <div
      style={{
        borderRadius: 10,
        border: '1px solid #e2e8f0',
        background: '#fff',
        padding: '0.5rem 0.65rem',
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{pt.label}</div>
      <div>Net alım: {pt.netCalories} kcal</div>
      <div>Brüt (yemek): {pt.grossCalories} kcal</div>
      <div>Egzersiz: {pt.exercise} kcal</div>
      {pt.weight != null && <div>Kilo: {pt.weight} kg</div>}
      {pt.sleepHours != null && <div>Uyku: {pt.sleepHours} saat</div>}
      <div>Protein: {pt.protein} g</div>
      <div>Su: {pt.water} ml</div>
    </div>
  )
}

export function WeeklyTrendChart({ trends }: Props) {
  const hasWeight = trends.days.some((d) => d.weightKg != null)
  const targetKg = trends.targetWeightKg
  const showTargetWeightLine = hasWeight && targetKg != null
  const hasSleep = trends.days.some((d) => d.sleepHours != null && d.sleepHours > 0)
  const showSleepLine = hasSleep && !hasWeight

  const data: ChartRow[] = trends.days.map((d) => {
    const ex = d.exerciseCalories ?? 0
    const net = Math.max(0, d.calories - ex)
    const row: ChartRow = {
      label: d.date.slice(8, 10) + '.' + d.date.slice(5, 7),
      netCalories: net,
      grossCalories: d.calories,
      exercise: ex,
      weight: d.weightKg ?? undefined,
      protein: d.proteinG,
      water: d.waterMl,
    }
    if (d.sleepHours != null) {
      row.sleepHours = d.sleepHours
    }
    return row
  })

  const sleepLogged = trends.days.filter((d) => d.sleepHours != null)
  const sleepAvg =
    sleepLogged.length > 0
      ? (sleepLogged.reduce((s, d) => s + (d.sleepHours as number), 0) / sleepLogged.length).toFixed(1)
      : null

  return (
    <div className="trend-chart-wrap">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart
          data={data}
          margin={{ top: 8, right: hasWeight || showSleepLine ? 16 : 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis
            yAxisId="kcal"
            tick={{ fontSize: 11 }}
            stroke="#94a3b8"
            width={42}
            label={{ value: 'kcal', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
          />
          {hasWeight && (
            <YAxis
              yAxisId="kg"
              orientation="right"
              tick={{ fontSize: 11 }}
              stroke="#94a3b8"
              width={36}
              domain={['auto', 'auto']}
              label={{ value: 'kg', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10 }}
            />
          )}
          {showSleepLine && (
            <YAxis
              yAxisId="sleep"
              orientation="right"
              tick={{ fontSize: 11 }}
              stroke="#94a3b8"
              width={36}
              domain={[0, 'auto']}
              label={{ value: 'saat', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10 }}
            />
          )}
          <Tooltip content={<TrendTooltip />} />
          <Legend />
          <ReferenceLine
            yAxisId="kcal"
            y={trends.targetCalories}
            stroke="#f59e0b"
            strokeDasharray="6 4"
            label={{ value: 'Hedef kcal', fill: '#b45309', fontSize: 10, position: 'insideTopRight' }}
          />
          <Line
            yAxisId="kcal"
            type="monotone"
            dataKey="netCalories"
            name="Net alım"
            stroke="#0d9488"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            yAxisId="kcal"
            type="monotone"
            dataKey="grossCalories"
            name="Brüt (yemek)"
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
          />
          {hasWeight && (
            <>
              {showTargetWeightLine && (
                <ReferenceLine
                  yAxisId="kg"
                  y={targetKg}
                  stroke="#ea580c"
                  strokeDasharray="6 4"
                  label={{ value: 'Hedef kg', fill: '#c2410c', fontSize: 10, position: 'insideTopRight' }}
                />
              )}
              <Line
                yAxisId="kg"
                type="monotone"
                dataKey="weight"
                name="Kilo"
                stroke="#7c3aed"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            </>
          )}
          {showSleepLine && (
            <Line
              yAxisId="sleep"
              type="monotone"
              dataKey="sleepHours"
              name="Uyku (saat)"
              stroke="#0369a1"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      <p className="muted small trend-hint">
        Net alım = yemek − egzersiz. Günlük protein ort.{' '}
        {trends.days.length
          ? (trends.days.reduce((s, d) => s + d.proteinG, 0) / trends.days.length).toFixed(1)
          : '—'}
        g · su ort.{' '}
        {trends.days.length
          ? Math.round(trends.days.reduce((s, d) => s + d.waterMl, 0) / trends.days.length)
          : '—'}{' '}
        ml
        {sleepAvg != null ? ` · uyku ort. ${sleepAvg} saat (kayıtlı günler)` : ''}
        {hasSleep && hasWeight ? ' · Uyku çizgisi kilo ile aynı grafikte çakışmaması için ipucunda gösterilir.' : ''}
      </p>
    </div>
  )
}
