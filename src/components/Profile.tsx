import { FILTERS } from '../data/catalog'
import { MapSources } from './MapSources'
import { ProfileReviews } from './Reviews'
import type { Photo, VisualProfile } from '../types'

const LEVEL: Record<Photo['level'], string> = {
  verified: 'подтверждено',
  likely: 'вероятно',
  uncertain: 'нехватка данных',
}

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
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="ghost" onClick={onRatings}>
            Оценки вузов
          </button>
          <button className="ghost" onClick={onCompare}>
            Сравнить вуз
          </button>
          <button className="ghost" onClick={onHome}>
            Новый поиск
          </button>
        </div>
      </div>

      <section className="profile-hero">
        <div className="hero-photo">
          {hero ? <img src={hero.thumb} alt={hero.title} /> : null}
          {hero ? (
            <div className="cap">
              {hero.title} · {hero.date ?? 'дата неизвестна'} · {LEVEL[hero.level]}
            </div>
          ) : null}
        </div>
        <div className="hero-copy">
          <div className="chip">Визуальный профиль</div>
          <h1>{u.displayName}</h1>
          <p className="meta">
            {profile.city?.name ?? 'город уточняется'}
            {profile.distanceKm != null ? ` · ${profile.distanceKm.toFixed(1)} км до центра` : ''}
            {' · '}
            {(profile.elapsedMs / 1000).toFixed(1)} сек
          </p>
          <p className="desc">{profile.description}</p>
          <div className="kpi">
            <div>
              <b>{profile.photos.length}</b>
              <span>проверенных кадров</span>
            </div>
            <div>
              <b>{verified}</b>
              <span>высокая достоверность</span>
            </div>
            <div>
              <b>{profile.duplicatesRemoved}</b>
              <span>дублей снято</span>
            </div>
            <div>
              <b>{new Set(profile.photos.map((p) => p.category)).size}</b>
              <span>категорий</span>
            </div>
          </div>
          <p className="meta">
            Источники: {profile.sourcesUsed.join(', ')}. Карточка:{' '}
            <a href={u.pageUrl} target="_blank" rel="noreferrer">
              Wikipedia
            </a>
          </p>
        </div>
      </section>

      {profile.warnings.length ? (
        <div className="warns">
          <b>Честная неопределённость</b>
          <ul>
            {profile.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="facts">
        <div className="panel">
          <h3>Климат, транспорт, стоимость</h3>
          {profile.city ? (
            <>
              <p>
                <b>{profile.city.name}.</b> {profile.city.climate}
              </p>
              <p style={{ marginTop: 8 }}>{profile.city.transport}</p>
              <p style={{ marginTop: 8 }}>{profile.city.livingCost}</p>
              <p className="meta" style={{ marginTop: 10 }}>
                Ориентиры по открытым данным города, не официальная статистика вуза.
              </p>
            </>
          ) : (
            <p>Для этого города нет проверенного блока бытовых ориентиров — не выдумываем цифры.</p>
          )}
        </div>
        <div className="panel">
          <h3>Карта кампуса</h3>
          {u.lat != null && u.lon != null ? (
            <>
              <iframe className="map" title="Карта кампуса" src={osm(u.lat, u.lon)} />
              <MapSources
                universityName={u.displayName}
                lat={u.lat}
                lon={u.lon}
                place={profile.campusPlace}
              />
            </>
          ) : (
            <>
              <p>Координаты Wikipedia не найдены, карту не рисуем наугад.</p>
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
            {f.label}
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
                {LEVEL[p.level]} · {p.confidence}%
              </span>
              <span className="row">
                <span>{FILTERS.find((f) => f.id === p.category)?.label}</span>
                <span>{p.date ?? 'без даты'}</span>
              </span>
            </span>
          </button>
        ))}
      </div>

      {!photos.length ? (
        <p className="empty">В этой категории нет кадров, которые сервис готов показать.</p>
      ) : null}

      {profile.rejected.length ? (
        <details className="panel" style={{ margin: '0 28px 48px' }}>
          <summary>
            <b>Что не вошло</b> · {profile.rejected.length} файлов отброшено
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

export function PhotoModal({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  return (
    <div className="lightbox" onClick={onClose}>
      <button className="close" onClick={onClose} aria-label="Закрыть">
        ×
      </button>
      <img src={photo.thumb} alt={photo.title} onClick={(e) => e.stopPropagation()} />
      <aside onClick={(e) => e.stopPropagation()}>
        <p className={`badge ${photo.level}`}>
          {LEVEL[photo.level]} · {photo.confidence}%
        </p>
        <h2>{photo.title}</h2>
        <p>Автор: {photo.author}</p>
        <p>Лицензия: {photo.license}</p>
        <p>Дата: {photo.date ?? 'не указана источником'}</p>
        <p>
          Источник:{' '}
          <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
            открыть на Wikimedia Commons
          </a>
        </p>
        <h3>Почему такая оценка</h3>
        <ul>
          {photo.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
