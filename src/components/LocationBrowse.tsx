import { useEffect, useState } from 'react'
import { LOCATION_PRESETS, searchUniversitiesByLocation } from '../lib/places'
import type { LocationSearchResult } from '../types'

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
  const [country, setCountry] = useState(initialCountry)
  const [city, setCity] = useState(initialCity)
  const [result, setResult] = useState<LocationSearchResult | null>(null)
  const [loading, setLoading] = useState(
    autoSearch && Boolean(initialCountry.trim() || initialCity.trim()),
  )
  const [error, setError] = useState('')

  const run = async (nextCountry = country, nextCity = city) => {
    const c = nextCountry.trim()
    const t = nextCity.trim()
    if (!c && !t) {
      setError('Укажите страну или город')
      return
    }
    setCountry(c)
    setCity(t)
    setLoading(true)
    setError('')
    try {
      const found = await searchUniversitiesByLocation(c, t)
      setResult(found)
    } catch (e) {
      setResult(null)
      setError(e instanceof Error ? e.message : 'Не получилось найти вузы по этому адресу')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!autoSearch) return
    const c = initialCountry.trim()
    const t = initialCity.trim()
    if (!c && !t) return
    let cancelled = false
    searchUniversitiesByLocation(c, t)
      .then((found) => {
        if (!cancelled) {
          setResult(found)
          setError('')
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setResult(null)
          setError(e instanceof Error ? e.message : 'Не получилось найти вузы по этому адресу')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [autoSearch, initialCountry, initialCity])

  return (
    <div className="dark">
      <div className="topbar">
        <button className="brand" onClick={onHome}>
          <span className="mark" />
          CampusLens
        </button>
        <button className="ghost" onClick={onHome}>
          На главную
        </button>
      </div>
      <div className="places">
        <div className="kicker">Поиск по адресу</div>
        <h1>Вузы страны и города</h1>
        <p className="lede">
          Укажите страну и город — покажем 20–25 университетов из открытых карт и Wikidata. Карточку
          профиля можно собрать по любому названию из списка.
        </p>
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
            placeholder="Страна: Казахстан, США…"
            autoComplete="country-name"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Город: Алматы, Boston…"
            autoComplete="address-level2"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Ищем…' : 'Найти вузы'}
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
              {p.city}, {p.country}
            </button>
          ))}
        </div>
        {loading ? <p className="home-note">Сверяем Wikidata, Photon и OpenStreetMap…</p> : null}
        {error ? <p className="place-error">{error}</p> : null}
        {result ? (
          <>
            <h2>
              {result.universities.length} вузов
              {result.city ? ` · ${result.city}` : ''}
              {result.country ? `, ${result.country}` : ''}
            </h2>
            <p className="home-note">
              {result.universities.length < 20
                ? `В этом городе нашлось ${result.universities.length} вузов — без подмеса других городов.`
                : `Показываем ${result.universities.length} вузов по этому адресу.`}{' '}
              Источники: {result.sourcesUsed.join(', ') || 'открытые карты'}. Нажмите карточку, чтобы
              собрать визуальный профиль.
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
