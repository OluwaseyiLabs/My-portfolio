/**
 * Links and media addresses can come from the CMS. Only allow normal web, email and phone links, so a pasted
 * `javascript:` or `data:` address can never run code when clicked.
 */
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

export function safeUrl(raw: string | null | undefined, fallback = ''): string {
  const url = String(raw ?? '').trim()
  if (!url) return fallback
  // relative links and in-page anchors are fine
  if (url.startsWith('/') && !url.startsWith('//')) return url
  if (url.startsWith('#')) return url
  try {
    const parsed = new URL(url)
    return ALLOWED_PROTOCOLS.has(parsed.protocol) ? parsed.toString() : fallback
  } catch {
    return fallback
  }
}

/** For <img>/<video> sources: web addresses and same-site paths only. */
export function safeMediaUrl(raw: string | null | undefined): string {
  const url = safeUrl(raw)
  return /^(https?:\/\/|\/)/i.test(url) ? url : ''
}

/** Keep only characters valid in an email address before building a mailto: link. */
export function safeEmail(raw: string | null | undefined): string {
  const e = String(raw ?? '').trim()
  return /^[^\s@<>"'`,;:()\\]+@[^\s@<>"'`,;:()\\]+\.[^\s@<>"'`,;:()\\]+$/.test(e) ? e : ''
}
