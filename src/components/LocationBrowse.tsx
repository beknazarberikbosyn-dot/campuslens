import { useEffect, useState } from 'react'
import { cityLabel, countryLabel, useI18n } from '../i18n'
import { LOCATION_PRESETS, searchUniversitiesByLocation } from '../lib/places'
import type { LocationSearchResult } from '../types'
import { LanguageSwitcher } from './LanguageSwitcher'

export function LocationBrowse({
  initialCountry,
  initialCity,
  autoSearch,
  onHome,
  onOpen,
}: {
  initialCountry: string
  initialCity: string
  autoSearch: boolean
  onHome: () => void
  onOpen: (name: string) => void
}) {
  const { t, lang } = useI18n()
  const [country, setCountry] = useState(initialCountry)
  const [city, setCity] = useState(initialCity)
  const [result, setResult] = useState<LocationSearchResult | null>(null)
  const [loading, setLoading] = useState(
    autoSearch && Boolean(initialCountry.trim() || initialCity.trim()),
  )
  const [error, setError] = useState('')

  const run = async (nextCountry = country, nextCity = city) => {
    const c = nextCountry.trim()
    const tCity = nextCity.trim()
    if (!c && !tCity) {
      setError(t('error.placeRequired'))
      return
    }
    setCountry(c)
    setCity(tCity)
    setLoading(true)
    setError('')
    try {
      const found = await searchUniversitiesByLocation(c, tCity)
      setResult(found)
    } catch (e) {
      setResult(null)
      setError(e instanceof Error ? e.message : t('error.places'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!autoSearch) return
    const c = initialCountry.trim()
    const tCity = initialCity.trim()
    if (!c && !tCity) return
    let cancelled = false
    searchUniversitiesByLocation(c, tCity)
      .then((found) => {
        if (!cancelled) {
          setResult(found)
          setError('')
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setResult(null)
          setError(e instanceof Error ? e.message : t('error.places'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [autoSearch, initialCountry, initialCity, t])

  return (
    <div className="dark">
      <div className="topbar">
        <button className="brand" onClick={onHome}>
          <span className="mark" />
          CampusLens
        </button>
        <LanguageSwitcher />
        <div className="topbar-end">
          <button className="ghost" onClick={onHome}>
            {t('nav.home')}
          </button>
        </div>
      </div>
      <div className="places">
        <div className="kicker">{t('places.kicker')}</div>
        <h1>{t('places.title')}</h1>
        <p className="lede">{t('places.lede')}</p>
        <form
          className="place-search"
          onSubmit={(e) => {
            e.preventDefault()
            void run()
          }}
        >
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder={t('places.countryPh')}
            autoComplete="country-name"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t('places.cityPh')}
            autoComplete="address-level2"
          />
          <button type="submit" disabled={loading}>
            {loading ? t('places.searching') : t('places.search')}
          </button>
        </form>
        <div className="place-chips">
          {LOCATION_PRESETS.map((p) => (
            <button
              key={`${p.country}-${p.city}`}
              type="button"
              className="ghost"
              onClick={() => void run(p.country, p.city)}
            >
              {cityLabel(p.city, lang)}, {countryLabel(p.country, lang)}
            </button>
          ))}
        </div>
        {loading ? <p className="home-note">{t('places.loading')}</p> : null}
        {error ? <p className="place-error">{error}</p> : null}
        {result ? (
          <>
            <h2>
              {t('places.heading', { count: result.universities.length })}
              {result.city ? ` · ${result.city}` : ''}
              {result.country ? `, ${result.country}` : ''}
            </h2>
            <p className="home-note">
              {result.universities.length < 20
                ? t('places.few', { count: result.universities.length })
                : t('places.many', { count: result.universities.length })}{' '}
              {t('places.sources', { sources: result.sourcesUsed.join(', ') || t('places.openMaps') })}
            </p>
            <div className="place-list">
              {result.universities.map((uni, i) => (
                <button key={uni.id} className="choice" onClick={() => onOpen(uni.searchName || uni.name)}>
                  <b>
                    <span className="place-index">{String(i + 1).padStart(2, '0')}</span>
                    {uni.name}
                  </b>
                  <span>
                    {[uni.city, uni.country].filter(Boolean).join(', ')}
                    {uni.source === 'wikidata' ? ' · Wikidata' : ' · OpenStreetMap'}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
