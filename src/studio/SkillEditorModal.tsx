import { useEffect, useState } from 'react'
import type { PortfolioSkill } from '../types/portfolio'
import { createSkill, updateSkill } from '../lib/supabase'
import { validateImageFile, createPreviewUrl } from '../lib/imageOptimization'

interface Props {
  initialSkill: PortfolioSkill | null
  nextSortOrder: number
  onClose: () => void
  onSaved: () => void
}

export default function SkillEditorModal({ initialSkill, nextSortOrder, onClose, onSaved }: Props) {
  const isEditing = !!initialSkill
  const [name, setName] = useState(initialSkill?.name ?? '')
  const [visible, setVisible] = useState(initialSkill?.visible ?? true)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialSkill?.icon_url ?? null)
  const [removeIcon, setRemoveIcon] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Escape closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, submitting])

  // Revoke object URLs we created
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const pickFile = (f: File | undefined) => {
    if (!f) return
    const check = validateImageFile(f)
    if (!check.valid) {
      setError(check.error || 'Unsupported file.')
      return
    }
    setError(null)
    setFile(f)
    setRemoveIcon(false)
    setPreviewUrl(createPreviewUrl(f))
  }

  const clearIcon = () => {
    setFile(null)
    setPreviewUrl(null)
    setRemoveIcon(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Skill name is required.')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      if (initialSkill) {
        await updateSkill(initialSkill, { name, visible }, file, removeIcon)
      } else {
        await createSkill({ name, visible }, file, nextSortOrder)
      }
      onSaved()
    } catch (err: any) {
      setError(err.message || 'Could not save skill.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'Edit skill' : 'Add skill'}
    >
      <div className="bg-white text-black border-2 border-black w-full max-w-md shadow-2xl">
        <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider">
            {isEditing ? 'Edit Skill' : 'Add Skill'}
          </h3>
          <button onClick={onClose} disabled={submitting} className="text-xs font-bold text-[#555555] hover:text-black">
            Close
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {error && (
            <div role="alert" className="border border-red-600 bg-red-50 text-red-700 text-xs px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="skill-name" className="block text-xs font-bold uppercase tracking-wider mb-1.5">
              Name
            </label>
            <input
              id="skill-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Figma"
              className="w-full border border-[#CCCCCC] px-3 py-2 text-sm focus:outline-none focus:border-black"
              autoFocus
            />
          </div>

          <div>
            <span className="block text-xs font-bold uppercase tracking-wider mb-1.5">Icon</span>
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragActive(false)
                pickFile(e.dataTransfer.files?.[0])
              }}
              className={`flex items-center gap-4 border border-dashed p-4 ${
                dragActive ? 'border-black bg-[#F5F5F5]' : 'border-[#CCCCCC]'
              }`}
            >
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-[#E5E5E5] bg-[#F5F5F5]">
                {previewUrl ? (
                  <img src={previewUrl} alt="" className="h-9 w-9 object-contain" />
                ) : (
                  <span className="text-xs text-[#888888]">None</span>
                )}
              </span>
              <div className="text-xs text-[#555555] space-y-2">
                <p>Drop a square logo here (PNG, SVG, WebP) or</p>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-3 py-1.5 border border-black font-bold text-black hover:bg-black hover:text-white transition-colors">
                    Choose file
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="sr-only"
                      onChange={(e) => {
                        pickFile(e.target.files?.[0])
                        e.target.value = ''
                      }}
                    />
                  </label>
                  {previewUrl && (
                    <button type="button" onClick={clearIcon} className="font-bold underline">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            Show on public website
          </label>
        </div>

        <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-end gap-3">
          <button onClick={onClose} disabled={submitting} className="px-4 py-2 border border-[#CCCCCC] text-xs font-bold">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={submitting}
            className="px-4 py-2 bg-black text-white text-xs font-bold border border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Skill'}
          </button>
        </div>
      </div>
    </div>
  )
}
