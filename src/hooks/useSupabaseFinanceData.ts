import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/services/supabaseClient';
import type { Transaction, StockItem, FinancialProduct } from '@/types';

// ========== DB ↔ App 타입 변환 ==========
interface DbTransaction {
    id: string;
    date: string;
    year: number;
    month: number;
    type: string;
    category: string;
    description: string;
    amount: number;
}

interface DbStock {
    id: string;
    name: string;
    ticker: string;
    shares: number;
    avg_price: number;
    current_price: number;
    memo: string;
}

interface DbProduct {
    id: string;
    type: string;
    name: string;
    company: string;
    principal: number;
    current_value: number;
    return_rate: number;
    memo: string;
    start_date: string | null;
    maturity_date: string | null;
}

interface DbYearlySetting {
    id: string;
    year: number;
    target_net_worth: number;
    start_net_worth: number;
    monthly_targets: Record<number, number>;
}

function toAppTransaction(db: DbTransaction): Transaction {
    return {
        id: db.id,
        date: db.date,
        year: db.year,
        month: db.month,
        type: db.type as 'income' | 'expense',
        category: db.category,
        description: db.description,
        amount: db.amount,
    };
}

function toAppStock(db: DbStock): StockItem {
    return {
        id: db.id,
        name: db.name,
        ticker: db.ticker,
        shares: db.shares,
        avgPrice: db.avg_price,
        currentPrice: db.current_price,
        memo: db.memo,
    };
}

function toAppProduct(db: DbProduct): FinancialProduct {
    return {
        id: db.id,
        type: db.type as FinancialProduct['type'],
        name: db.name,
        company: db.company,
        principal: db.principal,
        currentValue: db.current_value,
        returnRate: db.return_rate,
        memo: db.memo,
        startDate: db.start_date || undefined,
        maturityDate: db.maturity_date || undefined,
    };
}

// ========== Hook ==========
export function useSupabaseFinanceData() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stocks, setStocks] = useState<StockItem[]>([]);
    const [financialProducts, setFinancialProducts] = useState<FinancialProduct[]>([]);
    const [yearlySettings, setYearlySettings] = useState<Record<number, { targetNetWorth: number; startNetWorth: number; monthlyTargets?: Record<number, number> }>>({});
    const [isLoading, setIsLoading] = useState(true);

    // ========== 초기 데이터 로드 ==========
    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                loadTransactions(),
                loadStocks(),
                loadProducts(),
                loadYearlySettings(),
            ]);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadTransactions = async () => {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) { console.error('Load transactions error:', error); return; }
        setTransactions((data || []).map(toAppTransaction));
    };

    const loadStocks = async () => {
        const { data, error } = await supabase.from('stocks').select('*');
        if (error) { console.error('Load stocks error:', error); return; }
        setStocks((data || []).map(toAppStock));
    };

    const loadProducts = async () => {
        const { data, error } = await supabase.from('financial_products').select('*');
        if (error) { console.error('Load products error:', error); return; }
        setFinancialProducts((data || []).map(toAppProduct));
    };

    const loadYearlySettings = async () => {
        const { data, error } = await supabase.from('yearly_settings').select('*');
        if (error) { console.error('Load yearly settings error:', error); return; }
        const settings: Record<number, { targetNetWorth: number; startNetWorth: number; monthlyTargets?: Record<number, number> }> = {};
        (data || []).forEach((row: DbYearlySetting) => {
            settings[row.year] = {
                targetNetWorth: row.target_net_worth,
                startNetWorth: row.start_net_worth,
                monthlyTargets: row.monthly_targets || {},
            };
        });
        setYearlySettings(settings);
    };

    // ========== Transactions ==========
    const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
        const { data, error } = await supabase
            .from('transactions')
            .insert({
                date: transaction.date,
                year: transaction.year,
                month: transaction.month,
                type: transaction.type,
                category: transaction.category,
                description: transaction.description,
                amount: transaction.amount,
            })
            .select()
            .single();

        if (error) { console.error('Add transaction error:', error); return; }
        if (data) {
            const newTxn = toAppTransaction(data);
            setTransactions(prev => [newTxn, ...prev]);
            return newTxn;
        }
    }, []);

    const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.date !== undefined) dbUpdates.date = updates.date;
        if (updates.year !== undefined) dbUpdates.year = updates.year;
        if (updates.month !== undefined) dbUpdates.month = updates.month;
        if (updates.type !== undefined) dbUpdates.type = updates.type;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.amount !== undefined) dbUpdates.amount = updates.amount;

        const { error } = await supabase.from('transactions').update(dbUpdates).eq('id', id);
        if (error) { console.error('Update transaction error:', error); return; }
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }, []);

    const deleteTransaction = useCallback(async (id: string) => {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) { console.error('Delete transaction error:', error); return; }
        setTransactions(prev => prev.filter(t => t.id !== id));
    }, []);

    const getTransactionsByMonth = useCallback((year: number, month: number) => {
        return transactions.filter(t => t.year === year && t.month === month);
    }, [transactions]);

    const getMonthlySummary = useCallback((year: number, month: number) => {
        const monthTransactions = getTransactionsByMonth(year, month);
        const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return { income, expense, savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0 };
    }, [getTransactionsByMonth]);

    // ========== Stocks ==========
    const addStock = useCallback(async (stock: Omit<StockItem, 'id'>) => {
        const { data, error } = await supabase
            .from('stocks')
            .insert({
                name: stock.name,
                ticker: stock.ticker,
                shares: stock.shares,
                avg_price: stock.avgPrice,
                current_price: stock.currentPrice,
                memo: stock.memo || '',
            })
            .select()
            .single();

        if (error) { console.error('Add stock error:', error); return; }
        if (data) {
            const newStock = toAppStock(data);
            setStocks(prev => [...prev, newStock]);
            return newStock;
        }
    }, []);

    const updateStock = useCallback(async (id: string, updates: Partial<StockItem>) => {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.ticker !== undefined) dbUpdates.ticker = updates.ticker;
        if (updates.shares !== undefined) dbUpdates.shares = updates.shares;
        if (updates.avgPrice !== undefined) dbUpdates.avg_price = updates.avgPrice;
        if (updates.currentPrice !== undefined) dbUpdates.current_price = updates.currentPrice;
        if (updates.memo !== undefined) dbUpdates.memo = updates.memo;

        const { error } = await supabase.from('stocks').update(dbUpdates).eq('id', id);
        if (error) { console.error('Update stock error:', error); return; }
        setStocks(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }, []);

    const deleteStock = useCallback(async (id: string) => {
        const { error } = await supabase.from('stocks').delete().eq('id', id);
        if (error) { console.error('Delete stock error:', error); return; }
        setStocks(prev => prev.filter(s => s.id !== id));
    }, []);

    const getTotalStockValue = useMemo(() => {
        return stocks.reduce((sum, s) => sum + (s.shares * s.currentPrice), 0);
    }, [stocks]);

    const getTotalStockReturn = useMemo(() => {
        const totalCost = stocks.reduce((sum, s) => sum + (s.shares * s.avgPrice), 0);
        const totalValue = getTotalStockValue;
        return {
            value: totalValue - totalCost,
            rate: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
        };
    }, [stocks, getTotalStockValue]);

    // ========== Financial Products ==========
    const addFinancialProduct = useCallback(async (product: Omit<FinancialProduct, 'id'>) => {
        const { data, error } = await supabase
            .from('financial_products')
            .insert({
                type: product.type,
                name: product.name,
                company: product.company,
                principal: product.principal,
                current_value: product.currentValue,
                return_rate: product.returnRate,
                memo: product.memo || '',
                start_date: product.startDate || null,
                maturity_date: product.maturityDate || null,
            })
            .select()
            .single();

        if (error) { console.error('Add product error:', error); return; }
        if (data) {
            const newProduct = toAppProduct(data);
            setFinancialProducts(prev => [...prev, newProduct]);
            return newProduct;
        }
    }, []);

    const updateFinancialProduct = useCallback(async (id: string, updates: Partial<FinancialProduct>) => {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.type !== undefined) dbUpdates.type = updates.type;
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.company !== undefined) dbUpdates.company = updates.company;
        if (updates.principal !== undefined) dbUpdates.principal = updates.principal;
        if (updates.currentValue !== undefined) dbUpdates.current_value = updates.currentValue;
        if (updates.returnRate !== undefined) dbUpdates.return_rate = updates.returnRate;
        if (updates.memo !== undefined) dbUpdates.memo = updates.memo;
        if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
        if (updates.maturityDate !== undefined) dbUpdates.maturity_date = updates.maturityDate;

        const { error } = await supabase.from('financial_products').update(dbUpdates).eq('id', id);
        if (error) { console.error('Update product error:', error); return; }
        setFinancialProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }, []);

    const deleteFinancialProduct = useCallback(async (id: string) => {
        const { error } = await supabase.from('financial_products').delete().eq('id', id);
        if (error) { console.error('Delete product error:', error); return; }
        setFinancialProducts(prev => prev.filter(p => p.id !== id));
    }, []);

    const getProductsByType = useCallback((type: FinancialProduct['type']) => {
        return financialProducts.filter(p => p.type === type);
    }, [financialProducts]);

    const getTotalProductValue = useMemo(() => {
        return financialProducts.reduce((sum, p) => sum + p.currentValue, 0);
    }, [financialProducts]);

    const getTotalProductReturn = useMemo(() => {
        const totalPrincipal = financialProducts.reduce((sum, p) => sum + p.principal, 0);
        const totalValue = getTotalProductValue;
        return {
            value: totalValue - totalPrincipal,
            rate: totalPrincipal > 0 ? ((totalValue - totalPrincipal) / totalPrincipal) * 100 : 0,
        };
    }, [financialProducts, getTotalProductValue]);

    // ========== Yearly Settings ==========
    const updateYearlySettings = useCallback(async (year: number, settings: { targetNetWorth?: number; startNetWorth?: number }) => {
        const current = yearlySettings[year] || { targetNetWorth: 100000000, startNetWorth: 0 };
        const newSettings = { ...current, ...settings };

        const { error } = await supabase
            .from('yearly_settings')
            .upsert({
                year,
                target_net_worth: newSettings.targetNetWorth,
                start_net_worth: newSettings.startNetWorth,
                monthly_targets: newSettings.monthlyTargets || {},
            }, { onConflict: 'year' });

        if (error) { console.error('Update yearly settings error:', error); return; }
        setYearlySettings(prev => ({
            ...prev,
            [year]: newSettings,
        }));
    }, [yearlySettings]);

    const getYearlySettings = useCallback((year: number) => {
        return yearlySettings[year] || { targetNetWorth: 100000000, startNetWorth: 0 };
    }, [yearlySettings]);

    const updateMonthlyTarget = useCallback(async (year: number, month: number, target: number) => {
        const current = yearlySettings[year];
        const currentTargets = current?.monthlyTargets || {};
        const newTargets = { ...currentTargets, [month]: target };

        const { error } = await supabase
            .from('yearly_settings')
            .upsert({
                year,
                target_net_worth: current?.targetNetWorth || 100000000,
                start_net_worth: current?.startNetWorth || 0,
                monthly_targets: newTargets,
            }, { onConflict: 'year' });

        if (error) { console.error('Update monthly target error:', error); return; }
        setYearlySettings(prev => ({
            ...prev,
            [year]: {
                ...(prev[year] || { targetNetWorth: 100000000, startNetWorth: 0 }),
                monthlyTargets: newTargets,
            },
        }));
    }, [yearlySettings]);

    const getMonthlyTargets = useCallback((year: number) => {
        return yearlySettings[year]?.monthlyTargets || {};
    }, [yearlySettings]);

    return {
        // Data
        transactions,
        stocks,
        financialProducts,
        yearlySettings,
        isLoading,

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

        // Refresh
        refreshData: loadAllData,
    };
}
