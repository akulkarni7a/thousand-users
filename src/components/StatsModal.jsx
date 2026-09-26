import { useState } from 'react'
import { getPuzzleNumber, shareGameResults } from '../data/nflPlayers'

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

  if (!isOpen) return null

  const puzzleNum = getPuzzleNumber()

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

  const winPercentage = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0

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
            <span className="stat-value">{stats.played}</span>
            <span className="stat-label">Played</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{winPercentage}%</span>
            <span className="stat-label">Win %</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{stats.currentStreak}</span>
            <span className="stat-label">Current Streak</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{stats.maxStreak}</span>
            <span className="stat-label">Max Streak</span>
          </div>
        </div>

        <h4 className="distribution-header">GUESS DISTRIBUTION</h4>
        <div className="distribution-bar-chart">
          {Array.from({ length: 8 }).map((_, i) => {
            const guessNum = i + 1
            const count = stats.guessDistribution[guessNum] || 0
            const maxCount = Math.max(1, ...Object.values(stats.guessDistribution))
            const widthPercent = Math.max(8, Math.round((count / maxCount) * 100))
            const isHighlight = isGameOver && isWin && guesses.length === guessNum

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
