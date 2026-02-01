// data/broadcast-schedule.ts
// Known broadcast assignments for games where MLB API doesn't have data yet
// This can be updated manually or replaced with an API integration later

export interface BroadcastOverride {
  homeTeam: string
  awayTeam: string
  date: string // YYYY-MM-DD
  broadcasts: string[]
  isNational: boolean
  nationalNote?: string
  estimatedTicketPrice?: number // Estimated lowest price per ticket
}

// 2026 Season - Known broadcasts and estimated ticket prices
// Sources: MLB.com, NBC Sports, Sports Media Watch
// Ticket prices are estimates based on typical market rates
export const BROADCAST_OVERRIDES: BroadcastOverride[] = [
  // Opening Night - March 25, 2026 (Yankees @ Giants)
  {
    homeTeam: 'San Francisco Giants',
    awayTeam: 'New York Yankees',
    date: '2026-03-25',
    broadcasts: ['Netflix'],
    isNational: true,
    nationalNote: 'Opening Night on Netflix',
    estimatedTicketPrice: 185
  },
  // March 27, 2026 (Yankees @ Giants)
  {
    homeTeam: 'San Francisco Giants',
    awayTeam: 'New York Yankees',
    date: '2026-03-27',
    broadcasts: ['YES', 'NBC Sports Bay Area'],
    isNational: false,
    estimatedTicketPrice: 95
  },
  // March 28, 2026 (Yankees @ Giants)
  {
    homeTeam: 'San Francisco Giants',
    awayTeam: 'New York Yankees',
    date: '2026-03-28',
    broadcasts: ['FOX'],
    isNational: true,
    nationalNote: 'Baseball Night in America',
    estimatedTicketPrice: 110
  },
  // March 30, 2026 (Yankees @ Mariners)
  {
    homeTeam: 'Seattle Mariners',
    awayTeam: 'New York Yankees',
    date: '2026-03-30',
    broadcasts: ['ESPN'],
    isNational: true,
    nationalNote: 'Sunday Night Baseball',
    estimatedTicketPrice: 75
  },
  // March 31, 2026 (Yankees @ Mariners)
  {
    homeTeam: 'Seattle Mariners',
    awayTeam: 'New York Yankees',
    date: '2026-03-31',
    broadcasts: ['YES', 'ROOT Sports NW'],
    isNational: false,
    estimatedTicketPrice: 55
  },
  // April 1, 2026 (Yankees @ Mariners)
  {
    homeTeam: 'Seattle Mariners',
    awayTeam: 'New York Yankees',
    date: '2026-04-01',
    broadcasts: ['YES', 'ROOT Sports NW'],
    isNational: false,
    estimatedTicketPrice: 50
  },
  // April 3, 2026 - Yankees Home Opener (vs Marlins)
  {
    homeTeam: 'New York Yankees',
    awayTeam: 'Miami Marlins',
    date: '2026-04-03',
    broadcasts: ['YES'],
    isNational: false,
    estimatedTicketPrice: 125
  },
]

/**
 * Look up broadcast override for a specific game
 */
export function getBroadcastOverride(
  homeTeam: string,
  awayTeam: string,
  date: string
): BroadcastOverride | null {
  return BROADCAST_OVERRIDES.find(
    (b) =>
      b.date === date &&
      ((b.homeTeam === homeTeam && b.awayTeam === awayTeam) ||
        (b.homeTeam === awayTeam && b.awayTeam === homeTeam))
  ) || null
}

/**
 * Get estimated ticket price for a specific game
 */
export function getEstimatedTicketPrice(
  homeTeam: string,
  awayTeam: string,
  date: string
): number | null {
  const override = getBroadcastOverride(homeTeam, awayTeam, date)
  return override?.estimatedTicketPrice || null
}
