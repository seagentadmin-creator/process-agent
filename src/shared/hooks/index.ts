import { useState, useEffect, useCallback, useRef } from 'react';

// === useLocalStorage ===
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (val: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    chrome.storage.local.get(key).then((result) => {
      if (result[key] !== undefined) setValue(result[key] as T);
    });
  }, [key]);

  const setStoredValue = useCallback((val: T) => {
    setValue(val);
    chrome.storage.local.set({ [key]: val });
  }, [key]);

  return [value, setStoredValue];
}

// === useTheme ===
export function useTheme(): [string, (theme: string) => void] {
  const [theme, setTheme] = useLocalStorage<string>('pa-theme', 'system');

  useEffect(() => {
    const resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.setAttribute('data-theme', resolved);
  }, [theme]);

  return [theme, setTheme];
}

// === useAIEnabled ===
export function useAIEnabled(): [boolean, (enabled: boolean) => void] {
  return useLocalStorage<boolean>('pa-ai-enabled', false);
}

// === usePolling ===
export function usePolling(callback: () => Promise<void>, intervalMs: number, enabled: boolean = true) {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    if (!enabled) return;
    savedCallback.current();
    const id = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}

// === useDebounce ===
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// === useKeyboardShortcut ===
export function useKeyboardShortcut(key: string, modifier: 'ctrl' | 'meta', callback: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const modKey = modifier === 'ctrl' ? e.ctrlKey : e.metaKey;
      if (modKey && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        callback();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [key, modifier, callback]);
}
