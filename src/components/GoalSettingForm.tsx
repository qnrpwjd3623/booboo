import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, PiggyBank, Calculator, Lightbulb } from 'lucide-react';
import { Modal } from './Modal';

interface GoalSettingFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentTarget: number;
  onSave: (target: number) => void;
  selectedYear?: number;
  onClearYearData?: () => void;
}

export function GoalSettingForm({ isOpen, onClose, currentTarget, onSave, selectedYear, onClearYearData }: GoalSettingFormProps) {
  const [target, setTarget] = useState(currentTarget.toString());
  const [income, setIncome] = useState('');
  const [expense, setExpense] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTarget(currentTarget.toString());
    }
  }, [isOpen, currentTarget]);

  const formatNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    return numbers ? Number(numbers).toLocaleString() : '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = Number(target.replace(/,/g, ''));
    if (targetNum > 0) {
      onSave(targetNum);
      onClose();
    }
  };

  // Calculate recommended savings based on income
  const incomeNum = Number(income.replace(/,/g, '') || 0);
  const expenseNum = Number(expense.replace(/,/g, '') || 0);
  const monthlyIncome = incomeNum / 12;
  const monthlyExpense = expenseNum / 12;
  const recommendedMonthlySavings = monthlyIncome * 0.3; // 30% savings rate
  const recommendedYearlyTarget = recommendedMonthlySavings * 12;

  const applyRecommended = () => {
    if (recommendedYearlyTarget > 0) {
      setTarget(Math.round(recommendedYearlyTarget).toString());
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="올해 목표 설정" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Target Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">올해 목표 금액</label>
          <div className="relative">
            <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(formatNumber(e.target.value))}
              placeholder="50,000,000"
              className="w-full pl-12 pr-12 py-4 bg-gray-50 rounded-xl text-2xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">원</span>
          </div>
        </div>

        {/* Calculator Toggle */}
        <button
          type="button"
          onClick={() => setShowCalculator(!showCalculator)}
          className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
        >
          <Calculator className="w-4 h-4" />
          {showCalculator ? '계산기 닫기' : '목표 계산기 사용하기'}
        </button>

        {/* Calculator */}
        <AnimatePresence>
          {showCalculator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 p-4 bg-blue-50 rounded-xl"
            >
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Lightbulb className="w-4 h-4" />
                <span>연봉과 지출을 입력하면 적정 저축 목표를 추천해드려요</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">연간 수입</label>
                  <div className="relative">
                    <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={income}
                      onChange={(e) => setIncome(formatNumber(e.target.value))}
                      placeholder="60,000,000"
                      className="w-full pl-9 pr-3 py-2 bg-white rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">연간 지출</label>
                  <div className="relative">
                    <PiggyBank className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={expense}
                      onChange={(e) => setExpense(formatNumber(e.target.value))}
                      placeholder="40,000,000"
                      className="w-full pl-9 pr-3 py-2 bg-white rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {incomeNum > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">월 수입</span>
                    <span className="font-medium">{Math.round(monthlyIncome).toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">월 지출</span>
                    <span className="font-medium">{Math.round(monthlyExpense).toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">권장 월 저축액 (30%)</span>
                    <span className="font-medium text-green-600">{Math.round(recommendedMonthlySavings).toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-blue-200">
                    <span className="text-gray-700 font-medium">추천 연간 목표</span>
                    <span className="font-bold text-blue-600">{Math.round(recommendedYearlyTarget).toLocaleString()}원</span>
                  </div>
                  <button
                    type="button"
                    onClick={applyRecommended}
                    className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    추천 목표 적용하기
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips */}
        <div className="p-4 bg-gray-50 rounded-xl space-y-2">
          <p className="text-sm font-medium text-gray-700">💡 저축 목표 설정 팁</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• 일반적으로 수입의 20~30%를 저축하는 것이 권장됩니다</li>
            <li>• 긴급자금 6개월치는 먼저 확보하세요</li>
            <li>• 연말 병수당, 퇴직금 등을 고려해서 설정하세요</li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!target || Number(target.replace(/,/g, '')) <= 0}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          목표 저장하기
        </button>
      </form>
    </Modal>
  );
}
