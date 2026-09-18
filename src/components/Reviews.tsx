import { useState } from 'react'
import { ASPECTS, ROLES } from '../data/reviews'
import {
  addReview,
  canonicalUniversityName,
  formatScore,
  loadAllReviews,
  rankedUniversities,
  reviewCountLabel,
  reviewsForUniversity,
  summarizeReviews,
} from '../lib/reviews'
import type { ReviewRole, ReviewScores, ReviewSummary, UniversityReview } from '../types'

const EMPTY_SCORES: ReviewScores = {
  campus: 0,
  dorm: 0,
  teaching: 0,
  life: 0,
  city: 0,
}

export function Stars({
  value,
  onChange,
  label,
}: {
  value: number
  onChange?: (n: number) => void
  label?: string
}) {
  return (
    <span className={`stars ${onChange ? 'interactive' : ''}`} aria-label={label ?? `${formatScore(value)} из 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= Math.round(value)
        if (!onChange) {
          return (
            <span key={n} className={on ? 'on' : ''}>
              ★
            </span>
          )
        }
        return (
          <button type="button" key={n} className={on ? 'on' : ''} onClick={() => onChange(n)} aria-label={`${n} из 5`}>
            ★
          </button>
        )
      })}
    </span>
  )
}

export function AspectMeters({ summary }: { summary: ReviewSummary }) {
  return (
    <div className="aspect-list">
      {ASPECTS.map((aspect) => (
        <div className="aspect-row" key={aspect.id}>
          <span>{aspect.label}</span>
          <div className="meter">
            <i style={{ width: `${(summary.aspects[aspect.id] / 5) * 100}%` }} />
          </div>
          <b>{summary.count ? formatScore(summary.aspects[aspect.id]) : '—'}</b>
        </div>
      ))}
    </div>
  )
}

export function ReviewCard({ review }: { review: UniversityReview }) {
  const role = ROLES.find((r) => r.id === review.role)?.label ?? review.role
  return (
    <article className="review-card">
      <div className="review-head">
        <div>
          <b>{review.author}</b>
          <span className="meta">
            {role} · {review.createdAt}
          </span>
        </div>
        <Stars value={review.rating} />
      </div>
      <p>{review.text}</p>
    </article>
  )
}

export function ReviewForm({
  universityName,
  onSaved,
}: {
  universityName: string
  onSaved: () => void
}) {
  const [author, setAuthor] = useState('')
  const [role, setRole] = useState<ReviewRole>('applicant')
  const [rating, setRating] = useState(0)
  const [scores, setScores] = useState<ReviewScores>({ ...EMPTY_SCORES })
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const submit = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (rating < 1) {
      setError('Поставьте общую оценку от 1 до 5.')
      return
    }
    if (text.trim().length < 20) {
      setError('Напишите отзыв хотя бы в два предложения — так он полезен при сравнении.')
      return
    }
    const filled = Object.fromEntries(
      ASPECTS.map((aspect) => [aspect.id, scores[aspect.id] || rating]),
    ) as ReviewScores
    addReview({
      universityName,
      author: author.trim() || 'Аноним',
      role,
      rating,
      scores: filled,
      text: text.trim(),
    })
    setAuthor('')
    setRating(0)
    setScores({ ...EMPTY_SCORES })
    setText('')
    setError('')
    onSaved()
  }

  return (
    <form className="review-form" onSubmit={submit}>
      <h3>Оставить отзыв</h3>
      <p className="meta">Оценка пойдёт в рейтинг вуза и в сравнение кампусов.</p>
      <label>
        Имя
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Как к вам обращаться" />
      </label>
      <div className="role-row">
        {ROLES.map((item) => (
          <button
            type="button"
            key={item.id}
            className={role === item.id ? 'on' : ''}
            onClick={() => setRole(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="form-stars">
        <span>Общая оценка</span>
        <Stars value={rating} onChange={setRating} />
      </div>
      <div className="aspect-inputs">
        {ASPECTS.map((aspect) => (
          <label key={aspect.id}>
            {aspect.label}
            <Stars
              value={scores[aspect.id]}
              onChange={(n) => setScores((prev) => ({ ...prev, [aspect.id]: n }))}
            />
          </label>
        ))}
      </div>
      <label>
        Как вы выбирали вуз и что увидели
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Кампус, общежитие, учёба, город — что совпало с заявкой, а что нет."
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="primary" type="submit">
        Опубликовать отзыв
      </button>
    </form>
  )
}

function ReviewCompare({ left, right }: { left: string; right: string }) {
  const all = loadAllReviews()
  const a = summarizeReviews(reviewsForUniversity(left, all))
  const b = summarizeReviews(reviewsForUniversity(right, all))
  const winner = a.average === b.average ? null : a.average > b.average ? left : right
  return (
    <div className="review-compare">
      <div className="kicker">Сравнение по отзывам</div>
      <h2>
        {left} и {right}
      </h2>
      <p className="lede" style={{ color: 'var(--ink-soft)', maxWidth: 'none' }}>
        {winner
          ? `По отзывам абитуриентов и студентов впереди ${winner}: ${formatScore(winner === left ? a.average : b.average)} против ${formatScore(winner === left ? b.average : a.average)}.`
          : a.count && b.count
            ? 'Средние оценки совпадают — смотрите разбивку по кампусу, общежитию и городу.'
            : 'Для полного сравнения не хватает отзывов по одному из вузов.'}
      </p>
      <div className="compare">
        {[
          { name: left, summary: a },
          { name: right, summary: b },
        ].map((side) => (
          <article className={`panel ${winner === side.name ? 'winner' : ''}`} key={side.name}>
            <h3>{side.name}</h3>
            <p className="score-line">
              <b>{formatScore(side.summary.average)}</b>
              <span> / 5 · {reviewCountLabel(side.summary.count)}</span>
            </p>
            <AspectMeters summary={side.summary} />
          </article>
        ))}
      </div>
    </div>
  )
}

export function RatingsView({
  focus,
  onHome,
  onOpenProfile,
}: {
  focus: string | null
  onHome: () => void
  onOpenProfile: (name: string) => void
}) {
  const [, setVersion] = useState(0)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(focus ?? '')
  const [picked, setPicked] = useState<string[]>(focus ? [focus] : [])

  const ranked = rankedUniversities()
  const filtered = ranked.filter((item) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return item.name.toLowerCase().includes(q) || item.city.toLowerCase().includes(q)
  })
  const activeName = selected || filtered[0]?.name || canonicalUniversityName(query)
  const active = ranked.find((item) => item.name === activeName)
  const reviews = activeName ? reviewsForUniversity(activeName) : []
  const summary = summarizeReviews(reviews)

  const togglePick = (name: string) => {
    setPicked((prev) => {
      if (prev.includes(name)) return prev.filter((item) => item !== name)
      if (prev.length < 2) return [...prev, name]
      return [prev[1], name]
    })
    setSelected(name)
  }

  return (
    <div className="paper-page">
      <div className="topbar">
        <button className="brand" onClick={onHome}>
          <span className="mark" />
          CampusLens
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className="chip">отзывы абитуриентов</span>
          <button className="ghost" onClick={onHome}>
            На главную
          </button>
        </div>
      </div>

      <section className="ratings-hero">
        <div>
          <div className="kicker" style={{ color: 'var(--rust)' }}>
            Не буклет, а заявки и жизнь после них
          </div>
          <h1>Оценки университетов по отзывам</h1>
          <p className="lede" style={{ color: 'var(--ink-soft)' }}>
            Люди, которые подавали документы или уже учатся, оставляют отзывы о кампусе, общежитии,
            учёбе и городе. Эти оценки входят в сравнение вузов — не только фотографии.
          </p>
        </div>
        <form
          className="search"
          style={{ background: '#fff', borderColor: 'var(--line)' }}
          onSubmit={(e) => {
            e.preventDefault()
            const name = canonicalUniversityName(query)
            if (!name) return
            setSelected(name)
            setPicked((prev) => (prev.includes(name) || prev.length >= 2 ? prev : [...prev, name]))
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти вуз или оставить отзыв"
            style={{ color: 'var(--ink)' }}
          />
          <button type="submit">Открыть</button>
        </form>
      </section>

      {picked.length === 2 ? <ReviewCompare left={picked[0]} right={picked[1]} /> : null}

      <div className="ratings-layout">
        <div>
          <div className="rank-hint">Отметьте два вуза, чтобы сравнить отзывы. Оценка сразу влияет на рейтинг.</div>
          <div className="rank-list">
            {filtered.map((item, index) => (
              <button
                type="button"
                className={`rank-card ${selected === item.name ? 'on' : ''} ${picked.includes(item.name) ? 'picked' : ''}`}
                key={item.name}
                onClick={() => togglePick(item.name)}
              >
                <span className="rank-num">{index + 1}</span>
                {item.image ? <img src={item.image} alt="" /> : <span className="rank-fallback" />}
                <div>
                  <small>{item.city || 'отзывы с сайта'}</small>
                  <b>{item.name}</b>
                  <p>
                    {item.summary.count
                      ? `${formatScore(item.summary.average)} из 5 · ${reviewCountLabel(item.summary.count)}`
                      : 'Пока нет отзывов — будьте первым'}
                  </p>
                </div>
                <Stars value={item.summary.average} />
              </button>
            ))}
          </div>
        </div>

        <aside className="panel ratings-detail">
          {activeName ? (
            <>
              <div className="chip" style={{ marginBottom: 10 }}>
                {active?.city || 'новый вуз в рейтинге'}
              </div>
              <h2>{activeName}</h2>
              <p className="score-line">
                <b>{formatScore(summary.average)}</b>
                <span>
                  {' '}
                  / 5 · {reviewCountLabel(summary.count)}
                </span>
              </p>
              <AspectMeters summary={summary} />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '16px 0' }}>
                <button className="primary" onClick={() => onOpenProfile(activeName)}>
                  Визуальный профиль
                </button>
              </div>
              <ReviewForm universityName={activeName} onSaved={() => setVersion((n) => n + 1)} />
              <div className="review-list">
                {reviews.length ? reviews.map((review) => <ReviewCard key={review.id} review={review} />) : (
                  <p className="meta">Отзывов ещё нет. Первая оценка сразу попадёт в сравнение.</p>
                )}
              </div>
            </>
          ) : (
            <p>Найдите университет, чтобы читать и оставлять отзывы.</p>
          )}
        </aside>
      </div>
    </div>
  )
}

export function ProfileReviews({
  universityName,
  onSaved,
  onRatings,
}: {
  universityName: string
  onSaved: () => void
  onRatings: () => void
}) {
  const reviews = reviewsForUniversity(universityName)
  const summary = summarizeReviews(reviews)
  return (
    <section className="profile-reviews">
      <div className="panel">
        <div className="review-head">
          <div>
            <h3>Отзывы абитуриентов и студентов</h3>
            <p className="meta">Оценки учитываются, когда вы сравниваете этот вуз с другим.</p>
          </div>
          <button className="ghost" onClick={onRatings}>
            Весь рейтинг
          </button>
        </div>
        <p className="score-line">
          <b>{formatScore(summary.average)}</b>
          <span>
            {' '}
            / 5 · {reviewCountLabel(summary.count)}
          </span>
        </p>
        <AspectMeters summary={summary} />
      </div>
      <div className="panel">
        <ReviewForm universityName={universityName} onSaved={onSaved} />
      </div>
      <div className="review-list" style={{ gridColumn: '1 / -1' }}>
        {reviews.slice(0, 4).map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  )
}
