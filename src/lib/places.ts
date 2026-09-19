import { normalize } from '../data/catalog'
import type { LocationSearchResult, LocationUniversity } from '../types'

const TARGET_MIN = 20
const TARGET_MAX = 25

export const LOCATION_PRESETS = [
  { country: 'Казахстан', city: 'Алматы' },
  { country: 'Казахстан', city: 'Астана' },
  { country: 'Казахстан', city: 'Шымкент' },
  { country: 'США', city: 'Boston' },
  { country: 'Великобритания', city: 'Oxford' },
  { country: 'Россия', city: 'Москва' },
]

type PhotonProps = {
  name?: string
  city?: string
  country?: string
  countrycode?: string
  osm_value?: string
  type?: string
}

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] }
  properties?: PhotonProps
}

type OverpassElement = {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

type SparqlValue = { value?: string }
type SparqlRow = Record<string, SparqlValue>

const JUNK_NAME =
  /факультет|faculty of|department of|кафедра|общежит|dormitor|библиотека|library|лаборатор|campus of|филиал|kindergarten|школа №|school no|корпус\s*\d|building\s*\d|parking|stadium|hospital|clinic/i

function wikiTitleFromUrl(url?: string): string | null {
  if (!url) return null
  const raw = url.split('/wiki/')[1]
  if (!raw) return null
  return decodeURIComponent(raw.replace(/_/g, ' '))
}

function parsePoint(value?: string): { lat: number; lon: number } | null {
  if (!value) return null
  const m = value.match(/Point\(\s*([-0-9.]+)\s+([-0-9.]+)\s*\)/i)
  if (!m) return null
  const lon = Number(m[1])
  const lat = Number(m[2])
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return { lat, lon }
}

function cleanName(name: string): string {
  return name.replace(/\s+/g, ' ').trim()
}

function isUsefulName(name: string): boolean {
  const n = cleanName(name)
  if (n.length < 6) return false
  if (/^(university|университет|college|колледж)$/i.test(n)) return false
  if (JUNK_NAME.test(n)) return false
  return /universit|универс|institut|институт|академи|academ|polytech|политех|колледж|college|школа|school|консерватор|conservator/i.test(
    n,
  )
}

function nameKey(name: string): string {
  return normalize(name)
    .replace(/\b(the|university|of|университет|им|имени|national|государственный)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const CITY_GROUPS = [
  ['алмат', 'almat', 'алма-ат'],
  ['астан', 'astan', 'нур-султан', 'nur-sultan'],
  ['шымкент', 'shymkent', 'chimkent'],
  ['москв', 'moscow'],
  ['boston', 'бостон'],
  ['oxford', 'оксфорд'],
]

function cityAliases(city: string): string[] {
  const n = normalize(city)
  const aliases = new Set<string>()
  if (city) aliases.add(city)
  if (/алмат|almat|алма-ат/.test(n)) {
    aliases.add('Алматы')
    aliases.add('Almaty')
    aliases.add('Алма-Ата')
  }
  if (/астан|astan|нур-султан|nur-sultan/.test(n)) {
    aliases.add('Астана')
    aliases.add('Astana')
    aliases.add('Нур-Султан')
    aliases.add('Nur-Sultan')
  }
  if (/шымкент|shymkent/.test(n)) {
    aliases.add('Шымкент')
    aliases.add('Shymkent')
  }
  if (/москв|moscow/.test(n)) {
    aliases.add('Москва')
    aliases.add('Moscow')
  }
  return [...aliases]
}

function citiesMatch(a: string, b: string): boolean {
  const na = normalize(a)
  const nb = normalize(b)
  if (!na || !nb) return false
  if (na.includes(nb) || nb.includes(na)) return true
  return CITY_GROUPS.some((group) => group.some((x) => na.includes(x)) && group.some((x) => nb.includes(x)))
}

function mergeUnis(items: LocationUniversity[]): LocationUniversity[] {
  const byKey = new Map<string, LocationUniversity>()
  for (const item of items) {
    const key = nameKey(item.name) || normalize(item.name)
    if (!key) continue
    const prev = byKey.get(key)
    if (!prev) {
      byKey.set(key, item)
      continue
    }
    const preferCurrent =
      (item.source === 'wikidata' && prev.source !== 'wikidata') ||
      (item.searchName.length > prev.searchName.length && item.source === prev.source)
    if (preferCurrent) byKey.set(key, { ...prev, ...item, id: prev.id })
  }
  return [...byKey.values()]
}

async function geocodePlace(country: string, city: string) {
  const q = [city, country].filter(Boolean).join(', ')
  const url = new URL('https://photon.komoot.io/api/')
  url.searchParams.set('q', q)
  url.searchParams.set('limit', '3')
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) })
  if (!res.ok) return null
  const data = (await res.json()) as { features?: PhotonFeature[] }
  const features = data.features ?? []
  const ranked = [...features].sort((a, b) => {
    const av = a.properties?.osm_value ?? a.properties?.type ?? ''
    const bv = b.properties?.osm_value ?? b.properties?.type ?? ''
    const score = (v: string) =>
      v === 'city' || v === 'town' ? 3 : v === 'state' || v === 'county' ? 2 : v === 'country' ? 1 : 0
    return score(bv) - score(av)
  })
  const best = ranked[0]
  const [lon, lat] = best?.geometry?.coordinates ?? []
  if (!best || lat == null || lon == null) return null
  const p = best.properties ?? {}
  const kind = p.osm_value ?? p.type ?? ''
  return {
    lat,
    lon,
    city: city || p.city || p.name || '',
    country: country || p.country || '',
    countryCode: (p.countrycode ?? '').toUpperCase(),
    isCountry: kind === 'country',
  }
}

async function queryWikidata(sparql: string): Promise<SparqlRow[]> {
  const url = new URL('https://query.wikidata.org/sparql')
  url.searchParams.set('query', sparql)
  url.searchParams.set('format', 'json')
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/sparql-results+json' },
    signal: AbortSignal.timeout(18000),
  })
  if (!res.ok) return []
  const data = (await res.json()) as { results?: { bindings?: SparqlRow[] } }
  return data.results?.bindings ?? []
}

function fromWikidata(rows: SparqlRow[], fallbackCity: string, fallbackCountry: string): LocationUniversity[] {
  return rows
    .map((row, i) => {
      const name = cleanName(row.itemLabel?.value ?? '')
      const wiki = wikiTitleFromUrl(row.enwiki?.value) ?? wikiTitleFromUrl(row.ruwiki?.value)
      const point = parsePoint(row.coord?.value)
      return {
        id: row.item?.value ?? `wd-${i}`,
        name,
        city: row.cityLabel?.value ?? fallbackCity,
        country: row.countryLabel?.value ?? fallbackCountry,
        lat: point?.lat ?? null,
        lon: point?.lon ?? null,
        searchName: wiki ?? name,
        source: 'wikidata' as const,
      }
    })
    .filter((item) => item.name && isUsefulName(item.name))
}

async function wikidataAround(lat: number, lon: number, radiusKm: number, city: string, country: string) {
  const sparql = `
SELECT DISTINCT ?item ?itemLabel ?cityLabel ?countryLabel ?coord ?enwiki ?ruwiki WHERE {
  SERVICE wikibase:around {
    ?item wdt:P625 ?coord .
    bd:serviceParam wikibase:center "Point(${lon} ${lat})"^^geo:wktLiteral .
    bd:serviceParam wikibase:radius "${radiusKm}" .
  }
  ?item wdt:P31/wdt:P279* wd:Q3918 .
  OPTIONAL { ?item wdt:P131 ?city . }
  OPTIONAL { ?item wdt:P17 ?country . }
  OPTIONAL { ?enwiki schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }
  OPTIONAL { ?ruwiki schema:about ?item ; schema:isPartOf <https://ru.wikipedia.org/> . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ru,en". }
}
LIMIT 40`
  return fromWikidata(await queryWikidata(sparql), city, country)
}

async function wikidataByCountry(countryCode: string, countryLabel: string, cityLabel: string) {
  const sparql = `
SELECT DISTINCT ?item ?itemLabel ?cityLabel ?countryLabel ?coord ?enwiki ?ruwiki ?links WHERE {
  ?item wdt:P31 wd:Q3918 .
  ?item wdt:P17 ?country .
  ?country wdt:P297 "${countryCode}" .
  OPTIONAL { ?item wdt:P131 ?city . }
  OPTIONAL { ?item wdt:P625 ?coord . }
  OPTIONAL { ?enwiki schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }
  OPTIONAL { ?ruwiki schema:about ?item ; schema:isPartOf <https://ru.wikipedia.org/> . }
  OPTIONAL { ?item wikibase:sitelinks ?links . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ru,en". }
}
ORDER BY DESC(?links)
LIMIT 40`
  return fromWikidata(await queryWikidata(sparql), cityLabel, countryLabel)
}

function sparqlLiteral(value: string, lang: string) {
  return `"${value.replace(/"/g, '')}"@${lang}`
}

async function wikidataByCity(city: string, country: string) {
  const names = cityAliases(city)
  if (!names.length) return []
  const values = names
    .flatMap((name) => [sparqlLiteral(name, 'ru'), sparqlLiteral(name, 'en')])
    .join(' ')
  const sparql = `
SELECT DISTINCT ?item ?itemLabel ?cityLabel ?countryLabel ?coord ?enwiki ?ruwiki WHERE {
  VALUES ?cityName { ${values} }
  ?place rdfs:label ?cityName .
  ?item wdt:P131 ?place .
  ?item wdt:P31/wdt:P279* wd:Q3918 .
  OPTIONAL { ?item wdt:P17 ?country . }
  OPTIONAL { ?item wdt:P625 ?coord . }
  OPTIONAL { ?enwiki schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }
  OPTIONAL { ?ruwiki schema:about ?item ; schema:isPartOf <https://ru.wikipedia.org/> . }
  BIND(?place AS ?city)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ru,en". }
}
LIMIT 40`
  return fromWikidata(await queryWikidata(sparql), city, country)
}

async function overpassAround(lat: number, lon: number, radiusM: number, city: string, country: string) {
  const body = `[out:json][timeout:20];(nwr["amenity"="university"](around:${radiusM},${lat},${lon}););out tags center 80;`
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: new URLSearchParams({ data: body }),
    signal: AbortSignal.timeout(22000),
  })
  if (!res.ok) return []
  const data = (await res.json()) as { elements?: OverpassElement[] }
  return (data.elements ?? [])
    .map((el) => {
      const tags = el.tags ?? {}
      const name = cleanName(tags['name:en'] || tags['name:ru'] || tags.name || '')
      return {
        id: `osm-${el.type}-${el.id}`,
        name,
        city: tags['addr:city'] || city,
        country,
        lat: el.lat ?? el.center?.lat ?? null,
        lon: el.lon ?? el.center?.lon ?? null,
        searchName: name,
        source: 'overpass' as const,
      }
    })
    .filter((item) => item.name && isUsefulName(item.name))
}

function rankUnis(items: LocationUniversity[], city: string): LocationUniversity[] {
  return [...items].sort((a, b) => {
    const aCity = city && citiesMatch(a.city, city) ? 1 : 0
    const bCity = city && citiesMatch(b.city, city) ? 1 : 0
    if (bCity !== aCity) return bCity - aCity
    if (a.source !== b.source) return a.source === 'wikidata' ? -1 : 1
    return a.name.localeCompare(b.name, 'ru')
  })
}

export async function searchUniversitiesByLocation(
  countryRaw: string,
  cityRaw: string,
): Promise<LocationSearchResult> {
  const country = countryRaw.trim()
  const city = cityRaw.trim()
  if (!country && !city) {
    throw new Error('Укажите страну или город')
  }

  const sourcesUsed: string[] = []
  const place = await geocodePlace(country, city)
  if (!place) {
    throw new Error('Такое место не нашлось. Проверьте написание страны и города.')
  }
  sourcesUsed.push('Photon')

  const resolvedCity = city || (place.isCountry ? '' : place.city)
  const resolvedCountry = country || place.country
  let found: LocationUniversity[] = []

  const localTasks: Promise<LocationUniversity[]>[] = []
  if (resolvedCity) {
    localTasks.push(wikidataByCity(resolvedCity, resolvedCountry).catch(() => []))
  }
  if (!place.isCountry) {
    localTasks.push(
      wikidataAround(place.lat, place.lon, 35, resolvedCity, resolvedCountry).catch(() => []),
    )
    localTasks.push(overpassAround(place.lat, place.lon, 35000, resolvedCity, resolvedCountry).catch(() => []))
  }

  const localChunks = await Promise.all(localTasks)
  if (localChunks.some((chunk) => chunk.length)) sourcesUsed.push('Wikidata', 'OpenStreetMap')
  found = mergeUnis(localChunks.flat())
  if (resolvedCity) {
    const localOnly = found.filter((item) => citiesMatch(item.city, resolvedCity) || !item.city)
    if (localOnly.length >= 8) found = localOnly
  }

  if (found.length < TARGET_MIN && !place.isCountry) {
    try {
      const wider = await overpassAround(place.lat, place.lon, 60000, resolvedCity, resolvedCountry)
      if (wider.length) sourcesUsed.push('OpenStreetMap')
      found = mergeUnis([...found, ...wider])
    } catch {
      /* keep what we have */
    }
  }

  if (found.length < 8 && place.countryCode) {
    try {
      const countryWide = await wikidataByCountry(place.countryCode, resolvedCountry, resolvedCity)
      if (countryWide.length) sourcesUsed.push('Wikidata')
      found = mergeUnis([...found, ...countryWide])
    } catch {
      /* keep what we have */
    }
  }

  const universities = rankUnis(found, resolvedCity).slice(0, TARGET_MAX)
  if (!universities.length) {
    throw new Error('Рядом не нашлось вузов в открытых источниках. Попробуйте другой город.')
  }

  return {
    country: resolvedCountry,
    city: resolvedCity,
    queryCountry: country,
    queryCity: city,
    lat: place.lat,
    lon: place.lon,
    universities,
    sourcesUsed: [...new Set(sourcesUsed)],
  }
}
