/**
 * Pure streak accounting service using UTC midnight calculations.
 */

export const DEFAULT_STATS = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
  lastPlayedDate: null,
}

/**
 * Returns a YYYY-MM-DD date string in UTC for the given Date object or current date.
 * @param {Date} [dateObj=new Date()]
 * @returns {string} YYYY-MM-DD
 */
export function getCurrentUTCDateString(dateObj = new Date()) {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj)
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parses a YYYY-MM-DD string or Date into a UTC midnight timestamp in milliseconds.
 * @param {string|Date} dateInput
 * @returns {number} UTC midnight timestamp in ms
 */
export function parseUTCDate(dateInput) {
  if (!dateInput) return null
  if (dateInput instanceof Date) {
    return Date.UTC(dateInput.getUTCFullYear(), dateInput.getUTCMonth(), dateInput.getUTCDate())
  }
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('-').map(Number)
    if (parts.length >= 3 && !parts.some(isNaN)) {
      return Date.UTC(parts[0], parts[1] - 1, parts[2])
    }
    const d = new Date(dateInput)
    if (!isNaN(d.getTime())) {
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    }
  }
  return null
}

/**
 * Calculates calendar day difference in UTC between dateStr1 and dateStr2.
 * Positive value indicates dateStr2 is after dateStr1.
 * @param {string|Date} dateStr1
 * @param {string|Date} dateStr2
 * @returns {number|null} Difference in calendar days
 */
export function getUTCDayDifference(dateStr1, dateStr2) {
  const utc1 = parseUTCDate(dateStr1)
  const utc2 = parseUTCDate(dateStr2)
  if (utc1 === null || utc2 === null) return null
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((utc2 - utc1) / msPerDay)
}

/**
 * Sanitizes stats object by checking if the user missed calendar day(s).
 * If dayDiff > 1, active streak (currentStreak) is reset to 0.
 * @param {Object} stats
 * @param {string} [currentDateStr=getCurrentUTCDateString()]
 * @returns {Object} Sanitized stats copy
 */
export function sanitizeStats(stats, currentDateStr = getCurrentUTCDateString()) {
  if (!stats) return { ...DEFAULT_STATS }
  const currentStats = { ...DEFAULT_STATS, ...stats }
  if (currentStats.lastPlayedDate && currentDateStr) {
    const dayDiff = getUTCDayDifference(currentStats.lastPlayedDate, currentDateStr)
    if (dayDiff !== null && dayDiff > 1) {
      return {
        ...currentStats,
        currentStreak: 0,
      }
    }
  }
  return currentStats
}

/**
 * Pure function to update stats on game end.
 * Practice mode results return prevStats unmodified.
 * @param {Object} prevStats
 * @param {Object} options
 * @param {boolean} options.isWin
 * @param {boolean} [options.isDaily=true]
 * @param {number} [options.numGuesses]
 * @param {string} [options.dateStr=getCurrentUTCDateString()]
 * @returns {Object} Updated stats
 */
export function updateStatsOnGameEnd(
  prevStats,
  { isWin, isDaily = true, numGuesses, dateStr = getCurrentUTCDateString() }
) {
  if (!isDaily) {
    return prevStats || { ...DEFAULT_STATS }
  }

  const sanitized = sanitizeStats(prevStats, dateStr)
  const isNewDay = sanitized.lastPlayedDate !== dateStr

  const newPlayed = sanitized.played + 1
  const newWon = isWin ? sanitized.won + 1 : sanitized.won

  let newStreak = sanitized.currentStreak
  if (isWin) {
    if (isNewDay) {
      newStreak = sanitized.currentStreak + 1
    }
  } else {
    newStreak = 0
  }

  const newMaxStreak = Math.max(sanitized.maxStreak || 0, newStreak)
  const newDist = { ...(sanitized.guessDistribution || DEFAULT_STATS.guessDistribution) }
  if (isWin && typeof numGuesses === 'number' && numGuesses >= 1 && numGuesses <= 8) {
    newDist[numGuesses] = (newDist[numGuesses] || 0) + 1
  }

  return {
    played: newPlayed,
    won: newWon,
    currentStreak: newStreak,
    maxStreak: newMaxStreak,
    guessDistribution: newDist,
    lastPlayedDate: dateStr,
  }
}
