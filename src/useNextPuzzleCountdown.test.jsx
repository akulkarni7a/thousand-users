// @vitest-environment jsdom
import { test, expect, beforeEach, afterEach, vi, describe } from 'vitest'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import {
  useNextPuzzleCountdown,
  getNextPuzzleMidnightUTC,
  calculateCountdownState,
} from './hooks/useNextPuzzleCountdown.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('useNextPuzzleCountdown hook', () => {
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
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  test('getNextPuzzleMidnightUTC returns next day midnight UTC timestamp', () => {
    const targetMs = getNextPuzzleMidnightUTC('2026-10-01')
    expect(targetMs).toBe(Date.UTC(2026, 9, 2, 0, 0, 0, 0))
  })

  test('calculateCountdownState accurately calculates formatted hours, minutes, seconds', () => {
    const nowMs = Date.UTC(2026, 9, 1, 22, 15, 30, 0)
    vi.setSystemTime(nowMs)

    const targetMs = Date.UTC(2026, 9, 2, 0, 0, 0, 0)
    const state = calculateCountdownState(targetMs)

    expect(state.hours).toBe(1)
    expect(state.minutes).toBe(44)
    expect(state.seconds).toBe(30)
    expect(state.formattedTime).toBe('01:44:30')
    expect(state.isExpired).toBe(false)
  })

  test('useNextPuzzleCountdown ticks down every second and cleans up interval on unmount', () => {
    const nowMs = Date.UTC(2026, 9, 1, 23, 59, 58, 0)
    vi.setSystemTime(nowMs)

    let latestCountdown = null

    function TestComponent() {
      const countdown = useNextPuzzleCountdown('2026-10-01')
      React.useEffect(() => {
        latestCountdown = countdown
      }, [countdown])
      return React.createElement('div', { id: 'timer' }, countdown.formattedTime)
    }

    act(() => {
      root.render(React.createElement(TestComponent))
    })

    expect(container.querySelector('#timer').textContent).toBe('00:00:02')

    // Advance 1 second
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(container.querySelector('#timer').textContent).toBe('00:00:01')

    // Advance 1 second -> reaches midnight
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(container.querySelector('#timer').textContent).toBe('00:00:00')
    expect(latestCountdown.isExpired).toBe(true)

    // Verify cleanup on unmount
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')
    act(() => {
      root.unmount()
    })
    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  test('useNextPuzzleCountdown with enabled: false returns initial time without starting interval', () => {
    const nowMs = Date.UTC(2026, 9, 1, 23, 59, 58, 0)
    vi.setSystemTime(nowMs)

    const setIntervalSpy = vi.spyOn(window, 'setInterval')

    function DisabledComponent() {
      const countdown = useNextPuzzleCountdown('2026-10-01', { enabled: false })
      return React.createElement('div', { id: 'timer' }, countdown.formattedTime)
    }

    act(() => {
      root.render(React.createElement(DisabledComponent))
    })

    expect(container.querySelector('#timer').textContent).toBe('00:00:02')
    expect(setIntervalSpy).not.toHaveBeenCalled()

    // Advance 5 seconds - text should remain unchanged because interval is not running
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(container.querySelector('#timer').textContent).toBe('00:00:02')
  })

  test('useNextPuzzleCountdown starts and stops interval when enabled prop changes dynamically', () => {
    const nowMs = Date.UTC(2026, 9, 1, 23, 59, 58, 0)
    vi.setSystemTime(nowMs)

    function DynamicComponent({ enabled }) {
      const countdown = useNextPuzzleCountdown('2026-10-01', { enabled })
      return React.createElement('div', { id: 'timer' }, countdown.formattedTime)
    }

    act(() => {
      root.render(React.createElement(DynamicComponent, { enabled: false }))
    })

    expect(container.querySelector('#timer').textContent).toBe('00:00:02')

    // Advance 1 second while disabled
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(container.querySelector('#timer').textContent).toBe('00:00:02')

    // Enable hook
    act(() => {
      root.render(React.createElement(DynamicComponent, { enabled: true }))
    })

    // On enable, tick updates time immediately
    expect(container.querySelector('#timer').textContent).toBe('00:00:01')

    // Advance 1 second while enabled
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(container.querySelector('#timer').textContent).toBe('00:00:00')

    // Disable hook again
    act(() => {
      root.render(React.createElement(DynamicComponent, { enabled: false }))
    })

    // Advance 5 seconds while disabled
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(container.querySelector('#timer').textContent).toBe('00:00:00')
  })
})
