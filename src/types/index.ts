// 자산 카테고리 타입
export type AssetCategory = 'stock' | 'cash' | 'pension' | 'debt' | 'irp' | 'isa' | 'fund';

// 거래 유형
export type TransactionType = 'income' | 'expense';

// 수입/지출 카테고리
export interface TransactionCategory {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
}

// 거래 내역 (월별 수입/지출)
export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  year: number;
  month: number;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  owner: string; // 파트너 이름 or 'shared'
}

// 주식 포트폴리오
export interface StockItem {
  id: string;
  name: string;
  ticker: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  memo?: string;
  owner: string; // 파트너 이름 or 'shared'
}

// 금융상품 / 자산 (IRP, ISA, 연금저축, 펀드, 예금, 적금, 부동산)
export interface FinancialProduct {
  id: string;
  type: 'irp' | 'isa' | 'pension' | 'fund' | 'deposit' | 'savings' | 'realestate';
  name: string;
  company: string; // 증권사/은행명/주소(부동산)
  principal: number; // 원금/매입가/납입총액
  currentValue: number; // 현재 평가액 (예금/적금은 원금과 동일하게 자동 설정)
  returnRate: number; // 수익률 (투자상품) / 이자율 (예금/적금)
  memo?: string;
  startDate?: string;
  maturityDate?: string;
  owner: string; // 파트너 이름 or 'shared'
  // 유형별 확장 필드 (DB memo 필드에 JSON 인코딩)
  interestRate?: number; // 예금/적금 연 이자율 (%)
  monthlyPayment?: number; // 적금 월 납입금
  paidMonths?: number;    // 적금 현재 납입 회차
  totalMonths?: number;   // 적금 목표 회차
  address?: string;       // 부동산 주소
}

// 대출
export interface LoanItem {
  id: string;
  name: string;       // 대출명 (예: 주택담보대출)
  bank: string;       // 은행/금융기관
  loanType: 'equal_payment' | 'equal_principal'; // 원리금균등 / 원금균등
  principal: number;           // 대출 원금 (전체 대출금액)
  remainingPrincipal: number;  // 현재 남은 원금
  interestRate: number;        // 연 이자율 (%)
  monthlyPayment: number;      // 월 납부금
  startDate: string;           // 대출 시작일
  endDate: string;             // 만기일
  totalMonths: number;         // 총 납부 개월 수 (전체 기간)
  owner: string;               // 파트너 이름 or 'shared'
  memo?: string;
}

// 월별 데이터
export interface MonthlyData {
  month: number;
  monthName: string;
  netWorth: number;
  income: number;
  expense: number;
  savingsRate: number;
  targetSavingsRate: number;
  targetAchieved: boolean;
  stockValue: number;
  cashValue: number;
  pensionValue: number;
  debtValue: number;
}

// 챌린지
export interface Challenge {
  id: string;
  title: string;
  description: string;
  targetReduction: number;
  currentReduction: number;
  category: string;
}

// 연간 데이터
export interface YearlyData {
  year: number;
  startNetWorth: number;
  currentNetWorth: number;
  targetNetWorth: number;
  targetAmount: number;
  currentAmount: number;
  averageSavingsRate: number;
  monthlyData: MonthlyData[];
  stocks: StockItem[];
  financialProducts: FinancialProduct[];
  loans: LoanItem[];
  streak: number;
  challenge: Challenge | null;
}

// 부부동산봇 메시지
export interface BotMessage {
  id: string;
  type: 'praise' | 'warning' | 'tip' | 'celebration';
  message: string;
  emoji: string;
}

// 앱 전체 데이터 구조
export interface AppData {
  transactions: Transaction[];
  stocks: StockItem[];
  financialProducts: FinancialProduct[];
  loans: LoanItem[];
  yearlySettings: Record<number, {
    targetNetWorth: number;
    startNetWorth: number;
    monthlyTargets?: Record<number, number>;
  }>;
}

// 요약 카드 데이터
export interface SummaryCard {
  title: string;
  value: number;
  previousValue?: number;
  suffix?: string;
  prefix?: string;
  color?: string;
}
