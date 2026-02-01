'use client'

import { useState } from 'react'
import { MLB_TEAMS } from '@/data/teams'
import { US_STATES } from '@/data/states'
import { StreamingModal } from '@/components/StreamingModal'

export default function Home() {
  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const teamNames = Object.keys(MLB_TEAMS).sort()
  const selectedTeamData = selectedTeam ? MLB_TEAMS[selectedTeam] : null

  const canProceed = selectedTeam && selectedState

  const handleFindStreams = () => {
    if (canProceed) {
      setIsModalOpen(true)
    }
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
            Find where to watch your team. Navigate blackouts. Never miss a pitch.
          </p>
        </header>

        {/* Selection Cards */}
        <div className="space-y-4">
          {/* Team Selector */}
          <div className="opacity-0 animate-slide-up stagger-1">
            <label className="block mb-2">
              <span className="text-xs font-semibold tracking-widest text-[var(--sz-gray)] uppercase">
                Your Team
              </span>
            </label>
            <div className="relative group">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full h-14 px-4 pr-12 rounded-lg appearance-none cursor-pointer
                  bg-[var(--sz-navy-light)] border border-[var(--sz-navy-lighter)]
                  text-[var(--sz-white)] text-lg font-medium
                  transition-all duration-200
                  hover:border-[var(--sz-gray-dark)]
                  focus:outline-none focus:border-[var(--sz-lime)] focus:glow-border"
              >
                <option value="" disabled>Select your team...</option>
                {teamNames.map((team) => (
                  <option key={team} value={team}>
                    {team}
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

            {/* Team info badge */}
            {selectedTeamData && (
              <div className="mt-3 flex items-center gap-2 animate-fade-in">
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide
                  ${selectedTeamData.league === 'AL'
                    ? 'bg-[var(--sz-red)]/20 text-[var(--sz-red)]'
                    : 'bg-[var(--sz-amber)]/20 text-[var(--sz-amber)]'
                  }`}>
                  {selectedTeamData.league}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--sz-navy-lighter)] text-[var(--sz-gray)]">
                  {selectedTeamData.division}
                </span>
                <span className="text-xs text-[var(--sz-gray-dark)]">
                  {selectedTeamData.market}
                </span>
              </div>
            )}
          </div>

          {/* State Selector */}
          <div className="opacity-0 animate-slide-up stagger-2">
            <label className="block mb-2">
              <span className="text-xs font-semibold tracking-widest text-[var(--sz-gray)] uppercase">
                Your Location
              </span>
            </label>
            <div className="relative group">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full h-14 px-4 pr-12 rounded-lg appearance-none cursor-pointer
                  bg-[var(--sz-navy-light)] border border-[var(--sz-navy-lighter)]
                  text-[var(--sz-white)] text-lg font-medium
                  transition-all duration-200
                  hover:border-[var(--sz-gray-dark)]
                  focus:outline-none focus:border-[var(--sz-lime)] focus:glow-border"
              >
                <option value="" disabled>Select your state...</option>
                {US_STATES.map((state) => (
                  <option key={state.abbr} value={state.abbr}>
                    {state.name}
                  </option>
                ))}
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

        {/* CTA Button */}
        <div className="mt-8 opacity-0 animate-slide-up stagger-3">
          <button
            onClick={handleFindStreams}
            disabled={!canProceed}
            className={`w-full h-14 rounded-lg font-display text-2xl tracking-wide uppercase
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
        </div>

        {/* Info Section */}
        <div className="mt-10 opacity-0 animate-slide-up stagger-4">
          <div className="p-4 rounded-lg bg-[var(--sz-navy-light)]/50 border border-[var(--sz-navy-lighter)]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <svg className="w-5 h-5 text-[var(--sz-amber)]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--sz-white)] mb-1">
                  Why location matters
                </h3>
                <p className="text-sm text-[var(--sz-gray)] leading-relaxed">
                  MLB blackout rules vary by state. We&apos;ll show you exactly which streaming services
                  can broadcast games in your area.
                </p>
              </div>
            </div>
          </div>
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
