import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { scrollToElement, smoothScrollTo } from '../lib/smoothScroll'

/** Gives every in-page link (#work, #contact, the wordmark...) the same eased scroll. */
export default function SmoothAnchors() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname !== '/') return
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = (e.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null
      if (!link) return
      const hash = link.getAttribute('href') || ''
      if (hash === '#') {
        e.preventDefault()
        smoothScrollTo(0)
        return
      }
      const target = document.getElementById(hash.slice(1))
      if (!target) return
      e.preventDefault()
      scrollToElement(target)
      history.replaceState(null, '', hash)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [pathname])

  return null
}
