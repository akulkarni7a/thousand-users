// @vitest-environment jsdom
import { test, expect, beforeEach, afterEach, vi } from 'vitest'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import PlayerSearch from './components/PlayerSearch.jsx'
import { NFL_PLAYERS, getSearchResults } from './data/nflPlayers.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container = null
let root = null

beforeEach(() => {
  vi.useFakeTimers()
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
  vi.useRealTimers()
})

test('getSearchResults limits matching players to maximum 10 items', () => {
  const results = getSearchResults(NFL_PLAYERS, 'a')
  expect(results.length).toBeLessThanOrEqual(10)
  expect(results.length).toBe(10)
})

test('typing rapidly updates input instantly but debounces filtering by 150ms', () => {
  const handleSelect = vi.fn()

  act(() => {
    root.render(React.createElement(PlayerSearch, { onSelectPlayer: handleSelect }))
  })

  const input = container.querySelector('.search-input')
  expect(input).toBeTruthy()

  // Focus input to open dropdown
  act(() => {
    input.focus()
    input.dispatchEvent(new Event('focus', { bubbles: true }))
  })

  // Initial state: input empty, starter recommendations displayed
  expect(input.value).toBe('')
  expect(container.textContent).toContain('Starter Recommendations')

  // Simulate typing 'Josh'
  act(() => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set
    nativeInputValueSetter.call(input, 'Josh')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })

  // Immediate input value updates instantly
  expect(input.value).toBe('Josh')
  // But results haven't updated yet before 150ms
  expect(container.textContent).toContain('Starter Recommendations')

  // Advance time by 100ms (less than 150ms debounce)
  act(() => {
    vi.advanceTimersByTime(100)
  })
  expect(container.textContent).toContain('Starter Recommendations')

  // Advance time by another 50ms (total 150ms)
  act(() => {
    vi.advanceTimersByTime(50)
  })

  // Now debounced query updates and displays matching player 'Josh Allen'
  expect(container.textContent).toContain('Josh Allen')
  expect(container.textContent).not.toContain('Starter Recommendations')
})

test('search result list renders at most 10 player items in DOM', () => {
  act(() => {
    root.render(React.createElement(PlayerSearch, { onSelectPlayer: () => {} }))
  })

  const input = container.querySelector('.search-input')

  act(() => {
    input.focus()
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set
    nativeInputValueSetter.call(input, 'a')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })

  act(() => {
    vi.advanceTimersByTime(150)
  })

  const items = container.querySelectorAll('.search-result-item')
  expect(items.length).toBeGreaterThan(0)
  expect(items.length).toBeLessThanOrEqual(10)
})

test('category filter selection updates search results promptly', () => {
  act(() => {
    root.render(React.createElement(PlayerSearch, { onSelectPlayer: () => {} }))
  })

  const qbChip = Array.from(container.querySelectorAll('.filter-chip')).find(
    (chip) => chip.textContent === 'QB'
  )
  expect(qbChip).toBeTruthy()

  act(() => {
    qbChip.click()
  })

  expect(container.textContent).toContain('Recommended QB Players')
  const items = container.querySelectorAll('.search-result-item')
  expect(items.length).toBeLessThanOrEqual(10)
  items.forEach((item) => {
    expect(item.textContent).toContain('QB')
  })
})

test('keyboard navigation cycles through capped search results', () => {
  act(() => {
    root.render(React.createElement(PlayerSearch, { onSelectPlayer: () => {} }))
  })

  const input = container.querySelector('.search-input')
  act(() => {
    input.focus()
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set
    nativeInputValueSetter.call(input, 'a')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })

  act(() => {
    vi.advanceTimersByTime(150)
  })

  const items = container.querySelectorAll('.search-result-item')
  expect(items.length).toBe(10)

  // Initial selection is index 0
  expect(items[0].getAttribute('aria-selected')).toBe('true')

  // Press ArrowDown
  act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
  })
  expect(items[1].getAttribute('aria-selected')).toBe('true')

  // Press ArrowUp to wrap back to 0
  act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
  })
  expect(items[0].getAttribute('aria-selected')).toBe('true')
})

test('hovering over a search result item updates selection smoothly', () => {
  act(() => {
    root.render(React.createElement(PlayerSearch, { onSelectPlayer: () => {} }))
  })

  const input = container.querySelector('.search-input')
  act(() => {
    input.focus()
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set
    nativeInputValueSetter.call(input, 'a')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })

  act(() => {
    vi.advanceTimersByTime(150)
  })

  const items = container.querySelectorAll('.search-result-item')
  expect(items.length).toBe(10)

  // Dispatch mouseover or mouseenter to simulate hover in React 19 synthetic event system
  act(() => {
    items[2].dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }))
    items[2].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }))
  })

  expect(items[2].getAttribute('aria-selected')).toBe('true')
  expect(items[0].getAttribute('aria-selected')).toBe('false')
})
