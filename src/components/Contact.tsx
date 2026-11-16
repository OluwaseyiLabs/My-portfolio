import { MessageIcon } from './icons'
import SocialLinks from './SocialLinks'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { submitInquiry } from '../lib/supabase'
import { sanitizeText, looksLikeInjection, LIMITS } from '../lib/sanitize'
import { applyServerLock, formatWait, lockSecondsLeft, registerAttempt } from '../lib/formThrottle'
import { useContent } from '../context/ContentContext'

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

export default function Contact() {
  const { t } = useContent()
  const [status, setStatus] = useState<FormStatus>('idle')
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState<Partial<typeof formData>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const honeypot = useRef<HTMLInputElement>(null)
  const [waitSeconds, setWaitSeconds] = useState(() => lockSecondsLeft())

  // Live countdown while the form is paused (1 min, 5 min, 15 min, 1 hour after repeated attempts)
  useEffect(() => {
    if (waitSeconds <= 0) return
    const id = window.setInterval(() => setWaitSeconds(lockSecondsLeft()), 1000)
    return () => window.clearInterval(id)
  }, [waitSeconds > 0])

  function validate() {
    const errs: Partial<typeof formData> = {}
    const name = sanitizeText(formData.name, LIMITS.name)
    const email = sanitizeText(formData.email, LIMITS.email).toLowerCase()
    const message = sanitizeText(formData.message, LIMITS.message, true)
    if (!name) errs.name = 'Name is required.'
    else if (looksLikeInjection(name)) errs.name = 'Please enter your real name.'
    if (!email) {
      errs.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address.'
    }
    if (!message) errs.message = 'Message is required.'
    else if (message.length < 5) errs.message = 'Please write a little more.'
    else if (looksLikeInjection(message)) {
      errs.message = 'Please rephrase your message. It contains wording that cannot be accepted.'
    }
    return errs
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    // Too many quick attempts (valid or not): pause the form with a clear message
    const paused = registerAttempt()
    if (paused > 0) {
      setWaitSeconds(paused)
      return
    }
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setErrorMessage(null)

    // Bots fill the hidden field: pretend it worked, send nothing
    if (honeypot.current?.value) {
      setStatus('success')
      return
    }
    setStatus('submitting')

    try {
      const result = await submitInquiry(
        {
          name: sanitizeText(formData.name, LIMITS.name),
          email: sanitizeText(formData.email, LIMITS.email).toLowerCase(),
          message: sanitizeText(formData.message, LIMITS.message, true),
        },
        {
          // Confirm as soon as the message is saved; the n8n delivery carries on in the background
          onSaved: () => {
            setStatus('success')
            setFormData({ name: '', email: '', message: '' })
          },
        },
      )

      if (result.retryAfter) {
        // the server paused this visitor: mirror its wait
        applyServerLock(result.retryAfter)
        setWaitSeconds(result.retryAfter)
        setStatus('idle')
      } else if (result.success) {
        setStatus('success')
        setFormData({ name: '', email: '', message: '' })
      } else {
        setErrorMessage(
          result.webhookError || 'Failed to send message. Please try again or reach out directly via email.'
        )
        setStatus('error')
      }
    } catch (err: any) {
      console.error('Contact submission error:', err)
      setErrorMessage('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  function handleChange(field: keyof typeof formData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <section id="contact" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
      {/* Section heading */}
      <div className="border-t-4 border-fg pt-10 mb-12">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted mb-3">{t('contact.eyebrow')}</p>
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-fg">
          {t('contact.heading1')} {t('contact.heading2')}
        </h2>
        <p className="mt-5 text-lg text-muted leading-relaxed max-w-2xl">
          {t('contact.intro')}
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem] gap-12 lg:gap-20 items-start">
        {/* Contact form */}
        <div className="max-w-2xl">
          {status === 'success' ? (
            <div
              role="status"
              className="sent-box border border-fg p-8 bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-8 overflow-hidden"
            >
              <div>
                <p className="font-black text-fg text-lg mb-2">{t('contact.successTitle')}</p>
                <p className="text-muted text-sm mb-6 leading-relaxed">
                  {t('contact.successText')}
                </p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="px-5 py-2.5 bg-fg text-bg text-xs font-bold uppercase tracking-wider border border-fg hover:bg-bg hover:text-fg transition-colors"
                >
                  {t('contact.successButton')}
                </button>
              </div>

              {/* Stamp flies in, spins, lands with a thud: SENT */}
              <div className="relative flex h-40 w-40 flex-shrink-0 items-center justify-center self-center" aria-hidden="true">
                <span className="stamp-ring absolute inset-2 rounded-full border-2 border-fg" />
                <span className="stamp relative flex h-36 w-36 flex-col items-center justify-center rounded-full border-[5px] border-double border-fg text-fg">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12.5l5 5L20 6.5" />
                  </svg>
                  <span className="mt-1 pl-[0.25em] text-2xl font-black tracking-[0.25em]">SENT</span>
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate aria-label="Contact form">
              <input
                ref={honeypot}
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted mb-2">
                    {t('contact.labelName')}
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder={t('contact.placeholderName')}
                    maxLength={LIMITS.name}
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange('name')}
                    className={`w-full border px-4 py-3 text-base sm:text-sm text-fg bg-bg placeholder:text-faint focus:outline-none focus:border-fg transition-colors ${
                      errors.name ? 'border-red-500' : 'border-line'
                    }`}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && (
                    <p id="name-error" role="alert" className="mt-1 text-xs text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="contact-email" className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted mb-2">
                    {t('contact.labelEmail')}
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    placeholder={t('contact.placeholderEmail')}
                    maxLength={LIMITS.email}
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    className={`w-full border px-4 py-3 text-base sm:text-sm text-fg bg-bg placeholder:text-faint focus:outline-none focus:border-fg transition-colors ${
                      errors.email ? 'border-red-500' : 'border-line'
                    }`}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <p id="email-error" role="alert" className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="contact-message" className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted mb-2">
                    {t('contact.labelMessage')}
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    placeholder={t('contact.placeholderMessage')}
                    maxLength={LIMITS.message}
                    value={formData.message}
                    onChange={handleChange('message')}
                    className={`w-full border px-4 py-3 text-base sm:text-sm text-fg bg-bg placeholder:text-faint focus:outline-none focus:border-fg transition-colors resize-none ${
                      errors.message ? 'border-red-500' : 'border-line'
                    }`}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                    aria-invalid={!!errors.message}
                  />
                  {errors.message && (
                    <p id="message-error" role="alert" className="mt-1 text-xs text-red-600">{errors.message}</p>
                  )}
                </div>

                {waitSeconds > 0 && (
                  <p role="alert" className="text-sm text-red-600">
                    Too many attempts. Please wait {formatWait(waitSeconds)} before trying again.
                  </p>
                )}

                {status === 'error' && (
                  <p role="alert" className="text-sm text-red-600">
                    {errorMessage || 'Something went wrong. Please try again.'}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting' || waitSeconds > 0}
                  className="btn-slide w-full py-4 bg-fg text-bg text-sm font-semibold border border-fg hover:bg-bg hover:text-fg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="btn-slide__label">{status === 'submitting' ? t('contact.sending') : t('contact.button')}</span>
                  <span className="btn-slide__icon"><MessageIcon /></span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Socials, beside the form on wide screens */}
        <div className="pt-10 border-t border-line lg:border-t-0 lg:pt-0">
          <SocialLinks />
        </div>
      </div>
    </section>
  )
}
