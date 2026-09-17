import { matchCity } from '../data/catalog'
import { collectCampusImages } from './commons'
import { haversineKm, verifyAndSort } from './verify'
import { loadUniversity, resolveCandidates } from './wiki'
import type { PipelineStep, Progress, VisualProfile, WikiHit } from '../types'

const STEPS: Omit<PipelineStep, 'done' | 'detail'>[] = [
  { id: 'resolve', label: 'Ищем университет' },
  { id: 'collect', label: 'Собираем открытые источники' },
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

  const city = matchCity(`${university.displayName} ${university.extract.split(/[.!?]/)[0] ?? ''}`)
  const cityName = city?.name ?? university.cityHint
  push({ steps, message: 'Ищем фотографии на Wikimedia Commons' })
  const files = await collectCampusImages(university.searchNames, cityName)
  steps = mark(steps, 'collect', `${files.length} файлов из Commons`)
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
  if (photos.filter((p) => p.category === 'dorm').length === 0) {
    warnings.push('Общежития: в открытых источниках нет фотографий, которые можно уверенно привязать к этому вузу.')
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
    sourcesUsed: ['Wikipedia', 'Wikimedia Commons', 'OpenStreetMap'],
  }
}
