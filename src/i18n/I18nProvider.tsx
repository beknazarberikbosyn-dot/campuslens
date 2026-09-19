import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { detectLang, LANG_STORAGE_KEY, type Lang } from './lang'
import { translate, type MessageKey } from './messages'

type Vars = Record<string, string | number>

type I18nContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: MessageKey, vars?: Vars) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detectLang())

  const setLang = (next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = translate(lang, 'doc.title')
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', translate(lang, 'doc.description'))
  }, [lang])

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
