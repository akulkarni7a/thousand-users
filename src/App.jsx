import { useState, useEffect, useRef } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(() => {
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search)
      const countParam = params.get('count')
      if (countParam !== null) {
        const parsed = parseInt(countParam, 10)
        if (!Number.isNaN(parsed)) {
          return parsed
        }
      }
    }
    return 0
  })

  const [toastMessage, setToastMessage] = useState('')
  const toastTimeoutRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location && window.history) {
      const params = new URLSearchParams(window.location.search)
      params.set('count', count.toString())
      const searchString = params.toString()
      const newUrl = `${window.location.pathname}${searchString ? '?' + searchString : ''}${window.location.hash}`
      if (newUrl.length <= 2000) {
        window.history.replaceState(null, '', newUrl)
      }
    }
  }, [count])

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [])

  const showToast = (msg) => {
    setToastMessage(msg)
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage('')
    }, 2000)
  }

  const fallbackCopyTextToClipboard = (text) => {
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.top = '0'
      textArea.style.left = '-9999px'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      return successful
    } catch {
      return false
    }
  }

  const copyToClipboard = async (text) => {
    let copied = false
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text)
        copied = true
      } catch {
        copied = fallbackCopyTextToClipboard(text)
      }
    } else {
      copied = fallbackCopyTextToClipboard(text)
    }

    if (copied) {
      showToast('Link copied to clipboard!')
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: document.title || 'Thousand Users',
          url,
        })
        return
      } catch (err) {
        if (err && (err.name === 'AbortError' || err.name === 'NotAllowedError')) {
          return
        }
      }
    }

    await copyToClipboard(url)
  }

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
        <div className="button-group">
          <button
            type="button"
            className="counter"
            onClick={() => setCount((count) => count + 1)}
          >
            Count is {count}
          </button>
          <button
            type="button"
            className="share-button"
            onClick={handleShare}
          >
            Share
          </button>
        </div>
        {toastMessage && (
          <div className="toast" role="status" aria-live="polite">
            {toastMessage}
          </div>
        )}
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
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
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
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
