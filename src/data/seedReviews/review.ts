import type { ReviewRole, UniversityReview } from '../../types'
import { evidenceFor } from './evidence'

export function review(
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
    source: 'campuslens',
    ...evidenceFor(universityName, id),
  }
}
