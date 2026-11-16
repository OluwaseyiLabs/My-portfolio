import { useEffect, useRef, useState } from 'react'

/** True while the element is on screen (replays effects each time it scrolls back into view). */
export function useInView<T extends HTMLElement>(threshold = 0.5) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])

  return { ref, inView }
}
