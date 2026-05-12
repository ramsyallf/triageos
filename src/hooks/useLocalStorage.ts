import { useState, useEffect, useCallback } from 'react'
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Lazy initialization — read from localStorage on first run
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  // Sync to localStorage whenever value changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (err) {
      console.warn(`[useLocalStorage] Failed to write "${key}" to localStorage:`, err)
    }
  }, [key, storedValue])

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const next = value instanceof Function ? value(prev) : value
      return next
    })
  }, [])

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (err) {
      console.warn(`[useLocalStorage] Failed to remove "${key}" from localStorage:`, err)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue] as const
}
