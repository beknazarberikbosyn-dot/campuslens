import { campusHint } from '../data/mapHints'
import { normalize } from '../data/catalog'
import type { CampusPlace, MapSourceLink } from '../types'

const CACHE_KEY = 'campuslens-map-places-v1'

type OverpassElement = {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] }
  properties?: {
    name?: string
    street?: string
    housenumber?: string
    city?: string
    country?: string
    osm_id?: number
    osm_key?: string
    osm_value?: string
    website?: string
  }
}

function dgisHost(name: string, city?: string): string {
  const hint = campusHint(name)
  if (hint) return hint.dgisHost
  const blob = `${name} ${city ?? ''}`
  if (/астан|алмат|казах|қазақ|kz|атырау|шымкент|караган/i.test(blob)) return 'https://2gis.kz'
  return 'https://2gis.com'
}

export function mapSourceLinks(
  name: string,
  lat: number | null,
  lon: number | null,
  city?: string,
): MapSourceLink[] {
  const q = encodeURIComponent(name)
  const host = dgisHost(name, city)
  const hasGeo = lat != null && lon != null && Number.isFinite(lat) && Number.isFinite(lon)
  const googleQuery = hasGeo ? encodeURIComponent(`${name} ${lat},${lon}`) : q
  const yandex = hasGeo
    ? `https://yandex.ru/maps/?ll=${lon},${lat}&z=16&text=${q}`
    : `https://yandex.ru/maps/?text=${q}`
  const dgis = hasGeo
    ? `${host}/geo/${lon},${lat}?m=${lon}%2C${lat}%2F16&query=${q}`
    : `${host}/search/${q}`
  const osm = hasGeo
    ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`
    : `https://www.openstreetmap.org/search?query=${q}`
  const apple = hasGeo ? `https://maps.apple.com/?q=${q}&ll=${lat},${lon}` : `https://maps.apple.com/?q=${q}`

  return [
    {
      id: 'google',
      label: 'Google Maps',
      url: `https://www.google.com/maps/search/?api=1&query=${googleQuery}`,
      hint: 'Официальная карточка и отзывы Google',
    },
    {
      id: 'yandex',
      label: 'Яндекс Карты',
      url: yandex,
      hint: 'Организация и отзывы Яндекса',
    },
    {
      id: 'dgis',
      label: '2ГИС',
      url: dgis,
      hint: 'Карточка вуза и отзывы 2ГИС',
    },
    {
      id: 'osm',
      label: 'OpenStreetMap',
      url: osm,
      hint: 'Открытые координаты кампуса',
    },
    {
      id: 'apple',
      label: 'Apple Maps',
      url: apple,
      hint: 'Карточка места Apple',
    },
  ]
}

function readCache(): Record<string, CampusPlace> {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, CampusPlace>) : {}
  } catch {
    return {}
  }
}

function writeCache(name: string, place: CampusPlace) {
  try {
    const next = { ...readCache(), [normalize(name)]: place }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(next))
  } catch {
    /* ignore quota */
  }
}

function scoreName(candidate: string, query: string): number {
  const a = normalize(candidate)
  const b = normalize(query)
  if (!a || !b) return 0
  if (a === b) return 100
  if (a.includes(b) || b.includes(a)) return 80
  const words = b.split(' ').filter((w) => w.length > 2)
  return words.filter((w) => a.includes(w)).length * 12
}

function placeFromParts(
  query: string,
  name: string,
  address: string,
  lat: number | null,
  lon: number | null,
  extra: Partial<CampusPlace>,
): CampusPlace {
  const city = campusHint(query)?.city
  return {
    name,
    query,
    address,
    lat,
    lon,
    website: extra.website ?? null,
    wikipedia: extra.wikipedia ?? null,
    osmUrl: extra.osmUrl ?? (lat != null && lon != null
      ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`
      : null),
    provider: extra.provider ?? 'search',
    links: mapSourceLinks(name || query, lat, lon, city),
  }
}

async function lookupOverpass(lat: number, lon: number, query: string): Promise<CampusPlace | null> {
  const body = `[out:json][timeout:12];(nwr["amenity"="university"](around:1400,${lat},${lon});nwr["amenity"="college"](around:1400,${lat},${lon}););out tags center 6;`
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: new URLSearchParams({ data: body }),
    signal: AbortSignal.timeout(14000),
  })
  if (!res.ok) return null
  const data = (await res.json()) as { elements?: OverpassElement[] }
  const ranked = [...(data.elements ?? [])]
    .map((el) => {
      const tags = el.tags ?? {}
      const name = tags['name:en'] || tags.name || tags['name:ru'] || query
      const plat = el.lat ?? el.center?.lat ?? lat
      const plon = el.lon ?? el.center?.lon ?? lon
      return { el, tags, name, plat, plon, score: scoreName(name, query) }
    })
    .sort((a, b) => b.score - a.score)
  const best = ranked[0]
  if (!best) return null
  const address = [best.tags['addr:street'], best.tags['addr:housenumber'], best.tags['addr:city']]
    .filter(Boolean)
    .join(', ')
  const osmType = best.el.type === 'node' ? 'node' : best.el.type === 'way' ? 'way' : 'relation'
  return placeFromParts(query, best.name, address || 'Кампус на OpenStreetMap', best.plat, best.plon, {
    website: best.tags.website ?? best.tags['contact:website'] ?? null,
    wikipedia: best.tags.wikipedia ?? null,
    osmUrl: `https://www.openstreetmap.org/${osmType}/${best.el.id}`,
    provider: 'overpass',
  })
}

async function lookupPhoton(query: string, lat: number | null, lon: number | null): Promise<CampusPlace | null> {
  const url = new URL('https://photon.komoot.io/api/')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', '5')
  if (lat != null && lon != null) {
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lon))
  }
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) })
  if (!res.ok) return null
  const data = (await res.json()) as { features?: PhotonFeature[] }
  const features = data.features ?? []
  const ranked = features
    .map((f) => {
      const name = f.properties?.name || query
      const [plon, plat] = f.geometry?.coordinates ?? []
      return { f, name, plat, plon, score: scoreName(name, query) }
    })
    .sort((a, b) => b.score - a.score)
  const best = ranked[0]
  if (!best || best.plat == null || best.plon == null) return null
  const p = best.f.properties ?? {}
  const address = [p.housenumber, p.street, p.city, p.country].filter(Boolean).join(', ')
  return placeFromParts(query, best.name, address || 'Место на карте', best.plat, best.plon, {
    website: p.website ?? null,
    provider: 'photon',
    osmUrl:
      p.osm_id != null
        ? `https://www.openstreetmap.org/${p.osm_key === 'place' ? 'node' : 'way'}/${p.osm_id}`
        : null,
  })
}

export async function resolveCampusPlace(
  name: string,
  lat?: number | null,
  lon?: number | null,
): Promise<CampusPlace> {
  const cached = readCache()[normalize(name)]
  if (cached) return cached

  const hint = campusHint(name)
  const startLat = lat ?? hint?.lat ?? null
  const startLon = lon ?? hint?.lon ?? null

  try {
    if (startLat != null && startLon != null) {
      const osm = await lookupOverpass(startLat, startLon, name)
      if (osm) {
        writeCache(name, osm)
        return osm
      }
    }
    const photon = await lookupPhoton(name, startLat, startLon)
    if (photon) {
      writeCache(name, photon)
      return photon
    }
  } catch {
    /* fall through to search links */
  }

  const fallback = placeFromParts(
    name,
    hint?.title ?? name,
    hint ? `${hint.city} · координаты кампуса` : 'Карточка по названию вуза',
    startLat,
    startLon,
    { provider: hint ? 'hint' : 'search' },
  )
  writeCache(name, fallback)
  return fallback
}
