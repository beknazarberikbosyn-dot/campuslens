import { useMemo, useState, type ReactNode } from 'react'
import { CompareView } from './components/Compare'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { LocationBrowse } from './components/LocationBrowse'
import { PhotoModal, ProfileView } from './components/Profile'
import { RatingsView, Stars } from './components/Reviews'
import { SUGGESTIONS } from './data/catalog'
import { cityLabel, stepLabel, suggestionCopy, useI18n } from './i18n'
import { LOCATION_PRESETS } from './lib/places'
import { buildVisualProfile, searchUniversity } from './lib/buildProfile'
import { formatScore, rankedUniversities, reviewCountLabel } from './lib/reviews'
import { needsDisambiguation } from './lib/wiki'
import type { Photo, Progress, VisualProfile, WikiHit } from './types'

type View = 'home' | 'disambiguate' | 'pipeline' | 'profile' | 'compare' | 'empty' | 'ratings' | 'places'

function Logo() {
  return <span className="mark" />
}

function Topbar({
  onHome,
  extra,
}: {
  onHome?: () => void
  extra?: ReactNode
}) {
  return (
    <div className="topbar">
      <button className="brand" onClick={onHome}>
        <Logo />
        CampusLens
      </button>
      <div className="topbar-end">
        {extra}
        <LanguageSwitcher />
      </div>
    </div>
  )
}

export default function App() {
  const { t, lang } = useI18n()
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
      setError(e instanceof Error ? e.message : t('error.profile'))
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
        { id: 'resolve', label: t('step.resolve'), done: false, detail: '' },
        { id: 'collect', label: t('step.collect'), done: false, detail: '' },
        { id: 'maps', label: t('step.maps'), done: false, detail: '' },
        { id: 'facts', label: t('step.facts'), done: false, detail: '' },
        { id: 'dedupe', label: t('step.dedupe'), done: false, detail: '' },
        { id: 'verify', label: t('step.verify'), done: false, detail: '' },
        { id: 'sort', label: t('step.sort'), done: false, detail: '' },
        { id: 'write', label: t('step.write'), done: false, detail: '' },
      ],
      found: 0,
      kept: 0,
      message: t('pipeline.ready'),
    })
    try {
      const found = await searchUniversity(q)
      setHits(found)
      if (!found.length) {
        setView('empty')
        setError(t('error.notFound'))
        return
      }
      if (needsDisambiguation(q, found)) {
        setView('disambiguate')
        return
      }
      await run(found[0], q)
    } catch {
      setError(t('error.wiki'))
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
        <Topbar
          extra={
            <>
              <button className="ghost" onClick={() => openPlaces()}>
                {t('nav.places')}
              </button>
              <button className="ghost" onClick={() => openRatings()}>
                {t('nav.ratings')}
              </button>
              <span className="chip">{t('chip.case')}</span>
            </>
          }
        />
        <section className="hero">
          <div>
            <div className="kicker">{t('home.kicker')}</div>
            <h1>{t('home.title')}</h1>
            <p className="lede">{t('home.lede')}</p>
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
                placeholder={t('home.searchPlaceholder')}
                autoFocus
              />
              <button type="submit">{t('home.searchSubmit')}</button>
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
                placeholder={t('home.countryPlaceholder')}
                autoComplete="country-name"
              />
              <input
                value={placeCity}
                onChange={(e) => setPlaceCity(e.target.value)}
                placeholder={t('home.cityPlaceholder')}
                autoComplete="address-level2"
              />
              <button type="submit">{t('home.listUnis')}</button>
            </form>
            <div className="place-chips">
              {LOCATION_PRESETS.slice(0, 4).map((p) => (
                <button
                  key={`${p.country}-${p.city}`}
                  type="button"
                  className="ghost"
                  onClick={() => openPlaces(p.country, p.city, true)}
                >
                  {cityLabel(p.city, lang)}
                </button>
              ))}
            </div>
            <div className="stats-row">
              <div>
                <b>30с</b>
                {t('home.stat30')}
              </div>
              <div>
                <b>0</b>
                {t('home.statStock')}
              </div>
              <div>
                <b>Wiki</b>
                {t('home.statWiki')}
              </div>
              <div>
                <b>{topRated[0] ? formatScore(topRated[0].summary.average) : '—'}</b>
                {t('home.statBest')}
              </div>
            </div>
          </div>
          <div className="stack">
            {SUGGESTIONS.slice(0, 3).map((s) => (
              <button key={s.title} className="polaroid" onClick={() => void submit(s.title)}>
                <img src={s.image} alt="" />
                <span>
                  {cityLabel(s.city, lang)} · {s.title}
                </span>
              </button>
            ))}
          </div>
        </section>
        <section className="suggest">
          <h2>{t('home.tryAny')}</h2>
          <div className="grid-3">
            {SUGGESTIONS.map((s) => {
              const copy = suggestionCopy(s.title, lang, s)
              return (
                <button key={s.title} className="card-uni" onClick={() => void submit(s.title)}>
                  <img src={s.image} alt="" />
                  <div>
                    <small>{cityLabel(s.city, lang)}</small>
                    <b>{s.title}</b>
                    <p>{copy.blurb}</p>
                    <p className="fact-line">{copy.fact}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
        <section className="suggest">
          <h2>{t('home.factsTitle')}</h2>
          <p className="home-note">{t('home.factsNote')}</p>
          <div className="grid-3">
            {SUGGESTIONS.map((s) => {
              const copy = suggestionCopy(s.title, lang, s)
              return (
                <button key={`fact-${s.title}`} className="card-uni fact-card-home" onClick={() => void submit(s.title)}>
                  <div>
                    <small>
                      {cityLabel(s.city, lang)} · {t('home.factBadge')}
                    </small>
                    <b>{s.title}</b>
                    <p>{copy.fact}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
        <section className="suggest">
          <h2>{t('home.ratingsTitle')}</h2>
          <p className="home-note">{t('home.ratingsNote')}</p>
          <div className="grid-3">
            {topRated.map((item) => (
              <button key={item.name} className="card-uni" onClick={() => openRatings(item.name)}>
                {item.image ? <img src={item.image} alt="" /> : null}
                <div>
                  <small>{cityLabel(item.city, lang) || t('home.ratingCity')}</small>
                  <b>{item.name}</b>
                  <p>
                    {formatScore(item.summary.average)} / 5 · {reviewCountLabel(item.summary.count, lang)}
                  </p>
                  <Stars value={item.summary.average} />
                </div>
              </button>
            ))}
          </div>
          <button className="ghost" style={{ marginTop: 18 }} onClick={() => openRatings()}>
            {t('home.openAll')}
          </button>
        </section>
      </div>
    )
  }

  if (view === 'disambiguate') {
    return (
      <div className="dark">
        <Topbar onHome={home} />
        <div className="disamb">
          <div className="kicker">{t('disamb.kicker')}</div>
          <h1>{t('disamb.title')}</h1>
          <p className="lede">{t('disamb.lede')}</p>
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
        <Topbar onHome={home} extra={<span className="chip">{t('chip.checking')}</span>} />
        <div className="pipeline">
          <div className="kicker">{query}</div>
          <div className="timer">{seconds}s</div>
          <p>{progress?.message ?? t('pipeline.ready')}</p>
          {(progress?.steps ?? []).map((s) => (
            <div className="step" key={s.id}>
              <span className={`dot ${s.done ? 'ok' : 'on'}`} />
              <div>
                <b>{stepLabel(s.id, lang, s.label)}</b>
                <div className="chip">{s.detail || t('pipeline.working')}</div>
              </div>
              <span>{s.done ? t('pipeline.done') : '…'}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (view === 'empty') {
    return (
      <div className="dark">
        <Topbar onHome={home} />
        <div className="empty">
          <h1>{t('empty.title')}</h1>
          <p className="lede">{error}</p>
          <button className="primary" onClick={home}>
            {t('empty.retry')}
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
