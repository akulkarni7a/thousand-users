import React, { useState, useEffect } from 'react'
import { formatJson, minifyJson } from '../utils/utilities'
import { loadStorage, saveStorage } from '../utils/storage'

export function JsonFormatter() {
  const [input, setInput] = useState(() => loadStorage('dev_utils_json_input', '{\n  "name": "Jules",\n  "role": "Developer",\n  "active": true\n}'))
  const [indent, setIndent] = useState(() => loadStorage('dev_utils_json_indent', '2'))
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    saveStorage('dev_utils_json_input', input)
  }, [input])

  useEffect(() => {
    saveStorage('dev_utils_json_indent', indent)
  }, [indent])

  const formatted = indent === 'minify'
    ? minifyJson(input)
    : formatJson(input, indent)

  const handleCopy = () => {
    if (formatted.result) {
      navigator.clipboard.writeText(formatted.result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClear = () => {
    setInput('')
  }

  const handleSample = () => {
    setInput(JSON.stringify({
      user: {
        id: 1001,
        username: "dev_pro",
        email: "dev@example.com",
        preferences: { theme: "dark", notifications: true },
        tags: ["react", "vite", "javascript"]
      }
    }, null, Number(indent) || 2))
  }

  return (
    <div className="utility-pane">
      <div className="toolbar">
        <div className="toolbar-group">
          <label htmlFor="indent-select" className="toolbar-label">Indentation:</label>
          <select
            id="indent-select"
            className="select-input"
            value={indent}
            onChange={(e) => setIndent(e.target.value)}
          >
            <option value="2">2 Spaces</option>
            <option value="4">4 Spaces</option>
            <option value="tab">1 Tab</option>
            <option value="minify">Minified</option>
          </select>
        </div>

        <div className="toolbar-group">
          <button type="button" className="btn btn-secondary" onClick={handleSample}>
            Load Sample
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleClear}>
            Clear
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCopy}
            disabled={!formatted.result}
          >
            {copied ? 'Copied! ✓' : 'Copy Formatted'}
          </button>
        </div>
      </div>

      {formatted.error && (
        <div className="error-banner" role="alert">
          <strong>Syntax Error:</strong> {formatted.error}
        </div>
      )}

      <div className="pane-grid">
        <div className="editor-container">
          <label htmlFor="json-input" className="editor-label">Raw JSON Input</label>
          <textarea
            id="json-input"
            className="code-input"
            placeholder="Paste raw JSON here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck="false"
          />
        </div>

        <div className="editor-container">
          <label htmlFor="json-output" className="editor-label">Formatted JSON Output</label>
          <textarea
            id="json-output"
            className="code-input code-output"
            readOnly
            value={formatted.result}
            placeholder="Formatted output will appear here..."
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  )
}
