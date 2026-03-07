import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SummaryCards } from '@/components/SummaryCards';
import { GoalProgress } from '@/components/GoalProgress';
import { NetWorthChart } from '@/components/NetWorthChart';
import { MonthlyHeatmap } from '@/components/MonthlyHeatmap';
import { BotCard } from '@/components/BotCard';
import { StockPortfolio } from '@/components/StockPortfolio';
import { YearSelector } from '@/components/YearSelector';
import { TransactionForm } from '@/components/TransactionForm';
import { StockForm } from '@/components/StockForm';
import { FinancialProductForm } from '@/components/FinancialProductForm';
import { LoanForm } from '@/components/LoanForm';
import { LoanList } from '@/components/LoanList';
import { GoalSettingForm } from '@/components/GoalSettingForm';
import { CoupleProfileSettings, type CoupleProfile } from '@/components/CoupleProfile';
import { LoginPage } from '@/components/LoginPage';
import { useSupabaseFinanceData } from '@/hooks/useSupabaseFinanceData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/hooks/useAuth';
import { fetchMultipleStockPrices, startStockPriceAutoUpdate } from '@/services/stockApi';
import { getFinancialAdvice, getMonthlyChallenge, type FinancialContext } from '@/services/aiApi';
import { Heart, Sparkles, Wallet, TrendingUp, PiggyBank, CreditCard, Menu, X, Settings, Target, Loader2, LogOut } from 'lucide-react';
import type { Transaction, StockItem, FinancialProduct, LoanItem, BotMessage, Challenge } from '@/types';

// Generate yearly data from stored data
function generateYearlyData(
  year: number,
  transactions: Transaction[],
  stocks: StockItem[],
  products: FinancialProduct[],
  targetNetWorth: number,
  startNetWorth: number,
  monthlyTargets: Record<number, number>
) {
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthTransactions = transactions.filter(t => t.year === year && t.month === month);
    const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    let netWorth = startNetWorth;
    for (let m = 1; m <= month; m++) {
      const mTransactions = transactions.filter(t => t.year === year && t.month === m);
      const mIncome = mTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const mExpense = mTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      netWorth += (mIncome - mExpense);
    }
    const stockValue = stocks.reduce((sum, s) => sum + (s.shares * s.currentPrice), 0);
    const productValue = products.reduce((sum, p) => sum + p.currentValue, 0);
    netWorth += stockValue + productValue;

    const targetSavingsRate = monthlyTargets[month] ?? 40;

    return {
      month,
      monthName: `${month}월`,
      netWorth,
      income,
      expense,
      savingsRate,
      targetSavingsRate,
      targetAchieved: savingsRate >= targetSavingsRate,
      stockValue,
      cashValue: netWorth - stockValue - productValue,
      pensionValue: products.filter(p => p.type === 'pension').reduce((sum, p) => sum + p.currentValue, 0),
      debtValue: 0,
    };
  });

  const currentNetWorth = monthlyData[monthlyData.length - 1]?.netWorth || startNetWorth;
  const currentAmount = currentNetWorth - startNetWorth;
  const targetAmount = targetNetWorth - startNetWorth;

  let streak = 0;
  for (let i = monthlyData.length - 1; i >= 0; i--) {
    if (monthlyData[i].targetAchieved && monthlyData[i].income > 0) {
      streak++;
    } else if (monthlyData[i].income > 0) {
      break;
    }
  }

  const validMonths = monthlyData.filter(m => m.income > 0);
  const averageSavingsRate = validMonths.length > 0
    ? validMonths.reduce((sum, m) => sum + m.savingsRate, 0) / validMonths.length
    : 0;

  return {
    year,
    startNetWorth,
    currentNetWorth,
    targetNetWorth,
    targetAmount,
    currentAmount,
    averageSavingsRate,
    monthlyData,
    stocks,
    financialProducts: products,
    streak,
    challenge: null,
  };
}

const defaultProfile: CoupleProfile = {
  partner1: { name: '파트너1', avatar: '', emoji: '👨' },
  partner2: { name: '파트너2', avatar: '', emoji: '👩' },
  coupleName: '우리 가계부',
};

function App() {
  const { user, isLoading: authLoading, signIn, signOut } = useAuth();

  const [selectedYear, setSelectedYear] = useState(2025);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isGoalOpen, setIsGoalOpen] = useState(false);

  const [profile, setProfile] = useLocalStorage<CoupleProfile>('couple-profile', defaultProfile);
  const [stockPrices, setStockPrices] = useState<Record<string, { currentPrice: number }>>({});
  const [botMessage, setBotMessage] = useState<BotMessage | null>(null);
  const [monthlyChallenge, setMonthlyChallenge] = useState<Challenge | null>(null);

  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [isStockFormOpen, setIsStockFormOpen] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isLoanFormOpen, setIsLoanFormOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
  const [editingProduct, setEditingProduct] = useState<FinancialProduct | null>(null);
  const [editingLoan, setEditingLoan] = useState<LoanItem | null>(null);

  const {
    transactions,
    stocks,
    financialProducts,
    loans,
    isLoading,
    addTransaction,
    updateStock,
    deleteStock,
    addStock,
    addFinancialProduct,
    updateFinancialProduct,
    deleteFinancialProduct,
    addLoan,
    updateLoan,
    deleteLoan,
    getYearlySettings,
    updateYearlySettings,
    updateMonthlyTarget,
    getMonthlyTargets,
  } = useSupabaseFinanceData();

  const settings = getYearlySettings(selectedYear);

  const rawMonthlyTargets = getMonthlyTargets(selectedYear);
  const monthlyTargets = useMemo(() => rawMonthlyTargets, [JSON.stringify(rawMonthlyTargets)]);

  const yearlyData = useMemo(() => {
    return generateYearlyData(
      selectedYear,
      transactions,
      stocks,
      financialProducts,
      settings.targetNetWorth,
      settings.startNetWorth,
      monthlyTargets
    );
  }, [selectedYear, transactions, stocks, financialProducts, settings, monthlyTargets]);

  const currentMonth = new Date().getMonth() + 1;
  const monthsLeft = 12 - currentMonth;

  // 주식 가격 자동 업데이트
  useEffect(() => {
    if (stocks.length === 0) return;

    const tickers = stocks.map(s => s.ticker);

    // 초기 조회
    fetchMultipleStockPrices(tickers).then((prices) => {
      const priceMap: Record<string, { currentPrice: number }> = {};
      Object.entries(prices).forEach(([ticker, data]) => {
        priceMap[ticker] = { currentPrice: data.currentPrice };
      });
      setStockPrices(priceMap);
    });

    // 자동 업데이트 (5분 간격)
    const cleanup = startStockPriceAutoUpdate(tickers, (prices) => {
      const priceMap: Record<string, { currentPrice: number }> = {};
      Object.entries(prices).forEach(([ticker, data]) => {
        priceMap[ticker] = { currentPrice: data.currentPrice };
      });
      setStockPrices(priceMap);
    }, 5);

    return cleanup;
  }, [stocks]);

  // 주식 가격 업데이트
  useEffect(() => {
    if (Object.keys(stockPrices).length === 0) return;

    stocks.forEach(stock => {
      const newPrice = stockPrices[stock.ticker]?.currentPrice;
      if (newPrice && newPrice !== stock.currentPrice) {
        updateStock(stock.id, { currentPrice: newPrice });
      }
    });
  }, [stockPrices]);

  // AI 조언 & 챌린지 업데이트 (이전달 실제 데이터 활용)
  useEffect(() => {
    const stockTotal = stocks.reduce((sum, s) => sum + (s.shares * s.currentPrice), 0);
    const stockCost = stocks.reduce((sum, s) => sum + (s.shares * s.avgPrice), 0);
    const stockReturn = stockCost > 0 ? ((stockTotal - stockCost) / stockCost) * 100 : 0;

    const validMonths = yearlyData.monthlyData.filter(m => m.income > 0);
    const monthlyIncome = validMonths.length > 0 ? validMonths.reduce((sum, m) => sum + m.income, 0) / validMonths.length : 0;
    const monthlyExpense = validMonths.length > 0 ? validMonths.reduce((sum, m) => sum + m.expense, 0) / validMonths.length : 0;

    // 이전달 데이터 추출 (현재 달 기준 -1)
    const prevMonthIndex = currentMonth - 2; // 0-indexed
    const prevMonthData = prevMonthIndex >= 0 ? yearlyData.monthlyData[prevMonthIndex] : null;

    // 이전달 카테고리별 지출 집계
    const prevMonthTransactions = prevMonthData && prevMonthData.income > 0
      ? transactions.filter(t => t.year === selectedYear && t.month === currentMonth - 1 && t.type === 'expense')
      : [];

    const expenseByCategory = prevMonthTransactions.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    const context: FinancialContext = {
      currentNetWorth: yearlyData.currentNetWorth,
      targetNetWorth: yearlyData.targetNetWorth,
      progress: yearlyData.targetAmount > 0 ? (yearlyData.currentAmount / yearlyData.targetAmount) * 100 : 0,
      streak: yearlyData.streak,
      monthsLeft,
      averageSavingsRate: yearlyData.averageSavingsRate,
      monthlyIncome,
      monthlyExpense,
      stockReturn,
      totalInvestment: stockCost,
      coupleNames: [profile.partner1.name, profile.partner2.name],
      previousMonthData: prevMonthData && prevMonthData.income > 0 ? {
        income: prevMonthData.income,
        expense: prevMonthData.expense,
        savingsRate: prevMonthData.savingsRate,
        expenseByCategory: Object.entries(expenseByCategory).map(([category, amount]) => ({ category, amount })),
      } : undefined,
    };

    getFinancialAdvice(context).then((advice) => {
      setBotMessage({
        id: 'ai-' + Date.now(),
        type: advice.type,
        message: advice.message,
        emoji: advice.emoji,
      });
    });

    getMonthlyChallenge(context).then((challengeData) => {
      if (challengeData) {
        setMonthlyChallenge(challengeData);
      }
    });
  }, [yearlyData, stocks, transactions, profile, monthsLeft, selectedYear, currentMonth]);

  const handleAddTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    addTransaction(transaction);
  }, [addTransaction]);

  const handleAddStock = useCallback((stock: Omit<StockItem, 'id'>) => {
    addStock(stock);
  }, [addStock]);

  const handleUpdateStock = useCallback((id: string, updates: Partial<StockItem>) => {
    updateStock(id, updates);
    setEditingStock(null);
  }, [updateStock]);

  const handleDeleteStock = useCallback((id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteStock(id);
    }
  }, [deleteStock]);

  const handleAddProduct = useCallback((product: Omit<FinancialProduct, 'id'>) => {
    addFinancialProduct(product);
  }, [addFinancialProduct]);

  const handleUpdateProduct = useCallback((id: string, updates: Partial<FinancialProduct>) => {
    updateFinancialProduct(id, updates);
    setEditingProduct(null);
  }, [updateFinancialProduct]);

  const handleDeleteProduct = useCallback((id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteFinancialProduct(id);
    }
  }, [deleteFinancialProduct]);

  const handleAddLoan = useCallback((loan: Omit<LoanItem, 'id'>) => {
    addLoan(loan);
  }, [addLoan]);

  const handleUpdateLoan = useCallback((id: string, updates: Partial<LoanItem>) => {
    updateLoan(id, updates);
    setEditingLoan(null);
  }, [updateLoan]);

  const handleDeleteLoan = useCallback((id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteLoan(id);
    }
  }, [deleteLoan]);

  const openLoanEdit = (loan: LoanItem) => {
    setEditingLoan(loan);
    setIsLoanFormOpen(true);
  };

  const handleSaveGoal = useCallback((target: number) => {
    updateYearlySettings(selectedYear, { targetNetWorth: target });
  }, [selectedYear, updateYearlySettings]);

  const openStockEdit = (stock: StockItem) => {
    setEditingStock(stock);
    setIsStockFormOpen(true);
  };

  const openProductEdit = (product: FinancialProduct) => {
    setEditingProduct(product);
    setIsProductFormOpen(true);
  };

  // 인증 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <p className="text-gray-500 font-medium">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우 로그인 페이지 표시
  if (!user) {
    return <LoginPage onLogin={signIn} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <p className="text-gray-500 font-medium">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F5F5F7]/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-2 sm:gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <button
                onClick={() => setIsProfileOpen(true)}
                className="relative group"
              >
                <div className="flex -space-x-2">
                  {profile.partner1.avatar ? (
                    <img src={profile.partner1.avatar} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white object-cover" />
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-lg border-2 border-white">
                      {profile.partner1.emoji}
                    </div>
                  )}
                  {profile.partner2.avatar ? (
                    <img src={profile.partner2.avatar} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white object-cover" />
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-lg border-2 border-white">
                      {profile.partner2.emoji}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Settings className="w-3 h-3 text-gray-500" />
                </div>
              </button>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-gray-900">{profile.coupleName}</h1>
                <p className="hidden sm:block text-xs text-gray-500">{profile.partner1.name} 💕 {profile.partner2.name}</p>
              </div>
            </motion.div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => setIsGoalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700"
              >
                <Target className="w-4 h-4 text-orange-500" />
                목표 설정
              </button>
              <YearSelector
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
              />
              <button
                onClick={signOut}
                title="로그아웃"
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-500 hover:text-red-500"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 bg-white/80 backdrop-blur-xl"
            >
              <div className="px-4 py-4 space-y-4">
                <button
                  onClick={() => {
                    setIsGoalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm w-full"
                >
                  <Target className="w-4 h-4 text-orange-500" />
                  목표 설정
                </button>
                <YearSelector
                  selectedYear={selectedYear}
                  onYearChange={(year) => {
                    setSelectedYear(year);
                    setIsMobileMenuOpen(false);
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            <span className="text-xs sm:text-sm font-medium text-orange-500">상위 15% 부부</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            {selectedYear}년, 함께 만드는 자산 🎯
          </h2>
          <p className="text-sm sm:text-base text-gray-500">
            {profile.partner1.name}와 {profile.partner2.name}, 연속 {yearlyData.streak}개월 달성 중! 💪
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
          <motion.button
            onClick={() => setIsTransactionFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Wallet className="w-4 h-4 text-green-500" />
            <span className="hidden sm:inline">수입/지출 입력</span>
            <span className="sm:hidden">거래입력</span>
          </motion.button>
          <motion.button
            onClick={() => {
              setEditingStock(null);
              setIsStockFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">주식 추가</span>
            <span className="sm:hidden">주식</span>
          </motion.button>
          <motion.button
            onClick={() => {
              setEditingProduct(null);
              setIsProductFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PiggyBank className="w-4 h-4 text-purple-500" />
            <span className="hidden sm:inline">자산 추가</span>
            <span className="sm:hidden">자산</span>
          </motion.button>
          <motion.button
            onClick={() => {
              setEditingLoan(null);
              setIsLoanFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <CreditCard className="w-4 h-4 text-red-500" />
            <span className="hidden sm:inline">대출 추가</span>
            <span className="sm:hidden">대출</span>
          </motion.button>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 sm:mb-8">
          <SummaryCards
            currentNetWorth={yearlyData.currentNetWorth}
            targetNetWorth={yearlyData.targetNetWorth}
            averageSavingsRate={yearlyData.averageSavingsRate}
            previousNetWorth={yearlyData.monthlyData.find(m => m.month === currentMonth - 1)?.netWorth}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          <div className="lg:col-span-3">
            <GoalProgress
              currentAmount={yearlyData.currentAmount}
              targetAmount={yearlyData.targetAmount}
              streak={yearlyData.streak}
              challenge={monthlyChallenge}
              monthsLeft={monthsLeft}
            />
          </div>

          <div className="lg:col-span-5">
            <NetWorthChart
              monthlyData={yearlyData.monthlyData}
              targetNetWorth={yearlyData.targetNetWorth}
            />
          </div>

          <div className="lg:col-span-4 space-y-4 sm:space-y-6">
            <MonthlyHeatmap
              monthlyData={yearlyData.monthlyData}
              monthlyTargets={monthlyTargets}
              onUpdateTarget={(month, target) => updateMonthlyTarget(selectedYear, month, target)}
            />
            {botMessage && (
              <BotCard
                messages={[botMessage]}
                currentNetWorth={yearlyData.currentNetWorth}
                targetNetWorth={yearlyData.targetNetWorth}
                streak={yearlyData.streak}
              />
            )}
          </div>
        </div>

        {/* Stock Portfolio */}
        <div className="mt-6 sm:mt-8">
          <StockPortfolio
            stocks={stocks}
            onEdit={openStockEdit}
            onDelete={handleDeleteStock}
          />
        </div>

        {/* Financial Products */}
        {financialProducts.length > 0 && (
          <div className="mt-6 sm:mt-8">
            <FinancialProductsList
              products={financialProducts}
              onEdit={openProductEdit}
              onDelete={handleDeleteProduct}
            />
          </div>
        )}

        {/* 대출 현황 */}
        {loans.length > 0 && (
          <div className="mt-6 sm:mt-8">
            <LoanList
              loans={loans}
              onEdit={openLoanEdit}
              onDelete={handleDeleteLoan}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-8">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
          <Heart className="w-4 h-4 text-red-400" />
          <span>{profile.coupleName} - 똑똑한 자산 관리</span>
        </div>
      </footer>

      {/* Forms */}
      <TransactionForm
        year={selectedYear}
        month={currentMonth}
        onAdd={handleAddTransaction}
        onClose={() => setIsTransactionFormOpen(false)}
        isOpen={isTransactionFormOpen}
        partnerNames={[profile.partner1.name, profile.partner2.name]}
      />

      <StockForm
        onAdd={handleAddStock}
        onUpdate={handleUpdateStock}
        onClose={() => {
          setIsStockFormOpen(false);
          setEditingStock(null);
        }}
        isOpen={isStockFormOpen}
        editStock={editingStock}
        partnerNames={[profile.partner1.name, profile.partner2.name]}
      />

      <FinancialProductForm
        onAdd={handleAddProduct}
        onUpdate={handleUpdateProduct}
        onClose={() => {
          setIsProductFormOpen(false);
          setEditingProduct(null);
        }}
        isOpen={isProductFormOpen}
        editProduct={editingProduct}
        partnerNames={[profile.partner1.name, profile.partner2.name]}
      />

      <LoanForm
        onAdd={handleAddLoan}
        onUpdate={handleUpdateLoan}
        onClose={() => {
          setIsLoanFormOpen(false);
          setEditingLoan(null);
        }}
        isOpen={isLoanFormOpen}
        editLoan={editingLoan}
        partnerNames={[profile.partner1.name, profile.partner2.name]}
      />

      <GoalSettingForm
        isOpen={isGoalOpen}
        onClose={() => setIsGoalOpen(false)}
        currentTarget={settings.targetNetWorth}
        onSave={handleSaveGoal}
      />

      <CoupleProfileSettings
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onSave={setProfile}
      />
    </div>
  );
}

// Financial Products List Component
function FinancialProductsList({
  products,
  onEdit,
  onDelete
}: {
  products: FinancialProduct[];
  onEdit: (product: FinancialProduct) => void;
  onDelete: (id: string) => void;
}) {
  const typeLabels: Record<string, string> = {
    irp: 'IRP',
    isa: 'ISA',
    pension: '연금저축',
    fund: '펀드',
    deposit: '예금',
    savings: '적금',
    realestate: '부동산',
  };

  const typeColors: Record<string, string> = {
    irp: 'bg-purple-100 text-purple-600',
    isa: 'bg-blue-100 text-blue-600',
    pension: 'bg-green-100 text-green-600',
    fund: 'bg-orange-100 text-orange-600',
    deposit: 'bg-cyan-100 text-cyan-600',
    savings: 'bg-pink-100 text-pink-600',
    realestate: 'bg-amber-100 text-amber-600',
  };

  const totalPrincipal = products.reduce((sum, p) => sum + p.principal, 0);
  const totalValue = products.reduce((sum, p) => sum + p.currentValue, 0);
  const totalReturn = totalValue - totalPrincipal;
  const totalReturnRate = totalPrincipal > 0 ? (totalReturn / totalPrincipal) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[28px] p-4 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">자산 & 금융상품</h3>
            <p className="text-xs sm:text-sm text-gray-500">{products.length}개 상품</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">총 수익률</p>
          <div className={`flex items-center gap-1 ${totalReturnRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            <span className="text-base sm:text-lg font-bold">{totalReturnRate >= 0 ? '+' : ''}{totalReturnRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {products.map((product, index) => {
          const returnValue = product.currentValue - product.principal;
          const isProfit = returnValue >= 0;

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${typeColors[product.type]}`}>
                    {typeLabels[product.type]}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.company}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">{product.currentValue.toLocaleString()}원</p>
                  <p className={`text-xs ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                    {isProfit ? '+' : ''}{returnValue.toLocaleString()}원
                  </p>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-gray-200 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(product)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  수정
                </button>
                <button
                  onClick={() => onDelete(product.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  삭제
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">총 원금</span>
          <span className="font-semibold">{totalPrincipal.toLocaleString()}원</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-500">총 평가액</span>
          <span className="font-semibold">{totalValue.toLocaleString()}원</span>
        </div>
      </div>
    </motion.div>
  );
}

export default App;
