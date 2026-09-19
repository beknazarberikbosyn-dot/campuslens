import { FILTERS } from '../data/catalog'
import { filterLabel, levelLabel, useI18n } from '../i18n'
import { LanguageSwitcher } from './LanguageSwitcher'
import { MapSources } from './MapSources'
import { ProfileReviews } from './Reviews'
import type { FactItem, Photo, VisualProfile } from '../types'

function osm(lat: number, lon: number) {
  const d = 0.02
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - d}%2C${lat - d}%2C${lon + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lon}`
}

export function ProfileView({
  profile,
  filter,
  setFilter,
  onOpen,
  onHome,
  onCompare,
  onRatings,
  onReviewSaved,
}: {
  profile: VisualProfile
  filter: string
  setFilter: (v: string) => void
  onOpen: (p: Photo) => void
  onHome: () => void
  onCompare: () => void
  onRatings: () => void
  onReviewSaved: () => void
}) {
  const { t, lang } = useI18n()
  const photos =
    filter === 'all' ? profile.photos : profile.photos.filter((p) => p.category === filter)
  const hero =
    profile.photos.find((p) => p.category === 'campus' && p.level === 'verified') ||
    profile.photos.find((p) => p.category === 'campus') ||
    profile.photos.find((p) => p.category === 'city') ||
    profile.photos[0]
  const verified = profile.photos.filter((p) => p.level === 'verified').length
  const u = profile.university

  return (
    <div className="paper-page">
      <div className="topbar">
        <button className="brand" onClick={onHome}>
          <span className="mark" />
          CampusLens
        </button>
        <div className="topbar-end">
          <button className="ghost" onClick={onRatings}>
            {t('nav.ratings')}
          </button>
          <button className="ghost" onClick={onCompare}>
            {t('nav.compare')}
          </button>
          <button className="ghost" onClick={onHome}>
            {t('nav.newSearch')}
          </button>
          <LanguageSwitcher />
        </div>
      </div>

      <section className="profile-hero">
        <div className="hero-photo">
          {hero ? <img src={hero.thumb} alt={hero.title} /> : null}
          {hero ? (
            <div className="cap">
              {hero.title} · {hero.date ?? t('profile.dateUnknown')} · {levelLabel(hero.level, lang)}
            </div>
          ) : null}
        </div>
        <div className="hero-copy">
          <div className="chip">{t('profile.chip')}</div>
          <h1>{u.displayName}</h1>
          <p className="meta">
            {profile.city?.name ?? t('profile.cityUnknown')}
            {profile.distanceKm != null ? ` · ${t('profile.km', { km: profile.distanceKm.toFixed(1) })}` : ''}
            {' · '}
            {t('profile.sec', { sec: (profile.elapsedMs / 1000).toFixed(1) })}
          </p>
          <p className="desc">{profile.description}</p>
          <div className="kpi">
            <div>
              <b>{profile.photos.length}</b>
              <span>{t('profile.photos')}</span>
            </div>
            <div>
              <b>{verified}</b>
              <span>{t('profile.high')}</span>
            </div>
            <div>
              <b>{profile.duplicatesRemoved}</b>
              <span>{t('profile.dupes')}</span>
            </div>
            <div>
              <b>{new Set(profile.photos.map((p) => p.category)).size}</b>
              <span>{t('profile.cats')}</span>
            </div>
          </div>
          <p className="meta">
            {t('profile.sources', { sources: profile.sourcesUsed.join(', ') })}{' '}
            <a href={u.pageUrl} target="_blank" rel="noreferrer">
              Wikipedia
            </a>
          </p>
        </div>
      </section>

      {profile.facts?.items.length ? (
        <section className="applicant-facts">
          <div className="panel facts-panel">
            <div className="chip">{t('profile.factsChip')}</div>
            <h3>{t('profile.factsTitle')}</h3>
            <p className="meta" style={{ marginBottom: 14 }}>
              {t('profile.factsNote')}
            </p>
            <div className="facts-grid">
              {profile.facts.items.map((item) => (
                <FactCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {profile.warnings.length ? (
        <div className="warns">
          <b>{t('profile.uncertainty')}</b>
          <ul>
            {profile.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="facts">
        <div className="panel">
          <h3>{t('profile.climateTitle')}</h3>
          {profile.city ? (
            <>
              <p>
                <b>{profile.city.name}.</b> {profile.city.climate}
              </p>
              <p style={{ marginTop: 8 }}>{profile.city.transport}</p>
              <p style={{ marginTop: 8 }}>{profile.city.livingCost}</p>
              <p className="meta" style={{ marginTop: 10 }}>
                {t('profile.cityNote')}
              </p>
            </>
          ) : (
            <p>{t('profile.noCity')}</p>
          )}
        </div>
        <div className="panel">
          <h3>{t('profile.mapTitle')}</h3>
          {u.lat != null && u.lon != null ? (
            <>
              <iframe className="map" title={t('profile.mapIframe')} src={osm(u.lat, u.lon)} />
              <MapSources
                universityName={u.displayName}
                lat={u.lat}
                lon={u.lon}
                place={profile.campusPlace}
              />
            </>
          ) : (
            <>
              <p>{t('profile.noCoords')}</p>
              <MapSources universityName={u.displayName} place={profile.campusPlace} />
            </>
          )}
        </div>
      </div>

      <ProfileReviews
        universityName={u.displayName}
        onSaved={onReviewSaved}
        onRatings={onRatings}
      />

      <div className="filters">
        {FILTERS.map((f) => (
          <button key={f.id} className={filter === f.id ? 'on' : ''} onClick={() => setFilter(f.id)}>
            {filterLabel(f.id, lang, f.label)}
            {f.id !== 'all'
              ? ` ${profile.photos.filter((p) => p.category === f.id).length}`
              : ` ${profile.photos.length}`}
          </button>
        ))}
      </div>

      <div className="masonry">
        {photos.map((p) => (
          <button type="button" className="shot" key={p.id} onClick={() => onOpen(p)}>
            <img src={p.thumb} alt={p.title} />
            <span className="figcaption">
              <span className={`badge ${p.level}`}>
                {levelLabel(p.level, lang)} · {p.confidence}%
              </span>
              <span className="row">
                <span>{filterLabel(p.category, lang, FILTERS.find((f) => f.id === p.category)?.label ?? p.category)}</span>
                <span>{p.date ?? t('profile.noDate')}</span>
              </span>
            </span>
          </button>
        ))}
      </div>

      {!photos.length ? <p className="empty">{t('profile.noPhotos')}</p> : null}

      {profile.rejected.length ? (
        <details className="panel" style={{ margin: '0 28px 48px' }}>
          <summary>
            <b>{t('profile.rejected')}</b> · {t('profile.rejectedCount', { count: profile.rejected.length })}
          </summary>
          <ul>
            {profile.rejected.map((r) => (
              <li key={r.sourceUrl} style={{ margin: '8px 0' }}>
                <a href={r.sourceUrl} target="_blank" rel="noreferrer">
                  {r.title}
                </a>
                {' — '}
                {r.reason}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  )
}

function FactCard({ item }: { item: FactItem }) {
  return (
    <div className="fact-card">
      <span>{item.label}</span>
      <b>{item.value}</b>
      {item.note ? <p>{item.note}</p> : null}
      {item.sourceUrl ? (
        <a href={item.sourceUrl} target="_blank" rel="noreferrer">
          {item.source}
        </a>
      ) : (
        <small>{item.source}</small>
      )}
    </div>
  )
}

export function PhotoModal({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  const { t, lang } = useI18n()
  return (
    <div className="lightbox" onClick={onClose}>
      <button className="close" onClick={onClose} aria-label={t('profile.close')}>
        ×
      </button>
      <img src={photo.thumb} alt={photo.title} onClick={(e) => e.stopPropagation()} />
      <aside onClick={(e) => e.stopPropagation()}>
        <p className={`badge ${photo.level}`}>
          {levelLabel(photo.level, lang)} · {photo.confidence}%
        </p>
        <h2>{photo.title}</h2>
        <p>{t('profile.author', { name: photo.author })}</p>
        <p>{t('profile.license', { name: photo.license })}</p>
        <p>{t('profile.date', { date: photo.date ?? t('profile.dateMissing') })}</p>
        <p>
          {t('profile.source')}{' '}
          <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
            {t('profile.openCommons')}
          </a>
        </p>
        <h3>{t('profile.why')}</h3>
        <ul>
          {photo.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
