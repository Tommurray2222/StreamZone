'use client'

import { useEffect, useRef, useState } from 'react'
import { getStreamingOptions } from '@/lib/streaming'
import { CHANNEL_STREAMING_MAP } from '@/data/broadcasts'
import {
  requestNotificationPermission,
  scheduleGameReminder,
  cancelGameReminder,
  hasGameReminder,
  GameReminder
} from '@/lib/notifications'

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
  status?: string
}

interface CombinedGame extends Game {
  team: string
  state: string
}

interface MyGamesModalProps {
  isOpen: boolean
  onClose: () => void
  favorites: Array<{ sport: string; team: string; state: string }>
}

interface TicketData {
  found: boolean
  url?: string
}

interface LiveScoreData {
  found: boolean
  isLive: boolean
  isFinal: boolean
  homeScore: number
  awayScore: number
  inningState?: string | null
}

export function MyGamesModal({ isOpen, onClose, favorites }: MyGamesModalProps) {
  const [games, setGames] = useState<CombinedGame[]>([])
  const [loading, setLoading] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [displayedGames, setDisplayedGames] = useState(10)
  const modalRef = useRef<HTMLDivElement>(null)
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)

  useEffect(() => {
    if (isOpen && favorites.length > 0) {
      setIsAnimating(true)
      setLoading(true)

      // Fetch schedules for all favorite teams
      const fetchAllSchedules = async () => {
        try {
          const allGames: CombinedGame[] = []

          await Promise.all(
            favorites.map(async (fav) => {
              const response = await fetch(
                `/api/schedule?team=${encodeURIComponent(fav.team)}&season=2026&limit=20`
              )
              const data = await response.json()
              const teamGames = (data.games || [])
                .filter((game: Game) => game.status !== 'Final' && game.status !== 'Game Over')
                .map((game: Game) => ({
                  ...game,
                  team: fav.team,
                  state: fav.state
                }))
              allGames.push(...teamGames)
            })
          )

          // Sort by date and time
          allGames.sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date)
            if (dateCompare !== 0) return dateCompare
            return a.time.localeCompare(b.time)
          })

          setGames(allGames)
        } catch (error) {
          console.error('Failed to fetch schedules:', error)
          setGames([])
        } finally {
          setLoading(false)
        }
      }

      fetchAllSchedules()

      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    } else {
      setIsVisible(false)
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setGames([])
        setDisplayedGames(10)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, favorites])

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

  // Group games by date for display
  const gamesByDate = games.slice(0, displayedGames).reduce((acc, game) => {
    if (!acc[game.date]) {
      acc[game.date] = []
    }
    acc[game.date].push(game)
    return acc
  }, {} as Record<string, CombinedGame[]>)

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
        {/* Drag handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="sticky top-0 bg-[var(--sz-navy)] pt-3 pb-4 z-10 cursor-grab active:cursor-grabbing"
        >
          <div className="w-12 h-1 rounded-full bg-[var(--sz-gray-dark)] mx-auto" />
          <div className="text-[10px] text-center text-[var(--sz-gray-dark)] mt-1">Swipe down to close</div>
        </div>

        <div className="px-5 pb-8">
          {/* Header */}
          <div className="mb-6">
            <h2 className="font-display text-3xl sm:text-4xl text-[var(--sz-white)]">
              My Games
            </h2>
            <p className="text-sm text-[var(--sz-gray)] mt-1">
              Upcoming games for {favorites.length} favorite team{favorites.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[var(--sz-lime)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-12 text-[var(--sz-gray)]">
              No upcoming games found
            </div>
          ) : (
            <>
              {/* Games grouped by date */}
              <div className="space-y-6">
                {Object.entries(gamesByDate).map(([date, dateGames]) => {
                  const gameDate = new Date(date + 'T12:00:00')
                  const dayName = gameDate.toLocaleDateString('en-US', { weekday: 'long' })
                  const formattedDate = gameDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

                  return (
                    <div key={date}>
                      {/* Date Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-xs font-semibold tracking-widest text-[var(--sz-lime)] uppercase">
                          {dayName}
                        </div>
                        <div className="flex-1 h-px bg-[var(--sz-navy-lighter)]" />
                        <div className="text-xs font-semibold text-[var(--sz-gray)]">
                          {formattedDate}
                        </div>
                      </div>

                      {/* Games for this date */}
                      <div className="space-y-3">
                        {dateGames.map((game) => (
                          <CombinedGameCard key={game.id} game={game} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* See More Button */}
              {games.length > displayedGames && (
                <button
                  onClick={() => setDisplayedGames(prev => prev + 10)}
                  className="w-full mt-6 flex items-center gap-3 group"
                >
                  <div className="flex-1 h-px bg-[var(--sz-navy-lighter)] group-hover:bg-[var(--sz-gray-dark)] transition-colors" />
                  <span className="text-xs font-semibold tracking-widest text-[var(--sz-gray)] uppercase group-hover:text-[var(--sz-white)] transition-colors">
                    See More
                  </span>
                  <div className="flex-1 h-px bg-[var(--sz-navy-lighter)] group-hover:bg-[var(--sz-gray-dark)] transition-colors" />
                </button>
              )}
            </>
          )}

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
      </div>
    </div>
  )
}

// Validate URL protocol
const isValidTicketUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return ['https:', 'http:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

function CombinedGameCard({ game }: { game: CombinedGame }) {
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
  const [ticketLoading, setTicketLoading] = useState(true)
  const [hasReminder, setHasReminder] = useState(false)
  const [reminderLoading, setReminderLoading] = useState(false)
  const [liveScore, setLiveScore] = useState<LiveScoreData | null>(null)

  // Check if game is live or in progress
  const isGameLive = game.status === 'In Progress' || game.status === 'Live'
  const isGameFinal = game.status === 'Final' || game.status === 'Game Over'

  // Check if reminder is set on mount
  useEffect(() => {
    setHasReminder(hasGameReminder(game.id))
  }, [game.id])

  // Fetch live score when game is in progress
  useEffect(() => {
    if (!isGameLive && !isGameFinal) {
      setLiveScore(null)
      return
    }

    async function fetchLiveScore() {
      try {
        const response = await fetch(`/api/live-score?gameId=${game.id}`)
        const data = await response.json()
        setLiveScore(data)
      } catch {
        setLiveScore(null)
      }
    }

    fetchLiveScore()

    if (isGameLive) {
      const interval = setInterval(fetchLiveScore, 30000)
      return () => clearInterval(interval)
    }
  }, [game.id, isGameLive, isGameFinal])

  // Fetch ticket data (only for non-live games)
  useEffect(() => {
    if (isGameLive || isGameFinal) {
      setTicketLoading(false)
      return
    }

    async function fetchTickets() {
      try {
        const params = new URLSearchParams({
          homeTeam: game.isHome ? game.team : game.opponent,
          awayTeam: game.isHome ? game.opponent : game.team,
          date: game.date
        })
        const response = await fetch(`/api/tickets?${params}`)
        const data = await response.json()
        setTicketData(data)
      } catch {
        setTicketData({ found: false })
      } finally {
        setTicketLoading(false)
      }
    }
    fetchTickets()
  }, [game.date, game.opponent, game.isHome, game.team, isGameLive, isGameFinal])

  // Get streaming data for this team
  const streamingData = getStreamingOptions(game.team, game.state)
  const isBlackedOut = streamingData?.isBlackedOut ?? false
  const teamRSN = streamingData?.rsnInfo?.name ?? ''

  // Determine watch info
  const getWatchInfo = () => {
    const primaryBroadcast = game.broadcast[0] || 'TBD'

    if (game.isNational) {
      const nationalChannel = game.broadcast.find(b =>
        ['ESPN', 'ESPN2', 'FOX', 'FS1', 'TBS', 'NBC', 'Apple TV+', 'Peacock'].some(n => b.includes(n))
      )
      return { channel: nationalChannel || primaryBroadcast }
    }

    if (primaryBroadcast === 'TBD') {
      return { channel: 'TBD' }
    }

    if (isBlackedOut) {
      return { channel: primaryBroadcast }
    } else {
      return { channel: 'MLB.TV' }
    }
  }

  // Get streaming services
  const getStreamingServices = (channel: string): string[] => {
    if (CHANNEL_STREAMING_MAP[channel]) {
      return CHANNEL_STREAMING_MAP[channel]
    }
    for (const [key, services] of Object.entries(CHANNEL_STREAMING_MAP)) {
      if (channel.includes(key) || key.includes(channel)) {
        return services
      }
    }
    return []
  }

  // Toggle reminder
  const toggleReminder = async () => {
    setReminderLoading(true)
    try {
      if (hasReminder) {
        await cancelGameReminder(game.id)
        setHasReminder(false)
      } else {
        const granted = await requestNotificationPermission()
        if (!granted) {
          alert('Please enable notifications to set game reminders')
          return
        }

        const watchInfo = getWatchInfo()
        const reminder: GameReminder = {
          gameId: game.id,
          team: game.team,
          opponent: game.opponent,
          gameDate: game.date,
          gameTime: game.time,
          channel: watchInfo.channel,
          isHome: game.isHome
        }

        const success = await scheduleGameReminder(reminder, 30)
        if (success) {
          setHasReminder(true)
        }
      }
    } catch (error) {
      console.error('Error toggling reminder:', error)
    } finally {
      setReminderLoading(false)
    }
  }

  const watchInfo = getWatchInfo()
  const streamingServices = getStreamingServices(watchInfo.channel)

  return (
    <div className="p-3 rounded-lg bg-[var(--sz-navy-light)] border border-[var(--sz-navy-lighter)]">
      <div className="flex gap-3">
        {/* Left: Game Info */}
        <div className="flex-1 min-w-0">
          <div className="flex gap-3">
            {/* Time & Channel Column */}
            <div className="text-center shrink-0 w-14">
              <div className="text-xs font-bold text-[var(--sz-white)]">{game.time.replace(' ET', '')}</div>
              <div className="mt-2 pt-2 border-t border-[var(--sz-navy-lighter)]">
                <div className="text-[10px] font-bold text-[var(--sz-lime)]">{watchInfo.channel}</div>
              </div>
            </div>

            {/* Vertical divider */}
            <div className="w-px bg-[var(--sz-navy-lighter)] shrink-0" />

            {/* Matchup Column */}
            <div className="flex-1 min-w-0">
              {/* Team name badge */}
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--sz-navy-lighter)] mb-1">
                <span className="text-[10px] font-bold text-[var(--sz-lime)]">{game.team.split(' ').pop()}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-[var(--sz-gray)] uppercase">
                  {game.isHome ? 'vs' : '@'}
                </span>
                <span className="text-sm font-bold text-[var(--sz-white)] truncate">{game.opponent}</span>
                <span className={`text-[10px] font-bold mt-[3px] ${game.isHome ? 'text-[var(--sz-amber)]' : 'text-[var(--sz-red)]'}`}>
                  {game.isHome ? 'H' : 'A'}
                </span>
              </div>

              {/* Reminder button */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={toggleReminder}
                  disabled={reminderLoading}
                  className={`p-1 rounded-full transition-all ${
                    hasReminder
                      ? 'text-[var(--sz-amber)] bg-[var(--sz-amber)]/10'
                      : 'text-[var(--sz-gray)] hover:text-[var(--sz-white)] hover:bg-[var(--sz-navy-lighter)]'
                  } ${reminderLoading ? 'opacity-50' : ''}`}
                  title={hasReminder ? 'Cancel reminder' : 'Set reminder (30 min before)'}
                >
                  {reminderLoading ? (
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : hasReminder ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  )}
                </button>

                {/* Streaming services */}
                {streamingServices.length > 0 && (
                  <div className="flex items-center gap-1">
                    {streamingServices.slice(0, 2).map((service, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-[var(--sz-navy-lighter)] text-[9px] font-medium text-[var(--sz-white)] whitespace-nowrap"
                      >
                        {service.replace(/\s*\([^)]*\)/g, '')}
                      </span>
                    ))}
                    {streamingServices.length > 2 && (
                      <span className="text-[9px] text-[var(--sz-gray)]">+{streamingServices.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Tickets or Live Score */}
        <div className="shrink-0 pl-3 border-l border-[var(--sz-navy-lighter)] flex items-center">
          {(isGameLive || isGameFinal) && liveScore?.found ? (
            // Live Score Display
            <div className="flex flex-col items-center text-center min-w-[40px]">
              <div className="flex items-center gap-1">
                <span className="text-[8px] font-bold text-[var(--sz-gray)] uppercase">A</span>
                <span className={`text-sm font-bold ${isGameLive ? 'text-[var(--sz-white)]' : 'text-[var(--sz-gray)]'}`}>
                  {game.isHome ? liveScore.awayScore : liveScore.homeScore}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[8px] font-bold text-[var(--sz-gray)] uppercase">H</span>
                <span className={`text-sm font-bold ${isGameLive ? 'text-[var(--sz-white)]' : 'text-[var(--sz-gray)]'}`}>
                  {game.isHome ? liveScore.homeScore : liveScore.awayScore}
                </span>
              </div>
              {isGameLive && liveScore.inningState && (
                <div className="text-[8px] font-bold text-[var(--sz-lime)] uppercase mt-0.5">
                  {liveScore.inningState}
                </div>
              )}
              {isGameFinal && (
                <div className="text-[8px] font-bold text-[var(--sz-gray)] uppercase mt-0.5">
                  Final
                </div>
              )}
            </div>
          ) : ticketLoading ? (
            <div className="w-3 h-3 animate-spin text-[var(--sz-gray)]">
              <svg fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : ticketData?.found && ticketData.url && isValidTicketUrl(ticketData.url) ? (
            <a
              href={ticketData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center text-center hover:opacity-80 transition-opacity"
            >
              <div className="text-[8px] font-bold text-[var(--sz-lime)] uppercase leading-tight">Buy</div>
              <div className="text-[8px] font-bold text-[var(--sz-lime)] uppercase leading-tight">Tickets</div>
            </a>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="text-[8px] font-bold text-[var(--sz-gray)] uppercase leading-tight">Buy</div>
              <div className="text-[8px] font-bold text-[var(--sz-gray)] uppercase leading-tight">Tickets</div>
              <div className="mt-1 text-[8px] text-[var(--sz-gray)]">N/A</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
