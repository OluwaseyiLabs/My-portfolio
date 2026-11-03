/**
 * Image optimization and validation utilities for Oluwaseyi Portfolio CMS
 */

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
]

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

export interface ImageValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validates file type and size
 */
export function validateImageFile(file: File): ImageValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: "${file.type || 'unknown'}". Please upload PNG, JPEG, WebP, AVIF, or SVG.`,
    }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
    return {
      valid: false,
      error: `File is too large (${sizeMb} MB). Maximum allowed size is 20 MB.`,
    }
  }

  return { valid: true }
}

/**
 * Creates a browser object URL for immediate preview
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * Generates a clean URL slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
