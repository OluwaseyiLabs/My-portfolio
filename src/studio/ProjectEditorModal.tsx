import { useState, type DragEvent } from 'react'
import type {
  PortfolioProject,
  ProjectCategory,
  ProjectStatus,
  ProjectFormData,
  PendingImage,
} from '../types/portfolio'
import {
  createProjectWithImages,
  updateProjectWithImages,
} from '../lib/supabase'
import {
  validateImageFile,
  createPreviewUrl,
  generateSlug,
} from '../lib/imageOptimization'
import ProjectPreviewModal from './ProjectPreviewModal'

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
  const [technologiesInput, setTechnologiesInput] = useState(
    (initialProject?.technologies || []).join(', ')
  )
  const [featured, setFeatured] = useState(initialProject?.featured || false)
  const [sortOrder, setSortOrder] = useState<number>(initialProject?.sort_order ?? 0)

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

  // Auto-generate slug when title changes (if new or user hasn't typed a custom slug)
  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!isEditing) {
      setSlug(generateSlug(val))
    }
  }

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
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    // Ensure at least one image is primary if images exist
    const imagesToSave = [...images]
    if (imagesToSave.length > 0 && !imagesToSave.some((img) => img.isPrimary)) {
      imagesToSave[0].isPrimary = true
    }

    const technologies = technologiesInput
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
      technologies,
      status: targetStatus,
      featured,
      sort_order: Number(sortOrder) || 0,
    }

    try {
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
      } else {
        await createProjectWithImages(formData, imagesToSave)
      }

      onSaved()
    } catch (err: any) {
      console.error('Save failed:', err)
      setSubmitError(err.message || 'Failed to save project. Please check network/database.')
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
        <div className="relative w-full max-w-3xl bg-white text-black max-h-[92vh] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-[#E5E5E5] px-6 py-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#777777]">
                {isAI ? 'Category A: AI Automation' : 'Category B: Web Design & Development'}
              </span>
              <h2 className="text-xl font-black text-black">
                {isEditing ? `Edit: ${title || 'Project'}` : isAI ? 'Add AI Automation Project' : 'Add Website Project'}
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="w-8 h-8 flex items-center justify-center border border-[#E5E5E5] hover:border-black text-xs font-bold transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Form Scroll Area */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-sm">
            {submitError && (
              <div
                role="alert"
                className="p-4 bg-[#FBFBFB] border-l-4 border-black text-xs font-semibold text-black"
              >
                {submitError}
              </div>
            )}

            {/* Category Selector Dropdown */}
            <div className="border border-[#E5E5E5] bg-[#FBFBFB] p-4">
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-black mb-1">
                Project Category Sector *
              </label>
              <p className="text-[11px] text-[#666666] mb-3 leading-relaxed">
                Choose the sector where this project belongs. Switching categories dynamically updates the form fields and saves the project directly into that sector on the public portfolio.
              </p>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                  className="w-full border border-[#D5D5D5] focus:border-black px-4 py-2.5 text-sm font-bold bg-white outline-none cursor-pointer appearance-none transition-colors"
                >
                  <option value="AI_AUTOMATION">
                    AI Automation Sector (Workflows, AI Agents, n8n Systems)
                  </option>
                  <option value="WEB_DEVELOPMENT">
                    Web Design &amp; Development Sector (Websites, Apps, E-commerce)
                  </option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-black">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* 1. Name & Slug */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.1em] text-black mb-1.5">
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
                  className="w-full border border-[#D5D5D5] focus:border-black px-3.5 py-2.5 text-sm outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.1em] text-black mb-1.5">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. lead-management-automation"
                  className="w-full border border-[#D5D5D5] focus:border-black px-3.5 py-2.5 text-sm outline-none transition-colors"
                />
              </div>
            </div>

            {/* AI Specific: Core Challenge & Solution Delivered */}
            {isAI && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.1em] text-black mb-1.5">
                    Core Challenge *
                  </label>
                  <p className="text-[11px] text-[#666666] mb-2">
                    Explain the problem or operational bottleneck the business was experiencing.
                  </p>
                  <textarea
                    rows={4}
                    value={coreChallenge}
                    onChange={(e) => setCoreChallenge(e.target.value)}
                    placeholder="Describe the friction, manual work, delays, or challenges..."
                    className="w-full border border-[#D5D5D5] focus:border-black p-3 text-sm outline-none transition-colors resize-y"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.1em] text-black mb-1.5">
                    Solution Delivered *
                  </label>
                  <p className="text-[11px] text-[#666666] mb-2">
                    Describe how the automation workflow was built and how it solves the challenge.
                  </p>
                  <textarea
                    rows={4}
                    value={solutionDelivered}
                    onChange={(e) => setSolutionDelivered(e.target.value)}
                    placeholder="Describe the n8n workflows, AI agent triggers, integrations..."
                    className="w-full border border-[#D5D5D5] focus:border-black p-3 text-sm outline-none transition-colors resize-y"
                  />
                </div>
              </>
            )}

            {/* Web Development / Shared: Short Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.1em] text-black mb-1.5">
                {isAI ? 'Subtitle / Summary (Optional)' : 'Short Description (Optional)'}
              </label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="A concise 1-2 sentence overview of the project..."
                className="w-full border border-[#D5D5D5] focus:border-black px-3.5 py-2.5 text-sm outline-none transition-colors"
              />
            </div>

            {/* Website URL */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.1em] text-black mb-1.5">
                {isAI ? 'Project / Live Demo URL (Optional)' : 'Live Website URL (Optional)'}
              </label>
              <input
                type="url"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="https://..."
                className="w-full border border-[#D5D5D5] focus:border-black px-3.5 py-2.5 text-sm outline-none transition-colors"
              />
            </div>

            {/* Technologies */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.1em] text-black mb-1.5">
                Technologies / Tags (Optional)
              </label>
              <input
                type="text"
                value={technologiesInput}
                onChange={(e) => setTechnologiesInput(e.target.value)}
                placeholder={
                  isAI
                    ? "n8n, AI Agents, CRM Automation, PostgreSQL"
                    : "React, TypeScript, Tailwind CSS, Vite"
                }
                className="w-full border border-[#D5D5D5] focus:border-black px-3.5 py-2.5 text-sm outline-none transition-colors"
              />
              <p className="text-[11px] text-[#777777] mt-1">Separate tags with commas.</p>
            </div>

            {/* Sort Order & Featured */}
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-[#E5E5E5]">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold uppercase tracking-[0.1em] text-black">
                  Display Order:
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  className="w-20 border border-[#D5D5D5] focus:border-black px-2.5 py-1.5 text-xs text-center outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-black cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 accent-black"
                />
                Feature on Public Portfolio
              </label>
            </div>

            {/* Image Upload Component */}
            <div className="pt-2 border-t border-[#E5E5E5]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.1em] text-black">
                    {isAI ? 'Workflow Images *' : 'Website Screenshots *'}
                  </label>
                  <p className="text-[11px] text-[#666666]">
                    {isAI
                      ? 'Upload multiple screenshots of your workflow (n8n canvas, nodes, integrations).'
                      : 'Upload website screenshots. The primary one will be used in the showcase.'}
                  </p>
                </div>
                <span className="text-xs text-[#777777] font-mono">
                  {images.length} {images.length === 1 ? 'image' : 'images'}
                </span>
              </div>

              {/* Drag & drop dropzone */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                  dragActive ? 'border-black bg-[#F5F5F5]' : 'border-[#CCCCCC] hover:border-black'
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
                  className="mx-auto mb-2 text-[#777777]"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="text-xs font-bold text-black mb-1">
                  Click to choose images or drag &amp; drop here
                </p>
                <p className="text-[11px] text-[#777777]">
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
                        item.isPrimary ? 'border-black bg-[#FBFBFB]' : 'border-[#E5E5E5]'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-24 h-16 bg-[#EEEEEE] flex-shrink-0 overflow-hidden border border-[#DDDDDD]">
                        <img
                          src={item.previewUrl}
                          alt={item.altText}
                          className="w-full h-full object-cover"
                        />
                        {item.isPrimary && (
                          <span className="absolute bottom-0 left-0 right-0 bg-black text-white text-[9px] font-black uppercase tracking-wider text-center py-0.5">
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
                          className="w-full border border-[#E0E0E0] focus:border-black px-2.5 py-1 text-xs outline-none"
                        />
                        <input
                          type="text"
                          value={item.altText}
                          onChange={(e) => updateImageField(idx, 'altText', e.target.value)}
                          placeholder="Alt text for accessibility..."
                          className="w-full border border-[#E0E0E0] focus:border-black px-2.5 py-1 text-xs outline-none text-[#555555]"
                        />
                      </div>

                      {/* Image actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Primary button */}
                        {!item.isPrimary && (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(idx)}
                            className="px-2 py-1 text-[10px] font-bold border border-[#CCCCCC] hover:border-black text-black"
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
                          className="w-7 h-7 flex items-center justify-center border border-[#CCCCCC] hover:border-black text-xs disabled:opacity-30"
                          title="Move earlier"
                        >
                          ↑
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          disabled={idx === images.length - 1}
                          onClick={() => moveImage(idx, 'down')}
                          className="w-7 h-7 flex items-center justify-center border border-[#CCCCCC] hover:border-black text-xs disabled:opacity-30"
                          title="Move later"
                        >
                          ↓
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="w-7 h-7 flex items-center justify-center border border-red-300 hover:bg-red-50 text-red-600 text-xs font-bold"
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
          <div className="sticky bottom-0 z-10 bg-white border-t border-[#E5E5E5] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setShowPreview(true)}
              className="px-4 py-2 border border-black text-black text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors"
            >
              Live Preview ↗
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#555555] hover:text-black"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSave('DRAFT')}
                className="px-4 py-2 border border-[#CCCCCC] hover:border-black text-xs font-bold text-black transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save as Draft'}
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSave('PUBLISHED')}
                className="px-5 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider border border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Publish to Portfolio →'}
              </button>
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
            technologies: technologiesInput.split(',').map((t) => t.trim()).filter(Boolean),
            featured,
          }}
          images={images}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  )
}
