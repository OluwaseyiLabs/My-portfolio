const tools = [
  { category: 'Automation', items: ['n8n', 'APIs & Webhooks', 'Business Workflow Integrations'] },
  { category: 'AI', items: ['AI Agents', 'AI-powered Business Systems'] },
  { category: 'Web', items: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'] },
  { category: 'Backend & Data', items: ['Python', 'FastAPI', 'Supabase', 'PostgreSQL'] },
]

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

      <div className="grid lg:grid-cols-[1fr_1fr] gap-16 items-start">
        {/* Bio */}
        <div>
          <p className="text-xl text-[#333333] leading-relaxed mb-6">
            I build AI-powered business systems, automate workflows, and design
            and develop modern websites and web applications.
          </p>
          <p className="text-[#555555] leading-relaxed mb-6">
            My work spans two areas that reinforce each other: automation that
            removes friction from business operations, and website design and
            development that delivers clear, usable digital experiences to the
            people those businesses serve.
          </p>
          <p className="text-[#555555] leading-relaxed">
            I work directly with businesses - understanding the actual goal
            before choosing a tool or writing a line of code.
          </p>
        </div>

        {/* Tools & technologies */}
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#555555] mb-6">
            Tools &amp; Technologies
          </p>
          <div className="space-y-6">
            {tools.map((group) => (
              <div key={group.category} className="grid grid-cols-[120px_1fr] gap-4 border-t border-[#E5E5E5] pt-4">
                <span className="text-xs font-semibold text-[#555555] pt-0.5">{group.category}</span>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="text-xs font-medium px-3 py-1 border border-[#E5E5E5] text-[#333333]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

