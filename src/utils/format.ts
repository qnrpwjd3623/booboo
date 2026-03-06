import type { StockItem } from '@/types';

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
