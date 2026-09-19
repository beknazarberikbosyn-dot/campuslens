import { useEffect, useMemo, useState } from 'react'
import { mapHint, useI18n } from '../i18n'
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
  const { t, lang } = useI18n()
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
        if (alive) setError(t('error.mapSearch'))
      })
    return () => {
      alive = false
    }
  }, [universityName, lat, lon, place, t])

  const links = resolved?.links?.length ? resolved.links : fallbackLinks

  return (
    <section className="map-sources">
      <div className="review-head">
        <div>
          <h3>{t('map.title')}</h3>
          <p className="meta">{t('map.note')}</p>
        </div>
      </div>
      {resolved ? (
        <p className="map-place">
          <b>{resolved.name}</b>
          <span>{resolved.address}</span>
        </p>
      ) : (
        <p className="meta">{t('map.resolving')}</p>
      )}
      {error ? <p className="meta">{error}</p> : null}
      <div className="map-links">
        {links.map((link) => (
          <a key={link.id} className="map-link" href={link.url} target="_blank" rel="noreferrer">
            <b>{link.id === 'yandex' ? t('map.yandex') : link.label}</b>
            <span>{mapHint(link.id, lang, link.hint)}</span>
          </a>
        ))}
      </div>
      {resolved?.website ? (
        <p className="meta">
          {t('map.osmSite')}{' '}
          <a href={resolved.website} target="_blank" rel="noreferrer">
            {resolved.website}
          </a>
        </p>
      ) : null}
    </section>
  )
}
