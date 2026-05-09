const API_BASE = import.meta.env.VITE_API_BASE || ''

export async function getHealth() {
  const res = await fetch(`${API_BASE}/api/health`)
  if (!res.ok) throw new Error(`Health check failed (${res.status})`)
  return res.json()
}

export async function predictImage(file, gradcam = true) {
  const form = new FormData()
  form.append('file', file)

  const url = `${API_BASE}/api/predict?gradcam=${gradcam ? 'true' : 'false'}`
  const res = await fetch(url, { method: 'POST', body: form })
  if (!res.ok) {
    let detail = `Prediction failed (${res.status})`
    try {
      const err = await res.json()
      if (err.detail) detail = err.detail
    } catch (_) {}
    throw new Error(detail)
  }
  return res.json()
}
