import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchWorkflowErrors,
  setWorkflowErrorResolved,
  deleteWorkflowErrors,
  type WorkflowError,
  type WorkflowErrorKind,
} from '../lib/supabase'

interface Props {
  /** Called whenever the open-error count changes so the dashboard tab badge stays correct. */
  onOpenCountChange?: (count: number) => void
}

const KIND_LABEL: Record<WorkflowErrorKind, string> = {
  CREDENTIALS: 'Reconnect needed',
  EMAIL: 'Email failed',
  WORKFLOW: 'Workflow error',
}

const KIND_HINT: Record<WorkflowErrorKind, string> = {
  CREDENTIALS:
    'An account (for example Gmail) is disconnected or its access expired. In n8n open Credentials, choose the account and press Reconnect.',
  EMAIL: 'A message could not be sent. Check the Gmail connection and sending limits, then retry the enquiry.',
  WORKFLOW: 'A step in the workflow failed. Open the execution in n8n to see the exact step and data.',
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ErrorsPanel({ onOpenCountChange }: Props) {
  const [errors, setErrors] = useState<WorkflowError[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showResolved, setShowResolved] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  /** Two-step delete: the id (or 'ALL') waiting for a second click to confirm. */
  const [confirming, setConfirming] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError(null)
      const data = await fetchWorkflowErrors()
      setErrors(data)
      onOpenCountChange?.(data.filter((e) => !e.resolved_at).length)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setLoadError(
        /does not exist|schema cache/i.test(msg)
          ? 'The error log table is missing. Run supabase/migrations/008_workflow_errors.sql in the Supabase SQL editor.'
          : msg,
      )
    } finally {
      setLoading(false)
    }
  }, [onOpenCountChange])

  useEffect(() => {
    load()
  }, [load])

  const open = useMemo(() => errors.filter((e) => !e.resolved_at), [errors])
  const resolved = useMemo(() => errors.filter((e) => e.resolved_at), [errors])
  const visible = showResolved ? errors : open

  const act = async (fn: () => Promise<void>) => {
    try {
      setBusy(true)
      await fn()
      await load()
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-fg">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted mb-1">Monitoring</p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-fg">
            Workflow Errors ({open.length} open)
          </h1>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowResolved((v) => !v)}
            className="px-4 py-2 border border-line text-xs font-bold uppercase tracking-wider hover:border-fg transition-colors"
          >
            {showResolved ? 'Hide resolved' : `Show resolved (${resolved.length})`}
          </button>
          {open.length > 1 && (
            <button
              disabled={busy}
              onClick={() => act(() => setWorkflowErrorResolved(open.map((e) => e.id), true))}
              className="px-4 py-2 border border-fg text-xs font-bold uppercase tracking-wider hover:bg-fg hover:text-bg transition-colors disabled:opacity-50"
            >
              Resolve all
            </button>
          )}
          {visible.length > 0 &&
            (confirming === 'ALL' ? (
              <span className="inline-flex flex-wrap items-center gap-2 px-3 py-2 border border-red-600 text-xs font-bold text-red-600 dark:text-red-400">
                Delete {visible.length} {visible.length === 1 ? 'error' : 'errors'}?
                <button
                  disabled={busy}
                  onClick={() =>
                    act(async () => {
                      await deleteWorkflowErrors(visible.map((e) => e.id))
                      setConfirming(null)
                    })
                  }
                  className="px-2 py-0.5 bg-red-600 text-white uppercase tracking-wider hover:bg-red-700 disabled:opacity-50"
                >
                  Yes, delete
                </button>
                <button onClick={() => setConfirming(null)} className="uppercase tracking-wider hover:underline">
                  Cancel
                </button>
              </span>
            ) : (
              <button
                disabled={busy}
                onClick={() => setConfirming('ALL')}
                className="px-4 py-2 border border-line text-xs font-bold uppercase tracking-wider hover:border-red-600 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                {showResolved ? 'Delete all' : 'Delete all open'}
              </button>
            ))}
          <button
            onClick={load}
            disabled={loading}
            className="px-4 py-2 border border-fg text-xs font-bold uppercase tracking-wider hover:bg-fg hover:text-bg transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="mb-6 p-4 border border-fg text-xs font-bold text-fg">
          {loadError}
        </div>
      )}

      {loading && errors.length === 0 && !loadError ? (
        <div className="p-16 border border-line text-center text-xs font-bold text-muted">
          Loading errors from database...
        </div>
      ) : visible.length === 0 && !loadError ? (
        <div className="p-16 border border-dashed border-line-strong text-center">
          <p className="text-sm font-bold text-fg mb-1">No open errors</p>
          <p className="text-xs text-muted">
            Failed emails, disconnected accounts and other workflow errors from n8n will appear here.
          </p>
        </div>
      ) : (
        <ul className="border border-line divide-y divide-line bg-bg">
          {visible.map((e) => {
            const isOpen = expanded === e.id
            const isResolved = !!e.resolved_at
            return (
              <li key={e.id} className={isResolved ? 'opacity-60' : ''}>
                <div className="flex flex-col lg:flex-row lg:items-start gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          e.kind === 'CREDENTIALS' ? 'bg-fg text-bg' : 'border border-fg text-fg'
                        }`}
                      >
                        {KIND_LABEL[e.kind]}
                      </span>
                      {e.occurrences > 1 && (
                        <span className="text-[10px] font-bold text-muted">×{e.occurrences}</span>
                      )}
                      {isResolved && (
                        <span className="text-[10px] font-bold uppercase text-muted">
                          Resolved {formatWhen(e.resolved_at!)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-fg break-words">{e.message}</p>
                    <p className="text-xs text-muted mt-1">
                      {e.workflow_name}
                      {e.node_name ? ` · ${e.node_name}` : ''} · last seen {formatWhen(e.last_seen_at)}
                    </p>
                    {!isResolved && <p className="text-xs text-muted mt-2">{KIND_HINT[e.kind]}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 lg:shrink-0">
                    {(e.details || e.execution_id) && (
                      <button
                        onClick={() => setExpanded(isOpen ? null : e.id)}
                        className="px-3 py-2.5 sm:py-1.5 border border-line text-[10px] font-bold uppercase tracking-wider hover:border-fg transition-colors"
                      >
                        {isOpen ? 'Hide details' : 'Details'}
                      </button>
                    )}
                    {e.execution_url && (
                      <a
                        href={e.execution_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2.5 sm:py-1.5 border border-line text-[10px] font-bold uppercase tracking-wider hover:border-fg transition-colors"
                      >
                        Open in n8n ↗
                      </a>
                    )}
                    <button
                      disabled={busy}
                      onClick={() => act(() => setWorkflowErrorResolved([e.id], !isResolved))}
                      className="px-3 py-2.5 sm:py-1.5 border border-fg text-[10px] font-bold uppercase tracking-wider hover:bg-fg hover:text-bg transition-colors disabled:opacity-50"
                    >
                      {isResolved ? 'Reopen' : 'Mark resolved'}
                    </button>
                    {confirming === e.id ? (
                      <span className="inline-flex items-center gap-1">
                        <button
                          disabled={busy}
                          onClick={() =>
                            act(async () => {
                              await deleteWorkflowErrors([e.id])
                              setConfirming(null)
                            })
                          }
                          className="px-3 py-2.5 sm:py-1.5 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-red-700 disabled:opacity-50"
                        >
                          Confirm delete
                        </button>
                        <button
                          onClick={() => setConfirming(null)}
                          className="px-3 py-2.5 sm:py-1.5 border border-line text-[10px] font-bold uppercase tracking-wider hover:border-fg transition-colors"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        disabled={busy}
                        onClick={() => setConfirming(e.id)}
                        className="px-3 py-2.5 sm:py-1.5 border border-line text-[10px] font-bold uppercase tracking-wider hover:border-red-600 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4">
                    {e.execution_id && (
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                        Execution {e.execution_id} · first seen {formatWhen(e.first_seen_at)}
                      </p>
                    )}
                    {e.details && (
                      <pre className="text-[11px] leading-relaxed bg-surface border border-line p-3 overflow-x-auto whitespace-pre-wrap break-words">
                        {e.details}
                      </pre>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
