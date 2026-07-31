import { motion } from 'framer-motion';
import { CircularProgress } from './CircularProgress';
import { Flame, Target, Gauge } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { useInView } from '@/hooks/useInView';

interface GoalProgressProps {
  currentAmount: number;
  targetAmount: number;
  streak: number;
  monthsLeft: number;
  /** 최근 완료된 달들의 (수입 − 지출) 평균. 남은 달 속도 추정에 쓴다. */
  recentAvgSaving: number;
}

export function GoalProgress({
  currentAmount,
  targetAmount,
  streak,
  monthsLeft,
  recentAvgSaving,
}: GoalProgressProps) {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.2 });

  // 목표가 0이면 나눗셈이 Infinity가 되므로 막는다
  const safeTarget = targetAmount > 0 ? targetAmount : 0;
  const percentage = safeTarget > 0
    ? Math.max(0, Math.min((currentAmount / safeTarget) * 100, 100))
    : 0;
  const remainingAmount = Math.max(safeTarget - currentAmount, 0);

  // 남은 기간에 매달 필요한 금액 vs 실제로 내고 있는 속도
  const requiredPerMonth = monthsLeft > 0 ? Math.round(remainingAmount / monthsLeft) : 0;
  const projectedYearEnd = Math.round(currentAmount + recentAvgSaving * monthsLeft);
  const projectedPct = safeTarget > 0
    ? Math.max(0, Math.round((projectedYearEnd / safeTarget) * 100))
    : 0;
  const onTrack = projectedYearEnd >= safeTarget;
  const shortfallPerMonth = Math.max(0, Math.round(requiredPerMonth - recentAvgSaving));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="surface p-6"
    >
      <h3 className="section-title mb-6 flex items-center gap-2">
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

      {/* 페이스 — 목표까지 월 얼마씩 모아야 하는지, 지금 속도면 어디에 닿는지.
          퍼센트 하나만 있으면 "그래서 지금 잘하고 있나"를 알 수 없다. */}
      <motion.div
        className="rounded-2xl p-4 border"
        style={{ borderColor: 'var(--c-line)' }}
        initial={{ opacity: 0, x: -20 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Gauge className="w-4 h-4 text-[color:var(--c-accent)]" />
          <p className="text-sm font-medium text-gray-900">이 페이스로 가면</p>
        </div>

        {monthsLeft > 0 ? (
          <>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-xs text-[color:var(--c-ink-3)]">남은 {monthsLeft}개월, 매달</span>
              <span className="text-sm font-semibold text-gray-900 tabular-nums">
                {formatCurrency(requiredPerMonth)}
              </span>
            </div>
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-xs text-[color:var(--c-ink-3)]">최근 3개월 평균</span>
              <span className={`text-sm font-semibold tabular-nums ${onTrack ? 'text-[color:var(--c-gain)]' : 'text-[color:var(--c-ink-2)]'}`}>
                {formatCurrency(recentAvgSaving)}
              </span>
            </div>

            <div className="pt-3 border-t" style={{ borderColor: 'var(--c-line)' }}>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-[color:var(--c-ink-3)]">연말 예상</span>
                <span className="text-sm font-bold text-gray-900 tabular-nums">
                  {formatCurrency(projectedYearEnd)}
                </span>
              </div>
              <p className={`text-[11px] mt-1 font-medium ${onTrack ? 'text-[color:var(--c-gain)]' : 'text-[color:var(--c-warn)]'}`}>
                {onTrack
                  ? `목표의 ${projectedPct}% — 이대로면 달성`
                  : `목표의 ${projectedPct}% — 매달 ${formatCurrency(shortfallPerMonth)} 더 필요`}
              </p>
            </div>
          </>
        ) : (
          <p className="text-xs text-[color:var(--c-ink-3)] py-1">
            올해가 끝났습니다. 최종 {formatCurrency(currentAmount)} 저축.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
