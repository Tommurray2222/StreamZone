'use client'

import { useEffect, useRef, useState } from 'react'
import { getStreamingOptions, StreamingResult, StreamingService } from '@/lib/streaming'
import { US_STATES } from '@/data/states'
import { CHANNEL_STREAMING_MAP } from '@/data/broadcasts'

interface Game {
  id: string
  date: string
  time: string
  opponent: string
  isHome: boolean
  venue: string
  broadcast: string[]
  isNational: boolean
  nationalNote?: string
}

interface StreamingModalProps {
  isOpen: boolean
  onClose: () => void
  team: string
  state: string
}

interface StandingsData {
  found: boolean
  team: string
  wins: number
  losses: number
  divisionRank: string
  division: string
  gamesBack: string
  streak?: string
}

export function StreamingModal({ isOpen, onClose, team, state }: StreamingModalProps) {
  const [streamingData, setStreamingData] = useState<StreamingResult | null>(null)
  const [schedule, setSchedule] = useState<Game[]>([])
  const [standings, setStandings] = useState<StandingsData | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)

  // Get state name from abbreviation
  const stateName = US_STATES.find(s => s.abbr === state)?.name || state

  useEffect(() => {
    if (isOpen && team && state) {
      const data = getStreamingOptions(team, state)
      setStreamingData(data)
      setIsAnimating(true)

      // Fetch live standings
      fetch(`/api/standings?team=${encodeURIComponent(team)}&season=2026`)
        .then(res => res.json())
        .then(data => setStandings(data))
        .catch(() => setStandings(null))

      // Fetch live schedule
      fetch(`/api/schedule?team=${encodeURIComponent(team)}&season=2026&limit=3`)
        .then(res => res.json())
        .then(data => setSchedule(data.games || []))
        .catch(() => setSchedule([]))

      // Small delay for animation
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    } else {
      setIsVisible(false)
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setStreamingData(null)
        setSchedule([])
        setStandings(null)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, team, state])

  // Handle swipe to dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY
    const diff = currentY.current - startY.current
    if (diff > 0 && modalRef.current) {
      modalRef.current.style.transform = `translateY(${diff}px)`
    }
  }

  const handleTouchEnd = () => {
    const diff = currentY.current - startY.current
    if (diff > 100) {
      onClose()
    } else if (modalRef.current) {
      modalRef.current.style.transform = ''
    }
    startY.current = 0
    currentY.current = 0
  }

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isAnimating) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-3xl
          bg-[var(--sz-navy)] border-t border-[var(--sz-navy-lighter)]
          transition-transform duration-300 ease-out
          ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle - swipe to dismiss only from here */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="sticky top-0 bg-[var(--sz-navy)] pt-3 pb-4 z-10 cursor-grab active:cursor-grabbing"
        >
          <div className="w-12 h-1 rounded-full bg-[var(--sz-gray-dark)] mx-auto" />
          <div className="text-[10px] text-center text-[var(--sz-gray-dark)] mt-1">Swipe down to close</div>
        </div>

        {streamingData && (
          <div className="px-5 pb-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl sm:text-4xl text-[var(--sz-white)]">
                    {team}
                  </h2>
                  <p className="text-sm text-[var(--sz-gray)] mt-1">
                    {standings ? (
                      <>
                        <span className="font-semibold text-[var(--sz-white)]">
                          {standings.wins}-{standings.losses}
                        </span>
                        <span className="mx-1.5">•</span>
                        <span>
                          {standings.divisionRank === '1' ? '1st' :
                           standings.divisionRank === '2' ? '2nd' :
                           standings.divisionRank === '3' ? '3rd' :
                           standings.divisionRank?.startsWith('T-') ? standings.divisionRank :
                           `${standings.divisionRank}th`} {streamingData.teamData.league} {streamingData.teamData.division}
                        </span>
                        {standings.gamesBack && standings.gamesBack !== '0' && standings.gamesBack !== '-' && (
                          <>
                            <span className="mx-1.5">•</span>
                            <span>{standings.gamesBack} GB</span>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-[var(--sz-white)]">{streamingData.teamData.record}</span>
                        <span className="mx-1.5">•</span>
                        <span>{streamingData.teamData.league} {streamingData.teamData.division}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Blackout Badge */}
                <div
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                    streamingData.isBlackedOut
                      ? 'bg-[var(--sz-red)]/20 text-[var(--sz-red)] border border-[var(--sz-red)]/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {streamingData.isBlackedOut ? 'In-Market' : 'Out-of-Market'}
                </div>
              </div>
            </div>

            {/* Upcoming Games Schedule */}
            {schedule.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold tracking-widest text-[var(--sz-gray)] uppercase mb-3">
                  Upcoming Games
                </h3>
                <div className="space-y-3">
                  {schedule.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      isBlackedOut={streamingData.isBlackedOut}
                      teamRSN={streamingData.rsnInfo.name}
                      homeTeam={team}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Blackout Explanation */}
            <div className="p-4 rounded-xl bg-[var(--sz-navy-light)]/50 border border-[var(--sz-navy-lighter)]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <svg className="w-5 h-5 text-[var(--sz-amber)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--sz-white)] mb-1">
                    {streamingData.isBlackedOut ? 'Why am I blacked out?' : 'About out-of-market viewing'}
                  </h4>
                  <p className="text-sm text-[var(--sz-gray)] leading-relaxed">
                    {streamingData.isBlackedOut
                      ? `You're in ${team}'s broadcast territory. MLB.TV blacks out local games to protect RSN rights. Watch on ${streamingData.rsnInfo.name} instead.`
                      : `You're outside ${team}'s territory, so MLB.TV has full streaming rights for all regular season games. National broadcasts (ESPN, FOX, etc.) may still be subject to blackouts.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full mt-6 h-12 rounded-lg font-semibold
                bg-[var(--sz-navy-lighter)] text-[var(--sz-white)]
                hover:bg-[var(--sz-gray-dark)] active:scale-[0.98]
                transition-all duration-200"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ServiceCard({ service, isPrimary = false }: { service: StreamingService; isPrimary?: boolean }) {
  return (
    <div
      className={`p-4 rounded-xl border transition-colors ${
        isPrimary
          ? 'bg-[var(--sz-navy-light)] border-[var(--sz-lime)]/30 hover:border-[var(--sz-lime)]/50'
          : 'bg-[var(--sz-navy-light)]/50 border-[var(--sz-navy-lighter)] hover:border-[var(--sz-gray-dark)]'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-[var(--sz-white)] truncate">{service.name}</h4>
            {isPrimary && (
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--sz-lime)]/20 text-[var(--sz-lime)]">
                Recommended
              </span>
            )}
          </div>
          {service.note && (
            <p className="text-sm text-[var(--sz-gray)] mt-0.5 truncate">{service.note}</p>
          )}
        </div>
        {service.price && (
          <div className="shrink-0 ml-4 text-right">
            <span className="text-sm font-semibold text-[var(--sz-amber)]">{service.price}</span>
          </div>
        )}
      </div>
    </div>
  )
}

interface TicketData {
  found: boolean
  url?: string
  lowestPrice?: number | null
  isEstimated?: boolean
  listingCount?: number
  estimatedPrice?: number | null
}

// Validate URL protocol to prevent javascript: or other malicious URLs
const isValidTicketUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return ['https:', 'http:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

function GameCard({ game, isBlackedOut, teamRSN, homeTeam }: { game: Game; isBlackedOut: boolean; teamRSN: string; homeTeam: string }) {
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
  const [ticketLoading, setTicketLoading] = useState(true)

  // Fetch real ticket data from SeatGeek
  useEffect(() => {
    async function fetchTickets() {
      try {
        // For home games: homeTeam is our team, awayTeam is opponent
        // For away games: homeTeam is opponent, awayTeam is our team
        const params = new URLSearchParams({
          homeTeam: game.isHome ? homeTeam : game.opponent,
          awayTeam: game.isHome ? game.opponent : homeTeam,
          date: game.date
        })
        const response = await fetch(`/api/tickets?${params}`)
        const data = await response.json()
        setTicketData(data)
      } catch (error) {
        console.error('Failed to fetch ticket data:', error)
        setTicketData({ found: false })
      } finally {
        setTicketLoading(false)
      }
    }

    fetchTickets()
  }, [game.date, game.opponent, game.isHome, homeTeam])

  // Format date for display
  const gameDate = new Date(game.date + 'T12:00:00')
  const dayName = gameDate.toLocaleDateString('en-US', { weekday: 'short' })
  const monthDay = gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  // Determine where to watch based on broadcast data and blackout status
  const getWatchInfo = () => {
    // Use actual broadcast data from the API
    const primaryBroadcast = game.broadcast[0] || 'TBD'

    if (game.isNational) {
      // National games - show the national network
      const nationalChannel = game.broadcast.find(b =>
        ['ESPN', 'ESPN2', 'FOX', 'FS1', 'TBS', 'NBC', 'Apple TV+', 'Peacock'].some(n => b.includes(n))
      )
      return {
        channel: nationalChannel || primaryBroadcast,
        note: game.nationalNote || 'National broadcast',
        available: true
      }
    }

    // If broadcast is TBD, show that
    if (primaryBroadcast === 'TBD') {
      return {
        channel: 'TBD',
        note: isBlackedOut ? `Check ${teamRSN} closer to game time` : 'Broadcast not yet announced',
        available: true
      }
    }

    if (isBlackedOut) {
      // In-market - show actual broadcast (RSN)
      return {
        channel: primaryBroadcast,
        note: 'Local broadcast',
        available: true
      }
    } else {
      // Out-of-market - MLB.TV available
      return {
        channel: 'MLB.TV',
        note: `Also on ${primaryBroadcast}`,
        available: true
      }
    }
  }

  // Get streaming services for a channel
  const getStreamingServices = (channel: string): string[] => {
    // Direct match
    if (CHANNEL_STREAMING_MAP[channel]) {
      return CHANNEL_STREAMING_MAP[channel]
    }
    // Try partial matches
    for (const [key, services] of Object.entries(CHANNEL_STREAMING_MAP)) {
      if (channel.includes(key) || key.includes(channel)) {
        return services
      }
    }
    return []
  }

  const watchInfo = getWatchInfo()
  const streamingServices = getStreamingServices(watchInfo.channel)

  return (
    <div className="p-4 rounded-xl bg-[var(--sz-navy-light)] border border-[var(--sz-navy-lighter)]">
      {/* Date and Time Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-xs font-semibold text-[var(--sz-lime)] uppercase">{dayName}</div>
            <div className="text-sm font-medium text-[var(--sz-white)]">{monthDay}</div>
          </div>
          <div className="w-px h-8 bg-[var(--sz-navy-lighter)]" />
          <div className="text-sm text-[var(--sz-gray)]">{game.time}</div>
        </div>

        {/* National badge */}
        {game.isNational && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--sz-amber)]/20 text-[var(--sz-amber)]">
            National
          </span>
        )}
      </div>

      {/* Matchup Row with Venue */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--sz-gray)] uppercase">
            {game.isHome ? 'vs' : '@'}
          </span>
          <span className="font-semibold text-[var(--sz-white)]">{game.opponent}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--sz-gray)]">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{game.venue}</span>
        </div>
      </div>

      {/* Where to Watch */}
      <div className="pt-3 border-t border-[var(--sz-navy-lighter)]">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-[var(--sz-lime)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-semibold text-[var(--sz-white)]">{watchInfo.channel}</span>
          <span className="text-xs text-[var(--sz-gray)]">• {watchInfo.note}</span>
        </div>

        {/* Streaming Services */}
        {streamingServices.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-[var(--sz-gray)] mb-1.5">Available on:</div>
            <div className="flex flex-wrap gap-1.5">
              {streamingServices.map((service, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded-md text-xs font-medium bg-[var(--sz-navy-lighter)] text-[var(--sz-white)]"
                >
                  {service.replace(/\s*\([^)]*\)/g, '')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Buy Tickets */}
      <div className="mt-3">
          {ticketLoading ? (
            <div className="flex items-center justify-center p-3 rounded-lg bg-[var(--sz-navy-lighter)] border border-[var(--sz-navy-lighter)]">
              <div className="flex items-center gap-2 text-sm text-[var(--sz-gray)]">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Loading tickets...</span>
              </div>
            </div>
          ) : ticketData?.found && ticketData.url && isValidTicketUrl(ticketData.url) ? (
            <a
              href={ticketData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg
                bg-[var(--sz-lime)]/10 border border-[var(--sz-lime)]/30
                hover:bg-[var(--sz-lime)]/20 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--sz-lime)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <span className="text-sm font-semibold text-[var(--sz-lime)]">Buy Tickets</span>
              </div>
              <div className="flex items-center gap-1.5">
                {ticketData.lowestPrice ? (
                  <span className="text-sm text-[var(--sz-white)]">
                    {ticketData.isEstimated ? 'Est. ' : ''}from <span className="font-bold">${ticketData.lowestPrice}</span>
                  </span>
                ) : (
                  <span className="text-xs text-[var(--sz-gray)]">View tickets</span>
                )}
                <svg className="w-4 h-4 text-[var(--sz-gray)] group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>
          ) : ticketData?.estimatedPrice ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--sz-navy-lighter)] border border-[var(--sz-navy-lighter)]">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--sz-gray)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <span className="text-sm text-[var(--sz-gray)]">Tickets</span>
              </div>
              <span className="text-sm text-[var(--sz-white)]">
                Est. from <span className="font-bold">${ticketData.estimatedPrice}</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center p-3 rounded-lg bg-[var(--sz-navy-lighter)]/50 border border-[var(--sz-navy-lighter)]">
              <span className="text-xs text-[var(--sz-gray)]">Tickets not yet available</span>
            </div>
          )}
        </div>
    </div>
  )
}
