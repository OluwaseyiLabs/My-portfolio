import { useState, type FormEvent } from 'react'

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

export default function Contact() {
  const [status, setStatus] = useState<FormStatus>('idle')
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState<Partial<typeof formData>>({})

  function validate() {
    const errs: Partial<typeof formData> = {}
    if (!formData.name.trim()) errs.name = 'Name is required.'
    if (!formData.email.trim()) {
      errs.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email address.'
    }
    if (!formData.message.trim()) errs.message = 'Message is required.'
    return errs
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setStatus('submitting')

    try {
      const response = await fetch('https://ucy00zep.rpcld.net/webhook-test/portfolio-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
          submittedAt: new Date().toISOString(),
          source: 'portfolio_contact_form',
        }),
      })

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`)
      }

      setStatus('success')
      setFormData({ name: '', email: '', message: '' })
    } catch (err) {
      console.error('Contact submission error:', err)
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
      <div className="border-t-4 border-black pt-10 mb-16">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#555555] mb-3">Get in Touch</p>
        <div className="grid lg:grid-cols-2 gap-10 items-end">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-black">
            Let&apos;s work<br />together.
          </h2>
          <p className="text-[#555555] leading-relaxed lg:max-w-sm">
            Have a project in mind, want to automate a workflow, or need a new website?
            Send a message and I&apos;ll get back to you.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-16">
        {/* Contact form */}
        <div>
          {status === 'success' ? (
            <div className="border border-black p-8 bg-[#FBFBFB]">
              <p className="font-black text-black text-lg mb-2">Message received.</p>
              <p className="text-[#555555] text-sm mb-6 leading-relaxed">
                Thanks for reaching out! Your message was routed to my automation system, and I will be in touch shortly.
              </p>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider border border-black hover:bg-white hover:text-black transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate aria-label="Contact form">
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#555555] mb-2">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange('name')}
                    className={`w-full border px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors ${
                      errors.name ? 'border-red-500' : 'border-[#E5E5E5]'
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
                  <label htmlFor="contact-email" className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#555555] mb-2">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    className={`w-full border px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors ${
                      errors.email ? 'border-red-500' : 'border-[#E5E5E5]'
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
                  <label htmlFor="contact-message" className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#555555] mb-2">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange('message')}
                    className={`w-full border px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors resize-none ${
                      errors.message ? 'border-red-500' : 'border-[#E5E5E5]'
                    }`}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                    aria-invalid={!!errors.message}
                  />
                  {errors.message && (
                    <p id="message-error" role="alert" className="mt-1 text-xs text-red-600">{errors.message}</p>
                  )}
                </div>

                {status === 'error' && (
                  <p role="alert" className="text-sm text-red-600">Something went wrong. Please try again.</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full py-4 bg-black text-white text-sm font-semibold border border-black hover:bg-white hover:text-black transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'submitting' ? 'Sending…' : 'Send Message'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Contact details */}
        <div className="space-y-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#555555] mb-4">Direct links</p>
            <div className="space-y-3">
              <ContactItem label="Email" value="Oluwaseyidavid406@gmail.com" href="mailto:Oluwaseyidavid406@gmail.com" />
              <ContactItem label="GitHub" value="OluwaseyiLabs" href="https://github.com/OluwaseyiLabs" />
              <ContactItem label="LinkedIn" value="oluwaseyidavid8" href="https://www.linkedin.com/in/oluwaseyidavid8/" />
              <ContactItem label="TikTok" value="@oluwaseyidavid8" href="https://www.tiktok.com/@oluwaseyidavid8" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ContactItem({
  label,
  value,
  href,
}: {
  label: string
  value: string
  href: string
}) {
  return (
    <div className="flex items-center gap-4 border-t border-[#E5E5E5] pt-3">
      <span className="text-xs font-semibold text-[#555555] w-20 flex-shrink-0">{label}</span>
      <a
        href={href}
        target={href.startsWith('mailto') ? undefined : '_blank'}
        rel="noreferrer"
        className="text-sm text-black hover:underline underline-offset-2 transition-colors truncate"
      >
        {value}
      </a>
    </div>
  )
}

