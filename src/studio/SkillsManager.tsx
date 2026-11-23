import { useCallback, useEffect, useState } from 'react'
import type { PortfolioSkill } from '../types/portfolio'
import { fetchStudioSkills, deleteSkill, swapSkillOrder, updateSkill } from '../lib/supabase'
import SkillEditorModal from './SkillEditorModal'

export default function SkillsManager({ onCountChange }: { onCountChange?: (n: number) => void }) {
  const [skills, setSkills] = useState<PortfolioSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<PortfolioSkill | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<PortfolioSkill | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchStudioSkills()
      setSkills(data)
      onCountChange?.(data.length)
    } catch (err: any) {
      setError(err.message || 'Failed to load skills. Has the portfolio_skills table been created?')
    } finally {
      setLoading(false)
    }
  }, [onCountChange])

  useEffect(() => {
    load()
  }, [load])

  const nextSortOrder = skills.reduce((max, s) => Math.max(max, s.sort_order), 0) + 1

  const move = async (index: number, dir: -1 | 1) => {
    const other = skills[index + dir]
    if (!other) return
    try {
      setBusy(true)
      await swapSkillOrder(skills[index], other)
      await load()
    } catch (err: any) {
      alert(`Reorder failed: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  const toggleVisible = async (skill: PortfolioSkill) => {
    try {
      setBusy(true)
      await updateSkill(skill, { name: skill.name, visible: !skill.visible }, null, false)
      await load()
    } catch (err: any) {
      alert(`Update failed: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      setBusy(true)
      await deleteSkill(deleting)
      setDeleting(null)
      await load()
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-fg">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted mb-1">Skills</p>
          <h2 className="text-2xl font-black tracking-tight">Tools shown on your website</h2>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 bg-fg text-bg text-xs font-bold border border-fg hover:bg-bg hover:text-fg transition-colors"
        >
          + Add Skill
        </button>
      </div>

      {error ? (
        <div className="border border-red-600 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm p-4">
          {error}
          <button onClick={load} className="ml-3 font-bold underline">
            Retry
          </button>
        </div>
      ) : loading ? (
        <p className="text-sm text-muted py-10 text-center">Loading skills…</p>
      ) : skills.length === 0 ? (
        <div className="border border-dashed border-line-strong p-10 text-center text-sm text-muted">
          No skills yet. The public site shows its built-in defaults until you add your first one here.
        </div>
      ) : (
        <div className="border border-line overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Icon</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Show on website</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill, i) => (
                <tr key={skill.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface">
                      {skill.icon_url ? (
                        <img src={skill.icon_url} alt="" className="h-6 w-6 object-contain" />
                      ) : (
                        <span className="text-xs text-faint">{skill.name.charAt(0).toUpperCase()}</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{skill.name}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={skill.visible}
                      aria-label={`Show ${skill.name} on the website`}
                      onClick={() => toggleVisible(skill)}
                      disabled={busy}
                      className="inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      <span
                        className={`relative inline-block h-6 w-11 rounded-full border transition-colors duration-200 ${
                          skill.visible ? 'bg-fg border-fg' : 'bg-line border-line-strong'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-bg shadow transition-transform duration-200 ${
                            skill.visible ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted w-10 text-left">
                        {skill.visible ? 'On' : 'Off'}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => move(i, -1)}
                        disabled={busy || i === 0}
                        aria-label={`Move ${skill.name} up`}
                        className="w-7 h-7 border border-line-strong disabled:opacity-30 hover:border-fg"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={busy || i === skills.length - 1}
                        aria-label={`Move ${skill.name} down`}
                        className="w-7 h-7 border border-line-strong disabled:opacity-30 hover:border-fg"
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3 text-xs font-bold">
                      <button onClick={() => setEditing(skill)} className="underline">
                        Edit
                      </button>
                      <button onClick={() => setDeleting(skill)} className="text-red-600 dark:text-red-400 underline">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && (
        <SkillEditorModal
          initialSkill={editing}
          nextSortOrder={nextSortOrder}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSaved={() => {
            setCreating(false)
            setEditing(null)
            load()
          }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-[160] bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-bg border-2 border-fg max-w-sm w-full p-6 text-fg shadow-2xl">
            <h3 className="text-base font-black uppercase tracking-wider mb-2">Delete skill</h3>
            <p className="text-xs text-muted mb-6 leading-relaxed">
              Delete “{deleting.name}” and its uploaded icon? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleting(null)} className="px-4 py-2 border border-line-strong text-xs font-bold">
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={busy}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
