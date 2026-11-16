# Security notes

## Secrets
- Real values live only in `.env` (local) and Vercel > Settings > Environment Variables. `.env` and `.env.*` are
  git-ignored (see `.gitignore`); `.env.example` lists the names with no values.
- Variables starting with `VITE_` are bundled into the public website. They may hold only public values
  (Supabase URL, anon key, owner login email). Never put a Supabase `service_role` key, n8n API key, Gmail
  credentials or any password in a `VITE_` variable or in the code.
- n8n credentials (Gmail, the Supabase `apikey` header) are stored inside n8n, not in the repo.

## Contact form
- Browser -> `portfolio_submit_inquiry()` (Supabase function): cleans the text, refuses prompt-injection wording,
  honeypot, and rate limits per visitor: >3 attempts/minute -> wait 1 min, then 5 min, 15 min, 1 hour (resets after
  24 quiet hours), plus a global ceiling of 60 attempts/hour.
- Browser -> n8n receives only the new inquiry id. n8n calls `portfolio_claim_inquiry()` to fetch the real data,
  once, within 15 minutes. Forged requests to the webhook find nothing to send.
- `portfolio_inquiries` is readable/editable by the owner only.

## Browser protections (vercel.json)
Content-Security-Policy (no inline scripts), X-Frame-Options, nosniff, HSTS, Referrer-Policy, Permissions-Policy.
Only `/api/n8n/portfolio-request` is proxied to n8n.

## Supabase settings to keep on (Dashboard)
1. Authentication > Providers > Email: turn OFF "Allow new users to sign up" (you are the only user) and keep
   "Confirm email" ON.
2. Authentication > Attack protection: enable CAPTCHA / leaked-password protection if available; consider MFA for the
   owner account.
3. Every table must have Row Level Security enabled. Audit anytime with:
   `select schemaname, tablename, rowsecurity from pg_tables where schemaname = 'public';`
   and review policies: `select tablename, policyname, cmd, roles, qual, with_check from pg_policies
   where schemaname in ('public','storage') order by 1,2;`
   Visitors (role `anon`) should only be able to: read published projects/images, skills, site content and
   sections; insert analytics events; call the two inquiry functions.
4. Storage: bucket `portfolio-media` may be public-read, but uploads/deletes must be limited to the owner.
5. Never expose the `service_role` key anywhere in the frontend.
