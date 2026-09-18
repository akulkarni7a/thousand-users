/**
 * Formats a timestamp or Date object into a YYYY-MM-DD date string (local time).
 * @param {string|number|Date} dateInput
 * @returns {string|null} YYYY-MM-DD or null if invalid
 */
export function formatDayString(dateInput) {
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Calculates current active streak (consecutive active days up to today or yesterday).
 * @param {Array<string|number>} activityLogs - List of activity timestamps/ISO strings
 * @param {Date} [referenceDate] - Date to calculate relative to (defaults to current time)
 * @returns {number} Active streak count in days
 */
export function calculateStreak(activityLogs = [], referenceDate = new Date()) {
  if (!Array.isArray(activityLogs) || activityLogs.length === 0) {
    return 0
  }

  const activeDaysSet = new Set()
  activityLogs.forEach((log) => {
    const dayStr = formatDayString(log)
    if (dayStr) activeDaysSet.add(dayStr)
  })

  if (activeDaysSet.size === 0) return 0

  const todayStr = formatDayString(referenceDate)
  const yesterday = new Date(referenceDate)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = formatDayString(yesterday)

  let startCheckDate = null
  if (activeDaysSet.has(todayStr)) {
    startCheckDate = new Date(referenceDate)
  } else if (activeDaysSet.has(yesterdayStr)) {
    startCheckDate = yesterday
  } else {
    return 0
  }

  let streak = 0
  const curr = new Date(startCheckDate)

  while (true) {
    const currStr = formatDayString(curr)
    if (activeDaysSet.has(currStr)) {
      streak++
      curr.setDate(curr.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

/**
 * Calculates unique active days in the trailing 7 days (including reference date).
 * @param {Array<string|number>} activityLogs
 * @param {Date} [referenceDate]
 * @returns {number} Number of active days in the last 7 days (0 - 7)
 */
export function calculateWeeklyActiveDays(activityLogs = [], referenceDate = new Date()) {
  if (!Array.isArray(activityLogs) || activityLogs.length === 0) {
    return 0
  }

  const activeDaysSet = new Set()
  activityLogs.forEach((log) => {
    const dayStr = formatDayString(log)
    if (dayStr) activeDaysSet.add(dayStr)
  })

  let count = 0
  const curr = new Date(referenceDate)
  for (let i = 0; i < 7; i++) {
    const dayStr = formatDayString(curr)
    if (activeDaysSet.has(dayStr)) {
      count++
    }
    curr.setDate(curr.getDate() - 1)
  }

  return count
}

/**
 * Returns complete engagement metrics from activity logs.
 * @param {Array<string|number>} activityLogs
 * @param {Date} [referenceDate]
 * @returns {object} { currentStreak, weeklyActiveDays, totalActiveDays, totalInteractions }
 */
export function getEngagementMetrics(activityLogs = [], referenceDate = new Date()) {
  const currentStreak = calculateStreak(activityLogs, referenceDate)
  const weeklyActiveDays = calculateWeeklyActiveDays(activityLogs, referenceDate)

  const activeDaysSet = new Set()
  activityLogs.forEach((log) => {
    const dayStr = formatDayString(log)
    if (dayStr) activeDaysSet.add(dayStr)
  })

  return {
    currentStreak,
    weeklyActiveDays,
    totalActiveDays: activeDaysSet.size,
    totalInteractions: Array.isArray(activityLogs) ? activityLogs.length : 0,
  }
}
