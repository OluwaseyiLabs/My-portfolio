import type { PortfolioSkill } from '../types/portfolio'

/** Shown until skills exist in the database; also used to look up tool icons on case studies. */
export const fallbackSkills: PortfolioSkill[] = [
  { id: 'n8n', name: 'n8n', icon_url: '/tools/n8n.svg', storage_path: null, sort_order: 1, visible: true },
  { id: 'claude-code', name: 'Claude Code', icon_url: '/skills/claude-code.svg', storage_path: null, sort_order: 2, visible: true },
]
