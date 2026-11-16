import { useEffect, useRef, useState } from 'react'

/** True once the element has entered the viewport. Reveals immediately when motion is reduced or IO is unavailable. */
export function useReveal<T extends HTMLElement>(rootMargin = '0px 0px 8% 0px') {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin, threshold: 0.05 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])

  return { ref, visible }
}
