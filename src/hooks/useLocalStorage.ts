import { useState, useEffect } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key)
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // If error also return initialValue
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // For debugging: log the update
      if (process.env.NODE_ENV === 'development') {
        console.debug(`useLocalStorage[${key}]:`, { 
          oldLength: Array.isArray(storedValue) ? storedValue.length : 'N/A',
          newLength: Array.isArray(valueToStore) ? valueToStore.length : 'N/A'
        })
      }
      
      // Check if value actually changed to prevent unnecessary updates
      // Use a more robust comparison for arrays and objects
      let hasChanged = true
      try {
        const currentStoredString = JSON.stringify(storedValue)
        const newStoredString = JSON.stringify(valueToStore)
        hasChanged = currentStoredString !== newStoredString
      } catch (jsonError) {
        // If JSON comparison fails, always update
        console.warn(`JSON comparison failed for key "${key}":`, jsonError)
        hasChanged = true
      }
      
      if (!hasChanged) {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`useLocalStorage[${key}]: No change detected, skipping update`)
        }
        return // No change, skip update
      }
      
      // Save state
      setStoredValue(valueToStore)
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
        
        // Notify other hook instances about the update
        window.dispatchEvent(new CustomEvent('localStorageUpdated', {
          detail: { key, value: valueToStore }
        }))
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }

  // Listen for storage updates to sync across multiple hook instances
  useEffect(() => {
    const handleStorageChange = (event: CustomEvent) => {
      if (event.detail?.key === key) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 useLocalStorage: Syncing due to external update for key:', key)
        }
        try {
          const item = window.localStorage.getItem(key)
          const newValue = item ? JSON.parse(item) : initialValue
          setStoredValue(newValue)
        } catch (error) {
          console.warn(`Error reading localStorage key "${key}" during sync:`, error)
        }
      }
    }
    
    window.addEventListener('localStorageUpdated' as any, handleStorageChange)
    return () => window.removeEventListener('localStorageUpdated' as any, handleStorageChange)
  }, [key, initialValue])

  return [storedValue, setValue]
}