const steps = [
  {
    number: '01',
    title: 'Understand the goal',
    description:
      'I start by understanding the business goal, the user needs and the constraints, before writing a single line of code or automation logic.',
  },
  {
    number: '02',
    title: 'Plan the solution',
    description:
      'I plan a clear solution and choose the right tools for the job. I avoid over-engineering and focus on what will actually work.',
  },
  {
    number: '03',
    title: 'Design the experience',
    description:
      "Whether it's a workflow or a website, I design the experience before building, mapping out the flow, the layout, and the edge cases.",
  },
  {
    number: '04',
    title: 'Build & integrate',
    description:
      'I build, integrate, and refine the solution, connecting the pieces, testing each integration, and making sure the system holds together.',
  },
  {
    number: '05',
    title: 'Test & refine',
    description:
      "I test key flows, responsiveness, and error handling. I don't mark something done until it behaves reliably under real conditions.",
  },
  {
    number: '06',
    title: 'Document honestly',
    description:
      "I document the result honestly — what works, what's in progress, and what comes next. No inflated claims, no missing steps.",
  },
]

export default function Process() {
  return (
    <section id="process" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
      {/* Section heading */}
      <div className="border-t-4 border-black pt-10 mb-16">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#555555] mb-3">How I Work</p>
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-black max-w-lg">
          A clear process,<br />every time.
        </h2>
      </div>

      {/* Steps grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0">
        {steps.map((step, idx) => (
          <div
            key={step.number}
            className={`py-8 pr-8 border-[#E5E5E5] ${idx < 3 ? 'border-b' : ''
              } ${idx % 3 !== 2 ? 'lg:border-r' : ''} ${idx % 2 !== 1 ? 'sm:border-r lg:border-r-0' : ''
              } ${idx % 2 !== 1 && idx % 3 !== 2 ? 'lg:border-r' : ''}`}
          >
            <span className="text-4xl font-black text-[#E5E5E5] block mb-4 select-none">
              {step.number}
            </span>
            <h3 className="text-base font-bold text-black mb-2">{step.title}</h3>
            <p className="text-sm text-[#555555] leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
