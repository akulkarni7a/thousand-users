export const WELCOME_STORAGE_KEY = 'gridiron_guesser_welcome_seen'
export const DAILY_STORAGE_KEY = 'gridiron_guesser_daily_state'
export const STATS_STORAGE_KEY = 'gridiron_guesser_stats'

export const DEFAULT_STATS = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
  lastPlayedDate: null,
}

// In-memory cache for fast synchronous storage access
const memoryCache = new Map()

// Cache player attribute comparison results keyed by targetPlayer.id and guess.id
const comparisonsCache = new Map()

/**
 * Clears the in-memory storage cache and comparisons cache (useful for tests or resets).
 */
export function clearMemoryCache() {
  memoryCache.clear()
}

export function clearComparisonsCache() {
  comparisonsCache.clear()
}

/**
 * Memoizes guess comparisons so historical guess rows compute only once upon submission.
 */
export function getMemoizedComparison(guess, targetPlayer, compareFn) {
  if (!guess || !targetPlayer) return null
  const key = `${targetPlayer.id || ''}:${guess.id || guess.name}`
  if (comparisonsCache.has(key)) {
    return comparisonsCache.get(key)
  }
  const comp = compareFn(guess, targetPlayer)
  if (comp) {
    comparisonsCache.set(key, comp)
  }
  return comp
}

/**
 * Executes a local storage write asynchronously using non-blocking browser task scheduling
 * (requestIdleCallback). Fallbacks gracefully to synchronous operation if unavailable.
 */
export function asyncSetItem(key, value) {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
  memoryCache.set(key, stringValue)

  return new Promise((resolve) => {
    const task = () => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, stringValue)
        }
      } catch {
        // ignore storage errors
      }
      resolve()
    }

    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => task(), { timeout: 1000 })
    } else {
      task()
    }
  })
}

/**
 * Executes a local storage removal asynchronously using non-blocking task scheduling.
 */
export function asyncRemoveItem(key) {
  memoryCache.delete(key)

  return new Promise((resolve) => {
    const task = () => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key)
        }
      } catch {
        // ignore storage errors
      }
      resolve()
    }

    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => task(), { timeout: 1000 })
    } else {
      task()
    }
  })
}

/**
 * Reads a value synchronously from memory cache or localStorage.
 */
export function getItemSync(key) {
  if (typeof localStorage !== 'undefined') {
    try {
      const lsVal = localStorage.getItem(key)
      if (lsVal !== null) {
        memoryCache.set(key, lsVal)
        return lsVal
      }
    } catch {
      // ignore
    }
  }
  return memoryCache.get(key) || null
}

/**
 * Consolidates initial storage reads into a single combined initialization pass.
 */
export function loadInitialAppState(dateStr) {
  const todayStr = dateStr || new Date().toISOString().slice(0, 10)

  let welcomeSeen = false
  let dailyState = null
  let stats = DEFAULT_STATS

  try {
    const rawWelcome = getItemSync(WELCOME_STORAGE_KEY)
    const rawDaily = getItemSync(DAILY_STORAGE_KEY)
    const rawStats = getItemSync(STATS_STORAGE_KEY)

    welcomeSeen = !!rawWelcome

    if (rawDaily) {
      const parsed = typeof rawDaily === 'string' ? JSON.parse(rawDaily) : rawDaily
      if (parsed && typeof parsed === 'object' && parsed.date === todayStr) {
        dailyState = {
          date: parsed.date,
          puzzleNum: typeof parsed.puzzleNum === 'number' ? parsed.puzzleNum : null,
          guesses: Array.isArray(parsed.guesses) ? parsed.guesses : [],
          gameStatus: ['IN_PROGRESS', 'WON', 'LOST'].includes(parsed.gameStatus)
            ? parsed.gameStatus
            : 'IN_PROGRESS',
        }
      } else {
        // Purge stale daily state
        asyncRemoveItem(DAILY_STORAGE_KEY)
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(DAILY_STORAGE_KEY)
          }
        } catch {
          // ignore
        }
      }
    }

    if (rawStats) {
      const parsed = typeof rawStats === 'string' ? JSON.parse(rawStats) : rawStats
      if (parsed && typeof parsed === 'object') {
        stats = { ...DEFAULT_STATS, ...parsed }
      }
    }
  } catch {
    // ignore storage errors
  }

  return {
    welcomeSeen,
    dailyState,
    stats,
  }
}
