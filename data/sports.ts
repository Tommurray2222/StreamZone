export interface Sport {
  id: string
  name: string
  shortName: string
  enabled: boolean
  comingSoonText?: string
}

export const SPORTS: Sport[] = [
  { id: 'mlb', name: 'Major League Baseball', shortName: 'MLB', enabled: true },
  { id: 'nba', name: 'NBA', shortName: 'NBA', enabled: false, comingSoonText: 'Coming Soon' },
  { id: 'nfl', name: 'NFL', shortName: 'NFL', enabled: false, comingSoonText: 'Coming Soon' },
  { id: 'epl', name: 'Premier League', shortName: 'EPL', enabled: false, comingSoonText: 'Coming Soon' },
]
