import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw, Sparkles } from 'lucide-react';
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

  // 버튼 클릭 시에만 AI 코멘트 호출
  const handleRefreshComment = async () => {
    if (isLoadingComment) return;
    if (income === 0 && expense === 0) {
      setComment('이번 달 기록이 없어! 📝');
      return;
    }
    setIsLoadingComment(true);
    try {
      const c = await getPersonCharacterComment(name, income, expense, topCategories, partnerName);
      setComment(c);
    } catch {
      setComment('이번달 어떻게 됐더라... 🤔');
    } finally {
      setIsLoadingComment(false);
    }
  };

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
        {/* 말풍선 헤더: 라벨 + 새로고침 버튼 */}
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI 한마디
          </span>
          <button
            onClick={handleRefreshComment}
            disabled={isLoadingComment}
            title="AI 코멘트 새로 받기"
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all font-medium ${
              isLoadingComment
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-orange-50 text-orange-500 hover:bg-orange-100 active:scale-95'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingComment ? 'animate-spin' : ''}`} />
            {isLoadingComment ? '생성 중' : comment ? '다시' : '생성'}
          </button>
        </div>

        {/* 말풍선 본체 */}
        <div className="relative bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-700 min-h-[48px] flex items-center">
          {/* 말풍선 꼬리 */}
          <div className="absolute -top-2 left-5 w-4 h-4 bg-gray-50 rotate-45 rounded-sm" />
          {isLoadingComment ? (
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          ) : comment ? (
            <p className="leading-snug">{comment}</p>
          ) : (
            <p className="text-gray-400 text-xs leading-snug">
              위 버튼을 눌러 {name}의 이번달 한마디를 들어봐! ✨
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
