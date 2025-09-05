import { useState, useEffect } from 'react';

// Utility function to safely parse JSON from localStorage
function safeJSONParse<T>(value: string, fallback: T): T {
  try {
    const parsed = JSON.parse(value);
    return parsed;
  } catch (error) {
    return fallback;
  }
}

// Helper function to read from localStorage
function readFromLocalStorage<T>(key: string, initialValue: T): T {
  try {
    const item = window.localStorage.getItem(key);
    if (item === null || item === undefined || item === 'undefined' || item === 'null') {
      return initialValue;
    }
    return safeJSONParse(item, initialValue);
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    // Clear the invalid localStorage item
    try {
      window.localStorage.removeItem(key);
    } catch (clearError) {
      console.error(`Error clearing localStorage key "${key}":`, clearError);
    }
    return initialValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return readFromLocalStorage(key, initialValue);
  });

  // Re-read from localStorage when key changes (but not initialValue to avoid reset)
  useEffect(() => {
    const newValue = readFromLocalStorage(key, initialValue);
    setStoredValue(newValue);
  }, [key]); // Remove initialValue dependency

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Clean up any invalid localStorage on mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === 'undefined' || item === 'null') {
        console.log(`Cleaning up invalid localStorage value for key "${key}"`);
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error checking localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}