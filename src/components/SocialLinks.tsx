import { useContent } from '../context/ContentContext'
import { GithubIcon, LinkedinIcon, TiktokIcon, MailIcon } from './icons'
import { safeUrl } from '../lib/safeUrl'

export const SOCIALS = [
  { id: 'github', Icon: GithubIcon },
  { id: 'linkedin', Icon: LinkedinIcon },
  { id: 'tiktok', Icon: TiktokIcon },
  { id: 'email', Icon: MailIcon },
] as const

/** Social tiles for the contact section. Labels and addresses are edited in Studio > Site Content. */
export default function SocialLinks() {
  const { t } = useContent()

  return (
    <div>
      <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-muted mb-5">{t('contact.socials')}</h3>
      <ul className="grid gap-3">
        {SOCIALS.map(({ id, Icon }) => {
          const label = t(`footer.${id}.label`)
          const href = safeUrl(t(`footer.${id}.url`), '#')
          const external = !href.startsWith('mailto:')
          return (
            <li key={id}>
              <a
                href={href}
                data-track={`link:${id}`}
                target={external ? '_blank' : undefined}
                rel="noreferrer"
                aria-label={external ? `${label} (opens in a new tab)` : `${label}: send an email`}
                className="group flex items-center gap-4 border border-line px-4 py-3 hover:border-fg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-line bg-surface text-fg transition-colors duration-200 group-hover:bg-fg group-hover:text-bg group-hover:border-fg">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1 text-base font-bold text-fg">{label}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                  className="flex-shrink-0 text-fg opacity-0 -translate-x-1 transition-[opacity,transform] duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0"
                >
                  <path d="M1 11L11 1M3 1h8v8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
