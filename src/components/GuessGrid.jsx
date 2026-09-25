import { useMemo } from 'react'
import GuessTile from './GuessTile'
import { comparePlayers } from '../data/nflPlayers'
import { getMemoizedComparison } from '../data/asyncStorage'

export default function GuessGrid({ guesses = [], targetPlayer, maxGuesses = 8 }) {
  const emptyRowsCount = Math.max(0, maxGuesses - guesses.length)

  const rows = useMemo(() => {
    if (!targetPlayer) return []
    return guesses.map((guess) => {
      const comp = getMemoizedComparison(guess, targetPlayer, comparePlayers)
      return { guess, comp }
    })
  }, [guesses, targetPlayer])

  return (
    <div className="guess-grid-container">
      <div className="grid-header">
        <div className="header-cell player-cell">Player</div>
        <div className="header-cell">Team</div>
        <div className="header-cell">Conf</div>
        <div className="header-cell">Div</div>
        <div className="header-cell">Pos</div>
        <div className="header-cell">Side</div>
        <div className="header-cell">Age</div>
        <div className="header-cell">Num</div>
        <div className="header-cell">Pro Bowls</div>
      </div>

      <div className="grid-body">
        {rows.map(({ guess, comp }, rowIndex) => {
          if (!comp) return null

          return (
            <div className="grid-row guess-row" key={guess.id || rowIndex}>
              <div className="grid-cell player-cell">
                <span className="player-name">{guess.name}</span>
              </div>
              <GuessTile value={comp.team.value} match={comp.team.match} colIndex={1} />
              <GuessTile value={comp.conference.value} match={comp.conference.match} colIndex={2} />
              <GuessTile value={comp.division.value} match={comp.division.match} colIndex={3} />
              <GuessTile value={comp.position.value} match={comp.position.match} colIndex={4} />
              <GuessTile value={comp.sideOfBall.value} match={comp.sideOfBall.match} colIndex={5} />
              <GuessTile
                value={comp.age.value}
                match={comp.age.match}
                direction={comp.age.direction}
                colIndex={6}
              />
              <GuessTile
                value={`#${comp.number.value}`}
                match={comp.number.match}
                direction={comp.number.direction}
                colIndex={7}
              />
              <GuessTile
                value={comp.proBowls.value}
                match={comp.proBowls.match}
                direction={comp.proBowls.direction}
                colIndex={8}
              />
            </div>
          )
        })}

        {Array.from({ length: emptyRowsCount }).map((_, idx) => (
          <div className="grid-row empty-row" key={`empty-${idx}`}>
            <div className="grid-cell player-cell empty-cell">?</div>
            <div className="grid-cell empty-cell"></div>
            <div className="grid-cell empty-cell"></div>
            <div className="grid-cell empty-cell"></div>
            <div className="grid-cell empty-cell"></div>
            <div className="grid-cell empty-cell"></div>
            <div className="grid-cell empty-cell"></div>
            <div className="grid-cell empty-cell"></div>
            <div className="grid-cell empty-cell"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
