import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Transaction, StockItem, FinancialProduct, AppData } from '@/types';

const initialData: AppData = {
  transactions: [],
  stocks: [],
  financialProducts: [],
  yearlySettings: {
    2024: { targetNetWorth: 130000000, startNetWorth: 85000000 },
    2025: { targetNetWorth: 200000000, startNetWorth: 125000000 },
  },
};

export function useFinanceData() {
  const [data, setData] = useLocalStorage<AppData>('couple-finance-data', initialData);

  // ========== Transactions ==========
  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setData(prev => ({
      ...prev,
      transactions: [newTransaction, ...prev.transactions],
    }));
    return newTransaction;
  }, [setData]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.map(t =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  }, [setData]);

  const deleteTransaction = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id),
    }));
  }, [setData]);

  const getTransactionsByMonth = useCallback((year: number, month: number) => {
    return data.transactions.filter(t => t.year === year && t.month === month);
  }, [data.transactions]);

  const getMonthlySummary = useCallback((year: number, month: number) => {
    const monthTransactions = getTransactionsByMonth(year, month);
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0 };
  }, [getTransactionsByMonth]);

  // ========== Stocks ==========
  const addStock = useCallback((stock: Omit<StockItem, 'id'>) => {
    const newStock: StockItem = {
      ...stock,
      id: `stock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setData(prev => ({
      ...prev,
      stocks: [...prev.stocks, newStock],
    }));
    return newStock;
  }, [setData]);

  const updateStock = useCallback((id: string, updates: Partial<StockItem>) => {
    setData(prev => ({
      ...prev,
      stocks: prev.stocks.map(s =>
        s.id === id ? { ...s, ...updates } : s
      ),
    }));
  }, [setData]);

  const deleteStock = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      stocks: prev.stocks.filter(s => s.id !== id),
    }));
  }, [setData]);

  const getTotalStockValue = useMemo(() => {
    return data.stocks.reduce((sum, s) => sum + (s.shares * s.currentPrice), 0);
  }, [data.stocks]);

  const getTotalStockReturn = useMemo(() => {
    const totalCost = data.stocks.reduce((sum, s) => sum + (s.shares * s.avgPrice), 0);
    const totalValue = getTotalStockValue;
    return {
      value: totalValue - totalCost,
      rate: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    };
  }, [data.stocks, getTotalStockValue]);

  // ========== Financial Products ==========
  const addFinancialProduct = useCallback((product: Omit<FinancialProduct, 'id'>) => {
    const newProduct: FinancialProduct = {
      ...product,
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setData(prev => ({
      ...prev,
      financialProducts: [...prev.financialProducts, newProduct],
    }));
    return newProduct;
  }, [setData]);

  const updateFinancialProduct = useCallback((id: string, updates: Partial<FinancialProduct>) => {
    setData(prev => ({
      ...prev,
      financialProducts: prev.financialProducts.map(p =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  }, [setData]);

  const deleteFinancialProduct = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      financialProducts: prev.financialProducts.filter(p => p.id !== id),
    }));
  }, [setData]);

  const getProductsByType = useCallback((type: FinancialProduct['type']) => {
    return data.financialProducts.filter(p => p.type === type);
  }, [data.financialProducts]);

  const getTotalProductValue = useMemo(() => {
    return data.financialProducts.reduce((sum, p) => sum + p.currentValue, 0);
  }, [data.financialProducts]);

  const getTotalProductReturn = useMemo(() => {
    const totalPrincipal = data.financialProducts.reduce((sum, p) => sum + p.principal, 0);
    const totalValue = getTotalProductValue;
    return {
      value: totalValue - totalPrincipal,
      rate: totalPrincipal > 0 ? ((totalValue - totalPrincipal) / totalPrincipal) * 100 : 0,
    };
  }, [data.financialProducts, getTotalProductValue]);

  // ========== Yearly Settings ==========
  const updateYearlySettings = useCallback((year: number, settings: { targetNetWorth?: number; startNetWorth?: number }) => {
    setData(prev => ({
      ...prev,
      yearlySettings: {
        ...prev.yearlySettings,
        [year]: {
          ...prev.yearlySettings[year],
          ...settings,
        },
      },
    }));
  }, [setData]);

  const getYearlySettings = useCallback((year: number) => {
    return data.yearlySettings[year] || { targetNetWorth: 100000000, startNetWorth: 0 };
  }, [data.yearlySettings]);

  const updateMonthlyTarget = useCallback((year: number, month: number, target: number) => {
    setData(prev => ({
      ...prev,
      yearlySettings: {
        ...prev.yearlySettings,
        [year]: {
          ...prev.yearlySettings[year],
          monthlyTargets: {
            ...(prev.yearlySettings[year]?.monthlyTargets || {}),
            [month]: target,
          },
        },
      },
    }));
  }, [setData]);

  const getMonthlyTargets = useCallback((year: number) => {
    return data.yearlySettings[year]?.monthlyTargets || {};
  }, [data.yearlySettings]);

  return {
    // Data
    transactions: data.transactions,
    stocks: data.stocks,
    financialProducts: data.financialProducts,
    yearlySettings: data.yearlySettings,

    // Transaction methods
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByMonth,
    getMonthlySummary,

    // Stock methods
    addStock,
    updateStock,
    deleteStock,
    getTotalStockValue,
    getTotalStockReturn,

    // Financial product methods
    addFinancialProduct,
    updateFinancialProduct,
    deleteFinancialProduct,
    getProductsByType,
    getTotalProductValue,
    getTotalProductReturn,

    // Yearly settings
    updateYearlySettings,
    getYearlySettings,

    // Monthly targets
    updateMonthlyTarget,
    getMonthlyTargets,
  };
}
