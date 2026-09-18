export default function GuessTile({ value, match, direction = '', colIndex = 0, label }) {
  const statusClass = match || 'incorrect'
  const animationStyle = {
    animationDelay: `${colIndex * 120}ms`,
  }

  return (
    <div
      className={`guess-tile ${statusClass}`}
      style={animationStyle}
      data-status={statusClass}
    >
      <div className="tile-inner">
        {label && <span className="tile-label">{label}</span>}
        <span className="tile-value">{value}</span>
        {direction && <span className="tile-direction">{direction}</span>}
      </div>
    </div>
  )
}
