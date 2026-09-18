import type { ReviewAspectId, ReviewRole, UniversityReview } from '../types'

export const ASPECTS: { id: ReviewAspectId; label: string }[] = [
  { id: 'campus', label: 'Кампус' },
  { id: 'dorm', label: 'Общежитие' },
  { id: 'teaching', label: 'Учёба' },
  { id: 'life', label: 'Студенческая жизнь' },
  { id: 'city', label: 'Город' },
]

export const ROLES: { id: ReviewRole; label: string }[] = [
  { id: 'applicant', label: 'абитуриент' },
  { id: 'student', label: 'студент' },
  { id: 'graduate', label: 'выпускник' },
]

function review(
  id: string,
  universityName: string,
  author: string,
  role: ReviewRole,
  rating: number,
  scores: [number, number, number, number, number],
  text: string,
  createdAt: string,
): UniversityReview {
  return {
    id,
    universityKey: universityName,
    universityName,
    author,
    role,
    rating,
    scores: {
      campus: scores[0],
      dorm: scores[1],
      teaching: scores[2],
      life: scores[3],
      city: scores[4],
    },
    text,
    createdAt,
  }
}

export const SEED_REVIEWS: UniversityReview[] = [
]
