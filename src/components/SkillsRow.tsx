import { useEffect, useRef, useState } from 'react'
import { fetchSkills } from '../lib/supabase'
import type { PortfolioSkill } from '../types/portfolio'
import { fallbackSkills } from '../lib/skillsFallback'
import { useContent } from '../context/ContentContext'

export default function SkillsRow() {
  const { t } = useContent()
  const [skills, setSkills] = useState<PortfolioSkill[]>(fallbackSkills)
  const listRef = useRef<HTMLUListElement>(null)
  const [bouncing, setBouncing] = useState(false)

  useEffect(() => {
    let mounted = true
    fetchSkills().then((data) => {
      // Once skills exist in Studio they replace the built-in defaults, even if all are switched off.
      if (mounted && data.length > 0) setSkills(data.filter((s) => s.visible))
    })
    return () => {
      mounted = false
    }
  }, [])

  // "See me": the skills bounce each time they scroll into view
  const hasSkills = skills.length > 0
  useEffect(() => {
    const el = listRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setBouncing(entry.isIntersecting), { threshold: 0.6 })
    io.observe(el)
    return () => io.disconnect()
  }, [hasSkills])

  if (skills.length === 0) return null

  return (
    <div>
      <h3 className="text-xl text-fg">{t('hero.skills')}</h3>
      <ul ref={listRef} className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-5">
        {skills.map((skill, i) => (
          <li
            key={skill.id}
            className={`group flex items-center gap-4 ${bouncing ? 'skill-bounce' : ''}`}
            style={{ animationDelay: `${i * 110}ms` }}
          >
            <span className="flex h-[58px] w-[58px] flex-shrink-0 items-center justify-center rounded-xl border border-line bg-surface transition-transform duration-200 group-hover:-translate-y-0.5">
              {skill.icon_url ? (
                <img
                  src={skill.icon_url}
                  alt=""
                  width={36}
                  height={36}
                  loading="lazy"
                  decoding="async"
                  className="h-9 w-9 rounded-md object-contain"
                  draggable={false}
                />
              ) : (
                <span className="text-lg font-semibold text-muted" aria-hidden="true">
                  {skill.name.charAt(0).toUpperCase()}
                </span>
              )}
            </span>
            <span className="text-xl text-muted transition-colors duration-200 group-hover:text-fg">
              {skill.name}
            </span>
          </li>
        ))}
        <li className="text-xl text-muted">{t('hero.skillsMore')}</li>
      </ul>
    </div>
  )
}
