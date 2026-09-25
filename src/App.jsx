import { useState, useEffect } from 'react'
import {
  getDailyPlayer,
  getRandomPlayer,
  generateShareCard,
  getPuzzleNumber,
  loadDailyState,
  saveDailyState,
  WELCOME_STORAGE_KEY,
} from './data/nflPlayers'
import PlayerSearch from './components/PlayerSearch'
import GuessGrid from './components/GuessGrid'
import StatsModal from './components/StatsModal'
import WelcomeModal from './components/WelcomeModal'
import './App.css'

const DEFAULT_STATS = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
  lastPlayedDate: null,
}

export default function App() {
  const [gameMode, setGameMode] = useState('daily') // 'daily' | 'practice'
  const [targetPlayer, setTargetPlayer] = useState(() => getDailyPlayer())
  const [guesses, setGuesses] = useState(() => {
    const saved = loadDailyState()
    return saved ? saved.guesses : []
  })
  const [gameStatus, setGameStatus] = useState(() => {
    const saved = loadDailyState()
    return saved ? saved.gameStatus : 'IN_PROGRESS'
  }) // 'IN_PROGRESS' | 'WON' | 'LOST'
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(() => {
    try {
      const seen = localStorage.getItem(WELCOME_STORAGE_KEY)
      return !seen
    } catch {
      return false
    }
  })
  const [copiedShare, setCopiedShare] = useState(false)

  const handleCloseHelp = () => {
    try {
      localStorage.setItem(WELCOME_STORAGE_KEY, 'true')
    } catch {
      // ignore storage errors
    }
    setIsHelpOpen(false)
  }

  const handleStartPlaying = () => {
    handleCloseHelp()
    setTimeout(() => {
      const input = document.querySelector('.search-input')
      if (input) input.focus()
    }, 50)
  }

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

  // Save daily state to localStorage on update when in daily mode
  useEffect(() => {
    if (gameMode === 'daily') {
      const todayStr = new Date().toISOString().slice(0, 10)
      const pNum = getPuzzleNumber(todayStr)
      saveDailyState({
        date: todayStr,
        puzzleNum: pNum,
        guesses,
        gameStatus,
      })
    }
  }, [gameMode, guesses, gameStatus])

  // Handle mode switch or initial game set up
  const initGame = (mode) => {
    setGameMode(mode)
    if (mode === 'daily') {
      const todayStr = new Date().toISOString().slice(0, 10)
      setTargetPlayer(getDailyPlayer(todayStr))
      const saved = loadDailyState(todayStr)
      if (saved) {
        setGuesses(saved.guesses)
        setGameStatus(saved.gameStatus)
      } else {
        setGuesses([])
        setGameStatus('IN_PROGRESS')
      }
    } else {
      setGuesses([])
      setGameStatus('IN_PROGRESS')
      setTargetPlayer(getRandomPlayer())
    }
  }

  const handleSelectPlayer = (player) => {
    if (gameStatus !== 'IN_PROGRESS' || guesses.length >= 8) return

    const newGuesses = [...guesses, player]
    setGuesses(newGuesses)

    const isWin = String(player.id) === String(targetPlayer.id)
    const isLoss = !isWin && newGuesses.length >= 8
    const status = isWin ? 'WON' : isLoss ? 'LOST' : 'IN_PROGRESS'

    if (isWin || isLoss) {
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

    if (gameMode === 'daily') {
      const todayStr = new Date().toISOString().slice(0, 10)
      const pNum = getPuzzleNumber(todayStr)
      saveDailyState({
        date: todayStr,
        puzzleNum: pNum,
        guesses: newGuesses,
        gameStatus: status,
      })
    }
  }

  const handleQuickShare = () => {
    const puzzleNum = getPuzzleNumber()
    const isWin = gameStatus === 'WON'
    const shareText = generateShareCard(guesses, targetPlayer, gameMode, puzzleNum, isWin)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        setCopiedShare(true)
        setTimeout(() => setCopiedShare(false), 2500)
      })
    }
  }

  const puzzleNum = getPuzzleNumber()
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
        <WelcomeModal
          isOpen={isHelpOpen}
          onClose={handleCloseHelp}
          onStartPlaying={handleStartPlaying}
        />

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
