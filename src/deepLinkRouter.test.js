import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  parseDeepLink,
  saveReferralContext,
  getStoredReferralContext,
  extractReferralContext,
  getDateFromPuzzleNumber,
  cleanUrlParameters,
  REFERRAL_STORAGE_KEY,
} from './utils/deepLinkRouter.js'
import {
  getStorageItem,
  flushPendingStorageWrites,
  removeStorageItem,
} from './utils/asyncStorage.js'
import { getDailyPlayer } from './data/nflPlayers.js'

if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.setItem) {
  let store = {}
  globalThis.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => {
      store[key] = String(val)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
}

describe('deepLinkRouter utility module', () => {
  beforeEach(() => {
    removeStorageItem(REFERRAL_STORAGE_KEY)
    flushPendingStorageWrites()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getDateFromPuzzleNumber', () => {
    it('converts puzzle number 1 to 2026-01-01', () => {
      expect(getDateFromPuzzleNumber(1)).toBe('2026-01-01')
      expect(getDateFromPuzzleNumber('1')).toBe('2026-01-01')
    })

    it('converts puzzle number 42 to 2026-02-11', () => {
      expect(getDateFromPuzzleNumber(42)).toBe('2026-02-11')
      expect(getDateFromPuzzleNumber('42')).toBe('2026-02-11')
    })

    it('returns null for non-positive or invalid puzzle numbers', () => {
      expect(getDateFromPuzzleNumber(0)).toBeNull()
      expect(getDateFromPuzzleNumber(-5)).toBeNull()
      expect(getDateFromPuzzleNumber('invalid')).toBeNull()
      expect(getDateFromPuzzleNumber(null)).toBeNull()
      expect(getDateFromPuzzleNumber(undefined)).toBeNull()
    })
  })

  describe('extractReferralContext', () => {
    it('extracts all UTM parameters when present', () => {
      const query = '?utm_source=share_card&utm_medium=social&utm_campaign=daily_challenge'
      const context = extractReferralContext(query)

      expect(context).toBeDefined()
      expect(context.utm_source).toBe('share_card')
      expect(context.utm_medium).toBe('social')
      expect(context.utm_campaign).toBe('daily_challenge')
      expect(context.timestamp).toBeDefined()
    })

    it('extracts partial UTM parameters', () => {
      const query = '?utm_source=share_card&utm_campaign=practice_mode'
      const context = extractReferralContext(query)

      expect(context).toBeDefined()
      expect(context.utm_source).toBe('share_card')
      expect(context.utm_medium).toBeUndefined()
      expect(context.utm_campaign).toBe('practice_mode')
    })

    it('returns null when no UTM parameters are in query string', () => {
      const query = '?mode=daily&puzzle=42'
      expect(extractReferralContext(query)).toBeNull()
    })
  })

  describe('saveReferralContext', () => {
    it('persists referral context to asyncStorage under gridiron_guesser_referral_context', () => {
      const data = { utm_source: 'twitter', utm_medium: 'social', utm_campaign: 'viral' }
      saveReferralContext(data)
      flushPendingStorageWrites()

      const savedStr = getStorageItem(REFERRAL_STORAGE_KEY)
      expect(savedStr).toBeDefined()
      const savedObj = JSON.parse(savedStr)
      expect(savedObj.utm_source).toBe('twitter')
      expect(savedObj.utm_medium).toBe('social')
      expect(savedObj.utm_campaign).toBe('viral')
    })

    it('fails safely when null or empty data is provided', () => {
      expect(() => saveReferralContext(null)).not.toThrow()
      expect(() => saveReferralContext(undefined)).not.toThrow()
    })
  })

  describe('getStoredReferralContext', () => {
    it('returns null when storage contains no referral context', () => {
      expect(getStoredReferralContext()).toBeNull()
    })

    it('retrieves saved referral context from local storage', () => {
      const data = { utm_source: 'twitter', utm_medium: 'social', utm_campaign: 'launch' }
      saveReferralContext(data)
      expect(getStoredReferralContext()).toMatchObject(data)
    })

    it('handles invalid or corrupted JSON in storage gracefully', () => {
      globalThis.localStorage.setItem(REFERRAL_STORAGE_KEY, '{invalid_json_string')
      expect(getStoredReferralContext()).toBeNull()
    })
  })

  describe('parseDeepLink', () => {
    it('parses social media viral referral arrival with daily mode and puzzle number', () => {
      const url =
        'https://gridiron-guesser.app?utm_source=share_card&utm_medium=social&utm_campaign=daily_challenge&mode=daily&puzzle=42'
      const result = parseDeepLink(url)

      expect(result.gameMode).toBe('daily')
      expect(result.puzzleNum).toBe(42)
      expect(result.targetDate).toBe('2026-02-11')
      expect(result.targetPlayer).toEqual(getDailyPlayer('2026-02-11'))
      expect(result.referralContext).toMatchObject({
        utm_source: 'share_card',
        utm_medium: 'social',
        utm_campaign: 'daily_challenge',
      })
      expect(result.isDeepLink).toBe(true)

      flushPendingStorageWrites()
      const saved = getStorageItem(REFERRAL_STORAGE_KEY)
      expect(saved).toContain('daily_challenge')
    })

    it('parses practice challenge deep link arrival', () => {
      const url = '?utm_source=share_card&utm_campaign=practice_mode&mode=practice'
      const result = parseDeepLink(url)

      expect(result.gameMode).toBe('practice')
      expect(result.targetPlayer).toBeDefined()
      expect(result.guesses).toEqual([])
      expect(result.gameStatus).toBe('IN_PROGRESS')
      expect(result.referralContext).toMatchObject({
        utm_source: 'share_card',
        utm_campaign: 'practice_mode',
      })
      expect(result.isDeepLink).toBe(true)

      flushPendingStorageWrites()
      const saved = getStorageItem(REFERRAL_STORAGE_KEY)
      expect(saved).toContain('practice_mode')
    })

    it('parses practice challenge deep link with target player parameter and binds player context', () => {
      const url = '?utm_source=share_card&utm_campaign=practice_mode&mode=practice&player=3'
      const result = parseDeepLink(url)

      expect(result.gameMode).toBe('practice')
      expect(result.targetPlayer).toBeDefined()
      expect(String(result.targetPlayer.id)).toBe('3')
      expect(result.targetPlayer.name).toBe('Josh Allen')
      expect(result.isDeepLink).toBe(true)
    })

    it('falls back safely to random player when practice player ID is invalid or non-matching', () => {
      const urlInvalid = '?mode=practice&player=99999'
      const resultInvalid = parseDeepLink(urlInvalid)

      expect(resultInvalid.gameMode).toBe('practice')
      expect(resultInvalid.targetPlayer).toBeDefined()
      expect(resultInvalid.isDeepLink).toBe(true)

      const urlNonNumeric = '?mode=practice&player=invalid_id'
      const resultNonNumeric = parseDeepLink(urlNonNumeric)

      expect(resultNonNumeric.gameMode).toBe('practice')
      expect(resultNonNumeric.targetPlayer).toBeDefined()
      expect(resultNonNumeric.isDeepLink).toBe(true)
    })

    it('falls back gracefully on invalid mode or invalid puzzle number', () => {
      const invalidUrl = '?mode=unknown_mode&puzzle=-999'
      const result = parseDeepLink(invalidUrl)

      expect(result.gameMode).toBe('daily')
      expect(result.targetPlayer).toBeDefined()
      expect(result.guesses).toBeDefined()
      expect(result.gameStatus).toBe('IN_PROGRESS')
    })

    it('operates cleanly in non-browser environments where window is undefined', () => {
      vi.stubGlobal('window', undefined)

      const result = parseDeepLink('?mode=practice&utm_source=test_nb')

      expect(result.gameMode).toBe('practice')
      expect(result.referralContext.utm_source).toBe('test_nb')
    })

    it('reads from window.location.search when no argument is supplied in browser environment', () => {
      vi.stubGlobal('window', {
        location: {
          search: '?mode=daily&puzzle=42',
          pathname: '/',
          href: 'http://localhost/?mode=daily&puzzle=42',
        },
      })

      const result = parseDeepLink()

      expect(result.gameMode).toBe('daily')
      expect(result.puzzleNum).toBe(42)
      expect(result.targetDate).toBe('2026-02-11')
    })
  })

  describe('cleanUrlParameters', () => {
    it('invokes replaceState to clean query string without error', () => {
      const replaceStateMock = vi.fn()
      vi.stubGlobal('window', {
        location: {
          search: '?mode=daily&puzzle=42',
          pathname: '/',
          hash: '',
        },
        history: {
          replaceState: replaceStateMock,
        },
        document: {
          title: 'Gridiron Guesser',
        },
      })

      cleanUrlParameters()

      expect(replaceStateMock).toHaveBeenCalledWith({}, 'Gridiron Guesser', '/')
    })

    it('does nothing safely when window is undefined', () => {
      vi.stubGlobal('window', undefined)
      expect(() => cleanUrlParameters()).not.toThrow()
    })
  })
})
