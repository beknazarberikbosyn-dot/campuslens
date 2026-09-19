import { curatedPhotosFor, CITY_PHOTOS } from '../data/uniPhotos'
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
  curated?: boolean
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
  if (/\.(pdf|djvu|ogg|webm|ogv)$/i.test(title)) return null
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

async function imageInfoFor(titles: string[], extra?: Partial<CommonsFile>): Promise<CommonsFile[]> {
  const clean = [...new Set(titles.map((t) => (t.startsWith('File:') ? t : `File:${t}`)))].filter(Boolean)
  if (!clean.length) return []
  const out: CommonsFile[] = []
  for (let i = 0; i < clean.length; i += 40) {
    const chunk = clean.slice(i, i + 40)
    const url = new URL('https://commons.wikimedia.org/w/api.php')
    url.searchParams.set('origin', '*')
    url.searchParams.set('action', 'query')
    url.searchParams.set('titles', chunk.join('|'))
    url.searchParams.set('prop', 'imageinfo')
    url.searchParams.set('iiprop', 'url|extmetadata|timestamp|mime|size')
    url.searchParams.set('iiurlwidth', '1280')
    url.searchParams.set('format', 'json')
    const res = await fetch(url.toString())
    if (!res.ok) continue
    const data = (await res.json()) as { query?: { pages?: Record<string, { title: string; missing?: string; imageinfo?: ImageInfo[] }> } }
    for (const page of Object.values(data.query?.pages ?? {})) {
      if (page.missing) continue
      const file = fromImageInfo(page.title, page.imageinfo?.[0], extra)
      if (file) out.push(file)
    }
  }
  return out
}

export async function searchCommons(query: string, limit = 12, hint?: CategoryId): Promise<CommonsFile[]> {
  const url = new URL('https://commons.wikimedia.org/w/api.php')
  url.searchParams.set('origin', '*')
  url.searchParams.set('action', 'query')
  url.searchParams.set('generator', 'search')
  url.searchParams.set('gsrsearch', `${query} filetype:bitmap`)
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
  listUrl.searchParams.set('imlimit', '40')
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
    .slice(0, 24)
  return imageInfoFor(files, { fromWikiPage: true })
}

async function commonsNear(lat: number, lon: number): Promise<CommonsFile[]> {
  const url = new URL('https://commons.wikimedia.org/w/api.php')
  url.searchParams.set('origin', '*')
  url.searchParams.set('action', 'query')
  url.searchParams.set('generator', 'geosearch')
  url.searchParams.set('ggscoord', `${lat}|${lon}`)
  url.searchParams.set('ggsradius', '900')
  url.searchParams.set('ggsnamespace', '6')
  url.searchParams.set('ggslimit', '16')
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

async function commonsCategoryFiles(category: string): Promise<CommonsFile[]> {
  const url = new URL('https://commons.wikimedia.org/w/api.php')
  url.searchParams.set('origin', '*')
  url.searchParams.set('action', 'query')
  url.searchParams.set('list', 'categorymembers')
  url.searchParams.set('cmtitle', category.startsWith('Category:') ? category : `Category:${category}`)
  url.searchParams.set('cmtype', 'file')
  url.searchParams.set('cmlimit', '40')
  url.searchParams.set('format', 'json')
  const res = await fetch(url.toString())
  if (!res.ok) return []
  const data = (await res.json()) as { query?: { categorymembers?: { title: string }[] } }
  const titles = (data.query?.categorymembers ?? []).map((m) => m.title)
  return imageInfoFor(titles, { fromWikiPage: true })
}

type SectorQuery = { q: string; limit: number; hint?: CategoryId }

function sectorQueries(name: string): SectorQuery[] {
  return [
    { q: `${name} campus`, limit: 8, hint: 'campus' },
    { q: `${name} library`, limit: 10, hint: 'library' },
    { q: `${name} reading room`, limit: 6, hint: 'library' },
    { q: `${name} dormitory`, limit: 10, hint: 'dorm' },
    { q: `${name} residence hall`, limit: 8, hint: 'dorm' },
    { q: `${name} student housing`, limit: 6, hint: 'dorm' },
    { q: `${name} laboratory`, limit: 8, hint: 'lab' },
    { q: `${name} classroom`, limit: 8, hint: 'classroom' },
    { q: `${name} lecture hall`, limit: 8, hint: 'classroom' },
    { q: `${name} auditorium`, limit: 6, hint: 'classroom' },
    { q: `${name} stadium`, limit: 6, hint: 'sport' },
    { q: `${name} gym`, limit: 6, hint: 'sport' },
    { q: `${name} students`, limit: 8, hint: 'life' },
    { q: `${name} cafeteria`, limit: 6, hint: 'life' },
    { q: `${name} dining hall`, limit: 6, hint: 'life' },
    { q: `${name} библиотека`, limit: 8, hint: 'library' },
    { q: `${name} общежитие`, limit: 8, hint: 'dorm' },
    { q: `${name} аудитория`, limit: 6, hint: 'classroom' },
    { q: `${name} столовая`, limit: 6, hint: 'life' },
    { q: `${name} спорткомплекс`, limit: 6, hint: 'sport' },
  ]
}

function mergeFiles(batches: CommonsFile[][]) {
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

export async function collectCampusImages(
  names: string[],
  city: string,
  extras?: { title?: string; lang?: 'en' | 'ru'; lat?: number | null; lon?: number | null },
) {
  const primary = names[0]
  const aliases = names.slice(1, 3)
  const curated = names.map(curatedPhotosFor).find(Boolean) ?? null
  const queries: SectorQuery[] = [
    { q: primary, limit: 12 },
    ...sectorQueries(primary),
    ...aliases.flatMap((name) => [
      { q: name, limit: 8 },
      { q: `${name} library`, limit: 6, hint: 'library' as const },
      { q: `${name} dormitory`, limit: 6, hint: 'dorm' as const },
      { q: `${name} laboratory`, limit: 6, hint: 'lab' as const },
      { q: `${name} lecture hall`, limit: 6, hint: 'classroom' as const },
    ]),
    city ? { q: `${city} skyline`, limit: 6, hint: 'city' as const } : { q: '', limit: 0 },
    city ? { q: `${city} downtown`, limit: 5, hint: 'city' as const } : { q: '', limit: 0 },
  ].filter((row) => Boolean(row.q))

  const cityFiles = CITY_PHOTOS[city] ?? []
  const batches = await Promise.all([
    curated
      ? imageInfoFor(
          curated.files.map((f) => f.title),
          { curated: true },
        ).then((files) =>
          files.map((file) => {
            const hit = curated.files.find((row) => row.title.toLowerCase() === file.title.toLowerCase())
            return hit ? { ...file, hint: hit.hint, curated: true } : file
          }),
        )
      : Promise.resolve([]),
    cityFiles.length
      ? imageInfoFor(
          cityFiles.map((f) => f.title),
          { curated: true },
        ).then((files) =>
          files.map((file) => {
            const hit = cityFiles.find((row) => row.title.toLowerCase() === file.title.toLowerCase())
            return { ...file, hint: hit?.hint ?? 'city', curated: true }
          }),
        )
      : Promise.resolve([]),
    curated ? commonsCategoryFiles(curated.category) : Promise.resolve([]),
    ...queries.map((row) => searchCommons(row.q, row.limit, row.hint)),
    extras?.title ? wikipediaPageImages(extras.title, extras.lang ?? 'en') : Promise.resolve([]),
    extras?.title ? wikipediaPageImages(extras.title, extras.lang === 'ru' ? 'en' : 'ru') : Promise.resolve([]),
    extras?.lat != null && extras.lon != null ? commonsNear(extras.lat, extras.lon) : Promise.resolve([]),
  ])
  return mergeFiles(batches)
}
