import { createClient } from '@supabase/supabase-js'
import type { PortfolioProject, ProjectCategory, ProjectStatus, ProjectFormData, PendingImage } from '../types/portfolio'
import { compressImageFile } from './imageOptimization'

const DEFAULT_SUPABASE_URL = 'https://ppxxsvftvaospmhvpvzx.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBweHhzdmZ0dmFvc3BtaHZwdnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3MTUxMjcsImV4cCI6MjEwOTI5MTEyN30.W2-a06TFeyNrlp2uou2KIOmhhoUv3GT2yCu0UkmjSv8'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export const BUCKET_NAME = 'portfolio-media'

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
      },
    ])
    .select()
    .single()

  if (projectError) {
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
  }

  if (formData.status === 'PUBLISHED') {
    updatePayload.published_at = new Date().toISOString()
  }

  const { error: updateError } = await supabase
    .from('portfolio_projects')
    .update(updatePayload)
    .eq('id', projectId)

  if (updateError) {
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

  // 2. Delete project from DB (cascade deletes images rows)
  const { error } = await supabase
    .from('portfolio_projects')
    .delete()
    .eq('id', projectId)

  if (error) {
    throw new Error(error.message)
  }

  // 3. Delete files from storage
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
  name: string
  email: string
  message: string
}

export interface InquiryResult {
  success: boolean
  savedToDb: boolean
  webhookDelivered: boolean
  webhookError?: string
}

export interface PortfolioInquiry {
  id: string
  name: string
  email: string
  message: string
  status: string
  webhook_sent: boolean
  webhook_response?: string
  created_at: string
}

/**
 * Submit contact inquiry:
 * 1. Persists safely to Supabase database so submissions are never lost
 * 2. Attempts n8n webhook delivery (proxies + direct URLs)
 * 3. Returns delivery status
 */
export async function submitInquiry(payload: InquiryPayload): Promise<InquiryResult> {
  const submittedAt = new Date().toISOString()
  let savedToDb = false
  let inquiryId: string | null = null

  // 1. Persist to Supabase
  try {
    const { data, error } = await supabase
      .from('portfolio_inquiries')
      .insert([
        {
          name: payload.name.trim(),
          email: payload.email.trim(),
          message: payload.message.trim(),
          webhook_sent: false,
          created_at: submittedAt,
        },
      ])
      .select('id')
      .single()

    if (!error && data) {
      savedToDb = true
      inquiryId = data.id
    } else if (error) {
      console.warn('Database inquiry insert error:', error.message)
    }
  } catch (dbErr) {
    console.warn('Database save skipped:', dbErr)
  }

  // 2. Deliver to n8n Production Webhook
  const productionWebhook =
    import.meta.env.VITE_N8N_WEBHOOK_URL ||
    'https://ucy00zep.rpcld.net/webhook/portfolio-request'

  const candidateEndpoints = [
    '/api/n8n/portfolio-request',
    productionWebhook,
  ].filter(Boolean) as string[]

  let webhookDelivered = false
  let lastWebhookError = ''

  const bodyData = JSON.stringify({
    name: payload.name.trim(),
    email: payload.email.trim(),
    message: payload.message.trim(),
    submittedAt,
    source: 'portfolio_contact_form',
  })

  for (const url of candidateEndpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyData,
      })

      if (res.ok) {
        webhookDelivered = true
        break
      } else {
        const text = await res.text().catch(() => '')
        lastWebhookError = `HTTP ${res.status}: ${text}`
      }
    } catch (err: any) {
      lastWebhookError = err?.message || String(err)
    }
  }

  // 3. Update DB record with delivery status
  if (inquiryId) {
    try {
      await supabase
        .from('portfolio_inquiries')
        .update({
          webhook_sent: webhookDelivered,
          webhook_response: webhookDelivered ? 'OK' : lastWebhookError.slice(0, 500),
        })
        .eq('id', inquiryId)
    } catch {
      // non-critical
    }
  }

  return {
    success: savedToDb || webhookDelivered,
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


