import { NextRequest, NextResponse } from 'next/server'
import { getEstimatedTicketPrice } from '@/data/broadcast-schedule'

const SEATGEEK_API = 'https://api.seatgeek.com/2/events'
const CLIENT_ID = process.env.SEATGEEK_CLIENT_ID

// Map team names to SeatGeek performer slugs
const TEAM_SLUGS: Record<string, string> = {
  'Arizona Diamondbacks': 'arizona-diamondbacks',
  'Atlanta Braves': 'atlanta-braves',
  'Baltimore Orioles': 'baltimore-orioles',
  'Boston Red Sox': 'boston-red-sox',
  'Chicago Cubs': 'chicago-cubs',
  'Chicago White Sox': 'chicago-white-sox',
  'Cincinnati Reds': 'cincinnati-reds',
  'Cleveland Guardians': 'cleveland-guardians',
  'Colorado Rockies': 'colorado-rockies',
  'Detroit Tigers': 'detroit-tigers',
  'Houston Astros': 'houston-astros',
  'Kansas City Royals': 'kansas-city-royals',
  'Los Angeles Angels': 'los-angeles-angels',
  'Los Angeles Dodgers': 'los-angeles-dodgers',
  'Miami Marlins': 'miami-marlins',
  'Milwaukee Brewers': 'milwaukee-brewers',
  'Minnesota Twins': 'minnesota-twins',
  'New York Mets': 'new-york-mets',
  'New York Yankees': 'new-york-yankees',
  'Oakland Athletics': 'oakland-athletics',
  'Philadelphia Phillies': 'philadelphia-phillies',
  'Pittsburgh Pirates': 'pittsburgh-pirates',
  'San Diego Padres': 'san-diego-padres',
  'San Francisco Giants': 'san-francisco-giants',
  'Seattle Mariners': 'seattle-mariners',
  'St. Louis Cardinals': 'st-louis-cardinals',
  'Tampa Bay Rays': 'tampa-bay-rays',
  'Texas Rangers': 'texas-rangers',
  'Toronto Blue Jays': 'toronto-blue-jays',
  'Washington Nationals': 'washington-nationals',
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

  if (!CLIENT_ID) {
    return NextResponse.json(
      { error: 'SeatGeek API key not configured' },
      { status: 500 }
    )
  }

  const homeSlug = TEAM_SLUGS[homeTeam]
  const awaySlug = TEAM_SLUGS[awayTeam]

  if (!homeSlug || !awaySlug) {
    return NextResponse.json(
      { error: 'Unknown team name' },
      { status: 400 }
    )
  }

  try {
    // Search for the event by either team and date (using local datetime)
    const dateStart = `${date}T00:00:00`
    const dateEnd = `${date}T23:59:59`

    // Try searching by away team first (for away games)
    let url = new URL(SEATGEEK_API)
    url.searchParams.set('client_id', CLIENT_ID)
    url.searchParams.set('performers.slug', awaySlug)
    url.searchParams.set('datetime_local.gte', dateStart)
    url.searchParams.set('datetime_local.lte', dateEnd)
    url.searchParams.set('type', 'mlb')

    let response = await fetch(url.toString())

    // Check response status BEFORE parsing JSON
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Unable to fetch ticket data' },
        { status: 502 }
      )
    }

    let data = await response.json()

    // If no results, try home team
    if (!data.events || data.events.length === 0) {
      url = new URL(SEATGEEK_API)
      url.searchParams.set('client_id', CLIENT_ID)
      url.searchParams.set('performers.slug', homeSlug)
      url.searchParams.set('datetime_local.gte', dateStart)
      url.searchParams.set('datetime_local.lte', dateEnd)
      url.searchParams.set('type', 'mlb')

      response = await fetch(url.toString())

      // Check response status BEFORE parsing JSON
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Unable to fetch ticket data' },
          { status: 502 }
        )
      }

      data = await response.json()
    }

    // Find the matching event (must include both teams)
    const event = data.events?.find((e: any) => {
      const performers = e.performers?.map((p: any) => p.slug) || []
      return performers.includes(homeSlug) && performers.includes(awaySlug)
    })

    if (!event) {
      // Even if no SeatGeek event, check for estimated price
      const estimatedPrice = getEstimatedTicketPrice(homeTeam, awayTeam, date)
      return NextResponse.json({
        found: false,
        message: 'No tickets found for this game',
        estimatedPrice
      })
    }

    // Use SeatGeek price if available, otherwise use estimated price
    const seatgeekPrice = event.stats?.lowest_price || null
    const estimatedPrice = getEstimatedTicketPrice(homeTeam, awayTeam, date)
    const lowestPrice = seatgeekPrice || estimatedPrice

    return NextResponse.json({
      found: true,
      eventId: event.id,
      title: event.title,
      url: event.url,
      lowestPrice,
      isEstimated: !seatgeekPrice && !!estimatedPrice,
      averagePrice: event.stats?.average_price || null,
      listingCount: event.stats?.listing_count || 0,
      venue: event.venue?.name,
      datetime: event.datetime_local
    })
  } catch (error) {
    console.error('SeatGeek API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket data' },
      { status: 500 }
    )
  }
}
