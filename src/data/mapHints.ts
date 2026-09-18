import { normalize } from './catalog'

export type CampusHint = {
  title: string
  city: string
  lat: number
  lon: number
  dgisHost: 'https://2gis.kz' | 'https://2gis.com'
}

export const CAMPUS_HINTS: CampusHint[] = [
  {
    title: 'Nazarbayev University',
    city: 'Астана',
    lat: 51.0907,
    lon: 71.3981,
    dgisHost: 'https://2gis.kz',
  },
  {
    title: 'Al-Farabi Kazakh National University',
    city: 'Алматы',
    lat: 43.2252,
    lon: 76.9224,
    dgisHost: 'https://2gis.kz',
  },
  {
    title: 'Satbayev University',
    city: 'Алматы',
    lat: 43.2415,
    lon: 76.9532,
    dgisHost: 'https://2gis.kz',
  },
  {
    title: 'Massachusetts Institute of Technology',
    city: 'Cambridge',
    lat: 42.3601,
    lon: -71.0942,
    dgisHost: 'https://2gis.com',
  },
  {
    title: 'University of Oxford',
    city: 'Oxford',
    lat: 51.7548,
    lon: -1.2544,
    dgisHost: 'https://2gis.com',
  },
  {
    title: 'Stanford University',
    city: 'Stanford',
    lat: 37.4275,
    lon: -122.1697,
    dgisHost: 'https://2gis.com',
  },
]

export function campusHint(name: string): CampusHint | null {
  const n = normalize(name)
  return CAMPUS_HINTS.find((h) => normalize(h.title) === n || n.includes(normalize(h.title))) ?? null
}
