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

export type FactItem = {
  id: string
  label: string
  value: string
  note?: string
  source: string
  sourceUrl?: string
}

export type UniversityFacts = {
  items: FactItem[]
  country: string | null
  website: string | null
  sourcesUsed: string[]
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
  campusPlace?: CampusPlace | null
  facts?: UniversityFacts | null
}

export type Progress = {
  steps: PipelineStep[]
  found: number
  kept: number
  message: string
}

export type ReviewRole = 'applicant' | 'student' | 'graduate'

export type ReviewAspectId = 'campus' | 'dorm' | 'teaching' | 'life' | 'city'

export type ReviewScores = Record<ReviewAspectId, number>

export type ReviewSourceId = 'campuslens' | 'user'

export type MapProviderId = 'google' | 'yandex' | 'dgis' | 'osm' | 'apple'

export type MapSourceLink = {
  id: MapProviderId
  label: string
  url: string
  hint: string
}

export type CampusPlace = {
  name: string
  query: string
  address: string
  lat: number | null
  lon: number | null
  website: string | null
  wikipedia: string | null
  osmUrl: string | null
  provider: 'overpass' | 'photon' | 'hint' | 'search'
  links: MapSourceLink[]
}

export type UniversityReview = {
  id: string
  universityKey: string
  universityName: string
  author: string
  role: ReviewRole
  rating: number
  scores: ReviewScores
  text: string
  createdAt: string
  source?: ReviewSourceId
  evidenceFile?: string
  evidenceUrl?: string
  evidenceSearchUrl?: string
}

export type ReviewSummary = {
  count: number
  average: number
  aspects: ReviewScores
}

export type RankedUniversity = {
  name: string
  city: string
  image: string | null
  blurb: string
  summary: ReviewSummary
}

export type LocationUniversity = {
  id: string
  name: string
  city: string
  country: string
  lat: number | null
  lon: number | null
  searchName: string
  source: 'wikidata' | 'overpass'
}

export type LocationSearchResult = {
  country: string
  city: string
  queryCountry: string
  queryCity: string
  lat: number | null
  lon: number | null
  universities: LocationUniversity[]
  sourcesUsed: string[]
}
