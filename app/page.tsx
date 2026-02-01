'use client'

import { useState, useEffect } from 'react'
import { MLB_TEAMS } from '@/data/teams'
import { US_STATES } from '@/data/states'
import { SPORTS } from '@/data/sports'
import { StreamingModal } from '@/components/StreamingModal'

export default function Home() {
  const [selectedSport, setSelectedSport] = useState('mlb')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [favorites, setFavorites] = useState<Array<{ sport: string; team: string; state: string }>>([])

  // Load favorites from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('streamzone-favorites')
    if (saved) {
      try {
        setFavorites(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse favorites', e)
      }
    }
  }, [])

  // Save favorites to localStorage when changed
  useEffect(() => {
    if (favorites.length > 0) {
      localStorage.setItem('streamzone-favorites', JSON.stringify(favorites))
    }
  }, [favorites])

  const selectedSportData = SPORTS.find(s => s.id === selectedSport)
  const isSportEnabled = selectedSportData?.enabled ?? false

  const teamNames = Object.keys(MLB_TEAMS).sort()
  const selectedTeamData = selectedTeam ? MLB_TEAMS[selectedTeam] : null

  // Sort states with team's home state first
  const sortedStates = selectedTeamData
    ? [
        ...US_STATES.filter(s => s.abbr === selectedTeamData.state),
        ...US_STATES.filter(s => s.abbr !== selectedTeamData.state)
      ]
    : US_STATES

  const canProceed = isSportEnabled && selectedTeam && selectedState

  // Check if current selection is already a favorite
  const isCurrentFavorite = favorites.some(
    f => f.sport === selectedSport && f.team === selectedTeam && f.state === selectedState
  )

  const handleFindStreams = () => {
    if (canProceed) {
      setIsModalOpen(true)
    }
  }

  const addFavorite = () => {
    if (canProceed && !isCurrentFavorite && favorites.length < 3) {
      setFavorites([...favorites, { sport: selectedSport, team: selectedTeam, state: selectedState }])
    }
  }

  const removeFavorite = (index: number) => {
    const newFavorites = favorites.filter((_, i) => i !== index)
    setFavorites(newFavorites)
    if (newFavorites.length === 0) {
      localStorage.removeItem('streamzone-favorites')
    }
  }

  const selectFavorite = (fav: { sport: string; team: string; state: string }) => {
    setSelectedSport(fav.sport)
    setSelectedTeam(fav.team)
    setSelectedState(fav.state)
  }

  return (
    <main className="min-h-screen stadium-lights diagonal-stripes safe-top safe-bottom">
      {/* Decorative top bar */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[var(--sz-lime)] to-transparent opacity-60" />

      <div className="px-5 py-8 max-w-lg mx-auto">
        {/* Header */}
        <header className="mb-10 opacity-0 animate-slide-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-[var(--sz-lime)] animate-pulse-glow" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-[var(--sz-lime)] blur-sm" />
            </div>
            <span className="text-xs font-semibold tracking-widest text-[var(--sz-lime)] uppercase">
              Live Streaming Guide
            </span>
          </div>

          <h1 className="font-display text-6xl sm:text-7xl text-[var(--sz-white)] leading-none mb-3">
            STREAM<span className="text-[var(--sz-lime)]">ZONE</span>
          </h1>

          <p className="text-[var(--sz-gray)] text-base leading-relaxed max-w-sm">
            Find where to watch your team. Navigate blackouts. Never miss a game.
          </p>
        </header>

        {/* Favorite Teams Section */}
        <div className="mb-8 opacity-0 animate-slide-up stagger-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-widest text-[var(--sz-gray)] uppercase">
              Favorites
            </span>
          </div>
          {favorites.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-[var(--sz-gray)]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span>Tap Star to add team to favorites</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {favorites.map((fav, index) => (
                <button
                  key={`${fav.team}-${fav.state}`}
                  onClick={() => selectFavorite(fav)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--sz-navy-light)] border border-[var(--sz-navy-lighter)] hover:border-[var(--sz-lime)] transition-colors group"
                >
                  <img
                    src={`/logos/sports/${fav.sport}.svg`}
                    alt=""
                    className="w-5 h-5 object-contain"
                  />
                  <span className="text-sm font-medium text-[var(--sz-white)]">
                    {fav.team}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFavorite(index)
                    }}
                    className="ml-1 p-0.5 text-[var(--sz-gray-dark)] hover:text-[var(--sz-red)] transition-colors"
                    aria-label="Remove favorite"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selection Cards */}
        <div className="space-y-4">
          {/* Sport Selector */}
          <div className="opacity-0 animate-slide-up stagger-1">
            <label className="block mb-2">
              <span className="text-xs font-semibold tracking-widest text-[var(--sz-gray)] uppercase">
                Select Sport
              </span>
            </label>
            <div className="relative group">
              {/* Sport logo */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <img
                  src={`/logos/sports/${selectedSport}.svg`}
                  alt=""
                  className="w-8 h-8 object-contain"
                />
              </div>
              <select
                value={selectedSport}
                onChange={(e) => {
                  setSelectedSport(e.target.value)
                  setSelectedTeam('')
                  setSelectedState('')
                }}
                className="w-full h-14 pl-14 pr-12 rounded-lg appearance-none cursor-pointer
                  bg-[var(--sz-navy-light)] border border-[var(--sz-navy-lighter)]
                  text-[var(--sz-white)] text-lg font-medium
                  transition-all duration-200
                  hover:border-[var(--sz-gray-dark)]
                  focus:outline-none focus:border-[var(--sz-lime)] focus:glow-border"
              >
                {SPORTS.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.id === 'epl' ? 'Premier League' : sport.shortName}
                  </option>
                ))}
              </select>

              {/* Custom dropdown arrow */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-[var(--sz-gray)] group-hover:text-[var(--sz-lime)] transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Team Selector */}
          <div className="opacity-0 animate-slide-up stagger-2">
            <label className="block mb-2">
              <span className="text-xs font-semibold tracking-widest text-[var(--sz-gray)] uppercase">
                Your Team
              </span>
            </label>
            <div className="relative group">
              {/* League/Division badge */}
              {selectedTeamData && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                    ${selectedTeamData.league === 'AL'
                      ? 'bg-[var(--sz-red)]/20 text-[var(--sz-red)]'
                      : 'bg-[var(--sz-amber)]/20 text-[var(--sz-amber)]'
                    }`}>
                    {selectedTeamData.league} {selectedTeamData.division}
                  </span>
                </div>
              )}
              <select
                value={isSportEnabled ? selectedTeam : ''}
                onChange={(e) => setSelectedTeam(e.target.value)}
                disabled={!isSportEnabled}
                className={`w-full h-14 pr-12 rounded-lg appearance-none
                  bg-[var(--sz-navy-light)] border border-[var(--sz-navy-lighter)]
                  text-[var(--sz-white)] text-lg font-medium
                  transition-all duration-200
                  focus:outline-none focus:border-[var(--sz-lime)] focus:glow-border
                  ${selectedTeamData ? 'pl-24' : 'pl-4'}
                  ${isSportEnabled ? 'cursor-pointer hover:border-[var(--sz-gray-dark)]' : 'cursor-not-allowed opacity-60'}`}
              >
                {isSportEnabled ? (
                  <>
                    <option value="" disabled>Select your team...</option>
                    {teamNames.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </>
                ) : (
                  <option value="">Coming soon</option>
                )}
              </select>

              {/* Custom dropdown arrow */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-[var(--sz-gray)] group-hover:text-[var(--sz-lime)] transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* State Selector */}
          <div className="opacity-0 animate-slide-up stagger-3">
            <label className="block mb-2">
              <span className="text-xs font-semibold tracking-widest text-[var(--sz-gray)] uppercase">
                Your Location
              </span>
            </label>
            <div className="relative group">
              <select
                value={isSportEnabled ? selectedState : ''}
                onChange={(e) => setSelectedState(e.target.value)}
                disabled={!isSportEnabled}
                className={`w-full h-14 px-4 pr-12 rounded-lg appearance-none
                  bg-[var(--sz-navy-light)] border border-[var(--sz-navy-lighter)]
                  text-[var(--sz-white)] text-lg font-medium
                  transition-all duration-200
                  focus:outline-none focus:border-[var(--sz-lime)] focus:glow-border
                  ${isSportEnabled ? 'cursor-pointer hover:border-[var(--sz-gray-dark)]' : 'cursor-not-allowed opacity-60'}`}
              >
                {isSportEnabled ? (
                  <>
                    <option value="" disabled>Select your state...</option>
                    {sortedStates.map((state) => (
                      <option key={state.abbr} value={state.abbr}>
                        {state.name}
                      </option>
                    ))}
                  </>
                ) : (
                  <option value="">Coming soon</option>
                )}
              </select>

              {/* Location icon + arrow */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-[var(--sz-gray)] group-hover:text-[var(--sz-lime)] transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="mt-8 opacity-0 animate-slide-up stagger-4 flex gap-3">
          <button
            onClick={handleFindStreams}
            disabled={!canProceed}
            className={`flex-1 h-14 rounded-lg font-display text-2xl tracking-wide uppercase
              transition-all duration-300 relative overflow-hidden group
              ${canProceed
                ? 'bg-[var(--sz-lime)] text-[var(--sz-navy)] hover:bg-[var(--sz-lime-dim)] active:scale-[0.98]'
                : 'bg-[var(--sz-navy-lighter)] text-[var(--sz-gray-dark)] cursor-not-allowed'
              }`}
          >
            {/* Button shine effect */}
            {canProceed && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            )}
            <span className="relative">Find Streams</span>
          </button>

          {/* Add to Favorites Button */}
          {canProceed && !isCurrentFavorite && favorites.length < 3 && (
            <button
              onClick={addFavorite}
              className="h-14 w-14 rounded-lg bg-[var(--sz-navy-light)] border border-[var(--sz-navy-lighter)]
                hover:border-[var(--sz-lime)] hover:text-[var(--sz-lime)] text-[var(--sz-gray)]
                transition-all duration-200 flex items-center justify-center active:scale-95"
              aria-label="Add to favorites"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-[var(--sz-navy-lighter)]">
          <p className="text-center text-xs text-[var(--sz-gray-dark)]">
            2026 Season &middot; Data updated daily
          </p>
        </footer>
      </div>

      {/* Streaming Modal */}
      <StreamingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        team={selectedTeam}
        state={selectedState}
      />
    </main>
  )
}
