import React, { useState, useEffect } from 'react'
import { decodeJwt } from '../utils/utilities'
import { loadStorage, saveStorage } from '../utils/storage'

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjI1Mzc5MzkyMDB9.' +
  'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

export function JwtDecoder() {
  const [token, setToken] = useState(() => loadStorage('dev_utils_jwt_input', SAMPLE_JWT))
  const [copiedHeader, setCopiedHeader] = useState(false)
  const [copiedPayload, setCopiedPayload] = useState(false)

  useEffect(() => {
    saveStorage('dev_utils_jwt_input', token)
  }, [token])

  const decoded = decodeJwt(token)

  const handleCopyHeader = () => {
    if (decoded.header) {
      navigator.clipboard.writeText(JSON.stringify(decoded.header, null, 2))
      setCopiedHeader(true)
      setTimeout(() => setCopiedHeader(false), 2000)
    }
  }

  const handleCopyPayload = () => {
    if (decoded.payload) {
      navigator.clipboard.writeText(JSON.stringify(decoded.payload, null, 2))
      setCopiedPayload(true)
      setTimeout(() => setCopiedPayload(false), 2000)
    }
  }

  const handleClear = () => setToken('')
  const handleSample = () => setToken(SAMPLE_JWT)

  return (
    <div className="utility-pane">
      <div className="toolbar">
        <div className="toolbar-group">
          <span className="toolbar-title">JWT Decoder & Inspector</span>
        </div>
        <div className="toolbar-group">
          <button type="button" className="btn btn-secondary" onClick={handleSample}>
            Load Sample Token
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleClear}>
            Clear
          </button>
        </div>
      </div>

      <div className="editor-container full-width">
        <label htmlFor="jwt-input" className="editor-label">Encoded JWT Token</label>
        <textarea
          id="jwt-input"
          className="code-input jwt-input-area"
          placeholder="Paste JWT token here (header.payload.signature)..."
          value={token}
          onChange={(e) => setToken(e.target.value)}
          spellCheck="false"
        />
      </div>

      {decoded.error && (
        <div className="error-banner" role="alert">
          <strong>JWT Decoding Error:</strong> {decoded.error}
        </div>
      )}

      {!decoded.error && decoded.header && (
        <div className="jwt-status-bar">
          <div className="status-badge valid-badge">✓ Valid JWT Structure</div>
          {decoded.isExpired === true && (
            <div className="status-badge expired-badge">🔴 Token Expired</div>
          )}
          {decoded.isExpired === false && (
            <div className="status-badge active-badge">🟢 Token Active</div>
          )}
          {decoded.expDate && (
            <div className="meta-info">Expires: {decoded.expDate}</div>
          )}
          {decoded.iatDate && (
            <div className="meta-info">Issued At: {decoded.iatDate}</div>
          )}
        </div>
      )}

      <div className="pane-grid">
        <div className="editor-container">
          <div className="editor-header-bar">
            <label className="editor-label">Header (Algorithm & Token Type)</label>
            <button
              type="button"
              className="btn btn-small"
              onClick={handleCopyHeader}
              disabled={!decoded.header}
            >
              {copiedHeader ? 'Copied ✓' : 'Copy Header'}
            </button>
          </div>
          <textarea
            className="code-input code-output"
            readOnly
            value={decoded.header ? JSON.stringify(decoded.header, null, 2) : ''}
            placeholder="Decoded header JSON..."
            spellCheck="false"
          />
        </div>

        <div className="editor-container">
          <div className="editor-header-bar">
            <label className="editor-label">Payload (Data Claims)</label>
            <button
              type="button"
              className="btn btn-small"
              onClick={handleCopyPayload}
              disabled={!decoded.payload}
            >
              {copiedPayload ? 'Copied ✓' : 'Copy Payload'}
            </button>
          </div>
          <textarea
            className="code-input code-output"
            readOnly
            value={decoded.payload ? JSON.stringify(decoded.payload, null, 2) : ''}
            placeholder="Decoded payload JSON..."
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  )
}
