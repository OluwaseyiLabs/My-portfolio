import { useContent } from '../context/ContentContext'
import { safeEmail, safeMediaUrl } from '../lib/safeUrl'

/** Photo, name, email and an "Available for work / Get in touch" line. Edited in Studio > Site Content. */
export default function ProfileCard() {
  const { t } = useContent()
  const name = t('profile.name')
  const email = safeEmail(t('profile.email'))
  const photo = safeMediaUrl(t('profile.photo'))
  const status = t('profile.status').trim()
  const cta = t('profile.cta').trim()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-5">
        <span className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center -rotate-3 overflow-hidden rounded-2xl border-4 border-bg bg-surface shadow-[0_4px_14px_rgba(0,0,0,0.18)] ring-1 ring-line">
          {photo ? (
            <img src={photo} alt={name} className="h-full w-full object-cover grayscale" />
          ) : (
            <span className="text-2xl font-black text-fg" aria-hidden="true">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-medium tracking-tight text-fg truncate">{name}</p>
          {email && <p className="text-lg text-muted truncate">{email}</p>}
        </div>
      </div>

      {(status || (cta && email)) && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {status && (
            <span className="inline-flex items-center gap-3 text-lg text-ok">
              <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-40 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ok" />
              </span>
              {status}
            </span>
          )}
          {cta && email && (
            <a
              href={`mailto:${email}`}
              data-track="link:email"
              className="group inline-flex items-center gap-2 text-lg font-medium text-fg hover:opacity-70 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-sm"
            >
              {cta}
              <svg
                width="14"
                height="14"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              >
                <path d="M1 11L11 1M3 1h8v8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  )
}
