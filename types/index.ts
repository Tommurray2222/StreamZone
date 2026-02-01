// MLB Team types
export interface Team {
  id: string
  name: string
  abbreviation: string
  league: 'AL' | 'NL'
  division: 'East' | 'Central' | 'West'
  primaryColor: string
  secondaryColor: string
}

// Blackout region types
export interface BlackoutRegion {
  teamId: string
  states: string[]
  zipCodes?: string[]
}

// Streaming service types
export interface StreamingService {
  id: string
  name: string
  logo?: string
  url: string
}

// Game schedule types
export interface Game {
  id: string
  homeTeamId: string
  awayTeamId: string
  dateTime: string
  venue: string
  streamingServices: StreamingServiceAvailability[]
}

export interface StreamingServiceAvailability {
  serviceId: string
  isNational: boolean
  blackoutRegions?: string[]
}

// User selection types
export interface UserSelection {
  teamId: string | null
  state: string | null
}

// US State type
export interface USState {
  code: string
  name: string
}
