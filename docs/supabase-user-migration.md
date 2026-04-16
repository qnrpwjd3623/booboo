# Supabase 안전 적용 가이드

## 목표
- 지금까지 입력한 기존 가계부 데이터는 유지
- 앞으로는 계정별로 서로 데이터 분리
- 같은 계정 안에서만 `owner`로 남편/아내/공동 구분

## 적용 순서

### 1. 먼저 `user_id` 컬럼만 추가

기존 데이터가 있으니, RLS와 `not null`을 먼저 강하게 걸면 안 됩니다.
먼저 [supabase-schema.sql](/Users/sallylover/Desktop/app/supabase-schema.sql:1)에서 `create table` / `add column if not exists` 부분을 실행해 컬럼과 인덱스를 준비합니다.

### 2. 기존 데이터에 `user_id` 백필

현재 가계부를 실제로 써 온 계정의 Supabase 사용자 UUID를 확인한 뒤, 아래 SQL에서 바꿔 실행합니다.

```sql
update couple_profiles set user_id = 'YOUR_USER_UUID' where user_id is null;
update transactions set user_id = 'YOUR_USER_UUID' where user_id is null;
update stocks set user_id = 'YOUR_USER_UUID' where user_id is null;
update financial_products set user_id = 'YOUR_USER_UUID' where user_id is null;
update yearly_settings set user_id = 'YOUR_USER_UUID' where user_id is null;
update loans set user_id = 'YOUR_USER_UUID' where user_id is null;
update custom_categories set user_id = 'YOUR_USER_UUID' where user_id is null;
update ai_comments set user_id = 'YOUR_USER_UUID' where user_id is null;
```

이 단계가 끝나면 올해 입력해둔 데이터는 그대로 남고, 그 계정에 연결됩니다.

### 3. 백필 확인

```sql
select count(*) from transactions where user_id is null;
select count(*) from stocks where user_id is null;
select count(*) from financial_products where user_id is null;
select count(*) from yearly_settings where user_id is null;
```

위 결과가 전부 `0`이어야 안전합니다.

### 4. 그 다음 RLS 정책 적용

백필이 끝난 뒤에만 `enable row level security`와 `user_id = auth.uid()` 정책을 적용합니다.

## 중요한 점

- 같은 계정 하나를 둘이 함께 쓰면 기존 데이터는 그대로 계속 사용됩니다.
- 새로 가입한 다른 사용자는 자기 계정 데이터만 보게 됩니다.
- 기존 데이터가 날아가는 작업은 포함되어 있지 않습니다.
