export type CategoryId =
  | 'campus'
  | 'dorm'
  | 'classroom'
  | 'library'
  | 'lab'
  | 'sport'
  | 'life'
  | 'city'

export type ConfidenceLevel = 'verified' | 'likely' | 'uncertain'

export type Photo = {
  id: string
  title: string
  thumb: string
  sourceUrl: string
  author: string
  license: string
  date: string | null
  category: CategoryId
  confidence: number
  level: ConfidenceLevel
  reasons: string[]
  universityMatch: boolean
}

export type RejectedPhoto = {
  title: string
  sourceUrl: string
  reason: string
}

export type WikiHit = {
  title: string
  snippet: string
  lang: 'en' | 'ru'
  pageid: number
}

export type UniversityCore = {
  title: string
  displayName: string
  searchNames: string[]
  extract: string
  lang: 'en' | 'ru'
  pageUrl: string
  thumbnail: string | null
  lat: number | null
  lon: number | null
  cityHint: string
}

export type CityFacts = {
  name: string
  climate: string
  transport: string
  livingCost: string
  lat: number
  lon: number
}

export type PipelineStep = {
  id: string
  label: string
  done: boolean
  detail: string
}

export type VisualProfile = {
  query: string
  university: UniversityCore
  description: string
  photos: Photo[]
  rejected: RejectedPhoto[]
  duplicatesRemoved: number
  elapsedMs: number
  city: CityFacts | null
  distanceKm: number | null
  warnings: string[]
  sourcesUsed: string[]
}

export type Progress = {
  steps: PipelineStep[]
  found: number
  kept: number
  message: string
}
