import React from 'react'

export function TabNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'json', label: 'JSON Formatter', icon: '📄' },
    { id: 'jwt', label: 'JWT Decoder', icon: '🔑' },
    { id: 'base64', label: 'Base64 Converter', icon: '🔤' },
    { id: 'regex', label: 'Regex Tester', icon: '🔍' },
  ]

  return (
    <nav className="tab-nav" aria-label="Developer utilities navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          <span className="tab-icon" aria-hidden="true">
            {tab.icon}
          </span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
