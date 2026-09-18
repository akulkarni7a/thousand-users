import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

const FEATURE_DATA = {
  vite: {
    title: 'Vite Interactive User Guide',
    category: 'Documentation',
    description:
      'Vite provides a fast development server with instant HMR and optimized production builds.',
    details: [
      'Instant Server Start: On-demand file serving over native ESM.',
      'Lightning Fast HMR: Hot Module Replacement stays fast regardless of application size.',
      'Rich Features: Out-of-the-box support for TypeScript, JSX, CSS and modern bundling.',
    ],
  },
  react: {
    title: 'React Interactive User Guide',
    category: 'Documentation',
    description:
      'React enables building component-driven user interfaces with state preservation.',
    details: [
      'Component-Based Architecture: Build encapsulated components that manage their own state.',
      'Declarative UI: React renders the right components efficiently as state changes.',
      'In-App State Persistence: Single-page state transitions keep users engaged in session.',
    ],
  },
  github: {
    title: 'Community Repository Hub',
    category: 'Community',
    description:
      'Explore platform capabilities, source code, and contribution guidelines.',
    details: [
      'Open Source Contributions: Submit pull requests and review active discussions.',
      'Issue Tracking: Report bugs and request new internal platform capabilities.',
      'Changelogs: View recent platform updates and build configurations.',
    ],
  },
  discord: {
    title: 'Discord Community Channel',
    category: 'Community',
    description:
      'Connect with developers in real-time chat and participate in Q&A sessions.',
    details: [
      'Live Discussions: Chat with maintainers and community members in real time.',
      'Developer Q&A: Get help with implementation and troubleshooting.',
      'Office Hours: Join scheduled community events and live technical talks.',
    ],
  },
  x: {
    title: 'X.com Community Feed',
    category: 'Community',
    description:
      'Stay updated with ecosystem announcements and release highlights.',
    details: [
      'Official Announcements: Real-time news on new releases and updates.',
      'Community Showcase: Featured projects and developer spotlights.',
      'Tips & Insights: Daily developer insights and performance optimizations.',
    ],
  },
  bluesky: {
    title: 'Bluesky Social Feed',
    category: 'Community',
    description:
      'Follow decentralized network updates and developer discussions.',
    details: [
      'Decentralized Social Network: Open network posts and community updates.',
      'Developer Insights: Ecosystem status and protocol updates.',
      'Interactive Threads: Engage in open technical discussions.',
    ],
  },
}

function App() {
  const [count, setCount] = useState(0)
  const [activeFeature, setActiveFeature] = useState(null)
  const [featureStats, setFeatureStats] = useState({
    vite: 0,
    react: 0,
    github: 0,
    discord: 0,
    x: 0,
    bluesky: 0,
  })

  const handleFeatureClick = (featureId) => {
    setActiveFeature((prev) => (prev === featureId ? null : featureId))
    setFeatureStats((prev) => ({
      ...prev,
      [featureId]: prev[featureId] + 1,
    }))
  }

  const activeData = activeFeature ? FEATURE_DATA[activeFeature] : null

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <button
                type="button"
                className={`feature-btn ${activeFeature === 'vite' ? 'active' : ''}`}
                onClick={() => handleFeatureClick('vite')}
                aria-expanded={activeFeature === 'vite'}
                aria-controls="feature-drawer"
              >
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`feature-btn ${activeFeature === 'react' ? 'active' : ''}`}
                onClick={() => handleFeatureClick('react')}
                aria-expanded={activeFeature === 'react'}
                aria-controls="feature-drawer"
              >
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </button>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <button
                type="button"
                className={`feature-btn ${activeFeature === 'github' ? 'active' : ''}`}
                onClick={() => handleFeatureClick('github')}
                aria-expanded={activeFeature === 'github'}
                aria-controls="feature-drawer"
              >
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`feature-btn ${activeFeature === 'discord' ? 'active' : ''}`}
                onClick={() => handleFeatureClick('discord')}
                aria-expanded={activeFeature === 'discord'}
                aria-controls="feature-drawer"
              >
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`feature-btn ${activeFeature === 'x' ? 'active' : ''}`}
                onClick={() => handleFeatureClick('x')}
                aria-expanded={activeFeature === 'x'}
                aria-controls="feature-drawer"
              >
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`feature-btn ${activeFeature === 'bluesky' ? 'active' : ''}`}
                onClick={() => handleFeatureClick('bluesky')}
                aria-expanded={activeFeature === 'bluesky'}
                aria-controls="feature-drawer"
              >
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </button>
            </li>
          </ul>
        </div>
      </section>

      {activeData && (
        <section id="feature-drawer" className="feature-drawer">
          <div className="feature-drawer-header">
            <div>
              <span className="feature-badge">{activeData.category}</span>
              <h3>{activeData.title}</h3>
            </div>
            <button
              type="button"
              className="close-btn"
              onClick={() => setActiveFeature(null)}
              aria-label="Close feature panel"
            >
              ✕ Close
            </button>
          </div>
          <p className="feature-description">{activeData.description}</p>
          <ul className="feature-details">
            {activeData.details.map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
          <div className="feature-drawer-footer">
            <span className="feature-stats">
              Usage Interactions: <strong>{featureStats[activeFeature]}</strong>
            </span>
            <button
              type="button"
              className="track-activity-btn"
              onClick={() =>
                setFeatureStats((prev) => ({
                  ...prev,
                  [activeFeature]: prev[activeFeature] + 1,
                }))
              }
            >
              Track Activity
            </button>
          </div>
        </section>
      )}

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
