import { useState, useEffect } from 'react'
import { fetchPublishedProjects } from '../lib/supabase'
import type { PortfolioProject } from '../types/portfolio'
import ProjectCarousel from './ProjectCarousel'
import { useContent } from '../context/ContentContext'

// ── Default fallback projects ────────────────────────────────────────────────
const fallbackProjects: PortfolioProject[] = [
  {
    id: 'voltedge',
    title: 'VoltEdge Tech & Accessories',
    slug: 'voltedge-tech-accessories',
    category: 'WEB_DEVELOPMENT',
    short_description: 'E-commerce Website and instant-order checkout experience',
    technologies: ['E-commerce', 'React', 'TypeScript', 'Responsive Design'],
    status: 'PUBLISHED',
    featured: true,
    sort_order: 1,
    images: [],
  },
  {
    id: 'portfolio',
    title: 'Oluwaseyi Portfolio',
    slug: 'oluwaseyi-portfolio',
    category: 'WEB_DEVELOPMENT',
    short_description: 'Personal Portfolio website with custom CMS architecture',
    technologies: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
    status: 'PUBLISHED',
    featured: true,
    sort_order: 2,
    images: [],
  },
]

export default function WebDesignSection() {
  const { t } = useContent()
  const [projects, setProjects] = useState<PortfolioProject[]>(fallbackProjects)
  const [loading, setLoading] = useState(true)

  // Fetch live published web projects from Supabase
  useEffect(() => {
    let isMounted = true
    fetchPublishedProjects('WEB_DEVELOPMENT')
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

  if (!loading && projects.length === 0) return null

  return (
    <section id="web-design" className="py-24 max-w-7xl mx-auto">
      {/* Section heading */}
      <div className="border-t-4 border-fg pt-10 mb-10 px-6 lg:px-12">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted mb-3">
          {t('web.eyebrow')}
        </p>
        <div className="grid md:grid-cols-2 gap-6 items-end">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-fg leading-tight">
            {t('web.heading')}
          </h2>
          <p className="text-muted leading-relaxed md:max-w-sm md:ml-auto">
            {t('web.intro')}
          </p>
        </div>
      </div>

      <ProjectCarousel projects={projects} loading={loading} label="Web design portfolio carousel" />
    </section>
  )
}
