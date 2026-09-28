import { useState, useEffect } from 'react'
import {
  getDailyPlayer,
  getRandomPlayer,
  getPuzzleNumber,
  loadDailyState,
  saveDailyState,
  shareGameResults,
  WELCOME_STORAGE_KEY,
} from './data/nflPlayers'
import { scheduleStorageWrite, getStorageItem } from './utils/asyncStorage'
import { parseDeepLink, cleanUrlParameters } from './utils/deepLinkRouter'
import { checkStreakExpiration, calculateUpdatedStats } from './utils/streakUtils'
import PlayerSearch from './components/PlayerSearch'
import GuessGrid from './components/GuessGrid'
import StatsModal from './components/StatsModal'
import WelcomeModal from './components/WelcomeModal'
import DailyCountdown from './components/DailyCountdown'
import './App.css'

const DEFAULT_STATS = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
  lastPlayedDate: null,
}

function loadInitialAppState() {
  const routeState = parseDeepLink()
  cleanUrlParameters()

  let stats = DEFAULT_STATS
  try {
    const savedStats = getStorageItem('gridiron_guesser_stats')
    if (savedStats) {
      const parsed = typeof savedStats === 'string' ? JSON.parse(savedStats) : savedStats
      stats = checkStreakExpiration({ ...DEFAULT_STATS, ...parsed })
    }
  } catch {
    // ignore storage errors
  }

  let isHelpOpen = true
  try {
    const seen = getStorageItem(WELCOME_STORAGE_KEY)
    if (seen) {
      isHelpOpen = false
    }
  } catch {
    // ignore storage errors
  }

  return {
    routeState,
    stats,
    isHelpOpen,
  }
}

export default function App() {
  const [initialAppState] = useState(() => loadInitialAppState())
  const [gameMode, setGameMode] = useState(() => initialAppState.routeState.gameMode) // 'daily' | 'practice'
  const [targetPlayer, setTargetPlayer] = useState(() => initialAppState.routeState.targetPlayer)
  const [dailyDate, setDailyDate] = useState(() => initialAppState.routeState.targetDate)
  const [guesses, setGuesses] = useState(() => initialAppState.routeState.guesses)
  const [gameStatus, setGameStatus] = useState(() => initialAppState.routeState.gameStatus) // 'IN_PROGRESS' | 'WON' | 'LOST'
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(() => initialAppState.isHelpOpen)
  const [copiedShare, setCopiedShare] = useState(false)
  const [stats, setStats] = useState(() => initialAppState.stats)

  const handleCloseHelp = () => {
    scheduleStorageWrite(WELCOME_STORAGE_KEY, 'true')
    setIsHelpOpen(false)
  }

  const handleStartPlaying = () => {
    handleCloseHelp()
    setTimeout(() => {
      const input = document.querySelector('.search-input')
      if (input) input.focus()
    }, 50)
  }

  // Save stats to localStorage asynchronously on update
  useEffect(() => {
    scheduleStorageWrite('gridiron_guesser_stats', stats)
  }, [stats])

  // Save daily state to localStorage asynchronously on update when in daily mode
  useEffect(() => {
    if (gameMode === 'daily') {
      const targetDate = dailyDate || new Date().toISOString().slice(0, 10)
      const pNum = getPuzzleNumber(targetDate)
      saveDailyState({
        date: targetDate,
        puzzleNum: pNum,
        guesses,
        gameStatus,
      })
    }
  }, [gameMode, dailyDate, guesses, gameStatus])

  // Handle mode switch or initial game set up
  const initGame = (mode) => {
    setGameMode(mode)
    if (mode === 'daily') {
      const todayStr = new Date().toISOString().slice(0, 10)
      setDailyDate(todayStr)
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
        const targetDate = dailyDate || new Date().toISOString().slice(0, 10)
        return calculateUpdatedStats(prev, {
          isWin,
          gameMode,
          currentDateStr: targetDate,
          numGuesses: newGuesses.length,
        })
      })
    }

    if (gameMode === 'daily') {
      const targetDate = dailyDate || new Date().toISOString().slice(0, 10)
      const pNum = getPuzzleNumber(targetDate)
      saveDailyState({
        date: targetDate,
        puzzleNum: pNum,
        guesses: newGuesses,
        gameStatus: status,
      })
    }
  }

  const handleQuickShare = async () => {
    const currentPuzzleNum = getPuzzleNumber(dailyDate)
    const isWin = gameStatus === 'WON'
    await shareGameResults({
      guesses,
      targetPlayer,
      gameMode,
      puzzleNum: currentPuzzleNum,
      isWin,
      onCopySuccess: () => {
        setCopiedShare(true)
        setTimeout(() => setCopiedShare(false), 2500)
      },
      onCopyError: () => {
        setCopiedShare(false)
      },
    })
  }

  const puzzleNum = getPuzzleNumber(dailyDate)
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
            {gameMode === 'daily' && (
              <DailyCountdown onPlayPractice={() => initGame('practice')} />
            )}
            <div className="end-btn-group">
              <button type="button" className="quick-share-btn" onClick={handleQuickShare}>
                {copiedShare ? '✅ Copied!' : '📤 Share Results'}
              </button>
              {gameMode === 'practice' && (
                <button
                  type="button"
                  className="quick-again-btn"
                  onClick={() => initGame('practice')}
                >
                  🔄 Next Player
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
