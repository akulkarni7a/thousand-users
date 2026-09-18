import React, { useState, useEffect } from 'react'
import { encodeBase64, decodeBase64 } from '../utils/utilities'
import { loadStorage, saveStorage } from '../utils/storage'

export function Base64Converter() {
  const [mode, setMode] = useState(() => loadStorage('dev_utils_base64_mode', 'encode'))
  const [input, setInput] = useState(() => loadStorage('dev_utils_base64_input', 'Hello, Developer Platform!'))
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    saveStorage('dev_utils_base64_mode', mode)
  }, [mode])

  useEffect(() => {
    saveStorage('dev_utils_base64_input', input)
  }, [input])

  const output = mode === 'encode' ? encodeBase64(input) : decodeBase64(input)

  const handleCopy = () => {
    if (output.result) {
      navigator.clipboard.writeText(output.result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSwapMode = () => {
    const nextMode = mode === 'encode' ? 'decode' : 'encode'
    setMode(nextMode)
    if (output.result && !output.error) {
      setInput(output.result)
    }
  }

  const handleClear = () => setInput('')

  return (
    <div className="utility-pane">
      <div className="toolbar">
        <div className="toolbar-group">
          <label htmlFor="base64-mode" className="toolbar-label">Mode:</label>
          <select
            id="base64-mode"
            className="select-input"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="encode">Text → Base64 (Encode)</option>
            <option value="decode">Base64 → Text (Decode)</option>
          </select>
          <button type="button" className="btn btn-secondary" onClick={handleSwapMode}>
            Swap Mode ⇄
          </button>
        </div>

        <div className="toolbar-group">
          <button type="button" className="btn btn-secondary" onClick={handleClear}>
            Clear
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCopy}
            disabled={!output.result}
          >
            {copied ? 'Copied! ✓' : 'Copy Output'}
          </button>
        </div>
      </div>

      {output.error && (
        <div className="error-banner" role="alert">
          <strong>Conversion Error:</strong> {output.error}
        </div>
      )}

      <div className="pane-grid">
        <div className="editor-container">
          <label htmlFor="base64-input" className="editor-label">
            {mode === 'encode' ? 'Plain Text Input' : 'Base64 Encoded Input'}
          </label>
          <textarea
            id="base64-input"
            className="code-input"
            placeholder={mode === 'encode' ? 'Type text to encode...' : 'Paste Base64 string to decode...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck="false"
          />
        </div>

        <div className="editor-container">
          <label htmlFor="base64-output" className="editor-label">
            {mode === 'encode' ? 'Base64 Encoded Output' : 'Decoded Text Output'}
          </label>
          <textarea
            id="base64-output"
            className="code-input code-output"
            readOnly
            value={output.result}
            placeholder="Converted output will appear here..."
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  )
}
