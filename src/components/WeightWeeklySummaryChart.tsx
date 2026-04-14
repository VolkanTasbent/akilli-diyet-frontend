import { useMemo } from 'react'
import {
  Area,
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
import { weeklyWeightStats } from '../lib/weekBucket'
import type { TrendRangeDto } from '../types'

type Props = {
  trends: TrendRangeDto
}

type ChartRow = {
  label: string
  avgKg: number
  lastKg: number
  minKg: number
  maxKg: number
  count: number
  bandLow: number
  bandSpread: number
}

function WeightTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: ChartRow }[]
}) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
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
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Hafta: {p.label}</div>
      <div>Ortalama: {p.avgKg} kg</div>
      <div>Son ölçüm: {p.lastKg} kg</div>
      {p.count > 1 && (
        <div>
          Aralık: {p.minKg} – {p.maxKg} kg ({p.count} ölçüm)
        </div>
      )}
      {p.count === 1 && <div>Tek ölçüm</div>}
    </div>
  )
}

export function WeightWeeklySummaryChart({ trends }: Props) {
  const target = trends.targetWeightKg

  const chartData = useMemo((): ChartRow[] => {
    return weeklyWeightStats(trends.days).map((p) => ({
      label: p.label,
      avgKg: p.avgKg,
      lastKg: p.lastKg,
      minKg: p.minKg,
      maxKg: p.maxKg,
      count: p.count,
      bandLow: p.minKg,
      bandSpread: Math.max(0, Math.round((p.maxKg - p.minKg) * 100) / 100),
    }))
  }, [trends.days])

  if (chartData.length === 0) {
    return (
      <p className="muted small">
        Bu dönemde kilo kaydı yok. Panelden kilo ekledikçe haftalık özet çizilir.
        {target != null && ' Profilde hedef kilon tanımlı; kayıtlar birikince hedef çizgisiyle karşılaştırabilirsin.'}
      </p>
    )
  }

  const allMins = chartData.map((p) => p.minKg)
  const allMaxs = chartData.map((p) => p.maxKg)
  let yMin = Math.min(...allMins, ...chartData.map((p) => p.avgKg), ...chartData.map((p) => p.lastKg))
  let yMax = Math.max(...allMaxs, ...chartData.map((p) => p.avgKg), ...chartData.map((p) => p.lastKg))
  if (target != null) {
    yMin = Math.min(yMin, target)
    yMax = Math.max(yMax, target)
  }
  const pad = Math.max(0.5, (yMax - yMin) * 0.12)
  const domainMin = Math.floor((yMin - pad) * 10) / 10
  const domainMax = Math.ceil((yMax + pad) * 10) / 10

  return (
    <div className="trend-chart-wrap weight-weekly-chart">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            stroke="#94a3b8"
            interval={0}
            angle={-25}
            textAnchor="end"
            height={56}
          />
          <YAxis
            domain={[domainMin, domainMax]}
            tick={{ fontSize: 11 }}
            stroke="#94a3b8"
            width={40}
            label={{ value: 'kg', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
          />
          <Tooltip content={<WeightTooltip />} />
          <Legend />
          {target != null && (
            <ReferenceLine
              y={target}
              stroke="#ea580c"
              strokeDasharray="6 4"
              label={{ value: 'Hedef kg', fill: '#c2410c', fontSize: 10, position: 'insideTopRight' }}
            />
          )}
          <Area
            type="monotone"
            dataKey="bandLow"
            stackId="bw"
            stroke="none"
            fill="rgba(0,0,0,0)"
            legendType="none"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="bandSpread"
            stackId="bw"
            stroke="none"
            fill="rgba(124, 58, 237, 0.2)"
            legendType="none"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="lastKg"
            name="Son ölçüm"
            stroke="#94a3b8"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="avgKg"
            name="Haftalık ortalama"
            stroke="#7c3aed"
            strokeWidth={2.5}
            dot={{ r: 4 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="muted small trend-hint">
        <strong>Ortalama</strong> çizgisi hafta içindeki tüm tartıların ortalamasıdır; <strong>gölge bant</strong> aynı haftadaki
        en düşük–en yüksek değerleri gösterir. İnce kesik çizgi haftanın <strong>son</strong> ölçümüdür. Aralık: {trends.from}{' '}
        — {trends.to}.
        {target == null && ' Hedef çizgisi için profilde hedef kilo girebilirsin.'}
      </p>
    </div>
  )
}
