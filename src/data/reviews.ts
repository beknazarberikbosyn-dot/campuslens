import type { ReviewAspectId, ReviewRole, UniversityReview } from '../types'

export const ASPECTS: { id: ReviewAspectId; label: string }[] = [
  { id: 'campus', label: 'Кампус' },
  { id: 'dorm', label: 'Общежитие' },
  { id: 'teaching', label: 'Учёба' },
  { id: 'life', label: 'Студенческая жизнь' },
  { id: 'city', label: 'Город' },
  review(
    'seed-nu-1',
    'Nazarbayev University',
    'Айжан',
    'student',
    5,
    [5, 5, 5, 4, 4],
    'Поступала через NU: кампус новый, лаборатории реальные, общежитие рядом с учёбой. Зимой до центра далеко, но внутри кампуса жить удобно.',
    '2026-03-12',
  ),
  review(
    'seed-nu-2',
    'Nazarbayev University',
    'Данияр',
    'applicant',
    4,
    [5, 4, 4, 4, 3],
    'На дне открытых дверей смотрела не буклет, a общежитие и столовую. Заявку подавала сама: процесс долгий, но честный. Кампус сильнее, чем город вокруг.',
    '2026-04-02',
  ),
  review(
    'seed-nu-3',
    'Nazarbayev University',
    'Сабина',
    'graduate',
    5,
    [5, 4, 5, 4, 4],
    'Училась на STEM. Библиотека и lab-корпуса — главная причина, почему я бы снова выбрала NU. Астана дорогая для студента без гранта.',
    '2025-11-20',
  ),
  review(
    'seed-kaznu-1',
    'Al-Farabi Kazakh National University',
    'Нурлан',
    'student',
    4,
    [5, 3, 4, 4, 5],
    'КазНУ выигрывает парком и городом: Алматы живой. Главный корпус красивый, общежития уже не новые. Поступал через грант, конкурс большой.',
    '2026-02-18',
  ),
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
