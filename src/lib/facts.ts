import { curatedFactsFor, KZ_GENERIC_FACTS } from '../data/uniFacts'
import type { FactItem, UniversityCore, UniversityFacts } from '../types'

type WikiSection = { index: number; line: string }

function stripHtml(s: string) {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function yearOf(iso?: string) {
  const m = iso?.match(/^(\d{4})/)
  return m?.[1] ?? null
}

async function wikidataId(title: string, lang: 'en' | 'ru') {
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`)
  url.searchParams.set('origin', '*')
  url.searchParams.set('action', 'query')
  url.searchParams.set('prop', 'pageprops')
  url.searchParams.set('ppprop', 'wikibase_item')
  url.searchParams.set('redirects', '1')
  url.searchParams.set('titles', title)
  url.searchParams.set('format', 'json')
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) })
  if (!res.ok) return null
  const data = (await res.json()) as {
    query?: { pages?: Record<string, { pageprops?: { wikibase_item?: string } }> }
  }
  const page = Object.values(data.query?.pages ?? {})[0]
  return page?.pageprops?.wikibase_item ?? null
}

async function wikidataFacts(id: string): Promise<{ items: FactItem[]; country: string | null; website: string | null }> {
  const res = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${id}.json`, {
    signal: AbortSignal.timeout(9000),
  })
  if (!res.ok) return { items: [], country: null, website: null }
  const data = (await res.json()) as {
    entities?: Record<
      string,
      {
        claims?: Record<string, { mainsnak?: { datavalue?: { value?: unknown } } }[]>
      }
    >
  }
  const claims = data.entities?.[id]?.claims ?? {}
  const first = (prop: string) => claims[prop]?.[0]?.mainsnak?.datavalue?.value
  const items: FactItem[] = []

  const inception = first('P571') as { time?: string } | undefined
  const founded = yearOf(inception?.time)
  if (founded) {
    items.push({
      id: 'founded',
      label: 'Год основания',
      value: founded,
      source: 'Wikidata',
      sourceUrl: `https://www.wikidata.org/wiki/${id}`,
    })
  }

  const students = first('P2196') as { amount?: string } | string | undefined
  const count = typeof students === 'string' ? students : students?.amount
  if (count) {
    items.push({
      id: 'students',
      label: 'Студентов',
      value: `${Number(count).toLocaleString('ru-RU')} (Wikidata)`,
      note: 'Цифра из карточки Wikidata, может отставать от текущего набора.',
      source: 'Wikidata P2196',
      sourceUrl: `https://www.wikidata.org/wiki/${id}`,
    })
  }

  const website = first('P856') as string | undefined
  if (website) {
    items.push({
      id: 'website',
      label: 'Официальный сайт',
      value: website.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      source: 'Wikidata',
      sourceUrl: website,
    })
  }

  const countryId = (first('P17') as { id?: string } | undefined)?.id ?? null
  return { items, country: countryId, website: website ?? null }
}

async function wikiAdmissionNote(title: string, lang: 'en' | 'ru'): Promise<FactItem | null> {
  const sectionsUrl = new URL(`https://${lang}.wikipedia.org/w/api.php`)
  sectionsUrl.searchParams.set('origin', '*')
  sectionsUrl.searchParams.set('action', 'parse')
  sectionsUrl.searchParams.set('page', title)
  sectionsUrl.searchParams.set('prop', 'sections')
  sectionsUrl.searchParams.set('format', 'json')
  const listRes = await fetch(sectionsUrl.toString(), { signal: AbortSignal.timeout(8000) })
  if (!listRes.ok) return null
  const list = (await listRes.json()) as { parse?: { sections?: WikiSection[] } }
  const wanted =
    lang === 'ru'
      ? /поступл|при[её]м|обучен|общежит|стоимост|грант/
      : /admission|tuition|fee|housing|dorm|residenc|scholarship|grant/
  const section = (list.parse?.sections ?? []).find((s) => wanted.test(s.line.toLowerCase()))
  if (!section) return null

  const textUrl = new URL(`https://${lang}.wikipedia.org/w/api.php`)
  textUrl.searchParams.set('origin', '*')
  textUrl.searchParams.set('action', 'parse')
  textUrl.searchParams.set('page', title)
  textUrl.searchParams.set('prop', 'text')
  textUrl.searchParams.set('section', String(section.index))
  textUrl.searchParams.set('disabletoc', '1')
  textUrl.searchParams.set('format', 'json')
  const textRes = await fetch(textUrl.toString(), { signal: AbortSignal.timeout(8000) })
  if (!textRes.ok) return null
  const parsed = (await textRes.json()) as { parse?: { text?: { '*'?: string } } }
  const text = stripHtml(parsed.parse?.text?.['*'] ?? '')
  if (text.length < 80) return null
  return {
    id: 'wiki-note',
    label: section.line,
    value: text.slice(0, 280).replace(/\s+\S*$/, '') + '…',
    note: 'Фрагмент Wikipedia, не официальный приказ приёмной комиссии.',
    source: 'Wikipedia',
    sourceUrl: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}#${encodeURIComponent(section.line)}`,
  }
}

export async function loadUniversityFacts(university: UniversityCore): Promise<UniversityFacts> {
  const items: FactItem[] = [university.displayName, university.title, ...university.searchNames].flatMap(
    curatedFactsFor,
  )
  const seen = new Set<string>()
  const unique = items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
  const sourcesUsed = unique.length ? ['официальные страницы вуза'] : []

  try {
    const id = await wikidataId(university.title, university.lang)
    if (id) {
      const wd = await wikidataFacts(id)
      for (const item of wd.items) {
        if (!seen.has(item.id)) {
          unique.push(item)
          seen.add(item.id)
        }
      }
      if (wd.items.length) sourcesUsed.push('Wikidata')
      if (wd.country === 'Q232' && !unique.some((i) => i.id === 'grant')) {
        for (const item of KZ_GENERIC_FACTS) {
          if (!seen.has(item.id)) {
            unique.push(item)
            seen.add(item.id)
          }
        }
        sourcesUsed.push('правила гранта РК')
      }
      if (!unique.some((i) => i.id === 'admission' || i.id === 'wiki-note')) {
        const note = await wikiAdmissionNote(university.title, university.lang)
        if (note) {
          unique.push(note)
          sourcesUsed.push('Wikipedia')
        }
      }
      return {
        items: unique,
        country: wd.country,
        website: wd.website,
        sourcesUsed: [...new Set(sourcesUsed)],
      }
    }
  } catch {
    /* keep curated */
  }

  if (!unique.length) {
    unique.push({
      id: 'missing',
      label: 'Справка',
      value: 'В открытых источниках нет устойчивых цифр по гранту, общежитию и порогу',
      note: 'Не подставляем чужие тарифы. Проверьте сайт приёмной комиссии этого вуза.',
      source: 'CampusLens',
    })
  }

  return { items: unique, country: null, website: null, sourcesUsed: [...new Set(sourcesUsed)] }
}
