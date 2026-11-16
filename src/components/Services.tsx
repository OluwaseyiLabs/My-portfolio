import Reveal from './Reveal'
import { useContent } from '../context/ContentContext'
import { useInView } from '../hooks/useInView'

export default function Services() {
  const { t, lines } = useContent()
  const { ref: headingRef, inView } = useInView<HTMLHeadingElement>(0.6)
  const services = [1, 2].map((n) => ({
    number: t(`services.${n}.number`),
    title: t(`services.${n}.title`),
    description: t(`services.${n}.description`),
    capabilities: lines(`services.${n}.capabilities`),
  }))

  return (
    <section id="services" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto overflow-x-clip">
      {/* Section heading */}
      <div className="border-t-4 border-fg pt-10 mb-16">
        <Reveal as="p" className="text-xs font-semibold tracking-[0.2em] uppercase text-muted mb-3">
          {t('services.eyebrow')}
        </Reveal>
        {/* Each line slams onto the screen when the heading scrolls into view */}
        <h2
          ref={headingRef}
          className={`slam-heading text-4xl sm:text-5xl font-black tracking-tight text-fg ${inView ? 'is-slam' : ''}`}
        >
          <span className={`slam-line ${inView ? 'is-slam' : ''}`}>{t('services.heading1')}</span>
          <span className={`slam-line slam-line-2 ${inView ? 'is-slam' : ''}`}>{t('services.heading2')}</span>
        </h2>
      </div>

      {/* Service grid */}
      <div className="grid md:grid-cols-2 gap-0 border-t border-line">
        {services.map((service, i) => (
          <Reveal
            as="article"
            delay={i * 120}
            key={service.number}
            className="border-b md:border-b-0 md:border-r last:border-r-0 border-line py-12 md:pr-12 md:last:pl-12 md:last:pr-0"
          >
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted mb-6 block">
              {service.number}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-fg mb-4">
              {service.title}
            </h3>
            <p className="text-muted leading-relaxed mb-8 max-w-prose">
              {service.description}
            </p>
            <ul className="space-y-2" aria-label={`${service.title} capabilities`}>
              {service.capabilities.map((cap) => (
                <li key={cap} className="flex items-start gap-3 text-sm text-muted">
                  <span className="mt-1.5 block w-1.5 h-1.5 bg-fg rounded-full flex-shrink-0" aria-hidden="true" />
                  {cap}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

