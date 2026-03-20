import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Pencil, Trash2, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ImagePlus, ArrowUp, ArrowDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { Transaction, CustomCategory } from '@/types';
import { getCategoryIcon } from '@/constants/categories';
import { PersonSpendingCard } from './PersonSpendingCard';
import { ImageImportModal } from './ImageImportModal';

const CHART_COLORS = [
  '#FF6B6B','#FF9F43','#FECA57','#48DBFB','#1DD1A1',
  '#5F27CD','#FF9FF3','#54A0FF','#01CBC6','#C8D6E5',
  '#EE5A24','#0652DD','#9980FA','#FDA7DF','#D980FA',
];

interface MonthlyTransactionViewProps {
  year: number;
  month: number;
  transactions: Transaction[];
  customCategories: CustomCategory[];
  onBack: () => void;
  onNavigate: (year: number, month: number) => void;
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onBatchAddTransactions: (txns: Omit<Transaction, 'id'>[]) => Promise<void>;
  partnerNames: [string, string];
  partnerEmojis: [string, string];
}

const MONTH_NAMES = [
  '1월','2월','3월','4월','5월','6월',
  '7월','8월','9월','10월','11월','12월',
];

export function MonthlyTransactionView({
  year,
  month,
  transactions,
  onBack,
  onNavigate,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onBatchAddTransactions,
  partnerNames,
  partnerEmojis,
  customCategories,
}: MonthlyTransactionViewProps) {
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [activeChartIndex, setActiveChartIndex] = useState<number | null>(null);
  const [isImageImportOpen, setIsImageImportOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const handleSortClick = (type: 'date' | 'amount') => {
    if (sortBy === type) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(type);
      setSortDir('desc');
    }
  };

  // 이 달 트랜잭션만
  const monthTxns = transactions.filter((t) => t.year === year && t.month === month);

  // 전체 합계
  const totalIncome = monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  // 개인별 트랜잭션 (PersonSpendingCard용 — 각자 것만)
  const partner1Txns = monthTxns.filter((t) => t.owner === partnerNames[0]);
  const partner2Txns = monthTxns.filter((t) => t.owner === partnerNames[1]);

  // 목록 필터 + 정렬
  const filteredTxns = monthTxns
    .filter((t) => {
      if (filterOwner === 'all') return true;
      if (filterOwner === 'shared') return t.owner === 'shared';
      return t.owner === filterOwner;
    })
    .sort((a, b) => {
      const dir = sortDir === 'desc' ? -1 : 1;
      if (sortBy === 'amount') return dir * (a.amount - b.amount);
      return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
    });

  const filterTabs = [
    { id: 'all', label: '전체' },
    { id: partnerNames[0], label: partnerNames[0] },
    { id: partnerNames[1], label: partnerNames[1] },
    { id: 'shared', label: '공동' },
  ];

  // 카테고리 요약: 공동/전체 탭은 두 사람 합산, 개인 탭은 해당 사람만
  const summaryScopeLabel = filterOwner === 'shared' ? '합산' : filterOwner === 'all' ? '합산' : filterOwner;
  const summaryTxns =
    filterOwner === 'all' || filterOwner === 'shared'
      ? monthTxns
      : monthTxns.filter((t) => t.owner === filterOwner);
  const expenseByCategory = summaryTxns
    .filter((t) => t.type === 'expense')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
  const sortedExpenseCategories = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);

  const savingsColor =
    savingsRate >= 30
      ? 'text-green-500'
      : savingsRate >= 10
      ? 'text-amber-500'
      : 'text-red-500';

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* 서브 헤더 */}
      <div className="sticky top-0 z-20 bg-[#F5F5F7]/90 backdrop-blur-xl border-b border-gray-200/40 px-4 py-3">
        <div className="max-w-[1200px] mx-auto flex items-center gap-3">
          {/* 뒤로가기 */}
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white shadow-sm hover:shadow-md transition-all flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* 중앙: 이전달 ← 타이틀 → 다음달 */}
          <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
            <button
              onClick={() => {
                if (month === 1) onNavigate(year - 1, 12);
                else onNavigate(year, month - 1);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white shadow-sm hover:shadow-md hover:bg-orange-50 hover:text-orange-500 text-gray-500 transition-all flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center min-w-0">
              <h2 className="text-base font-bold text-gray-900 truncate">
                {year}년 {MONTH_NAMES[month - 1]} 가계부
              </h2>
              <p className="text-xs text-gray-400">거래 {monthTxns.length}건</p>
            </div>
            <button
              onClick={() => {
                if (month === 12) onNavigate(year + 1, 1);
                else onNavigate(year, month + 1);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white shadow-sm hover:shadow-md hover:bg-orange-50 hover:text-orange-500 text-gray-500 transition-all flex-shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 우측 버튼 그룹 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 이미지로 가져오기 */}
            <button
              onClick={() => setIsImageImportOpen(true)}
              title="이미지로 가져오기"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white shadow-sm hover:shadow-md hover:bg-orange-50 hover:text-orange-500 text-gray-500 transition-all"
            >
              <ImagePlus className="w-4 h-4" />
            </button>

            {/* 거래 추가 */}
            <button
              onClick={onAddTransaction}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-xl font-semibold text-sm shadow-sm hover:bg-orange-600 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              거래 추가
            </button>
          </div>
        </div>
      </div>

      {/* 이미지 가져오기 모달 */}
      <ImageImportModal
        isOpen={isImageImportOpen}
        onClose={() => setIsImageImportOpen(false)}
        year={year}
        month={month}
        partnerNames={partnerNames}
        customCategories={customCategories}
        onImport={onBatchAddTransactions}
      />

      <div className="max-w-[1200px] mx-auto px-4 py-6 space-y-5">
        {/* 이달 요약 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[24px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.05)]"
        >
          <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">이달 요약</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-gray-400">총 수입</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {totalIncome > 0 ? `${Math.round(totalIncome / 10000).toLocaleString()}만` : '-'}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-gray-400">총 지출</span>
              </div>
              <p className="text-xl font-bold text-red-500">
                {totalExpense > 0 ? `${Math.round(totalExpense / 10000).toLocaleString()}만` : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">저축률</p>
              <p className={`text-xl font-bold ${savingsColor}`}>
                {totalIncome > 0 ? `${savingsRate.toFixed(0)}%` : '-'}
              </p>
              {totalIncome > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {Math.round((totalIncome - totalExpense) / 10000).toLocaleString()}만원
                </p>
              )}
            </div>
          </div>
          {/* 저축률 바 */}
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(savingsRate, 100)}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          </div>
        </motion.div>

        {/* 개인 소비 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PersonSpendingCard
            name={partnerNames[0]}
            emoji={partnerEmojis[0]}
            transactions={partner1Txns}
            partnerName={partnerNames[1]}
            index={0}
            year={year}
            month={month}
          />
          <PersonSpendingCard
            name={partnerNames[1]}
            emoji={partnerEmojis[1]}
            transactions={partner2Txns}
            partnerName={partnerNames[0]}
            index={1}
            year={year}
            month={month}
          />
        </div>

        {/* 거래 내역 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-[24px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.05)]"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">거래 내역</h3>
          </div>

          {/* 카테고리별 지출 합산 */}
          {sortedExpenseCategories.length > 0 && (
            <div className="mb-4 pb-4 border-b border-gray-100">
              <p className="text-xs text-gray-400 mb-3">
                카테고리별 지출 <span className="text-gray-300">({summaryScopeLabel})</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {/* 도넛 차트 */}
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                  <div className="relative w-36 h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sortedExpenseCategories.map(([cat, amt]) => ({ name: cat, value: amt }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={62}
                          paddingAngle={2}
                          dataKey="value"
                          strokeWidth={0}
                          onMouseEnter={(_, i) => setActiveChartIndex(i)}
                          onMouseLeave={() => setActiveChartIndex(null)}
                        >
                          {sortedExpenseCategories.map((_, i) => (
                            <Cell
                              key={i}
                              fill={CHART_COLORS[i % CHART_COLORS.length]}
                              opacity={activeChartIndex === null || activeChartIndex === i ? 1 : 0.4}
                              style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* 중앙: 호버 시 카테고리 정보, 기본은 총 지출 */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      {activeChartIndex !== null && sortedExpenseCategories[activeChartIndex] ? (
                        <>
                          <span className="text-xs text-gray-500 font-medium">
                            {getCategoryIcon(sortedExpenseCategories[activeChartIndex][0])} {sortedExpenseCategories[activeChartIndex][0]}
                          </span>
                          <span className="text-sm font-bold text-red-500">
                            {sortedExpenseCategories[activeChartIndex][1] >= 10000
                              ? `${Math.round(sortedExpenseCategories[activeChartIndex][1] / 10000).toLocaleString()}만`
                              : `${sortedExpenseCategories[activeChartIndex][1].toLocaleString()}원`}
                          </span>
                          <span className="text-xs text-gray-400">
                            {((sortedExpenseCategories[activeChartIndex][1] / totalExpense) * 100).toFixed(0)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-gray-400">총 지출</span>
                          <span className="text-sm font-bold text-gray-800">
                            {Math.round(totalExpense / 10000).toLocaleString()}만
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 카테고리 칩 목록 */}
                <div className="flex flex-wrap gap-2 flex-1">
                  {sortedExpenseCategories.map(([cat, amount], i) => (
                    <div key={cat} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-xl">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="text-sm">{getCategoryIcon(cat)}</span>
                      <span className="text-xs text-gray-600 font-medium">{cat}</span>
                      <span className="text-xs font-bold text-red-500">
                        {amount >= 10000
                          ? `${Math.round(amount / 10000).toLocaleString()}만`
                          : `${amount.toLocaleString()}원`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 필터 탭 + 정렬 */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterOwner(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterOwner === tab.id
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {/* 정렬 버튼 */}
            <div className="flex items-center gap-1 ml-auto">
              {(['date', 'amount'] as const).map((type) => {
                const isActive = sortBy === type;
                const label = type === 'date' ? '날짜순' : '금액순';
                return (
                  <button
                    key={type}
                    onClick={() => handleSortClick(type)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gray-800 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                    <motion.span
                      key={isActive ? sortDir : 'inactive'}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="inline-flex"
                    >
                      {isActive ? (
                        sortDir === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                      ) : null}
                    </motion.span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 목록 */}
          {filteredTxns.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-sm text-gray-400 mb-1">아직 거래 내역이 없어요</p>
              <button
                onClick={onAddTransaction}
                className="mt-2 text-sm text-orange-500 font-semibold hover:underline"
              >
                첫 거래 추가하기
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <AnimatePresence initial={false}>
                {filteredTxns.map((txn, i) => (
                  <TransactionItem
                    key={`${txn.id}-${sortBy}-${sortDir}-${filterOwner}`}
                    transaction={txn}
                    index={i}
                    onEdit={() => onEditTransaction(txn)}
                    onDelete={() => {
                      if (confirm('이 거래를 삭제하시겠습니까?')) {
                        onDeleteTransaction(txn.id);
                      }
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ─── 개별 거래 아이템 ───────────────────────────────────────────────────────
function TransactionItem({
  transaction,
  index,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const icon = getCategoryIcon(transaction.category);
  const isIncome = transaction.type === 'income';
  const isShared = transaction.owner === 'shared';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
      transition={{
        duration: 0.38,
        delay: Math.min(index * 0.055, 0.5),
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-gray-50 transition-colors"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 카테고리 아이콘 */}
      <div className="w-10 h-10 flex-shrink-0 bg-gray-100 rounded-2xl flex items-center justify-center text-lg">
        {icon}
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-semibold text-gray-900 text-sm truncate">{transaction.category}</p>
          {isShared ? (
            <span className="text-xs bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full flex-shrink-0">
              공동
            </span>
          ) : (
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full flex-shrink-0">
              {transaction.owner}
            </span>
          )}
        </div>
        {transaction.description && (
          <p className="text-xs text-gray-400 truncate">{transaction.description}</p>
        )}
        <p className="text-xs text-gray-300">{transaction.date}</p>
      </div>

      {/* 액션 버튼 + 금액 */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.12 }}
              className="flex gap-0.5"
            >
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className={`font-bold text-sm ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
          {isIncome ? '+' : '-'}{transaction.amount.toLocaleString()}원
        </p>
      </div>
    </motion.div>
  );
}
