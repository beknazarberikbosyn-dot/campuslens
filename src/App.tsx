import { useMemo, useState } from 'react'
import { CompareView } from './components/Compare'
import { LocationBrowse } from './components/LocationBrowse'
import { PhotoModal, ProfileView } from './components/Profile'
import { RatingsView, Stars } from './components/Reviews'
import { SUGGESTIONS } from './data/catalog'
import { LOCATION_PRESETS } from './lib/places'
import { buildVisualProfile, searchUniversity } from './lib/buildProfile'
import { formatScore, rankedUniversities, reviewCountLabel } from './lib/reviews'
import { needsDisambiguation } from './lib/wiki'
import type { Photo, Progress, VisualProfile, WikiHit } from './types'

type View = 'home' | 'disambiguate' | 'pipeline' | 'profile' | 'compare' | 'empty' | 'ratings' | 'places'

function Logo() {
  return <span className="mark" />
}

export default function App() {
  const [view, setView] = useState<View>('home')
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<WikiHit[]>([])
  const [progress, setProgress] = useState<Progress | null>(null)
  const [profile, setProfile] = useState<VisualProfile | null>(null)
  const [other, setOther] = useState<VisualProfile | null>(null)
  const [filter, setFilter] = useState('all')
  const [opened, setOpened] = useState<Photo | null>(null)
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [, setReviewVersion] = useState(0)
  const [ratingsFocus, setRatingsFocus] = useState<string | null>(null)
  const [placeCountry, setPlaceCountry] = useState('')
  const [placeCity, setPlaceCity] = useState('')
  const [placeAuto, setPlaceAuto] = useState(false)

  const run = async (hit: WikiHit, q: string) => {
    setView('pipeline')
    setProgress(null)
    setError('')
    setFilter('all')
    const t0 = performance.now()
    const tick = window.setInterval(() => setElapsed(performance.now() - t0), 80)
    try {
      const built = await buildVisualProfile(hit, q, setProgress)
      setProfile(built)
      setView('profile')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не получилось собрать профиль')
      setView('empty')
    } finally {
      window.clearInterval(tick)
    }
  }

  const submit = async (raw?: string) => {
    const q = (raw ?? query).trim()
    if (!q) return
    setQuery(q)
    setError('')
    setView('pipeline')
    setProgress({
      steps: [
        { id: 'resolve', label: 'Ищем университет', done: false, detail: '' },
        { id: 'collect', label: 'Собираем открытые источники', done: false, detail: '' },
        { id: 'maps', label: 'Открываем карточки на картах', done: false, detail: '' },
        { id: 'facts', label: 'Собираем справку для абитуриента', done: false, detail: '' },
        { id: 'dedupe', label: 'Удаляем дубликаты и мусор', done: false, detail: '' },
        { id: 'verify', label: 'Проверяем принадлежность', done: false, detail: '' },
        { id: 'sort', label: 'Раскладываем по категориям', done: false, detail: '' },
        { id: 'write', label: 'Собираем визуальный профиль', done: false, detail: '' },
      ],
      found: 0,
      kept: 0,
      message: 'Разбираем запрос',
    })
    try {
      const found = await searchUniversity(q)
      setHits(found)
      if (!found.length) {
        setView('empty')
        setError('Университет не найден. Уточните название — не показываем чужой кампус.')
        return
      }
      if (needsDisambiguation(q, found)) {
        setView('disambiguate')
        return
      }
      await run(found[0], q)
    } catch {
      setError('Поиск Wikipedia недоступен. Проверьте сеть и попробуйте снова.')
      setView('empty')
    }
  }

  const home = () => {
    setView('home')
    setProfile(null)
    setOther(null)
    setOpened(null)
    setProgress(null)
    setRatingsFocus(null)
    setPlaceAuto(false)
  }

  const openPlaces = (country = placeCountry, city = placeCity, auto = false) => {
    setPlaceCountry(country)
    setPlaceCity(city)
    setPlaceAuto(auto)
    setView('places')
  }

  const openRatings = (name?: string) => {
    setRatingsFocus(name ?? profile?.university.displayName ?? null)
    setView('ratings')
  }

  const seconds = useMemo(() => (elapsed / 1000).toFixed(1), [elapsed])
  const topRated = rankedUniversities().slice(0, 3)

  if (view === 'home') {
    return (
      <div className="dark">
        <div className="topbar">
          <button className="brand">
            <Logo />
            CampusLens
          </button>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="ghost" onClick={() => openPlaces()}>
              Вузы по городу
            </button>
            <button className="ghost" onClick={() => openRatings()}>
              Оценки вузов
            </button>
            <span className="chip">LOCUS Case 01 · Visual Campus</span>
          </div>
        </div>
        <section className="hero">
          <div>
            <div className="kicker">Не буклет приёмной комиссии</div>
            <h1>Университет глазами студента. За 30 секунд.</h1>
            <p className="lede">
              Введите название вуза. Сервис найдёт открытые фотографии кампуса, общежитий, аудиторий,
              библиотек и города, уберёт дубли и покажет, чему можно верить.
            </p>
            <form
              className="search"
              onSubmit={(e) => {
                e.preventDefault()
                void submit()
              }}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nazarbayev University, КазНУ, MIT…"
                autoFocus
              />
              <button type="submit">Собрать профиль</button>
            </form>
            <form
              className="place-search"
              onSubmit={(e) => {
                e.preventDefault()
                openPlaces(placeCountry, placeCity, true)
              }}
            >
              <input
                value={placeCountry}
                onChange={(e) => setPlaceCountry(e.target.value)}
                placeholder="Страна"
                autoComplete="country-name"
              />
              <input
                value={placeCity}
                onChange={(e) => setPlaceCity(e.target.value)}
                placeholder="Город"
                autoComplete="address-level2"
              />
              <button type="submit">Список вузов</button>
            </form>
            <div className="place-chips">
              {LOCATION_PRESETS.slice(0, 4).map((p) => (
                <button
                  key={`${p.country}-${p.city}`}
                  type="button"
                  className="ghost"
                  onClick={() => openPlaces(p.country, p.city, true)}
                >
                  {p.city}
                </button>
              ))}
            </div>
            <div className="stats-row">
              <div>
                <b>30с</b>
                цель кейса
              </div>
              <div>
                <b>0</b>
                стоковых подмен
              </div>
              <div>
                <b>Wiki</b>
                только открытые источники
              </div>
              <div>
                <b>{topRated[0] ? formatScore(topRated[0].summary.average) : '—'}</b>
                лучший средний отзыв
              </div>
            </div>
          </div>
          <div className="stack">
            {SUGGESTIONS.slice(0, 3).map((s) => (
              <button key={s.title} className="polaroid" onClick={() => void submit(s.title)}>
                <img src={s.image} alt="" />
                <span>
                  {s.city} · {s.title}
                </span>
              </button>
            ))}
          </div>
        </section>
        <section className="suggest">
          <h2>Попробуйте любой вуз — не только демо</h2>
          <div className="grid-3">
            {SUGGESTIONS.map((s) => (
              <button key={s.title} className="card-uni" onClick={() => void submit(s.title)}>
                <img src={s.image} alt="" />
                <div>
                  <small>{s.city}</small>
                  <b>{s.title}</b>
                  <p>{s.blurb}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
        <section className="suggest">
          <h2>Оценки по отзывам с заявок</h2>
          <p className="home-note">
            Абитуриенты и студенты оставляют отзывы о кампусе, общежитии и городе. На демо-вузах —
            по 16 отзывов CampusLens. Ссылки на 2ГИС, Google и Яндекс ведут на официальные карточки,
            без копирования чужих текстов.
          </p>
          <div className="grid-3">
            {topRated.map((item) => (
              <button key={item.name} className="card-uni" onClick={() => openRatings(item.name)}>
                {item.image ? <img src={item.image} alt="" /> : null}
                <div>
                  <small>{item.city || 'рейтинг'}</small>
                  <b>{item.name}</b>
                  <p>
                    {formatScore(item.summary.average)} из 5 · {reviewCountLabel(item.summary.count)}
                  </p>
                  <Stars value={item.summary.average} />
                </div>
              </button>
            ))}
          </div>
          <button className="ghost" style={{ marginTop: 18 }} onClick={() => openRatings()}>
            Открыть все оценки
          </button>
        </section>
      </div>
    )
  }

  if (view === 'disambiguate') {
    return (
      <div className="dark">
        <div className="topbar">
          <button className="brand" onClick={home}>
            <Logo />
            CampusLens
          </button>
        </div>
        <div className="disamb">
          <div className="kicker">Неоднозначный запрос</div>
          <h1>Какой университет вы имели в виду?</h1>
          <p className="lede">Лучше спросить, чем показать чужой кампус.</p>
          {hits.map((h) => (
            <button key={`${h.lang}-${h.title}`} className="choice" onClick={() => void run(h, query)}>
              <b>{h.title}</b>
              <span>{h.snippet}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (view === 'pipeline') {
    return (
      <div className="dark">
        <div className="topbar">
          <button className="brand" onClick={home}>
            <Logo />
            CampusLens
          </button>
          <span className="chip">проверка источников</span>
        </div>
        <div className="pipeline">
          <div className="kicker">{query}</div>
          <div className="timer">{seconds}s</div>
          <p>{progress?.message ?? 'Готовим поиск'}</p>
          {(progress?.steps ?? []).map((s) => (
            <div className="step" key={s.id}>
              <span className={`dot ${s.done ? 'ok' : 'on'}`} />
              <div>
                <b>{s.label}</b>
                <div className="chip">{s.detail || 'в работе'}</div>
              </div>
              <span>{s.done ? 'готово' : '…'}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (view === 'empty') {
    return (
      <div className="dark">
        <div className="topbar">
          <button className="brand" onClick={home}>
            <Logo />
            CampusLens
          </button>
        </div>
        <div className="empty">
          <h1>Честный отказ</h1>
          <p className="lede">{error}</p>
          <button className="primary" onClick={home}>
            Изменить запрос
          </button>
        </div>
      </div>
    )
  }

  if (view === 'places') {
    return (
      <LocationBrowse
        initialCountry={placeCountry}
        initialCity={placeCity}
        autoSearch={placeAuto}
        onHome={home}
        onOpen={(name) => {
          setQuery(name)
          void submit(name)
        }}
      />
    )
  }

  if (view === 'ratings') {
    return (
      <RatingsView
        focus={ratingsFocus}
        onHome={home}
        onOpenProfile={(name) => {
          setQuery(name)
          void submit(name)
        }}
      />
    )
  }

  if (view === 'compare' && profile) {
    return (
      <CompareView
        profile={profile}
        other={other}
        onHome={home}
        onBack={() => setView('profile')}
        onCompare={async (name) => {
          const found = await searchUniversity(name)
          if (!found[0]) return
          const built = await buildVisualProfile(found[0], name, () => undefined)
          setOther(built)
        }}
      />
    )
  }

  if (profile) {
    return (
      <>
        <ProfileView
          profile={profile}
          filter={filter}
          setFilter={setFilter}
          onOpen={setOpened}
          onHome={home}
          onCompare={() => setView('compare')}
          onRatings={() => openRatings(profile.university.displayName)}
          onReviewSaved={() => setReviewVersion((n) => n + 1)}
        />
        {opened ? <PhotoModal photo={opened} onClose={() => setOpened(null)} /> : null}
      </>
    )
  }

  return null
}
