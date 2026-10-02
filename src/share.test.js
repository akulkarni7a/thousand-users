import { test, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import { NFL_PLAYERS, shareGameResults, generateShareCard } from './data/nflPlayers.js'
import { saveReferralContext, REFERRAL_STORAGE_KEY } from './utils/deepLinkRouter.js'
import { removeStorageItem, flushPendingStorageWrites } from './utils/asyncStorage.js'

let originalShare
let originalClipboard

beforeEach(() => {
  removeStorageItem(REFERRAL_STORAGE_KEY)
  flushPendingStorageWrites()
  originalShare = globalThis.navigator?.share
  originalClipboard = globalThis.navigator?.clipboard
})

afterEach(() => {
  if (globalThis.navigator) {
    if (originalShare !== undefined) {
      Object.defineProperty(globalThis.navigator, 'share', {
        value: originalShare,
        configurable: true,
        writable: true,
      })
    } else {
      delete globalThis.navigator.share
    }

    if (originalClipboard !== undefined) {
      Object.defineProperty(globalThis.navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true,
        writable: true,
      })
    } else {
      delete globalThis.navigator.clipboard
    }
  }
})

test('shareGameResults invokes navigator.share when supported with title, text, and UTM url', async () => {
  const shareMock = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(globalThis.navigator, 'share', {
    value: shareMock,
    configurable: true,
    writable: true,
  })

  const target = NFL_PLAYERS[0]
  const guesses = [NFL_PLAYERS[1], NFL_PLAYERS[0]]

  await shareGameResults({
    guesses,
    targetPlayer: target,
    gameMode: 'daily',
    puzzleNum: 42,
    isWin: true,
  })

  expect(shareMock).toHaveBeenCalledTimes(1)
  const shareArg = shareMock.mock.calls[0][0]
  expect(shareArg.title).toBe('Gridiron Guesser #42')
  expect(shareArg.text).toContain('Gridiron Guesser #42 2/8')
  expect(shareArg.url).toBe(
    'https://gridiron-guesser.app?utm_source=share_card&utm_medium=social&utm_campaign=daily_challenge&mode=daily&puzzle=42'
  )
})

test('shareGameResults constructs practice mode shareUrl with campaign, mode, and player parameters', async () => {
  const shareMock = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(globalThis.navigator, 'share', {
    value: shareMock,
    configurable: true,
    writable: true,
  })

  const target = NFL_PLAYERS[0]
  const guesses = [NFL_PLAYERS[1]]

  await shareGameResults({
    guesses,
    targetPlayer: target,
    gameMode: 'practice',
    puzzleNum: 1,
    isWin: false,
  })

  expect(shareMock).toHaveBeenCalledTimes(1)
  const shareArg = shareMock.mock.calls[0][0]
  expect(shareArg.title).toBe('Gridiron Guesser Practice')
  expect(shareArg.url).toBe(
    'https://gridiron-guesser.app?utm_source=share_card&utm_medium=social&utm_campaign=practice_mode&mode=practice&player=1'
  )
})

test('shareGameResults falls back to clipboard copy when navigator.share is unsupported', async () => {
  delete globalThis.navigator.share
  const writeTextMock = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value: { writeText: writeTextMock },
    configurable: true,
    writable: true,
  })

  const onCopySuccess = vi.fn()
  const onCopyError = vi.fn()

  const target = NFL_PLAYERS[0]
  const guesses = [NFL_PLAYERS[0]]

  await shareGameResults({
    guesses,
    targetPlayer: target,
    gameMode: 'daily',
    puzzleNum: 10,
    isWin: true,
    onCopySuccess,
    onCopyError,
  })

  expect(writeTextMock).toHaveBeenCalledTimes(1)
  expect(writeTextMock.mock.calls[0][0]).toContain('Gridiron Guesser #10 1/8')
  expect(onCopySuccess).toHaveBeenCalledTimes(1)
  expect(onCopyError).not.toHaveBeenCalled()
})

test('shareGameResults falls back to clipboard when navigator.share rejects with non-AbortError', async () => {
  const genericError = new Error('Share failed')
  const shareMock = vi.fn().mockRejectedValue(genericError)
  const writeTextMock = vi.fn().mockResolvedValue(undefined)

  Object.defineProperty(globalThis.navigator, 'share', {
    value: shareMock,
    configurable: true,
    writable: true,
  })
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value: { writeText: writeTextMock },
    configurable: true,
    writable: true,
  })

  const onCopySuccess = vi.fn()

  await shareGameResults({
    guesses: [NFL_PLAYERS[0]],
    targetPlayer: NFL_PLAYERS[0],
    gameMode: 'daily',
    puzzleNum: 1,
    isWin: true,
    onCopySuccess,
  })

  expect(shareMock).toHaveBeenCalledTimes(1)
  expect(writeTextMock).toHaveBeenCalledTimes(1)
  expect(onCopySuccess).toHaveBeenCalledTimes(1)
})

test('shareGameResults ignores AbortError when user dismisses share sheet', async () => {
  const abortError = new Error('Share canceled')
  abortError.name = 'AbortError'
  const shareMock = vi.fn().mockRejectedValue(abortError)
  const writeTextMock = vi.fn().mockResolvedValue(undefined)

  Object.defineProperty(globalThis.navigator, 'share', {
    value: shareMock,
    configurable: true,
    writable: true,
  })
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value: { writeText: writeTextMock },
    configurable: true,
    writable: true,
  })

  const onCopySuccess = vi.fn()
  const onCopyError = vi.fn()

  await shareGameResults({
    guesses: [NFL_PLAYERS[0]],
    targetPlayer: NFL_PLAYERS[0],
    gameMode: 'daily',
    puzzleNum: 1,
    isWin: true,
    onCopySuccess,
    onCopyError,
  })

  expect(shareMock).toHaveBeenCalledTimes(1)
  expect(writeTextMock).not.toHaveBeenCalled()
  expect(onCopySuccess).not.toHaveBeenCalled()
  expect(onCopyError).not.toHaveBeenCalled()
})

test('shareGameResults handles async clipboard rejection gracefully', async () => {
  delete globalThis.navigator.share
  const clipboardError = new Error('Clipboard access denied')
  const writeTextMock = vi.fn().mockRejectedValue(clipboardError)

  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value: { writeText: writeTextMock },
    configurable: true,
    writable: true,
  })

  const onCopySuccess = vi.fn()
  const onCopyError = vi.fn()

  await shareGameResults({
    guesses: [NFL_PLAYERS[0]],
    targetPlayer: NFL_PLAYERS[0],
    gameMode: 'daily',
    puzzleNum: 1,
    isWin: true,
    onCopySuccess,
    onCopyError,
  })

  expect(writeTextMock).toHaveBeenCalledTimes(1)
  expect(onCopySuccess).not.toHaveBeenCalled()
  expect(onCopyError).toHaveBeenCalledWith(clipboardError)
})

test('generateShareCard includes stored referral UTM parameters when present in local storage', () => {
  saveReferralContext({
    utm_source: 'twitter',
    utm_medium: 'social',
    utm_campaign: 'launch_viral',
  })

  const cardText = generateShareCard([NFL_PLAYERS[0]], NFL_PLAYERS[0], 'daily', 5, true)
  expect(cardText).toContain('utm_source=twitter')
  expect(cardText).toContain('utm_medium=social')
  expect(cardText).toContain('utm_campaign=launch_viral')
  expect(cardText).toContain('mode=daily')
  expect(cardText).toContain('puzzle=5')
})

test('shareGameResults propagates stored referral context to navigator.share and clipboard', async () => {
  saveReferralContext({
    utm_source: 'influencer_partner',
    utm_medium: 'cpc',
    utm_campaign: 'summer_promo',
  })

  const shareMock = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(globalThis.navigator, 'share', {
    value: shareMock,
    configurable: true,
    writable: true,
  })

  await shareGameResults({
    guesses: [NFL_PLAYERS[0]],
    targetPlayer: NFL_PLAYERS[0],
    gameMode: 'daily',
    puzzleNum: 12,
    isWin: true,
  })

  expect(shareMock).toHaveBeenCalledTimes(1)
  const shareArg = shareMock.mock.calls[0][0]
  expect(shareArg.url).toContain('utm_source=influencer_partner')
  expect(shareArg.url).toContain('utm_medium=cpc')
  expect(shareArg.url).toContain('utm_campaign=summer_promo')
  expect(shareArg.text).toContain('utm_source=influencer_partner')
})

test('shareGameResults accepts explicit referralContext argument', async () => {
  const shareMock = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(globalThis.navigator, 'share', {
    value: shareMock,
    configurable: true,
    writable: true,
  })

  await shareGameResults({
    guesses: [NFL_PLAYERS[0]],
    targetPlayer: NFL_PLAYERS[0],
    gameMode: 'practice',
    puzzleNum: 1,
    isWin: true,
    referralContext: {
      utm_source: 'newsletter',
      utm_medium: 'email',
      utm_campaign: 'weekly_digest',
    },
  })

  expect(shareMock).toHaveBeenCalledTimes(1)
  const shareArg = shareMock.mock.calls[0][0]
  expect(shareArg.url).toContain('utm_source=newsletter')
  expect(shareArg.url).toContain('utm_medium=email')
  expect(shareArg.url).toContain('utm_campaign=weekly_digest')
})

test('index.html contains full OpenGraph and Twitter Card metadata tags', () => {
  const htmlPath = path.resolve(__dirname, '../index.html')
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8')

  expect(htmlContent).toContain('<meta property="og:type" content="website"')
  expect(htmlContent).toContain('<meta property="og:site_name"')
  expect(htmlContent).toContain('<meta property="og:title"')
  expect(htmlContent).toContain('<meta property="og:description"')
  expect(htmlContent).toContain('<meta property="og:image"')
  expect(htmlContent).toContain('<meta property="og:url"')
  expect(htmlContent).toContain('<meta name="twitter:card" content="summary_large_image"')
  expect(htmlContent).toContain('<meta name="twitter:title"')
  expect(htmlContent).toContain('<meta name="twitter:description"')
  expect(htmlContent).toContain('<meta name="twitter:image"')
})
