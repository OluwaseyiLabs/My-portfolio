const socialLinks = [
  { label: 'GitHub', href: 'https://github.com/OluwaseyiLabs' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/oluwaseyidavid8/' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@oluwaseyidavid8' },
  { label: 'Email', href: 'mailto:Oluwaseyidavid406@gmail.com' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[#E5E5E5] px-6 lg:px-12 py-10 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        {/* Wordmark */}
        <a
          href="#"
          className="text-base font-bold tracking-tight text-black hover:opacity-70 transition-opacity"
          aria-label="Oluwaseyi — Back to top"
        >
          Oluwaseyi.
        </a>

        {/* Page nav links */}
        <nav className="flex flex-wrap gap-6" aria-label="Footer navigation">
          {['#services', '#work', '#process', '#about', '#contact'].map((href) => (
            <a
              key={href}
              href={href}
              className="text-xs text-[#555555] hover:text-black transition-colors capitalize"
            >
              {href.replace('#', '')}
            </a>
          ))}
        </nav>

        {/* Social links */}
        <nav className="flex flex-wrap gap-5" aria-label="Social links">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith('mailto') ? undefined : '_blank'}
              rel="noreferrer"
              className="text-xs text-[#555555] hover:text-black transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#E5E5E5] pt-6">
        <p className="text-xs text-[#555555]">
          &copy; {year} Oluwaseyi. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

