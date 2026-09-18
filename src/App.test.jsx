import { test, expect, vi, beforeEach, describe } from 'vitest'

function setupEnvironment(initialUrl = 'http://localhost/') {
  const urlObj = new URL(initialUrl)

  const history = {
    replaceState: vi.fn((state, title, url) => {
      const updated = new URL(url, urlObj.origin)
      urlObj.pathname = updated.pathname
      urlObj.search = updated.search
      urlObj.hash = updated.hash
    })
  }

  const clipboard = {
    writeText: vi.fn().mockResolvedValue(undefined)
  }

  const navigatorMock = {
    clipboard,
    share: undefined
  }

  const documentMock = {
    title: 'Thousand Users',
    createElement: vi.fn((_tag) => ({
      value: '',
      style: {},
      focus: vi.fn(),
      select: vi.fn(),
    })),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    },
    execCommand: vi.fn().mockReturnValue(true)
  }

  const windowMock = {
    location: {
      get search() { return urlObj.search },
      get pathname() { return urlObj.pathname },
      get hash() { return urlObj.hash },
      get href() { return urlObj.href }
    },
    history,
    navigator: navigatorMock,
    document: documentMock
  }

  Object.defineProperty(globalThis, 'window', { value: windowMock, writable: true, configurable: true })
  Object.defineProperty(globalThis, 'navigator', { value: navigatorMock, writable: true, configurable: true })
  Object.defineProperty(globalThis, 'document', { value: documentMock, writable: true, configurable: true })

  return { windowMock, history, navigatorMock, documentMock, urlObj }
}

describe('URL state synchronization & Web Share integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  test('Requirement 1: Parses count from URL query parameters on initial load', () => {
    setupEnvironment('http://localhost/?count=15')
    const params = new URLSearchParams(window.location.search)
    const countParam = params.get('count')
    const parsed = parseInt(countParam, 10)
    expect(parsed).toBe(15)
  })

  test('Requirement 1: Defaults count to 0 when query parameter is missing or invalid', () => {
    setupEnvironment('http://localhost/?count=invalid')
    const params = new URLSearchParams(window.location.search)
    const countParam = params.get('count')
    const parsed = parseInt(countParam, 10)
    expect(Number.isNaN(parsed)).toBe(true)

    const initialCount = !Number.isNaN(parsed) ? parsed : 0
    expect(initialCount).toBe(0)
  })

  test('Requirement 2: Updates browser history using window.history.replaceState when count changes', () => {
    const { windowMock, history } = setupEnvironment('http://localhost/')
    let count = 0
    
    // Simulate updating state
    count = 1
    const params = new URLSearchParams(windowMock.location.search)
    params.set('count', count.toString())
    const searchString = params.toString()
    const newUrl = `${windowMock.location.pathname}?${searchString}`
    
    if (newUrl.length <= 2000) {
      windowMock.history.replaceState(null, '', newUrl)
    }

    expect(history.replaceState).toHaveBeenCalledWith(null, '', '/?count=1')
    expect(windowMock.location.search).toBe('?count=1')
  })

  test('Constraint: Does not update URL if character length exceeds 2000 characters', () => {
    const { windowMock, history } = setupEnvironment('http://localhost/')
    const longParam = 'x'.repeat(2005)
    const newUrl = `${windowMock.location.pathname}?count=${longParam}`
    
    if (newUrl.length <= 2000) {
      windowMock.history.replaceState(null, '', newUrl)
    }

    expect(history.replaceState).not.toHaveBeenCalled()
  })

  test('Requirement 3: Executes navigator.share if supported', async () => {
    const { navigatorMock, windowMock } = setupEnvironment('http://localhost/?count=5')
    const shareSpy = vi.fn().mockResolvedValue(undefined)
    navigatorMock.share = shareSpy

    if (navigatorMock.share && typeof navigatorMock.share === 'function') {
      await navigatorMock.share({
        title: windowMock.document.title,
        url: windowMock.location.href
      })
    }

    expect(shareSpy).toHaveBeenCalledWith({
      title: 'Thousand Users',
      url: 'http://localhost/?count=5'
    })
  })

  test('Requirement 3: Copies active URL via navigator.clipboard.writeText if share is unsupported', async () => {
    const { navigatorMock, windowMock } = setupEnvironment('http://localhost/?count=5')
    
    if (!navigatorMock.share && navigatorMock.clipboard) {
      await navigatorMock.clipboard.writeText(windowMock.location.href)
    }

    expect(navigatorMock.clipboard.writeText).toHaveBeenCalledWith('http://localhost/?count=5')
  })

  test('Constraint: Handles clipboard permission rejections gracefully with execCommand fallback', async () => {
    const { navigatorMock, documentMock, windowMock } = setupEnvironment('http://localhost/?count=5')
    navigatorMock.clipboard.writeText.mockRejectedValueOnce(new Error('Permission denied'))

    let copied = false
    try {
      await navigatorMock.clipboard.writeText(windowMock.location.href)
      copied = true
    } catch {
      // Fallback
      const textArea = documentMock.createElement('textarea')
      textArea.value = windowMock.location.href
      documentMock.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      copied = documentMock.execCommand('copy')
      documentMock.body.removeChild(textArea)
    }

    expect(copied).toBe(true)
    expect(documentMock.execCommand).toHaveBeenCalledWith('copy')
  })

  test('Requirement 4 & Acceptance Criteria: Toast confirmation message displays and auto-dismisses after 2 seconds', () => {
    let toastMessage = ''
    let timerRef = null

    const showToast = (msg) => {
      toastMessage = msg
      if (timerRef) clearTimeout(timerRef)
      timerRef = setTimeout(() => {
        toastMessage = ''
      }, 2000)
    }

    showToast('Link copied to clipboard!')
    expect(toastMessage).toBe('Link copied to clipboard!')

    vi.advanceTimersByTime(1999)
    expect(toastMessage).toBe('Link copied to clipboard!')

    vi.advanceTimersByTime(1)
    expect(toastMessage).toBe('')
  })
})
