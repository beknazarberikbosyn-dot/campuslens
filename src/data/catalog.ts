import type { CategoryId, CityFacts } from '../types'

export const CATEGORIES: { id: CategoryId; label: string; keys: string[] }[] = [
  {
    id: 'dorm',
    label: 'Общежитие',
    keys: ['dorm', 'residence hall', 'hostel', 'общежит', 'housing', 'east campus', 'dormitory'],
  },
  {
    id: 'sport',
    label: 'Спорт',
    keys: ['sport', 'stadium', 'gym', 'athletic', 'спорт', 'arena', 'field house'],
  },
  {
    id: 'lab',
    label: 'Лаборатории',
    keys: ['lab', 'лаборат', 'laboratory', 'research', 'in vitro', 'science and technology'],
  },
  {
    id: 'life',
    label: 'Студенческая жизнь',
    keys: ['student', 'студент', 'club', 'graduation', 'commencement', 'campus life', 'event'],
  },
  {
    id: 'library',
    label: 'Библиотека',
    keys: ['library', 'библиот', 'bodleian', 'radcliffe camera', 'reading room'],
  },
  {
    id: 'classroom',
    label: 'Аудитории',
    keys: ['classroom', 'lecture', 'аудитор', 'auditorium', 'lecture hall', 'class'],
  },
  {
    id: 'city',
    label: 'Город',
    keys: ['skyline', 'cityscape', 'downtown', 'baiterek', 'bayterek', 'kok-tobe', 'kök töbe'],
  },
  {
    id: 'campus',
    label: 'Кампус',
    keys: ['campus', 'кампус', 'quad', 'atrium', 'facade', 'rektorat', 'main building', 'корпус', 'building'],
  },
]

export const FILTERS: { id: CategoryId | 'all'; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'campus', label: 'Кампус' },
  { id: 'dorm', label: 'Общежитие' },
  { id: 'classroom', label: 'Аудитории' },
  { id: 'library', label: 'Библиотеки' },
  { id: 'lab', label: 'Лаборатории' },
  { id: 'sport', label: 'Спорт' },
  { id: 'life', label: 'Студенческая жизнь' },
  { id: 'city', label: 'Город' },
]

export const CITIES: CityFacts[] = [
  {
    name: 'Астана',
    climate: 'Резко континентальный: зима −15…−20 °C, лето +22…+28 °C, мало осадков.',
    transport: 'Автобусы, LRT строится, такси и каршеринг. Кампус NU — на окраине, 25–40 мин до центра.',
    livingCost: 'Ориентир для студента: 180–280 тыс. ₸/мес без учёбы (жильё + еда).',
    lat: 51.1694,
    lon: 71.4491,
  },
  {
    name: 'Алматы',
    climate: 'Континентальный у предгорий: зима мягче Астаны, лето сухое, воздух суше, чем у моря.',
    transport: 'Метро, автобусы, троллейбусы. Кампусы КазНУ и Satbayev — в южной части, ближе к горам.',
    livingCost: 'Ориентир для студента: 200–320 тыс. ₸/мес без учёбы.',
    lat: 43.238,
    lon: 76.9455,
  },
  {
    name: 'Cambridge',
    climate: 'Умеренный приморский: зима около 0 °C, лето +20…+27 °C, частые дожди.',
    transport: 'MBTA, велосипед, пешком. MIT стоит у реки Charles, 15 мин до Boston на метро.',
    livingCost: 'Очень высокий: жильё часто $1,500+ / мес. в комнате.',
    lat: 42.3736,
    lon: -71.1106,
  },
  {
    name: 'Oxford',
    climate: 'Мягкий океанический: зима +3…+8 °C, лето +18…+23 °C, пасмурно и влажно.',
    transport: 'Пешком и на велосипеде по колледжам, автобусы, поезд до Лондона ~1 час.',
    livingCost: 'Высокий для Великобритании: комната £700–1,100 / мес.',
    lat: 51.752,
    lon: -1.2577,
  },
  {
    name: 'Stanford',
    climate: 'Средиземноморский: мягкая зима, сухое тёплое лето, редкие морозы.',
    transport: 'Caltrain, велосипед по кампусу, авто. Кампус огромный, центр Palo Alto рядом.',
    livingCost: 'Один из самых дорогих регионов США.',
    lat: 37.4419,
    lon: -122.143,
  },
]

export const ALIASES: Record<string, string[]> = {
  nu: ['Nazarbayev University', 'Northeastern University', 'Naresuan University'],
  ну: ['Nazarbayev University', 'Евразийский национальный университет'],
  'nazarbayev university': ['Nazarbayev University'],
  казну: ['Al-Farabi Kazakh National University'],
  казгу: ['Al-Farabi Kazakh National University'],
  kaznu: ['Al-Farabi Kazakh National University'],
  'al-farabi': ['Al-Farabi Kazakh National University'],
  ену: ['L. N. Gumilev Eurasian National University'],
  enu: ['L. N. Gumilev Eurasian National University'],
  кбту: ['Kazakh-British Technical University'],
  kbtu: ['Kazakh-British Technical University'],
  satbayev: ['Satbayev University'],
  satpaev: ['Satbayev University'],
  казниту: ['Satbayev University'],
  mit: ['Massachusetts Institute of Technology'],
  оксфорд: ['University of Oxford'],
  oxford: ['University of Oxford'],
  стэнфорд: ['Stanford University'],
  stanford: ['Stanford University'],
}

export const SUGGESTIONS = [
  {
    title: 'Nazarbayev University',
    city: 'Астана',
    blurb: 'Автономный кампус на левом берегу',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Nazarbayev_University_2.jpg/1280px-Nazarbayev_University_2.jpg',
  },
  {
    title: 'Al-Farabi Kazakh National University',
    city: 'Алматы',
    blurb: 'Главный корпус и парк КазНУ',
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Al-Farabi_KazNU_rektorat.jpg',
  },
  {
    title: 'Satbayev University',
    city: 'Алматы',
    blurb: 'Старейший технический вуз страны',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Satbayev_University_2.jpg/1280px-Satbayev_University_2.jpg',
  },
  {
    title: 'Massachusetts Institute of Technology',
    city: 'Cambridge',
    blurb: 'Great Dome и East Campus',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/MIT_Dome_night1_Edit.jpg/1280px-MIT_Dome_night1_Edit.jpg',
  },
  {
    title: 'University of Oxford',
    city: 'Oxford',
    blurb: 'Radcliffe Camera и колледжи',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Radcliffe_Camera_Oxford_2018_03.jpg/1280px-Radcliffe_Camera_Oxford_2018_03.jpg',
  },
  {
    title: 'Stanford University',
    city: 'Stanford',
    blurb: 'Main Quad и пальмы',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Stanford_University_campus_in_2016.jpg/1280px-Stanford_University_campus_in_2016.jpg',
  },
]

export function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[“”"'`.,()/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function matchCity(text: string): CityFacts | null {
  const n = normalize(text)
  if (n.includes('astan') || n.includes('астан') || n.includes('nur-sultan') || n.includes('нур-султан')) {
    return CITIES[0]
  }
  if (n.includes('almat') || n.includes('алмат') || n.includes('алма-ат')) return CITIES[1]
  if (n.includes('oxford') || n.includes('оксфорд')) return CITIES[3]
  if (n.includes('stanford') || n.includes('palo alto') || n.includes('стэнфорд')) return CITIES[4]
  if (n.includes('cambridge') || n.includes('кембридж') || n.includes('massachusetts')) return CITIES[2]
  return null
}
