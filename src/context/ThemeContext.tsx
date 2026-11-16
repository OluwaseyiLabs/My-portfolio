import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark'

/**
 * The site follows the device's light/dark setting, live: switch the system to dark and the page goes dark.
 * Clicking Light | Dark overrides that for the current tab session only. A new visit, or any change
 * of the system setting, goes back to following the system.
 */
const OVERRIDE_KEY = 'portfolio-theme-override'
const DARK_QUERY = '(prefers-color-scheme: dark)'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function systemTheme(): Theme {
  return window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light'
}

function readOverride(): Theme | null {
  try {
    const v = sessionStorage.getItem(OVERRIDE_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readOverride() ?? systemTheme())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // Follow the operating system when it changes (control center, schedule, auto at sunset...)
  useEffect(() => {
    const mq = window.matchMedia?.(DARK_QUERY)
    if (!mq) return
    const onChange = (e: MediaQueryListEvent) => {
      try {
        sessionStorage.removeItem(OVERRIDE_KEY)
      } catch {
        /* ignore */
      }
      setThemeState(e.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      sessionStorage.setItem(OVERRIDE_KEY, next)
    } catch {
      /* the choice still applies until the system changes */
    }
  }, [])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
