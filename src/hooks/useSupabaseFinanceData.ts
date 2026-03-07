import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/services/supabaseClient';
import type { Transaction, StockItem, FinancialProduct, LoanItem } from '@/types';

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
    owner: string;
}

interface DbStock {
    id: string;
    name: string;
    ticker: string;
    shares: number;
    avg_price: number;
    current_price: number;
    memo: string;
    owner: string;
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
    owner: string;
}

interface DbYearlySetting {
    id: string;
    year: number;
    target_net_worth: number;
    start_net_worth: number;
    monthly_targets: Record<number, number>;
}

interface DbLoan {
    id: string;
    name: string;
    bank: string;
    loan_type: string;
    principal: number;
    remaining_principal: number;
    interest_rate: number;
    monthly_payment: number;
    start_date: string | null;
    end_date: string | null;
    total_months: number;
    owner: string;
    memo: string | null;
}

// ---- FinancialProduct memo 인코딩/디코딩 ----
// 유형별 확장 필드를 memo 필드에 JSON으로 인코딩
// 형식: {"__ext": {...extFields}, "__memo": "사용자 메모"}

interface ProductExtFields {
    interestRate?: number;
    monthlyPayment?: number;
    paidMonths?: number;
    totalMonths?: number;
    address?: string;
}

function encodeProductMemo(userMemo: string | undefined, ext: ProductExtFields): string {
    const hasExt = Object.values(ext).some(v => v !== undefined);
    if (!hasExt) return userMemo || '';
    return JSON.stringify({ __ext: ext, __memo: userMemo || '' });
}

function decodeProductMemo(memoStr: string | null): { memo: string; ext: ProductExtFields } {
    if (!memoStr) return { memo: '', ext: {} };
    try {
        const parsed = JSON.parse(memoStr);
        if (parsed.__ext) {
            return { memo: parsed.__memo || '', ext: parsed.__ext as ProductExtFields };
        }
    } catch {
        // plain text memo
    }
    return { memo: memoStr, ext: {} };
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
        owner: db.owner || 'shared',
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
        owner: db.owner || 'shared',
    };
}

function toAppProduct(db: DbProduct): FinancialProduct {
    const { memo, ext } = decodeProductMemo(db.memo);
    return {
        id: db.id,
        type: db.type as FinancialProduct['type'],
        name: db.name,
        company: db.company,
        principal: db.principal,
        currentValue: db.current_value,
        returnRate: db.return_rate,
        memo,
        startDate: db.start_date || undefined,
        maturityDate: db.maturity_date || undefined,
        owner: db.owner || 'shared',
        // 확장 필드
        interestRate: ext.interestRate,
        monthlyPayment: ext.monthlyPayment,
        paidMonths: ext.paidMonths,
        totalMonths: ext.totalMonths,
        address: ext.address,
    };
}

function toAppLoan(db: DbLoan): LoanItem {
    return {
        id: db.id,
        name: db.name,
        bank: db.bank,
        loanType: db.loan_type as 'equal_payment' | 'equal_principal',
        principal: db.principal,
        remainingPrincipal: db.remaining_principal,
        interestRate: db.interest_rate,
        monthlyPayment: db.monthly_payment,
        startDate: db.start_date || '',
        endDate: db.end_date || '',
        totalMonths: db.total_months,
        owner: db.owner || 'shared',
        memo: db.memo || undefined,
    };
}

// ========== Hook ==========
export function useSupabaseFinanceData() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stocks, setStocks] = useState<StockItem[]>([]);
    const [financialProducts, setFinancialProducts] = useState<FinancialProduct[]>([]);
    const [loans, setLoans] = useState<LoanItem[]>([]);
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
                loadLoans(),
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

    const loadLoans = async () => {
        const { data, error } = await supabase.from('loans').select('*');
        if (error) {
            // loans 테이블이 아직 없을 수 있음 - 조용히 처리
            if (error.code !== 'PGRST116' && !error.message?.includes('does not exist')) {
                console.error('Load loans error:', error);
            }
            return;
        }
        setLoans((data || []).map(toAppLoan));
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
                owner: transaction.owner || 'shared',
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
        if (updates.owner !== undefined) dbUpdates.owner = updates.owner;

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
                owner: stock.owner || 'shared',
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
        if (updates.owner !== undefined) dbUpdates.owner = updates.owner;

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
        // 확장 필드를 memo에 인코딩
        const ext: ProductExtFields = {
            interestRate: product.interestRate,
            monthlyPayment: product.monthlyPayment,
            paidMonths: product.paidMonths,
            totalMonths: product.totalMonths,
            address: product.address,
        };
        const memoStr = encodeProductMemo(product.memo, ext);

        const { data, error } = await supabase
            .from('financial_products')
            .insert({
                type: product.type,
                name: product.name,
                company: product.company,
                principal: product.principal,
                current_value: product.currentValue,
                return_rate: product.returnRate,
                memo: memoStr,
                start_date: product.startDate || null,
                maturity_date: product.maturityDate || null,
                owner: product.owner || 'shared',
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
        if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
        if (updates.maturityDate !== undefined) dbUpdates.maturity_date = updates.maturityDate;
        if (updates.owner !== undefined) dbUpdates.owner = updates.owner;

        // memo 업데이트 시 확장 필드도 인코딩
        if (
            updates.memo !== undefined ||
            updates.interestRate !== undefined ||
            updates.monthlyPayment !== undefined ||
            updates.paidMonths !== undefined ||
            updates.totalMonths !== undefined ||
            updates.address !== undefined
        ) {
            const ext: ProductExtFields = {
                interestRate: updates.interestRate,
                monthlyPayment: updates.monthlyPayment,
                paidMonths: updates.paidMonths,
                totalMonths: updates.totalMonths,
                address: updates.address,
            };
            dbUpdates.memo = encodeProductMemo(updates.memo, ext);
        }

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

    // ========== Loans ==========
    const addLoan = useCallback(async (loan: Omit<LoanItem, 'id'>) => {
        const { data, error } = await supabase
            .from('loans')
            .insert({
                name: loan.name,
                bank: loan.bank,
                loan_type: loan.loanType,
                principal: loan.principal,
                remaining_principal: loan.remainingPrincipal,
                interest_rate: loan.interestRate,
                monthly_payment: loan.monthlyPayment,
                start_date: loan.startDate || null,
                end_date: loan.endDate || null,
                total_months: loan.totalMonths,
                owner: loan.owner || 'shared',
                memo: loan.memo || '',
            })
            .select()
            .single();

        if (error) { console.error('Add loan error:', error); return; }
        if (data) {
            const newLoan = toAppLoan(data);
            setLoans(prev => [...prev, newLoan]);
            return newLoan;
        }
    }, []);

    const updateLoan = useCallback(async (id: string, updates: Partial<LoanItem>) => {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.bank !== undefined) dbUpdates.bank = updates.bank;
        if (updates.loanType !== undefined) dbUpdates.loan_type = updates.loanType;
        if (updates.principal !== undefined) dbUpdates.principal = updates.principal;
        if (updates.remainingPrincipal !== undefined) dbUpdates.remaining_principal = updates.remainingPrincipal;
        if (updates.interestRate !== undefined) dbUpdates.interest_rate = updates.interestRate;
        if (updates.monthlyPayment !== undefined) dbUpdates.monthly_payment = updates.monthlyPayment;
        if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate || null;
        if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate || null;
        if (updates.totalMonths !== undefined) dbUpdates.total_months = updates.totalMonths;
        if (updates.owner !== undefined) dbUpdates.owner = updates.owner;
        if (updates.memo !== undefined) dbUpdates.memo = updates.memo || '';

        const { error } = await supabase.from('loans').update(dbUpdates).eq('id', id);
        if (error) { console.error('Update loan error:', error); return; }
        setLoans(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    }, []);

    const deleteLoan = useCallback(async (id: string) => {
        const { error } = await supabase.from('loans').delete().eq('id', id);
        if (error) { console.error('Delete loan error:', error); return; }
        setLoans(prev => prev.filter(l => l.id !== id));
    }, []);

    const getTotalLoanRemaining = useMemo(() => {
        return loans.reduce((sum, l) => sum + l.remainingPrincipal, 0);
    }, [loans]);

    const getTotalMonthlyPayment = useMemo(() => {
        return loans.reduce((sum, l) => sum + l.monthlyPayment, 0);
    }, [loans]);

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
        loans,
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

        // Loan methods
        addLoan,
        updateLoan,
        deleteLoan,
        getTotalLoanRemaining,
        getTotalMonthlyPayment,

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
