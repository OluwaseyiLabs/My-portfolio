import { useCallback, useEffect, useMemo, useState } from 'react'
import { CONTENT_GROUPS, DEFAULTS, type ContentField } from '../content/registry'
import { fetchSiteContent, saveSiteContent, uploadImageFile } from '../lib/supabase'
import { validateImageFile } from '../lib/imageOptimization'
import { useContent } from '../context/ContentContext'

const inputCls = 'w-full border border-line-strong focus:border-fg px-3 py-2 text-sm outline-none transition-colors bg-bg'

export default function SiteContentManager() {
  const { refresh } = useContent()
  const [saved, setSaved] = useState<Record<string, string>>({}) // overrides currently in the database
  const [values, setValues] = useState<Record<string, string>>({}) // what is in the form
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [search, setSearch] = useState('')
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchSiteContent()
    setSaved(data)
    setValues({ ...DEFAULTS, ...data })
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // What would be written: only fields that differ from the database state
  const changes = useMemo(() => {
    const out: Record<string, string | null> = {}
    for (const key of Object.keys(DEFAULTS)) {
      const current = values[key] ?? DEFAULTS[key]
      const hasOverride = key in saved
      if (current === DEFAULTS[key]) {
        if (hasOverride) out[key] = null // back to default: remove the override
      } else if (!hasOverride || saved[key] !== current) {
        out[key] = current
      }
    }
    return out
  }, [values, saved])

  const dirtyCount = Object.keys(changes).length

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)
      await saveSiteContent(changes)
      await load()
      await refresh()
      setMessage({ kind: 'ok', text: 'Saved. Your website now shows the new text.' })
    } catch (err: any) {
      setMessage({
        kind: 'error',
        text: `${err.message || 'Could not save.'} Have you run supabase/migrations/004_site_content.sql?`,
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePhoto = async (key: string, file: File | undefined) => {
    if (!file) return
    const check = validateImageFile(file)
    if (!check.valid) {
      setMessage({ kind: 'error', text: check.error || 'Unsupported image.' })
      return
    }
    try {
      setUploadingKey(key)
      setMessage(null)
      const { publicUrl } = await uploadImageFile('site', file)
      setValues((v) => ({ ...v, [key]: publicUrl }))
    } catch (err: any) {
      setMessage({ kind: 'error', text: err.message || 'Upload failed.' })
    } finally {
      setUploadingKey(null)
    }
  }

  const q = search.trim().toLowerCase()
  const matches = (fld: ContentField) =>
    !q ||
    fld.label.toLowerCase().includes(q) ||
    fld.key.toLowerCase().includes(q) ||
    (values[fld.key] ?? '').toLowerCase().includes(q)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-fg">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted mb-1">Site Content</p>
          <h2 className="text-2xl font-black tracking-tight">Edit the text on your website</h2>
          <p className="text-xs text-muted mt-1 max-w-xl leading-relaxed">
            Change any heading, paragraph, button or link. Projects, skills and videos have their own tabs.
            &ldquo;Reset&rdquo; puts a field back to its original text.
          </p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search text…"
          className="border border-line-strong focus:border-fg px-3 py-2 text-sm outline-none w-full sm:w-64"
          aria-label="Search site text"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted py-10 text-center">Loading…</p>
      ) : (
        <div className="space-y-4 pb-28">
          {CONTENT_GROUPS.map((group, gi) => {
            const fields = group.fields.filter(matches)
            if (fields.length === 0) return null
            const editedHere = group.fields.filter((fld) => (values[fld.key] ?? fld.default) !== fld.default).length
            return (
              <details key={group.id} open={gi === 0 || !!q} className="border border-line bg-bg group">
                <summary className="cursor-pointer select-none px-5 py-4 flex items-center justify-between gap-3 list-none">
                  <span>
                    <span className="block text-sm font-black uppercase tracking-wider">{group.title}</span>
                    {group.description && (
                      <span className="block text-[11px] text-muted mt-0.5 font-normal normal-case tracking-normal">
                        {group.description}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-3 flex-shrink-0 text-[11px] text-muted">
                    {editedHere > 0 && <span className="px-2 py-0.5 bg-fg text-bg font-bold">{editedHere} edited</span>}
                    <span aria-hidden="true" className="group-open:rotate-180 transition-transform">▾</span>
                  </span>
                </summary>

                <div className="px-5 pb-5 pt-1 grid gap-4 border-t border-line">
                  {fields.map((fld) => {
                    const value = values[fld.key] ?? fld.default
                    const edited = value !== fld.default
                    const id = `content-${fld.key}`
                    const multiline = fld.type === 'textarea' || fld.type === 'lines'
                    return (
                      <div key={fld.key} className="pt-3">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-wider text-fg">
                            {fld.label}
                            {edited && <span className="ml-2 text-[10px] text-muted normal-case tracking-normal">edited</span>}
                          </label>
                          {edited && (
                            <button
                              type="button"
                              onClick={() => setValues((v) => ({ ...v, [fld.key]: fld.default }))}
                              className="text-[11px] font-bold underline text-muted hover:text-fg"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                        {fld.type === 'image' ? (
                          <div className="flex items-center gap-4">
                            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface text-xs text-faint">
                              {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : 'None'}
                            </span>
                            <label className="cursor-pointer px-3 py-2 border border-fg text-xs font-bold hover:bg-fg hover:text-bg transition-colors">
                              {uploadingKey === fld.key ? 'Uploading…' : value ? 'Replace photo' : 'Upload photo'}
                              <input
                                id={id}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/avif"
                                className="sr-only"
                                onChange={(e) => {
                                  handlePhoto(fld.key, e.target.files?.[0])
                                  e.target.value = ''
                                }}
                              />
                            </label>
                            {value && (
                              <button
                                type="button"
                                onClick={() => setValues((v) => ({ ...v, [fld.key]: '' }))}
                                className="text-xs font-bold underline text-red-600 dark:text-red-400"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ) : multiline ? (
                          <textarea
                            id={id}
                            rows={fld.type === 'lines' ? 5 : 3}
                            value={value}
                            onChange={(e) => setValues((v) => ({ ...v, [fld.key]: e.target.value }))}
                            className={`${inputCls} resize-y`}
                          />
                        ) : (
                          <input
                            id={id}
                            type={fld.type === 'url' ? 'text' : 'text'}
                            value={value}
                            onChange={(e) => setValues((v) => ({ ...v, [fld.key]: e.target.value }))}
                            className={inputCls}
                          />
                        )}
                        {fld.hint && <p className="text-[11px] text-muted mt-1">{fld.hint}</p>}
                      </div>
                    )
                  })}
                </div>
              </details>
            )
          })}
        </div>
      )}

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-bg border-t border-line">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-3 flex flex-wrap items-center justify-between gap-3">
          <p
            role="status"
            className={`text-xs font-semibold ${message?.kind === 'error' ? 'text-red-700 dark:text-red-400' : 'text-muted'}`}
          >
            {message ? message.text : dirtyCount > 0 ? `${dirtyCount} unsaved ${dirtyCount === 1 ? 'change' : 'changes'}` : 'No unsaved changes'}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={dirtyCount === 0 || saving}
              onClick={() => {
                setValues({ ...DEFAULTS, ...saved })
                setMessage(null)
              }}
              className="px-4 py-2 border border-line-strong text-xs font-bold disabled:opacity-40"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={dirtyCount === 0 || saving}
              onClick={handleSave}
              className="px-5 py-2 bg-fg text-bg text-xs font-bold border border-fg hover:bg-bg hover:text-fg transition-colors disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
