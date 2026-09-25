import { useState, useRef, useEffect } from 'react'
import { NFL_PLAYERS, getSearchResults } from '../data/nflPlayers'

const CATEGORIES = ['All', 'QB', 'RB', 'WR', 'Offense', 'Defense', 'AFC', 'NFC']

export default function PlayerSearch({ onSelectPlayer, guessedIds = [], disabled = false }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const wrapperRef = useRef(null)

  const filtered = getSearchResults(NFL_PLAYERS, query, guessedIds, category)

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setIsOpen(true)
    setSelectedIndex(0)
  }

  const handleCategorySelect = (cat) => {
    setCategory(cat)
    setIsOpen(true)
    setSelectedIndex(0)
  }

  const handleSelect = (player) => {
    if (disabled) return
    onSelectPlayer(player)
    setQuery('')
    setIsOpen(false)
  }

  const handleKeyDown = (e) => {
    if (!isOpen || filtered.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filtered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const isStarterMode = query.trim().length === 0 && category === 'All'

  return (
    <div className="player-search-container" ref={wrapperRef}>
      <div className="filter-chips-bar" role="group" aria-label="Category filter chips">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`filter-chip ${category === cat ? 'active' : ''}`}
            onClick={() => handleCategorySelect(cat)}
            disabled={disabled}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder={disabled ? 'Game Over' : 'Search player by name or team...'}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label="Search player"
          autoComplete="off"
        />
        {query && !disabled && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => {
              setQuery('')
              setSelectedIndex(0)
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && !disabled && (
        <ul className="search-results-list" role="listbox">
          {isStarterMode && (
            <li className="search-section-header">
              ⭐ Starter Recommendations (Pro Bowl Stars)
            </li>
          )}
          {!isStarterMode && query.trim().length === 0 && (
            <li className="search-section-header">
              🔍 Recommended {category} Players
            </li>
          )}
          {!isStarterMode && query.trim().length > 0 && category !== 'All' && (
            <li className="search-section-header">
              🔍 Matching "{query}" in {category}
            </li>
          )}

          {filtered.length > 0 ? (
            filtered.map((player, idx) => (
              <li
                key={player.id}
                role="option"
                aria-selected={idx === selectedIndex}
                className={`search-result-item ${idx === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelect(player)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="player-info-main">
                  <span className="player-name-text">
                    {player.name} {player.proBowls > 0 && <span className="pro-bowl-badge">⭐ {player.proBowls}x PB</span>}
                  </span>
                  <span className="player-team-tag">{player.teamAbbr} • #{player.number}</span>
                </div>
                <div className="player-sub-info">
                  <span>{player.position}</span>
                  <span>{player.conference} {player.division}</span>
                </div>
              </li>
            ))
          ) : (
            <li className="no-results-item">No active player found</li>
          )}
        </ul>
      )}
    </div>
  )
}
