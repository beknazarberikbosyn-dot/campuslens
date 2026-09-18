import { ALIASES, SUGGESTIONS, normalize } from '../data/catalog'
import { SEED_REVIEWS } from '../data/reviews'
import type {
  RankedUniversity,
  ReviewAspectId,
  ReviewScores,
  ReviewSummary,
  UniversityReview,
  VisualProfile,
} from '../types'

const STORAGE_KEY = 'campuslens-reviews-v1'

const EMPTY_SCORES: ReviewScores = {
  campus: 0,
  dorm: 0,
  teaching: 0,
  life: 0,
  city: 0,
}

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

function withSource(review: UniversityReview): UniversityReview {
  return { ...review, source: review.source ?? 'campuslens' }
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
  for (const review of SEED_REVIEWS) byId.set(review.id, withSource(review))
  for (const review of stored) byId.set(review.id, withSource(review))
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
  draft: Omit<UniversityReview, 'id' | 'createdAt' | 'universityKey' | 'source'> & {
    universityKey?: string
    source?: UniversityReview['source']
  },
): UniversityReview {
  const universityName = canonicalUniversityName(draft.universityName)
  const review: UniversityReview = {
    ...draft,
    universityName,
    universityKey: draft.universityKey ?? universityName,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString().slice(0, 10),
    source: draft.source ?? 'user',
  }
  const next = [...readStored(), review]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return review
}

function avg(values: number[]): number {
  if (!values.length) return 0
  return values.reduce((sum, n) => sum + n, 0) / values.length
}

export function summarizeReviews(reviews: UniversityReview[]): ReviewSummary {
  if (!reviews.length) return { count: 0, average: 0, aspects: { ...EMPTY_SCORES } }
  const aspectIds = Object.keys(EMPTY_SCORES) as ReviewAspectId[]
  const aspects = { ...EMPTY_SCORES }
  for (const id of aspectIds) {
    aspects[id] = Math.round(avg(reviews.map((r) => r.scores[id]).filter((n) => n > 0)) * 10) / 10
  }
  return {
    count: reviews.length,
    average: Math.round(avg(reviews.map((r) => r.rating)) * 10) / 10,
    aspects,
  }
}

export function rankedUniversities(all = loadAllReviews()): RankedUniversity[] {
  const names = new Set<string>()
  SUGGESTIONS.forEach((s) => names.add(s.title))
  all.forEach((r) => names.add(canonicalUniversityName(r.universityName)))
  return [...names]
    .map((name) => {
      const suggestion = SUGGESTIONS.find((s) => s.title === name)
      return {
        name,
        city: suggestion?.city ?? '',
        image: suggestion?.image ?? null,
        blurb: suggestion?.blurb ?? 'Отзывы абитуриентов и студентов',
        summary: summarizeReviews(reviewsForUniversity(name, all)),
      }
    })
    .sort((a, b) => b.summary.average - a.summary.average || b.summary.count - a.summary.count || a.name.localeCompare(b.name))
}

export function visualCoverageScore(profile: VisualProfile): number {
  const photoPart = Math.min(1, profile.photos.length / 12)
  const verifiedPart = Math.min(1, profile.photos.filter((p) => p.level === 'verified').length / 8)
  const cats = new Set(profile.photos.map((p) => p.category)).size / 8
  return Math.round(photoPart * 40 + verifiedPart * 40 + cats * 20)
}

export function combinedCampusScore(visual: number, summary: ReviewSummary): number {
  if (!summary.count) return visual
  const reviews100 = (summary.average / 5) * 100
  const confidence = Math.min(1, summary.count / 6)
  const reviewWeight = 0.48 + 0.18 * confidence
  return Math.round(reviews100 * reviewWeight + visual * (1 - reviewWeight))
}

export function formatScore(value: number): string {
  if (!value) return '—'
  return value % 1 === 0 ? String(value) : value.toFixed(1)
}

export function reviewCountLabel(count: number): string {
  const n = Math.abs(count) % 100
  const d = n % 10
  if (n > 10 && n < 20) return `${count} отзывов`
  if (d === 1) return `${count} отзыв`
  if (d >= 2 && d <= 4) return `${count} отзыва`
  return `${count} отзывов`
}

export function reviewEvidence(reviews: UniversityReview[]) {
  const corpus = reviews.filter((review) => review.source !== 'user')
  return {
    total: reviews.length,
    corpus: corpus.length,
    file: corpus[0]?.evidenceFile ?? null,
    url: corpus[0]?.evidenceUrl ?? null,
  }
}
