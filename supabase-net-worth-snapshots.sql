-- =============================================
-- 월별 순자산 스냅샷 테이블 (추가 마이그레이션)
-- Supabase SQL Editor 에 그대로 붙여넣고 실행하세요.
-- 기존 테이블은 건드리지 않습니다 (추가만).
-- =============================================

create extension if not exists pgcrypto;

create table if not exists net_worth_snapshots (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  year int not null,
  month int not null,
  net_worth bigint not null default 0,
  stocks bigint not null default 0,
  products bigint not null default 0,
  debt bigint not null default 0,
  is_estimated boolean not null default false,  -- true = 과거 역산 추정치
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 사용자 + 연월 조합은 1개만 (upsert 기준)
create unique index if not exists idx_net_worth_snapshots_user_year_month
  on net_worth_snapshots(user_id, year, month);

alter table net_worth_snapshots enable row level security;

drop policy if exists "net_worth_snapshots_user_access" on net_worth_snapshots;
create policy "net_worth_snapshots_user_access" on net_worth_snapshots
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
