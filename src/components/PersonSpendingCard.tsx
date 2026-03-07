import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Transaction } from '@/types';
import { getCategoryIcon } from '@/constants/categories';
import { getPersonCharacterComment } from '@/services/aiApi';

interface PersonSpendingCardProps {
  name: string;
  emoji: string;
  transactions: Transaction[]; // 이 사람의 트랜잭션만
  partnerName: string;
  index: number; // 0 or 1 (animation delay용)
}

const CARD_GRADIENTS = [
  'from-blue-400 to-blue-600',
  'from-pink-400 to-pink-600',
];

export function PersonSpendingCard({ name, emoji, transactions, partnerName, index }: PersonSpendingCardProps) {
  const [comment, setComment] = useState<string>('');
  const [isLoadingComment, setIsLoadingComment] = useState(false);

  const income = useMemo(
    () => transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [transactions],
  );
  const expense = useMemo(
    () => transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [transactions],
  );
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  // 지출 카테고리 Top 3
  const topCategories = useMemo(() => {
    const byCategory: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
      });
    return Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, amount]) => ({ category, amount }));
  }, [transactions]);

  // AI 코멘트 fetch (income/expense 변경 시에만)
  useEffect(() => {
    if (income === 0 && expense === 0) {
      setComment('이번 달 기록이 없어! 📝');
      return;
    }
    setIsLoadingComment(true);
    getPersonCharacterComment(name, income, expense, topCategories, partnerName)
      .then((c) => setComment(c))
      .catch(() => setComment('이번달 어떻게 됐더라... 🤔'))
      .finally(() => setIsLoadingComment(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [income, expense, name, partnerName]);

  const savingsColor =
    savingsRate >= 30 ? 'text-green-500' : savingsRate >= 10 ? 'text-amber-500' : 'text-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="bg-white rounded-[24px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex-1 flex flex-col"
    >
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${CARD_GRADIENTS[index]} flex items-center justify-center text-2xl shadow-sm flex-shrink-0`}
        >
          {emoji}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-base">{name}</p>
          <p className={`text-xs font-medium ${savingsColor}`}>
            저축률 {income > 0 ? `${savingsRate.toFixed(0)}%` : '-'}
          </p>
        </div>
      </div>

      {/* 수입 / 지출 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-green-50 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            <span className="text-xs text-green-600 font-medium">수입</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {income > 0 ? `${Math.round(income / 10000).toLocaleString()}만` : '-'}
          </p>
        </div>
        <div className="bg-red-50 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs text-red-500 font-medium">지출</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {expense > 0 ? `${Math.round(expense / 10000).toLocaleString()}만` : '-'}
          </p>
        </div>
      </div>

      {/* Top 카테고리 뱃지 */}
      {topCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {topCategories.map(({ category }) => (
            <span
              key={category}
              className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full"
            >
              {getCategoryIcon(category)} {category}
            </span>
          ))}
        </div>
      )}

      {/* AI 말풍선 */}
      <div className="mt-auto">
        <div className="relative bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-700">
          {/* 말풍선 꼬리 */}
          <div className="absolute -top-2 left-5 w-4 h-4 bg-gray-50 rotate-45 rounded-sm" />
          {isLoadingComment ? (
            <div className="flex items-center gap-2 h-5">
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          ) : (
            <p className="leading-snug">{comment || '이번달 어떻게 됐더라... 🤔'}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
