import { useState, useEffect } from 'react'
import { getUTCMidnightCountdown } from '../utils/dateUtils'

export default function CountdownTimer({ onRefresh }) {
  const [timeLeft, setTimeLeft] = useState(() => getUTCMidnightCountdown())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getUTCMidnightCountdown())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const isZero = timeLeft.totalSeconds <= 0

  return (
    <div className="countdown-timer">
      <h4 className="countdown-title">NEXT DAILY PUZZLE IN</h4>
      {isZero ? (
        <div className="countdown-zero-container">
          <p className="countdown-expired-msg">A new daily puzzle is available!</p>
          <button
            type="button"
            className="refresh-puzzle-btn"
            onClick={onRefresh}
          >
            Play New Puzzle 🔄
          </button>
        </div>
      ) : (
        <div className="countdown-display" aria-live="polite">
          <span className="countdown-time">{timeLeft.formatted}</span>
        </div>
      )}
    </div>
  )
}
