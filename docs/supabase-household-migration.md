# Supabase 적용 가이드

## 1. 새 스키마 반영

Supabase Dashboard -> SQL Editor 에서 [supabase-schema.sql](/Users/sallylover/Desktop/app/supabase-schema.sql:1) 전체를 실행합니다.

## 2. 기존 데이터 백필

이미 운영 데이터가 있다면, 모든 기존 행에 `household_id`를 채워야 합니다.

가장 간단한 방식은 “현재 데이터 전체를 한 가구에 묶는 것”입니다.

```sql
-- 예시 household_id
-- 실제 공유에 사용할 UUID로 바꿔서 실행하세요.

update couple_profiles set household_id = '11111111-1111-1111-1111-111111111111' where household_id is null;
update transactions set household_id = '11111111-1111-1111-1111-111111111111' where household_id is null;
update stocks set household_id = '11111111-1111-1111-1111-111111111111' where household_id is null;
update financial_products set household_id = '11111111-1111-1111-1111-111111111111' where household_id is null;
update yearly_settings set household_id = '11111111-1111-1111-1111-111111111111' where household_id is null;
update loans set household_id = '11111111-1111-1111-1111-111111111111' where household_id is null;
update custom_categories set household_id = '11111111-1111-1111-1111-111111111111' where household_id is null;
update ai_comments set household_id = '11111111-1111-1111-1111-111111111111' where household_id is null;
```

## 3. 각자 따로 쓰는 경우

아무것도 설정하지 않으면 각 계정은 자기 `auth.uid()` 기준으로 자기 데이터만 봅니다.

## 4. 부부가 같은 가계부를 공유하는 경우

두 사용자 모두 같은 `household_id`를 메타데이터에 넣어야 합니다.

예시:

```json
{
  "household_id": "11111111-1111-1111-1111-111111111111"
}
```

권장 위치:
- 가능하면 `app_metadata.household_id`
- 대안으로 `user_metadata.household_id`

## 5. 확인 쿼리

```sql
select household_id, count(*) from transactions group by household_id order by count(*) desc;
select household_id, year, target_net_worth from yearly_settings order by household_id, year;
```

## 6. 주의사항

- 기존 스키마의 `Allow all access` 정책은 더 이상 사용하면 안 됩니다.
- `yearly_settings`는 `(household_id, year)` 유니크 기준으로 동작합니다.
- 앱 코드는 이미 `household_id`를 함께 저장하도록 수정돼 있습니다.
