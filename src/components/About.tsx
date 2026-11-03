export default function About() {
  return (
    <section id="about" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
      {/* Section heading */}
      <div className="border-t-4 border-black pt-10 mb-16">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#555555] mb-3">About</p>
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-black">
          Who I am.
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        {/* Lead statement */}
        <div>
          <p className="text-2xl sm:text-3xl font-black text-black leading-snug">
            I build AI-powered business systems, automate workflows, and design and develop modern websites and web applications.
          </p>
        </div>

        {/* Narrative bio */}
        <div className="space-y-6 text-[#555555] text-base leading-relaxed">
          <p>
            My work spans two areas that reinforce each other: automation that
            removes friction from business operations, and website design and
            development that delivers clear, usable digital experiences to the
            people those businesses serve.
          </p>
          <p>
            I work directly with businesses — understanding the actual goal
            before choosing a tool or writing a line of code.
          </p>
        </div>
      </div>
    </section>
  )
}
