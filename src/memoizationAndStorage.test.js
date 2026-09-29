// @vitest-environment jsdom
import { test, expect, beforeEach, vi } from 'vitest'
import React, { act } from 'react'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

import { createRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import GuessGrid from './components/GuessGrid.jsx'
import PlayerSearch from './components/PlayerSearch.jsx'
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

test('GuessGrid does not recompute comparePlayers for existing unchanged rows when new guesses are added', () => {
  const p1 = nflPlayers.NFL_PLAYERS[0]
  const p2 = nflPlayers.NFL_PLAYERS[1]
  const target = nflPlayers.NFL_PLAYERS[2]

  const spy = vi.spyOn(nflPlayers, 'comparePlayers')

  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  // Initial render with 1 guess
  act(() => {
    root.render(React.createElement(GuessGrid, { guesses: [p1], targetPlayer: target }))
  })

  const initialCallCount = spy.mock.calls.length
  expect(initialCallCount).toBeGreaterThan(0)

  // Re-render with 2 guesses (p1 + p2)
  act(() => {
    root.render(React.createElement(GuessGrid, { guesses: [p1, p2], targetPlayer: target }))
  })

  // Since p1 row was memoized and unchanged, comparePlayers should only be called for p2 (1 additional call)
  expect(spy.mock.calls.length).toBe(initialCallCount + 1)

  act(() => {
    root.unmount()
  })
  container.remove()
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

test('event listeners for beforeunload, pagehide, and visibilitychange flush pending writes', () => {
  // Test beforeunload
  scheduleStorageWrite('event_test_beforeunload', 'val1', 1000)
  expect(getStorageItem('event_test_beforeunload')).toBe('val1')
  expect(localStorage.getItem('event_test_beforeunload')).toBeNull()

  window.dispatchEvent(new Event('beforeunload'))
  expect(localStorage.getItem('event_test_beforeunload')).toBe('val1')

  // Test pagehide
  scheduleStorageWrite('event_test_pagehide', 'val2', 1000)
  expect(getStorageItem('event_test_pagehide')).toBe('val2')
  expect(localStorage.getItem('event_test_pagehide')).toBeNull()

  window.dispatchEvent(new Event('pagehide'))
  expect(localStorage.getItem('event_test_pagehide')).toBe('val2')

  // Test visibilitychange (when hidden)
  scheduleStorageWrite('event_test_visibility', 'val3', 1000)
  expect(getStorageItem('event_test_visibility')).toBe('val3')
  expect(localStorage.getItem('event_test_visibility')).toBeNull()

  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => 'hidden',
  })
  document.dispatchEvent(new Event('visibilitychange'))
  expect(localStorage.getItem('event_test_visibility')).toBe('val3')
})

test('scheduleStorageWrite supports requestIdleCallback and properly cancels pending callbacks', async () => {
  let idleCallbackId = 0
  const idleCallbacks = new Map()

  const origRequestIdle = window.requestIdleCallback
  const origCancelIdle = window.cancelIdleCallback

  window.requestIdleCallback = vi.fn((cb, _options) => {
    idleCallbackId++
    const id = idleCallbackId
    const timer = setTimeout(() => {
      if (idleCallbacks.has(id)) {
        idleCallbacks.delete(id)
        cb({ didTimeout: false, timeRemaining: () => 50 })
      }
    }, 50)
    idleCallbacks.set(id, timer)
    return id
  })

  window.cancelIdleCallback = vi.fn((id) => {
    if (idleCallbacks.has(id)) {
      clearTimeout(idleCallbacks.get(id))
      idleCallbacks.delete(id)
    }
  })

  try {
    const key = 'test_idle_key'
    scheduleStorageWrite(key, 'idle_value1', 100)
    expect(window.requestIdleCallback).toHaveBeenCalled()

    // Reschedule before it executes to trigger cancelIdleCallback
    scheduleStorageWrite(key, 'idle_value2', 100)
    expect(window.cancelIdleCallback).toHaveBeenCalled()

    // Flush pending writes
    flushPendingStorageWrites()
    expect(localStorage.getItem(key)).toBe('idle_value2')
  } finally {
    window.requestIdleCallback = origRequestIdle
    window.cancelIdleCallback = origCancelIdle
  }
})

test('getSearchResults starter suggestions do not invoke Array.prototype.sort at runtime', () => {
  const sortSpy = vi.spyOn(Array.prototype, 'sort')
  sortSpy.mockClear()

  const results = nflPlayers.getSearchResults(nflPlayers.NFL_PLAYERS, '')
  expect(results.length).toBeGreaterThan(0)
  expect(sortSpy).not.toHaveBeenCalled()

  sortSpy.mockRestore()
})

test('PlayerSearch reuses memoized search results when guessedIds reference matches', () => {
  const spy = vi.spyOn(nflPlayers, 'getSearchResults')
  spy.mockClear()

  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  const guessedIds = ['1', '2']

  act(() => {
    root.render(React.createElement(PlayerSearch, { onSelectPlayer: () => {}, guessedIds }))
  })

  const initialCallCount = spy.mock.calls.length

  // Re-render with identical guessedIds array reference
  act(() => {
    root.render(React.createElement(PlayerSearch, { onSelectPlayer: () => {}, guessedIds }))
  })

  // Search results should be reused without re-executing getSearchResults
  expect(spy.mock.calls.length).toBe(initialCallCount)

  // Re-render with new guessedIds array reference
  act(() => {
    root.render(React.createElement(PlayerSearch, { onSelectPlayer: () => {}, guessedIds: ['1', '2', '3'] }))
  })

  // getSearchResults should re-evaluate
  expect(spy.mock.calls.length).toBeGreaterThan(initialCallCount)

  act(() => {
    root.unmount()
  })
  container.remove()
  spy.mockRestore()
})

test('App preserves guessedIds reference equality across re-renders when guesses state is unchanged', () => {
  const spy = vi.spyOn(nflPlayers, 'getSearchResults')
  spy.mockClear()

  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  act(() => {
    root.render(React.createElement(App))
  })

  const initialCallCount = spy.mock.calls.length

  // Toggle help modal or stats modal in App
  const helpBtn = container.querySelector('button[title="How to Play"]')
  if (helpBtn) {
    act(() => {
      helpBtn.click()
    })
  }

  // PlayerSearch getSearchResults should NOT re-evaluate during modal toggles
  expect(spy.mock.calls.length).toBe(initialCallCount)

  act(() => {
    root.unmount()
  })
  container.remove()
  spy.mockRestore()
})
