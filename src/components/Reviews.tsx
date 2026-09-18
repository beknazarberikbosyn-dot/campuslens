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
