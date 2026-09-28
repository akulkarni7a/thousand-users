// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import DailyCountdown from './DailyCountdown.jsx'
import { getTimeUntilMidnightUtc } from '../utils/streakUtils.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('DailyCountdown component', () => {
  let container = null
  let root = null

  beforeEach(() => {
    vi.useFakeTimers()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    if (root) {
      act(() => {
        root.unmount()
      })
    }
    if (container) {
      container.remove()
    }
    vi.useRealTimers()
  })

  it('getTimeUntilMidnightUtc returns valid HH:MM:SS string', () => {
    const timeStr = getTimeUntilMidnightUtc()
    expect(timeStr).toMatch(/^\d{2}:\d{2}:\d{2}$/)
  })

  it('renders countdown time and practice CTA button', () => {
    const onPlayPractice = vi.fn()

    act(() => {
      root.render(<DailyCountdown onPlayPractice={onPlayPractice} />)
    })

    const timerElem = container.querySelector('[data-testid="countdown-timer"]')
    expect(timerElem).not.toBeNull()
    expect(timerElem.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/)

    const button = container.querySelector('.countdown-practice-btn')
    expect(button).not.toBeNull()
    expect(button.textContent).toContain('Play Practice Mode')

    act(() => {
      button.click()
    })
    expect(onPlayPractice).toHaveBeenCalledTimes(1)
  })

  it('cleans up interval on unmount without errors', () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')

    act(() => {
      root.render(<DailyCountdown onPlayPractice={() => {}} />)
    })

    act(() => {
      root.unmount()
    })
    root = null

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })
})
