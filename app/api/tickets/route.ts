import { NextRequest, NextResponse } from 'next/server'

const TICKETMASTER_API = 'https://app.ticketmaster.com/discovery/v2/events.json'
const TICKETMASTER_KEY = process.env.TICKETMASTER_API_KEY

// Map team names to Ticketmaster keywords
const TEAM_KEYWORDS: Record<string, string> = {
  'Arizona Diamondbacks': 'Diamondbacks',
  'Atlanta Braves': 'Braves',
  'Baltimore Orioles': 'Orioles',
  'Boston Red Sox': 'Red Sox',
  'Chicago Cubs': 'Cubs',
  'Chicago White Sox': 'White Sox',
  'Cincinnati Reds': 'Reds',
  'Cleveland Guardians': 'Guardians',
  'Colorado Rockies': 'Rockies',
  'Detroit Tigers': 'Tigers',
  'Houston Astros': 'Astros',
  'Kansas City Royals': 'Royals',
  'Los Angeles Angels': 'Angels',
  'Los Angeles Dodgers': 'Dodgers',
  'Miami Marlins': 'Marlins',
  'Milwaukee Brewers': 'Brewers',
  'Minnesota Twins': 'Twins',
  'New York Mets': 'Mets',
  'New York Yankees': 'Yankees',
  'Oakland Athletics': 'Athletics',
  'Athletics': 'Athletics',
  'Sacramento Athletics': 'Athletics',
  'Philadelphia Phillies': 'Phillies',
  'Pittsburgh Pirates': 'Pirates',
  'San Diego Padres': 'Padres',
  'San Francisco Giants': 'Giants',
  'Seattle Mariners': 'Mariners',
  'St. Louis Cardinals': 'Cardinals',
  'Tampa Bay Rays': 'Rays',
  'Texas Rangers': 'Rangers',
  'Toronto Blue Jays': 'Blue Jays',
  'Washington Nationals': 'Nationals',
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const homeTeam = searchParams.get('homeTeam')
  const awayTeam = searchParams.get('awayTeam')
  const date = searchParams.get('date') // Format: YYYY-MM-DD

  if (!homeTeam || !awayTeam || !date) {
    return NextResponse.json(
      { error: 'Missing required parameters: homeTeam, awayTeam, date' },
      { status: 400 }
    )
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'Invalid date format. Expected YYYY-MM-DD' },
      { status: 400 }
    )
  }

  if (!TICKETMASTER_KEY) {
    return NextResponse.json(
      { error: 'Ticketmaster API key not configured' },
      { status: 500 }
    )
  }

  const homeKeyword = TEAM_KEYWORDS[homeTeam]
  const awayKeyword = TEAM_KEYWORDS[awayTeam]

  if (!homeKeyword || !awayKeyword) {
    return NextResponse.json(
      { error: 'Unknown team name' },
      { status: 400 }
    )
  }

  try {
    // Search for MLB events on this date with the home team
    // Extend search window by 1 day to handle timezone differences (UTC vs local)
    const searchDate = new Date(date)
    const nextDate = new Date(searchDate)
    nextDate.setDate(nextDate.getDate() + 1)
    const nextDateStr = nextDate.toISOString().split('T')[0]

    const url = new URL(TICKETMASTER_API)
    url.searchParams.set('apikey', TICKETMASTER_KEY)
    url.searchParams.set('keyword', homeKeyword)
    url.searchParams.set('classificationName', 'Baseball')
    url.searchParams.set('startDateTime', `${date}T00:00:00Z`)
    url.searchParams.set('endDateTime', `${nextDateStr}T12:00:00Z`)
    url.searchParams.set('size', '20')

    const response = await fetch(url.toString())

    if (!response.ok) {
      console.error('Ticketmaster API error:', response.status)
      return NextResponse.json({
        found: false,
        message: 'Unable to fetch ticket data'
      })
    }

    let data = await response.json()
    let events = data._embedded?.events || []

    // Find the matching event - must include BOTH teams in the title
    let event = events.find((e: any) => {
      const name = e.name?.toLowerCase() || ''
      const awayKeywordLower = awayKeyword.toLowerCase()
      const homeKeywordLower = homeKeyword.toLowerCase()

      // Require both teams to be in the event name (e.g., "Yankees at Giants")
      return name.includes(homeKeywordLower) && name.includes(awayKeywordLower)
    })

    // If no match found, try searching with away team keyword
    if (!event) {
      const fallbackUrl = new URL(TICKETMASTER_API)
      fallbackUrl.searchParams.set('apikey', TICKETMASTER_KEY)
      fallbackUrl.searchParams.set('keyword', awayKeyword)
      fallbackUrl.searchParams.set('classificationName', 'Baseball')
      fallbackUrl.searchParams.set('startDateTime', `${date}T00:00:00Z`)
      fallbackUrl.searchParams.set('endDateTime', `${nextDateStr}T12:00:00Z`)
      fallbackUrl.searchParams.set('size', '20')

      const fallbackResponse = await fetch(fallbackUrl.toString())
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json()
        const fallbackEvents = fallbackData._embedded?.events || []

        event = fallbackEvents.find((e: any) => {
          const name = e.name?.toLowerCase() || ''
          return name.includes(homeKeyword.toLowerCase()) && name.includes(awayKeyword.toLowerCase())
        })
      }
    }

    if (!event) {
      return NextResponse.json({
        found: false,
        message: 'No tickets found for this game'
      })
    }

    // Get ticket URL
    const ticketUrl = event.url || null

    return NextResponse.json({
      found: true,
      eventId: event.id,
      title: event.name,
      url: ticketUrl,
      venue: event._embedded?.venues?.[0]?.name,
      datetime: event.dates?.start?.localDate
    })

  } catch (error) {
    console.error('Ticketmaster API error:', error)
    return NextResponse.json({
      found: false,
      error: 'Failed to fetch ticket data'
    })
  }
}
