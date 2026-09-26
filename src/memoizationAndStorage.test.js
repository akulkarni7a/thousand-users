import { test, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import GuessGrid from './components/GuessGrid.jsx'
import App from './App.jsx'
import * as nflPlayers from './data/nflPlayers.js'
import {
  scheduleStorageWrite,
  flushPendingStorageWrites,
  getStorageItem,
} from './utils/asyncStorage.js'

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
  flushPendingStorageWrites()
})

test('GuessGrid renders comparison for guesses correctly', () => {
  const p1 = nflPlayers.NFL_PLAYERS[0]
  const p2 = nflPlayers.NFL_PLAYERS[1]
  const spy = vi.spyOn(nflPlayers, 'comparePlayers')

  const html = renderToString(React.createElement(GuessGrid, { guesses: [p1], targetPlayer: p2, maxGuesses: 8 }))
  expect(html).toContain(p1.name)
  expect(spy.mock.calls.length).toBeGreaterThan(0)

  spy.mockRestore()
})

test('App performs single consolidated local storage read for daily state on boot', () => {
  const getItemSpy = vi.spyOn(localStorage, 'getItem')

  renderToString(React.createElement(App))

  const dailyReads = getItemSpy.mock.calls.filter((c) => c[0] === nflPlayers.DAILY_STORAGE_KEY).length
  expect(dailyReads).toBeLessThanOrEqual(1)

  getItemSpy.mockRestore()
})

test('scheduleStorageWrite debounces and defers writes asynchronously', async () => {
  const key = 'test_async_key'
  const val = { foo: 'bar' }

  scheduleStorageWrite(key, val, 50)

  // In-memory read via getStorageItem returns value immediately
  expect(getStorageItem(key)).toBe(JSON.stringify(val))

  // Wait for debounced write to complete
  await new Promise((res) => setTimeout(res, 80))

  expect(localStorage.getItem(key)).toBe(JSON.stringify(val))
})

test('flushPendingStorageWrites flushes all pending debounced writes synchronously', () => {
  const key = 'test_flush_key'
  scheduleStorageWrite(key, 'flush_value', 1000)

  expect(getStorageItem(key)).toBe('flush_value')

  flushPendingStorageWrites()

  expect(localStorage.getItem(key)).toBe('flush_value')
})
