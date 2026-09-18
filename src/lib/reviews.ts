import { SEED_REVIEWS } from '../data/reviews'
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
import { ALIASES, SUGGESTIONS, normalize } from '../data/catalog'

const NAME_HINTS: { needle: string; title: string }[] = [
  { needle: 'nazarbayev', title: 'Nazarbayev University' },
  { needle: 'назарбаев', title: 'Nazarbayev University' },
  { needle: 'al-farabi', title: 'Al-Farabi Kazakh National University' },
  { needle: 'аль-фараби', title: 'Al-Farabi Kazakh National University' },
  { needle: 'аль фараби', title: 'Al-Farabi Kazakh National University' },
  { needle: 'kazakh national university', title: 'Al-Farabi Kazakh National University' },
  { needle: 'satbayev', title: 'Satbayev University' },
  { needle: 'satpaev', title: 'Satbayev University' },
  { needle: 'сатбаев', title: 'Satbayev University' },
  { needle: 'сатпаев', title: 'Satbayev University' },
  { needle: 'massachusetts', title: 'Massachusetts Institute of Technology' },
  { needle: 'массачусет', title: 'Massachusetts Institute of Technology' },
  { needle: 'oxford', title: 'University of Oxford' },
  { needle: 'оксфорд', title: 'University of Oxford' },
  { needle: 'stanford', title: 'Stanford University' },
  { needle: 'стэнфорд', title: 'Stanford University' },
  { needle: 'стенфорд', title: 'Stanford University' },
]

export function canonicalUniversityName(name: string): string {
  const n = normalize(name)
  const direct = SUGGESTIONS.find((s) => normalize(s.title) === n)
  if (direct) return direct.title
  const hinted = NAME_HINTS.find((h) => n.includes(h.needle))
  if (hinted) return hinted.title
  for (const [alias, titles] of Object.entries(ALIASES)) {
    if (n !== alias && !titles.some((t) => normalize(t) === n)) continue
    const known = SUGGESTIONS.find((s) => titles.some((t) => normalize(t) === normalize(s.title)))
    return known?.title ?? titles[0] ?? name
  }
  return name.trim()
}

export function universityKeys(name: string): Set<string> {
  const canonical = canonicalUniversityName(name)
  const keys = new Set([normalize(name), normalize(canonical)])
  for (const [alias, titles] of Object.entries(ALIASES)) {
    const related =
      keys.has(alias) || titles.some((t) => keys.has(normalize(t))) || normalize(canonical) === alias
    if (!related) continue
    keys.add(alias)
    titles.forEach((t) => keys.add(normalize(t)))
  }
  return keys
}


export function loadAllReviews(): UniversityReview[] {
  const stored = readStored()
  const byId = new Map<string, UniversityReview>()
  for (const review of SEED_REVIEWS) byId.set(review.id, review)
  for (const review of stored) byId.set(review.id, review)
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function reviewsForUniversity(name: string, all = loadAllReviews()): UniversityReview[] {
  const canonical = canonicalUniversityName(name)
  const keys = new Set([...universityKeys(name), ...universityKeys(canonical)])
  return all.filter(
    (review) =>
      keys.has(normalize(review.universityKey)) ||
      keys.has(normalize(review.universityName)) ||
      canonicalUniversityName(review.universityName) === canonical,
  )
}

export function addReview(
  draft: Omit<UniversityReview, 'id' | 'createdAt' | 'universityKey'> & { universityKey?: string },
): UniversityReview {
  const universityName = canonicalUniversityName(draft.universityName)
  const review: UniversityReview = {
    ...draft,
    universityName,
    universityKey: draft.universityKey ?? universityName,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString().slice(0, 10),
  }
  const next = [...readStored(), review]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return review
}
