import { useMemo, useState } from 'react'
import { SUGGESTIONS } from './data/catalog'
import { buildVisualProfile, searchUniversity } from './lib/buildProfile'
import { needsDisambiguation } from './lib/wiki'
import { PhotoModal, ProfileView } from './components/Profile'
import type { Photo, Progress, VisualProfile, WikiHit } from './types'

type View = 'home' | 'disambiguate' | 'pipeline' | 'profile' | 'compare' | 'empty'

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
  }

  const seconds = useMemo(() => (elapsed / 1000).toFixed(1), [elapsed])

  if (view === 'home') {
    return (
      <div className="dark">
        <div className="topbar">
          <button className="brand">
            <Logo />
            CampusLens
          </button>
          <span className="chip">LOCUS Case 01 · Visual Campus</span>
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

  if (view === 'compare' && profile) {
    return (
      <div className="paper-page">
        <div className="topbar">
          <button className="brand" onClick={home}>
            <Logo />
            CampusLens
          </button>
          <button className="ghost" onClick={() => setView('profile')}>
            Назад к профилю
          </button>
        </div>
        <div style={{ padding: '12px 28px 0' }}>
          <h1 style={{ fontSize: 42, color: 'inherit' }}>Сравнение</h1>
          <form
            className="search"
            style={{ background: '#fff', borderColor: 'var(--line)' }}
            onSubmit={async (e) => {
              e.preventDefault()
              const input = (e.currentTarget.elements.namedItem('other') as HTMLInputElement).value
              const found = await searchUniversity(input)
              if (!found[0]) return
              const built = await buildVisualProfile(found[0], input, () => undefined)
              setOther(built)
            }}
          >
            <input name="other" placeholder="Второй университет" style={{ color: 'var(--ink)' }} />
            <button type="submit">Сравнить</button>
          </form>
        </div>
        <div className="compare">
          {[profile, other].map((p, i) =>
            p ? (
              <article className="panel" key={p.university.displayName}>
                <h3>{p.university.displayName}</h3>
                <p>
                  {p.city?.name ?? '—'} · {p.photos.length} кадров · {p.photos.filter((x) => x.level === 'verified').length}{' '}
                  подтверждённых
                </p>
                <p>{p.description.slice(0, 240)}…</p>
                <div className="grid-3" style={{ marginTop: 12 }}>
                  {p.photos.slice(0, 3).map((ph) => (
                    <img key={ph.id} src={ph.thumb} alt="" />
                  ))}
                </div>
              </article>
            ) : (
              <article className="panel" key={i}>
                <p>Введите второй вуз, чтобы сравнить кампусы честно, по одним правилам.</p>
              </article>
            ),
          )}
        </div>
      </div>
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
        />
        {opened ? <PhotoModal photo={opened} onClose={() => setOpened(null)} /> : null}
      </>
    )
  }

  return null
}
