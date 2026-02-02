'use client'

import { useEffect, useRef, useState } from 'react'
import { getStreamingOptions, StreamingResult, StreamingService, BestValueOption } from '@/lib/streaming'
import { US_STATES } from '@/data/states'
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
  const [selectedValueOption, setSelectedValueOption] = useState<BestValueOption | null>(null)
  const [showOtherOptions, setShowOtherOptions] = useState(false)
  const [displayedGames, setDisplayedGames] = useState(5)
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

      // Fetch live schedule (get 100 games, filter to 50 upcoming)
      fetch(`/api/schedule?team=${encodeURIComponent(team)}&season=2026&limit=100`)
        .then(res => res.json())
        .then(data => {
          const allGames = data.games || []
          // Filter out completed games and take first 50 upcoming
          const upcomingGames = allGames
            .filter((game: Game) => game.status !== 'Final' && game.status !== 'Game Over')
            .slice(0, 50)
          setSchedule(upcomingGames)
        })
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
        setDisplayedGames(5)
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

            {/* Service Detail Popup */}
            {selectedValueOption && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setSelectedValueOption(null)}
                />
                <div className="relative bg-[var(--sz-navy)] border border-[var(--sz-navy-lighter)] rounded-2xl p-5 max-w-sm w-full shadow-xl">
                  <button
                    onClick={() => setSelectedValueOption(null)}
                    className="absolute top-3 right-3 p-1 text-[var(--sz-gray)] hover:text-[var(--sz-white)]"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-xl font-bold text-[var(--sz-white)]">
                      {selectedValueOption.service.name}
                    </h4>
                    {streamingData.allValueOptions[0]?.service.name === selectedValueOption.service.name && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--sz-lime)]/20 text-[var(--sz-lime)]">
                        Best Value
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-[var(--sz-gray)] mb-4">
                    {selectedValueOption.reasoning}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-[var(--sz-navy-lighter)]">
                      <span className="text-sm text-[var(--sz-gray)]">Monthly Price</span>
                      <span className="text-lg font-bold text-[var(--sz-lime)]">${selectedValueOption.service.priceNum}/mo</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[var(--sz-navy-lighter)]">
                      <span className="text-sm text-[var(--sz-gray)]">Season Cost (6 mo)</span>
                      <span className="font-semibold text-[var(--sz-white)]">${selectedValueOption.annualCost}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[var(--sz-navy-lighter)]">
                      <span className="text-sm text-[var(--sz-gray)]">Games Covered</span>
                      <span className="font-semibold text-[var(--sz-white)]">~{selectedValueOption.gamesPerSeason} games</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[var(--sz-navy-lighter)]">
                      <span className="text-sm text-[var(--sz-gray)]">Coverage</span>
                      <span className="font-semibold text-[var(--sz-white)]">{selectedValueOption.coveragePercent}%</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-[var(--sz-gray)]">Price per Game</span>
                      <span className="font-semibold text-[var(--sz-amber)]">${selectedValueOption.pricePerGame}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedValueOption(null)}
                    className="w-full mt-5 py-3 rounded-lg bg-[var(--sz-navy-lighter)] text-[var(--sz-white)] font-semibold hover:bg-[var(--sz-gray-dark)] transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Other Options Popup */}
            {showOtherOptions && streamingData.allValueOptions && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setShowOtherOptions(false)}
                />
                <div className="relative bg-[var(--sz-navy)] border border-[var(--sz-navy-lighter)] rounded-2xl p-5 max-w-sm w-full shadow-xl max-h-[80vh] overflow-y-auto">
                  <button
                    onClick={() => setShowOtherOptions(false)}
                    className="absolute top-3 right-3 p-1 text-[var(--sz-gray)] hover:text-[var(--sz-white)]"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <h4 className="text-lg font-bold text-[var(--sz-white)] mb-4">
                    Other Streaming Options
                  </h4>

                  <div className="space-y-2">
                    {(() => {
                      const excludeNames = new Set([
                        streamingData.categoryOptions.bestOverall?.service.name,
                        streamingData.categoryOptions.bestBudget?.service.name
                      ].filter(Boolean))
                      return streamingData.allValueOptions
                        .filter(opt => !excludeNames.has(opt.service.name))
                        .slice(0, 5)
                        .map((option) => (
                          <button
                            key={option.service.name}
                            onClick={() => {
                              setShowOtherOptions(false)
                              setSelectedValueOption(option)
                            }}
                            className="w-full p-3 rounded-lg text-left transition-all bg-[var(--sz-navy-light)] border border-[var(--sz-navy-lighter)] hover:border-[var(--sz-gray-dark)]"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-semibold text-[var(--sz-white)]">
                                  {option.service.name}
                                </div>
                                <div className="text-xs text-[var(--sz-gray)] mt-0.5">
                                  {option.reasoning}
                                </div>
                              </div>
                              <div className="text-right shrink-0 ml-3">
                                <div className="text-sm font-bold text-[var(--sz-lime)]">
                                  ${option.service.priceNum}/mo
                                </div>
                                <div className="text-xs text-[var(--sz-gray)]">
                                  {option.coveragePercent}% coverage
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                    })()}
                  </div>

                  <button
                    onClick={() => setShowOtherOptions(false)}
                    className="w-full mt-4 py-3 rounded-lg bg-[var(--sz-navy-lighter)] text-[var(--sz-white)] font-semibold hover:bg-[var(--sz-gray-dark)] transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Upcoming Games Schedule */}
            {schedule.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold tracking-widest text-[var(--sz-gray)] uppercase mb-3">
                  Upcoming Games
                </h3>
                <div className="space-y-3">
                  {schedule.slice(0, displayedGames).map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      isBlackedOut={streamingData.isBlackedOut}
                      teamRSN={streamingData.rsnInfo.name}
                      homeTeam={team}
                    />
                  ))}
                </div>
                {schedule.length > displayedGames && (
                  <button
                    onClick={() => setDisplayedGames(prev => prev + 5)}
                    className="w-full mt-4 flex items-center gap-3 group"
                  >
                    <div className="flex-1 h-px bg-[var(--sz-navy-lighter)] group-hover:bg-[var(--sz-gray-dark)] transition-colors" />
                    <span className="text-xs font-semibold tracking-widest text-[var(--sz-gray)] uppercase group-hover:text-[var(--sz-white)] transition-colors">
                      See More
                    </span>
                    <div className="flex-1 h-px bg-[var(--sz-navy-lighter)] group-hover:bg-[var(--sz-gray-dark)] transition-colors" />
                  </button>
                )}
              </div>
            )}

            {/* Best Value Providers */}
            {streamingData.categoryOptions && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold tracking-widest text-[var(--sz-gray)] uppercase mb-3">
                  Best Value Providers
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {/* Best Overall */}
                  {streamingData.categoryOptions.bestOverall && (
                    <button
                      onClick={() => setSelectedValueOption(streamingData.categoryOptions.bestOverall)}
                      className="py-2 px-3 rounded-lg text-center transition-all bg-[var(--sz-navy-light)] border border-[var(--sz-navy-lighter)] hover:border-[var(--sz-gray-dark)] flex flex-col"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--sz-lime)]">
                        Best Overall
                      </div>
                      <div className="text-sm font-semibold text-[var(--sz-white)] leading-tight mt-1">
                        {streamingData.categoryOptions.bestOverall.service.name}
                      </div>
                    </button>
                  )}

                  {/* Best Value */}
                  {streamingData.categoryOptions.bestBudget && (
                    <button
                      onClick={() => setSelectedValueOption(streamingData.categoryOptions.bestBudget)}
                      className="py-2 px-3 rounded-lg text-center transition-all bg-[var(--sz-navy-light)] border border-[var(--sz-navy-lighter)] hover:border-[var(--sz-gray-dark)] flex flex-col"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--sz-amber)]">
                        Best Value
                      </div>
                      <div className="text-sm font-semibold text-[var(--sz-white)] leading-tight mt-1">
                        {streamingData.categoryOptions.bestBudget.service.name}
                      </div>
                    </button>
                  )}

                  {/* Other */}
                  {(() => {
                    const excludeNames = new Set([
                      streamingData.categoryOptions.bestOverall?.service.name,
                      streamingData.categoryOptions.bestBudget?.service.name
                    ].filter(Boolean))
                    const otherOptions = streamingData.allValueOptions?.filter(
                      opt => !excludeNames.has(opt.service.name)
                    ) || []
                    return otherOptions.length > 0 && (
                      <button
                        onClick={() => setShowOtherOptions(true)}
                        className="py-2 px-3 rounded-lg text-center transition-all bg-[var(--sz-navy-light)] border border-[var(--sz-navy-lighter)] hover:border-[var(--sz-gray-dark)] flex flex-col"
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--sz-gray)]">
                          Other
                        </div>
                        <div className="text-sm font-semibold text-[var(--sz-white)] leading-tight mt-1">
                          +{Math.min(5, otherOptions.length)} Options
                        </div>
                      </button>
                    )
                  })()}
                </div>
              </div>
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

interface LiveScoreData {
  found: boolean
  isLive: boolean
  isFinal: boolean
  homeScore: number
  awayScore: number
  inningState?: string | null
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
  const [showAllServices, setShowAllServices] = useState(false)
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
      } catch (error) {
        console.error('Failed to fetch live score:', error)
        setLiveScore(null)
      }
    }

    fetchLiveScore()

    // Refresh score every 30 seconds for live games
    if (isGameLive) {
      const interval = setInterval(fetchLiveScore, 30000)
      return () => clearInterval(interval)
    }
  }, [game.id, isGameLive, isGameFinal])

  // Fetch real ticket data (only for non-live games)
  useEffect(() => {
    if (isGameLive || isGameFinal) {
      setTicketLoading(false)
      return
    }

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
  }, [game.date, game.opponent, game.isHome, homeTeam, isGameLive, isGameFinal])

  // Toggle game reminder
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
          team: homeTeam,
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
    <div className="p-3 rounded-lg bg-[var(--sz-navy-light)] border border-[var(--sz-navy-lighter)]">
      <div className="flex gap-3">
        {/* Left: Game Info */}
        <div className="flex-1 min-w-0">
          <div className="flex gap-3">
            {/* Date & Channel Column */}
            <div className="text-center shrink-0 w-12">
              <div className="text-[10px] font-bold text-[var(--sz-lime)] uppercase">{dayName}</div>
              <div className="text-xs font-semibold text-[var(--sz-white)]">{monthDay}</div>
              {/* Horizontal divider - left side */}
              <div className="mt-2 pt-2 border-t border-[var(--sz-navy-lighter)]">
                <div className="text-[10px] font-bold text-[var(--sz-lime)]">{watchInfo.channel}</div>
              </div>
            </div>

            {/* Solid vertical line */}
            <div className="w-px bg-[var(--sz-navy-lighter)] shrink-0" />

            {/* Opponent & Streaming Column */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-[var(--sz-gray)] uppercase">
                  {game.isHome ? 'vs' : '@'}
                </span>
                <span className="text-sm font-bold text-[var(--sz-white)] truncate">{game.opponent}</span>
                <span className={`text-[10px] font-bold mt-[3px] ${game.isHome ? 'text-[var(--sz-amber)]' : 'text-[var(--sz-red)]'}`}>
                  {game.isHome ? 'H' : 'A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--sz-gray)]">{game.time}</span>
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
              </div>
              {/* Horizontal divider - right side */}
              <div className="mt-1 pt-2 border-t border-[var(--sz-navy-lighter)]">
                {streamingServices.length > 0 ? (
                  <div
                    className={`flex items-center gap-1.5 ${streamingServices.length > 3 ? 'cursor-pointer hover:opacity-80' : ''}`}
                    onClick={() => streamingServices.length > 3 && setShowAllServices(true)}
                  >
                    {streamingServices.slice(0, 3).map((service, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-[var(--sz-navy-lighter)] text-[10px] font-medium text-[var(--sz-white)] whitespace-nowrap"
                      >
                        {service.replace(/\s*\([^)]*\)/g, '')}
                      </span>
                    ))}
                    {streamingServices.length > 3 && (
                      <span className="text-[10px] text-[var(--sz-white)] whitespace-nowrap">+{streamingServices.length - 3}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-[var(--sz-gray)]">Streaming TBD</span>
                )}
              </div>
            </div>
          </div>

          {/* All Streaming Services Popup */}
          {showAllServices && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setShowAllServices(false)}
              />
              <div className="relative bg-[var(--sz-navy)] border border-[var(--sz-navy-lighter)] rounded-xl p-4 max-w-xs w-full shadow-xl">
                <button
                  onClick={() => setShowAllServices(false)}
                  className="absolute top-2 right-2 p-1 text-[var(--sz-gray)] hover:text-[var(--sz-white)]"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <h4 className="text-sm font-bold text-[var(--sz-white)] mb-3">
                  Watch on
                </h4>

                <div className="flex flex-wrap gap-2">
                  {streamingServices.map((service, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded bg-[var(--sz-navy-lighter)] text-xs font-medium text-[var(--sz-white)]"
                    >
                      {service.replace(/\s*\([^)]*\)/g, '')}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => setShowAllServices(false)}
                  className="w-full mt-4 py-2 rounded-lg bg-[var(--sz-navy-lighter)] text-[var(--sz-white)] text-sm font-semibold hover:bg-[var(--sz-gray-dark)] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
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
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-3 h-3 animate-spin text-[var(--sz-gray)]">
                <svg fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
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
