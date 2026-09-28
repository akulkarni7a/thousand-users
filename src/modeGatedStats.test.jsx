// @vitest-environment jsdom
import { test, expect, beforeEach, afterEach, vi } from 'vitest'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import * as nflPlayers from './data/nflPlayers.js'
import { flushPendingStorageWrites, getStorageItem } from './utils/asyncStorage.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

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

let container = null
let root = null

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  flushPendingStorageWrites()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => {
    if (root) root.unmount()
  })
  if (container) container.remove()
  container = null
  root = null
  localStorage.clear()
  flushPendingStorageWrites()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const selectPlayerInSearch = (playerName) => {
  const input = container.querySelector('.search-input')
  expect(input).toBeTruthy()

  act(() => {
    input.focus()
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set
    nativeInputValueSetter.call(input, playerName)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })

  // Advance 150ms for search debouncing
  act(() => {
    vi.advanceTimersByTime(150)
  })

  const item = Array.from(container.querySelectorAll('.search-result-item')).find((el) =>
    el.textContent.includes(playerName)
  )
  expect(item).toBeTruthy()

  act(() => {
    item.click()
  })
}

test('Practice mode wins do not increment played, won, or currentStreak in daily statistics', () => {
  const mahomes = nflPlayers.NFL_PLAYERS[0]
  vi.spyOn(nflPlayers, 'getRandomPlayer').mockReturnValue(mahomes)

  const initialStats = {
    played: 5,
    won: 4,
    currentStreak: 3,
    maxStreak: 3,
    guessDistribution: { 1: 0, 2: 1, 3: 2, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0 },
    lastPlayedDate: '2026-09-20',
  }
  localStorage.setItem('gridiron_guesser_stats', JSON.stringify(initialStats))

  act(() => {
    root.render(React.createElement(App))
  })

  // Switch to Practice Mode
  const practiceTab = Array.from(container.querySelectorAll('.mode-tab')).find((tab) =>
    tab.textContent.includes('Practice')
  )
  act(() => {
    practiceTab.click()
  })

  // Win the practice game by selecting target player (Mahomes)
  selectPlayerInSearch(mahomes.name)

  // Verify game result banner in StatsModal / end bar
  expect(container.textContent).toContain('TOUCHDOWN! YOU WON!')

  // Flush storage writes
  flushPendingStorageWrites()

  // Verify stats stored in localStorage remain unchanged
  const savedStats = JSON.parse(getStorageItem('gridiron_guesser_stats'))
  expect(savedStats.played).toBe(5)
  expect(savedStats.won).toBe(4)
  expect(savedStats.currentStreak).toBe(3)
  expect(savedStats.maxStreak).toBe(3)
})

test('Practice mode losses do not reset currentStreak to zero', () => {
  const mahomes = nflPlayers.NFL_PLAYERS[0]
  vi.spyOn(nflPlayers, 'getRandomPlayer').mockReturnValue(mahomes)

  const initialStats = {
    played: 5,
    won: 4,
    currentStreak: 3,
    maxStreak: 3,
    guessDistribution: { 1: 0, 2: 1, 3: 2, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0 },
    lastPlayedDate: '2026-09-20',
  }
  localStorage.setItem('gridiron_guesser_stats', JSON.stringify(initialStats))

  act(() => {
    root.render(React.createElement(App))
  })

  // Switch to Practice Mode
  const practiceTab = Array.from(container.querySelectorAll('.mode-tab')).find((tab) =>
    tab.textContent.includes('Practice')
  )
  act(() => {
    practiceTab.click()
  })

  // Make 8 incorrect guesses in practice mode
  const wrongPlayers = nflPlayers.NFL_PLAYERS.filter((p) => p.id !== mahomes.id).slice(0, 8)
  wrongPlayers.forEach((p) => {
    selectPlayerInSearch(p.name)
  })

  // Verify game over loss banner
  expect(container.textContent).toContain('GAME OVER')

  // Flush pending storage writes
  flushPendingStorageWrites()

  // Verify stats stored in localStorage remain unchanged (currentStreak still 3)
  const savedStats = JSON.parse(getStorageItem('gridiron_guesser_stats'))
  expect(savedStats.played).toBe(5)
  expect(savedStats.won).toBe(4)
  expect(savedStats.currentStreak).toBe(3)
  expect(savedStats.maxStreak).toBe(3)
})

test('Daily mode wins update daily statistics, win count, and streaks correctly', () => {
  const kelce = nflPlayers.NFL_PLAYERS[1]
  vi.spyOn(nflPlayers, 'getDailyPlayer').mockReturnValue(kelce)

  const todayStr = new Date().toISOString().slice(0, 10)
  const initialStats = {
    played: 5,
    won: 4,
    currentStreak: 3,
    maxStreak: 3,
    guessDistribution: { 1: 0, 2: 1, 3: 2, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0 },
    lastPlayedDate: '2026-09-20',
  }
  localStorage.setItem('gridiron_guesser_stats', JSON.stringify(initialStats))

  act(() => {
    root.render(React.createElement(App))
  })

  // Win daily puzzle
  selectPlayerInSearch(kelce.name)

  // Flush pending storage writes
  flushPendingStorageWrites()

  // Verify stats stored in localStorage are updated
  const savedStats = JSON.parse(getStorageItem('gridiron_guesser_stats'))
  expect(savedStats.played).toBe(6)
  expect(savedStats.won).toBe(5)
  expect(savedStats.currentStreak).toBe(4)
  expect(savedStats.maxStreak).toBe(4)
  expect(savedStats.guessDistribution[1]).toBe(1)
  expect(savedStats.lastPlayedDate).toBe(todayStr)
})

test('Daily mode losses reset currentStreak to zero and update played count', () => {
  const kelce = nflPlayers.NFL_PLAYERS[1]
  vi.spyOn(nflPlayers, 'getDailyPlayer').mockReturnValue(kelce)

  const initialStats = {
    played: 5,
    won: 4,
    currentStreak: 3,
    maxStreak: 3,
    guessDistribution: { 1: 0, 2: 1, 3: 2, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0 },
    lastPlayedDate: '2026-09-20',
  }
  localStorage.setItem('gridiron_guesser_stats', JSON.stringify(initialStats))

  act(() => {
    root.render(React.createElement(App))
  })

  // Make 8 incorrect guesses (excluding Kelce)
  const wrongPlayers = nflPlayers.NFL_PLAYERS.filter((p) => p.id !== kelce.id).slice(0, 8)
  wrongPlayers.forEach((p) => {
    selectPlayerInSearch(p.name)
  })

  // Flush pending storage writes
  flushPendingStorageWrites()

  // Verify stats stored in localStorage updated: played = 6, currentStreak = 0
  const savedStats = JSON.parse(getStorageItem('gridiron_guesser_stats'))
  expect(savedStats.played).toBe(6)
  expect(savedStats.won).toBe(4)
  expect(savedStats.currentStreak).toBe(0)
  expect(savedStats.maxStreak).toBe(3)
})

test('Statistics modal opened after practice game displays unchanged daily statistics', () => {
  const mahomes = nflPlayers.NFL_PLAYERS[0]
  vi.spyOn(nflPlayers, 'getRandomPlayer').mockReturnValue(mahomes)

  const initialStats = {
    played: 10,
    won: 8,
    currentStreak: 5,
    maxStreak: 5,
    guessDistribution: { 1: 1, 2: 2, 3: 3, 4: 2, 5: 0, 6: 0, 7: 0, 8: 0 },
    lastPlayedDate: '2026-09-20',
  }
  localStorage.setItem('gridiron_guesser_stats', JSON.stringify(initialStats))

  act(() => {
    root.render(React.createElement(App))
  })

  // Switch to Practice Mode
  const practiceTab = Array.from(container.querySelectorAll('.mode-tab')).find((tab) =>
    tab.textContent.includes('Practice')
  )
  act(() => {
    practiceTab.click()
  })

  // Complete a practice game (win)
  selectPlayerInSearch(mahomes.name)

  // Check stats values rendered in modal
  const statBoxes = container.querySelectorAll('.stat-box')
  expect(statBoxes.length).toBe(4)

  const playedVal = statBoxes[0].querySelector('.stat-value').textContent
  const winPctVal = statBoxes[1].querySelector('.stat-value').textContent
  const currentStreakVal = statBoxes[2].querySelector('.stat-value').textContent
  const maxStreakVal = statBoxes[3].querySelector('.stat-value').textContent

  expect(playedVal).toBe('10')
  expect(winPctVal).toBe('80%') // 8/10 = 80%
  expect(currentStreakVal).toBe('5')
  expect(maxStreakVal).toBe('5')
})
