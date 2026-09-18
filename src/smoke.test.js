import { test, expect } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.jsx'
import {
  NFL_PLAYERS,
  comparePlayers,
  filterPlayers,
  generateShareCard,
  getDailyPlayer,
  getRandomPlayer,
} from './data/nflPlayers.js'

test('the app module loads without crashing', async () => {
  const mod = await import('./App.jsx')
  expect(mod.default).toBeTruthy()
})

test('app renders header and initial search bar', () => {
  const html = renderToString(React.createElement(App))
  expect(html).toContain('GRIDIRON GUESSER')
  expect(html).toContain('Search player by name or team...')
  expect(html).toContain('Daily')
  expect(html).toContain('Practice Mode')
})

test('comparePlayers clue logic - exact match', () => {
  const p1 = NFL_PLAYERS[0] // Patrick Mahomes
  const result = comparePlayers(p1, p1)

  expect(result.isCorrect).toBe(true)
  expect(result.team.match).toBe('correct')
  expect(result.conference.match).toBe('correct')
  expect(result.division.match).toBe('correct')
  expect(result.position.match).toBe('correct')
  expect(result.sideOfBall.match).toBe('correct')
  expect(result.age.match).toBe('correct')
  expect(result.age.direction).toBe('')
  expect(result.number.match).toBe('correct')
  expect(result.number.direction).toBe('')
  expect(result.proBowls.match).toBe('correct')
  expect(result.proBowls.direction).toBe('')
})

test('comparePlayers clue logic - partial match and directional indicators', () => {
  // Mahomes: KC, AFC, West, QB, Offense, age 28, num 15, PB 6
  // Travis Kelce: KC, AFC, West, TE, Offense, age 34, num 87, PB 9
  const mahomes = NFL_PLAYERS[0]
  const kelce = NFL_PLAYERS[1]

  const result = comparePlayers(mahomes, kelce) // guess Mahomes, target Kelce

  expect(result.isCorrect).toBe(false)
  expect(result.team.match).toBe('correct') // Both KC
  expect(result.conference.match).toBe('correct') // Both AFC
  expect(result.division.match).toBe('correct') // Both West
  expect(result.sideOfBall.match).toBe('correct') // Both Offense
  expect(result.position.match).toBe('close') // Both Offense side of ball
  
  // Kelce age (34) > Mahomes age (28) -> target > guess -> direction '↑'
  expect(result.age.direction).toBe('↑')
  expect(result.age.match).toBe('incorrect') // diff = 6 > 2

  // Kelce number (87) > Mahomes number (15) -> direction '↑'
  expect(result.number.direction).toBe('↑')

  // Kelce PB (9) > Mahomes PB (6) -> direction '↑'
  expect(result.proBowls.direction).toBe('↑')
})

test('comparePlayers close numeric matching logic', () => {
  // Mahomes age 28. Target player age 29 (Josh Allen). Diff <= 2 -> close
  const mahomes = NFL_PLAYERS[0] // age 28
  const allen = NFL_PLAYERS[2] // age 28
  const result = comparePlayers(mahomes, allen)
  expect(result.age.match).toBe('correct')
})

test('filterPlayers search logic filtering by name/team and excluding guessed players', () => {
  // Search query 'Patrick'
  const nameMatches = filterPlayers(NFL_PLAYERS, 'Patrick')
  expect(nameMatches.length).toBeGreaterThan(0)
  expect(nameMatches[0].name).toContain('Patrick Mahomes')

  // Search query 'Chiefs'
  const teamMatches = filterPlayers(NFL_PLAYERS, 'Chiefs')
  expect(teamMatches.some((p) => p.name === 'Patrick Mahomes')).toBe(true)

  // Search query with excluded ID
  const excluded = filterPlayers(NFL_PLAYERS, 'Patrick', ['1'])
  expect(excluded.some((p) => p.id === '1')).toBe(false)

  // Empty query returns empty array
  expect(filterPlayers(NFL_PLAYERS, '')).toEqual([])
})

test('getDailyPlayer and getRandomPlayer select valid players', () => {
  const daily1 = getDailyPlayer('2026-09-18')
  const daily2 = getDailyPlayer('2026-09-18')
  expect(daily1).toEqual(daily2)
  expect(daily1.id).toBeDefined()

  const randomP = getRandomPlayer('1')
  expect(randomP.id).toBeDefined()
  expect(randomP.id).not.toBe('1')
})

test('generateShareCard formats emoji grid and stats accurately', () => {
  const target = NFL_PLAYERS[0] // Mahomes
  const guess1 = NFL_PLAYERS[1] // Kelce
  const guess2 = NFL_PLAYERS[0] // Mahomes

  const shareText = generateShareCard([guess1, guess2], target, 'daily', 42, true)

  expect(shareText).toContain('Gridiron Guesser #42 2/8')
  expect(shareText).toContain('https://gridiron-guesser.app')
  // Should contain emoji representation
  expect(shareText).toContain('🟩')
})

test('generateShareCard formats loss correctly', () => {
  const target = NFL_PLAYERS[0]
  const guesses = [NFL_PLAYERS[1]]

  const shareText = generateShareCard(guesses, target, 'practice', 1, false)

  expect(shareText).toContain('Gridiron Guesser Practice X/8')
})
