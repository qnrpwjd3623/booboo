import { useState } from 'react';
import { motion } from 'framer-motion';
import { CircularProgress } from './CircularProgress';
import { Flame, Loader2, RefreshCw, Target, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import type { Challenge } from '@/types';
import { useInView } from '@/hooks/useInView';

interface GoalProgressProps {
  currentAmount: number;
  targetAmount: number;
  streak: number;
  challenge: (Challenge & { prevMonthAmount?: number; thisMonthAmount?: number }) | null;
  prevMonthAmount: number;
  thisMonthAmount: number;
  monthsLeft: number;
  onRefreshChallenge?: () => void;
  isLoadingChallenge?: boolean;
}

export function GoalProgress({
  currentAmount,
  targetAmount,
  streak,
  challenge,
  prevMonthAmount,
  thisMonthAmount,
  monthsLeft,
  onRefreshChallenge,
  isLoadingChallenge = false,
}: GoalProgressProps) {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.2 });
  const [showTooltip, setShowTooltip] = useState(false);
  const percentage = Math.min((currentAmount / targetAmount) * 100, 100);
  const remainingAmount = Math.max(targetAmount - currentAmount, 0);

  // 진행률 계산
  const progressPct = challenge && challenge.targetReduction > 0
    ? Math.min((challenge.currentReduction / challenge.targetReduction) * 100, 100)
    : 0;

  // 절감액
  const savedAmount = prevMonthAmount > 0 ? Math.max(0, prevMonthAmount - thisMonthAmount) : 0;

  // 진행률에 따른 색상
  const barColor = progressPct >= 100
    ? 'from-green-400 to-emerald-500'
    : progressPct >= 50
    ? 'from-blue-400 to-purple-500'
    : 'from-orange-300 to-orange-400';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-[28px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] h-full"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Target className="w-5 h-5 text-blue-500" />
        연간 목표 달성률
      </h3>

      {/* Circular Progress */}
      <div className="flex justify-center mb-6">
        <CircularProgress
          percentage={percentage}
          size={180}
          strokeWidth={14}
          color="#007AFF"
          delay={300}
        />
      </div>

      {/* Remaining Amount */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500 mb-1">남은 금액</p>
        <motion.p
          className="text-2xl font-bold text-gray-900"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
        >
          {formatCurrency(remainingAmount)}
        </motion.p>
        <motion.p
          className="text-xs text-orange-500 mt-1 font-medium"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1 }}
        >
          올해 목표 달성까지 {monthsLeft}개월 남음 ⏰
        </motion.p>
      </div>

      {/* Streak */}
      <motion.div
        className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 mb-4"
        initial={{ opacity: 0, x: -20 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">연속 달성</p>
              <p className="text-xs text-gray-500">목표를 꾸준히 달성 중!</p>
            </div>
          </div>
          <div className="text-right">
            <motion.span
              className="text-2xl font-bold text-orange-500"
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ delay: 0.8, type: "spring" }}
            >
              {streak}
            </motion.span>
            <span className="text-sm text-gray-500 ml-1">개월</span>
          </div>
        </div>
      </motion.div>

      {/* Challenge */}
      <motion.div
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4"
        initial={{ opacity: 0, x: -20 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ delay: 0.8 }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-blue-500" />
            <p className="text-sm font-medium text-gray-900">이번 달 챌린지</p>
          </div>
          <button
            onClick={onRefreshChallenge}
            disabled={isLoadingChallenge}
            className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="챌린지 새로 받기"
          >
            {isLoadingChallenge
              ? <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
              : <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
            }
          </button>
        </div>

        {challenge ? (
          <>
            {/* 제목 + 카테고리 뱃지 */}
            <div className="flex items-start gap-2 mb-3">
              <span className="flex-shrink-0 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[10px] font-semibold mt-0.5">
                {challenge.category}
              </span>
              <p className="text-xs text-gray-600 leading-relaxed">{challenge.title}</p>
            </div>

            {/* 프로그레스바 + 툴팁 */}
            <div
              className="relative"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              {/* 툴팁 */}
              {showTooltip && (
                <div className="absolute bottom-full left-0 right-0 mb-2 z-10">
                  <div className="bg-gray-900 text-white text-xs rounded-xl p-3 shadow-lg">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-gray-400">지난달 {challenge.category} 지출</span>
                      <span className="font-semibold text-orange-300">
                        {prevMonthAmount > 0 ? `${prevMonthAmount.toLocaleString()}원` : '데이터 없음'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-gray-400">이번달 {challenge.category} 지출</span>
                      <span className="font-semibold text-blue-300">
                        {thisMonthAmount > 0 ? `${thisMonthAmount.toLocaleString()}원` : '아직 없음'}
                      </span>
                    </div>
                    {prevMonthAmount > 0 && (
                      <div className="flex justify-between items-center pt-1.5 border-t border-gray-700">
                        <span className="text-gray-400">절감액</span>
                        <span className={`font-bold ${savedAmount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {savedAmount >= 0 ? '+' : ''}{savedAmount.toLocaleString()}원
                        </span>
                      </div>
                    )}
                    {/* 말풍선 꼬리 */}
                    <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-gray-900 rotate-45" />
                  </div>
                </div>
              )}

              {/* 바 */}
              <div className="h-3 bg-white/60 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${barColor} rounded-full`}
                  initial={{ width: 0 }}
                  animate={isInView ? { width: `${progressPct}%` } : {}}
                  transition={{ duration: 1, delay: 1 }}
                />
              </div>

              {/* 수치 */}
              <div className="flex justify-between mt-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-gray-500">현재</span>
                  <span className={`text-[11px] font-semibold ${challenge.currentReduction >= challenge.targetReduction ? 'text-green-500' : 'text-blue-500'}`}>
                    {challenge.currentReduction}% 절감
                  </span>
                </div>
                <span className="text-[11px] text-gray-400">목표 {challenge.targetReduction}%</span>
              </div>
            </div>

            {/* 달성 여부 */}
            {challenge.currentReduction >= challenge.targetReduction && (
              <p className="text-xs text-green-600 font-medium text-center mt-2">
                🎉 챌린지 달성! 대단해!
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-400 text-center py-2">
            {isLoadingChallenge ? 'AI가 이번 달 챌린지를 만들고 있어요... 🤖' : '챌린지를 불러오는 중...'}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
