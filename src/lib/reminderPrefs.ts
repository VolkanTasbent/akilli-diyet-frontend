const STORAGE_KEY = 'akilli-diyet-reminder-prefs-v1'

export type ReminderPrefs = {
  waterEnabled: boolean
  waterIntervalHours: number
}

const defaultPrefs: ReminderPrefs = {
  waterEnabled: false,
  waterIntervalHours: 2,
}

export function loadReminderPrefs(): ReminderPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultPrefs }
    const parsed = JSON.parse(raw) as Partial<ReminderPrefs>
    return {
      waterEnabled: Boolean(parsed.waterEnabled),
      waterIntervalHours:
        typeof parsed.waterIntervalHours === 'number' && parsed.waterIntervalHours >= 1
          ? Math.min(6, parsed.waterIntervalHours)
          : defaultPrefs.waterIntervalHours,
    }
  } catch {
    return { ...defaultPrefs }
  }
}

export function saveReminderPrefs(p: ReminderPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}
