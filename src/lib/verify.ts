import { CATEGORIES, normalize } from '../data/catalog'
import type { CategoryId, ConfidenceLevel, Photo, RejectedPhoto } from '../types'

const SKIP = [
  'logo',
  'seal',
  'coat of arms',
  'flag',
  'stamp',
  'postage',
  'chart',
  'diagram',
  'svg',
  'map of',
  'микроструктур',
  'microstructure',
  'signature',
  'autograph',
]

function tokens(name: string) {
  return normalize(name)
    .split(' ')
    .filter((w) => w.length > 3 && !['university', 'университет', 'college', 'national', 'the', 'and'].includes(w))
}

function classify(text: string): CategoryId {
  const n = normalize(text)
  for (const cat of CATEGORIES) {
    if (cat.keys.some((k) => n.includes(k))) return cat.id
  }
  return 'campus'
}

function levelOf(score: number): ConfidenceLevel {
  if (score >= 78) return 'verified'
  if (score >= 58) return 'likely'
  return 'uncertain'
}

const QUOTA: Record<CategoryId, number> = {
  campus: 8,
  library: 5,
  dorm: 5,
  classroom: 4,
  lab: 4,
  sport: 4,
  life: 4,
  city: 4,
}

function balancePhotos(photos: Photo[], max = 36): Photo[] {
  const byCat = new Map<CategoryId, Photo[]>()
  for (const photo of photos) {
    const list = byCat.get(photo.category) ?? []
    list.push(photo)
    byCat.set(photo.category, list)
  }
  const picked: Photo[] = []
  const used = new Set<string>()
  for (const [cat, n] of Object.entries(QUOTA) as [CategoryId, number][]) {
    for (const photo of (byCat.get(cat) ?? []).slice(0, n)) {
      picked.push(photo)
      used.add(photo.id)
    }
  }
  const extra: Record<CategoryId, number> = {
    campus: 2,
    library: 1,
    dorm: 1,
    classroom: 1,
    lab: 1,
    sport: 1,
    life: 1,
    city: 1,
  }
  for (const photo of photos) {
    if (picked.length >= max) break
    if (used.has(photo.id)) continue
    const have = picked.filter((row) => row.category === photo.category).length
    if (have >= QUOTA[photo.category] + extra[photo.category]) continue
    picked.push(photo)
    used.add(photo.id)
  }
  return picked
}

export function verifyAndSort(
  files: {
    title: string
    thumb: string
    sourceUrl: string
    author: string
    license: string
    date: string | null
    description: string
    categories: string
    hint?: CategoryId
    fromWikiPage?: boolean
  }[],
  universityNames: string[],
  cityName: string,
): { photos: Photo[]; rejected: RejectedPhoto[]; duplicatesRemoved: number } {
  const uniTokens = universityNames.flatMap(tokens)
  const uniNorms = universityNames.map(normalize)
  const cityNorm = normalize(cityName)
  const rejected: RejectedPhoto[] = []
  const kept: Photo[] = []
  let duplicatesRemoved = 0
  const fingerprints = new Set<string>()

  for (const file of files) {
    const blob = normalize(`${file.title} ${file.description} ${file.categories}`)
    const fp = blob.replace(/[^a-zа-я0-9]+/gi, '').slice(0, 56)
    if (fingerprints.has(fp)) {
      duplicatesRemoved += 1
      rejected.push({ title: file.title, sourceUrl: file.sourceUrl, reason: 'Похоже на уже взятое фото (дубликат по названию и категориям)' })
      continue
    }

    if (SKIP.some((k) => blob.includes(k))) {
      rejected.push({ title: file.title, sourceUrl: file.sourceUrl, reason: 'Не фотография кампуса (логотип, схема, марка или служебный файл)' })
      continue
    }

    const reasons: string[] = []
    let score = 28
    const nameHit = uniTokens.filter((t) => blob.includes(t) || (t.length > 5 && blob.includes(t.slice(0, 6)))).length
    const phraseHit = uniNorms.some((n) => n.length > 10 && blob.includes(n))
    const cityish = new Set(['oxford', 'cambridge', 'stanford', 'almaty', 'astana', 'boston', 'london'])
    const distinctive = uniTokens.filter((t) => t.length > 5 && !cityish.has(t))
    const distinctiveHit = distinctive.length > 0 && distinctive.some((t) => blob.includes(t))
    const hintedSector = Boolean(file.hint && file.hint !== 'city')
    const universityMatch =
      Boolean(file.fromWikiPage) ||
      hintedSector ||
      phraseHit ||
      distinctiveHit ||
      (distinctive.length === 0 && nameHit >= 2)
    if (
      /\bbrookes\b|rice university|naresuan|northeastern/i.test(blob) &&
      !distinctiveHit &&
      !phraseHit &&
      !file.fromWikiPage &&
      !hintedSector
    ) {
      rejected.push({
        title: file.title,
        sourceUrl: file.sourceUrl,
        reason: 'Похоже на другой университет с похожим названием',
      })
      continue
    }
    if (file.fromWikiPage) {
      score += 16
      reasons.push('Файл с карточки Wikipedia этого вуза')
    }
    if (phraseHit || distinctiveHit || (distinctive.length === 0 && nameHit >= 2)) {
      score += 42
      reasons.push('Название вуза есть в файле или категориях Wikimedia')
    } else if (hintedSector) {
      score += 28
      reasons.push('Файл пришёл из поиска по сектору этого вуза')
    }
    if (file.categories.toLowerCase().includes('university') || file.categories.includes('университет')) {
      score += 12
      reasons.push('Файл в университетской категории Commons')
    }
    if (cityNorm && blob.includes(cityNorm)) {
      score += 10
      reasons.push('Город совпадает с расположением вуза')
    }
    if (file.date) {
      const year = Number(file.date.slice(0, 4))
      if (year && year < 2008) {
        score -= 8
        reasons.push('Снимок старше 2008 года — мог устареть')
      } else {
        reasons.push(`Дата источника: ${file.date}`)
      }
    } else {
      score -= 4
      reasons.push('Дата публикации не указана')
    }
    if (file.license.toLowerCase().includes('cc') || file.license.toLowerCase().includes('public')) {
      score += 6
      reasons.push(`Лицензия ${file.license}`)
    }

    const classified = classify(blob)
    const category =
      classified === 'campus' && file.hint && file.hint !== 'campus' ? file.hint : classified
    if (category !== classified && file.hint) {
      const hintLabel =
        { dorm: 'общежитие', library: 'библиотека', lab: 'лаборатория', classroom: 'аудитория', sport: 'спорт', life: 'студенческая жизнь', city: 'город', campus: 'кампус' }[
          file.hint
        ]
      reasons.push(`Искали сектор «${hintLabel}», ключей кампуса в файле нет`)
    }
    if (category === 'city' && !universityMatch) {
      if (cityNorm && blob.includes(cityNorm)) {
        score = Math.max(score, 62)
        reasons.push('Это город вуза, не сам кампус')
      } else {
        rejected.push({ title: file.title, sourceUrl: file.sourceUrl, reason: 'Городское фото без привязки к выбранному вузу' })
        continue
      }
    }

    if (/(prime minister|putin|modi visiting|visita a la)/i.test(blob)) {
      score -= 16
      reasons.push('Официальный визит: кадр может быть не про студенческую жизнь')
    }
    if (!universityMatch && category !== 'city') {
      score -= 18
      reasons.push('Прямого упоминания вуза нет — уверенность снижена')
    }

    score = Math.max(12, Math.min(96, score))
    if (score < 46 && category !== 'city') {
      rejected.push({
        title: file.title,
        sourceUrl: file.sourceUrl,
        reason: 'Не удалось подтвердить принадлежность выбранному университету',
      })
      continue
    }

    fingerprints.add(fp)
    kept.push({
      id: file.sourceUrl,
      title: file.title,
      thumb: file.thumb,
      sourceUrl: file.sourceUrl,
      author: file.author || 'не указан',
      license: file.license,
      date: file.date,
      category,
      confidence: score,
      level: levelOf(score),
      reasons,
      universityMatch,
    })
  }

  kept.sort((a, b) => b.confidence - a.confidence)
  const capped = balancePhotos(kept, 36)
  if (kept.length > capped.length) {
    duplicatesRemoved += kept.length - capped.length
  }
  return { photos: capped, rejected: rejected.slice(0, 18), duplicatesRemoved }
}

export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}
