import { test, expect, beforeEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.jsx'
import PlayerSearch from './components/PlayerSearch.jsx'
import WelcomeModal from './components/WelcomeModal.jsx'
import {
  NFL_PLAYERS,
  getSearchResults,
  getStarterPlayers,
  filterPlayers,
  WELCOME_STORAGE_KEY,
} from './data/nflPlayers.js'

if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.setItem) {
  let store = {}
  globalThis.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => {
      store[key] = String(val)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
}

beforeEach(() => {
  localStorage.clear()
})

test('WelcomeModal auto-triggers on first visit when local storage flag is not set', () => {
  expect(localStorage.getItem(WELCOME_STORAGE_KEY)).toBeNull()
  const html = renderToString(React.createElement(App))
  expect(html).toContain('WELCOME TO GRIDIRON GUESSER')
  expect(html).toContain('Start Playing')
})

test('WelcomeModal does not auto-trigger when user has already visited', () => {
  localStorage.setItem(WELCOME_STORAGE_KEY, 'true')
  const html = renderToString(React.createElement(App))
  expect(html).not.toContain('WELCOME TO GRIDIRON GUESSER')
})

test('WelcomeModal component renders game rules, tile colors, and directional indicators', () => {
  const html = renderToString(
    React.createElement(WelcomeModal, { isOpen: true, onClose: () => {} })
  )
  expect(html).toContain('WELCOME TO GRIDIRON GUESSER')
  expect(html).toContain('Exact Match')
  expect(html).toContain('Close Match')
  expect(html).toContain('No Match')
  expect(html).toContain('Directional Arrows')
  expect(html).toContain('Start Playing')
})

test('getStarterPlayers returns top Pro Bowl stars when query is empty', () => {
  const starters = getStarterPlayers(NFL_PLAYERS)
  expect(starters.length).toBeGreaterThan(0)
  // Travis Kelce (9 PBs) or Tyreek Hill (8 PBs) or Mahomes (6 PBs) should be at top
  expect(starters[0].proBowls).toBeGreaterThanOrEqual(starters[starters.length - 1].proBowls)
})

test('getSearchResults filters by position, side of ball, and conference category chips', () => {
  // QB position filter
  const qbs = getSearchResults(NFL_PLAYERS, '', [], 'QB')
  expect(qbs.every((p) => p.position === 'QB')).toBe(true)

  // Defense side of ball filter
  const defense = getSearchResults(NFL_PLAYERS, '', [], 'Defense')
  expect(defense.every((p) => p.sideOfBall === 'Defense')).toBe(true)

  // AFC conference filter
  const afc = getSearchResults(NFL_PLAYERS, '', [], 'AFC')
  expect(afc.every((p) => p.conference === 'AFC')).toBe(true)
})

test('getSearchResults combines query text and category filter chip', () => {
  const results = getSearchResults(NFL_PLAYERS, 'Josh', [], 'QB')
  expect(results.length).toBe(1)
  expect(results[0].name).toBe('Josh Allen')

  // Searching for a non-QB while category is QB returns empty
  const noMatch = getSearchResults(NFL_PLAYERS, 'Tyreek', [], 'QB')
  expect(noMatch.length).toBe(0)
})

test('filterPlayers returns empty array when query is empty string', () => {
  expect(filterPlayers(NFL_PLAYERS, '')).toEqual([])
  expect(filterPlayers(NFL_PLAYERS, '   ')).toEqual([])
})

test('PlayerSearch component renders filter chips', () => {
  const html = renderToString(React.createElement(PlayerSearch, { onSelectPlayer: () => {} }))
  expect(html).toContain('QB')
  expect(html).toContain('WR')
  expect(html).toContain('Offense')
  expect(html).toContain('Defense')
  expect(html).toContain('AFC')
  expect(html).toContain('NFC')
})

test('NFL_PLAYERS dataset contains pre-computed lowercased search properties at module load', () => {
  expect(NFL_PLAYERS.length).toBeGreaterThan(0)
  NFL_PLAYERS.forEach((player) => {
    expect(player.searchName).toBe(player.name.toLowerCase())
    expect(player.searchTeam).toBe(player.team.toLowerCase())
    expect(player.searchAbbr).toBe(player.teamAbbr.toLowerCase())
  })
})

test('getSearchResults uses pre-computed search fields during filtering', () => {
  const mahomes = NFL_PLAYERS.find((p) => p.name === 'Patrick Mahomes')
  expect(mahomes).toBeDefined()

  // Verify getSearchResults matches using lowercased pre-computed attributes
  const results = getSearchResults(NFL_PLAYERS, 'mahomes')
  expect(results.some((p) => p.id === mahomes.id)).toBe(true)

  // Test custom player object with pre-computed search fields
  const mockPlayers = [
    {
      id: 'mock1',
      name: 'Custom Player',
      team: 'Custom Team',
      teamAbbr: 'CT',
      searchName: 'custom player',
      searchTeam: 'custom team',
      searchAbbr: 'ct',
      proBowls: 0,
    },
  ]
  const mockResults = getSearchResults(mockPlayers, 'custom')
  expect(mockResults).toHaveLength(1)
  expect(mockResults[0].id).toBe('mock1')
})

test('getSearchResults uses pre-computed search fields without calling toLowerCase during filter passes', () => {
  let toLowerCaseCalled = false
  const mockPlayer = {
    id: 'test-1',
    get name() {
      return {
        toLowerCase() {
          toLowerCaseCalled = true
          return 'test name'
        },
      }
    },
    team: 'Test Team',
    teamAbbr: 'TT',
    searchName: 'test name',
    searchTeam: 'test team',
    searchAbbr: 'tt',
    proBowls: 0,
  }

  const results = getSearchResults([mockPlayer], 'test')
  expect(results).toHaveLength(1)
  expect(toLowerCaseCalled).toBe(false)
})
