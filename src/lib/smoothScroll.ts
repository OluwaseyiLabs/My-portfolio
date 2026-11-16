/** Eased page scrolling (anchor links, back to top). Native `scroll-behavior: smooth` is short and linear-feeling. */
let cancel: (() => void) | null = null

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) // easeInOutCubic

export function smoothScrollTo(targetY: number) {
  cancel?.()
  const startY = window.scrollY
  const max = document.documentElement.scrollHeight - window.innerHeight
  const endY = Math.max(0, Math.min(targetY, max))
  const distance = endY - startY
  if (Math.abs(distance) < 2) return

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo(0, endY)
    return
  }

  const duration = Math.min(1400, Math.max(650, 500 + Math.abs(distance) * 0.22))
  const start = performance.now()
  let raf = 0
  const stop = () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('wheel', stop)
    window.removeEventListener('touchstart', stop)
    window.removeEventListener('keydown', stop)
    cancel = null
  }
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    window.scrollTo(0, startY + distance * ease(t))
    if (t < 1) raf = requestAnimationFrame(step)
    else stop()
  }
  // the visitor taking over (wheel, touch, keys) always wins
  window.addEventListener('wheel', stop, { passive: true })
  window.addEventListener('touchstart', stop, { passive: true })
  window.addEventListener('keydown', stop)
  cancel = stop
  raf = requestAnimationFrame(step)
}

export const HEADER_OFFSET = 64

export function scrollToElement(el: Element) {
  smoothScrollTo(el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET)
}
