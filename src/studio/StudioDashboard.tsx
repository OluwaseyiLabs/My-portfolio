import { useState, useEffect, useMemo, useCallback, Fragment } from 'react'
import { useAuth, OWNER_EMAIL } from '../context/AuthContext'
import type {
  PortfolioProject,
  ProjectCategory,
  ProjectStatus,
} from '../types/portfolio'
import {
  fetchStudioProjects,
  deleteProjectPermanently,
  updateProjectStatus,
  fetchInquiries,
  countOpenWorkflowErrors,
  type PortfolioInquiry,
} from '../lib/supabase'
import ProjectEditorModal from './ProjectEditorModal'
import ProjectPreviewModal from './ProjectPreviewModal'
import SkillsManager from './SkillsManager'
import SiteContentManager from './SiteContentManager'
import AnalyticsPanel from './AnalyticsPanel'
import ErrorsPanel from './ErrorsPanel'
import ThemeToggle from '../components/ThemeToggle'

export default function StudioDashboard() {
  const { signOut } = useAuth()

  // State
  const [activeView, setActiveView] = useState<'PROJECTS' | 'INQUIRIES' | 'SKILLS' | 'CONTENT' | 'ANALYTICS' | 'ERRORS'>('PROJECTS')
  const [openErrorCount, setOpenErrorCount] = useState<number | null>(null)
  const [skillCount, setSkillCount] = useState<number | null>(null)
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [inquiries, setInquiries] = useState<PortfolioInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingInquiries, setLoadingInquiries] = useState(false)
  const [expandedInquiry, setExpandedInquiry] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Filters & Search
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | ProjectCategory>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProjectStatus>('ALL')

  // Modals state
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null)
  const [creatingCategory, setCreatingCategory] = useState<ProjectCategory | null>(null)
  const [previewingProject, setPreviewingProject] = useState<PortfolioProject | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Load projects
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchStudioProjects()
      setProjects(data)
    } catch (err: any) {
      console.error('Failed to load studio projects:', err)
      setError(err.message || 'Failed to fetch projects from database.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load inquiries
  const loadInquiries = useCallback(async () => {
    try {
      setLoadingInquiries(true)
      const data = await fetchInquiries()
      setInquiries(data)
    } catch (err: any) {
      console.error('Failed to load inquiries:', err)
    } finally {
      setLoadingInquiries(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
    loadInquiries()
    countOpenWorkflowErrors().then(setOpenErrorCount)
  }, [loadProjects, loadInquiries])

  // Metrics computation
  const metrics = useMemo(() => {
    return {
      total: projects.length,
      ai: projects.filter((p) => p.category === 'AI_AUTOMATION').length,
      web: projects.filter((p) => p.category === 'WEB_DEVELOPMENT').length,
      published: projects.filter((p) => p.status === 'PUBLISHED').length,
      drafts: projects.filter((p) => p.status === 'DRAFT').length,
    }
  }, [projects])

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false
      if (search.trim()) {
        const query = search.toLowerCase()
        const matchesTitle = p.title.toLowerCase().includes(query)
        const matchesTech = p.technologies?.some((t) => t.toLowerCase().includes(query))
        return matchesTitle || matchesTech
      }
      return true
    })
  }, [projects, categoryFilter, statusFilter, search])

  // Quick Status Toggle (Publish / Unpublish)
  const handleToggleStatus = async (project: PortfolioProject) => {
    const nextStatus: ProjectStatus =
      project.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'

    try {
      setActionLoading(true)
      await updateProjectStatus(project.id, nextStatus)
      await loadProjects()
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  // Confirm delete
  const handleDelete = async (id: string) => {
    try {
      setActionLoading(true)
      await deleteProjectPermanently(id)
      setDeletingId(null)
      await loadProjects()
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="studio-root min-h-dvh bg-bg text-fg flex flex-col">
      {/* ── Top Header ── */}
      <header className="border-b border-line bg-bg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <span className="text-base font-black tracking-tight text-fg whitespace-nowrap">
              <span className="hidden min-[400px]:inline">Oluwaseyi </span>Studio.
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-[0.15em] px-2 py-0.5 bg-surface text-muted">
              Owner CMS
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold shrink-0">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-muted hover:text-fg transition-colors hidden sm:inline-flex items-center gap-1"
            >
              View Public Website ↗
            </a>
            <ThemeToggle />
            <span className="text-faint hidden sm:inline">|</span>
            <span className="text-muted hidden md:inline truncate max-w-[200px]">
              {OWNER_EMAIL}
            </span>
            <button
              onClick={() => signOut()}
              className="px-3 py-2 sm:py-1.5 border border-line-strong hover:border-fg text-fg transition-colors whitespace-nowrap"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Body ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-10 w-full flex-1">
        {/* View Tabs */}
        <div className="flex items-center gap-2 mb-6 sm:mb-8 border-b border-line pb-3 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setActiveView('PROJECTS')}
            className={`shrink-0 whitespace-nowrap px-4 py-2.5 sm:py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeView === 'PROJECTS'
                ? 'bg-fg text-bg'
                : 'bg-bg text-muted hover:text-fg border border-line'
            }`}
          >
            Portfolio Projects ({projects.length})
          </button>
          <button
            onClick={() => {
              setActiveView('INQUIRIES')
              loadInquiries()
            }}
            className={`shrink-0 whitespace-nowrap px-4 py-2.5 sm:py-2 text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 ${
              activeView === 'INQUIRIES'
                ? 'bg-fg text-bg'
                : 'bg-bg text-muted hover:text-fg border border-line'
            }`}
          >
            <span>Contact Inquiries</span>
            {inquiries.length > 0 && (
              <span
                className={`px-1.5 py-0.5 text-[10px] font-black rounded-full ${
                  activeView === 'INQUIRIES' ? 'bg-bg text-fg' : 'bg-fg text-bg'
                }`}
              >
                {inquiries.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveView('SKILLS')}
            className={`shrink-0 whitespace-nowrap px-4 py-2.5 sm:py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeView === 'SKILLS'
                ? 'bg-fg text-bg'
                : 'bg-bg text-muted hover:text-fg border border-line'
            }`}
          >
            Skills{skillCount !== null ? ` (${skillCount})` : ''}
          </button>
          <button
            onClick={() => setActiveView('CONTENT')}
            className={`shrink-0 whitespace-nowrap px-4 py-2.5 sm:py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeView === 'CONTENT'
                ? 'bg-fg text-bg'
                : 'bg-bg text-muted hover:text-fg border border-line'
            }`}
          >
            Site Content
          </button>
          <button
            onClick={() => setActiveView('ANALYTICS')}
            className={`shrink-0 whitespace-nowrap px-4 py-2.5 sm:py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeView === 'ANALYTICS'
                ? 'bg-fg text-bg'
                : 'bg-bg text-muted hover:text-fg border border-line'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveView('ERRORS')}
            className={`shrink-0 whitespace-nowrap px-4 py-2.5 sm:py-2 text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 ${
              activeView === 'ERRORS'
                ? 'bg-fg text-bg'
                : 'bg-bg text-muted hover:text-fg border border-line'
            }`}
          >
            <span>Errors</span>
            {openErrorCount !== null && openErrorCount > 0 && (
              <span
                className={`px-1.5 py-0.5 text-[10px] font-black rounded-full ${
                  activeView === 'ERRORS' ? 'bg-bg text-fg' : 'bg-fg text-bg'
                }`}
              >
                {openErrorCount}
              </span>
            )}
          </button>
        </div>

        {activeView === 'ERRORS' ? (
          <ErrorsPanel onOpenCountChange={setOpenErrorCount} />
        ) : activeView === 'ANALYTICS' ? (
          <AnalyticsPanel
            onOpenInquiries={() => {
              setActiveView('INQUIRIES')
              loadInquiries()
            }}
          />
        ) : activeView === 'CONTENT' ? (
          <SiteContentManager />
        ) : activeView === 'SKILLS' ? (
          <SkillsManager onCountChange={setSkillCount} />
        ) : activeView === 'INQUIRIES' ? (
          <div>
            {/* Inquiries Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-fg">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted mb-1">
                  Inbox
                </p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-fg">
                  Contact Form Inquiries ({inquiries.length})
                </h1>
              </div>
              <button
                onClick={loadInquiries}
                disabled={loadingInquiries}
                className="px-4 py-2 border border-fg text-xs font-bold uppercase tracking-wider hover:bg-fg hover:text-bg transition-colors self-start sm:self-auto disabled:opacity-50"
              >
                {loadingInquiries ? 'Refreshing…' : '↻ Refresh Inquiries'}
              </button>
            </div>

            {loadingInquiries && inquiries.length === 0 ? (
              <div className="p-16 border border-line text-center text-xs font-bold text-muted">
                Loading inquiries from database...
              </div>
            ) : inquiries.length === 0 ? (
              <div className="p-16 border border-dashed border-line-strong text-center">
                <p className="text-sm font-bold text-fg mb-1">No inquiries yet</p>
                <p className="text-xs text-muted">
                  Messages submitted through your portfolio contact form will appear here.
                </p>
              </div>
            ) : (
              <div className="border border-line overflow-x-auto bg-bg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface border-b border-line text-[10px] uppercase font-bold tracking-wider text-muted">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Message</th>
                      <th className="py-3 px-4">Webhook Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {inquiries.map((inq) => {
                      const hasDetails = !!(inq.company || inq.role || inq.project_budget || inq.interests?.length || inq.extra_info)
                      const isOpen = expandedInquiry === inq.id
                      const detail = (label: string, value?: string | null) =>
                        value ? (
                          <div>
                            <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted mb-0.5">{label}</dt>
                            <dd className="text-xs text-fg break-words">{value}</dd>
                          </div>
                        ) : null
                      return (
                        <Fragment key={inq.id}>
                          <tr className="hover:bg-surface transition-colors">
                            <td className="py-3 px-4 whitespace-nowrap text-muted">
                              {new Date(inq.created_at).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="font-bold text-fg">{inq.name}</span>
                              {inq.company && <span className="block text-muted">{inq.company}</span>}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <a
                                href={`mailto:${inq.email}`}
                                className="text-fg underline underline-offset-2 hover:opacity-70"
                              >
                                {inq.email}
                              </a>
                            </td>
                            <td className="py-3 px-4 text-muted max-w-md break-words">
                              <span className="block">{inq.message}</span>
                              {hasDetails && (
                                <button
                                  onClick={() => setExpandedInquiry(isOpen ? null : inq.id)}
                                  aria-expanded={isOpen}
                                  className="mt-2 px-2.5 py-1.5 border border-line text-[10px] font-bold uppercase tracking-wider text-fg hover:border-fg transition-colors"
                                >
                                  {isOpen ? 'Hide answers' : 'All answers'}
                                </button>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {inq.webhook_sent ? (
                                <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-fg text-bg">
                                  Webhook Delivered
                                </span>
                              ) : (
                                <span
                                  className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-line-strong text-muted"
                                  title={inq.webhook_response || 'Waiting for active webhook'}
                                >
                                  Saved in DB
                                </span>
                              )}
                            </td>
                          </tr>
                          {isOpen && (
                            <tr className="bg-surface">
                              <td colSpan={5} className="px-4 py-4">
                                <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                                  {detail('Company', inq.company)}
                                  {detail('Website', inq.website)}
                                  {detail('Role', inq.role)}
                                  {detail('Company size', inq.company_size)}
                                  {detail('Annual revenue', inq.annual_revenue)}
                                  {detail('Project budget', inq.project_budget)}
                                  {detail('Wants to improve', inq.interests?.join(', '))}
                                  {detail('Anything else', inq.extra_info)}
                                </dl>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Title & Actions Row */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b-2 border-fg">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted mb-2">
                  Portfolio Content Manager
                </p>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-fg">
                  Projects &amp; Workflows
                </h1>
              </div>

              {/* Two prominent action buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setCreatingCategory('AI_AUTOMATION')}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-fg text-bg text-xs font-bold uppercase tracking-wider border border-fg hover:bg-bg hover:text-fg transition-colors"
                >
                  <span>+</span> Add AI Automation Project
                </button>

                <button
                  onClick={() => setCreatingCategory('WEB_DEVELOPMENT')}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-bg text-fg text-xs font-bold uppercase tracking-wider border border-fg hover:bg-fg hover:text-bg transition-colors"
                >
                  <span>+</span> Add Website Project
                </button>
              </div>
            </div>

        {/* ── Metrics Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
          <div className="border border-line p-4 bg-surface">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted mb-1">
              Total Projects
            </p>
            <p className="text-2xl font-black text-fg">{metrics.total}</p>
          </div>

          <div className="border border-line p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted mb-1">
              AI Automation
            </p>
            <p className="text-2xl font-black text-fg">{metrics.ai}</p>
          </div>

          <div className="border border-line p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted mb-1">
              Web Development
            </p>
            <p className="text-2xl font-black text-fg">{metrics.web}</p>
          </div>

          <div className="border border-fg p-4 bg-fg text-bg">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-bg/70 mb-1">
              Published Live
            </p>
            <p className="text-2xl font-black text-bg">{metrics.published}</p>
          </div>

          <div className="border border-line p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted mb-1">
              Drafts
            </p>
            <p className="text-2xl font-black text-fg">{metrics.drafts}</p>
          </div>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 border-b sm:border-b-0 pb-2 sm:pb-0 border-line overflow-x-auto">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                categoryFilter === 'ALL'
                  ? 'bg-fg text-bg'
                  : 'text-muted hover:text-fg'
              }`}
            >
              All Categories
            </button>
            <button
              onClick={() => setCategoryFilter('AI_AUTOMATION')}
              className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                categoryFilter === 'AI_AUTOMATION'
                  ? 'bg-fg text-bg'
                  : 'text-muted hover:text-fg'
              }`}
            >
              AI Automation
            </button>
            <button
              onClick={() => setCategoryFilter('WEB_DEVELOPMENT')}
              className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                categoryFilter === 'WEB_DEVELOPMENT'
                  ? 'bg-fg text-bg'
                  : 'text-muted hover:text-fg'
              }`}
            >
              Web Development
            </button>
          </div>

          {/* Search + Status filter */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or tag..."
              className="border border-line-strong focus:border-fg px-3 py-1.5 text-xs outline-none w-48 sm:w-60"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-line-strong focus:border-fg px-2.5 py-1.5 text-xs outline-none bg-bg font-medium"
            >
              <option value="ALL">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* ── Project Table / List ── */}
        {loading ? (
          <div className="p-16 border border-line text-center text-xs font-bold text-muted">
            Loading studio projects from database...
          </div>
        ) : error ? (
          <div className="p-8 border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs">
            <p className="font-bold mb-1">Failed to load projects</p>
            <p>{error}</p>
            <button
              onClick={loadProjects}
              className="mt-3 px-3 py-1 bg-fg text-bg text-xs font-bold"
            >
              Retry
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-16 border border-dashed border-line-strong text-center">
            <p className="text-sm font-bold text-fg mb-1">No projects found</p>
            <p className="text-xs text-muted mb-4">
              {search || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Try clearing your filters or search term.'
                : 'Click one of the buttons above to create your first project.'}
            </p>
          </div>
        ) : (
          <div className="border border-line overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-line bg-surface text-muted uppercase tracking-[0.1em] text-[10px]">
                  <th className="py-3 px-4 w-16">Cover</th>
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredProjects.map((project) => {
                  const coverImage =
                    project.images?.find((img) => img.is_primary)?.public_url ||
                    project.images?.[0]?.public_url

                  const isAI = project.category === 'AI_AUTOMATION'

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-surface transition-colors"
                    >
                      {/* Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="w-12 h-9 bg-surface border border-line overflow-hidden flex items-center justify-center">
                          {coverImage ? (
                            <img
                              src={coverImage}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[9px] text-faint font-mono">
                              {isAI ? 'n8n' : 'web'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Title & Slug */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-fg text-sm">{project.title}</p>
                        <p className="text-[11px] text-muted font-mono">
                          /{project.slug}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-line text-muted">
                          {isAI ? 'AI Automation' : 'Web Dev'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${
                            project.status === 'PUBLISHED'
                              ? 'border-fg bg-fg text-bg'
                              : project.status === 'ARCHIVED'
                              ? 'border-line-strong text-faint'
                              : 'border-line-strong bg-surface text-muted'
                          }`}
                        >
                          {project.status}
                        </span>
                      </td>

                      {/* Sort Order */}
                      <td className="py-3 px-4 font-mono text-muted">
                        {project.sort_order}
                      </td>

                      {/* Last Updated */}
                      <td className="py-3 px-4 text-muted">
                        {project.updated_at
                          ? new Date(project.updated_at).toLocaleDateString()
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {/* Preview button */}
                          <button
                            onClick={() => setPreviewingProject(project)}
                            className="px-2.5 py-1 border border-line-strong hover:border-fg text-fg font-semibold"
                            title="Preview public design"
                          >
                            Preview
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => setEditingProject(project)}
                            className="px-2.5 py-1 bg-fg text-bg hover:bg-muted font-semibold"
                          >
                            Edit
                          </button>

                          {/* Quick Publish / Unpublish */}
                          <button
                            disabled={actionLoading}
                            onClick={() => handleToggleStatus(project)}
                            className="px-2.5 py-1 border border-line-strong hover:border-fg text-fg font-semibold"
                          >
                            {project.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                          </button>

                          {/* Delete */}
                          <button
                            disabled={actionLoading}
                            onClick={() => setDeletingId(project.id)}
                            className="px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold border border-transparent hover:border-red-200"
                            title="Delete project"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
          </div>
        )}
      </main>

      {/* ── Confirmation Modal for Delete ── */}
      {deletingId && (
        <div
          className="fixed inset-0 z-[160] bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-bg border-2 border-fg max-w-sm w-full p-6 text-fg shadow-2xl">
            <h3 className="text-base font-black uppercase tracking-wider mb-2">
              Confirm Permanent Delete
            </h3>
            <p className="text-xs text-muted mb-6 leading-relaxed">
              Are you sure you want to permanently delete this project and remove its associated images from storage? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 border border-line-strong text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold hover:bg-red-700"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Project Modal ── */}
      {(creatingCategory || editingProject) && (
        <ProjectEditorModal
          initialProject={editingProject}
          initialCategory={creatingCategory || undefined}
          onClose={() => {
            setCreatingCategory(null)
            setEditingProject(null)
          }}
          onSaved={() => {
            setCreatingCategory(null)
            setEditingProject(null)
            loadProjects()
          }}
        />
      )}

      {/* ── Public Preview Modal ── */}
      {previewingProject && (
        <ProjectPreviewModal
          project={previewingProject}
          images={(previewingProject.images || []).map((img) => ({
            id: img.id,
            previewUrl: img.public_url,
            storagePath: img.storage_path,
            altText: img.alt_text,
            caption: img.caption || '',
            isPrimary: img.is_primary,
            sortOrder: img.sort_order,
          }))}
          onClose={() => setPreviewingProject(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-line py-4 px-6 text-center text-xs text-faint">
        Private Owner Studio &bull; Oluwaseyi Portfolio CMS &bull; Connected to dedicated Supabase
      </footer>
    </div>
  )
}
