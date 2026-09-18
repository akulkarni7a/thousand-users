import { useState, useEffect } from 'react'
import {
  NFL_PLAYERS,
  getDailyPlayer,
  getDailyPlayerByPuzzleNumber,
  getRandomPlayer,
  generateShareCard,
  getPuzzleNumber,
  getShareUrl,
} from './data/nflPlayers'
import PlayerSearch from './components/PlayerSearch'
import GuessGrid from './components/GuessGrid'
import StatsModal from './components/StatsModal'
import { copyToClipboard, triggerNativeShare, openSocialShareIntent } from './utils/shareUtils'
import './App.css'

const DEFAULT_STATS = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
  lastPlayedDate: null,
}

function getInitialGameState() {
  if (typeof window === 'undefined') {
    return {
      gameMode: 'daily',
      targetPlayer: getDailyPlayer(),
      isChallengeActive: false,
      customPuzzleNum: null,
    }
  }

  const params = new URLSearchParams(window.location.search)
  const modeParam = params.get('mode')
  const puzzleParam = params.get('puzzle')
  const challengeParam = params.get('challenge')

  if (modeParam === 'practice' || challengeParam) {
    if (challengeParam) {
      const foundPlayer = NFL_PLAYERS.find(
        (p) => String(p.id) === String(challengeParam)
      )
      if (foundPlayer) {
        return {
          gameMode: 'practice',
          targetPlayer: foundPlayer,
          isChallengeActive: true,
          customPuzzleNum: null,
        }
      }
      return {
        gameMode: 'practice',
        targetPlayer: getRandomPlayer(),
        isChallengeActive: false,
        customPuzzleNum: null,
      }
    }
    return {
      gameMode: 'practice',
      targetPlayer: getRandomPlayer(),
      isChallengeActive: false,
      customPuzzleNum: null,
    }
  }

  if (modeParam === 'daily' || puzzleParam) {
    if (puzzleParam) {
      const pNum = parseInt(puzzleParam, 10)
      if (!isNaN(pNum) && pNum >= 1) {
        return {
          gameMode: 'daily',
          targetPlayer: getDailyPlayerByPuzzleNumber(pNum),
          isChallengeActive: false,
          customPuzzleNum: pNum,
        }
      }
    }
    return {
      gameMode: 'daily',
      targetPlayer: getDailyPlayer(),
      isChallengeActive: false,
      customPuzzleNum: null,
    }
  }

  return {
    gameMode: 'daily',
    targetPlayer: getDailyPlayer(),
    isChallengeActive: false,
    customPuzzleNum: null,
  }
}

export default function App() {
  const [initialState] = useState(getInitialGameState)
  const [gameMode, setGameMode] = useState(initialState.gameMode) // 'daily' | 'practice'
  const [targetPlayer, setTargetPlayer] = useState(initialState.targetPlayer)
  const [isChallengeActive, setIsChallengeActive] = useState(initialState.isChallengeActive)
  const [customPuzzleNum, setCustomPuzzleNum] = useState(initialState.customPuzzleNum)
  const [guesses, setGuesses] = useState([])
  const [gameStatus, setGameStatus] = useState('IN_PROGRESS') // 'IN_PROGRESS' | 'WON' | 'LOST'
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)

  const [stats, setStats] = useState(() => {
    try {
      const saved = localStorage.getItem('gridiron_guesser_stats')
      return saved ? { ...DEFAULT_STATS, ...JSON.parse(saved) } : DEFAULT_STATS
    } catch {
      return DEFAULT_STATS
    }
  })

  // Save stats to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem('gridiron_guesser_stats', JSON.stringify(stats))
    } catch {
      // ignore storage errors
    }
  }, [stats])

  // Handle mode switch or initial game set up
  const initGame = (mode) => {
    setGameMode(mode)
    setGuesses([])
    setGameStatus('IN_PROGRESS')
    setIsChallengeActive(false)
    setCustomPuzzleNum(null)
    if (mode === 'daily') {
      setTargetPlayer(getDailyPlayer())
    } else {
      setTargetPlayer(getRandomPlayer())
    }
  }

  const handleSelectPlayer = (player) => {
    if (gameStatus !== 'IN_PROGRESS' || guesses.length >= 8) return

    const newGuesses = [...guesses, player]
    setGuesses(newGuesses)

    const isWin = String(player.id) === String(targetPlayer.id)
    const isLoss = !isWin && newGuesses.length >= 8

    if (isWin || isLoss) {
      const status = isWin ? 'WON' : 'LOST'
      setGameStatus(status)
      setIsStatsOpen(true)

      // Update statistics
      setStats((prev) => {
        const todayStr = new Date().toISOString().slice(0, 10)
        const isNewDay = prev.lastPlayedDate !== todayStr
        const newPlayed = prev.played + 1
        const newWon = isWin ? prev.won + 1 : prev.won
        
        let newStreak = prev.currentStreak
        if (isWin) {
          newStreak = isNewDay || gameMode === 'practice' ? prev.currentStreak + 1 : prev.currentStreak
        } else {
          newStreak = 0
        }

        const newMaxStreak = Math.max(prev.maxStreak, newStreak)
        const numGuesses = newGuesses.length
        const newDist = { ...prev.guessDistribution }
        if (isWin && numGuesses >= 1 && numGuesses <= 8) {
          newDist[numGuesses] = (newDist[numGuesses] || 0) + 1
        }

        return {
          played: newPlayed,
          won: newWon,
          currentStreak: newStreak,
          maxStreak: newMaxStreak,
          guessDistribution: newDist,
          lastPlayedDate: todayStr,
        }
      })
    }
  }

  const activePuzzleNum = customPuzzleNum || getPuzzleNumber()

  const handleQuickShare = async () => {
    const isWin = gameStatus === 'WON'
    const shareText = generateShareCard(guesses, targetPlayer, gameMode, activePuzzleNum, isWin)
    const shareUrl = getShareUrl(gameMode, activePuzzleNum, targetPlayer)

    if (typeof navigator !== 'undefined' && navigator.share) {
      const shared = await triggerNativeShare({
        title: gameMode === 'daily' ? `Gridiron Guesser #${activePuzzleNum}` : 'Gridiron Guesser Practice',
        text: shareText,
        url: shareUrl,
      })
      if (shared) return
    }

    const copiedOk = await copyToClipboard(shareText)
    if (copiedOk) {
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 2500)
    }
  }

  const handleQuickSocialShare = (platform) => {
    const isWin = gameStatus === 'WON'
    const shareText = generateShareCard(guesses, targetPlayer, gameMode, activePuzzleNum, isWin)
    const shareUrl = getShareUrl(gameMode, activePuzzleNum, targetPlayer)
    openSocialShareIntent(platform, {
      text: shareText,
      title: gameMode === 'daily' ? `Gridiron Guesser #${activePuzzleNum}` : 'Gridiron Guesser Practice',
      url: shareUrl,
    })
  }

  const puzzleNum = activePuzzleNum
  const guessedIds = guesses.map((g) => g.id)

  return (
    <div className="app-stadium-layout">
      <header className="stadium-header">
        <div className="header-content">
          <div className="header-titles">
            <h1>GRIDIRON GUESSER 🏈</h1>
            <p className="subtitle">NFL Player Wordle Challenge • Guess in 8 tries!</p>
          </div>
          <div className="header-controls">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              title="How to Play"
              aria-label="How to play"
            >
              ❓
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setIsStatsOpen(true)}
              title="Statistics"
              aria-label="Statistics"
            >
              📊
            </button>
          </div>
        </div>

        <div className="mode-selector">
          <button
            type="button"
            className={`mode-tab ${gameMode === 'daily' ? 'active' : ''}`}
            onClick={() => initGame('daily')}
          >
            📅 Daily #{puzzleNum}
          </button>
          <button
            type="button"
            className={`mode-tab ${gameMode === 'practice' ? 'active' : ''}`}
            onClick={() => initGame('practice')}
          >
            🎮 Practice Mode
          </button>
        </div>
      </header>

      <main className="game-main-area">
        {isChallengeActive && (
          <div className="challenge-banner" role="status">
            <div className="challenge-banner-content">
              <span className="challenge-icon">⚔️</span>
              <div className="challenge-text">
                <strong>Challenge Accepted!</strong> You're solving a custom shared practice challenge. Good luck!
              </div>
            </div>
            <button
              type="button"
              className="close-banner-btn"
              onClick={() => setIsChallengeActive(false)}
              aria-label="Dismiss challenge notification"
            >
              ✕
            </button>
          </div>
        )}

        {isHelpOpen && (
          <section className="how-to-play-card">
            <div className="card-header">
              <h3>HOW TO PLAY</h3>
              <button
                type="button"
                className="close-card-btn"
                onClick={() => setIsHelpOpen(false)}
              >
                ✕
              </button>
            </div>
            <p>Guess the mystery NFL player in 8 tries or fewer.</p>
            <ul className="guide-legend-list">
              <li>
                <span className="legend-swatch correct">🟩 Green</span>: Exact match
              </li>
              <li>
                <span className="legend-swatch close">🟨 Yellow</span>: Close match (Same conference/division, position group, age within 2, jersey # within 5, Pro Bowls within 1)
              </li>
              <li>
                <span className="legend-swatch incorrect">⬛ Gray</span>: No match
              </li>
              <li>
                <span className="legend-indicator">↑ / ↓</span>: Directional arrows show if mystery attribute value is higher or lower!
              </li>
            </ul>
          </section>
        )}

        <section className="search-section">
          <PlayerSearch
            onSelectPlayer={handleSelectPlayer}
            guessedIds={guessedIds}
            disabled={gameStatus !== 'IN_PROGRESS'}
          />
        </section>

        <section className="grid-section">
          <GuessGrid guesses={guesses} targetPlayer={targetPlayer} maxGuesses={8} />
        </section>

        {gameStatus !== 'IN_PROGRESS' && (
          <section className="game-ended-quick-bar">
            <p className="end-msg">
              {gameStatus === 'WON'
                ? `🎉 Correct! It's ${targetPlayer.name}!`
                : `🏈 Out of guesses! Mystery player was ${targetPlayer.name}.`}
            </p>
            <div className="end-btn-group">
              <button type="button" className="quick-share-btn" onClick={handleQuickShare}>
                {copiedShare ? '✅ Copied!' : '📤 Share Results'}
              </button>
              <div className="quick-social-group">
                <button
                  type="button"
                  className="social-btn twitter-btn"
                  onClick={() => handleQuickSocialShare('twitter')}
                  title="Share to Twitter / X"
                  aria-label="Share to Twitter or X"
                >
                  𝕏
                </button>
                <button
                  type="button"
                  className="social-btn reddit-btn"
                  onClick={() => handleQuickSocialShare('reddit')}
                  title="Share to Reddit"
                  aria-label="Share to Reddit"
                >
                  🤖
                </button>
                <button
                  type="button"
                  className="social-btn whatsapp-btn"
                  onClick={() => handleQuickSocialShare('whatsapp')}
                  title="Share to WhatsApp"
                  aria-label="Share to WhatsApp"
                >
                  💬
                </button>
              </div>
              {gameMode === 'practice' ? (
                <button
                  type="button"
                  className="quick-again-btn"
                  onClick={() => initGame('practice')}
                >
                  🔄 Next Player
                </button>
              ) : (
                <button
                  type="button"
                  className="quick-again-btn"
                  onClick={() => initGame('practice')}
                >
                  🎮 Try Practice Mode
                </button>
              )}
            </div>
          </section>
        )}
      </main>

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        isWin={gameStatus === 'WON'}
        isGameOver={gameStatus !== 'IN_PROGRESS'}
        targetPlayer={targetPlayer}
        guesses={guesses}
        gameMode={gameMode}
        stats={stats}
        onPlayAgain={() => {
          setIsStatsOpen(false)
          initGame(gameMode === 'daily' ? 'practice' : 'practice')
        }}
      />
    </div>
  )
}
