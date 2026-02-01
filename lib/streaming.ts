// lib/streaming.ts
// Business logic for blackout detection and streaming options

import { MLB_TEAMS, Team } from '@/data/teams'
import { TEAM_TERRITORIES } from '@/data/territories'
import { CHANNEL_STREAMING_MAP, NATIONAL_BROADCASTS } from '@/data/broadcasts'

export interface StreamingService {
  name: string
  price: string | null
  type: 'primary' | 'alternative' | 'national'
  note?: string
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
 * Get clean service name without price
 */
function getServiceName(serviceString: string): string {
  return serviceString.replace(/\s*\([^)]+\)\s*$/, '').trim()
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
    // User is in-market - recommend RSN options
    rsnInfo.streamingOptions.forEach(option => {
      primaryOptions.push({
        name: getServiceName(option),
        price: parsePrice(option),
        type: 'primary',
        note: 'In-market RSN'
      })
    })

    // Add live TV streaming services that carry RSNs
    const livetvServices = [
      { name: 'YouTube TV', price: '$73/mo', note: 'Includes most RSNs' },
      { name: 'Fubo', price: '$80/mo', note: 'Sports-focused, includes most RSNs' },
      { name: 'Hulu + Live TV', price: '$77/mo', note: 'Includes most RSNs' },
    ]

    livetvServices.forEach(svc => {
      if (!primaryOptions.some(p => p.name === svc.name)) {
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
