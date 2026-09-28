/**
 * Pure utility module for calculating daily streaks and statistics
 * with strict UTC calendar day continuity.
 */

/**
 * Returns the UTC calendar day index (integer number of days since unix epoch)
 * for a given date input (ISO string, YYYY-MM-DD string, or Date object).
 * Returns null if input is invalid.
 */
export function getUtcCalendarDayIndex(dateInput) {
  if (!dateInput) return null

  if (typeof dateInput === 'string') {
    const match = dateInput.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      const year = parseInt(match[1], 10)
      const month = parseInt(match[2], 10) - 1
      const day = parseInt(match[3], 10)
      return Math.floor(Date.UTC(year, month, day) / 86400000)
    }
  }

  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return null
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86400000)
}

/**
 * Computes integer difference in UTC calendar days (date2 - date1).
 * Example:
 * date1 = '2026-09-27', date2 = '2026-09-28' -> returns 1
 * date1 = '2026-09-25', date2 = '2026-09-28' -> returns 3
 * date1 = '2026-09-28', date2 = '2026-09-28' -> returns 0
 */
export function getUtcCalendarDayDiff(dateStr1, dateStr2) {
  const index1 = getUtcCalendarDayIndex(dateStr1)
  const index2 = getUtcCalendarDayIndex(dateStr2)
  if (index1 === null || index2 === null) return null
  return index2 - index1
}

/**
 * Returns current UTC date formatted as YYYY-MM-DD string.
 */
export function getTodayUtcString() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Calculates formatted time remaining until midnight UTC (00:00:00 UTC).
 * Format: HH:MM:SS
 */
export function getTimeUntilMidnightUtc() {
  const now = new Date()
  const nextMidnightUtc = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0
    )
  )
  const totalSeconds = Math.max(0, Math.floor((nextMidnightUtc.getTime() - now.getTime()) / 1000))
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(Math.floor(totalSeconds % 60)).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

/**
 * Evaluates streak expiration when hydrating app state on boot/load.
 * Resets currentStreak to 0 if lastPlayedDate is older than 1 UTC calendar day ago.
 */
export function checkStreakExpiration(stats, currentDateStr = getTodayUtcString()) {
  const defaultStats = {
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
    lastPlayedDate: null,
  }

  if (!stats) return defaultStats

  const merged = { ...defaultStats, ...stats }

  if (!merged.lastPlayedDate) {
    return merged
  }

  const diff = getUtcCalendarDayDiff(merged.lastPlayedDate, currentDateStr)
  if (diff !== null && diff > 1) {
    return {
      ...merged,
      currentStreak: 0,
    }
  }

  return merged
}

/**
 * Calculates updated user statistics after a game completes.
 * Daily mode enforces UTC calendar day streak rules.
 * Practice mode preserves currentStreak, maxStreak, and lastPlayedDate.
 */
export function calculateUpdatedStats(
  prevStats,
  { isWin, gameMode = 'daily', currentDateStr = getTodayUtcString(), numGuesses }
) {
  const baseStats = prevStats || {
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
    lastPlayedDate: null,
  }

  const newPlayed = baseStats.played + 1
  const newWon = isWin ? baseStats.won + 1 : baseStats.won

  const newDist = { ...(baseStats.guessDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 }) }
  if (isWin && typeof numGuesses === 'number' && numGuesses >= 1 && numGuesses <= 8) {
    newDist[numGuesses] = (newDist[numGuesses] || 0) + 1
  }

  // Practice mode: preserve streak and lastPlayedDate
  if (gameMode === 'practice') {
    return {
      ...baseStats,
      played: newPlayed,
      won: newWon,
      guessDistribution: newDist,
    }
  }

  // Daily mode: update streak based on UTC calendar day difference
  let newStreak = baseStats.currentStreak

  if (!isWin) {
    newStreak = 0
  } else {
    if (!baseStats.lastPlayedDate) {
      newStreak = 1
    } else {
      const diff = getUtcCalendarDayDiff(baseStats.lastPlayedDate, currentDateStr)
      if (diff === 1) {
        // Consecutive UTC calendar day win
        newStreak = baseStats.currentStreak + 1
      } else if (diff !== null && diff > 1) {
        // Skipped 1 or more UTC calendar days -> reset streak to 1 on win
        newStreak = 1
      } else if (diff === 0) {
        // Same UTC calendar day win
        newStreak = baseStats.currentStreak === 0 ? 1 : baseStats.currentStreak
      } else {
        // Historical or fallback
        newStreak = baseStats.currentStreak === 0 ? 1 : baseStats.currentStreak
      }
    }
  }

  const newMaxStreak = Math.max(baseStats.maxStreak || 0, newStreak)

  return {
    played: newPlayed,
    won: newWon,
    currentStreak: newStreak,
    maxStreak: newMaxStreak,
    guessDistribution: newDist,
    lastPlayedDate: currentDateStr,
  }
}
