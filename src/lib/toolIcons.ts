import type { PortfolioSkill } from '../types/portfolio'

/**
 * Tool name -> icon. Type a tool in Studio ("n8n, Figma, Google Sheets") and its icon appears
 * automatically. Order of precedence: an icon uploaded in Studio > Skills, then this built-in
 * library (SVGs in /public/tools, brand icons from simple-icons, CC0), then nothing.
 */

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

// Brand icons available as /tools/<slug>.svg
const BRAND_SLUGS = [
  'n8n','figma','framer','canva','react','typescript','javascript','html5','css','tailwindcss','vite','supabase',
  'vercel','github','git','googlesheets','gmail','googledrive','googlecalendar','googledocs','googleforms','telegram',
  'whatsapp','notion','airtable','googlegemini','postgresql','stripe','zapier','make','hubspot','nextdotjs','nodedotjs',
  'webflow','wordpress','shopify','cloudflare','docker','python','postman','mailchimp','calendly','googleanalytics',
  'firebase','mongodb','mysql','redis','php','laravel','vuedotjs','svelte','astro','wix','squarespace','discord','zoom',
  'anthropic','perplexity','elevenlabs','resend','typeform','zoho','clickup','trello','asana','linear','jira','miro',
  'netlify','sanity','contentful','strapi','prisma','graphql','express','fastapi','django','flask','sentry','posthog',
  'googlemaps','googlechrome','huggingface','langchain','slack',
]

// Other spellings people type -> icon file
const ALIASES: Record<string, string> = {
  html: 'html5', css3: 'css', js: 'javascript', ts: 'typescript',
  tailwind: 'tailwindcss', next: 'nextdotjs', nextjs: 'nextdotjs', node: 'nodedotjs', nodejs: 'nodedotjs',
  vue: 'vuedotjs', vuejs: 'vuedotjs', reactjs: 'react', postgres: 'postgresql', supabasedb: 'supabase',
  sheets: 'googlesheets', googlesheet: 'googlesheets', gsheets: 'googlesheets', drive: 'googledrive',
  calendar: 'googlecalendar', googlecal: 'googlecalendar', docs: 'googledocs', forms: 'googleforms',
  gemini: 'googlegemini', googleai: 'googlegemini', chrome: 'googlechrome', maps: 'googlemaps',
  analytics: 'googleanalytics', ga4: 'googleanalytics', gh: 'github', mongo: 'mongodb',
  claude: 'claude-code', claudecode: 'claude-code', claudeai: 'claude-code', claudeopus: 'claude-code',
  eleven: 'elevenlabs', hf: 'huggingface', integromat: 'make', makecom: 'make',
  // generic concepts
  webhook: 'g-webhook', webhooks: 'g-webhook', respondtowebhook: 'g-webhook',
  scheduletrigger: 'g-schedule', schedule: 'g-schedule', cron: 'g-schedule', scheduler: 'g-schedule',
  email: 'g-email', emails: 'g-email', emailautomation: 'g-email', smtp: 'g-email',
  api: 'g-api', apiintegration: 'g-api', apiintegrations: 'g-api', rest: 'g-api', restapi: 'g-api', httprequest: 'g-api',
  errorhandling: 'g-error', errors: 'g-error', auditlogging: 'g-error',
  crm: 'g-crm', crms: 'g-crm', crmautomation: 'g-crm', leadmanagement: 'g-crm',
  ai: 'g-ai', aiagents: 'g-ai', aiagent: 'g-ai', agents: 'g-ai', llm: 'g-ai', gpt: 'g-ai', chatgpt: 'g-ai',
}

const BUILT_IN = new Set<string>([...BRAND_SLUGS, 'claude-code', 'g-crm', 'g-webhook', 'g-schedule', 'g-email', 'g-api', 'g-error', 'g-ai'])

function skillMatch(skills: PortfolioSkill[], key: string): PortfolioSkill | undefined {
  return skills.find((s) => {
    const n = norm(s.name)
    return n === key || (key.length >= 3 && n.length >= 3 && (n.startsWith(key) || key.startsWith(n)))
  })
}

/** Icon URL for a tool name, or null if there is none. */
export function resolveToolIcon(tool: string, skills: PortfolioSkill[] = []): string | null {
  const key = norm(tool)
  if (!key) return null

  const uploaded = skillMatch(skills, key)
  if (uploaded?.icon_url) return uploaded.icon_url

  const slug = ALIASES[key] ?? key
  return BUILT_IN.has(slug) ? `/tools/${slug}.svg` : null
}

/** Case-insensitive de-duplicated list of icon URLs for several tools. */
export function resolveToolIcons(tools: string[], skills: PortfolioSkill[] = []): string[] {
  const seen = new Set<string>()
  const urls: string[] = []
  for (const t of tools) {
    const url = resolveToolIcon(t, skills)
    if (url && !seen.has(url)) {
      seen.add(url)
      urls.push(url)
    }
  }
  return urls
}
