import { SOCIALS } from './SocialLinks'
import { smoothScrollTo } from '../lib/smoothScroll'
import { safeUrl } from '../lib/safeUrl'
import { useContent } from '../context/ContentContext'

export default function Footer() {
  const { t } = useContent()
  const socialLinks = SOCIALS.map(({ id, Icon }) => ({ id, label: t(`footer.${id}.label`), href: safeUrl(t(`footer.${id}.url`), '#'), Icon }))
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-line px-6 lg:px-12 py-10 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        {/* Wordmark */}
        <a
          href="#"
          className="inline-block py-3 -my-3 text-base font-bold tracking-tight text-fg hover:opacity-70 transition-opacity"
          aria-label={`${t('site.wordmark')} back to top`}
        >
          {t('site.wordmark')}
        </a>

        {/* Social links */}
        <nav className="flex flex-wrap gap-5" aria-label="Social links">
          {socialLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              data-track={`link:${link.id}`}
              target={link.href.startsWith('mailto') ? undefined : '_blank'}
              rel="noreferrer"
              className="group inline-flex items-center gap-2 py-3 -my-3 text-sm text-muted hover:text-fg transition-colors"
            >
              <link.Icon className="transition-transform duration-200 group-hover:-translate-y-0.5" />
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-line pt-6 flex items-center justify-between gap-4">
        <p className="text-xs text-muted">
          &copy; {year} {t('site.copyright')}
        </p>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            smoothScrollTo(0)
          }}
          className="group inline-flex items-center gap-2 py-3 -my-3 text-xs text-muted hover:text-fg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-sm"
        >
          {t('footer.backToTop')}
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
            className="-ml-1 opacity-0 translate-y-1.5 transition-[opacity,transform] duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0"
          >
            <path d="M7 12V2M3 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </footer>
  )
}

