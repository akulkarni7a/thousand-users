/**
 * Pure UTC calendar date utility functions for Gridiron Guesser.
 */

/**
 * Returns a UTC date string in 'YYYY-MM-DD' format.
 * @param {Date|string|number} [date=new Date()]
 * @returns {string}
 */
export function getUTCTodayString(date = new Date()) {
  const d = new Date(date)
  if (isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 10)
  }
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Computes calendar day difference (dateStr1 - dateStr2) in UTC days.
 * E.g. dateStr1="2026-09-27", dateStr2="2026-09-26" => 1 (yesterday)
 * dateStr1="2026-09-27", dateStr2="2026-09-25" => 2 (two days ago)
 * @param {string} dateStr1 - First UTC date string 'YYYY-MM-DD'
 * @param {string} dateStr2 - Second UTC date string 'YYYY-MM-DD'
 * @returns {number|null} Difference in days, or null if invalid inputs
 */
export function getUTCDayDifference(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2 || typeof dateStr1 !== 'string' || typeof dateStr2 !== 'string') {
    return null
  }
  const parts1 = dateStr1.split('-').map(Number)
  const parts2 = dateStr2.split('-').map(Number)
  if (parts1.length !== 3 || parts2.length !== 3) return null

  const [y1, m1, d1] = parts1
  const [y2, m2, d2] = parts2
  if (isNaN(y1) || isNaN(m1) || isNaN(d1) || isNaN(y2) || isNaN(m2) || isNaN(d2)) {
    return null
  }

  const utc1 = Date.UTC(y1, m1 - 1, d1)
  const utc2 = Date.UTC(y2, m2 - 1, d2)
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.round((utc1 - utc2) / msPerDay)
}

/**
 * Calculates remaining time until the next UTC midnight rollover for a given puzzle date.
 * @param {string} [puzzleDateStr] - 'YYYY-MM-DD' puzzle date string (defaults to current UTC date)
 * @param {Date|string|number} [now=new Date()] - Current timestamp
 * @returns {{ totalSeconds: number, hours: number, minutes: number, seconds: number, formatted: string }}
 */
export function getUTCMidnightCountdown(puzzleDateStr, now = new Date()) {
  let current
  if (typeof puzzleDateStr === 'object' && puzzleDateStr instanceof Date) {
    current = puzzleDateStr
    puzzleDateStr = getUTCTodayString(current)
  } else if (typeof puzzleDateStr === 'string' && (puzzleDateStr.includes('T') || puzzleDateStr.includes('Z'))) {
    current = new Date(puzzleDateStr)
    puzzleDateStr = getUTCTodayString(current)
  } else {
    current = new Date(now)
  }

  if (isNaN(current.getTime())) {
    return { totalSeconds: 0, hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00' }
  }

  const dateStr = puzzleDateStr && typeof puzzleDateStr === 'string' && puzzleDateStr.length === 10
    ? puzzleDateStr
    : getUTCTodayString(current)

  const parts = dateStr.split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) {
    return { totalSeconds: 0, hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00' }
  }

  const [y, m, d] = parts
  const nextMidnight = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0, 0))

  const diffMs = nextMidnight.getTime() - current.getTime()
  if (diffMs <= 0) {
    return { totalSeconds: 0, hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00' }
  }

  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (n) => String(n).padStart(2, '0')
  const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`

  return { totalSeconds, hours, minutes, seconds, formatted }
}
