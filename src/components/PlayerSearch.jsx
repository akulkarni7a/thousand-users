import { useState, useRef, useEffect } from 'react'
import { NFL_PLAYERS, filterPlayers } from '../data/nflPlayers'

export default function PlayerSearch({ onSelectPlayer, guessedIds = [], disabled = false }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const wrapperRef = useRef(null)

  const filtered = filterPlayers(NFL_PLAYERS, query, guessedIds)

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
    setIsOpen(val.trim().length > 0)
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

  return (
    <div className="player-search-container" ref={wrapperRef}>
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder={disabled ? 'Game Over' : 'Search player by name or team...'}
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.trim().length > 0 && setIsOpen(true)}
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
              setIsOpen(false)
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && !disabled && (
        <ul className="search-results-list" role="listbox">
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
                  <span className="player-name-text">{player.name}</span>
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
