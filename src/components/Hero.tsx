export default function Hero() {
  return (
    <section
      className="min-h-screen flex flex-col justify-center pt-24 sm:pt-28 pb-12 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto"
      aria-label="Introduction"
    >
      <div className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-12 items-end">
        <div>
          {/* Small label */}
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#555555] mb-6 sm:mb-8">
            AI Automation &amp; Web Development
          </p>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl xl:text-8xl font-black leading-[1.0] tracking-tight text-black mb-6 sm:mb-8">
            I build systems<br />
            <span className="text-[#333333]">that work for</span><br />
            your business.
          </h1>

          {/* Supporting copy */}
          <p className="text-lg sm:text-xl text-[#555555] max-w-xl leading-relaxed mb-10">
            I combine automation tools, AI agents, and modern web technologies
            to help businesses streamline operations, improve customer
            experiences, and bring digital ideas to life.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <a
              href="#work"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-black text-white text-sm font-semibold border border-black hover:bg-white hover:text-black transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              See My Work
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-black text-sm font-semibold border border-black hover:bg-black hover:text-white transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              Let&apos;s Talk
            </a>
          </div>
        </div>

        {/* Side accent — two service pills stacked vertically */}
        <div className="hidden lg:flex flex-col gap-4 pb-2 self-end">
          <a
            href="#work"
            className="border border-[#E5E5E5] hover:border-black px-5 py-4 min-w-[200px] transition-colors duration-200 group block focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#555555] mb-1">Service 01</p>
            <p className="text-sm font-bold text-black flex items-center justify-between">
              AI Automation
              <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </p>
          </a>
          <a
            href="#web-design"
            className="border border-[#E5E5E5] hover:border-black px-5 py-4 min-w-[200px] transition-colors duration-200 group block focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#555555] mb-1">Service 02</p>
            <p className="text-sm font-bold text-black flex items-center justify-between">
              Web Design &amp; Dev
              <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </p>
          </a>
        </div>
      </div>

      {/* Bottom divider with scroll hint */}
      <div className="mt-20 border-t border-[#E5E5E5] pt-6 flex justify-end items-center">
        <div className="flex items-center gap-2 text-xs text-[#555555]">
          <span className="block w-6 h-0.5 bg-[#E5E5E5]" aria-hidden="true" />
          Scroll to explore
        </div>
      </div>
    </section>
  )
}

