const memoryStore = new Map()

function getStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage
    }
  } catch {
    // localStorage might be blocked or throw security error
  }
  return null
}

export function loadStorage(key, defaultValue) {
  try {
    const storage = getStorage()
    if (storage) {
      const item = storage.getItem(key)
      if (item !== null) return item
    }
  } catch (e) {
    console.warn(`Error reading ${key} from storage:`, e)
  }
  return memoryStore.has(key) ? memoryStore.get(key) : defaultValue
}

export function saveStorage(key, value) {
  try {
    const storage = getStorage()
    if (storage) {
      storage.setItem(key, value)
    }
  } catch (e) {
    console.warn(`Error writing ${key} to storage:`, e)
  }
  memoryStore.set(key, value)
}

export function clearStorage() {
  try {
    const storage = getStorage()
    if (storage) {
      storage.clear()
    }
  } catch {
    // ignore
  }
  memoryStore.clear()
}
