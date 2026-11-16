import { useState, useEffect } from 'react'
import { fetchPublishedProjects } from '../lib/supabase'
import type { PortfolioProject } from '../types/portfolio'
import ProjectCarousel from './ProjectCarousel'
import { useContent } from '../context/ContentContext'

// ── Default fallback data in case of offline/initial load ───────────────────
const fallbackProjects: PortfolioProject[] = [
  {
    id: 'dental-clinic',
    title: "O'seyi Dental Clinic",
    slug: 'oseyi-dental-clinic',
    category: 'AI_AUTOMATION',
    short_description: 'AI-powered appointment booking & customer communication workflow',
    technologies: ['n8n', 'AI Agents', 'Email Automation', 'Appointment Workflows'],
    core_challenge:
      'The clinic was managing appointment requests manually — staff spent significant time chasing confirmations, sending reminders by hand, and following up with patients who missed their slots. This created delays, increased no-shows, and took attention away from patient care.',
    solution_delivered:
      'An automated end-to-end appointment workflow built in n8n: incoming requests are captured, an AI-assisted confirmation is sent immediately, reminders fire automatically before the appointment, and follow-up messages are triggered post-visit — all without manual intervention.',
    status: 'PUBLISHED',
    featured: true,
    sort_order: 1,
    images: [],
  },
  {
    id: 'homes-properties',
    title: 'Oluwaseyi Homes & Properties',
    slug: 'oluwaseyi-homes-properties',
    category: 'AI_AUTOMATION',
    short_description: 'Real estate CRM automation and lead-management workflow',
    technologies: ['n8n', 'CRM Automation', 'Lead Scoring', 'Notifications', 'Audit Logging'],
    core_challenge:
      'New leads coming in through multiple channels were being missed or responded to too slowly. There was no consistent way to score, assign, or follow up with leads — meaning high-value enquiries were falling through the gaps.',
    solution_delivered:
      'A lead-management automation that captures enquiries from all entry points, scores them by intent and property interest, assigns each lead to the right consultant, fires immediate notifications, and logs every action for a full audit trail — reducing response time and improving conversion consistency.',
    status: 'PUBLISHED',
    featured: true,
    sort_order: 2,
    images: [],
  },
]

export default function AutomationWork() {
  const { t } = useContent()
  const [projects, setProjects] = useState<PortfolioProject[]>(fallbackProjects)
  const [loading, setLoading] = useState(true)

  // Fetch live published projects from Supabase
  useEffect(() => {
    let isMounted = true
    fetchPublishedProjects('AI_AUTOMATION')
      .then((data) => {
        if (isMounted) {
          if (data.length > 0) setProjects(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section id="work" className="py-24 max-w-7xl mx-auto">
      {/* Section heading */}
      <div className="border-t-4 border-fg pt-10 mb-10 px-6 lg:px-12">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted mb-3">
          {t('ai.eyebrow')}
        </p>
        <div className="grid md:grid-cols-2 gap-6 items-end">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-fg leading-tight">
            {t('ai.heading1')}<br />{t('ai.heading2')}
          </h2>
          <p className="text-muted leading-relaxed md:max-w-sm md:ml-auto">
            {t('ai.intro')}
          </p>
        </div>
      </div>

      <ProjectCarousel projects={projects} loading={loading} label="AI automation portfolio carousel" />
    </section>
  )
}
