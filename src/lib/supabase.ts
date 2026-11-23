import { createClient } from '@supabase/supabase-js'
import type { PortfolioProject, PortfolioSkill, SkillFormData, ProjectSection, DraftSection, SectionImage, ProjectCategory, ProjectStatus, ProjectFormData, PendingImage } from '../types/portfolio'
import { compressImageFile } from './imageOptimization'
import { sanitizeText, LIMITS } from './sanitize'
import { env, configIsValid } from './env'

// Placeholder values only keep the app from crashing when configuration is missing;
// App.tsx shows a clear "configuration missing" screen in that case.
export const supabase = createClient(
  configIsValid ? env.supabaseUrl : 'http://localhost:54321',
  configIsValid ? env.supabaseAnonKey : 'missing-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

export const BUCKET_NAME = 'portfolio-media'

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024
export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

/**
 * Fetch published projects with images for public visitors
 */
export async function fetchPublishedProjects(category?: ProjectCategory): Promise<PortfolioProject[]> {
  try {
    let query = supabase
      .from('portfolio_projects')
      .select(`
        *,
        images:portfolio_project_images(*)
      `)
      .eq('status', 'PUBLISHED')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.warn('Error fetching published projects:', error.message)
      return []
    }

    // Sort images by sort_order
    return (data || []).map((project) => ({
      ...project,
      images: (project.images || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    }))
  } catch (err) {
    console.error('Network error fetching projects:', err)
    return []
  }
}

/**
 * Fetch all projects for CMS studio (supports drafts and archived)
 */
export async function fetchStudioProjects(): Promise<PortfolioProject[]> {
  const { data, error } = await supabase
    .from('portfolio_projects')
    .select(`
      *,
      images:portfolio_project_images(*)
    `)
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).map((project) => ({
    ...project,
    images: (project.images || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  }))
}

/**
 * Upload an image file to Supabase Storage and return public URL + storage path
 */
export async function uploadImageFile(
  projectId: string,
  file: File
): Promise<{ storagePath: string; publicUrl: string }> {
  // Automatically compress bitmap images to optimized WebP
  const optimizedFile = await compressImageFile(file)
  const ext = optimizedFile.name.split('.').pop()?.toLowerCase() || 'webp'
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const safeName = `${Date.now()}-${randomSuffix}.${ext}`
  const storagePath = `${projectId}/${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, optimizedFile, {
      cacheControl: '31536000',
      upsert: true,
      contentType: optimizedFile.type || 'image/webp',
    })

  if (uploadError) {
    throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`)
  }

  const { data: publicData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath)

  return {
    storagePath,
    publicUrl: publicData.publicUrl,
  }
}

/**
 * Upload a project video to Supabase Storage (no re-encoding: keep clips short and compressed).
 */
export async function uploadVideoFile(file: File): Promise<{ storagePath: string; publicUrl: string }> {
  if (!VIDEO_TYPES.includes(file.type)) {
    throw new Error('Unsupported video type. Please upload an MP4, WebM or MOV file.')
  }
  if (file.size > MAX_VIDEO_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1)
    throw new Error(`Video is too large (${mb} MB). The limit is 50 MB. Compress it or paste a hosted video link instead.`)
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
  const storagePath = `videos/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type,
  })
  if (error) throw new Error(`Video upload failed: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath)
  return { storagePath, publicUrl: data.publicUrl }
}

/**
 * Delete an image file from Supabase Storage
 */
export async function deleteStorageFile(storagePath: string): Promise<void> {
  if (!storagePath) return
  try {
    await supabase.storage.from(BUCKET_NAME).remove([storagePath])
  } catch (err) {
    console.warn('Storage removal failed:', err)
  }
}

/**
 * Case-study columns (year/role/platform/tools). Only sent when filled in, or when the DB is
 * known to have them, so saving projects keeps working before migration 002 is applied.
 */
function detailsPayload(f: ProjectFormData, alwaysInclude: boolean): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const year = f.year?.trim()
  const role = f.role?.trim()
  const platform = f.platform?.trim()
  const tools = f.tools ?? []
  if (year || alwaysInclude) out.year = year || null
  if (role || alwaysInclude) out.role = role || null
  if (platform || alwaysInclude) out.platform = platform || null
  if (tools.length > 0 || alwaysInclude) out.tools = tools
  const url = f.video_url?.trim()
  if (url || f.videoSupported) {
    out.video_url = url || null
    out.video_storage_path = url ? f.video_storage_path || null : null
    out.video_is_cover = url ? !!f.video_is_cover : false
  }
  return out
}

/**
 * Create a new project with its images
 */
export async function createProjectWithImages(
  formData: ProjectFormData,
  pendingImages: PendingImage[]
): Promise<PortfolioProject> {
  // 1. Insert project record
  const { data: project, error: projectError } = await supabase
    .from('portfolio_projects')
    .insert([
      {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        category: formData.category,
        core_challenge: formData.core_challenge?.trim() || null,
        solution_delivered: formData.solution_delivered?.trim() || null,
        short_description: formData.short_description?.trim() || null,
        project_url: formData.project_url?.trim() || null,
        technologies: formData.technologies || [],
        status: formData.status,
        featured: formData.featured,
        sort_order: formData.sort_order,
        published_at: formData.status === 'PUBLISHED' ? new Date().toISOString() : null,
        ...detailsPayload(formData, false),
      },
    ])
    .select()
    .single()

  if (projectError) {
    if (projectError.code === '23505' || projectError.message.includes('portfolio_projects_slug_key')) {
      throw new Error(`The URL slug "${formData.slug}" is already in use by another project. Please choose a different slug.`)
    }
    throw new Error(projectError.message)
  }

  const uploadedPaths: string[] = []

  try {
    // 2. Process and upload images
    const imageRecords = []
    for (let i = 0; i < pendingImages.length; i++) {
      const item = pendingImages[i]
      let publicUrl = item.previewUrl
      let storagePath = item.storagePath || ''

      if (item.file) {
        const uploadResult = await uploadImageFile(project.id, item.file)
        publicUrl = uploadResult.publicUrl
        storagePath = uploadResult.storagePath
        uploadedPaths.push(storagePath)
      }

      imageRecords.push({
        project_id: project.id,
        storage_path: storagePath,
        public_url: publicUrl,
        alt_text: item.altText?.trim() || formData.title,
        caption: item.caption?.trim() || null,
        sort_order: i,
        is_primary: item.isPrimary,
      })
    }

    if (imageRecords.length > 0) {
      const { error: imagesError } = await supabase
        .from('portfolio_project_images')
        .insert(imageRecords)

      if (imagesError) {
        throw new Error(imagesError.message)
      }
    }

    return project
  } catch (err) {
    // Clean up uploaded images if database transaction fails
    for (const path of uploadedPaths) {
      await deleteStorageFile(path)
    }
    await supabase.from('portfolio_projects').delete().eq('id', project.id)
    throw err
  }
}

/**
 * Update an existing project and sync its images
 */
export async function updateProjectWithImages(
  projectId: string,
  formData: ProjectFormData,
  pendingImages: PendingImage[],
  existingImages: { id: string; storage_path: string }[]
): Promise<void> {
  // 1. Update project details
  const updatePayload: any = {
    title: formData.title.trim(),
    slug: formData.slug.trim(),
    category: formData.category,
    core_challenge: formData.core_challenge?.trim() || null,
    solution_delivered: formData.solution_delivered?.trim() || null,
    short_description: formData.short_description?.trim() || null,
    project_url: formData.project_url?.trim() || null,
    technologies: formData.technologies || [],
    status: formData.status,
    featured: formData.featured,
    sort_order: formData.sort_order,
    updated_at: new Date().toISOString(),
    ...detailsPayload(formData, !!formData.detailsSupported),
  }

  if (formData.status === 'PUBLISHED') {
    updatePayload.published_at = new Date().toISOString()
  }

  const { error: updateError } = await supabase
    .from('portfolio_projects')
    .update(updatePayload)
    .eq('id', projectId)

  if (updateError) {
    if (updateError.code === '23505' || updateError.message.includes('portfolio_projects_slug_key')) {
      throw new Error(`The URL slug "${formData.slug}" is already in use by another project. Please choose a different slug.`)
    }
    throw new Error(updateError.message)
  }

  // 2. Upload any new files first before deleting old images
  const finalImageRecords = []
  const currentKeptStoragePaths = new Set<string>()

  for (let i = 0; i < pendingImages.length; i++) {
    const item = pendingImages[i]
    let publicUrl = item.previewUrl
    let storagePath = item.storagePath || ''

    if (item.file) {
      const uploadRes = await uploadImageFile(projectId, item.file)
      publicUrl = uploadRes.publicUrl
      storagePath = uploadRes.storagePath
    }

    if (storagePath) {
      currentKeptStoragePaths.add(storagePath)
    }

    finalImageRecords.push({
      project_id: projectId,
      storage_path: storagePath,
      public_url: publicUrl,
      alt_text: item.altText?.trim() || formData.title,
      caption: item.caption?.trim() || null,
      sort_order: i,
      is_primary: item.isPrimary,
    })
  }

  // 3. Delete old project image database rows and replace with updated set
  await supabase.from('portfolio_project_images').delete().eq('project_id', projectId)

  if (finalImageRecords.length > 0) {
    const { error: insertError } = await supabase
      .from('portfolio_project_images')
      .insert(finalImageRecords)

    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  // 4. Safely clean up removed storage images that are no longer referenced
  for (const existing of existingImages) {
    if (existing.storage_path && !currentKeptStoragePaths.has(existing.storage_path)) {
      await deleteStorageFile(existing.storage_path)
    }
  }
}

/**
 * Delete a project and remove all associated storage files
 */
export async function deleteProjectPermanently(projectId: string): Promise<void> {
  // 1. Fetch images to delete from storage
  const { data: images } = await supabase
    .from('portfolio_project_images')
    .select('storage_path')
    .eq('project_id', projectId)

  const { data: projectRow } = await supabase
    .from('portfolio_projects')
    .select('video_storage_path')
    .eq('id', projectId)
    .maybeSingle()
  const { data: sectionRows } = await supabase
    .from('portfolio_project_sections')
    .select('images')
    .eq('project_id', projectId)

  // 2. Delete project from DB (cascade deletes images rows)
  const { error } = await supabase
    .from('portfolio_projects')
    .delete()
    .eq('id', projectId)

  if (error) {
    throw new Error(error.message)
  }

  // 3. Delete files from storage
  const videoPath = (projectRow as any)?.video_storage_path
  if (videoPath) await deleteStorageFile(videoPath)
  for (const row of (sectionRows as any[]) || []) {
    for (const im of Array.isArray(row.images) ? row.images : []) {
      if (im?.storage_path) await deleteStorageFile(im.storage_path)
    }
  }
  if (images && images.length > 0) {
    for (const img of images) {
      if (img.storage_path) {
        await deleteStorageFile(img.storage_path)
      }
    }
  }
}

/**
 * Toggle project status (PUBLISHED, DRAFT, ARCHIVED)
 */
export async function updateProjectStatus(projectId: string, newStatus: ProjectStatus): Promise<void> {
  const payload: any = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  }

  if (newStatus === 'PUBLISHED') {
    payload.published_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('portfolio_projects')
    .update(payload)
    .eq('id', projectId)

  if (error) {
    throw new Error(error.message)
  }
}

export interface InquiryPayload {
  firstName: string
  lastName: string
  email: string
  company: string
  /** optional; empty string when not given */
  website: string
  role: string
  companySize: string
  annualRevenue: string
  projectBudget: string
  /** "How can I help?" */
  message: string
  /** what they hope to improve (one or more) */
  interests: string[]
  /** optional extra context */
  extra: string
}

export interface InquiryResult {
  success: boolean
  savedToDb: boolean
  webhookDelivered: boolean
  webhookError?: string
  /** set when the server refused the message because of too many attempts */
  retryAfter?: number
}

export interface PortfolioInquiry {
  id: string
  name: string
  email: string
  message: string
  status: string
  first_name?: string | null
  last_name?: string | null
  company?: string | null
  website?: string | null
  role?: string | null
  company_size?: string | null
  annual_revenue?: string | null
  project_budget?: string | null
  interests?: string[] | null
  extra_info?: string | null
  webhook_sent: boolean
  webhook_response?: string
  created_at: string
}

/**
 * Submit a contact inquiry.
 *  1. The server function `portfolio_submit_inquiry` validates, sanitises and rate-limits it (escalating waits:
 *     1 minute, 5 minutes, 15 minutes, 1 hour) and stores it, so nothing is ever lost.
 *  2. The browser then tells n8n only the new inquiry's id. n8n fetches the real data from the database
 *     itself, so the webhook cannot be used to send arbitrary emails.
 */
export async function submitInquiry(
  rawPayload: InquiryPayload,
  hooks?: { onSaved?: () => void },
): Promise<InquiryResult> {
  const payload: InquiryPayload = {
    firstName: sanitizeText(rawPayload.firstName, LIMITS.firstName),
    lastName: sanitizeText(rawPayload.lastName, LIMITS.lastName),
    email: sanitizeText(rawPayload.email, LIMITS.email).toLowerCase(),
    company: sanitizeText(rawPayload.company, LIMITS.company),
    website: sanitizeText(rawPayload.website, LIMITS.website).replace(/\s+/g, ''),
    role: rawPayload.role,
    companySize: rawPayload.companySize,
    annualRevenue: rawPayload.annualRevenue,
    projectBudget: rawPayload.projectBudget,
    message: sanitizeText(rawPayload.message, LIMITS.message, true),
    interests: rawPayload.interests,
    extra: sanitizeText(rawPayload.extra, LIMITS.extra, true),
  }
  let savedToDb = false
  let inquiryId: string | null = null

  // 1. Rate-limited, validated save (server side). Every dropdown and checkbox is checked again there.
  try {
    const { data, error } = await supabase.rpc('portfolio_submit_inquiry_v2', {
      p_first_name: payload.firstName,
      p_last_name: payload.lastName,
      p_email: payload.email,
      p_company: payload.company,
      p_website: payload.website,
      p_role: payload.role,
      p_company_size: payload.companySize,
      p_annual_revenue: payload.annualRevenue,
      p_project_budget: payload.projectBudget,
      p_message: payload.message,
      p_interests: payload.interests,
      p_extra: payload.extra,
      p_hp: '',
    })

    if (error) {
      console.warn('Inquiry save error:', error.message)
      const missing = error.code === 'PGRST202' || /could not find the function|does not exist/i.test(error.message)
      return {
        success: false,
        savedToDb: false,
        webhookDelivered: false,
        webhookError: missing
          ? 'The enquiry form is being updated. Please try again shortly, or email me directly.'
          : 'Your message could not be sent. Please try again.',
      }
    }
    if (data?.ok) {
      savedToDb = true
      inquiryId = data.id ?? null
      hooks?.onSaved?.()
      if (!inquiryId) return { success: true, savedToDb, webhookDelivered: false }
    } else if (data?.code === 'rate_limited') {
      return {
        success: false,
        savedToDb: false,
        webhookDelivered: false,
        retryAfter: Number(data.retry_after) || 60,
        webhookError: data.message,
      }
    } else {
      return { success: false, savedToDb: false, webhookDelivered: false, webhookError: data?.message || 'Your message could not be sent.' }
    }
  } catch (dbErr) {
    console.warn('Database save failed:', dbErr)
    return { success: false, savedToDb: false, webhookDelivered: false, webhookError: 'Something went wrong. Please try again.' }
  }

  // 2. Tell n8n (same-origin proxy: /api/n8n/* -> your n8n webhook)
  const bodyData = JSON.stringify({ inquiry_id: inquiryId, source: 'portfolio_contact_form' })

  let webhookDelivered = false
  let rejectedByWorkflow = false
  let lastWebhookError = ''

  try {
    const res = await fetch('/api/n8n/portfolio-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyData,
    })

    // The workflow replies with JSON: { success: boolean, message: string }
    const text = await res.text().catch(() => '')
    let reply: { success?: boolean; message?: string } | null = null
    try {
      reply = JSON.parse(text)
    } catch {
      /* older workflows reply with plain text */
    }
    const workflowAnswered = typeof reply?.success === 'boolean'

    if (res.ok && (!workflowAnswered || reply!.success)) {
      webhookDelivered = true
    } else {
      lastWebhookError = reply?.message || `HTTP ${res.status}`
      rejectedByWorkflow = workflowAnswered && !reply!.success && res.status === 400
    }
  } catch (err: any) {
    lastWebhookError = err?.message || String(err)
  }

  return {
    success: !rejectedByWorkflow && (savedToDb || webhookDelivered),
    savedToDb,
    webhookDelivered,
    webhookError: lastWebhookError,
  }
}

/**
 * Fetch inquiries for Studio dashboard
 */
export async function fetchInquiries(): Promise<PortfolioInquiry[]> {
  const { data, error } = await supabase
    .from('portfolio_inquiries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('Failed to fetch inquiries:', error.message)
    return []
  }

  return data || []
}


// ── Workflow errors (n8n failures reported into the Studio error dashboard) ──────────────────────────────

export type WorkflowErrorKind = 'CREDENTIALS' | 'EMAIL' | 'WORKFLOW'

export interface WorkflowError {
  id: string
  workflow_name: string
  node_name: string | null
  kind: WorkflowErrorKind
  message: string
  details: string | null
  execution_id: string | null
  execution_url: string | null
  occurrences: number
  first_seen_at: string
  last_seen_at: string
  resolved_at: string | null
}

/** Owner only (row level security). Returns the newest 200 errors, open and resolved. */
export async function fetchWorkflowErrors(): Promise<WorkflowError[]> {
  const { data, error } = await supabase
    .from('portfolio_workflow_errors')
    .select('*')
    .order('last_seen_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(error.message)
  return (data as WorkflowError[]) || []
}

/** Number of unresolved errors, for the tab badge. Returns null if it cannot be read. */
export async function countOpenWorkflowErrors(): Promise<number | null> {
  const { count, error } = await supabase
    .from('portfolio_workflow_errors')
    .select('id', { count: 'exact', head: true })
    .is('resolved_at', null)
  if (error) return null
  return count ?? 0
}

export async function setWorkflowErrorResolved(ids: string[], resolved: boolean): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase
    .from('portfolio_workflow_errors')
    .update({ resolved_at: resolved ? new Date().toISOString() : null })
    .in('id', ids)
  if (error) throw new Error(error.message)
}

export async function deleteWorkflowErrors(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase.from('portfolio_workflow_errors').delete().in('id', ids)
  if (error) throw new Error(error.message)
}

// ── Skills ────────────────────────────────────────────────────────────────────

/** Public read: every skill (the caller filters on `visible`), in display order. Never throws. */
export async function fetchSkills(): Promise<PortfolioSkill[]> {
  try {
    const { data, error } = await supabase
      .from('portfolio_skills')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.warn('Error fetching skills:', error.message)
      return []
    }
    return data || []
  } catch (err) {
    console.error('Network error fetching skills:', err)
    return []
  }
}

/** Studio read: every skill, including hidden ones. */
export async function fetchStudioSkills(): Promise<PortfolioSkill[]> {
  const { data, error } = await supabase
    .from('portfolio_skills')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export async function createSkill(
  form: SkillFormData,
  iconFile: File | null,
  sortOrder: number,
): Promise<void> {
  let icon: { storagePath: string; publicUrl: string } | null = null
  if (iconFile) icon = await uploadImageFile('skills', iconFile)

  const { error } = await supabase.from('portfolio_skills').insert([
    {
      name: form.name.trim(),
      visible: form.visible,
      sort_order: sortOrder,
      icon_url: icon?.publicUrl ?? null,
      storage_path: icon?.storagePath ?? null,
    },
  ])

  if (error) {
    if (icon) await deleteStorageFile(icon.storagePath)
    throw new Error(error.message)
  }
}

export async function updateSkill(
  existing: PortfolioSkill,
  form: SkillFormData,
  newIconFile: File | null,
  removeIcon: boolean,
): Promise<void> {
  let icon: { storagePath: string; publicUrl: string } | null = null
  if (newIconFile) icon = await uploadImageFile('skills', newIconFile)

  const patch: Record<string, unknown> = {
    name: form.name.trim(),
    visible: form.visible,
    updated_at: new Date().toISOString(),
  }
  if (icon) {
    patch.icon_url = icon.publicUrl
    patch.storage_path = icon.storagePath
  } else if (removeIcon) {
    patch.icon_url = null
    patch.storage_path = null
  }

  const { error } = await supabase.from('portfolio_skills').update(patch).eq('id', existing.id)
  if (error) {
    if (icon) await deleteStorageFile(icon.storagePath)
    throw new Error(error.message)
  }

  // Remove the replaced icon only after the row points at the new one
  if ((icon || removeIcon) && existing.storage_path) {
    await deleteStorageFile(existing.storage_path)
  }
}

export async function deleteSkill(skill: PortfolioSkill): Promise<void> {
  const { error } = await supabase.from('portfolio_skills').delete().eq('id', skill.id)
  if (error) throw new Error(error.message)
  if (skill.storage_path) await deleteStorageFile(skill.storage_path)
}

/** Swap the display order of two skills. */
export async function swapSkillOrder(a: PortfolioSkill, b: PortfolioSkill): Promise<void> {
  const now = new Date().toISOString()
  const [r1, r2] = await Promise.all([
    supabase.from('portfolio_skills').update({ sort_order: b.sort_order, updated_at: now }).eq('id', a.id),
    supabase.from('portfolio_skills').update({ sort_order: a.sort_order, updated_at: now }).eq('id', b.id),
  ])
  const err = r1.error || r2.error
  if (err) throw new Error(err.message)
}

// ── Case studies ──────────────────────────────────────────────────────────────

/** Sections of one project, in order. Never throws (returns [] if the table is missing). */
export async function fetchProjectSections(projectId: string): Promise<ProjectSection[]> {
  try {
    const { data, error } = await supabase
      .from('portfolio_project_sections')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })
    if (error) {
      console.warn('Error fetching project sections:', error.message)
      return []
    }
    return (data || []).map((s: any) => ({ ...s, images: Array.isArray(s.images) ? s.images : [] }))
  } catch (err) {
    console.error('Network error fetching sections:', err)
    return []
  }
}

/** Public case-study page data: a published project by slug plus its sections. */
export async function fetchPublishedProjectBySlug(
  slug: string,
): Promise<{ project: PortfolioProject; sections: ProjectSection[] } | null> {
  try {
    const { data, error } = await supabase
      .from('portfolio_projects')
      .select('*, images:portfolio_project_images(*)')
      .eq('slug', slug)
      .eq('status', 'PUBLISHED')
      .maybeSingle()

    if (error || !data) {
      if (error) console.warn('Error fetching project:', error.message)
      return null
    }
    const project: PortfolioProject = {
      ...data,
      images: (data.images || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    }
    const sections = await fetchProjectSections(project.id)
    return { project, sections }
  } catch (err) {
    console.error('Network error fetching project:', err)
    return null
  }
}

/**
 * Replace a project's sections with the given drafts. New images are uploaded first, rows are
 * upserted, then rows that were removed are deleted, so a failure never wipes existing content.
 */
export async function saveProjectSections(
  projectId: string,
  drafts: DraftSection[],
  previousImagePaths: string[],
): Promise<void> {
  const uploaded: string[] = []
  try {
    const rows = []
    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i]
      const images: SectionImage[] = []
      for (const img of d.images) {
        let url = img.previewUrl
        let path = img.storagePath || ''
        if (img.file) {
          const res = await uploadImageFile(projectId, img.file)
          url = res.publicUrl
          path = res.storagePath
          uploaded.push(path)
        }
        images.push({ url, storage_path: path, alt: img.alt.trim() || d.heading.trim() || '' })
      }
      rows.push({
        id: d.id,
        project_id: projectId,
        sort_order: i,
        heading: d.heading.trim() || null,
        subheading: d.subheading.trim() || null,
        body: d.body.trim() || null,
        images,
        updated_at: new Date().toISOString(),
      })
    }

    if (rows.length > 0) {
      const { error } = await supabase.from('portfolio_project_sections').upsert(rows)
      if (error) throw new Error(error.message)
    }

    let del = supabase.from('portfolio_project_sections').delete().eq('project_id', projectId)
    if (rows.length > 0) del = del.not('id', 'in', `(${rows.map((r) => r.id).join(',')})`)
    const { error: delError } = await del
    if (delError) throw new Error(delError.message)

    const kept = new Set(rows.flatMap((r) => r.images.map((im) => im.storage_path)))
    for (const p of previousImagePaths) {
      if (p && !kept.has(p)) await deleteStorageFile(p)
    }
  } catch (err: any) {
    for (const p of uploaded) await deleteStorageFile(p)
    throw new Error(
      `Case study sections could not be saved: ${err?.message || err}. ` +
        'Have you run supabase/migrations/002_project_case_studies.sql?',
    )
  }
}

// ── Editable site text ────────────────────────────────────────────────────────

/** All saved text overrides as { key: value }. Never throws (returns {} if the table is missing). */
export async function fetchSiteContent(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase.from('portfolio_site_content').select('key, value')
    if (error) {
      console.warn('Error fetching site content:', error.message)
      return {}
    }
    return Object.fromEntries((data || []).map((r: any) => [r.key, r.value ?? '']))
  } catch (err) {
    console.error('Network error fetching site content:', err)
    return {}
  }
}

/** Save text overrides. A value of null removes the override (back to the built-in default). */
export async function saveSiteContent(changes: Record<string, string | null>): Promise<void> {
  const upserts = Object.entries(changes)
    .filter(([, v]) => v !== null)
    .map(([key, value]) => ({ key, value: value as string, updated_at: new Date().toISOString() }))
  const deletes = Object.entries(changes)
    .filter(([, v]) => v === null)
    .map(([key]) => key)

  if (upserts.length > 0) {
    const { error } = await supabase.from('portfolio_site_content').upsert(upserts)
    if (error) throw new Error(error.message)
  }
  if (deletes.length > 0) {
    const { error } = await supabase.from('portfolio_site_content').delete().in('key', deletes)
    if (error) throw new Error(error.message)
  }
}
