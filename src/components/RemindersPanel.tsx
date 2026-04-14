import { useCallback, useEffect, useState } from 'react'
import { loadReminderPrefs, saveReminderPrefs, type ReminderPrefs } from '../lib/reminderPrefs'

function canNotify() {
  return typeof Notification !== 'undefined'
}

export function RemindersPanel() {
  const [prefs, setPrefs] = useState<ReminderPrefs>(() => loadReminderPrefs())
  const [perm, setPerm] = useState(() => (canNotify() ? Notification.permission : 'denied'))
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    saveReminderPrefs(prefs)
  }, [prefs])

  const requestPermission = useCallback(async () => {
    if (!canNotify()) {
      setInfo('Bu tarayıcıda bildirim desteklenmiyor.')
      return
    }
    const p = await Notification.requestPermission()
    setPerm(p)
    if (p !== 'granted') {
      setInfo('Bildirim izni verilmedi.')
    } else {
      setInfo('İzin verildi. Su hatırlatıcısı açıksa aralıklarla uyarı gönderilir.')
    }
  }, [])

  useEffect(() => {
    if (!prefs.waterEnabled || perm !== 'granted' || !canNotify()) {
      return
    }
    const ms = Math.max(1, prefs.waterIntervalHours) * 60 * 60 * 1000
    const tick = () => {
      if (document.visibilityState === 'visible') {
        return
      }
      try {
        new Notification('Akıllı Diyet', { body: 'Su içmeyi unutma.' })
      } catch {
        /* ignore */
      }
    }
    const id = window.setInterval(tick, ms)
    return () => window.clearInterval(id)
  }, [perm, prefs.waterEnabled, prefs.waterIntervalHours])

  return (
    <section className="card reminders-card">
      <h2>Hatırlatıcılar</h2>
      <p className="muted small">
        Tarayıcı bildirimleri; sekme arka plandayken aralıklı su uyarısı (Chrome / Safari davranışı cihaza göre değişebilir).
      </p>
      {info && <p className="muted small">{info}</p>}
      {perm !== 'granted' && (
        <button type="button" className="btn secondary" onClick={() => void requestPermission()}>
          Bildirim izni iste
        </button>
      )}
      <label className="check-row">
        <input
          type="checkbox"
          checked={prefs.waterEnabled}
          onChange={(e) => setPrefs((p) => ({ ...p, waterEnabled: e.target.checked }))}
        />
        Su hatırlatıcısı
      </label>
      <label>
        Aralık (saat)
        <select
          value={prefs.waterIntervalHours}
          onChange={(e) =>
            setPrefs((p) => ({ ...p, waterIntervalHours: Number(e.target.value) }))
          }
        >
          {[1, 2, 3, 4, 6].map((h) => (
            <option key={h} value={h}>
              {h} saat
            </option>
          ))}
        </select>
      </label>
    </section>
  )
}
