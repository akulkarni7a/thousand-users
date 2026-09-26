// Asynchronous debounced storage writer adapter
const pendingWrites = new Map()
const timers = new Map()

function ensureLocalStorageIntercepted() {
  if (typeof globalThis === 'undefined' || !globalThis.localStorage) return
  const ls = globalThis.localStorage
  if (ls.__isAsyncStorageIntercepted) return

  const origGet = typeof ls.getItem === 'function' ? ls.getItem.bind(ls) : null
  const origRemove = typeof ls.removeItem === 'function' ? ls.removeItem.bind(ls) : null
  const origClear = typeof ls.clear === 'function' ? ls.clear.bind(ls) : null

  if (origGet) {
    ls.getItem = function (key) {
      if (pendingWrites.has(key)) {
        const val = pendingWrites.get(key)
        return typeof val === 'string' ? val : JSON.stringify(val)
      }
      return origGet(key)
    }
  }

  if (origRemove) {
    ls.removeItem = function (key) {
      pendingWrites.delete(key)
      if (timers.has(key)) {
        const existing = timers.get(key)
        if (typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function' && existing?.idleId) {
          window.cancelIdleCallback(existing.idleId)
        } else {
          clearTimeout(existing)
        }
        timers.delete(key)
      }
      if (origRemove) origRemove(key)
    }
  }

  if (origClear) {
    ls.clear = function () {
      pendingWrites.clear()
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
      if (origClear) origClear()
    }
  }

  try {
    Object.defineProperty(ls, '__isAsyncStorageIntercepted', { value: true, writable: true, configurable: true })
  } catch {
    ls.__isAsyncStorageIntercepted = true
  }
}

/**
 * Flush all pending debounced storage writes synchronously to localStorage.
 */
export function flushPendingStorageWrites() {
  ensureLocalStorageIntercepted()
  timers.forEach((timerId) => {
    if (typeof timerId === 'number' || typeof timerId === 'object') {
      clearTimeout(timerId)
    }
  })
  timers.clear()

  pendingWrites.forEach((value, key) => {
    try {
      if (value === null || value === undefined) {
        localStorage.removeItem(key)
      } else {
        const strVal = typeof value === 'string' ? value : JSON.stringify(value)
        localStorage.setItem(key, strVal)
      }
    } catch {
      // ignore storage errors
    }
  })
  pendingWrites.clear()
}

/**
 * Schedule a debounced asynchronous storage write to localStorage.
 * Uses requestIdleCallback or setTimeout/microtask timers to avoid blocking UI render.
 */
export function scheduleStorageWrite(key, value, delay = 100) {
  ensureLocalStorageIntercepted()
  pendingWrites.set(key, value)

  if (timers.has(key)) {
    const existing = timers.get(key)
    if (typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function' && existing?.idleId) {
      window.cancelIdleCallback(existing.idleId)
    } else {
      clearTimeout(existing)
    }
    timers.delete(key)
  }

  const performWrite = () => {
    timers.delete(key)
    if (pendingWrites.has(key)) {
      const val = pendingWrites.get(key)
      pendingWrites.delete(key)
      try {
        if (val === null || val === undefined) {
          localStorage.removeItem(key)
        } else {
          const strVal = typeof val === 'string' ? val : JSON.stringify(val)
          localStorage.setItem(key, strVal)
        }
      } catch {
        // ignore storage errors
      }
    }
  }

  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    const idleId = window.requestIdleCallback(() => performWrite(), { timeout: delay })
    timers.set(key, { idleId })
  } else {
    const timerId = setTimeout(performWrite, delay)
    timers.set(key, timerId)
  }
}

/**
 * Read item from pending storage or localStorage.
 */
export function getStorageItem(key) {
  ensureLocalStorageIntercepted()
  if (pendingWrites.has(key)) {
    const val = pendingWrites.get(key)
    return typeof val === 'string' ? val : JSON.stringify(val)
  }
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/**
 * Cancel pending storage write and remove item from localStorage.
 */
export function removeStorageItem(key) {
  ensureLocalStorageIntercepted()
  if (timers.has(key)) {
    const existing = timers.get(key)
    if (typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function' && existing?.idleId) {
      window.cancelIdleCallback(existing.idleId)
    } else {
      clearTimeout(existing)
    }
    timers.delete(key)
  }
  pendingWrites.delete(key)
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

// Global page unload/visibility handlers
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushPendingStorageWrites)
  window.addEventListener('pagehide', flushPendingStorageWrites)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushPendingStorageWrites()
      }
    })
  }
}
