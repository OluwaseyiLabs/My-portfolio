import { useEffect, useRef, useState } from 'react'
import { safeMediaUrl } from '../lib/safeUrl'

interface AutoVideoProps {
  src: string
  poster?: string
  /** Only plays while true (e.g. the centred slide of a carousel). Defaults to always eligible. */
  active?: boolean
  /** Show native controls (project page). Cover videos in cards use none. */
  controls?: boolean
  className?: string
  label?: string
}

/**
 * Muted looping video that plays by itself while it is on screen and pauses when it leaves,
 * so only visible videos use bandwidth and CPU. Visitors with reduced motion get a still frame
 * with controls instead of autoplay.
 */
export default function AutoVideo({ src, poster, active = true, controls = false, className = '', label }: AutoVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const [visible, setVisible] = useState(false)
  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    if (visible && active) {
      el.muted = true // required for autoplay
      el.play().catch(() => {
        /* autoplay blocked: poster / first frame stays, controls (if any) still work */
      })
    } else {
      el.pause()
    }
  }, [visible, active, reduced])

  return (
    <video
      ref={ref}
      src={safeMediaUrl(src)}
      poster={safeMediaUrl(poster) || undefined}
      muted
      loop
      playsInline
      preload="metadata"
      controls={controls || reduced}
      aria-label={label}
      className={className}
    />
  )
}
