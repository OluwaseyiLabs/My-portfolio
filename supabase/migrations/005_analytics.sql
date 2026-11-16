-- Visit and click tracking, shown in /studio > Analytics (7 / 30 / 90 days).
-- Run once in the Supabase SQL editor. Nothing personal is stored: no IP address, no name, no email.
-- Each visit gets a random id kept only for that browser tab session (to count unique visitors).

create table if not exists public.portfolio_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  event_type  text not null check (event_type in ('page_view', 'click')),
  target      text not null check (char_length(target) <= 200),   -- e.g. '/', 'link:github', 'cta:lets-talk-header'
  path        text check (char_length(path) <= 300),
  referrer    text check (char_length(referrer) <= 200),          -- referring site's hostname only
  session_id  text check (char_length(session_id) <= 64),
  host        text check (char_length(host) <= 200)               -- lets Studio hide localhost test traffic
);

create index if not exists portfolio_events_created_idx on public.portfolio_events (created_at desc);

alter table public.portfolio_events enable row level security;

-- Anyone may record an event, but nobody can read the raw rows except the owner.
drop policy if exists "Anyone can record events" on public.portfolio_events;
create policy "Anyone can record events"
  on public.portfolio_events for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Owner can read events" on public.portfolio_events;
create policy "Owner can read events"
  on public.portfolio_events for select
  to authenticated
  using (
    (auth.jwt() ->> 'email') = 'oluwaseyidavid406@gmail.com'
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
  );

-- Daily totals for Studio. Runs with elevated rights but only returns rows to the owner.
create or replace function public.portfolio_event_summary(since timestamptz, include_local boolean default false)
returns table (event_type text, target text, referrer text, day date, hits bigint, visitors bigint)
language sql
stable
security definer
set search_path = public
as $$
  select e.event_type, e.target, e.referrer,
         (e.created_at at time zone 'utc')::date as day,
         count(*) as hits,
         count(distinct e.session_id) as visitors
  from public.portfolio_events e
  where e.created_at >= since
    and (include_local or coalesce(e.host, '') not in ('localhost', '127.0.0.1'))
    and (
      (auth.jwt() ->> 'email') = 'oluwaseyidavid406@gmail.com'
      or (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
    )
  group by 1, 2, 3, 4
$$;

revoke all on function public.portfolio_event_summary(timestamptz, boolean) from public;
grant execute on function public.portfolio_event_summary(timestamptz, boolean) to authenticated;
