import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchPublishedProjectBySlug, fetchSkills } from '../lib/supabase'
import { fallbackSkills } from '../lib/skillsFallback'
import { resolveToolIcons } from '../lib/toolIcons'
import ThemeToggle from '../components/ThemeToggle'
import AutoVideo from '../components/AutoVideo'
import ProfileCard from '../components/ProfileCard'
import { safeUrl, safeMediaUrl } from '../lib/safeUrl'
import { useContent } from '../context/ContentContext'
import type { PortfolioProject, PortfolioSkill, ProjectSection } from '../types/portfolio'

type LoadState = 'loading' | 'ready' | 'missing'

/** Image with a subtle, smooth zoom on hover (stays inside its frame). */
function ZoomImage({ src, alt, className = '', lazy = true }: { src: string; alt: string; className?: string; lazy?: boolean }) {
  return (
    <div className={`group overflow-hidden border border-line bg-surface ${className}`}>
      <img
        src={safeMediaUrl(src)}
        alt={alt}
        loading={lazy ? 'lazy' : undefined}
        decoding="async"
        className="block w-full h-auto transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
    </div>
  )
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className="text-sm text-muted leading-relaxed">
            {p}
          </p>
        ))}
    </>
  )
}

function MetaItem({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-5 first:pl-0 last:pr-0 border-l border-line first:border-l-0 text-left ${className}`}>
      <p className="text-[11px] font-medium tracking-[0.15em] uppercase text-muted">{label}</p>
      <div className="mt-2 text-sm text-fg">{children}</div>
    </div>
  )
}

function ToolsValue({ tools, icons }: { tools: string[]; icons: string[] }) {
  const { t } = useContent()
  return (
    <span className="inline-flex items-center gap-3">
      {icons.length > 0 && (
        <span className="inline-flex -space-x-2" aria-hidden="true">
          {icons.slice(0, 4).map((url) => (
            <span
              key={url}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white shadow-sm"
            >
              <img src={url} alt="" className="h-5 w-5 object-contain" />
            </span>
          ))}
        </span>
      )}
      <span>{tools.join(', ')}, {t('project.toolsMore')}</span>
    </span>
  )
}

export default function CaseStudy() {
  const { t } = useContent()
  const { slug = '' } = useParams()
  const [state, setState] = useState<LoadState>('loading')
  const [project, setProject] = useState<PortfolioProject | null>(null)
  const [sections, setSections] = useState<ProjectSection[]>([])
  const [skills, setSkills] = useState<PortfolioSkill[]>(fallbackSkills)

  useEffect(() => {
    window.scrollTo(0, 0)
    let alive = true
    setState('loading')
    Promise.all([fetchPublishedProjectBySlug(slug), fetchSkills()]).then(([result, skillRows]) => {
      if (!alive) return
      if (skillRows.length > 0) setSkills(skillRows)
      if (!result) {
        setState('missing')
        return
      }
      setProject(result.project)
      setSections(result.sections)
      setState('ready')
    })
    return () => {
      alive = false
    }
  }, [slug])

  useEffect(() => {
    if (project) document.title = `${project.title} | Oluwaseyi`
    return () => {
      document.title = t('site.title')
    }
  }, [project])

  const backTo = project?.category === 'AI_AUTOMATION' ? '/#work' : '/#web-design'

  const topBar = (
    <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
      <Link
        to={backTo}
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fg rounded-sm"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M12 7H2M6 3L2 7l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t('project.back')}
      </Link>
      <ThemeToggle />
    </div>
  )

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-bg text-fg">
        {topBar}
        <div className="max-w-2xl mx-auto px-6 pt-16 animate-pulse space-y-4" aria-busy="true">
          <div className="h-8 w-2/3 mx-auto bg-surface" />
          <div className="h-4 w-1/2 mx-auto bg-surface" />
          <div className="h-64 bg-surface mt-10" />
        </div>
      </div>
    )
  }

  if (state === 'missing' || !project) {
    return (
      <div className="min-h-screen bg-bg text-fg">
        {topBar}
        <div className="max-w-2xl mx-auto px-6 pt-24 text-center">
          <h1 className="text-3xl font-black tracking-tight">{t('project.notFoundTitle')}</h1>
          <p className="mt-3 text-muted">{t('project.notFoundText')}</p>
          <Link
            to={backTo}
            className="mt-8 inline-flex px-6 py-3 bg-fg text-bg text-sm font-semibold border border-fg hover:bg-bg hover:text-fg transition-colors"
          >
            {t('project.notFoundButton')}
          </Link>
        </div>
      </div>
    )
  }

  const images = project.images ?? []
  const cover = images.find((i) => i.is_primary) ?? images[0]
  // Tools typed in Studio; older projects fall back to their technology tags
  const tools = ((project.tools && project.tools.length > 0 ? project.tools : project.technologies) ?? []).filter(Boolean)
  const toolIcons = resolveToolIcons(tools, skills)
  // AI automation projects created before case studies: show their challenge/solution as sections
  const shownSections: ProjectSection[] =
    sections.length > 0
      ? sections
      : [
          ['The challenge', 'Core challenge', project.core_challenge],
          ['The solution', 'What was built', project.solution_delivered],
        ]
          .filter(([, , body]) => !!body)
          .map(([heading, subheading, body], i) => ({
            id: `legacy-${i}`,
            project_id: project.id,
            sort_order: i,
            heading: heading as string,
            subheading: subheading as string,
            body: body as string,
            images: [],
          }))
  const extraImages = shownSections.length === 0 ? images.filter((i) => i.id !== cover?.id) : []
  const hasMeta = project.year || project.role || project.platform || tools.length > 0

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-line">{topBar}</header>

      <main className="max-w-5xl mx-auto px-6 pb-24">
        {/* Title + summary */}
        <div className="pt-14 text-center">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">{project.title}</h1>
          {project.short_description && (
            <p className="mt-5 max-w-xl mx-auto text-muted leading-relaxed">{project.short_description}</p>
          )}
        </div>

        {/* Year / Role / Platform / Tools */}
        {hasMeta && (
          <div className="mt-10 flex flex-wrap justify-center gap-y-6">
            {project.year && <MetaItem label={t('project.year')}>{project.year}</MetaItem>}
            {project.role && <MetaItem label={t('project.role')}>{project.role}</MetaItem>}
            {project.platform && <MetaItem label={t('project.platform')}>{project.platform}</MetaItem>}
            {tools.length > 0 && (
              <MetaItem label={t('project.tools')}>
                <ToolsValue tools={tools} icons={toolIcons} />
              </MetaItem>
            )}
          </div>
        )}

        {/* Cover: a video chosen as cover plays by itself when it scrolls into view */}
        {project.video_url && project.video_is_cover && (
          <div className="mt-14 mx-auto max-w-3xl bg-black border border-line overflow-hidden">
            <AutoVideo
              src={project.video_url}
              poster={cover?.public_url}
              controls
              label={`${project.title} video`}
              className="w-full h-auto block"
            />
          </div>
        )}
        {!(project.video_url && project.video_is_cover) && cover && (
          <ZoomImage
            src={cover.public_url}
            alt={cover.alt_text || project.title}
            lazy={false}
            className="mt-14 mx-auto max-w-3xl"
          />
        )}

        {project.video_url && !project.video_is_cover && (
          <div className="mt-8 mx-auto max-w-3xl bg-black border border-line overflow-hidden">
            <AutoVideo
              src={project.video_url}
              poster={cover?.public_url}
              controls
              label={`${project.title} video`}
              className="w-full h-auto block"
            />
          </div>
        )}

        {/* Sections */}
        {shownSections.length > 0 && (
          <div className="mt-16 mx-auto max-w-2xl space-y-14">
            {shownSections.map((section, i) => (
              <section key={section.id} aria-label={section.heading || `Section ${i + 1}`}>
                <p className="text-xs text-muted">
                  {String(i + 1).padStart(2, '0')}
                  {section.heading ? `: ${section.heading}` : ''}
                </p>
                {section.subheading && (
                  <h2 className="mt-1.5 text-base font-bold text-fg leading-snug">{section.subheading}</h2>
                )}
                {section.body && (
                  <div className="mt-3 space-y-3">
                    <Paragraphs text={section.body} />
                  </div>
                )}
                {section.images.length > 0 && (
                  <div className="mt-5 space-y-4">
                    {section.images.map((img, ii) => (
                      <ZoomImage key={`${section.id}-${ii}`} src={img.url} alt={img.alt} />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        {/* Fallback gallery for projects without written sections */}
        {extraImages.length > 0 && (
          <div className="mt-12 mx-auto max-w-3xl space-y-4">
            {extraImages.map((img) => (
              <figure key={img.id}>
                <ZoomImage src={img.public_url} alt={img.alt_text || project.title} />
                {img.caption && <figcaption className="mt-2 text-xs text-muted">{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}

        {/* Who made this + how to reach me */}
        <div className="mt-20 mx-auto max-w-2xl border-t border-line pt-10">
          <ProfileCard />
        </div>

        {/* Footer actions */}
        <div className="mt-10 mx-auto max-w-2xl flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
          <Link
            to={backTo}
            className="text-sm font-semibold text-fg border-b border-fg pb-0.5 hover:opacity-60 transition-opacity"
          >
            ← {t('project.allProjects')}
          </Link>
          {safeUrl(project.project_url) && (
            <a
              href={safeUrl(project.project_url)}
              data-track={`project-visit:${project.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-fg text-bg text-sm font-semibold border border-fg hover:bg-bg hover:text-fg transition-colors"
            >
              {project.category === 'AI_AUTOMATION' ? t('project.visitDemo') : t('project.visitSite')} ↗
            </a>
          )}
        </div>
      </main>
    </div>
  )
}
