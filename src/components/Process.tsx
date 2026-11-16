import Reveal from './Reveal'
import { useContent } from '../context/ContentContext'

export default function Process() {
  const { t } = useContent()
  const steps = [1, 2, 3, 4, 5, 6].map((n) => ({
    number: String(n).padStart(2, '0'),
    title: t(`process.${n}.title`),
    description: t(`process.${n}.description`),
  }))

  return (
    <section id="process" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
      {/* Section heading */}
      <Reveal className="border-t-4 border-fg pt-10 mb-16">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted mb-3">{t('process.eyebrow')}</p>
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-fg max-w-lg">
          {t('process.heading1')}<br />{t('process.heading2')}
        </h2>
      </Reveal>

      {/* Steps grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0">
        {steps.map((step, idx) => {
          const col3 = idx % 3
          const col2 = idx % 2

          const lgPadding =
            col3 === 0
              ? 'lg:pl-0 lg:pr-10'
              : col3 === 1
                ? 'lg:px-10'
                : 'lg:pl-10 lg:pr-0'

          const smPadding =
            col2 === 0 ? 'sm:pl-0 sm:pr-8' : 'sm:pl-8 sm:pr-0'

          const lgBorderR = col3 !== 2 ? 'lg:border-r' : 'lg:border-r-0'
          const lgBorderB = idx < 3 ? 'lg:border-b' : 'lg:border-b-0'

          const smBorderR = col2 === 0 ? 'sm:border-r' : 'sm:border-r-0'
          const smBorderB = idx < 4 ? 'sm:border-b' : 'sm:border-b-0'

          const mobileBorderB = idx < 5 ? 'border-b sm:border-b-0' : ''

          return (
            <Reveal
              key={step.number}
              delay={(idx % 3) * 100}
              className={`py-10 border-line ${smPadding} ${lgPadding} ${smBorderR} ${lgBorderR} ${smBorderB} ${lgBorderB} ${mobileBorderB}`}
            >
              <span className="text-4xl font-black text-line block mb-4 select-none">
                {step.number}
              </span>
              <h3 className="text-base font-bold text-fg mb-2">{step.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{step.description}</p>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
