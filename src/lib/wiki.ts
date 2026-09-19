import { ALIASES, normalize, searchNamesFor } from '../data/catalog'
import type { UniversityCore, WikiHit } from '../types'

const UNI_RE =
  /universit|универс|колледж|college|institut|институт|академи|academ|polytech|политех|school of|высш/i

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
}

async function wikiSearch(lang: 'en' | 'ru', query: string): Promise<WikiHit[]> {
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`)
  url.searchParams.set('origin', '*')
  url.searchParams.set('action', 'query')
  url.searchParams.set('list', 'search')
  url.searchParams.set('srsearch', query)
  url.searchParams.set('srlimit', '8')
  url.searchParams.set('format', 'json')
  const res = await fetch(url.toString())
  if (!res.ok) return []
  const data = await res.json()
  return (data?.query?.search ?? []).map((row: { title: string; snippet: string; pageid: number }) => ({
    title: row.title,
    snippet: stripHtml(row.snippet ?? ''),
    lang,
    pageid: row.pageid,
  }))
}

export async function resolveCandidates(query: string): Promise<WikiHit[]> {
  const q = query.trim()
  if (!q) return []

  const alias = ALIASES[normalize(q)]
  if (alias?.length === 1) {
    return [{ title: alias[0], snippet: 'Совпадение по известному сокращению', lang: 'en', pageid: 0 }]
  }
  if (alias && alias.length > 1) {
    return alias.map((title, i) => ({
      title,
      snippet: 'Неоднозначное сокращение — выберите вуз',
      lang: 'en' as const,
      pageid: -i,
    }))
  }

  const hasCyr = /[а-яёәіңғүұқөһ]/i.test(q)
  const enQuery = UNI_RE.test(q) ? q : `${q} university`
  const primary = hasCyr ? await wikiSearch('ru', q) : await wikiSearch('en', enQuery)
  const secondary = hasCyr ? await wikiSearch('en', enQuery) : await wikiSearch('ru', q)
  const merged = [...primary, ...secondary]
  const seen = new Set<string>()
  const unique = merged.filter((h) => {
    const key = normalize(h.title)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const skipPage = /^(list of|colleges of|logo of|category:|template:|список )/i
  const universities = unique.filter(
    (h) =>
      !skipPage.test(h.title) &&
      (UNI_RE.test(h.title) || UNI_RE.test(h.snippet) || /university|университет/i.test(q)),
  )
  const nq = normalize(q)
  const pool = (universities.length ? universities : unique.slice(0, 5)).sort((a, b) => {
    const as = Number(normalize(a.title) === nq)
    const bs = Number(normalize(b.title) === nq)
    return bs - as
  })
  return pool.slice(0, 6)
}

export async function loadUniversity(title: string, lang: 'en' | 'ru' = 'en'): Promise<UniversityCore | null> {
  const tryLangs: ('en' | 'ru')[] = lang === 'ru' ? ['ru', 'en'] : ['ru', 'en']
  for (const l of tryLangs) {
    const url = new URL(`https://${l}.wikipedia.org/w/api.php`)
    url.searchParams.set('origin', '*')
    url.searchParams.set('action', 'query')
    url.searchParams.set('prop', 'extracts|pageimages|coordinates|info')
    url.searchParams.set('inprop', 'url')
    url.searchParams.set('exintro', '1')
    url.searchParams.set('explaintext', '1')
    url.searchParams.set('pithumbsize', '1400')
    url.searchParams.set('redirects', '1')
    url.searchParams.set('titles', title)
    url.searchParams.set('format', 'json')
    const res = await fetch(url.toString())
    if (!res.ok) continue
    const data = await res.json()
    const page = Object.values(data?.query?.pages ?? {})[0] as
      | {
          missing?: string
          title: string
          extract?: string
          fullurl?: string
          thumbnail?: { source: string }
          coordinates?: { lat: number; lon: number }[]
        }
      | undefined
    if (!page || page.missing) continue
    const extract = (page.extract ?? '').trim()
    if (!extract) continue
    return {
      title: page.title,
      displayName: page.title,
      searchNames: searchNamesFor(title, page.title),
      extract,
      lang: l,
      pageUrl: page.fullurl ?? `https://${l}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
      thumbnail: page.thumbnail?.source ?? null,
      lat: page.coordinates?.[0]?.lat ?? null,
      lon: page.coordinates?.[0]?.lon ?? null,
      cityHint: extract.split(/[.,]/)[0] ?? '',
    }
  }
  return null
}

export function needsDisambiguation(query: string, hits: WikiHit[]) {
  if (hits.length === 0) return false
  if (hits.length === 1) return false
  const n = normalize(query)
  if (n.length <= 4) return true
  if (ALIASES[n]?.length && ALIASES[n].length > 1) return true
  const first = normalize(hits[0].title)
  if (first === n || first.includes(n) || n.includes(first)) return false
  return hits.length > 1
}
