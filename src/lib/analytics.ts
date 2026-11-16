import { supabase } from './supabase'

/** Set in a browser that has opened Studio, so the owner's own visits and clicks are not counted. */
export const OWNER_FLAG = 'portfolio-owner'
const SESSION_KEY = 'portfolio-session'

function sessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return 'no-session'
  }
}

function isOwnerBrowser(): boolean {
  try {
    return localStorage.getItem(OWNER_FLAG) === '1'
  } catch {
    return false
  }
}

function referrerHost(): string | null {
  try {
    if (!document.referrer) return null
    const host = new URL(document.referrer).hostname
    return host && host !== window.location.hostname ? host.slice(0, 200) : null
  } catch {
    return null
  }
}

/** Fire-and-forget: tracking must never break or slow the site. */
export function trackEvent(eventType: 'page_view' | 'click', target: string) {
  if (!target || isOwnerBrowser()) return
  if (window.location.pathname.startsWith('/studio')) return
  try {
    void supabase
      .from('portfolio_events')
      .insert([
        {
          event_type: eventType,
          target: target.slice(0, 200),
          path: window.location.pathname.slice(0, 300),
          referrer: eventType === 'page_view' ? referrerHost() : null,
          session_id: sessionId(),
          host: window.location.hostname,
        },
      ])
      .then(({ error }) => {
        if (error) console.debug('analytics:', error.message)
      })
  } catch {
    /* ignore */
  }
}

// ── Reading (Studio) ─────────────────────────────────────────────────────────

export interface EventSummaryRow {
  event_type: 'page_view' | 'click'
  target: string
  referrer: string | null
  day: string // YYYY-MM-DD (UTC)
  hits: number
  visitors: number
}

export async function fetchEventSummary(days: number, includeLocal: boolean): Promise<EventSummaryRow[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase.rpc('portfolio_event_summary', {
    since,
    include_local: includeLocal,
  })
  if (error) throw new Error(error.message)
  return ((data as any[]) || []).map((r) => ({
    ...r,
    hits: Number(r.hits),
    visitors: Number(r.visitors),
  }))
}
