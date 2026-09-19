import { LANG_OPTIONS } from '../i18n'
import { useI18n } from '../i18n/I18nProvider'

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n()

  return (
    <div className="lang-switch" role="group" aria-label={t('lang.label')}>
      {LANG_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className={lang === option.id ? 'on' : ''}
          aria-pressed={lang === option.id}
          aria-label={option.native}
          onClick={() => setLang(option.id)}
        >
          {option.short}
        </button>
      ))}
    </div>
  )
}
