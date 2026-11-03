import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchPublishedProjects } from '../lib/supabase'
import type { PortfolioProject } from '../types/portfolio'

// ── Default fallback projects ────────────────────────────────────────────────
const fallbackProjects: PortfolioProject[] = [
  {
    id: 'voltedge',
    title: 'VoltEdge Tech & Accessories',
    slug: 'voltedge-tech-accessories',
    category: 'WEB_DEVELOPMENT',
    short_description: 'E-commerce Website and instant-order checkout experience',
    technologies: ['E-commerce', 'React', 'TypeScript', 'Responsive Design'],
    status: 'PUBLISHED',
    featured: true,
    sort_order: 1,
    images: [],
  },
  {
    id: 'portfolio',
    title: 'Oluwaseyi Portfolio',
    slug: 'oluwaseyi-portfolio',
    category: 'WEB_DEVELOPMENT',
    short_description: 'Personal Portfolio website with custom CMS architecture',
    technologies: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
    status: 'PUBLISHED',
    featured: true,
    sort_order: 2,
    images: [],
  },
]

export interface WebGalleryItem {
  id: string
  imageUrl: string
  altText: string
  caption?: string
  projectTitle: string
  projectUrl?: string
  shortDescription?: string
}

// ── Placeholder image ─────────────────────────────────────────────────────────
function ScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <div className="w-full h-full bg-[#F5F5F5] flex flex-col items-center justify-center gap-3 select-none">
      {/* Browser chrome mock */}
      <div className="w-3/4 max-w-xs border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
        <div className="bg-[#F0F0F0] px-3 py-2 flex items-center gap-1.5 border-b border-[#E5E5E5]">
          <span className="w-2 h-2 rounded-full bg-[#DDDDDD]" />
          <span className="w-2 h-2 rounded-full bg-[#DDDDDD]" />
          <span className="w-2 h-2 rounded-full bg-[#DDDDDD]" />
          <span className="ml-2 flex-1 h-3 bg-[#E5E5E5] rounded-sm" />
        </div>
        <div className="h-16 flex items-center justify-center">
          <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="26" height="18" rx="1" stroke="#CCCCCC" strokeWidth="1"/>
            <path d="M1 6h26" stroke="#CCCCCC" strokeWidth="1"/>
          </svg>
        </div>
      </div>
      <p className="text-xs text-[#AAAAAA] text-center leading-tight px-4">
        Screenshot placeholder<br />{label}
      </p>
    </div>
  )
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({
  items,
  startIndex,
  onClose,
}: {
  items: WebGalleryItem[]
  startIndex: number
  onClose: () => void
}) {
  const [current, setCurrent] = useState(startIndex)
  const total = items.length

  const prev = useCallback(() => setCurrent((i) => (i - 1 + total) % total), [total])
  const next = useCallback(() => setCurrent((i) => (i + 1) % total), [total])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [prev, next, onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const currentItem = items[current]

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Web design preview — ${currentItem?.projectTitle}`}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <span className="text-sm font-mono text-white/60">
          {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <button
          onClick={onClose}
          aria-label="Close preview"
          className="w-9 h-9 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Image area with side arrows */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-16 min-h-0 relative">
        {/* Prev arrow */}
        <button
          onClick={prev}
          disabled={total <= 1}
          aria-label="Previous image"
          className={`absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 border flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
            total <= 1
              ? 'border-white/10 text-white/20 cursor-not-allowed'
              : 'border-white/20 text-white/70 hover:text-white hover:border-white hover:bg-white/10 cursor-pointer'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Image / placeholder */}
        <div className="w-full max-w-4xl h-full max-h-[75dvh] overflow-hidden border border-white/10 flex items-center justify-center bg-black/40">
          {currentItem?.imageUrl ? (
            <img
              key={currentItem.id}
              src={currentItem.imageUrl}
              alt={currentItem.altText || currentItem.projectTitle}
              className="w-full h-full object-contain select-none"
            />
          ) : (
            <ScreenshotPlaceholder label={currentItem?.projectTitle || ''} />
          )}
        </div>

        {/* Next arrow */}
        <button
          onClick={next}
          disabled={total <= 1}
          aria-label="Next image"
          className={`absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 border flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
            total <= 1
              ? 'border-white/10 text-white/20 cursor-not-allowed'
              : 'border-white/20 text-white/70 hover:text-white hover:border-white hover:bg-white/10 cursor-pointer'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Bottom label */}
      <div className="flex-shrink-0 px-6 py-5 text-center border-t border-white/10 flex flex-col items-center gap-1.5">
        <p className="text-sm font-semibold text-white">{currentItem?.projectTitle}</p>
        {currentItem?.caption && (
          <p className="text-xs text-white/80 max-w-md">{currentItem.caption}</p>
        )}
        {currentItem?.shortDescription && !currentItem?.caption && (
          <p className="text-xs text-white/60 max-w-md">{currentItem.shortDescription}</p>
        )}
        {currentItem?.projectUrl && (
          <a
            href={currentItem.projectUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-white border-b border-white hover:opacity-75 transition-opacity mt-1"
          >
            Visit Live Website ↗
          </a>
        )}
      </div>
    </div>
  )
}

// ── Main carousel ─────────────────────────────────────────────────────────────
export default function WebDesignSection() {
  const [projects, setProjects] = useState<PortfolioProject[]>(fallbackProjects)
  const [current, setCurrent] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Fetch live published web projects from Supabase
  useEffect(() => {
    let isMounted = true
    fetchPublishedProjects('WEB_DEVELOPMENT').then((data) => {
      if (isMounted && data.length > 0) {
        setProjects(data)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Flatten projects into all website image gallery items
  const galleryItems = useMemo<WebGalleryItem[]>(() => {
    const items: WebGalleryItem[] = []
    for (const p of projects) {
      if (p.images && p.images.length > 0) {
        for (const img of p.images) {
          items.push({
            id: `${p.id}-${img.id}`,
            imageUrl: img.public_url,
            altText: img.alt_text || p.title,
            caption: img.caption || undefined,
            projectTitle: p.title,
            projectUrl: p.project_url || undefined,
            shortDescription: p.short_description || undefined,
          })
        }
      } else {
        items.push({
          id: p.id,
          imageUrl: '',
          altText: p.title,
          projectTitle: p.title,
          projectUrl: p.project_url || undefined,
          shortDescription: p.short_description || undefined,
        })
      }
    }
    return items
  }, [projects])

  const total = galleryItems.length
  const prev = () => setCurrent((i) => (i - 1 + total) % total)
  const next = () => setCurrent((i) => (i + 1) % total)

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  // Keep current in range if galleryItems changes
  useEffect(() => {
    if (current >= total && total > 0) {
      setCurrent(0)
    }
  }, [total, current])

  // Keyboard nav for carousel (only when lightbox is closed)
  useEffect(() => {
    if (lightboxIndex !== null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [lightboxIndex, total])

  if (total === 0) return null

  // Indices for the carousel strip: prev, current, next
  const prevIdx = (current - 1 + total) % total
  const nextIdx = (current + 1) % total

  const carouselItems = [
    { item: galleryItems[prevIdx], position: 'prev', idx: prevIdx },
    { item: galleryItems[current], position: 'current', idx: current },
    { item: galleryItems[nextIdx], position: 'next', idx: nextIdx },
  ]

  const currentItem = galleryItems[current]

  return (
    <section id="web-design" className="py-24 max-w-7xl mx-auto">
      {/* Section heading */}
      <div className="border-t-4 border-black pt-10 mb-10 px-6 lg:px-12">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#555555] mb-3">
          Web Design &amp; Development
        </p>
        <div className="grid md:grid-cols-2 gap-6 items-end">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-black leading-tight">
            Web Design &amp; Development Portfolio — See What I&apos;ve Built
          </h2>
          <p className="text-[#555555] leading-relaxed md:max-w-sm md:ml-auto">
            From business websites and landing pages to e-commerce stores and web
            applications — modern, responsive digital experiences focused on
            design, usability, and functionality.
          </p>
        </div>
      </div>

      {/* ── Carousel ── */}
      <div className="relative overflow-hidden" aria-label="Web design portfolio carousel">
        {/* Track */}
        <div className="flex items-center justify-center gap-4 px-4 sm:px-0">
          {carouselItems.map(({ item, position, idx }) => {
            const isCurrent = position === 'current'

            return (
              <button
                key={`${item.id}-${position}`}
                onClick={() =>
                  isCurrent ? openLightbox(idx) : position === 'prev' ? prev() : next()
                }
                aria-label={
                  isCurrent
                    ? `View ${item.projectTitle} (Image ${idx + 1} of ${total})`
                    : position === 'prev'
                    ? 'Previous website image'
                    : 'Next website image'
                }
                className={`flex-shrink-0 overflow-hidden border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                  isCurrent
                    ? 'w-[60vw] sm:w-[52vw] max-w-2xl border-black cursor-zoom-in'
                    : 'w-[18vw] sm:w-[16vw] max-w-xs border-[#E5E5E5] opacity-40 hover:opacity-60 cursor-pointer'
                }`}
                style={{ aspectRatio: '16/10' }}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.altText || item.projectTitle}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <ScreenshotPlaceholder label={isCurrent ? item.projectTitle : ''} />
                )}
              </button>
            )
          })}
        </div>

        {/* Arrow buttons */}
        <div className="flex items-center justify-center gap-4 mt-8 px-6 lg:px-12">
          <button
            onClick={prev}
            disabled={total <= 1}
            aria-label="Previous website image"
            className={`w-11 h-11 border flex items-center justify-center transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${
              total <= 1
                ? 'border-[#E5E5E5] text-[#CCCCCC] cursor-not-allowed'
                : 'border-[#E5E5E5] text-black hover:border-black hover:bg-black hover:text-white cursor-pointer'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Dot indicators */}
          <div className="flex items-center gap-2" role="tablist" aria-label="Website image indicators">
            {galleryItems.map((item, i) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={i === current}
                aria-label={`Go to image ${i + 1}`}
                onClick={() => setCurrent(i)}
                className={`transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                  i === current ? 'w-6 h-1.5 bg-black' : 'w-1.5 h-1.5 bg-[#E5E5E5] hover:bg-[#AAAAAA]'
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            disabled={total <= 1}
            aria-label="Next website image"
            className={`w-11 h-11 border flex items-center justify-center transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${
              total <= 1
                ? 'border-[#E5E5E5] text-[#CCCCCC] cursor-not-allowed'
                : 'border-[#E5E5E5] text-black hover:border-black hover:bg-black hover:text-white cursor-pointer'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Current website image label & counter */}
        <div className="mt-6 text-center px-6">
          <p className="text-base font-black text-black">{currentItem.projectTitle}</p>
          {currentItem.caption && (
            <p className="text-xs text-[#555555] mt-1">{currentItem.caption}</p>
          )}
          {currentItem.shortDescription && !currentItem.caption && (
            <p className="text-xs text-[#555555] mt-1">{currentItem.shortDescription}</p>
          )}
          <p className="text-[11px] font-mono text-[#888888] mt-2">
            Image {current + 1} of {total}
          </p>
          <button
            onClick={() => openLightbox(current)}
            className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-black border-b border-black pb-0.5 hover:opacity-60 transition-opacity focus:outline-none focus-visible:underline"
          >
            View full screenshot
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 1h10M11 1v10M1 11l10-10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          items={galleryItems}
          startIndex={lightboxIndex}
          onClose={closeLightbox}
        />
      )}
    </section>
  )
}

