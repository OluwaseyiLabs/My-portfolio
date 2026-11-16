/**
 * Courtesy limiter for the contact form, stored in the visitor's browser: after too many quick attempts the
 * form pauses for 1 minute, then 5, then 15, then 1 hour (resetting after a quiet day). The real enforcement
 * happens on the server (portfolio_submit_inquiry); this just gives people a clear message and stops
 * accidental double-clicks. A bot can bypass this file, which is why the server limit exists too.
 */
const KEY = 'portfolio-form-guard'
export const LADDER_SECONDS = [60, 300, 900, 3600]
const WINDOW_MS = 60_000
const MAX_ATTEMPTS_PER_WINDOW = 5
const STRIKE_MEMORY_MS = 24 * 60 * 60 * 1000

interface State {
  attempts: number[]
  strikes: number
  lastStrikeAt: number
  lockedUntil: number
}

const empty = (): State => ({ attempts: [], strikes: 0, lastStrikeAt: 0, lockedUntil: 0 })

function read(): State {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty()
  } catch {
    return empty()
  }
}

function write(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* storage unavailable */
  }
}

/** Seconds left on the current pause, or 0. */
export function lockSecondsLeft(now = Date.now()): number {
  const s = read()
  return s.lockedUntil > now ? Math.ceil((s.lockedUntil - now) / 1000) : 0
}

function lockFor(s: State, now: number, seconds: number) {
  s.lockedUntil = now + seconds * 1000
  s.attempts = []
}

/** Call on every submit click. Returns how long the form is paused for (0 = go ahead). */
export function registerAttempt(now = Date.now()): number {
  const s = read()
  if (s.lockedUntil > now) return Math.ceil((s.lockedUntil - now) / 1000)

  s.attempts = s.attempts.filter((t) => now - t < WINDOW_MS)
  s.attempts.push(now)

  if (s.attempts.length > MAX_ATTEMPTS_PER_WINDOW) {
    if (now - s.lastStrikeAt > STRIKE_MEMORY_MS) s.strikes = 0
    const wait = LADDER_SECONDS[Math.min(s.strikes, LADDER_SECONDS.length - 1)]
    s.strikes += 1
    s.lastStrikeAt = now
    lockFor(s, now, wait)
    write(s)
    return wait
  }
  write(s)
  return 0
}

/** The server said "too many attempts": mirror its wait in the browser. */
export function applyServerLock(seconds: number, now = Date.now()) {
  const s = read()
  lockFor(s, now, Math.max(1, seconds))
  write(s)
}

export function formatWait(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds} second${totalSeconds === 1 ? '' : 's'}`
  const m = Math.ceil(totalSeconds / 60)
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'}`
  const h = Math.ceil(m / 60)
  return `${h} hour${h === 1 ? '' : 's'}`
}
