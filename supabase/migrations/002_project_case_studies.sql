-- Case-study details for web projects (shown on /work/<slug>), editable from /studio.
-- Run once in the Supabase SQL editor, BEFORE filling the new fields in Studio.
-- Same owner check as 001_portfolio_skills.sql; adjust if your portfolio_projects policies differ.

alter table public.portfolio_projects
  add column if not exists year     text,
  add column if not exists role     text,
  add column if not exists platform text,
  add column if not exists tools    text[] not null default '{}';

create table if not exists public.portfolio_project_sections (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.portfolio_projects(id) on delete cascade,
  sort_order  integer not null default 0,
  heading     text,          -- small label, e.g. "Intro" (shown as "01: Intro")
  subheading  text,          -- bold statement under the label
  body        text,          -- paragraphs separated by a blank line
  images      jsonb not null default '[]'::jsonb,  -- [{url, storage_path, alt}]
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists portfolio_project_sections_project_idx
  on public.portfolio_project_sections (project_id, sort_order);

alter table public.portfolio_project_sections enable row level security;

drop policy if exists "Public can read sections of published projects" on public.portfolio_project_sections;
create policy "Public can read sections of published projects"
  on public.portfolio_project_sections for select
  using (exists (
    select 1 from public.portfolio_projects p
    where p.id = project_id and p.status = 'PUBLISHED'
  ));

drop policy if exists "Owner can manage sections" on public.portfolio_project_sections;
create policy "Owner can manage sections"
  on public.portfolio_project_sections for all
  to authenticated
  using (
    (auth.jwt() ->> 'email') = 'oluwaseyidavid406@gmail.com'
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
  )
  with check (
    (auth.jwt() ->> 'email') = 'oluwaseyidavid406@gmail.com'
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
  );
