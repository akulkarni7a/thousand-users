import { describe, it, expect } from 'vitest'
import {
  calculateStreak,
  calculateWeeklyActiveDays,
  getEngagementMetrics,
  formatDayString,
} from './utils/engagement'

describe('engagement utility metrics', () => {
  const refDate = new Date('2026-09-18T12:00:00Z')

  it('formats day string correctly in YYYY-MM-DD format', () => {
    expect(formatDayString('2026-09-18T05:00:00Z')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(formatDayString('invalid-date')).toBeNull()
  })

  it('returns 0 streak for empty activity logs', () => {
    expect(calculateStreak([], refDate)).toBe(0)
  })

  it('calculates active streak when active today and consecutive previous days', () => {
    const logs = [
      '2026-09-16T10:00:00Z',
      '2026-09-17T10:00:00Z',
      '2026-09-18T10:00:00Z',
    ]
    expect(calculateStreak(logs, refDate)).toBe(3)
  })

  it('calculates active streak when active yesterday but not yet today', () => {
    const logs = [
      '2026-09-16T10:00:00Z',
      '2026-09-17T10:00:00Z',
    ]
    expect(calculateStreak(logs, refDate)).toBe(2)
  })

  it('resets streak to 0 if last active day was 2+ days ago', () => {
    const logs = ['2026-09-15T10:00:00Z']
    expect(calculateStreak(logs, refDate)).toBe(0)
  })

  it('calculates weekly active days correctly within 7 trailing days', () => {
    const logs = [
      '2026-09-18T10:00:00Z',
      '2026-09-16T10:00:00Z',
      '2026-09-12T10:00:00Z', // 6 days ago (2026-09-12 to 2026-09-18 is 7 days)
      '2026-09-01T10:00:00Z', // outside 7-day window
    ]
    expect(calculateWeeklyActiveDays(logs, refDate)).toBe(3)
  })

  it('returns comprehensive engagement metrics object', () => {
    const logs = [
      '2026-09-17T10:00:00Z',
      '2026-09-18T10:00:00Z',
      '2026-09-18T15:00:00Z',
    ]
    const metrics = getEngagementMetrics(logs, refDate)
    expect(metrics.currentStreak).toBe(2)
    expect(metrics.weeklyActiveDays).toBe(2)
    expect(metrics.totalActiveDays).toBe(2)
    expect(metrics.totalInteractions).toBe(3)
  })
})
