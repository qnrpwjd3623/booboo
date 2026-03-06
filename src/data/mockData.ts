import type { YearlyData, BotMessage, StockItem } from '@/types';

// 2025년 목업 데이터
export const yearlyData2025: YearlyData = {
  year: 2025,
  startNetWorth: 125000000,
  currentNetWorth: 168500000,
  targetNetWorth: 200000000,
  targetAmount: 75000000,
  currentAmount: 43500000,
  averageSavingsRate: 42.5,
  streak: 5,
  monthlyData: [
    { month: 1, monthName: '1월', netWorth: 132000000, income: 8500000, expense: 5200000, savingsRate: 38.8, targetSavingsRate: 40, targetAchieved: true, stockValue: 45000000, cashValue: 25000000, pensionValue: 42000000, debtValue: 15000000 },
    { month: 2, monthName: '2월', netWorth: 138500000, income: 8500000, expense: 4800000, savingsRate: 43.5, targetSavingsRate: 40, targetAchieved: true, stockValue: 48000000, cashValue: 26500000, pensionValue: 43000000, debtValue: 13000000 },
    { month: 3, monthName: '3월', netWorth: 145000000, income: 9200000, expense: 5100000, savingsRate: 44.6, targetSavingsRate: 40, targetAchieved: true, stockValue: 52000000, cashValue: 28000000, pensionValue: 44000000, debtValue: 11000000 },
    { month: 4, monthName: '4월', netWorth: 150500000, income: 8500000, expense: 4900000, savingsRate: 42.4, targetSavingsRate: 40, targetAchieved: true, stockValue: 55000000, cashValue: 29000000, pensionValue: 45000000, debtValue: 9000000 },
    { month: 5, monthName: '5월', netWorth: 156000000, income: 8500000, expense: 4600000, savingsRate: 45.9, targetSavingsRate: 40, targetAchieved: true, stockValue: 58000000, cashValue: 30500000, pensionValue: 46000000, debtValue: 7000000 },
    { month: 6, monthName: '6월', netWorth: 162500000, income: 9000000, expense: 4800000, savingsRate: 46.7, targetSavingsRate: 40, targetAchieved: true, stockValue: 62000000, cashValue: 31500000, pensionValue: 47000000, debtValue: 5000000 },
    { month: 7, monthName: '7월', netWorth: 168500000, income: 8500000, expense: 4700000, savingsRate: 44.7, targetSavingsRate: 40, targetAchieved: true, stockValue: 65000000, cashValue: 32500000, pensionValue: 48000000, debtValue: 3000000 },
    { month: 8, monthName: '8월', netWorth: 0, income: 0, expense: 0, savingsRate: 0, targetSavingsRate: 40, targetAchieved: false, stockValue: 0, cashValue: 0, pensionValue: 0, debtValue: 0 },
    { month: 9, monthName: '9월', netWorth: 0, income: 0, expense: 0, savingsRate: 0, targetSavingsRate: 40, targetAchieved: false, stockValue: 0, cashValue: 0, pensionValue: 0, debtValue: 0 },
    { month: 10, monthName: '10월', netWorth: 0, income: 0, expense: 0, savingsRate: 0, targetSavingsRate: 40, targetAchieved: false, stockValue: 0, cashValue: 0, pensionValue: 0, debtValue: 0 },
    { month: 11, monthName: '11월', netWorth: 0, income: 0, expense: 0, savingsRate: 0, targetSavingsRate: 40, targetAchieved: false, stockValue: 0, cashValue: 0, pensionValue: 0, debtValue: 0 },
    { month: 12, monthName: '12월', netWorth: 0, income: 0, expense: 0, savingsRate: 0, targetSavingsRate: 40, targetAchieved: false, stockValue: 0, cashValue: 0, pensionValue: 0, debtValue: 0 },
  ],
  stocks: [
    { id: '1', name: '삼성전자', ticker: '005930', shares: 100, avgPrice: 65000, currentPrice: 78500 },
    { id: '2', name: 'NAVER', ticker: '035420', shares: 50, avgPrice: 320000, currentPrice: 298000 },
    { id: '3', name: '카카오', ticker: '035720', shares: 200, avgPrice: 85000, currentPrice: 92000 },
    { id: '4', name: '현대차', ticker: '005380', shares: 80, avgPrice: 180000, currentPrice: 215000 },
    { id: '5', name: 'LG에너지솔루션', ticker: '373220', shares: 30, avgPrice: 450000, currentPrice: 398000 },
  ],
  financialProducts: [],
  challenge: {
    id: '1',
    title: '외식비 30% 줄이기',
    description: '이번 달 외식비를 지난달보다 30% 줄여보세요!',
    targetReduction: 30,
    currentReduction: 18,
    category: '외식'
  }
};

// 2024년 목업 데이터
export const yearlyData2024: YearlyData = {
  year: 2024,
  startNetWorth: 85000000,
  currentNetWorth: 125000000,
  targetNetWorth: 130000000,
  targetAmount: 45000000,
  currentAmount: 40000000,
  averageSavingsRate: 38.2,
  streak: 8,
  monthlyData: [
    { month: 1, monthName: '1월', netWorth: 92000000, income: 8000000, expense: 5500000, savingsRate: 31.3, targetSavingsRate: 40, targetAchieved: true, stockValue: 30000000, cashValue: 22000000, pensionValue: 35000000, debtValue: 25000000 },
    { month: 2, monthName: '2월', netWorth: 98000000, income: 8000000, expense: 5000000, savingsRate: 37.5, targetSavingsRate: 40, targetAchieved: true, stockValue: 33000000, cashValue: 23000000, pensionValue: 36000000, debtValue: 23000000 },
    { month: 3, monthName: '3월', netWorth: 103000000, income: 8200000, expense: 5200000, savingsRate: 36.6, targetSavingsRate: 40, targetAchieved: true, stockValue: 35000000, cashValue: 24000000, pensionValue: 37000000, debtValue: 21000000 },
    { month: 4, monthName: '4월', netWorth: 107500000, income: 8000000, expense: 5100000, savingsRate: 36.3, targetSavingsRate: 40, targetAchieved: true, stockValue: 37000000, cashValue: 24500000, pensionValue: 38000000, debtValue: 19000000 },
    { month: 5, monthName: '5월', netWorth: 112000000, income: 8000000, expense: 4900000, savingsRate: 38.8, targetSavingsRate: 40, targetAchieved: true, stockValue: 39000000, cashValue: 25500000, pensionValue: 39000000, debtValue: 17000000 },
    { month: 6, monthName: '6월', netWorth: 116500000, income: 8500000, expense: 4800000, savingsRate: 43.5, targetSavingsRate: 40, targetAchieved: true, stockValue: 41000000, cashValue: 26500000, pensionValue: 40000000, debtValue: 15000000 },
    { month: 7, monthName: '7월', netWorth: 120000000, income: 8000000, expense: 4700000, savingsRate: 41.3, targetSavingsRate: 40, targetAchieved: true, stockValue: 43000000, cashValue: 27000000, pensionValue: 41000000, debtValue: 13000000 },
    { month: 8, monthName: '8월', netWorth: 122500000, income: 8000000, expense: 4600000, savingsRate: 42.5, targetSavingsRate: 40, targetAchieved: true, stockValue: 44000000, cashValue: 27500000, pensionValue: 41500000, debtValue: 11000000 },
    { month: 9, monthName: '9월', netWorth: 123500000, income: 8000000, expense: 4800000, savingsRate: 40.0, targetSavingsRate: 40, targetAchieved: false, stockValue: 44500000, cashValue: 27000000, pensionValue: 42000000, debtValue: 9000000 },
    { month: 10, monthName: '10월', netWorth: 124000000, income: 8000000, expense: 4900000, savingsRate: 38.8, targetSavingsRate: 40, targetAchieved: false, stockValue: 44800000, cashValue: 26500000, pensionValue: 42200000, debtValue: 7000000 },
    { month: 11, monthName: '11월', netWorth: 124500000, income: 8000000, expense: 4750000, savingsRate: 40.6, targetSavingsRate: 40, targetAchieved: true, stockValue: 45000000, cashValue: 26800000, pensionValue: 42500000, debtValue: 5000000 },
    { month: 12, monthName: '12월', netWorth: 125000000, income: 8500000, expense: 4500000, savingsRate: 47.1, targetSavingsRate: 40, targetAchieved: true, stockValue: 45000000, cashValue: 27000000, pensionValue: 43000000, debtValue: 3000000 },
  ],
  stocks: [
    { id: '1', name: '삼성전자', ticker: '005930', shares: 80, avgPrice: 62000, currentPrice: 65000 },
    { id: '2', name: 'NAVER', ticker: '035420', shares: 40, avgPrice: 310000, currentPrice: 320000 },
    { id: '3', name: '카카오', ticker: '035720', shares: 150, avgPrice: 82000, currentPrice: 85000 },
    { id: '4', name: '현대차', ticker: '005380', shares: 60, avgPrice: 175000, currentPrice: 180000 },
  ],
  challenge: {
    id: '1',
    title: '쇼핑비 25% 줄이기',
    description: '이번 달 쇼핑비를 지난달보다 25% 줄여보세요!',
    targetReduction: 25,
    currentReduction: 25,
    category: '쇼핑'
  },
  financialProducts: []
};

// 부부동산봇 메시지
export const botMessages: BotMessage[] = [
  {
    id: '1',
    type: 'celebration',
    message: '와 이번 달 주식 대박났네? 주식이 15% 올랐어! 🚀 근데 외식비도 같이 올랐음 ㅋㅋ',
    emoji: '🚀'
  },
  {
    id: '2',
    type: 'praise',
    message: '7월까지 70% 왔네! 12월까지 힘낼 수 있을 것 같아 💪',
    emoji: '💪'
  },
  {
    id: '3',
    type: 'tip',
    message: '상위 15% 부부야! 이런 페이스면 올해 목표 눈에 보인다 👀',
    emoji: '👀'
  },
  {
    id: '4',
    type: 'warning',
    message: '올해 목표 달성까지 3개월 남았어! 마지막 스퍼트 가보자 🔥',
    emoji: '🔥'
  },
  {
    id: '5',
    type: 'praise',
    message: '연속 5개월 목표 달성 중! 이 기세 그대로 가보자 🎯',
    emoji: '🎯'
  },
  {
    id: '6',
    type: 'tip',
    message: '현금 비중이 좀 높은 것 같은데? 주식에 더 넣어보는 것도 괜찮을 듯 🤔',
    emoji: '🤔'
  }
];

// 포맷 함수
export const formatCurrency = (value: number): string => {
  if (value === 0) return '0원';
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억원`;
  } else if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}만원`;
  }
  return `${value.toLocaleString()}원`;
};

export const formatCurrencyWon = (value: number): string => {
  return `${value.toLocaleString()}원`;
};

export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const getStockReturn = (stock: StockItem): { return: number; returnRate: number } => {
  const investment = stock.shares * stock.avgPrice;
  const currentValue = stock.shares * stock.currentPrice;
  const returnValue = currentValue - investment;
  const returnRate = (returnValue / investment) * 100;
  return { return: returnValue, returnRate };
};
