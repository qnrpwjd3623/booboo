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
}

// 금융상품 (IRP, ISA, 연금저축, 펀드 등)
export interface FinancialProduct {
  id: string;
  type: 'irp' | 'isa' | 'pension' | 'fund' | 'deposit' | 'savings';
  name: string;
  company: string; // 증권사/은행명
  principal: number; // 원금
  currentValue: number; // 현재 평가액
  returnRate: number; // 수익률 (%)
  memo?: string;
  startDate?: string;
  maturityDate?: string;
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
  streak: number;
  challenge: Challenge;
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
