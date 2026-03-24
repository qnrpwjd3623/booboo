# 부부 가계부 앱 — CLAUDE.md

> **새 세션 시작 시 이 파일을 먼저 읽어 컨텍스트 복구할 것.**
> **"메모리에 저장해줘" 라고 하면 ## 최근 작업 섹션을 오늘 날짜로 업데이트할 것.**

---

## ⚡ 작업 규칙 (매 요청마다 반드시 지킬 것)

**코드 수정 → 빌드 확인 → 커밋 → 푸시** 순서를 항상 지킬 것.

```bash
npm run build          # 빌드 에러 없는지 확인 (반드시)
git add <파일>
git commit -m "..."
git push origin main   # push하면 Vercel 자동 배포됨
```

- **빌드 먼저**: `npm run build` 통과 후에만 커밋
- **push = 배포**: GitHub main 브랜치 push → Vercel 자동 배포 (GitHub 연동)
- **Supabase**: 별도 배포 없음, 코드에서 직접 API 호출 (클라이언트 사이드)
- **사용자가 "커밋해줘/푸시해줘" 안 해도** 코드 수정 시 자동으로 커밋+푸시까지 완료할 것

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **앱명** | 부부 가계부 (booboo) |
| **사용자** | 태형 + 하은 (커플 2인) |
| **목적** | 수입/지출/자산 공동 관리 프라이빗 웹앱 |
| **GitHub** | https://github.com/qnrpwjd3623/booboo |
| **로컬 경로** | `/Users/sallylover/Desktop/app` |
| **배포** | Vercel (GitHub main push 시 자동 배포) |

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Charts | Recharts |
| UI Components | shadcn/ui (src/components/ui/) |
| Backend/DB | Supabase (PostgreSQL + REST API) |
| AI | Google Gemini API (`@google/generative-ai`) |
| 빌드 | `tsc -b && vite build` |

---

## Supabase 설정

- **Project URL**: `https://cxyranplnsmkrayprfkw.supabase.co`
- **Anon Key**: `src/services/supabaseClient.ts` 파일 참고
- **클라이언트**: `src/services/supabaseClient.ts`

### 테이블 목록

| 테이블 | 설명 |
|--------|------|
| `couple_profiles` | 커플 프로필 (이름, 이모지, 연간목표 등) |
| `transactions` | 거래내역 (수입/지출, owner 필드로 누구 것인지 구분) |
| `stocks` | 주식 보유 종목 |
| `financial_products` | 금융상품 (IRP/ISA/DC퇴직금/예금/적금/부동산/코인) |
| `loans` | 대출 정보 |
| `ai_comments` | AI 코멘트 저장 (type: person/bot/challenge) |

### ai_comments 스키마
```sql
id uuid PK, type TEXT, name TEXT, year INT, month INT,
comment TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
UNIQUE(type, name, year, month)
-- RLS 비활성화됨
```

---

## 전체 파일 구조

```
/Users/sallylover/Desktop/app/
├── CLAUDE.md                        ← 이 파일 (컨텍스트 기록)
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── src/
    ├── main.tsx                     ← 진입점
    ├── App.tsx                      ← 메인 컴포넌트 (전체 상태/라우팅/로직)
    ├── App.css
    ├── index.css
    │
    ├── types/
    │   └── index.ts                 ← 전체 타입 정의 (Transaction, StockItem,
    │                                   FinancialProduct, LoanItem, Challenge 등)
    │
    ├── hooks/
    │   ├── useSupabaseFinanceData.ts ← 메인 데이터 훅 (Supabase CRUD 전체)
    │   ├── useAuth.ts               ← 로그인 상태 관리
    │   ├── useFinanceData.ts        ← 계산 로직 (순자산, 연간데이터 등)
    │   ├── useLocalStorage.ts       ← localStorage 유틸
    │   ├── useInView.ts             ← Intersection Observer
    │   ├── useCountUp.ts            ← 숫자 카운트업 애니메이션
    │   └── use-mobile.ts            ← 모바일 감지
    │
    ├── services/
    │   ├── supabaseClient.ts        ← Supabase 클라이언트 초기화
    │   ├── stockApi.ts              ← 주식/ETF 현재가 (Yahoo Finance + CORS 프록시)
    │   ├── coinApi.ts               ← 코인 현재가 (CoinGecko, CORS-free)
    │   └── aiApi.ts                 ← Gemini AI (조언/챌린지/AI한마디/이미지파싱)
    │
    ├── components/
    │   ├── LoginPage.tsx            ← 로그인 화면 (1시간 세션)
    │   ├── CoupleProfile.tsx        ← 커플 프로필 설정
    │   ├── GoalSettingForm.tsx      ← 연간 목표 설정
    │   ├── SummaryCards.tsx         ← 대시보드 상단 요약 카드
    │   ├── BotCard.tsx              ← 부부동산봇 AI 조언 카드
    │   ├── GoalProgress.tsx         ← 연간목표 달성률 + 이번달 챌린지
    │   ├── NetWorthChart.tsx        ← 순자산 추이 차트
    │   ├── MonthlyHeatmap.tsx       ← 월별 저축률 히트맵
    │   ├── StockPortfolio.tsx       ← 주식 포트폴리오 (owner 뱃지 있음)
    │   ├── RetirementPortfolio.tsx  ← IRP/ISA/DC퇴직금 포트폴리오 (ETF holdings)
    │   ├── LoanList.tsx             ← 대출 현황
    │   ├── MonthlyTransactionView.tsx ← 월간 거래 관리 (도넛차트 포함)
    │   ├── PersonSpendingCard.tsx   ← 개인별 지출카드 + AI 한마디
    │   ├── TransactionForm.tsx      ← 거래 추가/수정 폼
    │   ├── StockForm.tsx            ← 주식 추가/수정 폼
    │   ├── FinancialProductForm.tsx ← 자산 추가/수정 폼 (현금/ETF 토글, 코인 티커)
    │   ├── LoanForm.tsx             ← 대출 추가/수정 폼
    │   ├── ImageImportModal.tsx     ← 영수증/이미지에서 거래 일괄 입력 (Gemini Vision)
    │   ├── MonthSelector.tsx        ← 월 선택 드롭다운 (fixed 위치)
    │   ├── YearSelector.tsx         ← 연도 선택
    │   ├── Modal.tsx                ← 공통 모달
    │   ├── CircularProgress.tsx     ← 원형 프로그레스바
    │   └── ui/                      ← shadcn/ui 컴포넌트 (수정 금지)
    │
    ├── constants/
    │   └── categories.ts            ← 거래 카테고리 목록 + 아이콘
    │
    ├── utils/
    │   └── format.ts                ← 숫자/통화 포맷 유틸
    │
    ├── data/
    │   └── mockData.ts              ← 목 데이터 (개발용)
    │
    └── lib/
        └── utils.ts                 ← shadcn 유틸 (cn 함수)
```

---

## 핵심 구현 패턴 & 주의사항

### couple_profiles 중복 방지
`.single()` 버그(0행 또는 2행+ 시 에러) → 배열 조회 후 수동 dedup:
```typescript
const { data: rows } = await supabase.from('couple_profiles')
  .select('*').order('created_at', { ascending: true });
const data = rows[0];
if (rows.length > 1) {
  await supabase.from('couple_profiles').delete()
    .in('id', rows.slice(1).map(r => r.id));
}
```

### CORS 프록시 체인 (주식 현재가)
`allorigins.win/get` → `yacdn.org` → `allorigins.win/raw` 순 fallback:
```typescript
// allorigins.win/get은 { contents: "..." } 형태로 wrapping → 파싱 필요
const wrapper = await res.json();
return JSON.parse(wrapper.contents);
```

### 한국 ETF 혼합 티커 감지
```typescript
// 0025N0 같은 6자리 혼합코드 지원
/^\d+$/.test(t) || /^\d[A-Z0-9]{5}$/i.test(t)
```

### ETF holdings 저장 위치
`financial_products.memo` JSON ext 필드에 저장 (별도 테이블 없음):
```typescript
interface ProductExtFields {
  holdings?: ProductHolding[];  // ETF 보유 목록
  ticker?: string;              // 코인 티커
  coinQuantity?: number;        // 코인 수량
}
```

### ai_comments 저장 방식
`upsert`의 onConflict가 묵시적으로 실패하는 케이스 있음 → DELETE + INSERT 방식 사용:
```typescript
await supabase.from('ai_comments').delete()
  .eq('type', t).eq('name', n).eq('year', y).eq('month', m);
await supabase.from('ai_comments').insert(
  { type: t, name: n, year: y, month: m, comment: c }
);
```

### 챌린지 currentReduction 계산
챌린지 카테고리 기준 지난달 vs 이번달 지출 비교 (App.tsx `challengeWithProgress` useMemo):
```typescript
const currentReduction = prevSpend > 0
  ? Math.max(0, Math.round(((prevSpend - thisSpend) / prevSpend) * 100))
  : 0;
```

### owner 뱃지 표시 규칙
- `owner !== 'shared'` 일 때만 이름 뱃지 표시
- 스타일: `bg-indigo-50 text-indigo-500 text-[10px] font-semibold px-1.5 py-0.5 rounded-md`
- 적용: StockPortfolio, RetirementPortfolio, FinancialProductsList(App.tsx 내부)

### MonthSelector 위치 버그 방지
`fixed` 포지션이므로 `window.scrollY` 더하면 안 됨:
```typescript
setDropdownPos({ top: rect.bottom + 8, left: Math.max(8, left) });
// scrollY 절대 추가하지 말 것
```

### 5분 자동갱신 제거됨
주식/ETF 모두 마운트 시 1회만 조회. setInterval 없음.

---

## 최근 작업 히스토리

### 2026-03-21 (오늘)
**완료:**
- ✅ couple_profiles 중복 버그 수정 (`.single()` → array dedup)
- ✅ 주식 CORS 프록시 교체 (corsproxy.io → allorigins.win + yacdn.org)
- ✅ 코인 자산추가 폼에 CoinGecko 티커 연동
- ✅ IRP/ISA/DC퇴직금 ETF holdings 기능 (현금/ETF 토글, avgPrice 입력, 소수점 2자리)
- ✅ 한국 ETF 혼합코드 (0025N0) 인식 수정
- ✅ MonthSelector 드롭다운 위치 버그 수정
- ✅ 월간거래 카테고리 도넛차트 추가 (hover 시 카테고리 정보, tooltip 겹침 해결)
- ✅ DC퇴직금 레이블 "펀드" → "DC퇴직금" 수정
- ✅ 주식/ETF 5분 자동갱신 제거 (마운트 1회만)
- ✅ 소유자(하은/태형) 이름 뱃지 — 주식/퇴직연금/자산목록
- ✅ AI 한마디 Supabase 저장 (기기 간 동기화)
- ✅ ai_comments 테이블 생성 + RLS 비활성화
- ✅ 챌린지 currentReduction 실거래 데이터 연동 (지난달 vs 이번달 카테고리 지출 비교)
- ✅ 챌린지 새로고침 버튼 제거
- ✅ PersonSpendingCard AI 한마디 — DELETE+INSERT 저장 방식
- ✅ CLAUDE.md 생성 + 전체 프로젝트 구조 기록

- ✅ 챌린지 매달 1일 자동 생성 로직 구현 (앱 로드 시 날짜 체크)
- ✅ RetirementPortfolio App.tsx에 연결 (StockPortfolio 아래 배치)
- ✅ 챌린지 UI 지난달 카테고리 지출금액 hover 표시
- ✅ AI 한마디 Supabase 저장 정상 동작 확인

**현재 미완료 작업: 없음 🎉**
