-- 1) Let the public site read ALL skill rows (hidden ones included) so it can tell
--    "skills are set up but switched off" from "no skills yet". Hidden skills are never shown.
drop policy if exists "Public can read visible skills" on public.portfolio_skills;
drop policy if exists "Public can read skills" on public.portfolio_skills;
create policy "Public can read skills"
  on public.portfolio_skills for select
  using (true);

-- 2) Add your starter skills (skips any name that already exists). Switch each one on or off in Studio > Skills.
insert into public.portfolio_skills (name, icon_url, sort_order, visible)
select v.name, v.icon_url, v.sort_order, true
from (values
  ('n8n',         '/tools/n8n.svg',         1),
  ('Claude Code', '/tools/claude-code.svg', 2),
  ('CRM',         '/tools/g-crm.svg',       3),
  ('Slack',       '/tools/slack.svg',       4),
  ('HubSpot',     '/tools/hubspot.svg',     5),
  ('ClickUp',     '/tools/clickup.svg',     6)
) as v(name, icon_url, sort_order)
where not exists (select 1 from public.portfolio_skills s where lower(s.name) = lower(v.name));
