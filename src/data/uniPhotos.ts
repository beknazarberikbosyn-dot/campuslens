import { normalize } from './catalog'
import type { CategoryId } from '../types'

export type CuratedPhoto = {
  title: string
  hint: CategoryId
}

export type CuratedPhotoSet = {
  keys: string[]
  category: string
  files: CuratedPhoto[]
}

/** Реальные файлы Wikimedia Commons этого вуза — не сток и не чужой кампус. */
export const CURATED_PHOTOS: CuratedPhotoSet[] = [
  {
    keys: ['nazarbayev university', 'назарбаев университет'],
    category: 'Nazarbayev University',
    files: [
      { title: 'NU Library.JPG', hint: 'library' },
      { title: 'Renewable Energy Lab at NU.JPG', hint: 'lab' },
      { title: 'RAs at Nazarbayev University.jpg', hint: 'dorm' },
      { title: 'Presenting on a conference.JPG', hint: 'classroom' },
      { title: 'Nazarbayev University, School of Engineering.jpg', hint: 'campus' },
      { title: 'Nazarbayev University, School of Humanities and Social Sciences.jpg', hint: 'classroom' },
      { title: 'Nazarbayev University, School of Science and Technology.jpg', hint: 'lab' },
      { title: 'Nazarbayev University 2.jpg', hint: 'campus' },
      { title: 'Nazarbaev University Astana.JPG', hint: 'campus' },
      { title: 'Nazarbaev University.jpg', hint: 'campus' },
      { title: 'Назарбаев Университеті.JPG', hint: 'campus' },
    ],
  },
  {
    keys: ['al-farabi kazakh national university', 'казахский национальный университет', 'казну'],
    category: 'Al-Farabi Kazakh National University',
    files: [
      { title: 'Al-Farabi KazNU rektorat.jpg', hint: 'campus' },
      { title: 'Main building of KazNU.jpg', hint: 'campus' },
      { title: 'TWC, KazNU Campus.JPG', hint: 'life' },
      { title: 'ҚазҰУ Жур.фак.JPG', hint: 'classroom' },
      { title: 'ҚазҰУ баспасөз клубы.jpg', hint: 'life' },
      { title: 'Қазақ ұлттық университетінің баспасөз орталығы.JPG', hint: 'life' },
      { title: 'Әл-Фараби атындағы Қазақ Ұлттық университеті.jpg', hint: 'campus' },
      { title: 'Al-Farabi University (AP4M2500 1PS) (29689474976).jpg', hint: 'campus' },
      { title: 'Al-Farabi University (AP4P0172 1PS) (29554231332).jpg', hint: 'sport' },
    ],
  },
  {
    keys: ['satbayev university', 'сатпаев', 'казниту'],
    category: 'Satbayev University',
    files: [
      { title: 'Satbayev University.jpg', hint: 'campus' },
      { title: 'Satbayev University 2.jpg', hint: 'campus' },
      { title: 'Young Researchers at Satbayev University.jpg', hint: 'lab' },
    ],
  },
  {
    keys: ['massachusetts institute of technology', 'массачусетский технологический'],
    category: 'Massachusetts Institute of Technology',
    files: [
      { title: 'East Campus, MIT Buildings 62 and 64 - Cambridge, MA - DSC05583.jpg', hint: 'dorm' },
      { title: 'MIT - My Room in Senior House (4714200747).jpg', hint: 'dorm' },
      { title: 'MIT - Senior House in East Campus (4715987246).jpg', hint: 'dorm' },
      { title: 'Building62and64.jpg', hint: 'dorm' },
      { title: 'Barker Library MIT October 2014 001.jpg', hint: 'library' },
      { title: 'Barker Library at MIT.jpg', hint: 'library' },
      { title: 'Great-Dome-Barker-Library-Massachusetts-Institute-of-Technology.jpg', hint: 'library' },
      { title: 'Massachusetts-Institute-of-Technology-MIT-Chapel.jpg', hint: 'life' },
      { title: "MIT's robots.jpg", hint: 'lab' },
    ],
  },
  {
    keys: ['university of oxford', 'университет оксфорда', 'оксфордский университет'],
    category: 'University of Oxford',
    files: [
      { title: "Duke Humfrey's Library Interior 1, Bodleian Library, Oxford, UK - Diliff.jpg", hint: 'library' },
      { title: 'Interior of Merton College Library, Oxford, 01.png', hint: 'library' },
      { title: 'Christ church college dining hall.jpg', hint: 'life' },
      { title: 'Oxford. Christ Church College, Dining Hall (3610730235).jpg', hint: 'life' },
      { title: 'Radcliffe Camera Oxford 2018 03.jpg', hint: 'library' },
      { title: 'Oxford University Museum of Natural History, Oxford, UK - Diliff.jpg', hint: 'lab' },
    ],
  },
  {
    keys: ['stanford university', 'стэнфордский университет', 'стенфордский университет'],
    category: 'Stanford University',
    files: [
      { title: 'Green Library Stanford University.jpg', hint: 'library' },
      { title: "Cecil H. Green Library´s Bing Wing, Stanford University, California 05.jpg", hint: 'library' },
      { title: 'Slacklining at Stanford.jpg', hint: 'life' },
      { title: 'Beat Cal Banner at Green Library.jpg', hint: 'life' },
      { title: 'Gates Building at Night - Flickr - Peter Kaminski.jpg', hint: 'lab' },
      { title: 'Stanford Oval May 2011 panorama.jpg', hint: 'campus' },
    ],
  },
]

export const CITY_PHOTOS: Record<string, CuratedPhoto[]> = {
  Астана: [
    { title: 'Baiterek Tower Astana.jpg', hint: 'city' },
    { title: 'Astana skyline (2012).jpg', hint: 'city' },
  ],
  Алматы: [
    { title: 'Kok Tobe Almaty.jpg', hint: 'city' },
    { title: 'Almaty cityscape.jpg', hint: 'city' },
  ],
  Cambridge: [
    { title: 'Charles River Esplanade Boston.jpg', hint: 'city' },
  ],
  Oxford: [
    { title: 'Oxford skyline from a distance - geograph.org.uk - 356411.jpg', hint: 'city' },
  ],
  Stanford: [
    { title: 'Stanford, California, United States Post Office, March 2019.jpg', hint: 'city' },
  ],
}

export function curatedPhotosFor(name: string): CuratedPhotoSet | null {
  const n = normalize(name)
  return CURATED_PHOTOS.find((row) => row.keys.some((key) => n.includes(key) || key.includes(n))) ?? null
}
