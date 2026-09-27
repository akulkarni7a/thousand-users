import { scheduleStorageWrite } from './asyncStorage.js'
import {
  getDailyPlayer,
  getRandomPlayer,
  getPuzzleNumber,
  getDateFromPuzzleNumber,
  loadDailyState,
} from '../data/nflPlayers.js'

export const REFERRAL_STORAGE_KEY = 'gridiron_guesser_referral_context'

export { getDateFromPuzzleNumber, getPuzzleNumber }

/**
 * Parses query search string or URL object to extract search parameters.
 * Operates cleanly in browser and non-browser unit test environments.
 */
function getSearchParams(input) {
  try {
    if (typeof input === 'string') {
      const qIndex = input.indexOf('?')
      const str = qIndex !== -1 ? input.slice(qIndex) : (input.includes('=') ? input : '')
      return new URLSearchParams(str)
    }
    if (input && typeof input === 'object') {
      if (input instanceof URLSearchParams) return input
      if (typeof input.search === 'string') return new URLSearchParams(input.search)
    }
    if (typeof window !== 'undefined' && window.location && typeof window.location.search === 'string') {
      return new URLSearchParams(window.location.search)
    }
  } catch {
    // ignore parsing errors
  }
  return new URLSearchParams('')
}

/**
 * Extracts referral UTM parameters (utm_source, utm_medium, utm_campaign).
 * Returns referral context object or null if no UTM parameters are present.
 */
export function extractReferralContext(input) {
  const searchParams = getSearchParams(input)

  const utm_source = searchParams.get('utm_source')
  const utm_medium = searchParams.get('utm_medium')
  const utm_campaign = searchParams.get('utm_campaign')

  if (!utm_source && !utm_medium && !utm_campaign) {
    return null
  }

  const referralContext = {}
  if (utm_source) referralContext.utm_source = utm_source
  if (utm_medium) referralContext.utm_medium = utm_medium
  if (utm_campaign) referralContext.utm_campaign = utm_campaign
  referralContext.timestamp = new Date().toISOString()

  return referralContext
}

/**
 * Schedule non-blocking storage write of referral context in asyncStorage.
 */
export function saveReferralContext(referralData) {
  if (!referralData) return
  try {
    scheduleStorageWrite(REFERRAL_STORAGE_KEY, referralData)
  } catch {
    // ignore storage errors
  }
}

/**
 * Clean URL search parameters in browser environments without page reload.
 */
export function cleanUrlParameters() {
  if (
    typeof window !== 'undefined' &&
    window.history &&
    typeof window.history.replaceState === 'function'
  ) {
    try {
      if (window.location && window.location.search) {
        const docTitle = typeof window !== 'undefined' && window.document ? window.document.title || '' : (typeof document !== 'undefined' && document ? document.title || '' : '')
        const cleanUrl = (window.location.pathname || '/') + (window.location.hash || '')
        window.history.replaceState({}, docTitle, cleanUrl)
      }
    } catch {
      // ignore history errors
    }
  }
}

/**
 * Parses deep link parameters, validates puzzle routes, extracts referral UTM data,
 * and builds initial game route state.
 */
export function parseDeepLink(inputUrlOrSearch) {
  const searchParams = getSearchParams(inputUrlOrSearch)

  const todayStr = new Date().toISOString().slice(0, 10)
  const defaultPuzzleNum = getPuzzleNumber(todayStr)

  let gameMode = 'daily'
  let puzzleNum = defaultPuzzleNum
  let targetDate = todayStr
  let targetPlayer = null
  let guesses = []
  let gameStatus = 'IN_PROGRESS'
  let isDeepLink = false

  const rawMode = searchParams.get('mode')
  const rawPuzzle = searchParams.get('puzzle')

  if (rawMode === 'practice') {
    gameMode = 'practice'
    targetPlayer = getRandomPlayer()
    isDeepLink = true
  } else if (rawMode === 'daily' || rawPuzzle) {
    gameMode = 'daily'
    if (rawPuzzle) {
      const parsedNum = typeof rawPuzzle === 'number' ? rawPuzzle : parseInt(rawPuzzle, 10)
      if (!isNaN(parsedNum) && parsedNum >= 1) {
        const derivedDate = getDateFromPuzzleNumber(parsedNum)
        if (derivedDate) {
          puzzleNum = parsedNum
          targetDate = derivedDate
          isDeepLink = true
        }
      }
    }
    if (rawMode === 'daily' && !rawPuzzle) {
      isDeepLink = true
    }
  }

  if (!targetPlayer) {
    targetPlayer = getDailyPlayer(targetDate)
  }

  if (gameMode === 'daily') {
    const saved = loadDailyState(targetDate)
    if (saved) {
      guesses = Array.isArray(saved.guesses) ? saved.guesses : []
      gameStatus = ['IN_PROGRESS', 'WON', 'LOST'].includes(saved.gameStatus)
        ? saved.gameStatus
        : 'IN_PROGRESS'
    }
  }

  // Extract & save referral context if present
  const referralContext = extractReferralContext(searchParams)
  if (referralContext) {
    saveReferralContext(referralContext)
  }

  return {
    gameMode,
    puzzleNum,
    targetDate,
    targetPlayer,
    guesses,
    gameStatus,
    referralContext,
    isDeepLink,
  }
}
