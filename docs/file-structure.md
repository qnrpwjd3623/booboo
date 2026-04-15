# 파일 구조

```
/Users/sallylover/Desktop/app/
├── CLAUDE.md                        ← 핵심 규칙 + 목차
├── docs/                            ← 세부 참고 문서
│   ├── db-schema.md                 ← Supabase 스키마 상세
│   ├── file-structure.md            ← 이 파일
│   ├── patterns.md                  ← 핵심 구현 패턴/주의사항
│   └── history.md                   ← 작업 히스토리
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── src/
    ├── main.tsx                     ← 진입점
    ├── App.tsx                      ← 메인 컴포넌트 (전체 상태/라우팅/로직)
    │
    ├── types/
    │   └── index.ts                 ← 전체 타입 정의 (Transaction, StockItem,
    │                                   FinancialProduct, LoanItem, Challenge 등)
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
    │   ├── TransactionForm.tsx      ← 거래 추가/수정 폼 (커스텀 카테고리 편집 포함)
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
    ├── utils/
    │   └── format.ts                ← 숫자/통화 포맷 유틸
    ├── data/
    │   └── mockData.ts              ← 목 데이터 (개발용)
    └── lib/
        └── utils.ts                 ← shadcn 유틸 (cn 함수)
```
