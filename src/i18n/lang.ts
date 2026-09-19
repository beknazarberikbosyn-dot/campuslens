export const LANGS = ['en', 'kk', 'ru'] as const

export type Lang = (typeof LANGS)[number]

export const LANG_OPTIONS: { id: Lang; short: string; native: string }[] = [
  { id: 'en', short: 'EN', native: 'English' },
  { id: 'kk', short: 'KK', native: 'Қазақша' },
  { id: 'ru', short: 'RU', native: 'Русский' },
]

export const LANG_STORAGE_KEY = 'campuslens-lang'

export function isLang(value: string | null | undefined): value is Lang {
  return value === 'en' || value === 'kk' || value === 'ru'
}

export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY)
    if (isLang(saved)) return saved
  } catch {
    /* ignore */
  }
  const nav = typeof navigator === 'undefined' ? '' : navigator.language.toLowerCase()
  if (nav.startsWith('kk') || nav.startsWith('kz')) return 'kk'
  if (nav.startsWith('en')) return 'en'
  return 'ru'
}
