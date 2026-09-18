import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage hook', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('hydrates initial state synchronously from localStorage when available', () => {
    window.localStorage.setItem('thousand_users:testKey', JSON.stringify('savedValue'))

    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'))

    expect(result.current[0]).toBe('savedValue')
  })

  it('uses default value when localStorage has no entry', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'))

    expect(result.current[0]).toBe('defaultValue')
  })

  it('prefixes key with thousand_users: namespace', () => {
    const { result } = renderHook(() => useLocalStorage('count', 10))

    act(() => {
      result.current[1](15)
    })

    expect(window.localStorage.getItem('thousand_users:count')).toBe(JSON.stringify(15))
  })

  it('updates React state and writes to localStorage on setValue', () => {
    const { result } = renderHook(() => useLocalStorage('score', 0))

    act(() => {
      result.current[1](100)
    })

    expect(result.current[0]).toBe(100)
    expect(JSON.parse(window.localStorage.getItem('thousand_users:score'))).toBe(100)
  })

  it('supports function updates in setValue', () => {
    const { result } = renderHook(() => useLocalStorage('count', 5))

    act(() => {
      result.current[1]((prev) => prev + 5)
    })

    expect(result.current[0]).toBe(10)
    expect(JSON.parse(window.localStorage.getItem('thousand_users:count'))).toBe(10)
  })

  it('gracefully handles localStorage.getItem throwing an exception (e.g. disabled storage)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage disabled')
    })

    const { result } = renderHook(() => useLocalStorage('fallbackKey', 'fallback'))

    expect(result.current[0]).toBe('fallback')
  })

  it('gracefully updates in-memory state when localStorage.setItem fails (e.g. quota exceeded)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    const { result } = renderHook(() => useLocalStorage('quotaKey', 0))

    act(() => {
      result.current[1](42)
    })

    expect(result.current[0]).toBe(42)
  })

  it('syncs state across tabs via storage event listener', () => {
    const { result } = renderHook(() => useLocalStorage('syncedKey', 'initial'))

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'thousand_users:syncedKey',
          newValue: JSON.stringify('updatedFromOtherTab'),
        })
      )
    })

    expect(result.current[0]).toBe('updatedFromOtherTab')
  })
})
