import { MessageIcon } from './icons'
import SocialLinks from './SocialLinks'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { submitInquiry } from '../lib/supabase'
import { sanitizeText, looksLikeInjection, LIMITS } from '../lib/sanitize'
import { applyServerLock, formatWait, lockSecondsLeft, registerAttempt } from '../lib/formThrottle'
import { useContent } from '../context/ContentContext'
import { ROLES, COMPANY_SIZES, REVENUES, BUDGETS, INTERESTS } from '../lib/inquiryOptions'

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

interface FormData {
  firstName: string
  lastName: string
  email: string
  company: string
  website: string
  role: string
  companySize: string
  annualRevenue: string
  projectBudget: string
  message: string
  interests: string[]
  extra: string
}

const EMPTY: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  website: '',
  role: '',
  companySize: '',
  annualRevenue: '',
  projectBudget: '',
  message: '',
  interests: [],
  extra: '',
}

type FormErrors = Partial<Record<keyof FormData, string>>

const inputClass = (invalid: boolean) =>
  `w-full border px-4 py-3 text-base sm:text-sm text-fg bg-bg placeholder:text-faint focus:outline-none focus:border-fg transition-colors ${
    invalid ? 'border-red-500' : 'border-line'
  }`

const labelClass = 'block text-xs font-semibold uppercase tracking-[0.12em] text-muted mb-2'

/** "https://" is added when a visitor types just "acme.com". Returns '' when it is not a usable address. */
function normaliseWebsite(raw: string): string {
  const v = sanitizeText(raw, LIMITS.website).replace(/\s+/g, '')
  if (!v) return ''
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`
  try {
    const u = new URL(withScheme)
    return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.includes('.') ? withScheme : ''
  } catch {
    return ''
  }
}

function Field({ id, label, required, error, children }: { id: string; label: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

function SelectField({
  id, label, required, value, options, placeholder, error, onChange,
}: {
  id: string; label: string; required?: boolean; value: string; options: readonly string[]; placeholder: string; error?: string
  onChange: (v: string) => void
}) {
  return (
    <Field id={id} label={label} required={required} error={error}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputClass(!!error)} appearance-none pr-11 ${value ? '' : 'text-faint'}`}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o} className="text-fg">
              {o}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </Field>
  )
}

export default function Contact() {
  const { t } = useContent()
  const [status, setStatus] = useState<FormStatus>('idle')
  const [formData, setFormData] = useState<FormData>(EMPTY)
  const [errors, setErrors] = useState<FormErrors>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const honeypot = useRef<HTMLInputElement>(null)
  const [waitSeconds, setWaitSeconds] = useState(() => lockSecondsLeft())

  // Live countdown while the form is paused (1 min, 5 min, 15 min, 1 hour after repeated attempts)
  useEffect(() => {
    if (waitSeconds <= 0) return
    const id = window.setInterval(() => setWaitSeconds(lockSecondsLeft()), 1000)
    return () => window.clearInterval(id)
  }, [waitSeconds > 0])

  function validate(): FormErrors {
    const errs: FormErrors = {}
    const first = sanitizeText(formData.firstName, LIMITS.firstName)
    const last = sanitizeText(formData.lastName, LIMITS.lastName)
    const email = sanitizeText(formData.email, LIMITS.email).toLowerCase()
    const company = sanitizeText(formData.company, LIMITS.company)
    const message = sanitizeText(formData.message, LIMITS.message, true)
    const extra = sanitizeText(formData.extra, LIMITS.extra, true)

    if (!first) errs.firstName = 'First name is required.'
    else if (looksLikeInjection(first)) errs.firstName = 'Please enter your real name.'
    if (!last) errs.lastName = 'Last name is required.'
    else if (looksLikeInjection(last)) errs.lastName = 'Please enter your real name.'

    if (!email) errs.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Please enter a valid email address.'

    if (!company) errs.company = 'Company name is required.'
    else if (looksLikeInjection(company)) errs.company = 'Please enter your company name.'

    if (formData.website.trim() && !normaliseWebsite(formData.website)) {
      errs.website = 'Please enter a valid website address, or leave it empty.'
    }

    if (!formData.role) errs.role = 'Please choose your role.'
    if (!formData.companySize) errs.companySize = 'Please choose your company size.'
    if (!formData.annualRevenue) errs.annualRevenue = 'Please choose a revenue range.'
    if (!formData.projectBudget) errs.projectBudget = 'Please choose a budget range.'

    if (!message) errs.message = 'Please tell me how I can help.'
    else if (message.length < 5) errs.message = 'Please write a little more.'
    else if (looksLikeInjection(message)) {
      errs.message = 'Please rephrase your message. It contains wording that cannot be accepted.'
    }

    if (formData.interests.length === 0) errs.interests = 'Please choose at least one option.'
    if (extra && looksLikeInjection(extra)) {
      errs.extra = 'Please rephrase this. It contains wording that cannot be accepted.'
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
      // bring the first problem into view
      const first = Object.keys(errs)[0]
      const id = first === 'interests' ? 'contact-interests' : `contact-${first}`
      document.getElementById(id)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
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
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          company: formData.company,
          website: normaliseWebsite(formData.website),
          role: formData.role,
          companySize: formData.companySize,
          annualRevenue: formData.annualRevenue,
          projectBudget: formData.projectBudget,
          message: formData.message,
          interests: formData.interests,
          extra: formData.extra,
        },
        {
          // Confirm as soon as the message is saved; the n8n delivery carries on in the background
          onSaved: () => {
            setStatus('success')
            setFormData(EMPTY)
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
        setFormData(EMPTY)
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

  function setField<K extends keyof FormData>(field: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function text(field: 'firstName' | 'lastName' | 'email' | 'company' | 'website' | 'message' | 'extra') {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField(field, e.target.value)
  }

  function toggleInterest(option: string) {
    setField(
      'interests',
      formData.interests.includes(option) ? formData.interests.filter((i) => i !== option) : [...formData.interests, option],
    )
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
                name="contact_fax"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <Field id="contact-firstName" label="First name" required error={errors.firstName}>
                    <input
                      id="contact-firstName" type="text" placeholder="John" maxLength={LIMITS.firstName} autoComplete="given-name"
                      value={formData.firstName} onChange={text('firstName')} className={inputClass(!!errors.firstName)}
                      aria-invalid={!!errors.firstName} aria-describedby={errors.firstName ? 'contact-firstName-error' : undefined}
                    />
                  </Field>
                  <Field id="contact-lastName" label="Last name" required error={errors.lastName}>
                    <input
                      id="contact-lastName" type="text" placeholder="Doe" maxLength={LIMITS.lastName} autoComplete="family-name"
                      value={formData.lastName} onChange={text('lastName')} className={inputClass(!!errors.lastName)}
                      aria-invalid={!!errors.lastName} aria-describedby={errors.lastName ? 'contact-lastName-error' : undefined}
                    />
                  </Field>
                </div>

                <Field id="contact-email" label="Email address" required error={errors.email}>
                  <input
                    id="contact-email" type="email" placeholder="john@company.com" maxLength={LIMITS.email} autoComplete="email"
                    value={formData.email} onChange={text('email')} className={inputClass(!!errors.email)}
                    aria-invalid={!!errors.email} aria-describedby={errors.email ? 'contact-email-error' : undefined}
                  />
                </Field>

                <div className="grid sm:grid-cols-2 gap-6">
                  <Field id="contact-company" label="Company name" required error={errors.company}>
                    <input
                      id="contact-company" type="text" placeholder="Barra Inc." maxLength={LIMITS.company} autoComplete="organization"
                      value={formData.company} onChange={text('company')} className={inputClass(!!errors.company)}
                      aria-invalid={!!errors.company} aria-describedby={errors.company ? 'contact-company-error' : undefined}
                    />
                  </Field>
                  <Field id="contact-website" label="Company website (optional)" error={errors.website}>
                    <input
                      id="contact-website" type="text" inputMode="url" placeholder="https://barra.inc" maxLength={LIMITS.website} autoComplete="url"
                      value={formData.website} onChange={text('website')} className={inputClass(!!errors.website)}
                      aria-invalid={!!errors.website} aria-describedby={errors.website ? 'contact-website-error' : undefined}
                    />
                  </Field>
                </div>

                <SelectField id="contact-role" label="Your role" required value={formData.role} options={ROLES}
                  placeholder="Select your role" error={errors.role} onChange={(v) => setField('role', v)} />
                <SelectField id="contact-companySize" label="Company size" required value={formData.companySize} options={COMPANY_SIZES}
                  placeholder="Select company size" error={errors.companySize} onChange={(v) => setField('companySize', v)} />
                <SelectField id="contact-annualRevenue" label="Company's annual revenue" required value={formData.annualRevenue} options={REVENUES}
                  placeholder="Select revenue range" error={errors.annualRevenue} onChange={(v) => setField('annualRevenue', v)} />
                <SelectField id="contact-projectBudget" label="Project budget" required value={formData.projectBudget} options={BUDGETS}
                  placeholder="Select budget range" error={errors.projectBudget} onChange={(v) => setField('projectBudget', v)} />

                <Field id="contact-message" label="How can I help?" required error={errors.message}>
                  <textarea
                    id="contact-message" rows={5} placeholder="Tell me what you're looking to achieve…" maxLength={LIMITS.message}
                    value={formData.message} onChange={text('message')}
                    className={`${inputClass(!!errors.message)} resize-none`}
                    aria-invalid={!!errors.message} aria-describedby={errors.message ? 'contact-message-error' : undefined}
                  />
                </Field>

                <fieldset id="contact-interests" aria-describedby={errors.interests ? 'contact-interests-error' : undefined}>
                  <legend className={labelClass}>
                    What are you hoping to improve? <span aria-hidden="true">*</span>
                  </legend>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {INTERESTS.map((option) => {
                      const checked = formData.interests.includes(option)
                      return (
                        <label
                          key={option}
                          className={`flex items-center gap-3 border px-4 py-3 text-sm text-fg cursor-pointer transition-colors hover:border-fg ${
                            checked ? 'border-fg bg-surface' : errors.interests ? 'border-red-500' : 'border-line'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleInterest(option)}
                            className="h-4 w-4 shrink-0 accent-fg cursor-pointer"
                          />
                          <span>{option}</span>
                        </label>
                      )
                    })}
                  </div>
                  {errors.interests && (
                    <p id="contact-interests-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.interests}
                    </p>
                  )}
                </fieldset>

                <Field id="contact-extra" label="Anything else I should know before reaching out? (optional)" error={errors.extra}>
                  <textarea
                    id="contact-extra" rows={3} placeholder="Any additional context or questions…" maxLength={LIMITS.extra}
                    value={formData.extra} onChange={text('extra')}
                    className={`${inputClass(!!errors.extra)} resize-none`}
                    aria-invalid={!!errors.extra} aria-describedby={errors.extra ? 'contact-extra-error' : undefined}
                  />
                </Field>

                {waitSeconds > 0 && (
                  <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                    Too many attempts. Please wait {formatWait(waitSeconds)} before trying again.
                  </p>
                )}

                {status === 'error' && (
                  <p role="alert" className="text-sm text-red-600 dark:text-red-400">
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
