-- Editable website text (logo name, headings, paragraphs, buttons, links...), managed from /studio > Site Content.
-- Run once in the Supabase SQL editor. The site keeps working without it (it falls back to built-in text).
-- Same owner check as the other migrations; adjust if your portfolio_projects policies differ.

create table if not exists public.portfolio_site_content (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.portfolio_site_content enable row level security;

drop policy if exists "Public can read site content" on public.portfolio_site_content;
create policy "Public can read site content"
  on public.portfolio_site_content for select
  using (true);

drop policy if exists "Owner can manage site content" on public.portfolio_site_content;
create policy "Owner can manage site content"
  on public.portfolio_site_content for all
  to authenticated
  using (
    (auth.jwt() ->> 'email') = 'oluwaseyidavid406@gmail.com'
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
  )
  with check (
    (auth.jwt() ->> 'email') = 'oluwaseyidavid406@gmail.com'
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
  );
