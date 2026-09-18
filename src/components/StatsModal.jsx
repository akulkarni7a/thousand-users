import { useState } from 'react'
import { generateShareCard, getPuzzleNumber, getShareUrl } from '../data/nflPlayers'
import { copyToClipboard, triggerNativeShare, openSocialShareIntent } from '../utils/shareUtils'

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
    const text = generateShareCard(guesses, targetPlayer, gameMode, puzzleNum, isWin)
    const shareUrl = getShareUrl(gameMode, puzzleNum, targetPlayer)

    if (typeof navigator !== 'undefined' && navigator.share) {
      const shared = await triggerNativeShare({
        title: gameMode === 'daily' ? `Gridiron Guesser #${puzzleNum}` : 'Gridiron Guesser Practice',
        text,
        url: shareUrl,
      })
      if (shared) return
    }

    const copiedOk = await copyToClipboard(text)
    if (copiedOk) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleSocialShare = (platform) => {
    const text = generateShareCard(guesses, targetPlayer, gameMode, puzzleNum, isWin)
    const shareUrl = getShareUrl(gameMode, puzzleNum, targetPlayer)
    openSocialShareIntent(platform, {
      text,
      title: gameMode === 'daily' ? `Gridiron Guesser #${puzzleNum}` : 'Gridiron Guesser Practice',
      url: shareUrl,
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
            <div className="social-share-row">
              <button
                type="button"
                className="social-btn twitter-btn"
                onClick={() => handleSocialShare('twitter')}
                title="Share to Twitter / X"
                aria-label="Share to Twitter or X"
              >
                𝕏 Twitter
              </button>
              <button
                type="button"
                className="social-btn reddit-btn"
                onClick={() => handleSocialShare('reddit')}
                title="Share to Reddit"
                aria-label="Share to Reddit"
              >
                🤖 Reddit
              </button>
              <button
                type="button"
                className="social-btn whatsapp-btn"
                onClick={() => handleSocialShare('whatsapp')}
                title="Share to WhatsApp"
                aria-label="Share to WhatsApp"
              >
                💬 WhatsApp
              </button>
            </div>
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
