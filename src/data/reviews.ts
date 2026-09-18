import type { ReviewAspectId, ReviewRole, UniversityReview } from '../types'
import { KAZNU_REVIEWS } from './seedReviews/kaznu'
import { MIT_REVIEWS } from './seedReviews/mit'
import { NU_REVIEWS } from './seedReviews/nazarbayev'
import { OXFORD_REVIEWS } from './seedReviews/oxford'
import { review } from './seedReviews/review'
import { SATBAYEV_REVIEWS } from './seedReviews/satbayev'
import { STANFORD_REVIEWS } from './seedReviews/stanford'

export { review }

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

export const SEED_REVIEWS: UniversityReview[] = [
  ...NU_REVIEWS,
  ...KAZNU_REVIEWS,
  ...SATBAYEV_REVIEWS,
  ...MIT_REVIEWS,
  ...OXFORD_REVIEWS,
  ...STANFORD_REVIEWS,
]
