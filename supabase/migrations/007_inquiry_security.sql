-- Secure contact form: server-side validation, escalating rate limits, and a one-time "claim" for n8n.
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- What this does
--  1. Visitors can no longer write to portfolio_inquiries directly. They must call portfolio_submit_inquiry(),
--     which cleans the text, rejects prompt-injection wording, and rate limits by visitor:
--         more than 3 attempts in a minute  ->  blocked 1 minute, then 5 minutes, then 15 minutes, then 1 hour
--     (the ladder resets after 24 quiet hours). A global ceiling also stops bots that rotate addresses.
--  2. n8n does not receive the message from the browser. It receives only the new inquiry's id and "claims" the
--     real data from the database, once, within 15 minutes. So the webhook cannot be abused to send email to
--     arbitrary people.
--  3. Only the owner can read, update or delete inquiries.
--
-- Owner check: same as the other migrations (owner email, or app_metadata.role = 'owner').

create extension if not exists pgcrypto with schema extensions;

alter table public.portfolio_inquiries
  add column if not exists claimed_at timestamptz,
  add column if not exists ip_hash    text;

-- ── Rate limit state (no policies: only the functions below can touch it) ────────────────────────────────
create table if not exists public.portfolio_rate_limits (
  ip_hash         text primary key,
  window_start    timestamptz not null default now(),
  attempts        integer     not null default 0,
  strikes         integer     not null default 0,
  last_strike_at  timestamptz,
  blocked_until   timestamptz,
  updated_at      timestamptz not null default now()
);
alter table public.portfolio_rate_limits enable row level security;
revoke all on public.portfolio_rate_limits from anon, authenticated;

-- ── Lock the inquiries table down ───────────────────────────────────────────────────────────────────────
alter table public.portfolio_inquiries enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'portfolio_inquiries' loop
    execute format('drop policy %I on public.portfolio_inquiries', r.policyname);
  end loop;
end $$;

create policy "Owner can read inquiries"
  on public.portfolio_inquiries for select to authenticated
  using ((auth.jwt() ->> 'email') = 'oluwaseyidavid406@gmail.com' or (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

create policy "Owner can update inquiries"
  on public.portfolio_inquiries for update to authenticated
  using ((auth.jwt() ->> 'email') = 'oluwaseyidavid406@gmail.com' or (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
  with check ((auth.jwt() ->> 'email') = 'oluwaseyidavid406@gmail.com' or (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

create policy "Owner can delete inquiries"
  on public.portfolio_inquiries for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'oluwaseyidavid406@gmail.com' or (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

-- ── The one door visitors use ───────────────────────────────────────────────────────────────────────────
create or replace function public.portfolio_submit_inquiry(
  p_name    text,
  p_email   text,
  p_message text,
  p_website text default ''
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_headers  json;
  v_ip       text;
  v_hash     text;
  v_now      timestamptz := now();
  rl         public.portfolio_rate_limits%rowtype;
  g          public.portfolio_rate_limits%rowtype;
  v_ladder   int[] := array[60, 300, 900, 3600];     -- seconds: 1 min, 5 min, 15 min, 1 hour
  v_wait     int;
  v_name     text;
  v_email    text;
  v_msg      text;
  v_id       public.portfolio_inquiries.id%type;
  v_invisible constant text := '[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁠-⁤⁦-⁩﻿]';
  v_injection constant text :=
    '(ignore|disregard|forget|override|bypass)\s+(all\s+|any\s+|the\s+|your\s+|my\s+)?(previous|prior|above|earlier|preceding|system|safety)\s+(instructions?|prompts?|rules|messages?|guidelines)'
    '|(reveal|show|print|repeat|display|leak|output)\s+(me\s+)?(your|the)\s+(system|hidden|initial|original|secret)\s+(prompt|instructions?|message)'
    '|you\s+are\s+now\s+(a|an|in|the)\y'
    '|\y(jailbreak|developer\s+mode|dan\s+mode|do\s+anything\s+now)\y'
    '|new\s+(system\s+)?instructions?\s*:'
    '|<\s*/?\s*(system|assistant|instructions?)\s*>'
    '|\[\s*/?\s*(inst|system)\s*\]';
begin
  -- Who is calling? Cloudflare's header cannot be forged by the visitor; otherwise use the last forwarded address.
  begin
    v_headers := current_setting('request.headers', true)::json;
  exception when others then
    v_headers := '{}'::json;
  end;
  v_ip := nullif(trim(coalesce(v_headers->>'cf-connecting-ip', '')), '');
  if v_ip is null then
    v_ip := nullif(trim(regexp_replace(coalesce(v_headers->>'x-forwarded-for', ''), '^.*,\s*', '')), '');
  end if;
  if v_ip is null then v_ip := coalesce(v_headers->>'x-real-ip', 'unknown'); end if;
  v_hash := encode(extensions.digest(v_ip || ':portfolio-contact', 'sha256'), 'hex');

  -- 1) Global ceiling (stops attacks that rotate IP addresses): 60 attempts per hour across everyone
  insert into public.portfolio_rate_limits (ip_hash) values ('GLOBAL') on conflict (ip_hash) do nothing;
  select * into g from public.portfolio_rate_limits where ip_hash = 'GLOBAL' for update;
  if v_now - g.window_start > interval '1 hour' then g.window_start := v_now; g.attempts := 0; end if;
  g.attempts := g.attempts + 1;
  update public.portfolio_rate_limits set window_start = g.window_start, attempts = g.attempts, updated_at = v_now where ip_hash = 'GLOBAL';
  if g.attempts > 60 then
    return jsonb_build_object('ok', false, 'code', 'rate_limited', 'retry_after', 300,
      'message', 'The form is receiving a lot of traffic right now. Please try again in a few minutes.');
  end if;

  -- 2) Per-visitor limit with escalating waits
  insert into public.portfolio_rate_limits (ip_hash) values (v_hash) on conflict (ip_hash) do nothing;
  select * into rl from public.portfolio_rate_limits where ip_hash = v_hash for update;

  if rl.last_strike_at is not null and v_now - rl.last_strike_at > interval '24 hours' then rl.strikes := 0; end if;

  if rl.blocked_until is not null and rl.blocked_until > v_now then
    return jsonb_build_object('ok', false, 'code', 'rate_limited',
      'retry_after', ceil(extract(epoch from (rl.blocked_until - v_now)))::int,
      'message', 'Too many attempts. Please wait before trying again.');
  end if;

  if v_now - rl.window_start > interval '60 seconds' then rl.window_start := v_now; rl.attempts := 0; end if;
  rl.attempts := rl.attempts + 1;

  if rl.attempts > 3 then
    v_wait := v_ladder[least(rl.strikes + 1, array_length(v_ladder, 1))];
    update public.portfolio_rate_limits
       set strikes = rl.strikes + 1, last_strike_at = v_now, blocked_until = v_now + make_interval(secs => v_wait),
           attempts = 0, window_start = v_now, updated_at = v_now
     where ip_hash = v_hash;
    return jsonb_build_object('ok', false, 'code', 'rate_limited', 'retry_after', v_wait,
      'message', 'Too many attempts. Please wait before trying again.');
  end if;

  update public.portfolio_rate_limits
     set attempts = rl.attempts, window_start = rl.window_start, strikes = rl.strikes, updated_at = v_now
   where ip_hash = v_hash;

  -- 3) Honeypot: a hidden field that people never fill in. Pretend it worked, store nothing.
  if coalesce(p_website, '') <> '' then
    return jsonb_build_object('ok', true, 'id', null);
  end if;

  -- 4) Clean the text: strip hidden/control characters and tags, collapse whitespace, cap lengths
  v_name  := left(btrim(regexp_replace(regexp_replace(regexp_replace(coalesce(p_name, ''),  v_invisible, '', 'g'), '<[^>]*>', '', 'g'), '\s+', ' ', 'g')), 80);
  v_email := left(lower(btrim(regexp_replace(regexp_replace(coalesce(p_email, ''), v_invisible, '', 'g'), '<[^>]*>', '', 'g'))), 254);
  v_msg   := left(btrim(regexp_replace(regexp_replace(regexp_replace(regexp_replace(coalesce(p_message, ''), v_invisible, '', 'g'), '<[^>]*>', '', 'g'), '[ \t]+(\r?\n)', E'\n', 'g'), '(\r?\n){3,}', E'\n\n', 'g')), 2000);

  if length(v_name) < 1 or length(v_name) > 80 then
    return jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'Please enter your name.');
  end if;
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    return jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'Please enter a valid email address.');
  end if;
  if length(v_msg) < 5 then
    return jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'Please write a little more.');
  end if;
  if (v_name || ' ' || v_msg) ~* v_injection or (coalesce(p_name, '') || ' ' || coalesce(p_message, '')) ~* v_injection then
    return jsonb_build_object('ok', false, 'code', 'invalid',
      'message', 'Please rephrase your message. It contains wording that cannot be accepted.');
  end if;

  -- 5) Store it
  insert into public.portfolio_inquiries (name, email, message, webhook_sent, ip_hash, created_at)
  values (v_name, v_email, v_msg, false, v_hash, v_now)
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

revoke all on function public.portfolio_submit_inquiry(text, text, text, text) from public;
grant execute on function public.portfolio_submit_inquiry(text, text, text, text) to anon, authenticated;

-- ── The one door n8n uses (one-time, 15 minutes) ────────────────────────────────────────────────────────
create or replace function public.portfolio_claim_inquiry(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare r public.portfolio_inquiries%rowtype;
begin
  update public.portfolio_inquiries
     set claimed_at = now(), webhook_sent = true, webhook_response = 'received by n8n'
   where id::text = p_id and claimed_at is null and created_at > now() - interval '15 minutes'
  returning * into r;

  if not found then
    return jsonb_build_object('ok', false);
  end if;
  return jsonb_build_object('ok', true, 'name', r.name, 'email', r.email, 'message', r.message, 'created_at', r.created_at);
end;
$$;

revoke all on function public.portfolio_claim_inquiry(text) from public;
grant execute on function public.portfolio_claim_inquiry(text) to anon, authenticated;

-- ── Analytics: refuse junk event names ──────────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.portfolio_events') is not null then
    alter table public.portfolio_events drop constraint if exists portfolio_events_target_chars;
    alter table public.portfolio_events add constraint portfolio_events_target_chars
      check (target ~ '^[A-Za-z0-9:/_.\-]+$') not valid;
  end if;
end $$;
