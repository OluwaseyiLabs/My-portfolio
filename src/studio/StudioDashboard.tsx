import { useState, useEffect, useMemo, useCallback } from 'react'
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
} from '../lib/supabase'
import ProjectEditorModal from './ProjectEditorModal'
import ProjectPreviewModal from './ProjectPreviewModal'

export default function StudioDashboard() {
  const { signOut } = useAuth()

  // State
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

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
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* ── Top Header ── */}
      <header className="border-b border-[#E5E5E5] bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-base font-black tracking-tight text-black">
              Oluwaseyi Studio.
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-[0.15em] px-2 py-0.5 bg-[#F0F0F0] text-[#555555]">
              Owner CMS
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-[#555555] hover:text-black transition-colors hidden sm:inline-flex items-center gap-1"
            >
              View Public Website ↗
            </a>
            <span className="text-[#CCCCCC] hidden sm:inline">|</span>
            <span className="text-[#777777] hidden md:inline truncate max-w-[200px]">
              {OWNER_EMAIL}
            </span>
            <button
              onClick={() => signOut()}
              className="px-3 py-1.5 border border-[#CCCCCC] hover:border-black text-black transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Body ── */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-10 w-full flex-1">
        {/* Title & Actions Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b-2 border-black">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#555555] mb-2">
              Portfolio Content Manager
            </p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">
              Projects &amp; Workflows
            </h1>
          </div>

          {/* Two prominent action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setCreatingCategory('AI_AUTOMATION')}
              className="inline-flex items-center gap-2 px-5 py-3 bg-black text-white text-xs font-bold uppercase tracking-wider border border-black hover:bg-white hover:text-black transition-colors"
            >
              <span>+</span> Add AI Automation Project
            </button>

            <button
              onClick={() => setCreatingCategory('WEB_DEVELOPMENT')}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-black text-xs font-bold uppercase tracking-wider border border-black hover:bg-black hover:text-white transition-colors"
            >
              <span>+</span> Add Website Project
            </button>
          </div>
        </div>

        {/* ── Metrics Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
          <div className="border border-[#E5E5E5] p-4 bg-[#FAFAFA]">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#777777] mb-1">
              Total Projects
            </p>
            <p className="text-2xl font-black text-black">{metrics.total}</p>
          </div>

          <div className="border border-[#E5E5E5] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#777777] mb-1">
              AI Automation
            </p>
            <p className="text-2xl font-black text-black">{metrics.ai}</p>
          </div>

          <div className="border border-[#E5E5E5] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#777777] mb-1">
              Web Development
            </p>
            <p className="text-2xl font-black text-black">{metrics.web}</p>
          </div>

          <div className="border border-black p-4 bg-black text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/70 mb-1">
              Published Live
            </p>
            <p className="text-2xl font-black text-white">{metrics.published}</p>
          </div>

          <div className="border border-[#E5E5E5] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#777777] mb-1">
              Drafts
            </p>
            <p className="text-2xl font-black text-black">{metrics.drafts}</p>
          </div>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 border-b sm:border-b-0 pb-2 sm:pb-0 border-[#E5E5E5] overflow-x-auto">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                categoryFilter === 'ALL'
                  ? 'bg-black text-white'
                  : 'text-[#555555] hover:text-black'
              }`}
            >
              All Categories
            </button>
            <button
              onClick={() => setCategoryFilter('AI_AUTOMATION')}
              className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                categoryFilter === 'AI_AUTOMATION'
                  ? 'bg-black text-white'
                  : 'text-[#555555] hover:text-black'
              }`}
            >
              AI Automation
            </button>
            <button
              onClick={() => setCategoryFilter('WEB_DEVELOPMENT')}
              className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                categoryFilter === 'WEB_DEVELOPMENT'
                  ? 'bg-black text-white'
                  : 'text-[#555555] hover:text-black'
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
              className="border border-[#D5D5D5] focus:border-black px-3 py-1.5 text-xs outline-none w-48 sm:w-60"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-[#D5D5D5] focus:border-black px-2.5 py-1.5 text-xs outline-none bg-white font-medium"
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
          <div className="p-16 border border-[#E5E5E5] text-center text-xs font-bold text-[#777777]">
            Loading studio projects from database...
          </div>
        ) : error ? (
          <div className="p-8 border border-red-300 bg-red-50 text-red-700 text-xs">
            <p className="font-bold mb-1">Failed to load projects</p>
            <p>{error}</p>
            <button
              onClick={loadProjects}
              className="mt-3 px-3 py-1 bg-black text-white text-xs font-bold"
            >
              Retry
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-16 border border-dashed border-[#CCCCCC] text-center">
            <p className="text-sm font-bold text-black mb-1">No projects found</p>
            <p className="text-xs text-[#777777] mb-4">
              {search || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Try clearing your filters or search term.'
                : 'Click one of the buttons above to create your first project.'}
            </p>
          </div>
        ) : (
          <div className="border border-[#E5E5E5] overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-[#F9F9F9] text-[#555555] uppercase tracking-[0.1em] text-[10px]">
                  <th className="py-3 px-4 w-16">Cover</th>
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {filteredProjects.map((project) => {
                  const coverImage =
                    project.images?.find((img) => img.is_primary)?.public_url ||
                    project.images?.[0]?.public_url

                  const isAI = project.category === 'AI_AUTOMATION'

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-[#FAFAFA] transition-colors"
                    >
                      {/* Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="w-12 h-9 bg-[#EFEFEF] border border-[#DDDDDD] overflow-hidden flex items-center justify-center">
                          {coverImage ? (
                            <img
                              src={coverImage}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[9px] text-[#AAAAAA] font-mono">
                              {isAI ? 'n8n' : 'web'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Title & Slug */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-black text-sm">{project.title}</p>
                        <p className="text-[11px] text-[#777777] font-mono">
                          /{project.slug}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-[#E5E5E5] text-[#444444]">
                          {isAI ? 'AI Automation' : 'Web Dev'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${
                            project.status === 'PUBLISHED'
                              ? 'border-black bg-black text-white'
                              : project.status === 'ARCHIVED'
                              ? 'border-[#CCCCCC] text-[#888888]'
                              : 'border-[#CCCCCC] bg-[#F5F5F5] text-[#555555]'
                          }`}
                        >
                          {project.status}
                        </span>
                      </td>

                      {/* Sort Order */}
                      <td className="py-3 px-4 font-mono text-[#555555]">
                        {project.sort_order}
                      </td>

                      {/* Last Updated */}
                      <td className="py-3 px-4 text-[#777777]">
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
                            className="px-2.5 py-1 border border-[#CCCCCC] hover:border-black text-black font-semibold"
                            title="Preview public design"
                          >
                            Preview
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => setEditingProject(project)}
                            className="px-2.5 py-1 bg-black text-white hover:bg-[#333333] font-semibold"
                          >
                            Edit
                          </button>

                          {/* Quick Publish / Unpublish */}
                          <button
                            disabled={actionLoading}
                            onClick={() => handleToggleStatus(project)}
                            className="px-2.5 py-1 border border-[#CCCCCC] hover:border-black text-black font-semibold"
                          >
                            {project.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                          </button>

                          {/* Delete */}
                          <button
                            disabled={actionLoading}
                            onClick={() => setDeletingId(project.id)}
                            className="px-2 py-1 text-red-600 hover:bg-red-50 font-bold border border-transparent hover:border-red-200"
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
      </main>

      {/* ── Confirmation Modal for Delete ── */}
      {deletingId && (
        <div
          className="fixed inset-0 z-[160] bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border-2 border-black max-w-sm w-full p-6 text-black shadow-2xl">
            <h3 className="text-base font-black uppercase tracking-wider mb-2">
              Confirm Permanent Delete
            </h3>
            <p className="text-xs text-[#555555] mb-6 leading-relaxed">
              Are you sure you want to permanently delete this project and remove its associated images from storage? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 border border-[#CCCCCC] text-xs font-bold"
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
      <footer className="border-t border-[#E5E5E5] py-4 px-6 text-center text-xs text-[#888888]">
        Private Owner Studio &bull; Oluwaseyi Portfolio CMS &bull; Connected to dedicated Supabase
      </footer>
    </div>
  )
}
