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
