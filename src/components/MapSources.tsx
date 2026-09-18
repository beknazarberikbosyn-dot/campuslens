import { useEffect, useMemo, useState } from 'react'
import { mapSourceLinks, resolveCampusPlace } from '../lib/maps'
import type { CampusPlace } from '../types'

export function MapSources({
  universityName,
  lat,
  lon,
  place,
}: {
  universityName: string
  lat?: number | null
  lon?: number | null
  place?: CampusPlace | null
}) {
  const fallbackLinks = useMemo(
    () => mapSourceLinks(universityName, lat ?? null, lon ?? null),
    [universityName, lat, lon],
  )
  const [resolved, setResolved] = useState<CampusPlace | null>(place ?? null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (place) {
      setResolved(place)
      setError('')
      return
    }
    let alive = true
    setError('')
    void resolveCampusPlace(universityName, lat, lon)
      .then((next) => {
        if (alive) setResolved(next)
      })
      .catch(() => {
        if (alive) setError('Живой поиск места сейчас недоступен — открывайте карточки по названию вуза.')
      })
    return () => {
      alive = false
    }
  }, [universityName, lat, lon, place])

  const links = resolved?.links?.length ? resolved.links : fallbackLinks

  return (
    <section className="map-sources">
      <div className="review-head">
        <div>
          <h3>Карточки вуза на картах</h3>
          <p className="meta">
            Открываем официальные страницы 2ГИС, Google и Яндекса. Тексты чужих отзывов не копируем —
            это запрещено правилами карт. Здесь остаются отзывы CampusLens.
          </p>
        </div>
      </div>
      {resolved ? (
        <p className="map-place">
          <b>{resolved.name}</b>
          <span>{resolved.address}</span>
        </p>
      ) : (
        <p className="meta">Уточняем адрес кампуса на OpenStreetMap…</p>
      )}
      {error ? <p className="meta">{error}</p> : null}
      <div className="map-links">
        {links.map((link) => (
          <a key={link.id} className="map-link" href={link.url} target="_blank" rel="noreferrer">
            <b>{link.label}</b>
            <span>{link.hint}</span>
          </a>
        ))}
      </div>
      {resolved?.website ? (
        <p className="meta">
          Сайт с OSM:{' '}
          <a href={resolved.website} target="_blank" rel="noreferrer">
            {resolved.website}
          </a>
        </p>
      ) : null}
    </section>
  )
}
