import { useState, useEffect } from 'react'
import { parseUTCDate } from '../services/streakService.js'

/**
 * Calculates the next UTC midnight timestamp in milliseconds for a target date string or tomorrow.
 * @param {string|Date} [targetDateInput]
 * @returns {number} UTC midnight timestamp in ms
 */
export function getNextPuzzleMidnightUTC(targetDateInput) {
  if (targetDateInput) {
    const targetUtcMs = parseUTCDate(targetDateInput)
    if (targetUtcMs !== null) {
      return targetUtcMs + 24 * 60 * 60 * 1000
    }
  }
  const now = new Date()
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
}

/**
 * Calculates formatted countdown state from current time to targetMs.
 * @param {number} targetMs
 * @returns {Object} Countdown state
 */
export function calculateCountdownState(targetMs) {
  const nowMs = Date.now()
  const diffMs = Math.max(0, targetMs - nowMs)
  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const isExpired = diffMs <= 0

  const formattedHours = String(hours).padStart(2, '0')
  const formattedMinutes = String(minutes).padStart(2, '0')
  const formattedSeconds = String(seconds).padStart(2, '0')
  const formattedTime = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`

  return {
    hours,
    minutes,
    seconds,
    totalSeconds,
    formattedHours,
    formattedMinutes,
    formattedSeconds,
    formattedTime,
    isExpired,
  }
}

/**
 * Custom React hook that manages a 1-second interval ticker and returns formatted countdown state.
 * @param {string|Date|Object} [targetDateOrOptions]
 * @param {Object} [optionsArg]
 * @returns {Object} Countdown state
 */
export function useNextPuzzleCountdown(targetDateOrOptions) {
  let targetDateInput = null

  if (targetDateOrOptions && typeof targetDateOrOptions === 'object' && !(targetDateOrOptions instanceof Date)) {
    targetDateInput = null
  } else {
    targetDateInput = targetDateOrOptions
  }

  const targetMs = getNextPuzzleMidnightUTC(targetDateInput)
  const [countdown, setCountdown] = useState(() => calculateCountdownState(targetMs))

  useEffect(() => {
    let timerId = null

    const tick = () => {
      const nextState = calculateCountdownState(targetMs)
      setCountdown(nextState)
    }

    tick()
    timerId = setInterval(tick, 1000)

    return () => {
      if (timerId) {
        clearInterval(timerId)
      }
    }
  }, [targetMs])

  return countdown
}

export default useNextPuzzleCountdown
