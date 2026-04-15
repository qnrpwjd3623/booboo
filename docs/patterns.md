# 핵심 구현 패턴 & 주의사항

## 데이터 흐름

### 순자산 계산 분리
`selectedYear`(localStorage, UI 필터용)와 현재 순자산 표시를 분리:
```typescript
// App.tsx — 항상 실제 올해 기준으로 계산
const realCurrentYear = new Date().getFullYear();
const realCurrentYearData = useMemo(() => {
  // selectedYear와 무관하게 항상 realCurrentYear 사용
  ...
}, [realCurrentYear, transactions, ...]);
// SummaryCards에는 realCurrentYearData.currentNetWorth 전달
```

### 차트 목표 순자산
`yearly_settings.chart_target_net_worth` (절대값, 원 단위) — 대시보드 저축목표와 완전 분리:
```typescript
// NetWorthChart props
chartTargetNetWorth?: number  // 절대값 원 단위, null이면 점선 미표시
onUpdateChartTarget?: (value: number) => void
```

## 카테고리 시스템

### 커스텀 카테고리 hidden 처리
빌트인 카테고리 삭제 대신 `hidden=true` 소프트 삭제:
- `builtinOverrideMap`: custom_categories 중 빌트인 id와 name이 같은 것 → 오버라이드
- `visibleBuiltins`: hidden=false인 것만 표시
- `trueCustomCategories`: 빌트인 id와 겹치지 않고 hidden=false인 커스텀

### addCustomCategory / updateCustomCategory 주의
```typescript
// addCustomCategory: hidden 반드시 포함
.insert({ name, type, icon, hidden: cat.hidden ?? false })

// updateCustomCategory: 명시된 필드만 선택 전송 (undefined 방지)
const updateData: Record<string, unknown> = {};
if ('name' in updates) updateData.name = updates.name;
if ('icon' in updates) updateData.icon = updates.icon ?? null;
if ('hidden' in updates) updateData.hidden = updates.hidden;
```

### resolveIcon (MonthlyTransactionView)
카테고리 이모지는 커스텀 오버라이드 우선:
```typescript
function resolveIcon(categoryName: string, customCategories: CustomCategory[]): string {
  const custom = customCategories.find((c) => c.name === categoryName);
  return custom?.icon || getCategoryIcon(categoryName);
}
```

## 자산 관련

### ETF holdings 저장 위치
`financial_products.memo` JSON 필드 (별도 테이블 없음):
```typescript
interface ProductExtFields {
  holdings?: ProductHolding[];  // ETF 보유 목록
  ticker?: string;              // 코인 티커
  coinQuantity?: number;        // 코인 수량
}
```

### 한국 ETF 혼합 티커 감지
```typescript
// 0025N0 같은 6자리 혼합코드 지원
/^\d+$/.test(t) || /^\d[A-Z0-9]{5}$/i.test(t)
```

### CORS 프록시 체인 (주식 현재가)
`allorigins.win/get` → `yacdn.org` → `allorigins.win/raw` 순 fallback:
```typescript
// allorigins.win/get은 { contents: "..." } wrapping → 파싱 필요
const wrapper = await res.json();
return JSON.parse(wrapper.contents);
```

### 주식/ETF 갱신 주기
마운트 시 1회만 조회. setInterval 없음 (5분 자동갱신 제거됨).

## UI 규칙

### owner 뱃지 표시
`owner !== 'shared'`일 때만 이름 뱃지 표시:
- 스타일: `bg-indigo-50 text-indigo-500 text-[10px] font-semibold px-1.5 py-0.5 rounded-md`
- 적용: StockPortfolio, RetirementPortfolio, FinancialProductsList(App.tsx 내부)

### MonthSelector 위치 버그 방지
`fixed` 포지션 — `window.scrollY` 절대 더하지 말 것:
```typescript
setDropdownPos({ top: rect.bottom + 8, left: Math.max(8, left) });
```

### 챌린지 currentReduction 계산
```typescript
const currentReduction = prevSpend > 0
  ? Math.max(0, Math.round(((prevSpend - thisSpend) / prevSpend) * 100))
  : 0;
```

## fp_order (자산 목록 드래그 순서)
`couple_profiles.fp_order jsonb` 컬럼에 저장 — localStorage 사용 안 함.
