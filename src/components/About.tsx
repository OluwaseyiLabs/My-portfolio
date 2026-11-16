import Reveal from './Reveal'
import SkillsRow from './SkillsRow'
import { useContent } from '../context/ContentContext'

export default function About() {
  const { t } = useContent()
  return (
    <section id="about" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
      {/* Section heading */}
      <Reveal className="border-t-4 border-fg pt-10 mb-16">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted mb-3">{t('about.eyebrow')}</p>
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-fg">
          {t('about.heading')}
        </h2>
      </Reveal>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        {/* Lead statement */}
        <div>
          <p className="text-2xl sm:text-3xl font-black text-fg leading-snug">
            {t('about.lead')}
          </p>
        </div>

        {/* Narrative bio */}
        <div className="space-y-6 text-muted text-base leading-relaxed">
          <p>{t('about.p1')}</p>
          <p>{t('about.p2')}</p>
        </div>
      </div>

      <Reveal delay={150} className="mt-16">
        <SkillsRow />
      </Reveal>
    </section>
  )
}
