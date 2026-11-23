-- Error dashboard: n8n workflow failures (Gmail disconnected, failed emails, any node error) shown in Studio.
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- How it works
--  1. n8n reports a failure by calling portfolio_log_workflow_error() with a private ingest key.
--     Without the right key the call is refused, so strangers cannot fill your dashboard with fake errors.
--  2. The function cleans the text, works out the kind of problem (CREDENTIALS / EMAIL / WORKFLOW),
--     and merges repeats of the same unresolved error into one row with a counter.
--  3. Only the owner can read, resolve or delete rows (same owner check as the other migrations).
--
-- AFTER running this file, set your private ingest key ONCE (pick a long random string, e.g. from a password
-- manager) and paste the same value into the n8n "Error reporter" workflow (see n8n/error-reporter.json):
--
--   insert into public.portfolio_private_settings (key, value)
--   values ('error_ingest_key', 'PASTE-A-LONG-RANDOM-STRING-HERE')
--   on conflict (key) do update set value = excluded.value;
--
-- Never commit the key to git.

-- ── Private settings (no policies: only security-definer functions can read it) ────────────────────────────
create table if not exists public.portfolio_private_settings (
  key   text primary key,
  value text not null
);
alter table public.portfolio_private_settings enable row level security;
revoke all on public.portfolio_private_settings from anon, authenticated;

-- ── The errors table ───────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.portfolio_workflow_errors (
  id             uuid primary key default gen_random_uuid(),
  workflow_name  text        not null,
  node_name      text,
  kind           text        not null default 'WORKFLOW' check (kind in ('CREDENTIALS', 'EMAIL', 'WORKFLOW')),
  message        text        not null,
  details        text,
  execution_id   text,
  execution_url  text,
  occurrences    integer     not null default 1,
  first_seen_at  timestamptz not null default now(),
  last_seen_at   timestamptz not null default now(),
  resolved_at    timestamptz
);

create index if not exists portfolio_workflow_errors_open_idx
  on public.portfolio_workflow_errors (last_seen_at desc) where resolved_at is null;

alter table public.portfolio_workflow_errors enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'portfolio_workflow_errors' loop
    execute format('drop policy %I on public.portfolio_workflow_errors', r.policyname);
  end loop;
end $$;

create policy "Owner can read workflow errors"
  on public.portfolio_workflow_errors for select to authenticated
  using ((auth.jwt() ->> 'email') = 'oluwaseyidavid406@gmail.com' or (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

create policy "Owner can update workflow errors"
  on public.portfolio_workflow_errors for update to authenticated
  using ((auth.jwt() ->> 'email') = 'oluwaseyidavid406@gmail.com' or (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
  with check ((auth.jwt() ->> 'email') = 'oluwaseyidavid406@gmail.com' or (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

create policy "Owner can delete workflow errors"
  on public.portfolio_workflow_errors for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'oluwaseyidavid406@gmail.com' or (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

-- ── The one door n8n uses ──────────────────────────────────────────────────────────────────────────────────
create or replace function public.portfolio_log_workflow_error(
  p_key           text,
  p_workflow      text,
  p_node          text default null,
  p_message       text default '',
  p_details       text default null,
  p_execution_id  text default null,
  p_execution_url text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected text;
  v_workflow text;
  v_node     text;
  v_msg      text;
  v_details  text;
  v_url      text;
  v_kind     text;
  v_hay      text;
  v_id       uuid;
begin
  select value into v_expected from public.portfolio_private_settings where key = 'error_ingest_key';
  if v_expected is null or length(v_expected) < 16 or p_key is distinct from v_expected then
    return jsonb_build_object('ok', false);
  end if;

  v_workflow := left(btrim(regexp_replace(coalesce(p_workflow, ''), '<[^>]*>', '', 'g')), 120);
  v_node     := nullif(left(btrim(regexp_replace(coalesce(p_node, ''), '<[^>]*>', '', 'g')), 120), '');
  v_msg      := left(btrim(regexp_replace(coalesce(p_message, ''), '<[^>]*>', '', 'g')), 600);
  v_details  := nullif(left(btrim(regexp_replace(coalesce(p_details, ''), '<[^>]*>', '', 'g')), 4000), '');
  v_url      := case when coalesce(p_execution_url, '') ~* '^https?://' then left(p_execution_url, 500) else null end;
  if v_workflow = '' then v_workflow := 'Unknown workflow'; end if;
  if v_msg = '' then v_msg := 'Unknown error'; end if;

  -- Work out what kind of problem this is so the dashboard can say what to do.
  v_hay := lower(v_msg || ' ' || coalesce(v_details, ''));
  if v_hay ~ '(invalid_grant|unauthori[sz]ed|401|403|token (has been )?(expired|revoked)|refresh token|re-?authori[sz]e|re-?connect|credentials? (are |is )?(not|invalid|missing)|insufficient (authentication|permission)|access_denied|oauth)' then
    v_kind := 'CREDENTIALS';
  elsif v_hay ~ '(gmail|smtp|mail|recipient|invalid to header|mailbox|quota|rate limit exceeded|send)' or lower(coalesce(v_node, '')) ~ '(gmail|mail|email)' then
    v_kind := 'EMAIL';
  else
    v_kind := 'WORKFLOW';
  end if;

  -- Merge a repeat of the same open error from the last 24 hours instead of adding a new row.
  select id into v_id from public.portfolio_workflow_errors
   where resolved_at is null and workflow_name = v_workflow
     and node_name is not distinct from v_node and kind = v_kind and message = v_msg
     and last_seen_at > now() - interval '24 hours'
   order by last_seen_at desc limit 1;

  if v_id is not null then
    update public.portfolio_workflow_errors
       set occurrences = occurrences + 1, last_seen_at = now(),
           execution_id = coalesce(nullif(left(p_execution_id, 80), ''), execution_id),
           execution_url = coalesce(v_url, execution_url)
     where id = v_id;
  else
    insert into public.portfolio_workflow_errors (workflow_name, node_name, kind, message, details, execution_id, execution_url)
    values (v_workflow, v_node, v_kind, v_msg, v_details, nullif(left(p_execution_id, 80), ''), v_url)
    returning id into v_id;
  end if;

  -- Housekeeping: drop resolved errors older than 90 days.
  delete from public.portfolio_workflow_errors where resolved_at is not null and resolved_at < now() - interval '90 days';

  return jsonb_build_object('ok', true, 'id', v_id, 'kind', v_kind);
end;
$$;

revoke all on function public.portfolio_log_workflow_error(text, text, text, text, text, text, text) from public;
grant execute on function public.portfolio_log_workflow_error(text, text, text, text, text, text, text) to anon, authenticated;
