interface ServiceItem {
  number: string
  title: string
  description: string
  capabilities: string[]
}

const services: ServiceItem[] = [
  {
    number: '01',
    title: 'AI Automation',
    description:
      'I design and build automated workflows and AI-powered business systems that connect tools, reduce repetitive manual work, and improve operational consistency.',
    capabilities: [
      'n8n workflow automation',
      'AI agents & customer communication',
      'Appointment & follow-up automation',
      'CRM & lead-management workflows',
      'Email, form, calendar & database integrations',
    ],
  },
  {
    number: '02',
    title: 'Website Design & Development',
    description:
      'I design and develop modern, responsive websites and web applications with a focus on clear user experiences, thoughtful layouts, and practical functionality.',
    capabilities: [
      'Business websites & landing pages',
      'Responsive web applications & dashboards',
      'Modern design and implementation',
    ],
  },
]

export default function Services() {
  return (
    <section id="services" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
      {/* Section heading */}
      <div className="border-t-4 border-black pt-10 mb-16">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#555555] mb-3">What I Do</p>
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-black">
          Two areas.<br />One focus.
        </h2>
      </div>

      {/* Service grid */}
      <div className="grid md:grid-cols-2 gap-0 border-t border-[#E5E5E5]">
        {services.map((service) => (
          <article
            key={service.number}
            className="border-b md:border-b-0 md:border-r last:border-r-0 border-[#E5E5E5] py-12 md:pr-12 md:last:pl-12 md:last:pr-0"
          >
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#555555] mb-6 block">
              {service.number}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-black mb-4">
              {service.title}
            </h3>
            <p className="text-[#555555] leading-relaxed mb-8 max-w-prose">
              {service.description}
            </p>
            <ul className="space-y-2" aria-label={`${service.title} capabilities`}>
              {service.capabilities.map((cap) => (
                <li key={cap} className="flex items-start gap-3 text-sm text-[#333333]">
                  <span className="mt-1.5 block w-1.5 h-1.5 bg-black rounded-full flex-shrink-0" aria-hidden="true" />
                  {cap}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}

