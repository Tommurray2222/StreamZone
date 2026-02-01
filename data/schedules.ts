// data/schedules.ts
// MLB team schedules for 2026 season

export interface Game {
  id: string
  date: string // ISO date string
  time: string // Local time (ET for Yankees)
  opponent: string
  isHome: boolean
  venue: string
  broadcast: string[]
  isNational: boolean
  nationalNote?: string
  tickets?: {
    url: string
    lowestPrice: number // in USD
  }
}

export interface TeamSchedule {
  team: string
  games: Game[]
}

// Yankees 2026 Regular Season - First 3 Games
// Opening Day: Thursday, March 26, 2026
export const TEAM_SCHEDULES: Record<string, Game[]> = {
  'New York Yankees': [
    {
      id: 'nyy-2026-001',
      date: '2026-03-25',
      time: '8:05 PM ET',
      opponent: 'San Francisco Giants',
      isHome: false,
      venue: 'Oracle Park',
      broadcast: ['ESPN'],
      isNational: true,
      nationalNote: 'Opening Night'
    },
    {
      id: 'nyy-2026-002',
      date: '2026-03-27',
      time: '4:35 PM ET',
      opponent: 'San Francisco Giants',
      isHome: false,
      venue: 'Oracle Park',
      broadcast: ['YES', 'NBC Sports Bay Area'],
      isNational: false
    },
    {
      id: 'nyy-2026-003',
      date: '2026-03-28',
      time: '7:15 PM ET',
      opponent: 'San Francisco Giants',
      isHome: false,
      venue: 'Oracle Park',
      broadcast: ['YES', 'NBC Sports Bay Area'],
      isNational: false
    }
  ]
}

export function getTeamSchedule(team: string): Game[] {
  return TEAM_SCHEDULES[team] || []
}
