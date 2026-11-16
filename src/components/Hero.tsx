import Reveal from './Reveal'
import SkillsRow from './SkillsRow'
import SystemAnimation from './SystemAnimation'
import { useInView } from '../hooks/useInView'
import { useContent } from '../context/ContentContext'
import { MailIcon } from './icons'

export default function Hero() {
  const { t } = useContent()
  const { ref: systemRef, inView: systemVisible } = useInView<HTMLDivElement>(0.05)
  return (
    <section
      className="min-h-svh flex flex-col justify-center pt-24 sm:pt-28 pb-12 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto"
      aria-label="Introduction"
    >
      <div className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-12 items-end">
        <div>
          {/* Small label */}
          <Reveal as="p" className="text-xs font-semibold tracking-[0.2em] uppercase text-muted mb-6 sm:mb-8">
            {t('hero.label')}
          </Reveal>

          {/* Main headline */}
          <Reveal as="h1" delay={100} className="text-4xl sm:text-6xl md:text-7xl xl:text-8xl font-black leading-[1.0] tracking-tight text-fg mb-6 sm:mb-8">
            {t('hero.headline1')}<br />
            <span className="text-muted">{t('hero.headline2')}</span><br />
            {t('hero.headline3')}
          </Reveal>

          {/* Supporting copy */}
          <Reveal as="p" delay={200} className="text-lg sm:text-xl text-muted max-w-xl leading-relaxed mb-10">
            {t('hero.paragraph')}
          </Reveal>

          {/* CTAs */}
          <Reveal delay={300} className="flex flex-wrap gap-4">
            <a
              href="#work"
              data-track="cta:see-my-work"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-fg text-bg text-sm font-semibold border border-fg hover:bg-bg hover:text-fg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2"
            >
              {t('hero.cta1')}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a
              href="#contact"
              data-track="cta:lets-talk-hero"
              className="btn-slide inline-flex items-center gap-2 px-7 py-3.5 bg-bg text-fg text-sm font-semibold border border-fg hover:bg-fg hover:text-bg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2"
            >
              <span className="btn-slide__label">{t('hero.cta2')}</span>
              <span className="btn-slide__icon"><MailIcon /></span>
            </a>
          </Reveal>
        </div>

        {/* Right column: the system -> business animation lines up with the headline, service boxes sit at the bottom */}
        <div className="hidden lg:flex flex-col justify-between self-stretch">
          <div ref={systemRef} className={`mt-[3.25rem] flex justify-center ${systemVisible ? '' : 'sys-paused'}`}>
            <SystemAnimation className="h-[216px] xl:h-[288px] w-auto text-fg" />
          </div>

        <div className="flex flex-col gap-4 pb-2">
          <a
            href="#work"
            className="border border-line hover:border-fg px-5 py-4 min-w-[200px] bg-bg transition-[transform,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.06] hover:shadow-[0_10px_30px_rgba(0,0,0,0.12)] group block focus:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:scale-[1.06] motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-muted mb-1">{t('hero.pill1.label')}</p>
            <p className="text-sm font-bold text-fg flex items-center justify-between">
              {t('hero.pill1.title')}
              <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </p>
          </a>
          <a
            href="#web-design"
            className="border border-line hover:border-fg px-5 py-4 min-w-[200px] bg-bg transition-[transform,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.06] hover:shadow-[0_10px_30px_rgba(0,0,0,0.12)] group block focus:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:scale-[1.06] motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-muted mb-1">{t('hero.pill2.label')}</p>
            <p className="text-sm font-bold text-fg flex items-center justify-between">
              {t('hero.pill2.title')}
              <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </p>
          </a>
        </div>
        </div>
      </div>

      {/* Divider, then skills, then scroll hint */}
      <div className="mt-20 border-t border-line pt-8">
        <Reveal delay={400}>
          <SkillsRow />
        </Reveal>
        <div className="mt-10 flex justify-end items-center">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="block w-6 h-0.5 bg-line" aria-hidden="true" />
            {t('hero.scroll')}
          </div>
        </div>
      </div>
    </section>
  )
}

