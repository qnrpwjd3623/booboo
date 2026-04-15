# DB 스키마 — Supabase

## 접속 정보
- **Project URL**: `https://cxyranplnsmkrayprfkw.supabase.co`
- **Anon Key**: `src/services/supabaseClient.ts` 참고
- **클라이언트**: `src/services/supabaseClient.ts`
- 별도 배포 없음 — 클라이언트에서 직접 API 호출

## 테이블 목록

| 테이블 | 설명 |
|--------|------|
| `couple_profiles` | 커플 프로필 (이름, 이모지, 연간목표, fp_order) |
| `transactions` | 거래내역 (수입/지출, owner 필드로 소유자 구분) |
| `stocks` | 주식 보유 종목 |
| `financial_products` | 금융상품 (IRP/ISA/DC퇴직금/예금/적금/부동산/코인) |
| `loans` | 대출 정보 |
| `ai_comments` | AI 코멘트 저장 (type: person/bot/challenge) |
| `yearly_settings` | 연간 목표, 시작 순자산, chart_target_net_worth |
| `custom_categories` | 커스텀 카테고리 (hidden 필드로 빌트인 숨김 처리) |

## 주요 스키마 상세

### ai_comments
```sql
id uuid PK, type TEXT, name TEXT, year INT, month INT,
comment TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
UNIQUE(type, name, year, month)
-- RLS 비활성화됨
```

### couple_profiles 추가 컬럼
```sql
ALTER TABLE couple_profiles ADD COLUMN IF NOT EXISTS fp_order jsonb;
```

### yearly_settings 추가 컬럼
```sql
ALTER TABLE yearly_settings ADD COLUMN IF NOT EXISTS chart_target_net_worth bigint;
```

### custom_categories
```sql
id uuid PK, name TEXT, type TEXT, icon TEXT, hidden BOOLEAN DEFAULT false,
created_at TIMESTAMPTZ
-- hidden=true: 카테고리 피커에서 숨김 (빌트인 삭제 대신 사용)
```

## 주의사항

### couple_profiles 중복 방지
`.single()` 버그 → 배열 조회 후 수동 dedup:
```typescript
const { data: rows } = await supabase.from('couple_profiles')
  .select('*').order('created_at', { ascending: true });
const data = rows[0];
if (rows.length > 1) {
  await supabase.from('couple_profiles').delete()
    .in('id', rows.slice(1).map(r => r.id));
}
```

### ai_comments 저장 방식
upsert onConflict 묵시적 실패 케이스 있음 → DELETE + INSERT 사용:
```typescript
await supabase.from('ai_comments').delete()
  .eq('type', t).eq('name', n).eq('year', y).eq('month', m);
await supabase.from('ai_comments').insert(
  { type: t, name: n, year: y, month: m, comment: c }
);
```
