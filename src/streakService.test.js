import { test, expect, describe } from 'vitest'
import {
  parseUTCDate,
  getUTCDayDifference,
  sanitizeStats,
  updateStatsOnGameEnd,
  DEFAULT_STATS,
} from './services/streakService.js'

describe('streakService pure utility functions', () => {
  test('parseUTCDate parses YYYY-MM-DD string into exact UTC midnight milliseconds', () => {
    const ms1 = parseUTCDate('2026-10-01')
    const expectedMs1 = Date.UTC(2026, 9, 1)
    expect(ms1).toBe(expectedMs1)

    const dateObj = new Date(Date.UTC(2026, 11, 31, 15, 30, 0))
    const ms2 = parseUTCDate(dateObj)
    expect(ms2).toBe(Date.UTC(2026, 11, 31))
  })

  test('getUTCDayDifference accurately computes day differences including same day, consecutive day, and multi-day gap', () => {
    expect(getUTCDayDifference('2026-10-01', '2026-10-01')).toBe(0)
    expect(getUTCDayDifference('2026-10-01', '2026-10-02')).toBe(1)
    expect(getUTCDayDifference('2026-10-01', '2026-10-04')).toBe(3)
  })

  test('getUTCDayDifference correctly handles year boundaries and leap years', () => {
    // Year boundary: Dec 31 to Jan 1
    expect(getUTCDayDifference('2026-12-31', '2027-01-01')).toBe(1)
    expect(getUTCDayDifference('2026-12-30', '2027-01-01')).toBe(2)

    // Leap year boundary: Feb 28 -> Feb 29 -> Mar 1 in 2028
    expect(getUTCDayDifference('2028-02-28', '2028-02-29')).toBe(1)
    expect(getUTCDayDifference('2028-02-28', '2028-03-01')).toBe(2)
  })

  test('sanitizeStats resets currentStreak to 0 when 1 or more calendar days are skipped', () => {
    const statsWithStreak = {
      ...DEFAULT_STATS,
      played: 10,
      won: 8,
      currentStreak: 5,
      maxStreak: 5,
      lastPlayedDate: '2026-09-20',
    }

    // Checking same day (no reset)
    const sameDay = sanitizeStats(statsWithStreak, '2026-09-20')
    expect(sameDay.currentStreak).toBe(5)

    // Checking consecutive day (no reset)
    const consecutive = sanitizeStats(statsWithStreak, '2026-09-21')
    expect(consecutive.currentStreak).toBe(5)

    // Checking multi-day gap (skipped 2 days) -> currentStreak reset to 0
    const skippedDays = sanitizeStats(statsWithStreak, '2026-09-23')
    expect(skippedDays.currentStreak).toBe(0)
    expect(skippedDays.maxStreak).toBe(5)
  })

  test('updateStatsOnGameEnd increments streak on consecutive days', () => {
    const initialStats = {
      ...DEFAULT_STATS,
      played: 3,
      won: 3,
      currentStreak: 3,
      maxStreak: 3,
      lastPlayedDate: '2026-10-01',
    }

    const updated = updateStatsOnGameEnd(initialStats, {
      isWin: true,
      isDaily: true,
      numGuesses: 4,
      dateStr: '2026-10-02',
    })

    expect(updated.played).toBe(4)
    expect(updated.won).toBe(4)
    expect(updated.currentStreak).toBe(4)
    expect(updated.maxStreak).toBe(4)
    expect(updated.lastPlayedDate).toBe('2026-10-02')
  })

  test('updateStatsOnGameEnd resets streak to 1 after winning upon returning from a multi-day gap', () => {
    const initialStats = {
      ...DEFAULT_STATS,
      played: 5,
      won: 4,
      currentStreak: 4,
      maxStreak: 4,
      lastPlayedDate: '2026-09-20',
    }

    // User returns on 2026-09-24 (4 days gap) and wins
    const updated = updateStatsOnGameEnd(initialStats, {
      isWin: true,
      isDaily: true,
      numGuesses: 3,
      dateStr: '2026-09-24',
    })

    expect(updated.played).toBe(6)
    expect(updated.won).toBe(5)
    expect(updated.currentStreak).toBe(1) // Active streak reset and set to 1
    expect(updated.maxStreak).toBe(4) // Max streak preserved
    expect(updated.lastPlayedDate).toBe('2026-09-24')
  })

  test('updateStatsOnGameEnd resets active streak to 0 on loss', () => {
    const initialStats = {
      ...DEFAULT_STATS,
      played: 5,
      won: 4,
      currentStreak: 4,
      maxStreak: 4,
      lastPlayedDate: '2026-09-20',
    }

    const updated = updateStatsOnGameEnd(initialStats, {
      isWin: false,
      isDaily: true,
      numGuesses: 8,
      dateStr: '2026-09-21',
    })

    expect(updated.played).toBe(6)
    expect(updated.won).toBe(4)
    expect(updated.currentStreak).toBe(0)
    expect(updated.maxStreak).toBe(4)
  })

  test('updateStatsOnGameEnd ignores practice mode games and returns stats unmodified', () => {
    const initialStats = {
      ...DEFAULT_STATS,
      played: 5,
      won: 4,
      currentStreak: 3,
      maxStreak: 3,
      lastPlayedDate: '2026-09-20',
    }

    const updatedWin = updateStatsOnGameEnd(initialStats, {
      isWin: true,
      isDaily: false,
      numGuesses: 2,
      dateStr: '2026-09-25',
    })

    expect(updatedWin).toEqual(initialStats)

    const updatedLoss = updateStatsOnGameEnd(initialStats, {
      isWin: false,
      isDaily: false,
      numGuesses: 8,
      dateStr: '2026-09-25',
    })

    expect(updatedLoss).toEqual(initialStats)
  })
})
