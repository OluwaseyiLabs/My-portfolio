import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULTS } from '../content/registry'
import { fetchSiteContent } from '../lib/supabase'

const CACHE_KEY = 'portfolio-content-cache'

interface ContentValue {
  /** Text for a key: the owner's edit if there is one, otherwise the built-in default. */
  t: (key: string) => string
  /** Multi-line text split into non-empty lines. */
  lines: (key: string) => string[]
  refresh: () => Promise<void>
}

const ContentContext = createContext<ContentValue | undefined>(undefined)

function readCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function ContentProvider({ children }: { children: ReactNode }) {
  // Start from the last known content so edited text doesn't flash back to the defaults.
  const [overrides, setOverrides] = useState<Record<string, string>>(readCache)

  const refresh = useCallback(async () => {
    const data = await fetchSiteContent()
    setOverrides(data)
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    } catch {
      /* storage unavailable */
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const t = useCallback((key: string) => overrides[key] ?? DEFAULTS[key] ?? '', [overrides])
  const lines = useCallback(
    (key: string) =>
      t(key)
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    [t],
  )

  // Browser tab title and search description
  useEffect(() => {
    const title = t('site.title')
    if (title) document.title = title
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', t('site.description'))
  }, [t])

  const value = useMemo(() => ({ t, lines, refresh }), [t, lines, refresh])
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

export function useContent() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used inside ContentProvider')
  return ctx
}
