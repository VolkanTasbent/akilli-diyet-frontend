import { describe, expect, it } from 'vitest'
import { mondayOfWeek, weeklyWeightStats } from './weekBucket'

describe('weekBucket', () => {
  it('mondayOfWeek returns ISO Monday', () => {
    expect(mondayOfWeek('2026-04-15')).toBe('2026-04-13')
    expect(mondayOfWeek('2026-04-13')).toBe('2026-04-13')
  })

  it('weeklyWeightStats computes avg, last, min, max per week', () => {
    const pts = weeklyWeightStats([
      { date: '2026-04-13', weightKg: 80 },
      { date: '2026-04-15', weightKg: 78 },
      { date: '2026-04-16', weightKg: 79 },
      { date: '2026-04-20', weightKg: 77.5 },
    ])
    expect(pts).toHaveLength(2)
    expect(pts[0].count).toBe(3)
    expect(pts[0].minKg).toBe(78)
    expect(pts[0].maxKg).toBe(80)
    expect(pts[0].lastKg).toBe(79)
    expect(pts[0].avgKg).toBe(79)
    expect(pts[1].avgKg).toBe(77.5)
    expect(pts[1].count).toBe(1)
  })
})
