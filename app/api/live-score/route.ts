import { NextRequest, NextResponse } from 'next/server'

const MLB_API = 'https://statsapi.mlb.com/api/v1.1/game'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const gameId = searchParams.get('gameId')

  if (!gameId) {
    return NextResponse.json(
      { error: 'Missing gameId parameter' },
      { status: 400 }
    )
  }

  try {
    // Fetch live game data from MLB API
    const response = await fetch(`${MLB_API}/${gameId}/feed/live`, {
      next: { revalidate: 30 } // Cache for 30 seconds
    })

    if (!response.ok) {
      return NextResponse.json({
        found: false,
        error: 'Game data not available'
      })
    }

    const data = await response.json()
    const gameData = data.gameData
    const liveData = data.liveData

    if (!gameData || !liveData) {
      return NextResponse.json({
        found: false,
        error: 'Invalid game data'
      })
    }

    const status = gameData.status?.abstractGameState // 'Preview', 'Live', 'Final'
    const detailedState = gameData.status?.detailedState // 'Scheduled', 'In Progress', 'Final', etc.

    // Get scores
    const linescore = liveData.linescore
    const homeScore = linescore?.teams?.home?.runs ?? 0
    const awayScore = linescore?.teams?.away?.runs ?? 0

    // Get inning info for live games
    const inning = linescore?.currentInning ?? 0
    const inningHalf = linescore?.inningHalf ?? '' // 'Top' or 'Bottom'
    const isTopInning = inningHalf === 'Top'

    // Get team info
    const homeTeam = gameData.teams?.home?.name
    const awayTeam = gameData.teams?.away?.name

    return NextResponse.json({
      found: true,
      gameId,
      status,
      detailedState,
      isLive: status === 'Live',
      isFinal: status === 'Final',
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      inning,
      isTopInning,
      inningState: inning > 0 ? `${isTopInning ? 'Top' : 'Bot'} ${inning}` : null
    })

  } catch (error) {
    console.error('MLB API error:', error)
    return NextResponse.json({
      found: false,
      error: 'Failed to fetch live score'
    })
  }
}
