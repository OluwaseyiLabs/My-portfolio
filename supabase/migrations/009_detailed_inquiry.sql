-- Detailed enquiry form: company, role, size, revenue, budget, interests and extra notes.
-- Run once in the Supabase SQL editor. Safe to run again.
--
--  * New columns on portfolio_inquiries (existing rows keep working; the new columns are simply empty).
--  * New function portfolio_submit_inquiry_v2(): same protections as before (rate limits, cleaning, prompt-injection
--    check, honeypot) plus strict allow-lists for every dropdown and checkbox, so nothing unexpected can be stored.
--  * portfolio_claim_inquiry() now also hands n8n the new fields. Old workflows keep working (they ignore them).
--  * The previous portfolio_submit_inquiry() is left in place so the live website keeps working until the new
--    site is deployed. Once the new site is live you can drop it:
--        drop function public.portfolio_submit_inquiry(text, text, text, text);

alter table public.portfolio_inquiries
  add column if not exists first_name     text,
  add column if not exists last_name      text,
  add column if not exists company        text,
  add column if not exists website        text,
  add column if not exists role           text,
  add column if not exists company_size   text,
  add column if not exists annual_revenue text,
  add column if not exists project_budget text,
  add column if not exists interests      text[],
  add column if not exists extra_info     text;

-- ── Shared rate-limit gate (same rules as before) ────────────────────────────────────────────────────────
-- Returns {"ok": true, "hash": "..."} when the visitor may continue, otherwise the refusal to send back.
create or replace function public.portfolio_rate_gate()
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_headers json;
  v_ip      text;
  v_hash    text;
  v_now     timestamptz := now();
  rl        public.portfolio_rate_limits%rowtype;
  g         public.portfolio_rate_limits%rowtype;
  v_ladder  int[] := array[60, 300, 900, 3600];   -- seconds: 1 min, 5 min, 15 min, 1 hour
  v_wait    int;
begin
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

  -- Global ceiling: 60 attempts per hour across everyone
  insert into public.portfolio_rate_limits (ip_hash) values ('GLOBAL') on conflict (ip_hash) do nothing;
  select * into g from public.portfolio_rate_limits where ip_hash = 'GLOBAL' for update;
  if v_now - g.window_start > interval '1 hour' then g.window_start := v_now; g.attempts := 0; end if;
  g.attempts := g.attempts + 1;
  update public.portfolio_rate_limits set window_start = g.window_start, attempts = g.attempts, updated_at = v_now where ip_hash = 'GLOBAL';
  if g.attempts > 60 then
    return jsonb_build_object('ok', false, 'code', 'rate_limited', 'retry_after', 300,
      'message', 'The form is receiving a lot of traffic right now. Please try again in a few minutes.');
  end if;

  -- Per visitor, with escalating waits
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

  return jsonb_build_object('ok', true, 'hash', v_hash);
end;
$$;
revoke all on function public.portfolio_rate_gate() from public;

-- ── The new door visitors use ─────────────────────────────────────────────────────────────────────────────
create or replace function public.portfolio_submit_inquiry_v2(
  p_first_name     text,
  p_last_name      text,
  p_email          text,
  p_company        text,
  p_website        text,
  p_role           text,
  p_company_size   text,
  p_annual_revenue text,
  p_project_budget text,
  p_message        text,
  p_interests      text[],
  p_extra          text default '',
  p_hp             text default ''
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  gate        jsonb;
  v_hash      text;
  v_first     text;
  v_last      text;
  v_email     text;
  v_company   text;
  v_site      text;
  v_msg       text;
  v_extra     text;
  v_interests text[];
  v_id        public.portfolio_inquiries.id%type;
  v_roles     constant text[] := array['Owner','Executive','Manager','Operations','Technical','Sales','Marketing','Finance','Other'];
  v_sizes     constant text[] := array['Solo or freelancer','2 to 10 employees','11 to 50 employees','51 to 200 employees','200+ employees'];
  v_revenues  constant text[] := array['Less than $100K','$100K-$500K','$500K-$1M','$1M-$2M','More than $2M'];
  v_budgets   constant text[] := array['Less than $10K','$10K-$50K','$50K-$100K','More than $100K'];
  v_topics    constant text[] := array['Website design or development','Lead generation or sales','Customer support','Internal operations','Data processing or reporting','Content or marketing workflows','Not sure yet'];
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
  -- 1) Rate limits
  gate := public.portfolio_rate_gate();
  if not (gate->>'ok')::boolean then return gate; end if;
  v_hash := gate->>'hash';

  -- 2) Honeypot: pretend it worked, store nothing
  if coalesce(p_hp, '') <> '' then
    return jsonb_build_object('ok', true, 'id', null);
  end if;

  -- 3) Clean the text: strip hidden/control characters and tags, collapse whitespace, cap lengths
  v_first   := left(btrim(regexp_replace(regexp_replace(regexp_replace(coalesce(p_first_name, ''), v_invisible, '', 'g'), '<[^>]*>', '', 'g'), '\s+', ' ', 'g')), 40);
  v_last    := left(btrim(regexp_replace(regexp_replace(regexp_replace(coalesce(p_last_name, ''),  v_invisible, '', 'g'), '<[^>]*>', '', 'g'), '\s+', ' ', 'g')), 40);
  v_company := left(btrim(regexp_replace(regexp_replace(regexp_replace(coalesce(p_company, ''),    v_invisible, '', 'g'), '<[^>]*>', '', 'g'), '\s+', ' ', 'g')), 120);
  v_site    := left(btrim(regexp_replace(regexp_replace(coalesce(p_website, ''), v_invisible, '', 'g'), '\s+', '', 'g')), 200);
  v_email   := left(lower(btrim(regexp_replace(regexp_replace(coalesce(p_email, ''), v_invisible, '', 'g'), '<[^>]*>', '', 'g'))), 254);
  v_msg     := left(btrim(regexp_replace(regexp_replace(regexp_replace(regexp_replace(coalesce(p_message, ''), v_invisible, '', 'g'), '<[^>]*>', '', 'g'), '[ \t]+(\r?\n)', E'\n', 'g'), '(\r?\n){3,}', E'\n\n', 'g')), 2000);
  v_extra   := left(btrim(regexp_replace(regexp_replace(regexp_replace(regexp_replace(coalesce(p_extra, ''), v_invisible, '', 'g'), '<[^>]*>', '', 'g'), '[ \t]+(\r?\n)', E'\n', 'g'), '(\r?\n){3,}', E'\n\n', 'g')), 2000);

  -- 4) Validate
  if length(v_first) < 1 then return jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'Please enter your first name.'); end if;
  if length(v_last)  < 1 then return jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'Please enter your last name.'); end if;
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    return jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'Please enter a valid email address.');
  end if;
  if length(v_company) < 1 then return jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'Please enter your company name.'); end if;
  if v_site <> '' and v_site !~* '^https?://[^\s/$.?#][^\s]*\.[^\s]+$' then
    return jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'Please enter a valid website address, or leave it empty.');
  end if;
  if p_role is null or not (p_role = any (v_roles))                    then return jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'Please choose your role.'); end if;
  if p_company_size is null or not (p_company_size = any (v_sizes))     then return jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'Please choose your company size.'); end if;
  if p_annual_revenue is null or not (p_annual_revenue = any (v_revenues)) then return jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'Please choose your annual revenue range.'); end if;
  if p_project_budget is null or not (p_project_budget = any (v_budgets))  then return jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'Please choose your project budget.'); end if;
  if length(v_msg) < 5 then return jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'Please tell me a little more about how I can help.'); end if;

  -- interests: only known options, no duplicates, at least one
  select coalesce(array_agg(distinct t order by t), '{}') into v_interests
    from unnest(coalesce(p_interests, '{}')) as t where t = any (v_topics);
  if coalesce(array_length(v_interests, 1), 0) < 1 then
    return jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'Please choose at least one thing you want to improve.');
  end if;

  if (v_first || ' ' || v_last || ' ' || v_company || ' ' || v_msg || ' ' || v_extra) ~* v_injection
     or (coalesce(p_first_name, '') || ' ' || coalesce(p_last_name, '') || ' ' || coalesce(p_company, '') || ' ' ||
         coalesce(p_message, '') || ' ' || coalesce(p_extra, '')) ~* v_injection then
    return jsonb_build_object('ok', false, 'code', 'invalid',
      'message', 'Please rephrase your message. It contains wording that cannot be accepted.');
  end if;

  -- 5) Store it. "name" stays filled so older screens and workflows keep working.
  insert into public.portfolio_inquiries
    (name, email, message, webhook_sent, ip_hash, created_at,
     first_name, last_name, company, website, role, company_size, annual_revenue, project_budget, interests, extra_info)
  values
    (v_first || ' ' || v_last, v_email, v_msg, false, v_hash, now(),
     v_first, v_last, v_company, nullif(v_site, ''), p_role, p_company_size, p_annual_revenue, p_project_budget, v_interests, nullif(v_extra, ''))
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

revoke all on function public.portfolio_submit_inquiry_v2(text, text, text, text, text, text, text, text, text, text, text[], text, text) from public;
grant execute on function public.portfolio_submit_inquiry_v2(text, text, text, text, text, text, text, text, text, text, text[], text, text) to anon, authenticated;

-- ── What n8n receives when it claims an enquiry (now with the new fields) ──────────────────────────────────
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
  return jsonb_build_object(
    'ok', true,
    'name', r.name, 'email', r.email, 'message', r.message, 'created_at', r.created_at,
    'first_name', r.first_name, 'last_name', r.last_name, 'company', r.company, 'website', r.website,
    'role', r.role, 'company_size', r.company_size, 'annual_revenue', r.annual_revenue,
    'project_budget', r.project_budget, 'interests', to_jsonb(r.interests), 'extra_info', r.extra_info
  );
end;
$$;

revoke all on function public.portfolio_claim_inquiry(text) from public;
grant execute on function public.portfolio_claim_inquiry(text) to anon, authenticated;
