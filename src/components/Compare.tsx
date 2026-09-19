import { ASPECTS } from '../data/reviews'
import { aspectLabel, useI18n } from '../i18n'
import {
  combinedCampusScore,
  formatScore,
  reviewsForUniversity,
  summarizeReviews,
  visualCoverageScore,
} from '../lib/reviews'
import { LanguageSwitcher } from './LanguageSwitcher'
import { AspectMeters, Stars } from './Reviews'
import type { VisualProfile } from '../types'

function Side({ profile }: { profile: VisualProfile }) {
  const { t } = useI18n()
  const reviews = reviewsForUniversity(profile.university.displayName)
  const summary = summarizeReviews(reviews)
  const visual = visualCoverageScore(profile)
  const combined = combinedCampusScore(visual, summary)
  const verified = profile.photos.filter((x) => x.level === 'verified').length
  return (
    <article className="panel">
      <h3>{profile.university.displayName}</h3>
      <p className="score-line">
        <b>{combined}</b>
        <span> {t('compare.scoreLabel')}</span>
      </p>
      <p className="meta">
        {t('compare.reviewsMeta', { score: formatScore(summary.average), count: summary.count, visual })}
      </p>
      <div className="compare-kpis">
        <div>
          <b>{profile.photos.length}</b>
          <span>{t('compare.frames')}</span>
        </div>
        <div>
          <b>{verified}</b>
          <span>{t('compare.verified')}</span>
        </div>
        <div>
          <b>{formatScore(summary.average)}</b>
          <span>{t('compare.reviews')}</span>
        </div>
      </div>
      <AspectMeters summary={summary} />
      {profile.facts?.items.slice(0, 3).map((item) => (
        <p key={item.id} className="meta" style={{ marginTop: 8 }}>
          <b>{item.label}.</b> {item.value}
        </p>
      ))}
      <p style={{ marginTop: 14 }}>{profile.description.slice(0, 220)}…</p>
      <div className="grid-3" style={{ marginTop: 12 }}>
        {profile.photos.slice(0, 3).map((ph) => (
          <img key={ph.id} src={ph.thumb} alt="" />
        ))}
      </div>
      {reviews[0] ? (
        <blockquote className="compare-quote">
          «{reviews[0].text}»
          <cite>
            {reviews[0].author} · <Stars value={reviews[0].rating} />
          </cite>
        </blockquote>
      ) : (
        <p className="meta" style={{ marginTop: 12 }}>
          {t('compare.noReviews')}
        </p>
      )}
    </article>
  )
}

export function CompareView({
  profile,
  other,
  onHome,
  onBack,
  onCompare,
}: {
  profile: VisualProfile
  other: VisualProfile | null
  onHome: () => void
  onBack: () => void
  onCompare: (name: string) => void
}) {
  const { t, lang } = useI18n()
  const leftReviews = reviewsForUniversity(profile.university.displayName)
  const leftSummary = summarizeReviews(leftReviews)
  const leftVisual = visualCoverageScore(profile)
  const leftCombined = combinedCampusScore(leftVisual, leftSummary)

  const rightReviews = other ? reviewsForUniversity(other.university.displayName) : []
  const rightSummary = other ? summarizeReviews(rightReviews) : null
  const rightVisual = other ? visualCoverageScore(other) : 0
  const rightCombined = other && rightSummary ? combinedCampusScore(rightVisual, rightSummary) : 0

  const reviewWinner =
    other && rightSummary && leftSummary.average !== rightSummary.average
      ? leftSummary.average > rightSummary.average
        ? profile.university.displayName
        : other.university.displayName
      : null
  const totalWinner =
    other && leftCombined !== rightCombined
      ? leftCombined > rightCombined
        ? profile.university.displayName
        : other.university.displayName
      : null

  return (
    <div className="paper-page">
      <div className="topbar">
        <button className="brand" onClick={onHome}>
          <span className="mark" />
          CampusLens
        </button>
        <LanguageSwitcher />
        <div className="topbar-end">
          <button className="ghost" onClick={onBack}>
            {t('nav.backProfile')}
          </button>
        </div>
      </div>
      <div style={{ padding: '12px 28px 0' }}>
        <div className="kicker" style={{ color: 'var(--rust)' }}>
          {t('compare.kicker')}
        </div>
        <h1 style={{ fontSize: 42, color: 'inherit' }}>{t('compare.title')}</h1>
        <p className="lede" style={{ color: 'var(--ink-soft)', maxWidth: 640 }}>
          {t('compare.lede')}
        </p>
        <form
          className="search"
          style={{ background: '#fff', borderColor: 'var(--line)' }}
          onSubmit={(e) => {
            e.preventDefault()
            const input = (e.currentTarget.elements.namedItem('other') as HTMLInputElement).value
            if (input.trim()) onCompare(input.trim())
          }}
        >
          <input name="other" placeholder={t('compare.placeholder')} style={{ color: 'var(--ink)' }} />
          <button type="submit">{t('compare.submit')}</button>
        </form>
        {other ? (
          <div className="verdict">
            <p>
              {totalWinner
                ? t('compare.totalWinner', {
                    name: totalWinner,
                    hi: Math.max(leftCombined, rightCombined),
                    lo: Math.min(leftCombined, rightCombined),
                  })
                : t('compare.totalTie')}
            </p>
            <p>
              {reviewWinner ? t('compare.reviewWinner', { name: reviewWinner }) : t('compare.reviewTie')}{' '}
              {t('compare.photos', {
                left: profile.university.displayName,
                leftScore: leftVisual,
                right: other.university.displayName,
                rightScore: rightVisual,
              })}
            </p>
          </div>
        ) : null}
      </div>
      <div className="compare">
        <Side profile={profile} />
        {other ? (
          <Side profile={other} />
        ) : (
          <article className="panel">
            <p>{t('compare.empty')}</p>
          </article>
        )}
      </div>
      {other && rightSummary ? (
        <div className="panel" style={{ margin: '0 28px 48px' }}>
          <h3>{t('compare.aspectsTitle')}</h3>
          <div className="aspect-duel">
            {ASPECTS.map((aspect) => {
              const a = leftSummary.aspects[aspect.id]
              const b = rightSummary.aspects[aspect.id]
              const lead = a === b ? t('compare.tie') : a > b ? profile.university.displayName : other.university.displayName
              return (
                <div key={aspect.id}>
                  <span>{aspectLabel(aspect.id, lang, aspect.label)}</span>
                  <b>
                    {formatScore(a)} — {formatScore(b)}
                  </b>
                  <em>{lead}</em>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
