const STORAGE_KEY = 'akilli-diyet-reminder-prefs-v2'

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export type ReminderPrefs = {
  waterEnabled: boolean
  waterIntervalHours: number
  /** true: yalnızca sekme arka plandayken su bildirimi */
  waterOnlyWhenBackground: boolean
  breakfastEnabled: boolean
  lunchEnabled: boolean
  dinnerEnabled: boolean
  breakfastTime: string
  lunchTime: string
  dinnerTime: string
}

const defaultPrefs: ReminderPrefs = {
  waterEnabled: false,
  waterIntervalHours: 2,
  waterOnlyWhenBackground: true,
  breakfastEnabled: false,
  lunchEnabled: false,
  dinnerEnabled: false,
  breakfastTime: '08:30',
  lunchTime: '13:00',
  dinnerTime: '19:30',
}

function clampHourInterval(h: number): number {
  if (typeof h !== 'number' || Number.isNaN(h)) return defaultPrefs.waterIntervalHours
  return Math.min(6, Math.max(1, Math.round(h)))
}

function parseTime(s: unknown, fallback: string): string {
  if (typeof s === 'string' && TIME_RE.test(s)) return s
  return fallback
}

export function loadReminderPrefs(): ReminderPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const legacy = localStorage.getItem('akilli-diyet-reminder-prefs-v1')
      if (legacy) {
        try {
          const p = JSON.parse(legacy) as Partial<ReminderPrefs>
          const merged: ReminderPrefs = {
            ...defaultPrefs,
            waterEnabled: Boolean(p.waterEnabled),
            waterIntervalHours: clampHourInterval(p.waterIntervalHours as number),
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
          return merged
        } catch {
          /* fall through */
        }
      }
      return { ...defaultPrefs }
    }
    const parsed = JSON.parse(raw) as Partial<ReminderPrefs>
    return {
      waterEnabled: Boolean(parsed.waterEnabled),
      waterIntervalHours: clampHourInterval(parsed.waterIntervalHours as number),
      waterOnlyWhenBackground: parsed.waterOnlyWhenBackground !== false,
      breakfastEnabled: Boolean(parsed.breakfastEnabled),
      lunchEnabled: Boolean(parsed.lunchEnabled),
      dinnerEnabled: Boolean(parsed.dinnerEnabled),
      breakfastTime: parseTime(parsed.breakfastTime, defaultPrefs.breakfastTime),
      lunchTime: parseTime(parsed.lunchTime, defaultPrefs.lunchTime),
      dinnerTime: parseTime(parsed.dinnerTime, defaultPrefs.dinnerTime),
    }
  } catch {
    return { ...defaultPrefs }
  }
}

export function saveReminderPrefs(p: ReminderPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}
