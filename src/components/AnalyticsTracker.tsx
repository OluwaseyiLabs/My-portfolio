import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { trackEvent } from '../lib/analytics'

/**
 * Records a page view for each page the visitor opens, and a click for any element marked
 * data-track="name". Links to other websites are counted automatically as link:<site>.
 */
export default function AnalyticsTracker() {
  const { pathname } = useLocation()
  const last = useRef('')

  useEffect(() => {
    if (last.current === pathname) return
    last.current = pathname
    trackEvent('page_view', pathname)
  }, [pathname])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target as Element | null
      if (!el?.closest) return

      const marked = el.closest<HTMLElement>('[data-track]')
      if (marked?.dataset.track) {
        trackEvent('click', marked.dataset.track)
        return
      }

      const link = el.closest<HTMLAnchorElement>('a[href]')
      if (!link) return
      const href = link.getAttribute('href') || ''
      if (href.startsWith('mailto:')) {
        trackEvent('click', 'link:email')
      } else if (/^https?:\/\//i.test(href) && link.hostname !== window.location.hostname) {
        trackEvent('click', `link:${link.hostname.replace(/^www\./, '')}`)
      }
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])

  return null
}
