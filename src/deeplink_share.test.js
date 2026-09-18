import { test, expect, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.jsx'
import {
  NFL_PLAYERS,
  getDailyPlayer,
  getDailyPlayerByPuzzleNumber,
  generateShareCard,
  getShareUrl,
  getRandomPlayer,
} from './data/nflPlayers.js'
import { copyToClipboard, triggerNativeShare, openSocialShareIntent } from './utils/shareUtils.js'

test('copyToClipboard copies text using fallback when clipboard API is unavailable', async () => {
  const result = await copyToClipboard('Test text')
  expect(typeof result).toBe('boolean')
})

test('getRandomPlayer returns valid player distinct from excluded ID', () => {
  const player = getRandomPlayer('1')
  expect(player).toBeDefined()
  expect(player.id).not.toBe('1')
})

test('getDailyPlayerByPuzzleNumber calculates deterministic player for puzzle number', () => {
  const player1 = getDailyPlayerByPuzzleNumber(1)
  const player5 = getDailyPlayerByPuzzleNumber(5)

  expect(player1).toBeDefined()
  expect(player1.id).toBeDefined()
  expect(player5).toBeDefined()
  expect(player5.id).toBeDefined()

  // Invalid numbers fallback to default daily player
  const fallback = getDailyPlayerByPuzzleNumber('invalid')
  expect(fallback).toEqual(getDailyPlayer())
})

test('generateShareCard includes deep link query parameters', () => {
  const target = NFL_PLAYERS[0] // Mahomes
  const guesses = [NFL_PLAYERS[1]] // Kelce

  const dailyCard = generateShareCard(guesses, target, 'daily', 5, true)
  expect(dailyCard).toContain('Gridiron Guesser #5 1/8')
  expect(dailyCard).toContain('mode=daily')
  expect(dailyCard).toContain('puzzle=5')

  const practiceCard = generateShareCard(guesses, target, 'practice', 1, false)
  expect(practiceCard).toContain('Gridiron Guesser Practice X/8')
  expect(practiceCard).toContain('mode=practice')
  expect(practiceCard).toContain(`challenge=${target.id}`)
})

test('getShareUrl formats query strings correctly', () => {
  const mahomes = NFL_PLAYERS[0]
  const dailyUrl = getShareUrl('daily', 10, mahomes)
  expect(dailyUrl).toContain('mode=daily&puzzle=10')

  const practiceUrl = getShareUrl('practice', 1, mahomes)
  expect(practiceUrl).toContain(`mode=practice&challenge=${mahomes.id}`)
})

test('App initializes practice mode with target player 1 when URL has mode=practice&challenge=1', () => {
  try {
    vi.stubGlobal('window', {
      location: {
        search: '?mode=practice&challenge=1',
        origin: 'https://gridiron-guesser.app',
        pathname: '/',
      },
    })

    const html = renderToString(React.createElement(App))
    expect(html).toContain('Practice Mode')
    expect(html).toContain('Challenge Accepted!')
  } finally {
    vi.unstubAllGlobals()
  }
})

test('App initializes daily mode puzzle #5 when URL has mode=daily&puzzle=5', () => {
  try {
    vi.stubGlobal('window', {
      location: {
        search: '?mode=daily&puzzle=5',
        origin: 'https://gridiron-guesser.app',
        pathname: '/',
      },
    })

    const html = renderToString(React.createElement(App))
    expect(html).toContain('Daily')
    expect(html).toContain('5')
  } finally {
    vi.unstubAllGlobals()
  }
})

test('App handles non-existent challenge ID gracefully without throwing runtime errors', () => {
  try {
    vi.stubGlobal('window', {
      location: {
        search: '?mode=practice&challenge=999999',
        origin: 'https://gridiron-guesser.app',
        pathname: '/',
      },
    })

    expect(() => {
      renderToString(React.createElement(App))
    }).not.toThrow()
  } finally {
    vi.unstubAllGlobals()
  }
})

test('triggerNativeShare calls navigator.share when available', async () => {
  const shareSpy = vi.fn().mockResolvedValue(true)

  vi.stubGlobal('navigator', { share: shareSpy })

  const result = await triggerNativeShare({
    title: 'Test Title',
    text: 'Test Text',
    url: 'https://gridiron-guesser.app?mode=daily&puzzle=1',
  })

  expect(result).toBe(true)
  expect(shareSpy).toHaveBeenCalledWith({
    title: 'Test Title',
    text: 'Test Text',
    url: 'https://gridiron-guesser.app?mode=daily&puzzle=1',
  })

  vi.unstubAllGlobals()
})

test('openSocialShareIntent opens window with valid platform intent URLs', () => {
  const openSpy = vi.fn()
  const originalWindow = global.window

  global.window = { open: openSpy }

  openSocialShareIntent('twitter', { text: 'Hello', title: 'Title' })
  expect(openSpy).toHaveBeenCalledWith(
    'https://twitter.com/intent/tweet?text=Hello',
    '_blank',
    'noopener,noreferrer'
  )

  openSocialShareIntent('reddit', { text: 'Hello', title: 'Title' })
  expect(openSpy).toHaveBeenCalledWith(
    'https://www.reddit.com/submit?title=Title&text=Hello',
    '_blank',
    'noopener,noreferrer'
  )

  openSocialShareIntent('whatsapp', { text: 'Hello', title: 'Title' })
  expect(openSpy).toHaveBeenCalledWith(
    'https://api.whatsapp.com/send?text=Hello',
    '_blank',
    'noopener,noreferrer'
  )

  global.window = originalWindow
})
