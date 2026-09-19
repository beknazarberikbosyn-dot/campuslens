import { useState } from 'react'
import { ASPECTS, ROLES } from '../data/reviews'
import { aspectLabel, cityLabel, roleLabel, useI18n } from '../i18n'
import {
  addReview,
  canonicalUniversityName,
  formatScore,
  loadAllReviews,
  rankedUniversities,
  reviewCountLabel,
  reviewEvidence,
  reviewsForUniversity,
  summarizeReviews,
} from '../lib/reviews'
import type { ReviewRole, ReviewScores, ReviewSummary, UniversityReview } from '../types'
import { LanguageSwitcher } from './LanguageSwitcher'
import { MapSources } from './MapSources'

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
  const { t } = useI18n()
  return (
    <span className={`stars ${onChange ? 'interactive' : ''}`} aria-label={label ?? t('stars.of5', { score: formatScore(value) })}>
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
          <button type="button" key={n} className={on ? 'on' : ''} onClick={() => onChange(n)} aria-label={t('stars.nOf5', { n })}>
            ★
          </button>
        )
      })}
    </span>
  )
}

export function AspectMeters({ summary }: { summary: ReviewSummary }) {
  const { lang } = useI18n()
  return (
    <div className="aspect-list">
      {ASPECTS.map((aspect) => (
        <div className="aspect-row" key={aspect.id}>
          <span>{aspectLabel(aspect.id, lang, aspect.label)}</span>
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
  const { t, lang } = useI18n()
  const role = roleLabel(review.role, lang, ROLES.find((r) => r.id === review.role)?.label ?? review.role)
  const fromRepo = review.source !== 'user' && Boolean(review.evidenceUrl)
  return (
    <article className="review-card">
      <div className="review-head">
        <div>
          <b>{review.author}</b>
          <span className="meta">
            {role} · {review.createdAt} · {fromRepo ? t('reviews.corpus') : t('reviews.onSite')}
          </span>
        </div>
        <Stars value={review.rating} />
      </div>
      <p>{review.text}</p>
      <p className="review-evidence-line">
        <span>id {review.id}</span>
        {fromRepo && review.evidenceSearchUrl ? (
          <a href={review.evidenceSearchUrl} target="_blank" rel="noreferrer">
            {t('reviews.findId')}
          </a>
        ) : (
          <span>{t('reviews.inBrowser')}</span>
        )}
        {review.evidenceUrl ? (
          <a href={review.evidenceUrl} target="_blank" rel="noreferrer">
            {t('reviews.openFile')}
          </a>
        ) : null}
      </p>
    </article>
  )
}

export function ReviewProvenance({
  universityName,
  reviews,
}: {
  universityName: string
  reviews: UniversityReview[]
}) {
  const { t, lang } = useI18n()
  const evidence = reviewEvidence(reviews)
  return (
    <section className="review-evidence">
      <h3>{t('reviews.howTitle')}</h3>
      <p>
        {t('reviews.howIntro', {
          name: universityName,
          count: reviewCountLabel(evidence.total, lang),
          corpus: evidence.corpus ? t('reviews.howCorpus', { n: evidence.corpus }) : '',
        })}
      </p>
      <ul>
        <li>
          {evidence.file ? t('reviews.howFile', { file: evidence.file }) : t('reviews.howFileGeneric')}
        </li>
        <li>{t('reviews.howMaps')}</li>
        <li>{t('reviews.howBrowser')}</li>
      </ul>
      {evidence.url ? (
        <a className="map-link" href={evidence.url} target="_blank" rel="noreferrer">
          <b>{t('reviews.openGithub')}</b>
          <span>{evidence.file}</span>
        </a>
      ) : null}
    </section>
  )
}

export function ReviewForm({
  universityName,
  onSaved,
}: {
  universityName: string
  onSaved: () => void
}) {
  const { t, lang } = useI18n()
  const [author, setAuthor] = useState('')
  const [role, setRole] = useState<ReviewRole>('applicant')
  const [rating, setRating] = useState(0)
  const [scores, setScores] = useState<ReviewScores>({ ...EMPTY_SCORES })
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const submit = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (rating < 1) {
      setError(t('error.ratingRequired'))
      return
    }
    if (text.trim().length < 20) {
      setError(t('error.reviewShort'))
      return
    }
    const filled = Object.fromEntries(
      ASPECTS.map((aspect) => [aspect.id, scores[aspect.id] || rating]),
    ) as ReviewScores
    addReview({
      universityName,
      author: author.trim() || t('reviews.anon'),
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
      <h3>{t('reviews.formTitle')}</h3>
      <p className="meta">{t('reviews.formNote')}</p>
      <label>
        {t('reviews.name')}
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder={t('reviews.namePh')} />
      </label>
      <div className="role-row">
        {ROLES.map((item) => (
          <button
            type="button"
            key={item.id}
            className={role === item.id ? 'on' : ''}
            onClick={() => setRole(item.id)}
          >
            {roleLabel(item.id, lang, item.label)}
          </button>
        ))}
      </div>
      <div className="form-stars">
        <span>{t('reviews.overall')}</span>
        <Stars value={rating} onChange={setRating} />
      </div>
      <div className="aspect-inputs">
        {ASPECTS.map((aspect) => (
          <label key={aspect.id}>
            {aspectLabel(aspect.id, lang, aspect.label)}
            <Stars
              value={scores[aspect.id]}
              onChange={(n) => setScores((prev) => ({ ...prev, [aspect.id]: n }))}
            />
          </label>
        ))}
      </div>
      <label>
        {t('reviews.textLabel')}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder={t('reviews.textPh')}
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="primary" type="submit">
        {t('reviews.publish')}
      </button>
    </form>
  )
}

function ReviewCompare({ left, right }: { left: string; right: string }) {
  const { t, lang } = useI18n()
  const all = loadAllReviews()
  const a = summarizeReviews(reviewsForUniversity(left, all))
  const b = summarizeReviews(reviewsForUniversity(right, all))
  const winner = a.average === b.average ? null : a.average > b.average ? left : right
  return (
    <div className="review-compare">
      <div className="kicker">{t('ratings.compareKicker')}</div>
      <h2>
        {left} {t('ratings.and')} {right}
      </h2>
      <p className="lede" style={{ color: 'var(--ink-soft)', maxWidth: 'none' }}>
        {winner
          ? t('ratings.compareLead', {
              winner,
              hi: formatScore(winner === left ? a.average : b.average),
              lo: formatScore(winner === left ? b.average : a.average),
            })
          : a.count && b.count
            ? t('ratings.compareTie')
            : t('ratings.compareMissing')}
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
              <span>
                {' '}
                / 5 · {reviewCountLabel(side.summary.count, lang)}
              </span>
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
  const { t, lang } = useI18n()
  const [, setVersion] = useState(0)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(focus ?? '')
  const [picked, setPicked] = useState<string[]>(focus ? [focus] : [])

  const [roleFilter, setRoleFilter] = useState<ReviewRole | 'all'>('all')
  const ranked = rankedUniversities()
  const filtered = ranked.filter((item) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return item.name.toLowerCase().includes(q) || item.city.toLowerCase().includes(q)
  })
  const activeName = selected || filtered[0]?.name || canonicalUniversityName(query)
  const active = ranked.find((item) => item.name === activeName)
  const reviews = (activeName ? reviewsForUniversity(activeName) : []).filter(
    (review) => roleFilter === 'all' || review.role === roleFilter,
  )
  const summary = summarizeReviews(activeName ? reviewsForUniversity(activeName) : [])

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
        <LanguageSwitcher />
        <div className="topbar-end">
          <span className="chip">{t('chip.reviews')}</span>
          <button className="ghost" onClick={onHome}>
            {t('nav.home')}
          </button>
        </div>
      </div>

      <section className="ratings-hero">
        <div>
          <div className="kicker" style={{ color: 'var(--rust)' }}>
            {t('ratings.kicker')}
          </div>
          <h1>{t('ratings.title')}</h1>
          <p className="lede" style={{ color: 'var(--ink-soft)' }}>
            {t('ratings.lede')}
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
            placeholder={t('ratings.searchPh')}
            style={{ color: 'var(--ink)' }}
          />
          <button type="submit">{t('ratings.open')}</button>
        </form>
      </section>

      {picked.length === 2 ? <ReviewCompare left={picked[0]} right={picked[1]} /> : null}

      <div className="ratings-layout">
        <div>
          <div className="rank-hint">{t('ratings.hint')}</div>
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
                  <small>{cityLabel(item.city, lang) || t('ratings.fromSite')}</small>
                  <b>{item.name}</b>
                  <p>
                    {item.summary.count
                      ? `${formatScore(item.summary.average)} / 5 · ${reviewCountLabel(item.summary.count, lang)}`
                      : t('ratings.noReviews')}
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
                {cityLabel(active?.city ?? '', lang) || t('ratings.newUni')}
              </div>
              <h2>{activeName}</h2>
              <p className="score-line">
                <b>{formatScore(summary.average)}</b>
                <span>
                  {' '}
                  / 5 · {reviewCountLabel(summary.count, lang)}
                </span>
              </p>
              <AspectMeters summary={summary} />
              {activeName ? <MapSources universityName={activeName} /> : null}
              {activeName ? <ReviewProvenance universityName={activeName} reviews={reviewsForUniversity(activeName)} /> : null}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '16px 0' }}>
                <button className="primary" onClick={() => onOpenProfile(activeName)}>
                  {t('ratings.visual')}
                </button>
              </div>
              <div className="role-row" style={{ margin: '8px 0 4px' }}>
                <button type="button" className={roleFilter === 'all' ? 'on' : ''} onClick={() => setRoleFilter('all')}>
                  {t('ratings.all', { count: summary.count })}
                </button>
                {ROLES.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={roleFilter === item.id ? 'on' : ''}
                    onClick={() => setRoleFilter(item.id)}
                  >
                    {roleLabel(item.id, lang, item.label)}
                  </button>
                ))}
              </div>
              <ReviewForm universityName={activeName} onSaved={() => setVersion((n) => n + 1)} />
              <div className="review-list">
                {reviews.length ? reviews.map((review) => <ReviewCard key={review.id} review={review} />) : (
                  <p className="meta">{t('ratings.emptyList')}</p>
                )}
              </div>
            </>
          ) : (
            <p>{t('ratings.findFirst')}</p>
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
  const { t, lang } = useI18n()
  const reviews = reviewsForUniversity(universityName)
  const summary = summarizeReviews(reviews)
  return (
    <section className="profile-reviews">
      <div className="panel">
        <div className="review-head">
          <div>
            <h3>{t('reviews.profileTitle')}</h3>
            <p className="meta">{t('reviews.profileNote')}</p>
          </div>
          <button className="ghost" onClick={onRatings}>
            {t('reviews.allRatings')}
          </button>
        </div>
        <p className="score-line">
          <b>{formatScore(summary.average)}</b>
          <span>
            {' '}
            / 5 · {reviewCountLabel(summary.count, lang)}
          </span>
        </p>
        <AspectMeters summary={summary} />
        <ReviewProvenance universityName={universityName} reviews={reviews} />
      </div>
      <div className="panel">
        <ReviewForm universityName={universityName} onSaved={onSaved} />
      </div>
      <div className="review-list" style={{ gridColumn: '1 / -1' }}>
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  )
}
