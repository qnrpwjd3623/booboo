# DB 스키마 — Supabase

## 핵심 원칙
- 계정 1개 = 가계부 1개입니다.
- 한 계정 안에서 `owner` 값으로 `남편`, `아내`, `공동(shared)`을 구분합니다.
- 다른 계정의 데이터는 `user_id = auth.uid()` 기준으로 완전히 분리됩니다.

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
user_id uuid not null
```

앱은 로그인한 Supabase 사용자 `auth.uid()`를 그대로 사용합니다.

## RLS

각 테이블은 아래 정책으로 보호됩니다.

```sql
using (user_id = auth.uid())
with check (user_id = auth.uid())
```

즉, 같은 계정으로 로그인한 사용자만 자기 데이터를 읽고 쓸 수 있습니다.

## 연간 설정 주의점

`yearly_settings`는 `year` 단독 키가 아니라 아래처럼 계정별 유니크입니다.

```sql
create unique index ... on yearly_settings(user_id, year)
```

그래서 다른 계정이 같은 연도를 저장해도 서로 덮어쓰지 않습니다.

## 참고 파일
- 전체 스키마: [supabase-schema.sql](/Users/sallylover/Desktop/app/supabase-schema.sql:1)
- 기존 데이터 보존용 적용 순서: [supabase-user-migration.md](/Users/sallylover/Desktop/app/docs/supabase-user-migration.md:1)
