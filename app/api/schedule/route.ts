import { NextRequest, NextResponse } from 'next/server'
import { getBroadcastOverride } from '@/data/broadcast-schedule'
import { MLB_TEAMS } from '@/data/teams'

const MLB_API = 'https://statsapi.mlb.com/api/v1'

// MLB team IDs
const TEAM_IDS: Record<string, number> = {
  'Arizona Diamondbacks': 109,
  'Atlanta Braves': 144,
  'Baltimore Orioles': 110,
  'Boston Red Sox': 111,
  'Chicago Cubs': 112,
  'Chicago White Sox': 145,
  'Cincinnati Reds': 113,
  'Cleveland Guardians': 114,
  'Colorado Rockies': 115,
  'Detroit Tigers': 116,
  'Houston Astros': 117,
  'Kansas City Royals': 118,
  'Los Angeles Angels': 108,
  'Los Angeles Dodgers': 119,
  'Miami Marlins': 146,
  'Milwaukee Brewers': 158,
  'Minnesota Twins': 142,
  'New York Mets': 121,
  'New York Yankees': 147,
  'Oakland Athletics': 133,
  'Philadelphia Phillies': 143,
  'Pittsburgh Pirates': 134,
  'San Diego Padres': 135,
  'San Francisco Giants': 137,
  'Seattle Mariners': 136,
  'St. Louis Cardinals': 138,
  'Tampa Bay Rays': 139,
  'Texas Rangers': 140,
  'Toronto Blue Jays': 141,
  'Washington Nationals': 120,
}

// Reverse lookup: ID to team name
const TEAM_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(TEAM_IDS).map(([name, id]) => [id, name])
)

export interface ScheduleGame {
  id: string
  date: string
  time: string
  opponent: string
  isHome: boolean
  venue: string
  broadcast: string[]
  isNational: boolean
  nationalNote?: string
  status: string
  score?: {
    home: number
    away: number
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const team = searchParams.get('team')
  const season = searchParams.get('season') || '2026'
  // Cap limit parameter to 1-200 range (increased for full season support)
  const limitParam = parseInt(searchParams.get('limit') || '10')
  const limit = Math.min(Math.max(isNaN(limitParam) ? 10 : limitParam, 1), 200)
  // Offset parameter for pagination
  const offsetStr = searchParams.get('offset')
  const offset = offsetStr ? Math.max(0, parseInt(offsetStr, 10)) || 0 : 0

  if (!team) {
    return NextResponse.json(
      { error: 'Missing required parameter: team' },
      { status: 400 }
    )
  }

  // Validate season format (4-digit year)
  if (!/^\d{4}$/.test(season)) {
    return NextResponse.json(
      { error: 'Invalid season format. Expected 4-digit year' },
      { status: 400 }
    )
  }

  const teamId = TEAM_IDS[team]
  if (!teamId) {
    return NextResponse.json(
      { error: 'Unknown team name' },
      { status: 400 }
    )
  }

  try {
    // Get today's date for filtering upcoming games
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // End date: 6 months from today (covers full remaining season)
    const endDate = new Date(today)
    endDate.setMonth(endDate.getMonth() + 6)
    const endDateStr = endDate.toISOString().split('T')[0]

    // First, try to fetch from today onwards
    let response = await fetch(
      `${MLB_API}/schedule?sportId=1&teamId=${teamId}&season=${season}&gameType=R&startDate=${todayStr}&endDate=${endDateStr}&hydrate=broadcasts(all),venue`
    )

    if (!response.ok) {
      throw new Error(`MLB API returned ${response.status}`)
    }

    let data = await response.json()

    // If no games found (preseason), fetch from season start instead
    if (!data.dates || data.dates.length === 0) {
      response = await fetch(
        `${MLB_API}/schedule?sportId=1&teamId=${teamId}&season=${season}&gameType=R&hydrate=broadcasts(all),venue`
      )

      if (!response.ok) {
        throw new Error(`MLB API returned ${response.status}`)
      }

      data = await response.json()
    }

    const games: ScheduleGame[] = []

    // Process each date
    for (const dateEntry of data.dates || []) {
      for (const game of dateEntry.games || []) {
        const homeTeam = game.teams?.home?.team
        const awayTeam = game.teams?.away?.team
        const isHome = homeTeam?.id === teamId
        const opponent = isHome ? awayTeam?.name : homeTeam?.name

        // Parse game time
        const gameDate = new Date(game.gameDate)
        const timeET = gameDate.toLocaleString('en-US', {
          timeZone: 'America/New_York',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }) + ' ET'

        // Get broadcasts - first check for manual override, then API data
        let broadcasts: string[] = []
        let isNational = false
        let nationalNote = ''

        // Check for broadcast override (for games where we have manual data)
        const broadcastOverride = getBroadcastOverride(
          homeTeam?.name || '',
          awayTeam?.name || '',
          dateEntry.date
        )

        if (broadcastOverride) {
          broadcasts = broadcastOverride.broadcasts
          isNational = broadcastOverride.isNational
          nationalNote = broadcastOverride.nationalNote || ''
        } else if (game.broadcasts) {
          // Use API broadcast data
          for (const broadcast of game.broadcasts) {
            if (broadcast.name) {
              broadcasts.push(broadcast.name)
              // Check if it's a national broadcast
              const nationalNetworks = ['ESPN', 'ESPN2', 'FOX', 'FS1', 'TBS', 'NBC', 'ABC', 'Apple TV+', 'Peacock', 'Netflix']
              if (nationalNetworks.some(n => broadcast.name.includes(n))) {
                isNational = true
                if (broadcast.name.includes('ESPN')) nationalNote = 'ESPN National Broadcast'
                else if (broadcast.name.includes('FOX') || broadcast.name.includes('FS1')) nationalNote = 'FOX National Broadcast'
                else if (broadcast.name.includes('Apple')) nationalNote = 'Apple TV+ Exclusive'
                else if (broadcast.name.includes('Peacock')) nationalNote = 'Peacock Exclusive'
                else if (broadcast.name.includes('Netflix')) nationalNote = 'Netflix Exclusive'
              }
            }
          }
        }

        // Default broadcasts if none specified - use team's RSN as fallback
        if (broadcasts.length === 0) {
          // For home games, use home team's RSN; for away games, use away team's RSN
          const relevantTeam = isHome ? homeTeam?.name : awayTeam?.name
          const teamData = relevantTeam ? MLB_TEAMS[relevantTeam] : null
          if (teamData?.rsn) {
            broadcasts.push(teamData.rsn)
          } else {
            broadcasts.push('TBD')
          }
        }

        // Get score if game is final or in progress
        let score
        if (game.status?.statusCode === 'F' || game.status?.abstractGameState === 'Live') {
          score = {
            home: game.teams?.home?.score || 0,
            away: game.teams?.away?.score || 0
          }
        }

        games.push({
          id: `mlb-${game.gamePk}`,
          date: dateEntry.date,
          time: timeET,
          opponent: opponent || 'TBD',
          isHome,
          venue: game.venue?.name || 'TBD',
          broadcast: broadcasts,
          isNational,
          nationalNote: nationalNote || undefined,
          status: game.status?.detailedState || 'Scheduled',
          score
        })

        // Stop if we've collected enough games (offset + limit)
        if (games.length >= offset + limit) {
          break
        }
      }
      if (games.length >= offset + limit) {
        break
      }
    }

    // Apply offset and limit for pagination
    const paginatedGames = games.slice(offset, offset + limit)

    return NextResponse.json({
      team,
      season,
      games: paginatedGames,
      total: games.length,
      offset,
      limit
    })

  } catch (error) {
    console.error('MLB Schedule API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule data' },
      { status: 500 }
    )
  }
}
