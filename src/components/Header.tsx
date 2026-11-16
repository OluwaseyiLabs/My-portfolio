import { useState, useEffect, useRef } from 'react'
import ThemeToggle from './ThemeToggle'
import { useContent } from '../context/ContentContext'
import { MailIcon } from './icons'

// ── Service dropdown items ────────────────────────────────────────────────────
const serviceItems = [
  {
    href: '#work',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="2" y="5" width="16" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 5V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    key: 'nav.service1',
  },
  {
    href: '#web-design',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="2" y="3" width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M2 7h16" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="4.5" cy="5" r="0.75" fill="currentColor"/>
        <circle cx="7" cy="5" r="0.75" fill="currentColor"/>
        <circle cx="9.5" cy="5" r="0.75" fill="currentColor"/>
        <path d="M7 17v-2M13 17v-2M5 17h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    key: 'nav.service2',
  },
]

// ── Simple plain nav links (no dropdown) ─────────────────────────────────────
const plainLinks = [
  { key: 'nav.work', href: '#work' },
  { key: 'nav.process', href: '#process' },
  { key: 'nav.about', href: '#about' },
  { key: 'nav.contact', href: '#contact' },
]

// ── Mobile flat link list (all links) ────────────────────────────────────────
const mobileLinks = [
  { key: 'nav.services', href: '#services' },
  ...plainLinks,
]

export default function Header() {
  const { t } = useContent()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [activeId, setActiveId] = useState<string>('')

  // Scroll detection
  useEffect(() => {
    let raf = 0
    let max = 0
    // measure the page height only when the layout can change, never inside the scroll handler
    const measure = () => {
      max = document.documentElement.scrollHeight - window.innerHeight
    }
    const update = () => {
      raf = 0
      setScrolled(window.scrollY > 24)
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const onResize = () => {
      measure()
      onScroll()
    }
    measure()
    update()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null
    ro?.observe(document.body)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Highlight the nav link for the section currently in view
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const ids = ['services', 'work', 'web-design', 'process', 'about', 'contact']
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveId(e.target.id)
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Mobile menu: Escape closes, page scroll locked while open
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [menuOpen])

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [dropdownOpen])

  // Close dropdown on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDropdownOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const closeAll = () => {
    setMenuOpen(false)
    setDropdownOpen(false)
    setMobileServicesOpen(false)
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transform-gpu backdrop-blur-lg backdrop-saturate-150 border-b transition-[background-color,border-color] duration-300 ${
        scrolled ? 'bg-bg/70 border-line/70' : 'bg-bg/40 border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">

        {/* Wordmark */}
        <a
          href="#"
          className="py-3 -my-3 text-base font-bold tracking-tight text-fg hover:opacity-70 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2"
          aria-label={`${t('site.wordmark')} home`}
        >
          {t('site.wordmark')}
        </a>

        {/* ── Desktop nav ── */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">

          {/* Services dropdown trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              aria-controls="services-dropdown"
              className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2 rounded-sm"
            >
              {t('nav.services')}
              {/* chevron */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
                className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              >
                <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div
                id="services-dropdown"
                role="menu"
                aria-label="Services menu"
                className="menu-in absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[340px] bg-fg/92 backdrop-blur-xl backdrop-saturate-150 text-bg shadow-2xl overflow-hidden"
                style={{ borderRadius: '6px' }}
              >
                {/* Service rows */}
                {serviceItems.map((item) => (
                  <a
                    key={item.key}
                    href={item.href}
                    role="menuitem"
                    onClick={closeAll}
                    className="flex items-center gap-4 px-5 py-4 border-b border-bg/10 hover:bg-bg/10 transition-colors focus:outline-none focus-visible:bg-bg/10 group"
                  >
                    {/* Icon box */}
                    <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-bg/10 text-bg group-hover:bg-bg/20 transition-colors" style={{ borderRadius: '6px' }}>
                      {item.icon}
                    </span>
                    {/* Text */}
                    <span>
                      <span className="block text-sm font-semibold text-bg leading-tight">
                        {t(`${item.key}.title`)}
                      </span>
                      <span className="block text-xs text-bg/60 mt-0.5 leading-snug">
                        {t(`${item.key}.subtitle`)}
                      </span>
                    </span>
                    {/* Arrow */}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden="true"
                      className="ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-bg"
                    >
                      <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                ))}

                {/* CTA row */}
                <div className="px-5 py-4 bg-bg/5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-bg leading-tight">{t('nav.dropdown.title')}</p>
                    <p className="text-xs text-bg/60 mt-0.5">{t('nav.dropdown.subtitle')}</p>
                  </div>
                  <a
                    href="#contact"
                    role="menuitem"
                    onClick={closeAll}
                    className="flex-shrink-0 ml-4 inline-flex items-center gap-1.5 px-4 py-2 bg-bg text-fg text-xs font-bold hover:bg-line transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-bg focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    style={{ borderRadius: '4px' }}
                  >
                    {t('nav.dropdown.button')}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Plain links */}
          {plainLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={activeId === link.href.slice(1) || (link.href === '#work' && activeId === 'web-design') ? 'true' : undefined}
              className={`relative text-sm font-medium transition-colors after:absolute after:left-0 after:-bottom-1 after:h-px after:w-full after:origin-left after:bg-fg after:transition-transform after:duration-300 ${
                activeId === link.href.slice(1) || (link.href === '#work' && activeId === 'web-design')
                  ? 'text-fg after:scale-x-100'
                  : 'text-muted hover:text-fg after:scale-x-0 hover:after:scale-x-100'
              }`}
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        {/* CTA button + theme toggle */}
        <div className="hidden md:flex items-center gap-6">
          <ThemeToggle />
          <a
            href="#contact"
            data-track="cta:lets-talk-header"
            className="btn-slide inline-flex items-center px-5 py-2 pr-6 bg-fg text-bg text-sm font-medium border border-fg hover:bg-bg hover:text-fg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2"
          >
            <span className="btn-slide__label">{t('nav.cta')}</span>
            <span className="btn-slide__icon"><MailIcon /></span>
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col justify-center gap-1.5 w-11 h-11 -mr-2 px-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-fg"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className={`block h-0.5 bg-fg transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block h-0.5 bg-fg transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 bg-fg transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Scroll progress */}
      <div
        ref={progressRef}
        aria-hidden="true"
        className="absolute left-0 bottom-0 h-0.5 w-full origin-left bg-fg"
        style={{ transform: 'scaleX(0)' }}
      />

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="menu-in md:hidden bg-bg/70 backdrop-blur-xl backdrop-saturate-150 border-t border-line/70 px-6 py-6 flex flex-col gap-1">

          {/* Services accordion */}
          <div>
            <button
              onClick={() => setMobileServicesOpen((v) => !v)}
              aria-expanded={mobileServicesOpen}
              className="w-full flex items-center justify-between py-3 text-base font-medium text-fg focus:outline-none"
            >
              {t('nav.services')}
              <svg
                width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
                className={`transition-transform duration-200 ${mobileServicesOpen ? 'rotate-180' : ''}`}
              >
                <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {mobileServicesOpen && (
              <div className="mt-1 mb-3 bg-fg overflow-hidden" style={{ borderRadius: '6px' }}>
                {serviceItems.map((item) => (
                  <a
                    key={item.key}
                    href={item.href}
                    onClick={closeAll}
                    className="flex items-center gap-3 px-4 py-3.5 border-b border-bg/10 hover:bg-bg/10 transition-colors"
                  >
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-bg/10 text-bg" style={{ borderRadius: '4px' }}>
                      {item.icon}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-bg">{t(`${item.key}.title`)}</span>
                      <span className="block text-xs text-bg/60 mt-0.5">{t(`${item.key}.subtitle`)}</span>
                    </span>
                  </a>
                ))}
                <div className="px-4 py-3 bg-bg/5 flex items-center justify-between">
                  <p className="text-xs text-bg/60">{t('nav.dropdown.mobileNote')}</p>
                  <a
                    href="#contact"
                    onClick={closeAll}
                    className="ml-3 inline-flex items-center px-3 py-1.5 bg-bg text-fg text-xs font-bold hover:bg-line transition-colors"
                    style={{ borderRadius: '4px' }}
                  >
                    {t('nav.dropdown.button')}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Rest of links */}
          {mobileLinks.slice(1).map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={closeAll}
              className="block py-3 text-base font-medium text-fg border-t border-surface hover:opacity-60 transition-opacity"
            >
              {t(link.key)}
            </a>
          ))}

          <ThemeToggle className="mt-4 py-2" />

          <a
            href="#contact"
            data-track="cta:lets-talk-mobile"
            onClick={closeAll}
            className="btn-slide mt-2 inline-flex items-center justify-center px-5 py-3 bg-fg text-bg text-sm font-medium border border-fg hover:bg-bg hover:text-fg transition-colors duration-200"
          >
            <span className="btn-slide__label">{t('nav.cta')}</span>
            <span className="btn-slide__icon"><MailIcon /></span>
          </a>
        </div>
      )}
    </header>
  )
}

