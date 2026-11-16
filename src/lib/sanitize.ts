/**
 * Input hygiene for the contact form. The message ends up in emails and spreadsheets, and may one day be
 * read by an AI assistant, so text is treated as untrusted data: invisible/control characters and markup are
 * stripped, lengths are capped, and wording that tries to give instructions to an AI is refused.
 */

export const LIMITS = { name: 80, email: 254, message: 2000 } as const

// control characters (except newline/tab), zero-width and bidi-override characters
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁠-⁤⁦-⁩﻿]/g
// HTML-looking tags such as <script>, </div>, <!-- ... -->
const TAGS = /<\/?[a-z!][^>]*>/gi

export function sanitizeText(input: unknown, maxLen: number, multiline = false): string {
  let s = String(input ?? '').normalize('NFKC').replace(INVISIBLE, '').replace(TAGS, '')
  s = multiline
    ? s.replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n')
    : s.replace(/\s+/g, ' ')
  return s.trim().slice(0, maxLen)
}

// Phrases whose purpose is to instruct an AI/system rather than contact a person.
const INJECTION_PATTERNS: RegExp[] = [
  /\b(ignore|disregard|forget|override|bypass)\s+(all\s+|any\s+|the\s+|your\s+|my\s+)?(previous|prior|above|earlier|preceding|system|safety)\s+(instructions?|prompts?|rules|messages?|guidelines)/i,
  /\b(reveal|show|print|repeat|display|leak|output)\s+(me\s+)?(your|the)\s+(system|hidden|initial|original|secret)\s+(prompt|instructions?|message)/i,
  /\byou\s+are\s+now\s+(a|an|in|the)\b/i,
  /\b(pretend|act)\s+(to\s+be|as)\s+(a|an|the)?\s*(system|admin|administrator|developer|root|dan)\b/i,
  /\b(jailbreak|developer\s+mode|dan\s+mode|do\s+anything\s+now)\b/i,
  /\bnew\s+(system\s+)?instructions?\s*:/i,
  /<\s*\/?\s*(system|assistant|instructions?)\s*>/i,
  /\[\s*\/?\s*(inst|system)\s*\]/i,
  /^\s*#{2,}\s*(system|instructions?)\b/im,
  /\b(system|assistant)\s*:\s*(you|ignore|from now)/i,
]

export function looksLikeInjection(text: string): boolean {
  const t = text.normalize('NFKC')
  return INJECTION_PATTERNS.some((re) => re.test(t))
}
