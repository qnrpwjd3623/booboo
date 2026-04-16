-- =============================================
-- 부부 가계부 앱 Supabase 스키마
-- fresh setup + 기존 프로젝트 보강용
-- =============================================

create extension if not exists pgcrypto;

-- household_id 규칙
-- 1) 부부가 같은 household_id를 user/app metadata에 넣으면 같은 데이터 공유
-- 2) household_id가 없으면 auth.uid() 기준으로 개인 격리

create or replace function public.current_household_id()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'household_id', '')::uuid,
    nullif(auth.jwt() -> 'app_metadata' ->> 'household_id', '')::uuid,
    auth.uid()
  )
$$;

-- 1. 부부 프로필 테이블
create table if not exists couple_profiles (
  id uuid default gen_random_uuid() primary key,
  household_id uuid not null,
  partner1_name text not null default '파트너1',
  partner1_avatar text default '',
  partner1_emoji text default '👨',
  partner2_name text not null default '파트너2',
  partner2_avatar text default '',
  partner2_emoji text default '👩',
  couple_name text not null default '우리 가계부',
  fp_order jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table couple_profiles add column if not exists household_id uuid;
alter table couple_profiles add column if not exists fp_order jsonb not null default '[]'::jsonb;
create unique index if not exists idx_couple_profiles_household on couple_profiles(household_id);

-- 2. 거래 내역 테이블
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  household_id uuid not null,
  date text not null,
  year int not null,
  month int not null,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  description text not null default '',
  amount bigint not null default 0,
  owner text not null default 'shared',
  created_at timestamptz default now()
);

alter table transactions add column if not exists household_id uuid;

-- 3. 주식 포트폴리오 테이블
create table if not exists stocks (
  id uuid default gen_random_uuid() primary key,
  household_id uuid not null,
  name text not null,
  ticker text not null,
  shares int not null default 0,
  avg_price bigint not null default 0,
  current_price bigint not null default 0,
  memo text default '',
  owner text not null default 'shared',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table stocks add column if not exists household_id uuid;

-- 4. 금융상품 테이블
create table if not exists financial_products (
  id uuid default gen_random_uuid() primary key,
  household_id uuid not null,
  type text not null check (type in ('irp', 'isa', 'pension', 'fund', 'deposit', 'savings', 'realestate', 'coin')),
  name text not null,
  company text not null default '',
  principal bigint not null default 0,
  current_value bigint not null default 0,
  return_rate numeric(10,2) not null default 0,
  memo text default '',
  start_date text,
  maturity_date text,
  owner text not null default 'shared',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table financial_products add column if not exists household_id uuid;
do $$
begin
  alter table financial_products drop constraint if exists financial_products_type_check;
  alter table financial_products
    add constraint financial_products_type_check
    check (type in ('irp', 'isa', 'pension', 'fund', 'deposit', 'savings', 'realestate', 'coin'));
exception when duplicate_object then null;
end $$;

-- 5. 연간 설정 테이블
create table if not exists yearly_settings (
  id uuid default gen_random_uuid() primary key,
  household_id uuid not null,
  year int not null,
  target_net_worth bigint not null default 100000000,
  start_net_worth bigint not null default 0,
  monthly_targets jsonb default '{}'::jsonb,
  chart_target_net_worth bigint,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table yearly_settings add column if not exists household_id uuid;
alter table yearly_settings add column if not exists chart_target_net_worth bigint;
drop index if exists idx_yearly_settings_year_unique;
create unique index if not exists idx_yearly_settings_household_year on yearly_settings(household_id, year);
do $$
begin
  alter table yearly_settings drop constraint if exists yearly_settings_year_key;
exception when undefined_object then null;
end $$;

-- 6. 대출 테이블
create table if not exists loans (
  id uuid default gen_random_uuid() primary key,
  household_id uuid not null,
  name text not null,
  bank text not null default '',
  loan_type text not null default 'equal_payment',
  principal bigint not null default 0,
  remaining_principal bigint not null default 0,
  interest_rate numeric(5,2) not null default 0,
  monthly_payment bigint not null default 0,
  start_date text,
  end_date text,
  total_months integer not null default 0,
  owner text not null default 'shared',
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table loans add column if not exists household_id uuid;

-- 7. 사용자 정의 카테고리
create table if not exists custom_categories (
  id uuid default gen_random_uuid() primary key,
  household_id uuid not null,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text,
  hidden boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table custom_categories add column if not exists household_id uuid;

-- 8. AI 코멘트 / 챌린지 저장
create table if not exists ai_comments (
  id uuid default gen_random_uuid() primary key,
  household_id uuid not null,
  type text not null check (type in ('bot', 'challenge')),
  name text not null default '',
  year int not null,
  month int not null,
  comment text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table ai_comments add column if not exists household_id uuid;
create unique index if not exists idx_ai_comments_household_month_type on ai_comments(household_id, year, month, type, name);

-- 인덱스
create index if not exists idx_transactions_household_year_month on transactions(household_id, year, month);
create index if not exists idx_stocks_household_ticker on stocks(household_id, ticker);
create index if not exists idx_loans_household on loans(household_id);
create index if not exists idx_custom_categories_household on custom_categories(household_id);

-- RLS
alter table couple_profiles enable row level security;
alter table transactions enable row level security;
alter table stocks enable row level security;
alter table financial_products enable row level security;
alter table yearly_settings enable row level security;
alter table loans enable row level security;
alter table custom_categories enable row level security;
alter table ai_comments enable row level security;

drop policy if exists "couple_profiles_household_access" on couple_profiles;
create policy "couple_profiles_household_access" on couple_profiles
  for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

drop policy if exists "transactions_household_access" on transactions;
create policy "transactions_household_access" on transactions
  for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

drop policy if exists "stocks_household_access" on stocks;
create policy "stocks_household_access" on stocks
  for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

drop policy if exists "financial_products_household_access" on financial_products;
create policy "financial_products_household_access" on financial_products
  for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

drop policy if exists "yearly_settings_household_access" on yearly_settings;
create policy "yearly_settings_household_access" on yearly_settings
  for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

drop policy if exists "loans_household_access" on loans;
create policy "loans_household_access" on loans
  for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

drop policy if exists "custom_categories_household_access" on custom_categories;
create policy "custom_categories_household_access" on custom_categories
  for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

drop policy if exists "ai_comments_household_access" on ai_comments;
create policy "ai_comments_household_access" on ai_comments
  for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

-- 기본 데이터 예시
-- 기존 운영 데이터가 있으면 household_id를 수동으로 채운 뒤 실행하세요.
