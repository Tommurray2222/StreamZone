// lib/streaming.ts
// Business logic for blackout detection and streaming options

import { MLB_TEAMS, Team } from '@/data/teams'
import { TEAM_TERRITORIES } from '@/data/territories'
import { CHANNEL_STREAMING_MAP, NATIONAL_BROADCASTS } from '@/data/broadcasts'

export interface StreamingService {
  name: string
  price: string | null
  priceNum?: number // numeric price for comparison
  type: 'primary' | 'alternative' | 'national'
  note?: string
  gamesPerSeason?: number // estimated games covered
  coveragePercent?: number // percentage of games covered
}

export interface BestValueOption {
  service: StreamingService
  pricePerGame: number
  annualCost: number
  gamesPerSeason: number
  coveragePercent: number
  valueScore: number // higher is better
  reasoning: string
}

export interface StreamingResult {
  team: string
  teamData: Team
  state: string
  isBlackedOut: boolean
  rsnInfo: {
    name: string
    note: string
    streamingOptions: string[]
  }
  primaryOptions: StreamingService[]
  alternativeOptions: StreamingService[]
  mlbTvStatus: {
    available: boolean
    note: string
  }
  bestValue: BestValueOption | null
  allValueOptions: BestValueOption[]
  categoryOptions: {
    bestOverall: BestValueOption | null
    bestCoverage: BestValueOption | null
    bestBudget: BestValueOption | null
  }
}

/**
 * Check if a user in a given state is blacked out from watching a team on MLB.TV
 */
export function isBlackedOut(team: string, state: string): boolean {
  const territories = TEAM_TERRITORIES[team]
  if (!territories) return false
  return territories.includes(state)
}

/**
 * Get RSN details for a team
 */
export function getTeamRSN(team: string): { name: string; note: string; streamingOptions: string[] } {
  const teamData = MLB_TEAMS[team]
  if (!teamData) {
    return { name: 'Unknown', note: '', streamingOptions: [] }
  }

  const rsnName = teamData.rsn
  const rsnNote = teamData.rsnNote

  // Find streaming options for the RSN
  let streamingOptions: string[] = []

  // Check direct match first
  if (CHANNEL_STREAMING_MAP[rsnName]) {
    streamingOptions = CHANNEL_STREAMING_MAP[rsnName]
  } else {
    // Try partial matches for RSN names
    for (const [channel, options] of Object.entries(CHANNEL_STREAMING_MAP)) {
      if (rsnName.includes(channel) || channel.includes(rsnName.split(' ')[0])) {
        streamingOptions = options
        break
      }
    }
  }

  return {
    name: rsnName,
    note: rsnNote,
    streamingOptions
  }
}

/**
 * Parse price from a service string like "Bally Sports+ ($20/mo)"
 */
function parsePrice(serviceString: string): string | null {
  const match = serviceString.match(/\(([^)]+)\)/)
  return match ? match[1] : null
}

/**
 * Parse numeric monthly price from price string
 */
function parseMonthlyPrice(priceStr: string | null): number | null {
  if (!priceStr) return null
  // Handle "$X/mo" format
  const monthlyMatch = priceStr.match(/\$(\d+)\/mo/)
  if (monthlyMatch) return parseInt(monthlyMatch[1])
  // Handle "$X/year" format - convert to monthly
  const yearlyMatch = priceStr.match(/\$(\d+)\/year/)
  if (yearlyMatch) return Math.round(parseInt(yearlyMatch[1]) / 12)
  // Handle plain "$X" format
  const plainMatch = priceStr.match(/\$(\d+)/)
  if (plainMatch) return parseInt(plainMatch[1])
  return null
}

/**
 * Get clean service name without price
 */
function getServiceName(serviceString: string): string {
  return serviceString.replace(/\s*\([^)]+\)\s*$/, '').trim()
}

/**
 * Calculate best value streaming options
 * MLB season is ~162 games, but actual viewable games depend on service
 */
function calculateAllValueOptions(
  primaryOptions: StreamingService[],
  alternativeOptions: StreamingService[],
  isBlackedOut: boolean
): { best: BestValueOption | null; all: BestValueOption[]; categories: { bestOverall: BestValueOption | null; bestCoverage: BestValueOption | null; bestBudget: BestValueOption | null } } {
  const SEASON_MONTHS = 6 // April - September

  // Service coverage estimates
  const coverageEstimates: Record<string, { games: number; percent: number }> = {
    // Out-of-market options
    'MLB.TV': { games: 150, percent: 93 },
    'ESPN+ Bundle': { games: 150, percent: 93 },
    // In-market RSN options (full coverage)
    'YouTube TV': { games: 155, percent: 96 }, // RSN + national
    'Fubo': { games: 155, percent: 96 },
    'DirecTV': { games: 155, percent: 96 },
    'Hulu + Live TV': { games: 150, percent: 93 },
    'Hulu Live': { games: 150, percent: 93 },
    // Direct RSN streaming
    'Amazon': { games: 145, percent: 90 }, // In-market RSN games
    'Bally Sports+': { games: 145, percent: 90 },
    'NESN 360': { games: 145, percent: 90 },
    'Marquee+': { games: 145, percent: 90 },
    'SCHN+': { games: 145, percent: 90 },
    'Spectrum': { games: 150, percent: 93 },
    'Sling': { games: 130, percent: 80 },
    // National only
    'Apple TV+': { games: 25, percent: 15 },
    'Peacock': { games: 20, percent: 12 },
    'Netflix': { games: 5, percent: 3 },
  }

  const allOptions = [...primaryOptions, ...alternativeOptions]
  const valueOptions: BestValueOption[] = []
  let bestOption: BestValueOption | null = null

  for (const service of allOptions) {
    const monthlyPrice = parseMonthlyPrice(service.price)
    if (!monthlyPrice) continue

    // Find coverage estimate
    let coverage = { games: 100, percent: 62 } // default
    for (const [name, est] of Object.entries(coverageEstimates)) {
      if (service.name.includes(name) || name.includes(service.name)) {
        coverage = est
        break
      }
    }

    const annualCost = monthlyPrice * SEASON_MONTHS
    const pricePerGame = annualCost / coverage.games
    const valueScore = (coverage.percent * 10) - (monthlyPrice / 10)

    const option: BestValueOption = {
      service: { ...service, priceNum: monthlyPrice, gamesPerSeason: coverage.games, coveragePercent: coverage.percent },
      pricePerGame: Math.round(pricePerGame * 100) / 100,
      annualCost,
      gamesPerSeason: coverage.games,
      coveragePercent: coverage.percent,
      valueScore,
      reasoning: ''
    }

    // Set reasoning
    if (isBlackedOut) {
      if (service.name.includes('Bally') || service.name.includes('ESPN+') || service.name === 'NESN 360' || service.name === 'Marquee+') {
        option.reasoning = `Direct RSN streaming covers ~${coverage.games} games`
      } else {
        option.reasoning = `Live TV package with RSN access`
      }
    } else {
      if (service.name === 'ESPN+ Bundle') {
        option.reasoning = `Includes MLB.TV + Disney+ + Hulu`
      } else if (service.name === 'MLB.TV') {
        option.reasoning = `Full out-of-market access`
      } else {
        option.reasoning = `${coverage.percent}% game coverage`
      }
    }

    valueOptions.push(option)

    if (!bestOption || option.valueScore > bestOption.valueScore) {
      bestOption = option
    }
  }

  // Sort by value score (best first)
  valueOptions.sort((a, b) => b.valueScore - a.valueScore)

  // Find category winners
  // Best Overall: highest value score (balance of coverage and price)
  const bestOverall = bestOption

  // Best Coverage: highest coverage percentage
  const bestCoverage = valueOptions.length > 0
    ? valueOptions.reduce((best, current) =>
        current.coveragePercent > best.coveragePercent ? current : best
      )
    : null

  // Best Budget: lowest price with at least 80% coverage
  const budgetOptions = valueOptions.filter(o => o.coveragePercent >= 80)
  const bestBudget = budgetOptions.length > 0
    ? budgetOptions.reduce((best, current) =>
        (current.service.priceNum || 999) < (best.service.priceNum || 999) ? current : best
      )
    : null

  return {
    best: bestOption,
    all: valueOptions,
    categories: {
      bestOverall,
      bestCoverage,
      bestBudget
    }
  }
}

/**
 * Get all streaming options for a team based on user location
 */
export function getStreamingOptions(team: string, state: string): StreamingResult | null {
  const teamData = MLB_TEAMS[team]
  if (!teamData) return null

  const blackedOut = isBlackedOut(team, state)
  const rsnInfo = getTeamRSN(team)

  const primaryOptions: StreamingService[] = []
  const alternativeOptions: StreamingService[] = []

  if (blackedOut) {
    // User is in-market - recommend RSN options based on actual carriers
    // Service pricing reference
    const servicePricing: Record<string, { price: string; note: string }> = {
      'YouTube TV': { price: '$73/mo', note: 'Live TV + RSN access' },
      'Fubo': { price: '$80/mo', note: 'Sports-focused live TV' },
      'Hulu + Live TV': { price: '$77/mo', note: 'Live TV + Hulu library' },
      'Amazon': { price: '$15/mo', note: 'Prime membership (in-market only)' },
      'Bally Sports+': { price: '$20/mo', note: 'Direct RSN streaming' },
      'NESN 360': { price: '$30/mo', note: 'Direct NESN streaming' },
      'Marquee+': { price: '$10/mo', note: 'Direct Cubs streaming' },
      'SCHN+': { price: '$20/mo', note: 'Space City Home Network' },
      'DirecTV': { price: '$90/mo', note: 'Choice package with RSNs' },
      'Spectrum': { price: '$60/mo', note: 'Cable (where available)' },
    }

    // Add services that actually carry this team's RSN
    const addedServices = new Set<string>()

    rsnInfo.streamingOptions.forEach(option => {
      const serviceName = getServiceName(option)
      const pricing = servicePricing[serviceName]

      if (pricing && !addedServices.has(serviceName)) {
        primaryOptions.push({
          name: serviceName,
          price: pricing.price,
          type: 'primary',
          note: pricing.note
        })
        addedServices.add(serviceName)
      } else if (!addedServices.has(serviceName)) {
        // Use price from the option string if available
        primaryOptions.push({
          name: serviceName,
          price: parsePrice(option),
          type: 'primary',
          note: 'RSN carrier'
        })
        addedServices.add(serviceName)
      }
    })

    // Add other major live TV services as alternatives if not already added
    const additionalServices = [
      { name: 'YouTube TV', price: '$73/mo', note: 'Live TV + most RSNs' },
      { name: 'Fubo', price: '$80/mo', note: 'Sports-focused live TV' },
      { name: 'DirecTV', price: '$90/mo', note: 'Choice package with RSNs' },
    ]

    additionalServices.forEach(svc => {
      if (!addedServices.has(svc.name)) {
        alternativeOptions.push({
          name: svc.name,
          price: svc.price,
          type: 'alternative',
          note: svc.note
        })
      }
    })
  } else {
    // User is out-of-market - MLB.TV is the primary option
    primaryOptions.push({
      name: 'MLB.TV',
      price: '$25/mo or $150/year',
      type: 'primary',
      note: 'Full access to out-of-market games'
    })

    primaryOptions.push({
      name: 'ESPN+ Bundle',
      price: '$15/mo (with Disney+ & Hulu)',
      type: 'primary',
      note: 'Includes MLB.TV access'
    })

    // Add national broadcast options
    alternativeOptions.push({
      name: 'Apple TV+',
      price: '$13/mo',
      type: 'national',
      note: 'Friday Night Baseball (exclusive)'
    })

    alternativeOptions.push({
      name: 'Peacock',
      price: '$8/mo',
      type: 'national',
      note: 'Sunday MLB games'
    })

    alternativeOptions.push({
      name: 'Netflix',
      price: '$15/mo',
      type: 'national',
      note: 'Select games (Christmas, special events)'
    })
  }

  const { best: bestValue, all: allValueOptions, categories } = calculateAllValueOptions(primaryOptions, alternativeOptions, blackedOut)

  return {
    team,
    teamData,
    state,
    isBlackedOut: blackedOut,
    rsnInfo,
    primaryOptions,
    alternativeOptions,
    mlbTvStatus: {
      available: !blackedOut,
      note: blackedOut
        ? `Blacked out in ${state} - use RSN instead`
        : `Available - stream all ${team} games`
    },
    bestValue,
    allValueOptions,
    categoryOptions: {
      bestOverall: categories.bestOverall,
      bestCoverage: categories.bestCoverage,
      bestBudget: categories.bestBudget
    }
  }
}

/**
 * Get teams that are blacked out in a given state
 */
export function getBlackedOutTeamsInState(state: string): string[] {
  const teams: string[] = []
  for (const [team, territories] of Object.entries(TEAM_TERRITORIES)) {
    if (territories.includes(state)) {
      teams.push(team)
    }
  }
  return teams
}
