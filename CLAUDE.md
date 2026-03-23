# 부부 가계부 앱 — CLAUDE.md

> 새 세션 시작 시 이 파일을 먼저 읽어 프로젝트 맥락을 복구할 것.
> "메모리에 저장해줘" 라고 하면 ## 최근 작업 섹션을 업데이트할 것.

---

## 프로젝트 개요

**앱명**: 부부 가계부 (booboo)
**사용자**: 태형 + 하은 (커플)
**목적**: 두 사람의 수입/지출/자산을 함께 관리하는 프라이빗 웹앱
**GitHub**: https://github.com/qnrpwjd3623/booboo
**로컬 경로**: `/Users/sallylover/Desktop/app`

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Charts | Recharts |
| Backend/DB | Supabase (PostgreSQL) |
| AI | Google Gemini API |
| 배포 | git push → main (자동 배포 or 로컬 실행) |

---

## Supabase 프로젝트

- **URL**: `https://cxyranplnsmkrayprfkw.supabase.co`
- **Anon Key**: `sb_publishable_UPndrjURa_-1OgMA-tF9yg_xnHkz8IM`
- **클라이언트**: `src/services/supabaseClient.ts`

### DB 테이블 목록

| 테이블 | 용도 |
|--------|------|
| `couple_profiles` | 커플 프로필 (이름, 이모지, 목표 등) — `.single()` 버그 있어서 array로 조회 후 수동 dedup |
| `transactions` | 거래내역 (수입/지출) |
| `stocks` | 주식 보유 종목 |
| `financial_products` | 금융상품 (IRP, ISA, DC퇴직금, 예금, 적금, 부동산, 코인) |
| `loans` | 대출 |
| `ai_comments` | AI 한마디/봇/챌린지 저장 (type: person/bot/challenge) |

### ai_comments 스키마
```sql
CREATE TABLE ai_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,        -- 'person' | 'bot' | 'challenge'
  name TEXT NOT NULL,        -- person이면 이름, bot/challenge면 ''
  year INT NOT NULL,
  month INT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(type, name, year, month)
);
-- RLS 비활성화됨 (ALTER TABLE ai_comments DISABLE ROW LEVEL SECURITY)
```

---

## 주요 파일 구조

```
src/
├── App.tsx                    # 메인 컴포넌트, 모든 상태/라우팅
├── types/index.ts             # 전체 타입 정의
├── hooks/
│   └── useSupabaseFinanceData.ts  # Supabase CRUD 훅 (couple_profiles array dedup 포함)
├── services/
│   ├── supabaseClient.ts      # Supabase 클라이언트 초기화
│   ├── stockApi.ts            # 주식 현재가 조회 (allorigins.win + yacdn.org CORS 프록시)
│   ├── coinApi.ts             # 코인 현재가 조회 (CoinGecko, CORS-free)
│   └── aiApi.ts               # Gemini AI 호출 (조언/챌린지/한마디/이미지파싱)
├── components/
│   ├── StockPortfolio.tsx     # 주식 포트폴리오 (owner 뱃지 있음)
│   ├── RetirementPortfolio.tsx # IRP/ISA/DC퇴직금 포트폴리오 (ETF holdings)
│   ├── GoalProgress.tsx       # 연간목표 + 이번달 챌린지 (새로고침 버튼 없음)
│   ├── PersonSpendingCard.tsx # 개인별 지출카드 + AI 한마디 (Supabase 저장)
│   ├── MonthlyTransactionView.tsx # 월간 거래 관리 (도넛 차트 포함)
│   ├── MonthSelector.tsx      # 월 선택 드롭다운 (fixed 포지션, scrollY 없음)
│   └── FinancialProductForm.tsx # 자산 추가/수정 폼 (현금/ETF 토글, 코인 티커)
└── constants/categories.ts    # 거래 카테고리 목록
```

---

## 핵심 구현 패턴 & 주의사항

### 1. couple_profiles 중복 방지
`.single()` 대신 배열 조회 후 수동 dedup:
```typescript
const { data: rows } = await supabase.from('couple_profiles').select('*').order('created_at', { ascending: true });
const data = rows[0];
if (rows.length > 1) {
  await supabase.from('couple_profiles').delete().in('id', rows.slice(1).map(r => r.id));
}
```

### 2. CORS 프록시 (주식 현재가)
allorigins.win/get → yacdn.org → allorigins.win/raw 순서로 fallback:
```typescript
const wrapper = await res.json();
return JSON.parse(wrapper.contents); // allorigins.win/get은 contents 필드로 wrapping
```

### 3. 한국 ETF 티커 감지
```typescript
/^\d+$/.test(t) || /^\d[A-Z0-9]{5}$/i.test(t)  // 0025N0 같은 혼합 코드 지원
```

### 4. ETF holdings 저장
financial_products의 memo JSON ext 필드에 저장:
```typescript
interface ProductExtFields { holdings?: ProductHolding[]; ticker?: string; coinQuantity?: number; }
```

### 5. ai_comments 저장 방식
upsert 대신 DELETE + INSERT:
```typescript
await supabase.from('ai_comments').delete().eq('type', t).eq('name', n).eq('year', y).eq('month', m);
await supabase.from('ai_comments').insert({ type: t, name: n, year: y, month: m, comment: c });
```

### 6. challengeWithProgress
챌린지 카테고리 기준으로 지난달 vs 이번달 지출 비교해 currentReduction 실시간 계산:
```typescript
const currentReduction = prevSpend > 0
  ? Math.max(0, Math.round(((prevSpend - thisSpend) / prevSpend) * 100))
  : 0;
```

---

## owner 뱃지 표시 규칙
- `owner !== 'shared'` 일 때만 이름 뱃지 표시
- 스타일: `bg-indigo-50 text-indigo-500 text-[10px] font-semibold px-1.5 py-0.5 rounded-md`
- 적용 위치: StockPortfolio, RetirementPortfolio, FinancialProductsList(App.tsx 내)

---

## 5분 자동갱신 제거됨
주식/ETF 모두 마운트 시 1회만 조회. interval 없음.

---

## 최근 작업 (세션 끝날 때 업데이트)

### 2026-03-21
- ✅ couple_profiles 중복 데이터 버그 수정 (`.single()` → array dedup)
- ✅ 주식 CORS 프록시 교체 (corsproxy.io → allorigins.win + yacdn.org)
- ✅ 코인 티커 자산추가 폼에 CoinGecko 연동
- ✅ IRP/ISA/DC퇴직금 ETF holdings 기능 (현금/ETF 토글, avgPrice 입력)
- ✅ 한국 ETF 혼합코드 (0025N0) 인식 수정
- ✅ MonthSelector 드롭다운 위치 버그 수정 (fixed 포지션 + scrollY 제거)
- ✅ 월간거래 도넛 차트 추가 (hover 시 카테고리 정보, tooltip 겹침 해결)
- ✅ DC퇴직금 레이블 "펀드" → "DC퇴직금" 수정
- ✅ 주식/ETF 5분 자동갱신 제거
- ✅ 주식/퇴직연금/자산목록에 소유자 이름 뱃지 표시
- ✅ AI 한마디 Supabase 저장 (localStorage 대신, 기기 간 동기화)
- ✅ ai_comments 테이블 생성 + RLS 비활성화
- ✅ 챌린지 currentReduction 실거래 데이터 연동
- ✅ 챌린지 새로고침 버튼 제거 (매달 1일 자동생성 예정)
- ✅ CLAUDE.md 생성

### 다음에 할 것
- [ ] 챌린지 매달 1일 00:00 자동 생성 로직 (Supabase Edge Function 또는 앱 로드 시 체크)
- [ ] RetirementPortfolio App.tsx에 연결 (StockPortfolio 아래)
- [ ] 챌린지 UI에 지난달 카테고리 지출금액 표시 (마우스 hover)
- [ ] 퇴직연금 포트폴리오 상세 UI 개선
