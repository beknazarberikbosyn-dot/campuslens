import type { CategoryId } from '../types'

export type CommonsFile = {
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
}

type ImageInfo = {
  thumburl?: string
  url?: string
  descriptionurl?: string
  timestamp?: string
  mime?: string
  extmetadata?: Record<string, { value?: string }>
}

function meta(ext: Record<string, { value?: string } | undefined>, key: string) {
  return (ext?.[key]?.value ?? '').replace(/<[^>]+>/g, '').trim()
}

function fromImageInfo(title: string, info: ImageInfo | undefined, extra?: Partial<CommonsFile>): CommonsFile | null {
  if (!info) return null
  const mime = info.mime ?? ''
  if (mime && !mime.startsWith('image/')) return null
  if (mime.includes('svg') || title.toLowerCase().endsWith('.svg')) return null
  const ext = info.extmetadata ?? {}
  const thumb = (info.thumburl || info.url || '').split('?')[0]
  if (!thumb) return null
  const originalDate = meta(ext, 'DateTimeOriginal') || info.timestamp || null
  const dateMatch = originalDate?.match(/\d{4}-\d{2}-\d{2}/) ?? originalDate?.match(/\d{4}/)
  return {
    title: title.replace(/^File:/, ''),
    thumb,
    sourceUrl: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
    author: meta(ext, 'Artist') || 'Wikimedia Commons',
    license: meta(ext, 'LicenseShortName') || meta(ext, 'License') || 'см. источник',
    date: dateMatch?.[0] ?? null,
    description: meta(ext, 'ImageDescription'),
    categories: meta(ext, 'Categories'),
    ...extra,
  }
}

export async function searchCommons(query: string, limit = 12, hint?: CategoryId): Promise<CommonsFile[]> {
  const url = new URL('https://commons.wikimedia.org/w/api.php')
  url.searchParams.set('origin', '*')
  url.searchParams.set('action', 'query')
  url.searchParams.set('generator', 'search')
  url.searchParams.set('gsrsearch', query)
  url.searchParams.set('gsrnamespace', '6')
  url.searchParams.set('gsrlimit', String(limit))
  url.searchParams.set('prop', 'imageinfo')
  url.searchParams.set('iiprop', 'url|extmetadata|timestamp|mime|size')
  url.searchParams.set('iiurlwidth', '1280')
  url.searchParams.set('format', 'json')
  const res = await fetch(url.toString())
  if (!res.ok) return []
  const data = await res.json()
  const pages = Object.values(data?.query?.pages ?? {}) as { title: string; imageinfo?: ImageInfo[] }[]
  return pages
    .map((page) => fromImageInfo(page.title, page.imageinfo?.[0], { hint }))
    .filter((x): x is CommonsFile => Boolean(x))
}

async function wikipediaPageImages(title: string, lang: 'en' | 'ru'): Promise<CommonsFile[]> {
  const listUrl = new URL(`https://${lang}.wikipedia.org/w/api.php`)
  listUrl.searchParams.set('origin', '*')
  listUrl.searchParams.set('action', 'query')
  listUrl.searchParams.set('prop', 'images')
  listUrl.searchParams.set('imlimit', '24')
  listUrl.searchParams.set('redirects', '1')
  listUrl.searchParams.set('titles', title)
  listUrl.searchParams.set('format', 'json')
  const listRes = await fetch(listUrl.toString())
  if (!listRes.ok) return []
  const list = (await listRes.json()) as {
    query?: { pages?: Record<string, { images?: { title: string }[] }> }
  }
  const files = (Object.values(list.query?.pages ?? {})[0]?.images ?? [])
    .map((img) => img.title)
    .filter((name) => /\.(jpe?g|png|webp)$/i.test(name))
    .slice(0, 16)
  if (!files.length) return []

  const infoUrl = new URL(`https://${lang}.wikipedia.org/w/api.php`)
  infoUrl.searchParams.set('origin', '*')
  infoUrl.searchParams.set('action', 'query')
  infoUrl.searchParams.set('titles', files.join('|'))
  infoUrl.searchParams.set('prop', 'imageinfo')
  infoUrl.searchParams.set('iiprop', 'url|extmetadata|timestamp|mime|size')
  infoUrl.searchParams.set('iiurlwidth', '1280')
  infoUrl.searchParams.set('format', 'json')
  const infoRes = await fetch(infoUrl.toString())
  if (!infoRes.ok) return []
  const info = (await infoRes.json()) as { query?: { pages?: Record<string, { title: string; imageinfo?: ImageInfo[] }> } }
  return Object.values(info.query?.pages ?? {})
    .map((page) => fromImageInfo(page.title, page.imageinfo?.[0], { fromWikiPage: true }))
    .filter((x): x is CommonsFile => Boolean(x))
}

async function commonsNear(lat: number, lon: number): Promise<CommonsFile[]> {
  const url = new URL('https://commons.wikimedia.org/w/api.php')
  url.searchParams.set('origin', '*')
  url.searchParams.set('action', 'query')
  url.searchParams.set('generator', 'geosearch')
  url.searchParams.set('ggscoord', `${lat}|${lon}`)
  url.searchParams.set('ggsradius', '900')
  url.searchParams.set('ggsnamespace', '6')
  url.searchParams.set('ggslimit', '12')
  url.searchParams.set('prop', 'imageinfo')
  url.searchParams.set('iiprop', 'url|extmetadata|timestamp|mime|size')
  url.searchParams.set('iiurlwidth', '1280')
  url.searchParams.set('format', 'json')
  const res = await fetch(url.toString())
  if (!res.ok) return []
  const data = await res.json()
  const pages = Object.values(data?.query?.pages ?? {}) as { title: string; imageinfo?: ImageInfo[] }[]
  return pages
    .map((page) => fromImageInfo(page.title, page.imageinfo?.[0], { hint: 'campus' }))
    .filter((x): x is CommonsFile => Boolean(x))
}

type SectorQuery = { q: string; limit: number; hint?: CategoryId }

function sectorQueries(name: string): SectorQuery[] {
  return [
    { q: `${name} campus`, limit: 8, hint: 'campus' },
    { q: `${name} library`, limit: 10, hint: 'library' },
    { q: `${name} dormitory`, limit: 10, hint: 'dorm' },
    { q: `${name} laboratory`, limit: 8, hint: 'lab' },
    { q: `${name} classroom`, limit: 8, hint: 'classroom' },
    { q: `${name} stadium`, limit: 6, hint: 'sport' },
    { q: `${name} students`, limit: 8, hint: 'life' },
    { q: `${name} библиотека`, limit: 8, hint: 'library' },
    { q: `${name} общежитие`, limit: 8, hint: 'dorm' },
  ]
}

export async function collectCampusImages(
  names: string[],
  city: string,
  extras?: { title?: string; lang?: 'en' | 'ru'; lat?: number | null; lon?: number | null },
) {
  const primary = names[0]
  const aliases = names.slice(1, 3)
  const queries: SectorQuery[] = [
    { q: primary, limit: 12 },
    ...sectorQueries(primary),
    ...aliases.flatMap((name) => [
      { q: name, limit: 8 },
      { q: `${name} library`, limit: 6, hint: 'library' as const },
      { q: `${name} dormitory`, limit: 6, hint: 'dorm' as const },
      { q: `${name} laboratory`, limit: 6, hint: 'lab' as const },
    ]),
    city ? { q: `${city} skyline`, limit: 6, hint: 'city' as const } : { q: '', limit: 0 },
    city ? { q: `${city} downtown`, limit: 5, hint: 'city' as const } : { q: '', limit: 0 },
  ].filter((row) => Boolean(row.q))

  const batches = await Promise.all([
    ...queries.map((row) => searchCommons(row.q, row.limit, row.hint)),
    extras?.title && extras.lang ? wikipediaPageImages(extras.title, extras.lang) : Promise.resolve([]),
    extras?.lat != null && extras.lon != null ? commonsNear(extras.lat, extras.lon) : Promise.resolve([]),
  ])
  const seen = new Set<string>()
  const files: CommonsFile[] = []
  for (const batch of batches) {
    for (const file of batch) {
      const key = file.title.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      files.push(file)
    }
  }
  return files
}
