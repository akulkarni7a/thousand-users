import { test, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import {
  asyncSetItem,
  asyncRemoveItem,
  getItemSync,
  loadInitialAppState,
  WELCOME_STORAGE_KEY,
  DAILY_STORAGE_KEY,
  STATS_STORAGE_KEY,
  clearMemoryCache,
  clearComparisonsCache,
} from './data/asyncStorage'
import * as nflPlayersModule from './data/nflPlayers'
import GuessGrid from './components/GuessGrid'

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
  clearMemoryCache()
  clearComparisonsCache()
  vi.restoreAllMocks()
})

test('loadInitialAppState reads all keys in a single consolidated pass', () => {
  const getItemSpy = vi.spyOn(localStorage, 'getItem')

  const todayStr = '2026-09-25'
  localStorage.setItem(WELCOME_STORAGE_KEY, 'true')
  localStorage.setItem(
    DAILY_STORAGE_KEY,
    JSON.stringify({
      date: todayStr,
      puzzleNum: 100,
      guesses: [nflPlayersModule.NFL_PLAYERS[0]],
      gameStatus: 'IN_PROGRESS',
    })
  )
  localStorage.setItem(
    STATS_STORAGE_KEY,
    JSON.stringify({ played: 5, won: 3, currentStreak: 2, maxStreak: 4, guessDistribution: {}, lastPlayedDate: todayStr })
  )

  getItemSpy.mockClear()

  const initialState = loadInitialAppState(todayStr)

  expect(initialState.welcomeSeen).toBe(true)
  expect(initialState.dailyState.guesses).toHaveLength(1)
  expect(initialState.dailyState.guesses[0].id).toBe(nflPlayersModule.NFL_PLAYERS[0].id)
  expect(initialState.stats.played).toBe(5)

  // Verify that localStorage getItem was called for each key during single consolidated pass
  expect(getItemSpy).toHaveBeenCalledWith(WELCOME_STORAGE_KEY)
  expect(getItemSpy).toHaveBeenCalledWith(DAILY_STORAGE_KEY)
  expect(getItemSpy).toHaveBeenCalledWith(STATS_STORAGE_KEY)
})

test('asyncSetItem schedules non-blocking write using requestIdleCallback when available', async () => {
  let callbackScheduled = false
  const originalRequestIdleCallback = globalThis.requestIdleCallback

  globalThis.requestIdleCallback = vi.fn((cb) => {
    callbackScheduled = true
    return setTimeout(cb, 0)
  })

  await asyncSetItem('test_key', { foo: 'bar' })

  expect(callbackScheduled).toBe(true)
  expect(globalThis.requestIdleCallback).toHaveBeenCalled()

  if (originalRequestIdleCallback) {
    globalThis.requestIdleCallback = originalRequestIdleCallback
  } else {
    delete globalThis.requestIdleCallback
  }
})

test('asyncSetItem and asyncRemoveItem fall back gracefully when requestIdleCallback is unavailable', async () => {
  const originalRequestIdleCallback = globalThis.requestIdleCallback
  delete globalThis.requestIdleCallback

  await asyncSetItem('fallback_key', 'fallback_value')
  expect(getItemSync('fallback_key')).toBe('fallback_value')

  await asyncRemoveItem('fallback_key')
  expect(getItemSync('fallback_key')).toBeNull()

  if (originalRequestIdleCallback) {
    globalThis.requestIdleCallback = originalRequestIdleCallback
  }
})

test('GuessGrid memoizes comparePlayers calculations and does not recalculate historical guesses', () => {
  const compareSpy = vi.spyOn(nflPlayersModule, 'comparePlayers')

  const targetPlayer = nflPlayersModule.NFL_PLAYERS[0] // Mahomes
  const guess1 = nflPlayersModule.NFL_PLAYERS[1] // Kelce
  const guess2 = nflPlayersModule.NFL_PLAYERS[2] // Allen

  // First render with 1 guess
  renderToString(React.createElement(GuessGrid, { guesses: [guess1], targetPlayer }))
  const initialCallCount = compareSpy.mock.calls.length
  expect(initialCallCount).toBe(1) // Computed once for guess1

  // Second render with 2 guesses (guess1 already computed, guess2 new)
  renderToString(React.createElement(GuessGrid, { guesses: [guess1, guess2], targetPlayer }))
  const secondCallCount = compareSpy.mock.calls.length
  // Should only have called comparePlayers 1 additional time for guess2 (total 2 calls, guess1 was not re-computed)
  expect(secondCallCount).toBe(2)
})
