import { NextRequest, NextResponse } from 'next/server'

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

export interface StandingsData {
  team: string
  wins: number
  losses: number
  winningPercentage: string
  gamesBack: string
  divisionRank: string
  leagueRank: string
  division: string
  streak: string
  lastTen: string
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const team = searchParams.get('team')
  const season = searchParams.get('season') || new Date().getFullYear().toString()

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
    // Fetch standings for both leagues
    const [alResponse, nlResponse] = await Promise.all([
      fetch(`${MLB_API}/standings?leagueId=103&season=${season}&standingsTypes=regularSeason`),
      fetch(`${MLB_API}/standings?leagueId=104&season=${season}&standingsTypes=regularSeason`)
    ])

    const alData = await alResponse.json()
    const nlData = await nlResponse.json()

    // Find the team in standings
    let teamStanding: StandingsData | null = null

    const searchInRecords = (records: any[]) => {
      for (const division of records) {
        for (const teamRecord of division.teamRecords) {
          if (teamRecord.team.id === teamId) {
            return {
              team: teamRecord.team.name,
              wins: teamRecord.wins,
              losses: teamRecord.losses,
              winningPercentage: teamRecord.winningPercentage,
              gamesBack: teamRecord.gamesBack === '-' ? '0' : teamRecord.gamesBack,
              divisionRank: teamRecord.divisionRank,
              leagueRank: teamRecord.leagueRank || 'N/A',
              division: division.division?.nameShort || division.division?.name || 'Unknown',
              streak: teamRecord.streak?.streakCode || '-',
              lastTen: `${teamRecord.records?.splitRecords?.find((r: any) => r.type === 'lastTen')?.wins || 0}-${teamRecord.records?.splitRecords?.find((r: any) => r.type === 'lastTen')?.losses || 0}`
            }
          }
        }
      }
      return null
    }

    teamStanding = searchInRecords(alData.records || []) || searchInRecords(nlData.records || [])

    if (!teamStanding) {
      // Season hasn't started - return default
      return NextResponse.json({
        found: false,
        team,
        wins: 0,
        losses: 0,
        winningPercentage: '.000',
        gamesBack: '0',
        divisionRank: 'T-1',
        division: 'Preseason',
        streak: '-',
        lastTen: '0-0',
        message: 'Season has not started yet'
      })
    }

    // If it's preseason (0-0 record), show T-1st since everyone is tied
    if (teamStanding.wins === 0 && teamStanding.losses === 0) {
      teamStanding.divisionRank = 'T-1'
      teamStanding.gamesBack = '0'
    }

    return NextResponse.json({
      found: true,
      ...teamStanding
    })

  } catch (error) {
    console.error('MLB API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch standings data' },
      { status: 500 }
    )
  }
}
