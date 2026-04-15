# 작업 히스토리

## 2026-04-15
**완료:**
- ✅ 카테고리 이름변경 버그 수정
  - `addCustomCategory`: hidden 필드 INSERT 누락 수정 (중복 카테고리 생성 원인)
  - `updateCustomCategory`: 명시된 필드만 선택적 업데이트 (name/icon 덮어쓰기 방지)
  - `handleSaveEdit`: 중복 생성 dedup 체크 + isSavingCat 중복 클릭 방지
- ✅ MonthlyTransactionView 개선
  - 소유자 필터에서 '공동' 탭 제거
  - 수입/지출 타입 필터 추가 (소유자 필터와 AND 조합)
- ✅ pre-commit hook 적용 (빌드 실패 시 커밋 물리적 차단)
- ✅ CLAUDE.md 목차화 — docs/ 폴더로 세부 문서 분리

## 2026-04-01
**완료:**
- ✅ 순자산 기기 간 불일치 수정 — `realCurrentYear` 기준으로 분리
- ✅ fp-order localStorage → Supabase `couple_profiles.fp_order` 이전
- ✅ 순자산 차트 툴팁 countup 애니메이션 (0→실제값, 0.5초 easeOutCubic)
- ✅ 차트 목표 순자산 인라인 편집 — `yearly_settings.chart_target_net_worth` 별도 컬럼
- ✅ 월별 수입/지출 바차트 Y축 단위 억→만원 변경

## 2026-03-21
**완료:**
- ✅ couple_profiles 중복 버그 수정 (`.single()` → array dedup)
- ✅ 주식 CORS 프록시 교체 (corsproxy.io → allorigins.win + yacdn.org)
- ✅ 코인 자산추가 폼 CoinGecko 티커 연동
- ✅ IRP/ISA/DC퇴직금 ETF holdings 기능
- ✅ 한국 ETF 혼합코드 (0025N0) 인식
- ✅ MonthSelector 드롭다운 위치 버그 수정
- ✅ 월간거래 카테고리 도넛차트 추가
- ✅ 주식/ETF 5분 자동갱신 제거
- ✅ owner 뱃지 — 주식/퇴직연금/자산목록
- ✅ AI 한마디 Supabase 저장 + ai_comments 테이블 생성
- ✅ 챌린지 currentReduction 실거래 데이터 연동
- ✅ 챌린지 매달 1일 자동 생성 로직
