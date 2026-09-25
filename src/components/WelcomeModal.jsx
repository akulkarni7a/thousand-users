import React from 'react'

export default function WelcomeModal({ isOpen, onClose, onStartPlaying }) {
  if (!isOpen) return null

  const handleStart = () => {
    if (onStartPlaying) {
      onStartPlaying()
    } else if (onClose) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="welcome-modal-title">
      <div className="modal-content welcome-modal-content">
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close welcome guide"
        >
          ✕
        </button>

        <div className="welcome-header">
          <h2 id="welcome-modal-title">🏈 WELCOME TO GRIDIRON GUESSER</h2>
          <p className="welcome-subtitle">
            Test your NFL knowledge! Guess the mystery player in 8 attempts or fewer.
          </p>
        </div>

        <div className="welcome-body">
          <div className="guide-section">
            <h4>📊 Column Attributes</h4>
            <p className="guide-desc">
              Each guess compares 8 key player attributes against the mystery player:
            </p>
            <div className="attributes-grid">
              <span className="attr-chip">Team</span>
              <span className="attr-chip">Conference</span>
              <span className="attr-chip">Division</span>
              <span className="attr-chip">Position</span>
              <span className="attr-chip">Side of Ball</span>
              <span className="attr-chip">Age</span>
              <span className="attr-chip">Jersey #</span>
              <span className="attr-chip">Pro Bowls</span>
            </div>
          </div>

          <div className="guide-section">
            <h4>🎨 Color Clues</h4>
            <ul className="guide-legend-list">
              <li>
                <span className="legend-swatch correct">🟩 Green</span>
                <span className="legend-text"><strong>Exact Match</strong>: Attribute matches the mystery player perfectly.</span>
              </li>
              <li>
                <span className="legend-swatch close">🟨 Yellow</span>
                <span className="legend-text">
                  <strong>Close Match</strong>: Same Conference/Division, Position Group (Offense/Defense), Age (±2), Jersey # (±5), or Pro Bowls (±1).
                </span>
              </li>
              <li>
                <span className="legend-swatch incorrect">⬛ Gray</span>
                <span className="legend-text"><strong>No Match</strong>: Attribute does not match.</span>
              </li>
            </ul>
          </div>

          <div className="guide-section">
            <h4>⬆️ Directional Arrows</h4>
            <p className="guide-desc">
              For <strong>Age</strong>, <strong>Jersey #</strong>, and <strong>Pro Bowls</strong>, directional indicators show if the target value is higher (<strong>↑</strong>) or lower (<strong>↓</strong>) than your guess.
            </p>
          </div>

          <div className="guide-section search-tip-box">
            <p>💡 <strong>Quick Start Tip:</strong> Focus the search bar to see top Pro Bowl player recommendations or use category chips (QB, WR, Offense...) to filter candidates!</p>
          </div>
        </div>

        <div className="welcome-footer">
          <button type="button" className="start-playing-btn" onClick={handleStart}>
            Start Playing 🏈
          </button>
        </div>
      </div>
    </div>
  )
}
