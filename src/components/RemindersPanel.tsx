import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { loadReminderPrefs, saveReminderPrefs, type ReminderPrefs } from '../lib/reminderPrefs'

function canNotify() {
  return typeof Notification !== 'undefined'
}

export function RemindersPanel() {
  const { user, refreshUser } = useAuth()
  const [prefs, setPrefs] = useState<ReminderPrefs>(() => loadReminderPrefs())
  const [perm, setPerm] = useState(() => (canNotify() ? Notification.permission : 'denied'))
  const [info, setInfo] = useState<string | null>(null)
  const [emailBusy, setEmailBusy] = useState(false)
  const [emailErr, setEmailErr] = useState<string | null>(null)
  const lastMealSlot = useRef<Record<string, string>>({})

  useEffect(() => {
    saveReminderPrefs(prefs)
  }, [prefs])

  const patchEmailPrefs = useCallback(
    async (body: Record<string, boolean>) => {
      if (!user) return
      setEmailBusy(true)
      setEmailErr(null)
      try {
        await api.patch('/api/me', body)
        await refreshUser()
      } catch {
        setEmailErr('E-posta tercihleri kaydedilemedi. Bağlantınızı kontrol edin.')
      } finally {
        setEmailBusy(false)
      }
    },
    [user, refreshUser],
  )

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
      setInfo('İzin verildi. Tarayıcı bildirimleri aşağıdaki ayarlara göre çalışır.')
    }
  }, [])

  useEffect(() => {
    if (!prefs.waterEnabled || perm !== 'granted' || !canNotify()) {
      return
    }
    const ms = Math.max(1, prefs.waterIntervalHours) * 60 * 60 * 1000
    const tick = () => {
      if (prefs.waterOnlyWhenBackground && document.visibilityState === 'visible') {
        return
      }
      try {
        new Notification('Akıllı Diyet', { body: 'Su içmeyi unutma.', tag: 'akd-water' })
      } catch {
        /* ignore */
      }
    }
    const id = window.setInterval(tick, ms)
    return () => window.clearInterval(id)
  }, [perm, prefs.waterEnabled, prefs.waterIntervalHours, prefs.waterOnlyWhenBackground])

  useEffect(() => {
    if (perm !== 'granted' || !canNotify()) {
      return
    }
    const anyMeal = prefs.breakfastEnabled || prefs.lunchEnabled || prefs.dinnerEnabled
    if (!anyMeal) {
      return
    }

    const run = () => {
      const d = new Date()

      const fire = (key: string, enabled: boolean, timeStr: string, body: string) => {
        if (!enabled) return
        const parts = timeStr.split(':').map(Number)
        const th = parts[0]
        const tm = parts[1]
        if (th === undefined || tm === undefined || Number.isNaN(th) || Number.isNaN(tm)) return
        if (d.getHours() !== th || d.getMinutes() !== tm) return
        const slot = `${d.toDateString()}-${timeStr}-${key}`
        if (lastMealSlot.current[key] === slot) return
        lastMealSlot.current[key] = slot
        try {
          new Notification('Akıllı Diyet', { body, tag: `akd-meal-${key}` })
        } catch {
          /* ignore */
        }
      }

      fire('breakfast', prefs.breakfastEnabled, prefs.breakfastTime, 'Kahvaltı kaydını eklemeyi düşün.')
      fire('lunch', prefs.lunchEnabled, prefs.lunchTime, 'Öğle öğününü kaydetmeyi unutma.')
      fire('dinner', prefs.dinnerEnabled, prefs.dinnerTime, 'Akşam öğününü kaydetmeyi unutma.')
    }

    run()
    const id = window.setInterval(run, 15000)
    return () => window.clearInterval(id)
  }, [
    perm,
    prefs.breakfastEnabled,
    prefs.lunchEnabled,
    prefs.dinnerEnabled,
    prefs.breakfastTime,
    prefs.lunchTime,
    prefs.dinnerTime,
  ])

  const masterEmail = user?.reminderEmailEnabled ?? false

  return (
    <section className="card reminders-card reminders-panel">
      <div className="reminders-panel-head">
        <h2 className="reminders-title">Hatırlatıcılar</h2>
        <p className="muted small reminders-lead">
          Tarayıcı uyarıları bu cihazda; e-posta hesabınıza sunucu üzerinden gider.
        </p>
      </div>

      <details className="reminder-disclosure" open>
        <summary className="reminder-disclosure-summary">
          <span className="reminder-disclosure-title">Tarayıcı bildirimleri</span>
          <span className="reminder-disclosure-hint muted small">Su ve öğün saatleri</span>
        </summary>
        <div className="reminder-disclosure-body">
          {info && <p className="muted small">{info}</p>}
          {perm !== 'granted' && (
            <button type="button" className="btn secondary reminder-perm-btn" onClick={() => void requestPermission()}>
              Bildirim izni iste
            </button>
          )}

          <div className="reminder-split">
            <div className="reminder-column">
              <h3 className="reminder-col-title">Su</h3>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={prefs.waterEnabled}
                  onChange={(e) => setPrefs((p) => ({ ...p, waterEnabled: e.target.checked }))}
                />
                Aralıklı hatırlat
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={prefs.waterOnlyWhenBackground}
                  onChange={(e) => setPrefs((p) => ({ ...p, waterOnlyWhenBackground: e.target.checked }))}
                />
                Yalnızca sekme arka plandayken
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
            </div>

            <div className="reminder-column">
              <h3 className="reminder-col-title">Öğün saatleri</h3>
              <div className="reminder-meal-rows">
                <div className="reminder-meal-row">
                  <label className="check-row reminder-meal-check">
                    <input
                      type="checkbox"
                      checked={prefs.breakfastEnabled}
                      onChange={(e) => setPrefs((p) => ({ ...p, breakfastEnabled: e.target.checked }))}
                    />
                    Kahvaltı
                  </label>
                  <input
                    type="time"
                    className="reminder-time-input"
                    value={prefs.breakfastTime}
                    onChange={(e) => setPrefs((p) => ({ ...p, breakfastTime: e.target.value }))}
                  />
                </div>
                <div className="reminder-meal-row">
                  <label className="check-row reminder-meal-check">
                    <input
                      type="checkbox"
                      checked={prefs.lunchEnabled}
                      onChange={(e) => setPrefs((p) => ({ ...p, lunchEnabled: e.target.checked }))}
                    />
                    Öğle
                  </label>
                  <input
                    type="time"
                    className="reminder-time-input"
                    value={prefs.lunchTime}
                    onChange={(e) => setPrefs((p) => ({ ...p, lunchTime: e.target.value }))}
                  />
                </div>
                <div className="reminder-meal-row">
                  <label className="check-row reminder-meal-check">
                    <input
                      type="checkbox"
                      checked={prefs.dinnerEnabled}
                      onChange={(e) => setPrefs((p) => ({ ...p, dinnerEnabled: e.target.checked }))}
                    />
                    Akşam
                  </label>
                  <input
                    type="time"
                    className="reminder-time-input"
                    value={prefs.dinnerTime}
                    onChange={(e) => setPrefs((p) => ({ ...p, dinnerTime: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </details>

      <details className="reminder-disclosure">
        <summary className="reminder-disclosure-summary">
          <span className="reminder-disclosure-title">E-posta</span>
          <span className="reminder-disclosure-hint muted small">Kayıtlı adresinize</span>
        </summary>
        <div className="reminder-disclosure-body">
          <p className="muted small">
            SMTP yapılandırılmış sunucuda öğün saatleri Türkiye saatiyle (varsayılan 08:30 / 13:00 / 19:30) gönderilir.
            Su e-postası birkaç saatte bir.
          </p>
          {emailErr && <p className="error small">{emailErr}</p>}

          <label className="check-row">
            <input
              type="checkbox"
              checked={masterEmail}
              disabled={!user || emailBusy}
              onChange={(e) => {
                const v = e.target.checked
                if (!v) {
                  void patchEmailPrefs({
                    reminderEmailEnabled: false,
                    reminderEmailWater: false,
                    reminderEmailBreakfast: false,
                    reminderEmailLunch: false,
                    reminderEmailDinner: false,
                  })
                } else {
                  void patchEmailPrefs({ reminderEmailEnabled: true })
                }
              }}
            />
            E-posta hatırlatmaları
          </label>

          <div className="reminder-email-grid">
            <label className="check-row">
              <input
                type="checkbox"
                checked={user?.reminderEmailWater ?? false}
                disabled={!user || emailBusy || !masterEmail}
                onChange={(e) => void patchEmailPrefs({ reminderEmailWater: e.target.checked })}
              />
              Su
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={user?.reminderEmailBreakfast ?? false}
                disabled={!user || emailBusy || !masterEmail}
                onChange={(e) => void patchEmailPrefs({ reminderEmailBreakfast: e.target.checked })}
              />
              Kahvaltı
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={user?.reminderEmailLunch ?? false}
                disabled={!user || emailBusy || !masterEmail}
                onChange={(e) => void patchEmailPrefs({ reminderEmailLunch: e.target.checked })}
              />
              Öğle
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={user?.reminderEmailDinner ?? false}
                disabled={!user || emailBusy || !masterEmail}
                onChange={(e) => void patchEmailPrefs({ reminderEmailDinner: e.target.checked })}
              />
              Akşam
            </label>
          </div>
        </div>
      </details>
    </section>
  )
}
