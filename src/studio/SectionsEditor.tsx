import type { DraftSection, DraftSectionImage } from '../types/portfolio'
import { validateImageFile, createPreviewUrl } from '../lib/imageOptimization'

interface Props {
  sections: DraftSection[]
  onChange: (next: DraftSection[]) => void
  onError: (message: string) => void
}

const inputCls = 'w-full border border-line-strong focus:border-fg px-3 py-2 text-sm outline-none transition-colors'

export default function SectionsEditor({ sections, onChange, onError }: Props) {
  const update = (index: number, patch: Partial<DraftSection>) =>
    onChange(sections.map((s, i) => (i === index ? { ...s, ...patch } : s)))

  const add = () =>
    onChange([
      ...sections,
      { id: crypto.randomUUID(), heading: '', subheading: '', body: '', images: [] },
    ])

  const remove = (index: number) => onChange(sections.filter((_, i) => i !== index))

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= sections.length) return
    const next = [...sections]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const addImages = (index: number, files: FileList | null) => {
    if (!files || files.length === 0) return
    const added: DraftSectionImage[] = []
    for (const file of Array.from(files)) {
      const check = validateImageFile(file)
      if (!check.valid) {
        onError(check.error || `Unsupported file: ${file.name}`)
        continue
      }
      added.push({ id: crypto.randomUUID(), previewUrl: createPreviewUrl(file), file, alt: '' })
    }
    if (added.length) update(index, { images: [...sections[index].images, ...added] })
  }

  const updateImageAlt = (si: number, ii: number, alt: string) =>
    update(si, { images: sections[si].images.map((im, i) => (i === ii ? { ...im, alt } : im)) })

  const removeImage = (si: number, ii: number) =>
    update(si, { images: sections[si].images.filter((_, i) => i !== ii) })

  return (
    <div className="pt-2 border-t border-line">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-fg">Case Study Sections</p>
          <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
            Shown on the project page after you click &ldquo;View Project&rdquo;. Each section has a heading, a
            subheading, body text and optional images. Leave a blank line between paragraphs.
          </p>
        </div>
        <span className="text-xs text-muted font-mono whitespace-nowrap">
          {sections.length} {sections.length === 1 ? 'section' : 'sections'}
        </span>
      </div>

      <div className="space-y-4">
        {sections.map((section, si) => (
          <div key={section.id} className="border border-line bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-fg">
                {String(si + 1).padStart(2, '0')}
                {section.heading.trim() ? `: ${section.heading.trim()}` : ''}
              </span>
              <div className="flex items-center gap-1.5">
                <button type="button" disabled={si === 0} onClick={() => move(si, -1)} aria-label="Move section up"
                  className="w-7 h-7 border border-line-strong hover:border-fg text-xs disabled:opacity-30">↑</button>
                <button type="button" disabled={si === sections.length - 1} onClick={() => move(si, 1)} aria-label="Move section down"
                  className="w-7 h-7 border border-line-strong hover:border-fg text-xs disabled:opacity-30">↓</button>
                <button type="button" onClick={() => remove(si)} aria-label="Delete section"
                  className="w-7 h-7 border border-red-300 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold">✕</button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-fg mb-1">Heading</label>
              <input className={inputCls} value={section.heading} placeholder="e.g. Intro, My role, The problem"
                onChange={(e) => update(si, { heading: e.target.value })} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-fg mb-1">Subheading</label>
              <input className={inputCls} value={section.subheading} placeholder="The bold one-line statement for this section"
                onChange={(e) => update(si, { subheading: e.target.value })} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-fg mb-1">Body</label>
              <textarea rows={5} className={`${inputCls} resize-y`} value={section.body}
                placeholder={'First paragraph.\n\nSecond paragraph (blank line between paragraphs).'}
                onChange={(e) => update(si, { body: e.target.value })} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-fg">Images (optional)</span>
                <label className="cursor-pointer px-2.5 py-1 border border-fg text-[11px] font-bold hover:bg-fg hover:text-bg transition-colors">
                  + Add images
                  <input type="file" multiple className="sr-only"
                    accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
                    onChange={(e) => { addImages(si, e.target.files); e.target.value = '' }} />
                </label>
              </div>
              {section.images.length > 0 && (
                <div className="space-y-2">
                  {section.images.map((img, ii) => (
                    <div key={img.id} className="flex items-center gap-3 p-2 border border-line bg-bg">
                      <img src={img.previewUrl} alt="" className="w-20 h-14 object-cover border border-line flex-shrink-0" />
                      <input className="flex-1 border border-line focus:border-fg px-2.5 py-1 text-xs outline-none"
                        value={img.alt} placeholder="Alt text / caption for accessibility"
                        onChange={(e) => updateImageAlt(si, ii, e.target.value)} />
                      <button type="button" onClick={() => removeImage(si, ii)} aria-label="Remove image"
                        className="w-7 h-7 border border-red-300 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={add}
        className="mt-4 px-4 py-2 border border-fg text-fg text-xs font-bold uppercase tracking-wider hover:bg-fg hover:text-bg transition-colors">
        + Add Section
      </button>
    </div>
  )
}
