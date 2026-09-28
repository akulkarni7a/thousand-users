import { describe, it, expect } from 'vitest'
import {
  getUtcCalendarDayIndex,
  getUtcCalendarDayDiff,
  checkStreakExpiration,
  calculateUpdatedStats,
} from './streakUtils.js'

describe('streakUtils pure utility module', () => {
  describe('getUtcCalendarDayIndex and getUtcCalendarDayDiff', () => {
    it('calculates integer difference in UTC calendar days accurately', () => {
      expect(getUtcCalendarDayDiff('2026-09-27', '2026-09-28')).toBe(1)
      expect(getUtcCalendarDayDiff('2026-09-25', '2026-09-28')).toBe(3)
      expect(getUtcCalendarDayDiff('2026-09-28', '2026-09-28')).toBe(0)
      expect(getUtcCalendarDayDiff('2026-09-29', '2026-09-28')).toBe(-1)
    })

    it('handles ISO date strings and Date objects correctly', () => {
      const d1 = new Date('2026-09-27T23:59:59Z')
      const d2 = new Date('2026-09-28T00:00:01Z')
      expect(getUtcCalendarDayDiff(d1, d2)).toBe(1)
    })

    it('returns null for null or invalid date inputs', () => {
      expect(getUtcCalendarDayIndex(null)).toBeNull()
      expect(getUtcCalendarDayDiff(null, '2026-09-28')).toBeNull()
      expect(getUtcCalendarDayDiff('invalid', '2026-09-28')).toBeNull()
    })
  })

  describe('checkStreakExpiration', () => {
    it('resets currentStreak to 0 if lastPlayedDate is older than 1 UTC calendar day', () => {
      const stats = {
        played: 10,
        won: 8,
        currentStreak: 5,
        maxStreak: 5,
        lastPlayedDate: '2026-09-25',
      }
      const hydrated = checkStreakExpiration(stats, '2026-09-28')

      expect(hydrated.currentStreak).toBe(0)
      expect(hydrated.maxStreak).toBe(5) // maxStreak remains unchanged
      expect(hydrated.played).toBe(10)
    })

    it('preserves currentStreak if lastPlayedDate was yesterday in UTC', () => {
      const stats = {
        played: 10,
        won: 8,
        currentStreak: 5,
        maxStreak: 5,
        lastPlayedDate: '2026-09-27',
      }
      const hydrated = checkStreakExpiration(stats, '2026-09-28')

      expect(hydrated.currentStreak).toBe(5)
    })

    it('preserves currentStreak if lastPlayedDate was today in UTC', () => {
      const stats = {
        played: 10,
        won: 8,
        currentStreak: 5,
        maxStreak: 5,
        lastPlayedDate: '2026-09-28',
      }
      const hydrated = checkStreakExpiration(stats, '2026-09-28')

      expect(hydrated.currentStreak).toBe(5)
    })

    it('handles null or empty stats gracefully', () => {
      const hydrated = checkStreakExpiration(null, '2026-09-28')
      expect(hydrated.currentStreak).toBe(0)
      expect(hydrated.played).toBe(0)
    })
  })

  describe('calculateUpdatedStats', () => {
    it('increments streak on consecutive UTC day wins', () => {
      const prevStats = {
        played: 5,
        won: 4,
        currentStreak: 3,
        maxStreak: 3,
        guessDistribution: { 1: 0, 2: 1, 3: 2, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0 },
        lastPlayedDate: '2026-09-27',
      }

      const updated = calculateUpdatedStats(prevStats, {
        isWin: true,
        gameMode: 'daily',
        currentDateStr: '2026-09-28',
        numGuesses: 3,
      })

      expect(updated.currentStreak).toBe(4)
      expect(updated.maxStreak).toBe(4)
      expect(updated.played).toBe(6)
      expect(updated.won).toBe(5)
      expect(updated.lastPlayedDate).toBe('2026-09-28')
      expect(updated.guessDistribution[3]).toBe(3)
    })

    it('resets currentStreak to 1 on skipped day wins', () => {
      const prevStats = {
        played: 5,
        won: 4,
        currentStreak: 4,
        maxStreak: 4,
        guessDistribution: { 1: 0, 2: 1, 3: 2, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0 },
        lastPlayedDate: '2026-09-24', // Skipped 3 days
      }

      const updated = calculateUpdatedStats(prevStats, {
        isWin: true,
        gameMode: 'daily',
        currentDateStr: '2026-09-28',
        numGuesses: 2,
      })

      expect(updated.currentStreak).toBe(1)
      expect(updated.maxStreak).toBe(4) // maxStreak remains high
      expect(updated.played).toBe(6)
      expect(updated.won).toBe(5)
      expect(updated.lastPlayedDate).toBe('2026-09-28')
    })

    it('resets currentStreak to 0 on daily loss', () => {
      const prevStats = {
        played: 5,
        won: 4,
        currentStreak: 4,
        maxStreak: 4,
        guessDistribution: {},
        lastPlayedDate: '2026-09-27',
      }

      const updated = calculateUpdatedStats(prevStats, {
        isWin: false,
        gameMode: 'daily',
        currentDateStr: '2026-09-28',
        numGuesses: 8,
      })

      expect(updated.currentStreak).toBe(0)
      expect(updated.maxStreak).toBe(4)
      expect(updated.played).toBe(6)
      expect(updated.won).toBe(4)
      expect(updated.lastPlayedDate).toBe('2026-09-28')
    })

    it('preserves active daily streak and maxStreak across practice mode wins and losses', () => {
      const prevStats = {
        played: 10,
        won: 8,
        currentStreak: 5,
        maxStreak: 7,
        guessDistribution: { 1: 0, 2: 1, 3: 2, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0 },
        lastPlayedDate: '2026-09-27',
      }

      // Practice mode WIN
      const afterPracticeWin = calculateUpdatedStats(prevStats, {
        isWin: true,
        gameMode: 'practice',
        currentDateStr: '2026-09-28',
        numGuesses: 2,
      })

      expect(afterPracticeWin.currentStreak).toBe(5) // Unchanged
      expect(afterPracticeWin.maxStreak).toBe(7) // Unchanged
      expect(afterPracticeWin.lastPlayedDate).toBe('2026-09-27') // Unchanged
      expect(afterPracticeWin.played).toBe(11) // Incremented
      expect(afterPracticeWin.won).toBe(9) // Incremented
      expect(afterPracticeWin.guessDistribution[2]).toBe(2)

      // Practice mode LOSS
      const afterPracticeLoss = calculateUpdatedStats(prevStats, {
        isWin: false,
        gameMode: 'practice',
        currentDateStr: '2026-09-28',
        numGuesses: 8,
      })

      expect(afterPracticeLoss.currentStreak).toBe(5) // Unchanged
      expect(afterPracticeLoss.maxStreak).toBe(7) // Unchanged
      expect(afterPracticeLoss.lastPlayedDate).toBe('2026-09-27') // Unchanged
      expect(afterPracticeLoss.played).toBe(11) // Incremented
      expect(afterPracticeLoss.won).toBe(8) // Unchanged
    })
  })
})
