# DB 스키마 — Supabase

## 핵심 원칙
- 모든 데이터는 `household_id` 기준으로 분리됩니다.
- 기본값은 `auth.uid()` 기준 개인 가계부입니다.
- 두 계정이 같은 가계부를 공유하려면 두 사용자 메타데이터에 같은 `household_id`를 넣으면 됩니다.

## 사용 테이블

| 테이블 | 설명 |
|--------|------|
| `couple_profiles` | 부부 프로필, `fp_order` 포함 |
| `transactions` | 수입/지출 거래내역 |
| `stocks` | 주식 보유 종목 |
| `financial_products` | IRP/ISA/연금/예금/적금/부동산/코인 |
| `loans` | 대출 정보 |
| `yearly_settings` | 연간 목표, 시작 순자산, 월 목표, 차트 목표 |
| `custom_categories` | 사용자 정의 카테고리 |
| `ai_comments` | 봇 코멘트, 월간 챌린지 |

## 분리 키

모든 업무 테이블은 아래 컬럼을 가집니다.

```sql
household_id uuid not null
```

앱은 로그인 사용자에서 다음 순서로 `household_id`를 결정합니다.

1. `app_metadata.household_id`
2. `user_metadata.household_id`
3. 없으면 `auth.uid()`

## RLS

각 테이블은 아래와 같은 정책을 사용합니다.

```sql
using (household_id = public.current_household_id())
with check (household_id = public.current_household_id())
```

즉, 같은 `household_id`를 가진 사용자만 같은 데이터를 읽고 쓸 수 있습니다.

## 연간 설정 주의점

`yearly_settings`는 더 이상 `year` 단독 키가 아닙니다.

```sql
create unique index ... on yearly_settings(household_id, year)
```

그래서 다른 계정이 같은 연도를 저장해도 서로 덮어쓰지 않습니다.

## 참고 파일
- 전체 스키마: [supabase-schema.sql](/Users/sallylover/Desktop/app/supabase-schema.sql:1)
- 운영 적용 가이드: [supabase-household-migration.md](/Users/sallylover/Desktop/app/docs/supabase-household-migration.md:1)
