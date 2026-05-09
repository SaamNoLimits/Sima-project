export const CLASS_ORDER = ['glioma', 'meningioma', 'notumor', 'pituitary']

export const CLASS_META = {
  glioma:     { fr: 'Gliome',             color: '#E8593C', icon: '🔴' },
  meningioma: { fr: 'Méningiome',         color: '#EF9F27', icon: '🟡' },
  notumor:    { fr: 'Pas de tumeur',      color: '#1D9E75', icon: '🟢' },
  pituitary:  { fr: 'Tumeur pituitaire',  color: '#3B8BD4', icon: '🔵' },
}

export function severityClass(sev) {
  if (sev === 'Élevée')  return 'severity-high'
  if (sev === 'Modérée') return 'severity-mod'
  return 'severity-normal'
}

export function severityBadge(sev) {
  if (sev === 'Élevée')  return 'badge-high'
  if (sev === 'Modérée') return 'badge-moderate'
  return 'badge-normal'
}
