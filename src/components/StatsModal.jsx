import { useState } from 'react'
import { getPuzzleNumber, shareGameResults } from '../data/nflPlayers'
import useNextPuzzleCountdown from '../hooks/useNextPuzzleCountdown'
import { sanitizeStats } from '../services/streakService'

export default function StatsModal({
  isOpen,
  onClose,
  isWin,
  isGameOver,
  targetPlayer,
  guesses,
  gameMode,
  stats,
  onPlayAgain,
}) {
  const [copied, setCopied] = useState(false)
  const isCountdownActive = Boolean(isOpen && (gameMode === 'daily' || isGameOver))
  const countdown = useNextPuzzleCountdown({ enabled: isCountdownActive })

  if (!isOpen) return null

  const puzzleNum = getPuzzleNumber()
  const displayStats = sanitizeStats(stats)
  const winPercentage = displayStats.played > 0 ? Math.round((displayStats.won / displayStats.played) * 100) : 0

  const handleShare = async () => {
    await shareGameResults({
      guesses,
      targetPlayer,
      gameMode,
      puzzleNum,
      isWin,
      onCopySuccess: () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      },
      onCopyError: () => {
        setCopied(false)
      },
    })
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content">
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        {isGameOver && (
          <div className={`game-result-banner ${isWin ? 'win' : 'loss'}`}>
            <h2>{isWin ? '🎉 TOUCHDOWN! YOU WON!' : '🏈 GAME OVER'}</h2>
            <div className="target-reveal">
              <span className="reveal-label">Target Player:</span>
              <span className="reveal-name">{targetPlayer.name}</span>
              <span className="reveal-meta">
                {targetPlayer.team} (#{targetPlayer.number}) • {targetPlayer.position}
              </span>
            </div>
          </div>
        )}

        <h3 className="stats-header">STATISTICS</h3>
        <div className="stats-summary-grid">
          <div className="stat-box">
            <span className="stat-value">{displayStats.played}</span>
            <span className="stat-label">Played</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{winPercentage}%</span>
            <span className="stat-label">Win %</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{displayStats.currentStreak}</span>
            <span className="stat-label">Current Streak</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{displayStats.maxStreak}</span>
            <span className="stat-label">Max Streak</span>
          </div>
        </div>

        <h4 className="distribution-header">GUESS DISTRIBUTION</h4>
        <div className="distribution-bar-chart">
          {Array.from({ length: 8 }).map((_, i) => {
            const guessNum = i + 1
            const count = displayStats.guessDistribution[guessNum] || 0
            const maxCount = Math.max(1, ...Object.values(displayStats.guessDistribution))
            const widthPercent = Math.max(8, Math.round((count / maxCount) * 100))
            const isHighlight = isGameOver && isWin && gameMode === 'daily' && guesses.length === guessNum

            return (
              <div key={guessNum} className="dist-row">
                <span className="dist-num">{guessNum}</span>
                <div className="dist-bar-wrapper">
                  <div
                    className={`dist-bar ${isHighlight ? 'active-win' : ''}`}
                    style={{ width: `${widthPercent}%` }}
                  >
                    <span className="dist-count">{count}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {(gameMode === 'daily' || isGameOver) && (
          <div className="next-puzzle-countdown-card">
            <span className="countdown-label">NEXT DAILY PUZZLE IN</span>
            <span className="countdown-value">{countdown.formattedTime}</span>
            {countdown.isExpired && (
              <span className="expired-badge">New Puzzle Available!</span>
            )}
          </div>
        )}

        {isGameOver && (
          <div className="modal-actions">
            <button type="button" className="share-btn" onClick={handleShare}>
              {copied ? '✅ Copied to Clipboard!' : '📤 Share Results'}
            </button>
            {gameMode === 'practice' ? (
              <button type="button" className="play-again-btn" onClick={onPlayAgain}>
                🔄 Next Practice Player
              </button>
            ) : (
              <button type="button" className="practice-switch-btn" onClick={onPlayAgain}>
                🏈 Play Practice Mode
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
