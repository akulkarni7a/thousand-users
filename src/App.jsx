import React, { useState, useEffect } from 'react'
import { TabNav } from './components/TabNav'
import { JsonFormatter } from './components/JsonFormatter'
import { JwtDecoder } from './components/JwtDecoder'
import { Base64Converter } from './components/Base64Converter'
import { RegexTester } from './components/RegexTester'
import { loadStorage, saveStorage } from './utils/storage'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState(() =>
    loadStorage('dev_utils_active_tab', 'json')
  )

  useEffect(() => {
    saveStorage('dev_utils_active_tab', activeTab)
  }, [activeTab])

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-logo" aria-hidden="true">🛠️</span>
          <div>
            <h1 className="brand-title">DevUtils Platform</h1>
            <p className="brand-subtitle">Client-Side Developer Utilities Suite</p>
          </div>
        </div>
        <div className="privacy-badge" title="All processing occurs locally in your browser">
          🔒 100% Client-Side & Private
        </div>
      </header>

      <main className="main-content">
        <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="tab-content">
          {activeTab === 'json' && <JsonFormatter />}
          {activeTab === 'jwt' && <JwtDecoder />}
          {activeTab === 'base64' && <Base64Converter />}
          {activeTab === 'regex' && <RegexTester />}
        </div>
      </main>

      <footer className="app-footer">
        <p>DevUtils Platform &bull; All data processing is performed entirely in browser local memory.</p>
      </footer>
    </div>
  )
}

export default App
