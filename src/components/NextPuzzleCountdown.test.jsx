// @vitest-environment jsdom
import { test, expect, beforeEach, afterEach, vi, describe } from 'vitest'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import NextPuzzleCountdown from './NextPuzzleCountdown'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('NextPuzzleCountdown component', () => {
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

  test('renders countdown label and formatted time correctly', () => {
    const nowMs = Date.UTC(2026, 9, 1, 23, 59, 50, 0)
    vi.setSystemTime(nowMs)

    act(() => {
      root.render(
        React.createElement(NextPuzzleCountdown, {
          dailyDate: '2026-10-01',
          onRefresh: vi.fn(),
        })
      )
    })

    const countdownBar = container.querySelector('.next-puzzle-countdown-bar')
    expect(countdownBar).toBeTruthy()

    const label = container.querySelector('.countdown-label')
    expect(label.textContent).toBe('Next Daily Puzzle In:')

    const value = container.querySelector('.countdown-value')
    expect(value.textContent).toBe('00:00:10')

    const refreshBtn = container.querySelector('.refresh-puzzle-btn')
    expect(refreshBtn).toBeNull()
  })

  test('ticks down every second', () => {
    const nowMs = Date.UTC(2026, 9, 1, 23, 59, 58, 0)
    vi.setSystemTime(nowMs)

    act(() => {
      root.render(
        React.createElement(NextPuzzleCountdown, {
          dailyDate: '2026-10-01',
          onRefresh: vi.fn(),
        })
      )
    })

    const value = container.querySelector('.countdown-value')
    expect(value.textContent).toBe('00:00:02')

    // Advance 1 second
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(value.textContent).toBe('00:00:01')

    // Advance another second
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(value.textContent).toBe('00:00:00')
  })

  test('renders refresh button when expired and calls onRefresh when clicked', () => {
    const nowMs = Date.UTC(2026, 9, 2, 0, 0, 5, 0) // Past midnight of 2026-10-01
    vi.setSystemTime(nowMs)

    const onRefreshMock = vi.fn()

    act(() => {
      root.render(
        React.createElement(NextPuzzleCountdown, {
          dailyDate: '2026-10-01',
          onRefresh: onRefreshMock,
        })
      )
    })

    const value = container.querySelector('.countdown-value')
    expect(value.textContent).toBe('00:00:00')

    const refreshBtn = container.querySelector('.refresh-puzzle-btn')
    expect(refreshBtn).toBeTruthy()
    expect(refreshBtn.textContent).toContain('Load New Daily Puzzle')

    act(() => {
      refreshBtn.click()
    })

    expect(onRefreshMock).toHaveBeenCalledTimes(1)
  })

  test('updates when dailyDate prop changes', () => {
    const nowMs = Date.UTC(2026, 9, 1, 12, 0, 0, 0)
    vi.setSystemTime(nowMs)

    const onRefreshMock = vi.fn()

    act(() => {
      root.render(
        React.createElement(NextPuzzleCountdown, {
          dailyDate: '2026-10-01',
          onRefresh: onRefreshMock,
        })
      )
    })

    const value = container.querySelector('.countdown-value')
    expect(value.textContent).toBe('12:00:00')

    // Change dailyDate prop to target a date further in future
    act(() => {
      root.render(
        React.createElement(NextPuzzleCountdown, {
          dailyDate: '2026-10-02',
          onRefresh: onRefreshMock,
        })
      )
    })

    // Target for 2026-10-02 midnight UTC is 2026-10-03 00:00:00 UTC (36 hours from now)
    expect(value.textContent).toBe('36:00:00')
  })

  test('timer ticks do not re-render parent component', () => {
    const nowMs = Date.UTC(2026, 9, 1, 23, 59, 58, 0)
    vi.setSystemTime(nowMs)

    let parentRenderCount = 0

    function ParentComponent() {
      parentRenderCount++
      return React.createElement(NextPuzzleCountdown, {
        dailyDate: '2026-10-01',
        onRefresh: vi.fn(),
      })
    }

    act(() => {
      root.render(React.createElement(ParentComponent))
    })

    expect(parentRenderCount).toBe(1)
    expect(container.querySelector('.countdown-value').textContent).toBe('00:00:02')

    // Advance 1 second
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(container.querySelector('.countdown-value').textContent).toBe('00:00:01')
    expect(parentRenderCount).toBe(1)
  })
})

