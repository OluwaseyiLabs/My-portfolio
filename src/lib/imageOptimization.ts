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
 * Compresses an image file before upload using browser Canvas API.
 * Downscales images exceeding max dimensions and converts to optimized WebP.
 * Preserves SVGs and already tiny files (< 100KB) as-is.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 2048,
  maxHeight = 2048,
  quality = 0.85
): Promise<File> {
  if (typeof window === 'undefined') return file
  if (file.type === 'image/svg+xml' || file.size < 100 * 1024) {
    return file
  }

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img

      // Compute downscaled dimensions
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        } else {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, width)
      canvas.height = Math.max(1, height)
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        resolve(file)
        return
      }

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file)
            return
          }
          const compressedName = file.name.replace(/\.[^.]+$/, '.webp')
          const compressedFile = new File([blob], compressedName, {
            type: 'image/webp',
            lastModified: Date.now(),
          })
          resolve(compressedFile)
        },
        'image/webp',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }

    img.src = url
  })
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

