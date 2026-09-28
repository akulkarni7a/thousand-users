import { useState, useEffect } from 'react'
import { getTimeUntilMidnightUtc } from '../utils/streakUtils'

/**
 * DailyCountdown component displays real-time countdown to midnight UTC
 * and renders a practice mode re-engagement CTA.
 */
export default function DailyCountdown({ onPlayPractice, className = '' }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeUntilMidnightUtc())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilMidnightUtc())
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  return (
    <div className={`daily-countdown-wrapper ${className}`.trim()}>
      <div className="daily-countdown-card">
        <span className="countdown-title">NEXT DAILY PUZZLE IN</span>
        <span className="countdown-time" data-testid="countdown-timer">
          {timeLeft}
        </span>
      </div>
      {onPlayPractice && (
        <button
          type="button"
          className="countdown-practice-btn"
          onClick={onPlayPractice}
        >
          🎮 Play Practice Mode
        </button>
      )}
    </div>
  )
}
