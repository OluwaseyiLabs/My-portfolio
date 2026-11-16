-- Portfolio skills (icon tiles shown in the About section, managed from /studio).
-- Run once in the Supabase SQL editor.
--
-- The owner check below mirrors the client-side check in src/context/AuthContext.tsx
-- (owner email OR app_metadata.role = 'owner'). Before running, compare with your
-- existing policies:  select * from pg_policies where tablename = 'portfolio_projects';
-- and adjust the owner condition if yours differs.

create table if not exists public.portfolio_skills (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  icon_url     text,
  storage_path text,
  sort_order   integer not null default 0,
  visible      boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists portfolio_skills_sort_idx on public.portfolio_skills (sort_order);

alter table public.portfolio_skills enable row level security;

drop policy if exists "Public can read visible skills" on public.portfolio_skills;
create policy "Public can read visible skills"
  on public.portfolio_skills for select
  using (visible = true);

drop policy if exists "Owner can read all skills" on public.portfolio_skills;
create policy "Owner can read all skills"
  on public.portfolio_skills for select
  to authenticated
  using (
    (auth.jwt() ->> 'email') = 'oluwaseyidavid406@gmail.com'
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
  );

drop policy if exists "Owner can write skills" on public.portfolio_skills;
create policy "Owner can write skills"
  on public.portfolio_skills for all
  to authenticated
  using (
    (auth.jwt() ->> 'email') = 'oluwaseyidavid406@gmail.com'
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
  )
  with check (
    (auth.jwt() ->> 'email') = 'oluwaseyidavid406@gmail.com'
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
  );

-- Icons upload to the existing public 'portfolio-media' bucket under skills/.
-- If your storage policy limits owner uploads to specific folders, allow the 'skills/' prefix too.
