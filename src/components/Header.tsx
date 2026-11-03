import { useState, useEffect, useRef } from 'react'

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
    title: 'AI Automation',
    subtitle: 'Workflows, AI agents & business automation',
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
    title: 'Web Design & Development',
    subtitle: 'Websites, landing pages & web applications',
  },
]

// ── Simple plain nav links (no dropdown) ─────────────────────────────────────
const plainLinks = [
  { label: 'Work', href: '#work' },
  { label: 'Process', href: '#process' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

// ── Mobile flat link list (all links) ────────────────────────────────────────
const mobileLinks = [
  { label: 'Services', href: '#services' },
  ...plainLinks,
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white border-b border-[#E5E5E5]' : 'bg-white/90 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">

        {/* Wordmark */}
        <a
          href="#"
          className="text-base font-bold tracking-tight text-black hover:opacity-70 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          aria-label="Oluwaseyi — Home"
        >
          Oluwaseyi.
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
              className="flex items-center gap-1.5 text-sm font-medium text-[#333333] hover:text-black transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 rounded-sm"
            >
              Services
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
                className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[340px] bg-black text-white shadow-2xl overflow-hidden"
                style={{ borderRadius: '6px' }}
              >
                {/* Service rows */}
                {serviceItems.map((item) => (
                  <a
                    key={item.title}
                    href={item.href}
                    role="menuitem"
                    onClick={closeAll}
                    className="flex items-center gap-4 px-5 py-4 border-b border-white/10 hover:bg-white/10 transition-colors focus:outline-none focus-visible:bg-white/10 group"
                  >
                    {/* Icon box */}
                    <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white/10 text-white group-hover:bg-white/20 transition-colors" style={{ borderRadius: '6px' }}>
                      {item.icon}
                    </span>
                    {/* Text */}
                    <span>
                      <span className="block text-sm font-semibold text-white leading-tight">
                        {item.title}
                      </span>
                      <span className="block text-xs text-white/60 mt-0.5 leading-snug">
                        {item.subtitle}
                      </span>
                    </span>
                    {/* Arrow */}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden="true"
                      className="ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    >
                      <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                ))}

                {/* CTA row */}
                <div className="px-5 py-4 bg-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">Like What You See?</p>
                    <p className="text-xs text-white/60 mt-0.5">Let&apos;s connect &amp; build something.</p>
                  </div>
                  <a
                    href="#contact"
                    role="menuitem"
                    onClick={closeAll}
                    className="flex-shrink-0 ml-4 inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black text-xs font-bold hover:bg-[#E5E5E5] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    style={{ borderRadius: '4px' }}
                  >
                    Get Started
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
              className="text-sm font-medium text-[#333333] hover:text-black transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA button */}
        <a
          href="#contact"
          className="hidden md:inline-flex items-center px-5 py-2 bg-black text-white text-sm font-medium border border-black hover:bg-white hover:text-black transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          Let&apos;s Talk
        </a>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col justify-center gap-1.5 w-8 h-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className={`block h-0.5 bg-black transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block h-0.5 bg-black transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 bg-black transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#E5E5E5] px-6 py-6 flex flex-col gap-1">

          {/* Services accordion */}
          <div>
            <button
              onClick={() => setMobileServicesOpen((v) => !v)}
              aria-expanded={mobileServicesOpen}
              className="w-full flex items-center justify-between py-3 text-base font-medium text-black focus:outline-none"
            >
              Services
              <svg
                width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
                className={`transition-transform duration-200 ${mobileServicesOpen ? 'rotate-180' : ''}`}
              >
                <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {mobileServicesOpen && (
              <div className="mt-1 mb-3 bg-black overflow-hidden" style={{ borderRadius: '6px' }}>
                {serviceItems.map((item) => (
                  <a
                    key={item.title}
                    href={item.href}
                    onClick={closeAll}
                    className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white/10 text-white" style={{ borderRadius: '4px' }}>
                      {item.icon}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white">{item.title}</span>
                      <span className="block text-xs text-white/60 mt-0.5">{item.subtitle}</span>
                    </span>
                  </a>
                ))}
                <div className="px-4 py-3 bg-white/5 flex items-center justify-between">
                  <p className="text-xs text-white/60">Let&apos;s build something together.</p>
                  <a
                    href="#contact"
                    onClick={closeAll}
                    className="ml-3 inline-flex items-center px-3 py-1.5 bg-white text-black text-xs font-bold hover:bg-[#E5E5E5] transition-colors"
                    style={{ borderRadius: '4px' }}
                  >
                    Get Started
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
              className="block py-3 text-base font-medium text-black border-t border-[#F0F0F0] hover:opacity-60 transition-opacity"
            >
              {link.label}
            </a>
          ))}

          <a
            href="#contact"
            onClick={closeAll}
            className="mt-4 inline-flex items-center justify-center px-5 py-3 bg-black text-white text-sm font-medium border border-black hover:bg-white hover:text-black transition-colors duration-200"
          >
            Let&apos;s Talk
          </a>
        </div>
      )}
    </header>
  )
}

