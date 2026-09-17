type CommonsFile = {
  title: string
  thumb: string
  sourceUrl: string
  author: string
  license: string
  date: string | null
  description: string
  categories: string
}

function meta(ext: Record<string, { value?: string } | undefined>, key: string) {
  return (ext?.[key]?.value ?? '').replace(/<[^>]+>/g, '').trim()
}

export async function searchCommons(query: string, limit = 12): Promise<CommonsFile[]> {
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
  const pages = Object.values(data?.query?.pages ?? {}) as {
    title: string
    imageinfo?: {
      thumburl?: string
      url?: string
      descriptionurl?: string
      timestamp?: string
      mime?: string
      size?: number
      extmetadata?: Record<string, { value?: string }>
    }[]
  }[]

  return pages
    .map((page) => {
      const info = page.imageinfo?.[0]
      if (!info) return null
      const mime = info.mime ?? ''
      if (mime && !mime.startsWith('image/')) return null
      if (mime.includes('svg') || page.title.toLowerCase().endsWith('.svg')) return null
      const ext = info.extmetadata ?? {}
      const thumb = (info.thumburl || info.url || '').split('?')[0]
      if (!thumb) return null
      const originalDate = meta(ext, 'DateTimeOriginal') || info.timestamp || null
      const dateMatch = originalDate?.match(/\d{4}-\d{2}-\d{2}/) ?? originalDate?.match(/\d{4}/)
      return {
        title: page.title.replace(/^File:/, ''),
        thumb,
        sourceUrl: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
        author: meta(ext, 'Artist') || 'Wikimedia Commons',
        license: meta(ext, 'LicenseShortName') || meta(ext, 'License') || 'см. источник',
        date: dateMatch?.[0] ?? null,
        description: meta(ext, 'ImageDescription'),
        categories: meta(ext, 'Categories'),
      }
    })
    .filter((x): x is CommonsFile => Boolean(x))
}

export async function collectCampusImages(names: string[], city: string) {
  const primary = names[0]
  const extra = names.slice(1)
  const queries: [string, number][] = [
    [`${primary} campus`, 16],
    [primary, 14],
    [`${primary} library`, 8],
    [`${primary} laboratory`, 8],
    [`${primary} student`, 8],
    [`${primary} dormitory`, 8],
    ...extra.map((name): [string, number] => [name, 10]),
    city ? [`${city} skyline`, 6] : ['', 0],
  ].filter((row): row is [string, number] => Boolean(row[0]))

  const batches = await Promise.all(queries.map(([q, limit]) => searchCommons(q, limit)))
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
