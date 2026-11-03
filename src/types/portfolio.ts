export type ProjectCategory = 'AI_AUTOMATION' | 'WEB_DEVELOPMENT'

export type ProjectStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface ProjectImage {
  id: string
  project_id: string
  storage_path: string
  public_url: string
  alt_text: string
  caption?: string | null
  sort_order: number
  is_primary: boolean
  created_at?: string
}

export interface PortfolioProject {
  id: string
  title: string
  slug: string
  category: ProjectCategory
  core_challenge?: string | null
  solution_delivered?: string | null
  short_description?: string | null
  project_url?: string | null
  technologies: string[]
  status: ProjectStatus
  featured: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
  published_at?: string | null
  images?: ProjectImage[]
}

export interface ProjectFormData {
  title: string
  slug: string
  category: ProjectCategory
  core_challenge: string
  solution_delivered: string
  short_description: string
  project_url: string
  technologies: string[]
  status: ProjectStatus
  featured: boolean
  sort_order: number
}

export interface PendingImage {
  id: string
  file?: File
  previewUrl: string
  storagePath?: string
  altText: string
  caption: string
  isPrimary: boolean
  sortOrder: number
  isExisting?: boolean
}
