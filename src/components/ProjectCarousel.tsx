import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { PortfolioProject } from '../types/portfolio'
import AutoVideo from './AutoVideo'
import { useContent } from '../context/ContentContext'

// ── Placeholder image ─────────────────────────────────────────────────────────
function ScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <div className="w-full h-full bg-surface flex flex-col items-center justify-center gap-3 select-none">
      {/* Browser chrome mock */}
      <div className="w-3/4 max-w-xs border border-line bg-bg shadow-sm overflow-hidden">
        <div className="bg-surface px-3 py-2 flex items-center gap-1.5 border-b border-line">
          <span className="w-2 h-2 rounded-full bg-line" />
          <span className="w-2 h-2 rounded-full bg-line" />
          <span className="w-2 h-2 rounded-full bg-line" />
          <span className="ml-2 flex-1 h-3 bg-line rounded-sm" />
        </div>
        <div className="h-16 flex items-center justify-center">
          <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="26" height="18" rx="1" stroke="var(--color-line-strong)" strokeWidth="1"/>
            <path d="M1 6h26" stroke="var(--color-line-strong)" strokeWidth="1"/>
          </svg>
        </div>
      </div>
      <p className="text-xs text-faint text-center leading-tight px-4">
        Screenshot placeholder<br />{label}
      </p>
    </div>
  )
}

// ── Carousel container skeleton view ──────────────────────────────────────────
function CarouselSkeleton() {
  return (
    <div className="flex flex-col items-center animate-pulse">
      <div className="flex items-center justify-center gap-4 w-full px-4 overflow-hidden">
        {/* Left peek card */}
        <div className="w-[12vw] max-w-xs aspect-[16/10] bg-surface border border-line opacity-40 hidden sm:block" />
        {/* Main center card */}
        <div className="w-[88vw] sm:w-[60vw] md:w-[52vw] max-w-2xl aspect-[16/10] bg-surface border border-line flex items-center justify-center">
          <div className="w-16 h-10 border border-line bg-line" />
        </div>
        {/* Right peek card */}
        <div className="w-[12vw] max-w-xs aspect-[16/10] bg-surface border border-line opacity-40 hidden sm:block" />
      </div>

      {/* Button & dots skeletons */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <div className="w-11 h-11 border border-line bg-surface" />
        <div className="flex gap-2">
          <div className="w-6 h-1.5 bg-line" />
          <div className="w-1.5 h-1.5 bg-surface" />
          <div className="w-1.5 h-1.5 bg-surface" />
        </div>
        <div className="w-11 h-11 border border-line bg-surface" />
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="h-4 w-48 bg-line" />
        <div className="h-3 w-32 bg-surface" />
      </div>
    </div>
  )
}

// ── Shared horizontal project carousel (one slide per project) ────────────────
interface ProjectSlide {
  id: string
  slug: string
  title: string
  description?: string
  coverUrl: string
  coverAlt: string
  /** set when the owner chose a video as the cover */
  coverVideoUrl?: string
}

interface ProjectCarouselProps {
  projects: PortfolioProject[]
  loading: boolean
  label: string
}

const DRAG_CLICK_GUARD_PX = 6

export default function ProjectCarousel({ projects, loading, label }: ProjectCarouselProps) {
  const { t } = useContent()
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [dragging, setDragging] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const dragMoved = useRef(false)

  // One slide per project; every screenshot of that project lives inside its lightbox.
  const slides = useMemo<ProjectSlide[]>(
    () =>
      projects.map((p) => {
        const imgs = p.images ?? []
        const cover = imgs.find((i) => i.is_primary) ?? imgs[0]
        return {
          id: p.id,
          slug: p.slug,
          title: p.title,
          description: p.short_description || undefined,
          coverUrl: cover?.public_url ?? '',
          coverAlt: cover?.alt_text || p.title,
          coverVideoUrl: p.video_is_cover && p.video_url ? p.video_url : undefined,
        }
      }),
    [projects],
  )

  const total = slides.length

  const slideEls = () =>
    Array.from(scrollerRef.current?.querySelectorAll<HTMLElement>('[data-slide]') ?? [])

  /** Scroll the track so slide i is centred. */
  const scrollToIndex = useCallback(
    (i: number, smooth = true) => {
      const scroller = scrollerRef.current
      const el = slideEls()[i]
      if (!scroller || !el) return
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      scroller.scrollTo({
        left: el.offsetLeft - (scroller.clientWidth - el.clientWidth) / 2,
        behavior: smooth && !reduced ? 'smooth' : 'auto',
      })
    },
    [],
  )

  const goTo = useCallback(
    (i: number) => scrollToIndex(((i % total) + total) % total),
    [scrollToIndex, total],
  )
  const prev = useCallback(() => goTo(current - 1), [goTo, current])
  const next = useCallback(() => goTo(current + 1), [goTo, current])

  // Track which slide is centred while the visitor scrolls horizontally
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    let raf = 0
    const update = () => {
      const mid = scroller.scrollLeft + scroller.clientWidth / 2
      let best = 0
      let bestDist = Infinity
      slideEls().forEach((el, i) => {
        const d = Math.abs(el.offsetLeft + el.clientWidth / 2 - mid)
        if (d < bestDist) {
          bestDist = d
          best = i
        }
      })
      setCurrent(best)
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      scroller.removeEventListener('scroll', onScroll)
    }
  }, [loading, total])

  // Keyboard: left/right only while the carousel is on screen
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const el = scrollerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.bottom < 0 || rect.top > window.innerHeight) return
      if (e.key === 'ArrowLeft') prev()
      else next()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [prev, next])

  // Mouse drag to scroll (touch and trackpads already scroll natively)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    const scroller = scrollerRef.current
    if (!scroller) return
    const startX = e.clientX
    const startLeft = scroller.scrollLeft
    dragMoved.current = false

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      if (Math.abs(dx) > DRAG_CLICK_GUARD_PX) {
        dragMoved.current = true
        setDragging(true)
      }
      scroller.scrollLeft = startLeft - dx
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      setDragging(false)
      if (dragMoved.current) {
        // settle on the nearest slide
        const mid = scroller.scrollLeft + scroller.clientWidth / 2
        let best = 0
        let bestDist = Infinity
        slideEls().forEach((el, i) => {
          const d = Math.abs(el.offsetLeft + el.clientWidth / 2 - mid)
          if (d < bestDist) {
            bestDist = d
            best = i
          }
        })
        requestAnimationFrame(() => scrollToIndex(best))
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  if (total === 0) return null

  return (
    <>
  {loading ? (
    <CarouselSkeleton />
  ) : (
    <div aria-label={label}>
      {/* Horizontal scroller: swipe, trackpad, shift+wheel, drag, arrows */}
      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        tabIndex={-1}
        className={`proj-track no-scrollbar flex gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain ${
          dragging ? 'cursor-grabbing' : 'snap-x snap-mandatory cursor-grab'
        }`}
      >
        {slides.map((slide, i) => {
          const isCurrent = i === current
          const href = `/work/${slide.slug}`
          return (
            <div
              key={slide.id}
              data-slide
              className={`proj-card snap-center flex-shrink-0 origin-top transition-[opacity,transform] duration-500 ease-out ${
                isCurrent ? 'opacity-100 scale-100' : 'opacity-40 hover:opacity-70 scale-[0.8]'
              }`}
            >
              <button
                onClick={() => {
                  if (dragMoved.current) {
                    dragMoved.current = false
                    return
                  }
                  if (isCurrent) navigate(href)
                  else scrollToIndex(i)
                }}
                aria-label={isCurrent ? `View project: ${slide.title}` : `Go to ${slide.title}`}
                className={`block w-full overflow-hidden border transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-fg ${
                  isCurrent ? 'border-fg cursor-pointer' : 'border-line'
                }`}
                style={{ aspectRatio: '16/10' }}
              >
                {slide.coverVideoUrl ? (
                  <AutoVideo
                    src={slide.coverVideoUrl}
                    poster={slide.coverUrl || undefined}
                    active={isCurrent}
                    label={`${slide.title} preview video`}
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                ) : slide.coverUrl ? (
                  <img
                    src={slide.coverUrl}
                    alt={slide.coverAlt}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="w-full h-full object-cover select-none"
                    draggable={false}
                  />
                ) : (
                  <ScreenshotPlaceholder label={isCurrent ? slide.title : ''} />
                )}
              </button>

              <div className="mt-6">
                <h3 className="text-2xl font-black tracking-tight text-fg">{slide.title}</h3>
                {slide.description && (
                  <p className="mt-3 text-base text-muted leading-relaxed">{slide.description}</p>
                )}
                <Link
                  to={href}
                  draggable={false}
                  onClick={(e) => {
                    if (dragMoved.current) {
                      e.preventDefault()
                      dragMoved.current = false
                    }
                  }}
                  className="mt-4 inline-flex items-center gap-2 py-3.5 -my-3.5 text-base font-semibold text-fg border-b border-fg pb-0.5 hover:opacity-60 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-fg"
                >
                  {t('carousel.viewProject')}
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M1 11L11 1M3 1h8v8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Arrow buttons + dots (one dot per project) */}
      <div className="flex items-center justify-center gap-4 mt-8 px-6 lg:px-12">
        <button
          onClick={prev}
          disabled={total <= 1}
          aria-label="Previous project"
          className={`w-11 h-11 border flex items-center justify-center transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-fg ${
            total <= 1
              ? 'border-line text-line-strong cursor-not-allowed'
              : 'border-line text-fg hover:border-fg hover:bg-fg hover:text-bg cursor-pointer'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="flex items-center gap-2 flex-wrap justify-center max-w-[50vw]" role="tablist" aria-label="Project indicators">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              role="tab"
              aria-selected={i === current}
              aria-label={`Go to ${slide.title}`}
              onClick={() => goTo(i)}
              className="group flex h-8 items-center px-3.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-fg"
            >
              <span
                className={`block transition-all duration-300 ${
                  i === current ? 'w-6 h-1.5 bg-fg' : 'w-1.5 h-1.5 bg-line group-hover:bg-faint'
                }`}
              />
            </button>
          ))}
        </div>

        <button
          onClick={next}
          disabled={total <= 1}
          aria-label="Next project"
          className={`w-11 h-11 border flex items-center justify-center transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-fg ${
            total <= 1
              ? 'border-line text-line-strong cursor-not-allowed'
              : 'border-line text-fg hover:border-fg hover:bg-fg hover:text-bg cursor-pointer'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

    </div>
  )}
    </>
  )
}
