import { useState, useRef, useEffect, type DragEvent } from 'react'
import type {
  PortfolioProject,
  ProjectCategory,
  ProjectStatus,
  ProjectFormData,
  PendingImage,
  DraftSection,
} from '../types/portfolio'
import {
  supabase,
  createProjectWithImages,
  updateProjectWithImages,
  fetchProjectSections,
  saveProjectSections,
  uploadVideoFile,
  deleteStorageFile,
  MAX_VIDEO_BYTES,
  VIDEO_TYPES,
} from '../lib/supabase'
import {
  validateImageFile,
  createPreviewUrl,
  generateSlug,
} from '../lib/imageOptimization'
import ProjectPreviewModal from './ProjectPreviewModal'
import SectionsEditor from './SectionsEditor'

const PLATFORM_OPTIONS = ['Web app', 'Mobile app', 'Website', 'E-commerce', 'Desktop app', 'Internal tool']
const OTHER_PLATFORM = '__other__'

interface ProjectEditorModalProps {
  initialProject?: PortfolioProject | null
  initialCategory?: ProjectCategory
  onClose: () => void
  onSaved: () => void
}

export default function ProjectEditorModal({
  initialProject,
  initialCategory = 'AI_AUTOMATION',
  onClose,
  onSaved,
}: ProjectEditorModalProps) {
  const isEditing = Boolean(initialProject?.id)
  const [category, setCategory] = useState<ProjectCategory>(
    initialProject?.category || initialCategory
  )
  const isAI = category === 'AI_AUTOMATION'

  // Form states
  const [title, setTitle] = useState(initialProject?.title || '')
  const [slug, setSlug] = useState(initialProject?.slug || '')
  const [coreChallenge, setCoreChallenge] = useState(initialProject?.core_challenge || '')
  const [solutionDelivered, setSolutionDelivered] = useState(initialProject?.solution_delivered || '')
  const [shortDescription, setShortDescription] = useState(initialProject?.short_description || '')
  const [projectUrl, setProjectUrl] = useState(initialProject?.project_url || '')
  const [featured, setFeatured] = useState(initialProject?.featured || false)
  const [sortOrder, setSortOrder] = useState<number>(initialProject?.sort_order ?? 0)

  // Project video
  const [videoUrl, setVideoUrl] = useState(initialProject?.video_url || '')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState(initialProject?.video_url || '')
  const [videoIsCover, setVideoIsCover] = useState(Boolean(initialProject?.video_is_cover))

  // Case study details
  const [year, setYear] = useState(initialProject?.year || '')
  const [role, setRole] = useState(initialProject?.role || '')
  const [platform, setPlatform] = useState(initialProject?.platform || '')
  const [toolsInput, setToolsInput] = useState(
    (initialProject?.tools && initialProject.tools.length > 0
      ? initialProject.tools
      : initialProject?.technologies || []
    ).join(', '),
  )
  const [sections, setSections] = useState<DraftSection[]>([])
  const [sectionsLoading, setSectionsLoading] = useState(Boolean(initialProject?.id))
  const previousSectionPaths = useRef<string[]>([])
  const hadSections = useRef(false)

  // Load existing case-study sections when editing
  useEffect(() => {
    const id = initialProject?.id
    if (!id) return
    let alive = true
    fetchProjectSections(id).then((rows) => {
      if (!alive) return
      hadSections.current = rows.length > 0
      previousSectionPaths.current = rows.flatMap((r) => r.images.map((im) => im.storage_path))
      setSections(
        rows.map((r) => ({
          id: r.id,
          heading: r.heading || '',
          subheading: r.subheading || '',
          body: r.body || '',
          images: r.images.map((im) => ({
            id: crypto.randomUUID(),
            previewUrl: im.url,
            storagePath: im.storage_path,
            alt: im.alt || '',
          })),
        })),
      )
      setSectionsLoading(false)
    })
    return () => {
      alive = false
    }
  }, [initialProject?.id])

  // Images state
  const [images, setImages] = useState<PendingImage[]>(() => {
    if (initialProject?.images && initialProject.images.length > 0) {
      return initialProject.images.map((img) => ({
        id: img.id,
        previewUrl: img.public_url,
        storagePath: img.storage_path,
        altText: img.alt_text,
        caption: img.caption || '',
        isPrimary: img.is_primary,
        sortOrder: img.sort_order,
        isExisting: true,
      }))
    }
    return []
  })

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle')
  const [suggestedSlug, setSuggestedSlug] = useState<string | null>(null)

  // Auto-generate slug when title changes (if new or user hasn't typed a custom slug)
  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!isEditing) {
      setSlug(generateSlug(val))
    }
  }

  // Live debounced slug uniqueness check against database
  useEffect(() => {
    const cleanSlug = slug.trim()
    if (!cleanSlug) {
      setSlugStatus('idle')
      setSuggestedSlug(null)
      return
    }

    if (isEditing && cleanSlug === initialProject?.slug) {
      setSlugStatus('available')
      setSuggestedSlug(null)
      return
    }

    setSlugStatus('checking')
    const timer = setTimeout(async () => {
      try {
        let query = supabase
          .from('portfolio_projects')
          .select('id')
          .eq('slug', cleanSlug)

        if (isEditing && initialProject?.id) {
          query = query.neq('id', initialProject.id)
        }

        const { data } = await query.maybeSingle()

        if (data) {
          setSlugStatus('taken')
          const suffix =
            category === 'WEB_DEVELOPMENT' &&
            !cleanSlug.endsWith('-website') &&
            !cleanSlug.endsWith('-web')
              ? `${cleanSlug}-website`
              : `${cleanSlug}-2`
          setSuggestedSlug(suffix)
        } else {
          setSlugStatus('available')
          setSuggestedSlug(null)
        }
      } catch {
        setSlugStatus('idle')
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [slug, category, isEditing, initialProject?.id, initialProject?.slug])

  // Handle image files selection
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return

    const newItems: PendingImage[] = []
    let hasPrimary = images.some((img) => img.isPrimary)

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const validation = validateImageFile(file)
      if (!validation.valid) {
        alert(validation.error)
        continue
      }

      const previewUrl = createPreviewUrl(file)
      const isPrimary = !hasPrimary && newItems.length === 0
      if (isPrimary) hasPrimary = true

      newItems.push({
        id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        altText: title || file.name,
        caption: '',
        isPrimary,
        sortOrder: images.length + newItems.length,
        isExisting: false,
      })
    }

    setImages((prev) => [...prev, ...newItems])
  }

  // Reordering helpers
  const moveImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= images.length) return

    const copy = [...images]
    const temp = copy[index]
    copy[index] = copy[targetIndex]
    copy[targetIndex] = temp

    // Update sort order
    copy.forEach((img, idx) => {
      img.sortOrder = idx
    })

    setImages(copy)
  }

  // Set primary image
  const setPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        isPrimary: idx === index,
      }))
    )
  }

  // Remove image
  const removeImage = (index: number) => {
    const copy = images.filter((_, idx) => idx !== index)
    // If the removed image was primary and there are remaining images, set first as primary
    if (images[index].isPrimary && copy.length > 0) {
      copy[0].isPrimary = true
    }
    copy.forEach((img, idx) => {
      img.sortOrder = idx
    })
    setImages(copy)
  }

  // Update caption or alt text
  const updateImageField = (
    index: number,
    field: 'caption' | 'altText',
    val: string
  ) => {
    setImages((prev) =>
      prev.map((img, idx) => (idx === index ? { ...img, [field]: val } : img))
    )
  }

  const pickVideo = (file: File | undefined) => {
    if (!file) return
    if (!VIDEO_TYPES.includes(file.type)) {
      setSubmitError('Unsupported video type. Please upload an MP4, WebM or MOV file.')
      return
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setSubmitError(`Video is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). The limit is 50 MB. Compress it or paste a hosted video link instead.`)
      return
    }
    setSubmitError(null)
    if (videoPreview.startsWith('blob:')) URL.revokeObjectURL(videoPreview)
    setVideoFile(file)
    setVideoUrl('')
    setVideoPreview(URL.createObjectURL(file))
  }

  const clearVideo = () => {
    if (videoPreview.startsWith('blob:')) URL.revokeObjectURL(videoPreview)
    setVideoFile(null)
    setVideoUrl('')
    setVideoPreview('')
    setVideoIsCover(false)
  }

  // Validate form prior to saving
  const validate = (targetStatus: ProjectStatus): string | null => {
    if (!title.trim()) {
      return isAI ? 'Workflow Name is required.' : 'Website Name is required.'
    }
    if (!slug.trim()) {
      return 'Project slug is required.'
    }

    if (targetStatus === 'PUBLISHED') {
      if (isAI) {
        if (!coreChallenge.trim()) {
          return 'Core Challenge is required before publishing an AI Automation project.'
        }
        if (!solutionDelivered.trim()) {
          return 'Solution Delivered is required before publishing an AI Automation project.'
        }
        if (images.length === 0) {
          return 'At least one workflow screenshot is required before publishing.'
        }
      } else {
        // Web design
        if (images.length === 0) {
          return 'At least one website screenshot is required before publishing.'
        }
      }
    }

    return null
  }

  // Handle Save (Draft or Published)
  const handleSave = async (targetStatus: ProjectStatus) => {
    const errorMsg = validate(targetStatus)
    if (errorMsg) {
      setSubmitError(errorMsg)
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
      return
    }

    if (slugStatus === 'taken') {
      const alt = suggestedSlug || (category === 'WEB_DEVELOPMENT' ? `${slug}-website` : `${slug}-2`)
      setSubmitError(`The URL slug "${slug}" is already in use by another project. Please click "Use '${alt}'" or enter a unique slug.`)
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    // Ensure at least one image is primary if images exist
    const imagesToSave = [...images]
    if (imagesToSave.length > 0 && !imagesToSave.some((img) => img.isPrimary)) {
      imagesToSave[0].isPrimary = true
    }

    if (sectionsLoading) {
      setSubmitError('Case study sections are still loading. Try again in a moment.')
      setSubmitting(false)
      return
    }

    const tools = toolsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const formData: ProjectFormData = {
      title,
      slug,
      category,
      core_challenge: coreChallenge,
      solution_delivered: solutionDelivered,
      short_description: shortDescription,
      project_url: projectUrl,
      technologies: tools, // kept in sync with Tools used (search + preview read it)
      status: targetStatus,
      featured,
      sort_order: Number(sortOrder) || 0,
      year,
      role,
      platform,
      tools,
      detailsSupported: Boolean(initialProject && 'year' in initialProject),
      videoSupported: Boolean(initialProject && 'video_url' in initialProject),
    }

    let uploadedVideoPath = ''
    try {
      // Video: upload a new file, or keep / replace the link
      const typedUrl = videoUrl.trim()
      let finalVideoUrl = typedUrl
      let finalVideoPath = typedUrl && typedUrl === initialProject?.video_url ? initialProject?.video_storage_path || '' : ''
      if (videoFile) {
        const up = await uploadVideoFile(videoFile)
        finalVideoUrl = up.publicUrl
        finalVideoPath = up.storagePath
        uploadedVideoPath = up.storagePath
      }
      formData.video_url = finalVideoUrl
      formData.video_storage_path = finalVideoPath
      formData.video_is_cover = finalVideoUrl ? videoIsCover : false

      if (isEditing && initialProject?.id) {
        const existingImages = (initialProject.images || []).map((img) => ({
          id: img.id,
          storage_path: img.storage_path,
        }))
        await updateProjectWithImages(
          initialProject.id,
          formData,
          imagesToSave,
          existingImages
        )
        if (sections.length > 0 || hadSections.current) {
          await saveProjectSections(initialProject.id, sections, previousSectionPaths.current)
        }
        const oldVideoPath = initialProject.video_storage_path
        if (oldVideoPath && oldVideoPath !== finalVideoPath) await deleteStorageFile(oldVideoPath)
      } else {
        const created = await createProjectWithImages(formData, imagesToSave)
        if (sections.length > 0) {
          await saveProjectSections(created.id, sections, [])
        }
      }

      onSaved()
    } catch (err: any) {
      console.error('Save failed:', err)
      if (uploadedVideoPath) await deleteStorageFile(uploadedVideoPath)
      const rawMsg: string = err?.message || ''
      if (
        rawMsg.includes('portfolio_projects_slug_key') ||
        rawMsg.includes('unique constraint') ||
        rawMsg.includes('already in use') ||
        rawMsg.includes('already taken')
      ) {
        const alt = suggestedSlug || (category === 'WEB_DEVELOPMENT' ? `${slug}-website` : `${slug}-2`)
        setSuggestedSlug(alt)
        setSlugStatus('taken')
        setSubmitError(`The URL slug "${slug}" is already in use by another project. Please change the URL Slug to something unique (e.g. "${alt}").`)
      } else {
        setSubmitError(rawMsg || 'Failed to save project. Please check network/database.')
      }
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    } finally {
      setSubmitting(false)
    }
  }

  // Drag & drop handlers
  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }
  const onDragLeave = () => setDragActive(false)
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[150] bg-black/60 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="relative w-full max-w-3xl bg-bg text-fg max-h-[92dvh] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-bg border-b border-line px-6 py-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted">
                {isAI ? 'Category A: AI Automation' : 'Category B: Web Design & Development'}
              </span>
              <h2 className="text-xl font-black text-fg">
                {isEditing ? `Edit: ${title || 'Project'}` : isAI ? 'Add AI Automation Project' : 'Add Website Project'}
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="w-8 h-8 flex items-center justify-center border border-line hover:border-fg text-xs font-bold transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Form Scroll Area */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-sm">
            {submitError && (
              <div
                ref={errorRef}
                role="alert"
                className="p-4 bg-red-50 dark:bg-red-950/40 border-l-4 border-red-600 text-xs font-semibold text-red-700 dark:text-red-400"
              >
                {submitError}
              </div>
            )}

            {/* Category Selector Dropdown */}
            <div className="border border-line bg-surface p-4">
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-fg mb-1">
                Project Category Sector *
              </label>
              <p className="text-[11px] text-muted mb-3 leading-relaxed">
                Choose the sector where this project belongs. Switching categories dynamically updates the form fields and saves the project directly into that sector on the public portfolio.
              </p>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                  className="w-full border border-line-strong focus:border-fg px-4 py-2.5 text-sm font-bold bg-bg outline-none cursor-pointer appearance-none transition-colors"
                >
                  <option value="AI_AUTOMATION">
                    AI Automation Sector (Workflows, AI Agents, n8n Systems)
                  </option>
                  <option value="WEB_DEVELOPMENT">
                    Web Design &amp; Development Sector (Websites, Apps, E-commerce)
                  </option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-fg">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* 1. Name & Slug */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.1em] text-fg mb-1.5">
                  {isAI ? 'Workflow Name *' : 'Website Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={
                    isAI
                      ? "e.g. Safe Haven Properties — Lead Management"
                      : "e.g. VoltEdge Tech & Accessories"
                  }
                  className="w-full border border-line-strong focus:border-fg px-3.5 py-2.5 text-sm outline-none transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-[0.1em] text-fg">
                    URL Slug *
                  </label>
                  {slugStatus === 'available' && slug.trim() && (
                    <span className="text-[10px] text-green-700 dark:text-green-400 font-bold uppercase tracking-wider">
                      ✓ Available
                    </span>
                  )}
                  {slugStatus === 'taken' && (
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
                      ⚠ Taken
                    </span>
                  )}
                  {slugStatus === 'checking' && (
                    <span className="text-[10px] text-muted uppercase tracking-wider animate-pulse">
                      Checking...
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value)
                    setSubmitError(null)
                  }}
                  placeholder="e.g. voltedge-accessories"
                  className={`w-full border px-3.5 py-2.5 text-sm outline-none transition-colors ${
                    slugStatus === 'taken'
                      ? 'border-red-500 focus:border-red-600 bg-red-50/30 dark:bg-red-950/30'
                      : 'border-line-strong focus:border-fg'
                  }`}
                />
                {slugStatus === 'taken' && (
                  <div className="mt-1.5 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs flex flex-wrap items-center justify-between gap-2">
                    <span className="text-red-700 dark:text-red-400 font-medium">
                      This slug is already used by another project.
                    </span>
                    {suggestedSlug && (
                      <button
                        type="button"
                        onClick={() => {
                          setSlug(suggestedSlug)
                          setSubmitError(null)
                        }}
                        className="px-2.5 py-1 bg-fg text-bg text-[11px] font-bold hover:bg-muted transition-colors whitespace-nowrap"
                      >
                        Use &ldquo;{suggestedSlug}&rdquo; →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* AI Specific: Core Challenge & Solution Delivered */}
            {isAI && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.1em] text-fg mb-1.5">
                    Core Challenge *
                  </label>
                  <p className="text-[11px] text-muted mb-2">
                    Explain the problem or operational bottleneck the business was experiencing.
                  </p>
                  <textarea
                    rows={4}
                    value={coreChallenge}
                    onChange={(e) => setCoreChallenge(e.target.value)}
                    placeholder="Describe the friction, manual work, delays, or challenges..."
                    className="w-full border border-line-strong focus:border-fg p-3 text-sm outline-none transition-colors resize-y"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.1em] text-fg mb-1.5">
                    Solution Delivered *
                  </label>
                  <p className="text-[11px] text-muted mb-2">
                    Describe how the automation workflow was built and how it solves the challenge.
                  </p>
                  <textarea
                    rows={4}
                    value={solutionDelivered}
                    onChange={(e) => setSolutionDelivered(e.target.value)}
                    placeholder="Describe the n8n workflows, AI agent triggers, integrations..."
                    className="w-full border border-line-strong focus:border-fg p-3 text-sm outline-none transition-colors resize-y"
                  />
                </div>
              </>
            )}

            {/* Web Development / Shared: Short Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.1em] text-fg mb-1.5">
                {isAI ? 'Subtitle / Summary (Optional)' : 'Short Description (Optional)'}
              </label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="A concise 1-2 sentence overview of the project..."
                className="w-full border border-line-strong focus:border-fg px-3.5 py-2.5 text-sm outline-none transition-colors"
              />
            </div>

            {/* Website URL */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.1em] text-fg mb-1.5">
                {isAI ? 'Project / Live Demo URL (Optional)' : 'Live Website URL (Optional)'}
              </label>
              <input
                type="url"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="https://..."
                className="w-full border border-line-strong focus:border-fg px-3.5 py-2.5 text-sm outline-none transition-colors"
              />
            </div>

            {/* Case study details + sections (both categories) */}
            {(
              <>
                <div className="pt-2 border-t border-line">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-fg">Case Study Details</p>
                  <p className="text-[11px] text-muted mt-0.5 mb-3">
                    Shown at the top of the project page when someone clicks &ldquo;View Project&rdquo;.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-fg mb-1">Year</label>
                      <input type="text" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026"
                        className="w-full border border-line-strong focus:border-fg px-3 py-2 text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-fg mb-1">Role</label>
                      <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Designer & Developer"
                        className="w-full border border-line-strong focus:border-fg px-3 py-2 text-sm outline-none" />
                    </div>
                    <div>
                      <label htmlFor="platform-select" className="block text-[11px] font-bold uppercase tracking-wider text-fg mb-1">
                        Platform
                      </label>
                      <select
                        id="platform-select"
                        value={PLATFORM_OPTIONS.includes(platform) ? platform : platform ? OTHER_PLATFORM : ''}
                        onChange={(e) => setPlatform(e.target.value === OTHER_PLATFORM ? ' ' : e.target.value)}
                        className="w-full border border-line-strong focus:border-fg px-3 py-2 text-sm outline-none bg-bg cursor-pointer"
                      >
                        <option value="">Not set</option>
                        {PLATFORM_OPTIONS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                        <option value={OTHER_PLATFORM}>Other…</option>
                      </select>
                      {platform && !PLATFORM_OPTIONS.includes(platform) && (
                        <input
                          type="text"
                          value={platform.trim() === '' ? '' : platform}
                          onChange={(e) => setPlatform(e.target.value)}
                          placeholder="Type the platform"
                          autoFocus
                          className="mt-2 w-full border border-line-strong focus:border-fg px-3 py-2 text-sm outline-none"
                        />
                      )}
                      <p className="text-[11px] text-muted mt-1">
                        {isAI ? 'What the automation runs for: a web app, a mobile app, a website…' : 'What the project is: a web app, a mobile app, a website…'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-fg mb-1">Tools used</label>
                    <input type="text" value={toolsInput} onChange={(e) => setToolsInput(e.target.value)}
                      placeholder={isAI ? "n8n, Webhook, Google Sheets, Gmail" : "Figma, React, Supabase, Claude Code"}
                      className="w-full border border-line-strong focus:border-fg px-3 py-2 text-sm outline-none" />
                    <p className="text-[11px] text-muted mt-1">
                      Separate with commas. The icon appears automatically for well-known tools (n8n, Figma, React, Google Sheets, Supabase and many more). An icon you upload in the Skills tab takes priority.
                    </p>
                  </div>
                </div>

                {sectionsLoading ? (
                  <p className="text-xs text-muted">Loading case study sections…</p>
                ) : (
                  <SectionsEditor
                    sections={sections}
                    onChange={setSections}
                    onError={(m) => setSubmitError(m)}
                  />
                )}
              </>
            )}

            {/* Sort Order & Featured */}
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-line">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold uppercase tracking-[0.1em] text-fg">
                  Display Order:
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  className="w-20 border border-line-strong focus:border-fg px-2.5 py-1.5 text-xs text-center outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-fg cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 accent-fg"
                />
                Feature on Public Portfolio
              </label>
            </div>

            {/* Project video */}
            <div className="pt-2 border-t border-line">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-fg">Project Video (Optional)</p>
              <p className="text-[11px] text-muted mt-0.5 mb-3 leading-relaxed">
                Upload a short clip (MP4, WebM or MOV, up to 50 MB) or paste a direct video link. Set it as the cover
                and it plays by itself, muted and looping, when a visitor scrolls to it.
              </p>

              {videoPreview && (
                <video
                  src={videoPreview}
                  controls
                  muted
                  playsInline
                  className="w-full max-w-md border border-line-strong bg-fg mb-3"
                />
              )}

              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer px-3 py-2 border border-fg text-xs font-bold hover:bg-fg hover:text-bg transition-colors">
                  {videoPreview ? 'Replace video file' : 'Upload video file'}
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="sr-only"
                    onChange={(e) => {
                      pickVideo(e.target.files?.[0])
                      e.target.value = ''
                    }}
                  />
                </label>
                {videoPreview && (
                  <button type="button" onClick={clearVideo} className="text-xs font-bold underline text-red-600 dark:text-red-400">
                    Remove video
                  </button>
                )}
              </div>

              <div className="mt-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-fg mb-1">
                  Or paste a video link
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value)
                    setVideoFile(null)
                    setVideoPreview(e.target.value.trim())
                  }}
                  placeholder="https://.../clip.mp4"
                  className="w-full border border-line-strong focus:border-fg px-3 py-2 text-sm outline-none"
                />
              </div>

              <label className="mt-3 flex items-center gap-2 text-xs font-bold text-fg cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={videoIsCover}
                  disabled={!videoPreview}
                  onChange={(e) => setVideoIsCover(e.target.checked)}
                  className="w-4 h-4 accent-fg"
                />
                Use this video as the project cover (autoplays when scrolled into view)
              </label>
            </div>

            {/* Image Upload Component */}
            <div className="pt-2 border-t border-line">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.1em] text-fg">
                    {isAI ? 'Workflow Images *' : 'Website Screenshots *'}
                  </label>
                  <p className="text-[11px] text-muted">
                    {isAI
                      ? 'Upload multiple screenshots of your workflow (n8n canvas, nodes, integrations).'
                      : 'Upload website screenshots. The primary one will be used in the showcase.'}
                  </p>
                </div>
                <span className="text-xs text-muted font-mono">
                  {images.length} {images.length === 1 ? 'image' : 'images'}
                </span>
              </div>

              {/* Drag & drop dropzone */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                  dragActive ? 'border-fg bg-surface' : 'border-line-strong hover:border-fg'
                }`}
                onClick={() => document.getElementById('image-upload-input')?.click()}
              >
                <input
                  id="image-upload-input"
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="mx-auto mb-2 text-muted"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="text-xs font-bold text-fg mb-1">
                  Click to choose images or drag &amp; drop here
                </p>
                <p className="text-[11px] text-muted">
                  Supports PNG, JPEG, WebP, AVIF &amp; SVG (Max 20MB per image)
                </p>
              </div>

              {/* Image List / Management */}
              {images.length > 0 && (
                <div className="mt-4 space-y-3">
                  {images.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 border transition-colors ${
                        item.isPrimary ? 'border-fg bg-surface' : 'border-line'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-24 h-16 bg-surface flex-shrink-0 overflow-hidden border border-line">
                        <img
                          src={item.previewUrl}
                          alt={item.altText}
                          className="w-full h-full object-cover"
                        />
                        {item.isPrimary && (
                          <span className="absolute bottom-0 left-0 right-0 bg-fg text-bg text-[9px] font-black uppercase tracking-wider text-center py-0.5">
                            Cover
                          </span>
                        )}
                      </div>

                      {/* Alt text and Caption inputs */}
                      <div className="flex-1 space-y-1.5 w-full">
                        <input
                          type="text"
                          value={item.caption}
                          onChange={(e) => updateImageField(idx, 'caption', e.target.value)}
                          placeholder="Optional caption (e.g. n8n Main Webhook trigger)"
                          className="w-full border border-line focus:border-fg px-2.5 py-1 text-xs outline-none"
                        />
                        <input
                          type="text"
                          value={item.altText}
                          onChange={(e) => updateImageField(idx, 'altText', e.target.value)}
                          placeholder="Alt text for accessibility..."
                          className="w-full border border-line focus:border-fg px-2.5 py-1 text-xs outline-none text-muted"
                        />
                      </div>

                      {/* Image actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Primary button */}
                        {!item.isPrimary && (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(idx)}
                            className="px-2 py-1 text-[10px] font-bold border border-line-strong hover:border-fg text-fg"
                            title="Set as primary cover image"
                          >
                            Set Cover
                          </button>
                        )}

                        {/* Move Up */}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveImage(idx, 'up')}
                          className="w-7 h-7 flex items-center justify-center border border-line-strong hover:border-fg text-xs disabled:opacity-30"
                          title="Move earlier"
                        >
                          ↑
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          disabled={idx === images.length - 1}
                          onClick={() => moveImage(idx, 'down')}
                          className="w-7 h-7 flex items-center justify-center border border-line-strong hover:border-fg text-xs disabled:opacity-30"
                          title="Move later"
                        >
                          ↓
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="w-7 h-7 flex items-center justify-center border border-red-300 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold"
                          title="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="sticky bottom-0 z-10 bg-bg border-t border-line px-6 py-4 flex flex-col gap-3">
            {submitError && (
              <p role="alert" className="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2">
                {submitError}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setShowPreview(true)}
              className="px-4 py-2 border border-fg text-fg text-xs font-bold uppercase hover:bg-fg hover:text-bg transition-colors"
            >
              Live Preview ↗
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-muted hover:text-fg"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSave('DRAFT')}
                className="px-4 py-2 border border-line-strong hover:border-fg text-xs font-bold text-fg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save as Draft'}
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSave('PUBLISHED')}
                className="px-5 py-2 bg-fg text-bg text-xs font-bold uppercase tracking-wider border border-fg hover:bg-bg hover:text-fg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Publish to Portfolio →'}
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview Modal */}
      {showPreview && (
        <ProjectPreviewModal
          project={{
            title,
            slug,
            category,
            core_challenge: coreChallenge,
            solution_delivered: solutionDelivered,
            short_description: shortDescription,
            project_url: projectUrl,
            technologies: toolsInput.split(',').map((t) => t.trim()).filter(Boolean),
            featured,
          }}
          images={images}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  )
}
