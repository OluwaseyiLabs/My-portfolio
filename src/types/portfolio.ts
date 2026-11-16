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
  year?: string | null
  role?: string | null
  platform?: string | null
  tools?: string[] | null
  video_url?: string | null
  video_storage_path?: string | null
  video_is_cover?: boolean | null
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
  year?: string
  role?: string
  platform?: string
  tools?: string[]
  /** true when the DB already has the case-study columns (migration 002 applied) */
  detailsSupported?: boolean
  video_url?: string
  video_storage_path?: string
  video_is_cover?: boolean
  /** true when the DB already has the video columns (migration 003 applied) */
  videoSupported?: boolean
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


export interface PortfolioSkill {
  id: string
  name: string
  icon_url: string | null
  storage_path: string | null
  sort_order: number
  visible: boolean
  created_at?: string
  updated_at?: string
}

export interface SkillFormData {
  name: string
  visible: boolean
}

// ── Case study sections (public page /work/:slug) ─────────────────────────────
export interface SectionImage {
  url: string
  storage_path: string
  alt: string
}

export interface ProjectSection {
  id: string
  project_id: string
  sort_order: number
  heading: string | null
  subheading: string | null
  body: string | null
  images: SectionImage[]
}

export interface DraftSectionImage {
  id: string
  previewUrl: string
  storagePath?: string
  file?: File
  alt: string
}

export interface DraftSection {
  id: string
  heading: string
  subheading: string
  body: string
  images: DraftSectionImage[]
}
