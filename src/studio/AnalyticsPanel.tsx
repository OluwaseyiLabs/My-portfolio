import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchEventSummary, type EventSummaryRow } from '../lib/analytics'
import { fetchInquiries, type PortfolioInquiry } from '../lib/supabase'

const RANGES = [7, 30, 90] as const

const LINK_LABELS: Record<string, string> = {
  'link:github': 'GitHub',
  'link:linkedin': 'LinkedIn',
  'link:tiktok': 'TikTok',
  'link:email': 'Email',
}
const CTA_LABELS: Record<string, string> = {
  'cta:see-my-work': 'See My Work (hero)',
  'cta:lets-talk-hero': "Let's Talk (hero)",
  'cta:lets-talk-header': "Let's Talk (header)",
  'cta:lets-talk-mobile': "Let's Talk (mobile menu)",
}

type Ranked = { name: string; hits: number; visitors: number }

const dayKey = (d: Date) => d.toISOString().slice(0, 10)

function groupSum(rows: EventSummaryRow[], keyOf: (r: EventSummaryRow) => string | null): Ranked[] {
  const map = new Map<string, { hits: number; visitors: number }>()
  for (const r of rows) {
    const k = keyOf(r)
    if (!k) continue
    const cur = map.get(k) || { hits: 0, visitors: 0 }
    cur.hits += r.hits
    cur.visitors += r.visitors
    map.set(k, cur)
  }
  return [...map.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.hits - a.hits)
}

/** Round a maximum up to a tidy axis top with 5 even steps (e.g. 37 -> 40, 640 -> 800). */
function niceAxis(max: number) {
  const target = Math.max(5, max)
  const rough = target / 5
  const pow = Math.pow(10, Math.floor(Math.log10(rough)))
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= rough) || rough
  return { step, top: step * 5 }
}

// ── Small building blocks ────────────────────────────────────────────────────
const card = 'bg-white rounded-xl border border-[#EDEDED] shadow-[0_1px_2px_rgba(0,0,0,0.04)]'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}
const ICONS = {
  visits: <Icon><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Icon>,
  people: <Icon><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.4c1.9.8 3 2.6 3 5.6" /></Icon>,
  pages: <Icon><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></Icon>,
  link: <Icon><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></Icon>,
  click: <Icon><path d="M9 9l11 4-5 2-2 5z" /><path d="M5 5l2 2M3 10h3M10 3v3" /></Icon>,
  mail: <Icon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 7l8.5 6 8.5-6" /></Icon>,
}

function StatCard({ icon, label, value, note }: { icon: ReactNode; label: string; value: string | number; note?: string }) {
  return (
    <div className={`${card} p-5 flex items-center gap-4`}>
      <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#F1F1F1] text-black">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm text-[#666666] truncate">{label}</p>
        <p className="mt-0.5 text-xl font-black tabular-nums leading-tight">{value}</p>
        {note && <p className="mt-0.5 text-[11px] text-[#888888] truncate">{note}</p>}
      </div>
    </div>
  )
}

// ── Grouped bar chart (solid = visits, hatched = link clicks) ────────────────
interface Bucket { label: string; visits: number; clicks: number }

function BarChart({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(...buckets.flatMap((b) => [b.visits, b.clicks]), 0)
  const { step, top } = niceAxis(max)
  const ticks = Array.from({ length: 6 }, (_, i) => i * step).reverse()
  const pct = (v: number) => `${(v / top) * 100}%`

  return (
    <div className="mt-4" role="img" aria-label="Bar chart comparing visits and link clicks over time">
      <div className="flex">
        {/* y axis */}
        <div className="relative w-10 flex-shrink-0 h-64 text-[11px] text-[#777777] tabular-nums">
          {ticks.map((t) => (
            <span key={t} className="absolute right-2 -translate-y-1/2" style={{ top: `${100 - (t / top) * 100}%` }}>
              {t}
            </span>
          ))}
        </div>
        {/* plot */}
        <div className="relative flex-1 h-64">
          {ticks.map((t) => (
            <div key={t} className="absolute left-0 right-0 border-t border-[#EDEDED]" style={{ top: `${100 - (t / top) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end justify-around px-2">
            {buckets.map((b) => (
              <div key={b.label} className="flex items-end gap-1 sm:gap-1.5 h-full">
                {[
                  { v: b.visits, hatched: false, name: 'Visits' },
                  { v: b.clicks, hatched: true, name: 'Link clicks' },
                ].map((bar) => (
                  <div key={bar.name} className="relative flex flex-col justify-end h-full w-4 sm:w-7" title={`${b.label}: ${bar.v} ${bar.name.toLowerCase()}`}>
                    <span className="absolute left-1/2 -translate-x-1/2 text-[11px] font-bold tabular-nums" style={{ bottom: `calc(${pct(bar.v)} + 4px)` }}>
                      {bar.v}
                    </span>
                    <div
                      className="w-full border border-black"
                      style={{
                        height: pct(bar.v),
                        minHeight: bar.v > 0 ? 2 : 0,
                        background: bar.hatched
                          ? 'repeating-linear-gradient(45deg, rgba(0,0,0,0.55) 0 1px, transparent 1px 5px)'
                          : '#000',
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex pl-10">
        <div className="flex-1 flex justify-around px-2">
          {buckets.map((b) => (
            <span key={b.label} className="text-[11px] sm:text-xs text-[#666666] text-center whitespace-nowrap">
              {b.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main panel ───────────────────────────────────────────────────────────────
type TopTab = 'links' | 'buttons' | 'projects' | 'sources'

export default function AnalyticsPanel({ onOpenInquiries }: { onOpenInquiries: () => void }) {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30)
  const [includeLocal, setIncludeLocal] = useState(false)
  const [rows, setRows] = useState<EventSummaryRow[]>([])
  const [inquiries, setInquiries] = useState<PortfolioInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TopTab>('links')
  const [showAll, setShowAll] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [events, inq] = await Promise.all([fetchEventSummary(days, includeLocal), fetchInquiries()])
      setRows(events)
      setInquiries(inq)
    } catch (err: any) {
      setError(`${err.message || 'Could not load analytics.'} Have you run supabase/migrations/005_analytics.sql?`)
    } finally {
      setLoading(false)
    }
  }, [days, includeLocal])

  useEffect(() => {
    load()
  }, [load])

  const data = useMemo(() => {
    const views = rows.filter((r) => r.event_type === 'page_view')
    const clicks = rows.filter((r) => r.event_type === 'click')
    const home = views.filter((r) => r.target === '/')
    const linkClicks = clicks.filter((r) => r.target.startsWith('link:'))
    const buttonClicks = clicks.filter((r) => r.target.startsWith('cta:'))
    const sum = (list: EventSummaryRow[], f: 'hits' | 'visitors') => list.reduce((n, r) => n + r[f], 0)

    // per-day series -> buckets (daily for 7 days, otherwise 6 even buckets)
    const perDay = (list: EventSummaryRow[]) => {
      const m = new Map<string, number>()
      for (const r of list) m.set(r.day, (m.get(r.day) || 0) + r.hits)
      return m
    }
    const visitsByDay = perDay(home)
    const clicksByDay = perDay(linkClicks)
    const dayList = Array.from({ length: days }, (_, i) => new Date(Date.now() - (days - 1 - i) * 86400000))
    const bucketCount = days === 7 ? 7 : 6
    const size = days / bucketCount
    const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    const buckets: Bucket[] = Array.from({ length: bucketCount }, (_, b) => {
      const slice = dayList.slice(Math.round(b * size), Math.round((b + 1) * size))
      const first = slice[0]
      const last = slice[slice.length - 1]
      return {
        label: size === 1 ? first.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }) : `${fmt(first)} – ${fmt(last)}`,
        visits: slice.reduce((n, d) => n + (visitsByDay.get(dayKey(d)) || 0), 0),
        clicks: slice.reduce((n, d) => n + (clicksByDay.get(dayKey(d)) || 0), 0),
      }
    })

    const since = Date.now() - days * 86400000
    const inRange = inquiries.filter((q) => new Date(q.created_at).getTime() >= since)

    return {
      homeViews: sum(home, 'hits'),
      visitors: sum(home, 'visitors'),
      pageViews: sum(views, 'hits'),
      linkClicks: sum(linkClicks, 'hits'),
      buttonClicks: sum(buttonClicks, 'hits'),
      buckets,
      top: {
        links: groupSum(linkClicks, (r) => LINK_LABELS[r.target] ?? r.target.replace('link:', '')),
        buttons: groupSum(buttonClicks, (r) => CTA_LABELS[r.target] ?? r.target),
        projects: groupSum(views.filter((r) => r.target.startsWith('/work/')), (r) => r.target.replace('/work/', '')),
        sources: groupSum(views, (r) => r.referrer),
      } as Record<TopTab, Ranked[]>,
      liveVisits: groupSum(clicks.filter((r) => r.target.startsWith('project-visit:')), (r) => r.target.replace('project-visit:', '')),
      messages: inRange.length,
      delivered: inRange.filter((q) => q.webhook_sent).length,
    }
  }, [rows, inquiries, days])

  const failed = data.messages - data.delivered
  const topRows = data.top[tab]
  const shown = showAll ? topRows : topRows.slice(0, 5)
  const unit = tab === 'projects' || tab === 'sources' ? 'views' : 'clicks'
  const TABS: { id: TopTab; label: string }[] = [
    { id: 'links', label: 'Links' },
    { id: 'buttons', label: 'Buttons' },
    { id: 'projects', label: 'Projects' },
    { id: 'sources', label: 'Sources' },
  ]

  return (
    <div className="-mx-6 lg:-mx-12 px-6 lg:px-12 py-6 bg-[#F6F6F6]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-black tracking-tight">Analytics</h2>
          <p className="text-xs text-[#666666] mt-0.5">
            Anonymous counts only. Your own browser is not counted once you have opened Studio in it.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[#555555] cursor-pointer select-none">
            <input type="checkbox" checked={includeLocal} onChange={(e) => setIncludeLocal(e.target.checked)} className="accent-black" />
            Include localhost test traffic
          </label>
          <div className="inline-flex rounded-lg border border-[#DDDDDD] bg-white overflow-hidden" role="group" aria-label="Time range">
            {RANGES.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                aria-pressed={days === d}
                className={`px-4 py-2 text-xs font-semibold transition-colors ${
                  days === d ? 'bg-black text-white' : 'text-[#555555] hover:text-black'
                }`}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <div className={`${card} border-red-300 bg-red-50 text-red-700 text-sm p-4`}>
          {error}
          <button onClick={load} className="ml-3 font-bold underline">Retry</button>
        </div>
      ) : loading ? (
        <p className="text-sm text-[#555555] py-16 text-center">Loading analytics…</p>
      ) : (
        <div className="space-y-5">
          {/* Stat cards + ranked list */}
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-5">
              <StatCard icon={ICONS.visits} label={`Visits, last ${days} days`} value={`${data.homeViews} Visits`} />
              <StatCard icon={ICONS.people} label="Visitors" value={`${data.visitors} Visitors`} note="counted once per day" />
              <StatCard icon={ICONS.pages} label="Page views" value={`${data.pageViews} Views`} note="home + project pages" />
              <StatCard icon={ICONS.link} label="Link clicks" value={`${data.linkClicks} Clicks`} note="GitHub, LinkedIn, TikTok, email…" />
              <StatCard icon={ICONS.click} label="Button clicks" value={`${data.buttonClicks} Clicks`} note="See My Work, Let's Talk" />
              <StatCard
                icon={ICONS.mail}
                label="Messages sent"
                value={`${data.messages} Messages`}
                note={`${data.delivered} reached n8n${failed > 0 ? `, ${failed} did not` : ''}`}
              />
            </div>

            <div className={`${card} p-5`}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black">Top {TABS.find((t) => t.id === tab)?.label}</h3>
                {topRows.length > 5 && (
                  <button onClick={() => setShowAll((v) => !v)} className="text-sm font-semibold underline underline-offset-2">
                    {showAll ? 'Show less' : 'See All'}
                  </button>
                )}
              </div>
              <div className="mt-3 flex gap-1 flex-wrap" role="tablist" aria-label="What to rank">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => {
                      setTab(t.id)
                      setShowAll(false)
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                      tab === t.id ? 'bg-black text-white border-black' : 'border-[#DDDDDD] text-[#555555] hover:border-black'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {shown.length === 0 ? (
                <p className="mt-6 text-sm text-[#777777]">Nothing recorded for this yet.</p>
              ) : (
                <ol className="mt-3">
                  {shown.map((r, i) => (
                    <li key={r.name} className="flex items-center justify-between gap-3 py-3 border-b border-[#E5E5E5] last:border-b-0 text-sm">
                      <span className="min-w-0 truncate">
                        <span className="text-[#777777] mr-2 tabular-nums">{i + 1}.</span>
                        {r.name}
                      </span>
                      <span className="font-bold tabular-nums whitespace-nowrap">
                        {r.hits} <span className="font-normal text-[#777777]">{unit}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          {/* Chart */}
          <div className={`${card} p-5 sm:p-6`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black leading-snug">Visits and link clicks</h3>
                <p className="text-sm text-[#666666]">
                  {days === 7 ? 'Day by day' : `In ${data.buckets.length} periods`}, last {days} days
                </p>
              </div>
              <div className="flex items-center gap-5 text-sm">
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 bg-black border border-black" aria-hidden="true" /> Visits
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-4 w-4 border border-black"
                    style={{ background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.55) 0 1px, transparent 1px 4px)' }}
                    aria-hidden="true"
                  />{' '}
                  Link clicks
                </span>
              </div>
            </div>
            <BarChart buckets={data.buckets} />
          </div>

          {/* Bottom cards */}
          <div className="grid md:grid-cols-3 gap-5">
            <div className={`${card} p-5`}>
              <h3 className="text-base font-black">Live websites visited</h3>
              <p className="text-xs text-[#777777]">Clicks on “Visit live website” from a project</p>
              {data.liveVisits.length === 0 ? (
                <p className="mt-4 text-sm text-[#777777]">No clicks yet.</p>
              ) : (
                <ol className="mt-3">
                  {data.liveVisits.slice(0, 5).map((r, i) => (
                    <li key={r.name} className="flex justify-between gap-3 py-2.5 border-b border-[#E5E5E5] last:border-b-0 text-sm">
                      <span className="truncate"><span className="text-[#777777] mr-2">{i + 1}.</span>{r.name}</span>
                      <span className="font-bold tabular-nums">{r.hits}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className={`${card} p-5 md:col-span-2`}>
              <h3 className="text-base font-black">Contact form to n8n</h3>
              <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-black tabular-nums">{data.messages}</p>
                  <p className="text-xs text-[#777777] mt-1">Messages in {days} days</p>
                </div>
                <div>
                  <p className="text-3xl font-black tabular-nums">{data.delivered}</p>
                  <p className="text-xs text-[#777777] mt-1">Reached your n8n workflow</p>
                </div>
                <div>
                  <p className="text-3xl font-black tabular-nums">{failed}</p>
                  <p className="text-xs text-[#777777] mt-1">Not delivered (saved safely)</p>
                </div>
              </div>
              <button onClick={onOpenInquiries} className="mt-4 text-sm font-semibold underline underline-offset-2">
                Open the messages →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
