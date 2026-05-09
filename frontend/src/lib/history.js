// Tiny localStorage-backed history of past analyses.
// Stored as: { ts, pred, confidence, label_fr, severity, color }[]

const KEY = 'brainscan_history'
const MAX = 20

export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function pushHistory(entry) {
  const list = loadHistory()
  list.unshift(entry)
  const trimmed = list.slice(0, MAX)
  try { localStorage.setItem(KEY, JSON.stringify(trimmed)) } catch {}
  return trimmed
}

export function clearHistory() {
  try { localStorage.removeItem(KEY) } catch {}
}

export function summarize(history) {
  const total = history.length
  const today = new Date().toDateString()
  const todayCount = history.filter((h) => new Date(h.ts).toDateString() === today).length
  const avgConf = total
    ? history.reduce((s, h) => s + (h.confidence || 0), 0) / total
    : 0
  const lastEntry = history[0] || null
  return { total, todayCount, avgConf, lastEntry }
}

export function formatRelative(ts) {
  const diff = Date.now() - ts
  const sec = Math.floor(diff / 1000)
  if (sec < 60)   return 'à l\'instant'
  const min = Math.floor(sec / 60)
  if (min < 60)   return `il y a ${min} min`
  const hr = Math.floor(min / 60)
  if (hr < 24)    return `il y a ${hr} h`
  const day = Math.floor(hr / 24)
  if (day < 7)    return `il y a ${day} j`
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
