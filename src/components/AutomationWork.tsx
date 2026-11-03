import { useState, useEffect, useRef, useCallback } from 'react'

// ── Data ─────────────────────────────────────────────────────────────────────
interface AutomationProject {
  id: string
  title: string
  subtitle: string
  tags: string[]
  challenge: string
  solution: string
  /** Path to a real workflow screenshot once supplied. null = show placeholder. */
  workflowImage: string | null
  workflowAlt: string
}

const projects: AutomationProject[] = [
  {
    id: 'dental-clinic',
    title: "O'seyi Dental Clinic",
    subtitle: 'AI-powered appointment booking & customer communication workflow',
    tags: ['n8n', 'AI Agents', 'Email Automation', 'Appointment Workflows'],
    challenge:
      'The clinic was managing appointment requests manually — staff spent significant time chasing confirmations, sending reminders by hand, and following up with patients who missed their slots. This created delays, increased no-shows, and took attention away from patient care.',
    solution:
      'An automated end-to-end appointment workflow built in n8n: incoming requests are captured, an AI-assisted confirmation is sent immediately, reminders fire automatically before the appointment, and follow-up messages are triggered post-visit — all without manual intervention.',
    workflowImage: null,
    workflowAlt: "O'seyi Dental Clinic appointment automation workflow diagram",
  },
  {
    id: 'homes-properties',
    title: 'Oluwaseyi Homes & Properties',
    subtitle: 'Real estate CRM automation and lead-management workflow',
    tags: ['n8n', 'CRM Automation', 'Lead Scoring', 'Notifications', 'Audit Logging'],
    challenge:
      'New leads coming in through multiple channels were being missed or responded to too slowly. There was no consistent way to score, assign, or follow up with leads — meaning high-value enquiries were falling through the gaps.',
    solution:
      'A lead-management automation that captures enquiries from all entry points, scores them by intent and property interest, assigns each lead to the right consultant, fires immediate notifications, and logs every action for a full audit trail — reducing response time and improving conversion consistency.',
    workflowImage: null,
    workflowAlt: 'Oluwaseyi Homes & Properties lead management automation workflow diagram',
  },
]

// ── Catalogue card ────────────────────────────────────────────────────────────
function ProjectCard({
  project,
  index,
  onOpen,
}: {
  project: AutomationProject
  index: number
  onOpen: (p: AutomationProject) => void
}) {
  return (
    <article className="group flex flex-col border border-[#E5E5E5] hover:border-black transition-colors duration-200 cursor-pointer focus-within:border-black">
      {/* Workflow image / placeholder */}
      <button
        onClick={() => onOpen(project)}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset"
        aria-label={`View case study: ${project.title}`}
      >
        <div
          className="w-full bg-[#F5F5F5] border-b border-[#E5E5E5] flex items-center justify-center overflow-hidden"
          style={{ aspectRatio: '16/9' }}
        >
          {project.workflowImage ? (
            <img
              src={project.workflowImage}
              alt={project.workflowAlt}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              {/* n8n-style node grid icon */}
              <svg width="48" height="36" viewBox="0 0 48 36" fill="none" aria-hidden="true">
                <rect x="1" y="8" width="10" height="7" rx="1" stroke="#CCCCCC" strokeWidth="1.2" fill="#EFEFEF"/>
                <rect x="19" y="1" width="10" height="7" rx="1" stroke="#CCCCCC" strokeWidth="1.2" fill="#EFEFEF"/>
                <rect x="19" y="14" width="10" height="7" rx="1" stroke="#CCCCCC" strokeWidth="1.2" fill="#EFEFEF"/>
                <rect x="37" y="8" width="10" height="7" rx="1" stroke="#CCCCCC" strokeWidth="1.2" fill="#EFEFEF"/>
                <rect x="37" y="22" width="10" height="7" rx="1" stroke="#CCCCCC" strokeWidth="1.2" fill="#EFEFEF"/>
                <line x1="11" y1="11.5" x2="19" y2="4.5" stroke="#CCCCCC" strokeWidth="1"/>
                <line x1="11" y1="11.5" x2="19" y2="17.5" stroke="#CCCCCC" strokeWidth="1"/>
                <line x1="29" y1="4.5" x2="37" y2="11.5" stroke="#CCCCCC" strokeWidth="1"/>
                <line x1="29" y1="17.5" x2="37" y2="11.5" stroke="#CCCCCC" strokeWidth="1"/>
                <line x1="29" y1="17.5" x2="37" y2="25.5" stroke="#CCCCCC" strokeWidth="1"/>
              </svg>
              <p className="text-xs text-[#AAAAAA] leading-tight">
                Workflow screenshot<br />placeholder
              </p>
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="p-6 text-left">
          <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#555555] mb-3 block">
            {String(index + 1).padStart(2, '0')} — AI Automation
          </span>
          <h3 className="text-lg font-black tracking-tight text-black mb-2 group-hover:underline underline-offset-2">
            {project.title}
          </h3>
          <p className="text-sm text-[#555555] leading-relaxed mb-4">{project.subtitle}</p>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span key={tag} className="text-[11px] font-medium px-2.5 py-0.5 border border-[#E5E5E5] text-[#555555]">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </button>

      {/* View case study footer */}
      <button
        onClick={() => onOpen(project)}
        className="mt-auto flex items-center justify-between px-6 py-3 border-t border-[#E5E5E5] text-xs font-semibold text-black group-hover:bg-black group-hover:text-white transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset"
      >
        View Case Study
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </article>
  )
}

// ── Modal detail view ─────────────────────────────────────────────────────────
function ProjectModal({
  project,
  onClose,
}: {
  project: AutomationProject
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)

  // Focus close button on open
  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Case study: ${project.title}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Panel */}
      <div className="relative w-full sm:max-w-3xl max-h-[92dvh] bg-white overflow-y-auto flex flex-col">

        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#E5E5E5] px-6 sm:px-8 py-4 flex items-center justify-between">
          <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#555555]">
            Case Study — AI Automation
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close case study"
            className="flex items-center justify-center w-8 h-8 border border-[#E5E5E5] hover:border-black hover:bg-black hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 sm:px-8 py-8 flex flex-col gap-10">

          {/* Title block */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-black mb-3">
              {project.title}
            </h2>
            <p className="text-[#555555] text-base leading-relaxed mb-5">{project.subtitle}</p>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span key={tag} className="text-xs font-medium px-3 py-1 border border-[#E5E5E5] text-[#333333]">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Challenge + Solution — two-column on sm+ */}
          <div className="grid sm:grid-cols-2 gap-5">
            {/* Challenge */}
            <div className="border border-[#E5E5E5] p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 bg-black block flex-shrink-0" aria-hidden="true" />
                <h3 className="text-sm font-black uppercase tracking-[0.12em] text-black">
                  Core Challenge
                </h3>
              </div>
              <p className="text-sm text-[#555555] leading-relaxed">{project.challenge}</p>
            </div>

            {/* Solution */}
            <div className="border border-black p-6 bg-black text-white">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 bg-white block flex-shrink-0" aria-hidden="true" />
                <h3 className="text-sm font-black uppercase tracking-[0.12em] text-white">
                  Solution Delivered
                </h3>
              </div>
              <p className="text-sm text-white/75 leading-relaxed">{project.solution}</p>
            </div>
          </div>

          {/* Workflow image */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.12em] text-black mb-4 flex items-center gap-3">
              Workflow Implementation
              <span className="flex-1 h-px bg-[#E5E5E5]" aria-hidden="true" />
            </h3>

            {project.workflowImage ? (
              <img
                src={project.workflowImage}
                alt={project.workflowAlt}
                className="w-full border border-[#E5E5E5]"
              />
            ) : (
              <div
                className="w-full border border-dashed border-[#E5E5E5] bg-[#F9F9F9] flex flex-col items-center justify-center gap-3 py-16"
              >
                <svg width="56" height="42" viewBox="0 0 56 42" fill="none" aria-hidden="true">
                  <rect x="1" y="10" width="12" height="8" rx="1.5" stroke="#CCCCCC" strokeWidth="1.4" fill="#EFEFEF"/>
                  <rect x="22" y="1" width="12" height="8" rx="1.5" stroke="#CCCCCC" strokeWidth="1.4" fill="#EFEFEF"/>
                  <rect x="22" y="17" width="12" height="8" rx="1.5" stroke="#CCCCCC" strokeWidth="1.4" fill="#EFEFEF"/>
                  <rect x="43" y="10" width="12" height="8" rx="1.5" stroke="#CCCCCC" strokeWidth="1.4" fill="#EFEFEF"/>
                  <rect x="43" y="26" width="12" height="8" rx="1.5" stroke="#CCCCCC" strokeWidth="1.4" fill="#EFEFEF"/>
                  <line x1="13" y1="14" x2="22" y2="5" stroke="#CCCCCC" strokeWidth="1.2"/>
                  <line x1="13" y1="14" x2="22" y2="21" stroke="#CCCCCC" strokeWidth="1.2"/>
                  <line x1="34" y1="5" x2="43" y2="14" stroke="#CCCCCC" strokeWidth="1.2"/>
                  <line x1="34" y1="21" x2="43" y2="14" stroke="#CCCCCC" strokeWidth="1.2"/>
                  <line x1="34" y1="21" x2="43" y2="30" stroke="#CCCCCC" strokeWidth="1.2"/>
                </svg>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#AAAAAA] mb-1">Workflow screenshot placeholder</p>
                  <p className="text-xs text-[#CCCCCC]">Add the n8n workflow image for this project</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom CTA */}
          <div className="border-t border-[#E5E5E5] pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm text-[#555555]">
              Interested in a similar workflow for your business?
            </p>
            <a
              href="#contact"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-semibold border border-black hover:bg-white hover:text-black transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 whitespace-nowrap"
            >
              Let&apos;s Talk
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────
export default function AutomationWork() {
  const [selected, setSelected] = useState<AutomationProject | null>(null)

  const handleOpen = useCallback((p: AutomationProject) => setSelected(p), [])
  const handleClose = useCallback(() => setSelected(null), [])

  return (
    <section id="work" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
      {/* Section heading */}
      <div className="border-t-4 border-black pt-10 mb-6">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#555555] mb-3">
          AI Automation Work
        </p>
        <div className="grid md:grid-cols-2 gap-6 items-end mb-10">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-black leading-tight">
            Workflows that run<br />while you focus.
          </h2>
          <p className="text-[#555555] leading-relaxed md:max-w-sm md:ml-auto">
            A catalogue of automation systems built to reduce manual work,
            improve consistency, and connect business tools — each designed
            around a specific operational challenge.
          </p>
        </div>
      </div>

      {/* Catalogue grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((project, idx) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={idx}
            onOpen={handleOpen}
          />
        ))}

        {/* "More coming" placeholder card */}
        <div className="border border-dashed border-[#E5E5E5] flex flex-col items-center justify-center gap-3 p-10 text-center min-h-[260px]">
          <div className="w-10 h-10 border border-[#E5E5E5] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3v10M3 8h10" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#AAAAAA]">More projects coming</p>
          <p className="text-xs text-[#CCCCCC] leading-relaxed">
            Additional case studies will appear here as they are documented.
          </p>
        </div>
      </div>

      {/* Owner notice */}
      <div className="mt-10 border border-dashed border-[#E5E5E5] p-5">
        <p className="text-xs text-[#555555] leading-relaxed">
          <strong className="text-black">Owner action needed:</strong> Add workflow screenshots and confirm the challenge / solution copy for each project before publishing. Update the <code className="font-mono bg-[#F5F5F5] px-1">workflowImage</code> field in <code className="font-mono bg-[#F5F5F5] px-1">AutomationWork.tsx</code> with the path to each sanitised screenshot.
        </p>
      </div>

      {/* Detail modal */}
      {selected && <ProjectModal project={selected} onClose={handleClose} />}
    </section>
  )
}
