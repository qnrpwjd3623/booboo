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
      /* h-full로 옆 칼럼과 같은 높이를 쓰고, 남는 세로 공간은 가운데 링 영역이
         먹는다. 아래쪽에 빈칸으로 남기면 카드가 잘린 것처럼 보인다. */
      className="surface p-6 h-full flex flex-col"
    >
      <h3 className="section-title mb-4 flex items-center gap-2">
        <Target className="w-[18px] h-[18px] text-[color:var(--c-accent)]" />
        연간 목표 달성률
      </h3>

      {/* 링 + 남은 금액 — 여분의 높이를 흡수하는 구간 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 py-2">
        <CircularProgress
          percentage={percentage}
          size={180}
          strokeWidth={14}
          color="#007AFF"
          delay={300}
        />

        <div className="text-center">
          <p className="text-[13px] text-[color:var(--c-ink-3)] mb-1">남은 금액</p>
          <motion.p
            className="text-2xl font-bold text-gray-900 tabular-nums"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.8 }}
          >
            {formatCurrency(remainingAmount)}
          </motion.p>
          <motion.p
            className="text-[12px] text-[color:var(--c-ink-3)] mt-1"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1 }}
          >
            {monthsLeft > 0 ? `올해 ${monthsLeft}개월 남음` : '올해 마감'}
          </motion.p>
        </div>
      </div>

      {/* 하단 두 블록 — 카드 바닥에 붙는다. 같은 헤어라인 패널로 통일해서
          위 링 영역과 층이 나뉘어 보이게 한다. */}
      <div className="space-y-3 pt-5 mt-1 border-t" style={{ borderColor: 'var(--c-line)' }}>
        {/* 연속 달성 */}
        <motion.div
          className="flex items-center justify-between rounded-2xl border px-4 py-3"
          style={{ borderColor: 'var(--c-line)' }}
          initial={{ opacity: 0, x: -12 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Flame className="w-[18px] h-[18px] text-orange-500" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-gray-900 leading-tight">연속 달성</p>
              <p className="text-[11px] text-[color:var(--c-ink-3)] leading-tight mt-0.5">
                월 저축 목표를 넘긴 달
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <motion.span
              className="text-xl font-bold text-orange-500 tabular-nums"
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ delay: 0.8, type: 'spring' }}
            >
              {streak}
            </motion.span>
            <span className="text-[12px] text-[color:var(--c-ink-3)] ml-1">개월</span>
          </div>
        </motion.div>

        {/* 페이스 — 퍼센트 하나로는 "지금 잘하고 있나"를 알 수 없다.
            남은 달에 필요한 금액과 실제 속도를 나란히 두고 판정까지 낸다. */}
        <motion.div
          className="rounded-2xl border px-4 py-3"
          style={{ borderColor: 'var(--c-line)' }}
          initial={{ opacity: 0, x: -12 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.75 }}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <Gauge className="w-[15px] h-[15px] text-[color:var(--c-accent)]" />
            <p className="text-[13px] font-medium text-gray-900">이 페이스로 가면</p>
          </div>

          {monthsLeft > 0 ? (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] text-[color:var(--c-ink-3)]">매달 필요</span>
                <span className="text-[13px] font-semibold text-gray-900 tabular-nums">
                  {formatCurrency(requiredPerMonth)}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-[12px] text-[color:var(--c-ink-3)]">최근 3개월 평균</span>
                <span className={`text-[13px] font-semibold tabular-nums ${onTrack ? 'text-[color:var(--c-gain)]' : 'text-[color:var(--c-ink-2)]'}`}>
                  {formatCurrency(recentAvgSaving)}
                </span>
              </div>

              <div className="mt-2.5 pt-2.5 border-t" style={{ borderColor: 'var(--c-line)' }}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[12px] text-[color:var(--c-ink-3)]">연말 예상</span>
                  <span className="text-[13px] font-bold text-gray-900 tabular-nums">
                    {formatCurrency(projectedYearEnd)}
                  </span>
                </div>
                <p className={`text-[11px] mt-1 font-medium ${onTrack ? 'text-[color:var(--c-gain)]' : 'text-[color:var(--c-warn)]'}`}>
                  {onTrack
                    ? `목표의 ${projectedPct}% · 이대로면 달성`
                    : `목표의 ${projectedPct}% · 매달 ${formatCurrency(shortfallPerMonth)} 더 필요`}
                </p>
              </div>
            </>
          ) : (
            <p className="text-[12px] text-[color:var(--c-ink-3)]">
              올해 최종 {formatCurrency(currentAmount)} 저축.
            </p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
