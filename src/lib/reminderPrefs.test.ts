import { afterEach, describe, expect, it } from 'vitest'
import { loadReminderPrefs, saveReminderPrefs } from './reminderPrefs'

describe('reminderPrefs', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('returns defaults when storage empty', () => {
    const p = loadReminderPrefs()
    expect(p.waterEnabled).toBe(false)
    expect(p.waterIntervalHours).toBe(2)
  })

  it('round-trips prefs', () => {
    saveReminderPrefs({ waterEnabled: true, waterIntervalHours: 3 })
    expect(loadReminderPrefs()).toEqual({ waterEnabled: true, waterIntervalHours: 3 })
  })

  it('clamps interval to 1–6', () => {
    saveReminderPrefs({ waterEnabled: false, waterIntervalHours: 99 })
    expect(loadReminderPrefs().waterIntervalHours).toBe(6)
  })
})
