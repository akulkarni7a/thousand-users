import useNextPuzzleCountdown from '../hooks/useNextPuzzleCountdown'

export default function NextPuzzleCountdown({ dailyDate, onRefresh }) {
  const countdown = useNextPuzzleCountdown(dailyDate)

  return (
    <div className="next-puzzle-countdown-bar">
      <span className="countdown-label">Next Daily Puzzle In:</span>
      <span className="countdown-value">{countdown.formattedTime}</span>
      {countdown.isExpired && (
        <button
          type="button"
          className="refresh-puzzle-btn"
          onClick={onRefresh}
        >
          🔄 Load New Daily Puzzle
        </button>
      )}
    </div>
  )
}
