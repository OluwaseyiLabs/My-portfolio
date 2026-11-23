-- Studio: remember which contact enquiries you have read, so the tab number only counts new ones.
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- Enquiries with no read_at are "new". The existing owner-only update policy on portfolio_inquiries
-- (migration 007) already lets you set it; visitors still cannot read or change anything.

alter table public.portfolio_inquiries
  add column if not exists read_at timestamptz;

create index if not exists portfolio_inquiries_unread_idx
  on public.portfolio_inquiries (created_at desc) where read_at is null;
