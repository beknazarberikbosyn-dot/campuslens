import { ASPECTS } from '../data/reviews'
import {
  combinedCampusScore,
  formatScore,
  reviewsForUniversity,
  summarizeReviews,
  visualCoverageScore,
} from '../lib/reviews'
import { AspectMeters, Stars } from './Reviews'
import type { VisualProfile } from '../types'

function Side({ profile }: { profile: VisualProfile }) {
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
        <span> итоговый балл CampusLens</span>
      </p>
      <p className="meta">
        Отзывы {formatScore(summary.average)} / 5 · {summary.count} шт. · фотокампус {visual}/100
      </p>
      <div className="compare-kpis">
        <div>
          <b>{profile.photos.length}</b>
          <span>кадров</span>
        </div>
        <div>
          <b>{verified}</b>
          <span>подтверждённых</span>
        </div>
        <div>
          <b>{formatScore(summary.average)}</b>
          <span>отзывы</span>
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
          Отзывов по этому вузу ещё нет — в итоге пока сильнее визуальная часть.
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
        <button className="ghost" onClick={onBack}>
          Назад к профилю
        </button>
      </div>
      <div style={{ padding: '12px 28px 0' }}>
        <div className="kicker" style={{ color: 'var(--rust)' }}>
          Фото + отзывы с заявок
        </div>
        <h1 style={{ fontSize: 42, color: 'inherit' }}>Сравнение</h1>
        <p className="lede" style={{ color: 'var(--ink-soft)', maxWidth: 640 }}>
          Итоговый балл складывается из открытых фотографий кампуса и отзывов людей, которые
          поступали или учились. Отзывы весят примерно половину оценки, если их достаточно.
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
          <input name="other" placeholder="Второй университет" style={{ color: 'var(--ink)' }} />
          <button type="submit">Сравнить</button>
        </form>
        {other ? (
          <div className="verdict">
            <p>
              {totalWinner
                ? `Итог с учётом отзывов: впереди ${totalWinner} (${Math.max(leftCombined, rightCombined)} против ${Math.min(leftCombined, rightCombined)}).`
                : 'Итоговые баллы совпали — смотрите разбивку по отзывам и кадрам.'}
            </p>
            <p>
              {reviewWinner
                ? `По отзывам абитуриентов выше ${reviewWinner}.`
                : 'Средние оценки по отзывам близки или данных мало.'}{' '}
              По открытым фото: {profile.university.displayName} {leftVisual}/100
              {other ? `, ${other.university.displayName} ${rightVisual}/100` : ''}.
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
            <p>Введите второй вуз, чтобы сравнить кампусы и отзывы по одним правилам.</p>
          </article>
        )}
      </div>
      {other && rightSummary ? (
        <div className="panel" style={{ margin: '0 28px 48px' }}>
          <h3>Где сильнее по отзывам</h3>
          <div className="aspect-duel">
            {ASPECTS.map((aspect) => {
              const a = leftSummary.aspects[aspect.id]
              const b = rightSummary.aspects[aspect.id]
              const lead = a === b ? 'ровно' : a > b ? profile.university.displayName : other.university.displayName
              return (
                <div key={aspect.id}>
                  <span>{aspect.label}</span>
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
