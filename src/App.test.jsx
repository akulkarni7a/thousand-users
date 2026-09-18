import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import App from './App'

describe('App component with useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders initial counter and engagement metrics', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: /Count is 0/i })).toBeTruthy()
    expect(screen.getByText(/Weekly Engagement/i)).toBeTruthy()
  })

  it('increments counter and updates streak on click', () => {
    render(<App />)

    const button = screen.getByRole('button', { name: /Count is 0/i })
    fireEvent.click(button)

    expect(screen.getByRole('button', { name: /Count is 1/i })).toBeTruthy()
    expect(window.localStorage.getItem('thousand_users:count')).toBe('1')

    const logs = JSON.parse(window.localStorage.getItem('thousand_users:activity_logs'))
    expect(logs).toHaveLength(1)
  })

  it('restores persisted state on mount', () => {
    window.localStorage.setItem('thousand_users:count', '42')
    window.localStorage.setItem(
      'thousand_users:activity_logs',
      JSON.stringify([new Date().toISOString()])
    )

    render(<App />)

    expect(screen.getByRole('button', { name: /Count is 42/i })).toBeTruthy()
  })
})
