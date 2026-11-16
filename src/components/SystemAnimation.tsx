/** Builds the outline of a gear: `teeth` teeth between an inner and an outer radius. */
function gearPath(cx: number, cy: number, outer: number, inner: number, teeth: number, hole: number) {
  const step = (Math.PI * 2) / teeth
  const pt = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`
  const parts: string[] = []
  for (let i = 0; i < teeth; i++) {
    const a = i * step
    parts.push(
      `${i === 0 ? 'M' : 'L'}${pt(inner, a)}`,
      `L${pt(outer, a + step * 0.14)}`,
      `L${pt(outer, a + step * 0.36)}`,
      `L${pt(inner, a + step * 0.5)}`,
    )
  }
  parts.push('Z')
  // centre hole (evenodd)
  parts.push(`M${cx + hole} ${cy}a${hole} ${hole} 0 1 0 ${-hole * 2} 0a${hole} ${hole} 0 1 0 ${hole * 2} 0Z`)
  return parts.join(' ')
}

const BIG_GEAR = gearPath(24, 34, 22, 17, 8, 6)
const SMALL_GEAR = gearPath(56, 17, 14, 10.5, 6, 4)

// Windows of the business building: [x, y]
const WINDOWS: [number, number][] = [
  [18, 150], [32, 150], [46, 150],
  [18, 162], [32, 162], [46, 162],
  [18, 174], [46, 174],
]

/**
 * A system at work, read top to bottom: gears turn, a signal runs down the arrow to the business,
 * the business lights up and the system switches off. Height is set by the caller.
 */
export default function SystemAnimation({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 200" aria-hidden="true" focusable="false" className={`sys-anim overflow-visible ${className}`}>
      {/* the system: two meshing gears */}
      <path className="sys-gear sys-gear-a" d={BIG_GEAR} fill="currentColor" fillRule="evenodd" />
      <path className="sys-gear sys-gear-b" d={SMALL_GEAR} fill="currentColor" fillRule="evenodd" />

      {/* arrow from the system down to the business */}
      <g stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path className="sys-line" d="M36 66V122" />
        <path className="sys-head" d="M28 115l8 8 8-8" />
      </g>
      <circle className="sys-dot" cx="36" cy="66" r="3.2" fill="currentColor" />

      {/* the business */}
      <g className="sys-building">
        <path
          d="M12 196V142a2 2 0 0 1 2-2h44a2 2 0 0 1 2 2v54M6 196h60"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {WINDOWS.map(([x, y], i) => (
          <rect key={i} className="sys-win" style={{ animationDelay: `${i * 0.09}s` }} x={x} y={y} width="8" height="8" rx="1.5" fill="currentColor" />
        ))}
        <rect className="sys-door" x="30" y="180" width="12" height="16" rx="1.5" fill="currentColor" />
      </g>
    </svg>
  )
}
