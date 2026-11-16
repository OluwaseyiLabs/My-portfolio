/**
 * All configuration comes from environment variables (.env locally, Vercel > Settings > Environment Variables
 * in production). Nothing sensitive is written in the source code.
 *
 * Note: anything named VITE_* is bundled into the public website. The Supabase URL and anon key are designed
 * to be public (your database rules protect the data), but never put a service-role key, password or private
 * API key in a VITE_ variable.
 */
export const env = {
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL || '').trim(),
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim(),
  ownerEmail: (import.meta.env.VITE_OWNER_EMAIL || '').trim().toLowerCase(),
}

export const missingEnv: string[] = [
  !env.supabaseUrl && 'VITE_SUPABASE_URL',
  !env.supabaseAnonKey && 'VITE_SUPABASE_ANON_KEY',
].filter(Boolean) as string[]

export const configIsValid = missingEnv.length === 0
