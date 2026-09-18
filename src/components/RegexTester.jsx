import React, { useState, useEffect } from 'react'
import { testRegex } from '../utils/utilities'
import { loadStorage, saveStorage } from '../utils/storage'

export function RegexTester() {
  const [pattern, setPattern] = useState(() => loadStorage('dev_utils_regex_pattern', '([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})'))
  const [flags, setFlags] = useState(() => loadStorage('dev_utils_regex_flags', 'g'))
  const [text, setText] = useState(() => loadStorage('dev_utils_regex_text', 'Contact us at support@example.com or sales@techcorp.io for inquiries.'))
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    saveStorage('dev_utils_regex_pattern', pattern)
  }, [pattern])

  useEffect(() => {
    saveStorage('dev_utils_regex_flags', flags)
  }, [flags])

  useEffect(() => {
    saveStorage('dev_utils_regex_text', text)
  }, [text])

  const res = testRegex(pattern, flags, text)

  const toggleFlag = (flagChar) => {
    if (flags.includes(flagChar)) {
      setFlags(flags.replace(flagChar, ''))
    } else {
      setFlags(flags + flagChar)
    }
  }

  const handleCopyMatches = () => {
    if (res.matches && res.matches.length > 0) {
      const summary = res.matches
        .map((m, i) => `Match #${i + 1} (Index ${m.index}): "${m.match}"${m.groups.length ? ` [Groups: ${m.groups.map((g) => `"${g}"`).join(', ')}]` : ''}`)
        .join('\n')
      navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClear = () => {
    setPattern('')
    setText('')
  }

  return (
    <div className="utility-pane">
      <div className="regex-inputs">
        <div className="pattern-row">
          <div className="input-group flex-grow">
            <label htmlFor="regex-pattern" className="editor-label">Regex Pattern</label>
            <div className="pattern-field-wrapper">
              <span className="regex-slash">/</span>
              <input
                id="regex-pattern"
                type="text"
                className="text-input code-font"
                placeholder="Enter regex pattern e.g. [a-z]+"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
              />
              <span className="regex-slash">/{flags}</span>
            </div>
          </div>

          <div className="flags-group">
            <span className="editor-label">Flags</span>
            <div className="checkbox-list">
              {['g', 'i', 'm', 's', 'u', 'y'].map((f) => (
                <label key={f} className="flag-checkbox-label">
                  <input
                    type="checkbox"
                    checked={flags.includes(f)}
                    onChange={() => toggleFlag(f)}
                  />
                  <span>{f}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="toolbar">
          <div className="toolbar-group">
            <span className="toolbar-title">Matches found: <strong>{res.count}</strong></span>
          </div>
          <div className="toolbar-group">
            <button type="button" className="btn btn-secondary" onClick={handleClear}>
              Clear
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCopyMatches}
              disabled={res.count === 0}
            >
              {copied ? 'Copied! ✓' : 'Copy Matches'}
            </button>
          </div>
        </div>
      </div>

      {res.error && (
        <div className="error-banner" role="alert">
          <strong>Invalid Regular Expression:</strong> {res.error}
        </div>
      )}

      <div className="pane-grid">
        <div className="editor-container">
          <label htmlFor="regex-test-text" className="editor-label">Test String</label>
          <textarea
            id="regex-test-text"
            className="code-input"
            placeholder="Enter test string to evaluate against regex..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck="false"
          />
        </div>

        <div className="editor-container">
          <label className="editor-label">Match Details ({res.count})</label>
          <div className="matches-results-box code-font">
            {res.matches.length === 0 ? (
              <div className="no-matches">No matches found.</div>
            ) : (
              res.matches.map((m, idx) => (
                <div key={idx} className="match-card">
                  <div className="match-header">
                    <span className="match-index">Match #{idx + 1}</span>
                    <span className="match-pos">Index: {m.index}</span>
                  </div>
                  <div className="match-text">"{m.match}"</div>
                  {m.groups && m.groups.length > 0 && (
                    <div className="match-groups">
                      <strong>Captured Groups:</strong>
                      <ul>
                        {m.groups.map((grp, gIdx) => (
                          <li key={gIdx}>
                            Group #{gIdx + 1}: <code>"{grp}"</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
