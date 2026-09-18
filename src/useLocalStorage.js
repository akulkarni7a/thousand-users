import { useState, useEffect, useCallback } from 'react'

const DEFAULT_PREFIX = 'thousand_users:'

function getPrefixedKey(key, prefix = DEFAULT_PREFIX) {
  if (!prefix) return key
  return key.startsWith(prefix) ? key : `${prefix}${key}`
}

function getStorageValue(key, defaultValue, prefix = DEFAULT_PREFIX) {
  if (typeof window === 'undefined') {
    return typeof defaultValue === 'function' ? defaultValue() : defaultValue
  }
  const prefixedKey = getPrefixedKey(key, prefix)
  try {
    const item = window.localStorage.getItem(prefixedKey)
    if (item !== null && item !== undefined) {
      return JSON.parse(item)
    }
  } catch (error) {
    console.warn(`Error reading localStorage key "${prefixedKey}":`, error)
  }
  return typeof defaultValue === 'function' ? defaultValue() : defaultValue
}

/**
 * Custom React hook to persist state in browser localStorage with synchronous hydration
 * and fallback to in-memory state on storage errors.
 *
 * @param {string} key - Unique key for localStorage (will be prefixed automatically)
 * @param {any} initialValue - Default state value or function that returns it
 * @param {object} [options] - Options like { prefix: 'custom:' }
 * @returns {[any, Function]} - [storedValue, setValue]
 */
export function useLocalStorage(key, initialValue, options = {}) {
  const prefix = options.prefix ?? DEFAULT_PREFIX
  const prefixedKey = getPrefixedKey(key, prefix)

  // Synchronous state hydration on hook initialization
  const [storedValue, setStoredValue] = useState(() => {
    return getStorageValue(key, initialValue, prefix)
  })

  const setValue = useCallback(
    (value) => {
      try {
        setStoredValue((prevValue) => {
          const valueToStore = value instanceof Function ? value(prevValue) : value
          if (typeof window !== 'undefined') {
            try {
              if (valueToStore === undefined) {
                window.localStorage.removeItem(prefixedKey)
              } else {
                window.localStorage.setItem(prefixedKey, JSON.stringify(valueToStore))
              }
            } catch (error) {
              console.warn(`Error writing to localStorage key "${prefixedKey}":`, error)
            }
          }
          return valueToStore
        })
      } catch (error) {
        console.warn(`Error updating state for key "${prefixedKey}":`, error)
      }
    },
    [prefixedKey]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (event) => {
      if (event.key === prefixedKey) {
        try {
          if (event.newValue === null) {
            setStoredValue(typeof initialValue === 'function' ? initialValue() : initialValue)
          } else {
            setStoredValue(JSON.parse(event.newValue))
          }
        } catch (error) {
          console.warn(`Error parsing storage event value for "${prefixedKey}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [prefixedKey, initialValue])

  return [storedValue, setValue]
}

export default useLocalStorage
