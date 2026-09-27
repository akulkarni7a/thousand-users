import { test, expect, beforeEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { loadInitialAppState } from './utils/appState.js'
import CountdownTimer from './components/CountdownTimer.jsx'
import StatsModal from './components/StatsModal.jsx'
import {
  getUTCTodayString,
  getUTCDayDifference,
  getUTCMidnightCountdown,
} from './utils/dateUtils.js'
import { NFL_PLAYERS } from './data/nflPlayers.js'

// LocalStorage polyfill for test environment
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

test('getUTCTodayString returns valid YYYY-MM-DD string', () => {
  const d = new Date(Date.UTC(2026, 8, 27, 15, 30))
  expect(getUTCTodayString(d)).toBe('2026-09-27')
})

test('getUTCDayDifference computes correct calendar day differences', () => {
  expect(getUTCDayDifference('2026-09-27', '2026-09-26')).toBe(1)
  expect(getUTCDayDifference('2026-09-27', '2026-09-25')).toBe(2)
  expect(getUTCDayDifference('2026-09-27', '2026-09-27')).toBe(0)
  expect(getUTCDayDifference('2026-03-01', '2026-02-28')).toBe(1)
  expect(getUTCDayDifference(null, '2026-09-26')).toBeNull()
  expect(getUTCDayDifference('invalid', '2026-09-26')).toBeNull()
})

test('getUTCMidnightCountdown calculates remaining time accurately', () => {
  const fakeNow = new Date('2026-09-27T22:30:15Z')
  const result = getUTCMidnightCountdown(fakeNow)
  expect(result.hours).toBe(1)
  expect(result.minutes).toBe(29)
  expect(result.seconds).toBe(45)
  expect(result.formatted).toBe('01:29:45')
  expect(result.totalSeconds).toBe(5385)
})

test('getUTCMidnightCountdown handles zero or past midnight for puzzle date', () => {
  const puzzleDate = '2026-09-27'
  const exactMidnight = new Date('2026-09-28T00:00:00Z')
  const result = getUTCMidnightCountdown(puzzleDate, exactMidnight)
  expect(result.totalSeconds).toBe(0)
  expect(result.formatted).toBe('00:00:00')
})

test('loadInitialAppState preserves currentStreak if last played yesterday', () => {
  const todayStr = getUTCTodayString()
  const [y, m, d] = todayStr.split('-').map(Number)
  const yesterdayDate = new Date(Date.UTC(y, m - 1, d - 1))
  const yesterdayStr = getUTCTodayString(yesterdayDate)

  const savedStats = {
    played: 5,
    won: 5,
    currentStreak: 5,
    maxStreak: 5,
    guessDistribution: { 1: 1, 2: 2, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
    lastPlayedDate: yesterdayStr,
  }
  localStorage.setItem('gridiron_guesser_stats', JSON.stringify(savedStats))

  const state = loadInitialAppState()
  expect(state.stats.currentStreak).toBe(5)
})

test('loadInitialAppState resets currentStreak to 0 if last played 2 or more days ago', () => {
  const todayStr = getUTCTodayString()
  const [y, m, d] = todayStr.split('-').map(Number)
  const twoDaysAgoDate = new Date(Date.UTC(y, m - 1, d - 2))
  const twoDaysAgoStr = getUTCTodayString(twoDaysAgoDate)

  const savedStats = {
    played: 10,
    won: 8,
    currentStreak: 4,
    maxStreak: 6,
    guessDistribution: { 1: 1, 2: 2, 3: 5, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
    lastPlayedDate: twoDaysAgoStr,
  }
  localStorage.setItem('gridiron_guesser_stats', JSON.stringify(savedStats))

  const state = loadInitialAppState()
  expect(state.stats.currentStreak).toBe(0)
})

test('CountdownTimer renders clock formatted time when time remaining', () => {
  const html = renderToString(React.createElement(CountdownTimer, { onRefresh: () => {} }))
  expect(html).toContain('NEXT DAILY PUZZLE IN')
  expect(html).toContain('countdown-display')
})

test('StatsModal embeds CountdownTimer in daily game mode', () => {
  const dummyPlayer = NFL_PLAYERS[0]
  const dummyStats = {
    played: 3,
    won: 3,
    currentStreak: 3,
    maxStreak: 3,
    guessDistribution: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
    lastPlayedDate: getUTCTodayString(),
  }

  const html = renderToString(
    React.createElement(StatsModal, {
      isOpen: true,
      onClose: () => {},
      isWin: true,
      isGameOver: true,
      targetPlayer: dummyPlayer,
      guesses: [dummyPlayer],
      gameMode: 'daily',
      stats: dummyStats,
      onPlayAgain: () => {},
    })
  )

  expect(html).toContain('NEXT DAILY PUZZLE IN')
  expect(html).toContain('countdown-section')
})
