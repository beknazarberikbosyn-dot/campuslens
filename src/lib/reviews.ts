import type { UniversityReview } from '../types'

const STORAGE_KEY = 'campuslens-reviews-v1'

function isReview(value: unknown): value is UniversityReview {
  if (!value || typeof value !== 'object') return false
  const r = value as UniversityReview
  return (
    typeof r.id === 'string' &&
    typeof r.universityName === 'string' &&
    typeof r.rating === 'number' &&
    r.rating >= 1 &&
    r.rating <= 5 &&
    typeof r.text === 'string' &&
    r.scores != null &&
    typeof r.scores === 'object'
  )
}

function readStored(): UniversityReview[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isReview) : []
  } catch {
    return []
  }
}
