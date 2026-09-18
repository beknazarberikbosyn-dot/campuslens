export const GITHUB_REPO = 'beknazarberikbosyn-dot/campuslens'

export const SEED_FILES: Record<string, string> = {
  'Nazarbayev University': 'src/data/seedReviews/nazarbayev.ts',
  'Al-Farabi Kazakh National University': 'src/data/seedReviews/kaznu.ts',
  'Satbayev University': 'src/data/seedReviews/satbayev.ts',
  'Massachusetts Institute of Technology': 'src/data/seedReviews/mit.ts',
  'University of Oxford': 'src/data/seedReviews/oxford.ts',
  'Stanford University': 'src/data/seedReviews/stanford.ts',
}

export function githubBlobUrl(file: string) {
  return `https://github.com/${GITHUB_REPO}/blob/main/${file}`
}

export function githubSearchUrl(id: string) {
  return `https://github.com/search?q=repo%3A${GITHUB_REPO}+${encodeURIComponent(id)}&type=code`
}

export function evidenceFor(universityName: string, id: string) {
  const evidenceFile = SEED_FILES[universityName]
  if (!evidenceFile) return {}
  return {
    evidenceFile,
    evidenceUrl: githubBlobUrl(evidenceFile),
    evidenceSearchUrl: githubSearchUrl(id),
  }
}
