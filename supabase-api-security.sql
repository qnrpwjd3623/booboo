-- Apply once in Supabase SQL Editor before deploying the protected API endpoints.
-- Only existing confirmed accounts are enabled. New signups need explicit approval.
-- No financial rows or existing RLS policies are modified.
begin;
create table if not exists public.api_allowed_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table if not exists public.api_request_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  resource text not null check (resource in ('stock', 'ai')),
  minute_start timestamptz not null,
  minute_count integer not null default 0,
  day_start timestamptz not null,
  day_count integer not null default 0,
  primary key (user_id, resource)
);
alter table public.api_allowed_users enable row level security;
alter table public.api_request_counters enable row level security;
revoke all on public.api_allowed_users, public.api_request_counters from anon, authenticated;
insert into public.api_allowed_users(user_id)
  select id from auth.users where email_confirmed_at is not null
  on conflict do nothing;

create or replace function public.consume_api_quota(p_resource text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  ts timestamptz;
  minute_ts timestamptz;
  day_ts timestamptz;
  minute_limit integer;
  day_limit integer;
  counter public.api_request_counters%rowtype;
begin
  if uid is null or not exists (select 1 from public.api_allowed_users where user_id = uid) then
    return jsonb_build_object('allowed', false, 'reason', 'not_allowed');
  end if;
  if p_resource = 'stock' then
    minute_limit := 120; day_limit := 3000;
  elsif p_resource = 'ai' then
    minute_limit := 6; day_limit := 60;
  else
    return jsonb_build_object('allowed', false, 'reason', 'not_allowed');
  end if;
  insert into public.api_request_counters(user_id, resource, minute_start, day_start)
    values (uid, p_resource, clock_timestamp(), clock_timestamp()) on conflict do nothing;
  -- Row lock serializes all server instances and concurrent requests for this account.
  select * into counter from public.api_request_counters
    where user_id = uid and resource = p_resource for update;
  ts := clock_timestamp();
  minute_ts := date_trunc('minute', ts);
  day_ts := date_trunc('day', ts at time zone 'UTC') at time zone 'UTC';
  if counter.minute_start <> minute_ts then counter.minute_count := 0; end if;
  if counter.day_start <> day_ts then counter.day_count := 0; end if;
  if counter.day_count >= day_limit then
    return jsonb_build_object('allowed', false, 'reason', 'rate_limit',
      'retry_after', ceil(extract(epoch from (day_ts + interval '1 day' - ts))));
  end if;
  if counter.minute_count >= minute_limit then
    return jsonb_build_object('allowed', false, 'reason', 'rate_limit',
      'retry_after', ceil(extract(epoch from (minute_ts + interval '1 minute' - ts))));
  end if;
  update public.api_request_counters
    set minute_start = minute_ts, minute_count = counter.minute_count + 1,
        day_start = day_ts, day_count = counter.day_count + 1
    where user_id = uid and resource = p_resource;
  return jsonb_build_object('allowed', true);
end;
$$;
revoke all on function public.consume_api_quota(text) from public, anon;
grant execute on function public.consume_api_quota(text) to authenticated;
commit;
