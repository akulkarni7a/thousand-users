import { loadDailyState, WELCOME_STORAGE_KEY } from '../data/nflPlayers'
import { getStorageItem } from './asyncStorage'
import { getUTCTodayString, getUTCDayDifference } from './dateUtils'

export const DEFAULT_STATS = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
  lastPlayedDate: null,
}

export function loadInitialAppState() {
  const todayStr = getUTCTodayString()
  const dailyState = loadDailyState(todayStr)

  let stats = DEFAULT_STATS
  try {
    const savedStats = getStorageItem('gridiron_guesser_stats')
    if (savedStats) {
      const parsed = typeof savedStats === 'string' ? JSON.parse(savedStats) : savedStats
      stats = { ...DEFAULT_STATS, ...parsed }

      if (stats.lastPlayedDate) {
        const dayDiff = getUTCDayDifference(todayStr, stats.lastPlayedDate)
        if (dayDiff === null || dayDiff > 1) {
          stats.currentStreak = 0
        }
      }
    }
  } catch {
    // ignore storage errors
  }

  let isHelpOpen = true
  try {
    const seen = getStorageItem(WELCOME_STORAGE_KEY)
    if (seen) {
      isHelpOpen = false
    }
  } catch {
    // ignore storage errors
  }

  return {
    dailyState,
    stats,
    isHelpOpen,
  }
}
