import { matchCity } from '../data/catalog'
import { collectCampusImages } from './commons'
import { loadUniversityFacts } from './facts'
import { resolveCampusPlace } from './maps'
import { haversineKm, verifyAndSort } from './verify'
import { loadUniversity, resolveCandidates } from './wiki'
import type { PipelineStep, Progress, VisualProfile, WikiHit } from '../types'

const STEPS: Omit<PipelineStep, 'done' | 'detail'>[] = [
  { id: 'resolve', label: 'Ищем университет' },
  { id: 'collect', label: 'Собираем открытые источники' },
  { id: 'maps', label: 'Открываем карточки на картах' },
  { id: 'facts', label: 'Собираем справку для абитуриента' },
  { id: 'dedupe', label: 'Удаляем дубликаты и мусор' },
  { id: 'verify', label: 'Проверяем принадлежность' },
  { id: 'sort', label: 'Раскладываем по категориям' },
  { id: 'write', label: 'Собираем визуальный профиль' },
]

function mark(steps: PipelineStep[], id: string, detail: string) {
  return steps.map((s) => (s.id === id ? { ...s, done: true, detail } : s))
}

export async function searchUniversity(query: string) {
  return resolveCandidates(query)
}

export async function buildVisualProfile(
  hit: WikiHit,
  query: string,
  onProgress: (p: Progress) => void,
): Promise<VisualProfile> {
  const started = performance.now()
  let steps: PipelineStep[] = STEPS.map((s) => ({ ...s, done: false, detail: '' }))
  const push = (partial: Partial<Progress>) =>
    onProgress({ steps, found: 0, kept: 0, message: 'Работаем', ...partial })

  push({ message: 'Уточняем карточку вуза в Wikipedia' })
  const university = await loadUniversity(hit.title, hit.lang)
  if (!university) {
    throw new Error('Не удалось загрузить карточку университета')
  }
  steps = mark(steps, 'resolve', university.displayName)
  push({ steps, message: university.displayName })

  const city = matchCity(`${university.displayName} ${university.extract.slice(0, 360)}`)
  const cityName = city?.name ?? university.cityHint
  push({ steps, message: 'Ищем фото по кампусу, общежитию, библиотеке и другим секторам' })
  const [files, campusPlace, facts] = await Promise.all([
    collectCampusImages(university.searchNames, cityName, {
      title: university.title,
      lang: university.lang,
      lat: university.lat,
      lon: university.lon,
    }),
    resolveCampusPlace(university.displayName, university.lat, university.lon),
    loadUniversityFacts(university),
  ])
  steps = mark(steps, 'collect', `${files.length} файлов из Commons и Wikipedia`)
  steps = mark(steps, 'maps', campusPlace.address || campusPlace.provider)
  steps = mark(steps, 'facts', facts.items.length ? `${facts.items.length} справок` : 'цифр мало')
  push({ steps, found: files.length, message: `Найдено ${files.length} изображений` })

  const { photos, rejected, duplicatesRemoved } = verifyAndSort(files, university.searchNames, cityName)
  steps = mark(steps, 'dedupe', `снято ${duplicatesRemoved} похожих`)
  steps = mark(steps, 'verify', `${photos.filter((p) => p.level === 'verified').length} подтверждённых`)
  const cats = new Set(photos.map((p) => p.category)).size
  steps = mark(steps, 'sort', `${cats} категорий`)
  push({ steps, found: files.length, kept: photos.length, message: 'Пишем описание кампуса' })

  const verified = photos.filter((p) => p.level === 'verified').length
  const warnings: string[] = []
  if (photos.length < 6) warnings.push('Мало проверенных фотографий. Лучше показать пробел, чем выдать чужой кампус.')
  const missingSectors = (
    [
      ['dorm', 'общежитий'],
      ['library', 'библиотеки'],
      ['lab', 'лабораторий'],
      ['classroom', 'аудиторий'],
      ['sport', 'спорта'],
      ['life', 'студенческой жизни'],
    ] as const
  ).filter(([id]) => photos.filter((p) => p.category === id).length === 0)
  if (missingSectors.length) {
    warnings.push(
      `Мало кадров вне кампуса: нет уверенных фото ${missingSectors.map(([, label]) => label).join(', ')}.`,
    )
  }
  if (verified < 3) warnings.push('Низкая общая достоверность: много кадров без явного названия университета.')

  const sentences = university.extract.split(/(?<=[.!?])\s+/).slice(0, 3).join(' ')
  const description = `${sentences} Описание собрано по Wikipedia; фото проверены только если источник позволяет привязать кадр к вузу или городу.`

  let distanceKm: number | null = null
  if (university.lat != null && university.lon != null && city) {
    distanceKm = haversineKm({ lat: university.lat, lon: university.lon }, { lat: city.lat, lon: city.lon })
  }

  steps = mark(steps, 'write', `${photos.length} кадров в профиле`)
  const elapsedMs = performance.now() - started
  push({ steps, found: files.length, kept: photos.length, message: 'Готово' })

  return {
    query,
    university,
    description,
    photos,
    rejected,
    duplicatesRemoved,
    elapsedMs,
    city,
    distanceKm,
    warnings,
    sourcesUsed: [...new Set(['Wikipedia', 'Wikimedia Commons', 'OpenStreetMap', ...facts.sourcesUsed])],
    campusPlace,
    facts,
  }
}
