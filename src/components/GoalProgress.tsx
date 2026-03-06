import { motion } from 'framer-motion';
import { CircularProgress } from './CircularProgress';
import { Flame, Target, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/data/mockData';
import type { Challenge } from '@/types';
import { useInView } from '@/hooks/useInView';

interface GoalProgressProps {
  currentAmount: number;
  targetAmount: number;
  streak: number;
  challenge: Challenge;
  monthsLeft: number;
}

export function GoalProgress({ 
  currentAmount, 
  targetAmount, 
  streak, 
  challenge,
  monthsLeft 
}: GoalProgressProps) {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.2 });
  const percentage = Math.min((currentAmount / targetAmount) * 100, 100);
  const remainingAmount = Math.max(targetAmount - currentAmount, 0);

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
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="w-4 h-4 text-blue-500" />
          <p className="text-sm font-medium text-gray-900">이번 달 챌린지</p>
        </div>
        <p className="text-sm text-gray-600 mb-3">{challenge.title}</p>
        
        {/* Challenge Progress */}
        <div className="relative">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={isInView ? { width: `${(challenge.currentReduction / challenge.targetReduction) * 100}%` } : {}}
              transition={{ duration: 1, delay: 1 }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500">현재 {challenge.currentReduction}%</span>
            <span className="text-xs text-gray-500">목표 {challenge.targetReduction}%</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
