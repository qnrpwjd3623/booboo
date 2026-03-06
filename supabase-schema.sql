-- =============================================
-- 부부 가계부 앱 Supabase 스키마
-- Supabase SQL Editor에서 실행해주세요
-- =============================================

-- 1. 부부 프로필 테이블
CREATE TABLE IF NOT EXISTS couple_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner1_name TEXT NOT NULL DEFAULT '파트너1',
  partner1_avatar TEXT DEFAULT '',
  partner1_emoji TEXT DEFAULT '👨',
  partner2_name TEXT NOT NULL DEFAULT '파트너2',
  partner2_avatar TEXT DEFAULT '',
  partner2_emoji TEXT DEFAULT '👩',
  couple_name TEXT NOT NULL DEFAULT '우리 가계부',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 거래 내역 테이블
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount BIGINT NOT NULL DEFAULT 0,
  owner TEXT NOT NULL DEFAULT 'shared',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 주식 포트폴리오 테이블
CREATE TABLE IF NOT EXISTS stocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ticker TEXT NOT NULL,
  shares INT NOT NULL DEFAULT 0,
  avg_price BIGINT NOT NULL DEFAULT 0,
  current_price BIGINT NOT NULL DEFAULT 0,
  memo TEXT DEFAULT '',
  owner TEXT NOT NULL DEFAULT 'shared',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 금융상품 테이블
CREATE TABLE IF NOT EXISTS financial_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('irp', 'isa', 'pension', 'fund', 'deposit', 'savings')),
  name TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  principal BIGINT NOT NULL DEFAULT 0,
  current_value BIGINT NOT NULL DEFAULT 0,
  return_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  memo TEXT DEFAULT '',
  start_date TEXT,
  maturity_date TEXT,
  owner TEXT NOT NULL DEFAULT 'shared',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 연간 설정 테이블
CREATE TABLE IF NOT EXISTS yearly_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INT NOT NULL UNIQUE,
  target_net_worth BIGINT NOT NULL DEFAULT 100000000,
  start_net_worth BIGINT NOT NULL DEFAULT 0,
  monthly_targets JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_transactions_year_month ON transactions(year, month);
CREATE INDEX IF NOT EXISTS idx_stocks_ticker ON stocks(ticker);
CREATE INDEX IF NOT EXISTS idx_yearly_settings_year ON yearly_settings(year);

-- RLS 비활성화 (anon key로 직접 접근 허용)
ALTER TABLE couple_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE yearly_settings ENABLE ROW LEVEL SECURITY;

-- 모든 테이블에 anon 접근 허용 정책 추가
CREATE POLICY "Allow all access" ON couple_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON stocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON financial_products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON yearly_settings FOR ALL USING (true) WITH CHECK (true);

-- 기본 연간 설정 데이터 삽입
INSERT INTO yearly_settings (year, target_net_worth, start_net_worth, monthly_targets)
VALUES
  (2024, 130000000, 85000000, '{}'),
  (2025, 200000000, 125000000, '{}'),
  (2026, 250000000, 170000000, '{}')
ON CONFLICT (year) DO NOTHING;

-- 기본 부부 프로필 삽입
INSERT INTO couple_profiles (partner1_name, partner2_name, couple_name)
SELECT '파트너1', '파트너2', '우리 가계부'
WHERE NOT EXISTS (SELECT 1 FROM couple_profiles LIMIT 1);
