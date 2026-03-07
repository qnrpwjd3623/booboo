import { motion } from 'framer-motion';
import { CreditCard, Percent, Calendar, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { LoanItem } from '@/types';

interface LoanListProps {
  loans: LoanItem[];
  onEdit: (loan: LoanItem) => void;
  onDelete: (id: string) => void;
}

export function LoanList({ loans, onEdit, onDelete }: LoanListProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loans.length === 0) return null;

  const totalPrincipal   = loans.reduce((s, l) => s + l.principal, 0);
  const totalRemaining   = loans.reduce((s, l) => s + l.remainingPrincipal, 0);
  const totalMonthlyPay  = loans.reduce((s, l) => s + l.monthlyPayment, 0);
  const totalRepaid      = totalPrincipal - totalRemaining;
  const overallRatio     = totalPrincipal > 0 ? (totalRepaid / totalPrincipal) * 100 : 0;

  const loanTypeLabel: Record<string, string> = {
    equal_payment:   '원리금균등',
    equal_principal: '원금균등',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[28px] p-4 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">대출 현황</h3>
            <p className="text-xs sm:text-sm text-gray-500">{loans.length}건</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 mb-0.5">총 남은 원금</p>
          <p className="text-base sm:text-lg font-bold text-red-600">
            {totalRemaining.toLocaleString()}원
          </p>
        </div>
      </div>

      {/* 전체 상환률 게이지 */}
      <div className="mb-5 p-4 bg-red-50 rounded-2xl">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">전체 상환 진행률</span>
          <span className="font-bold text-red-600">{overallRatio.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-red-200 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-red-500 to-orange-400 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${overallRatio}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>갚은 원금: {totalRepaid.toLocaleString()}원</span>
          <span>월 납부 합계: {totalMonthlyPay.toLocaleString()}원/월</span>
        </div>
      </div>

      {/* 대출 목록 */}
      <div className="space-y-3">
        {loans.map((loan, index) => {
          const paidAmount  = loan.principal - loan.remainingPrincipal;
          const repayRatio  = loan.principal > 0
            ? Math.max(0, Math.min(100, (paidAmount / loan.principal) * 100))
            : 0;
          const isExpanded  = expanded === loan.id;

          // 만기까지 남은 개월 계산
          let monthsLeft = 0;
          if (loan.endDate) {
            const end  = new Date(loan.endDate);
            const now  = new Date();
            monthsLeft = Math.max(0,
              (end.getFullYear() - now.getFullYear()) * 12 +
              (end.getMonth() - now.getMonth())
            );
          }

          return (
            <motion.div
              key={loan.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06 }}
              className="border border-gray-100 rounded-2xl overflow-hidden"
            >
              {/* 카드 헤더 (항상 표시) */}
              <div
                className="p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : loan.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{loan.name}</p>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium shrink-0 ${
                        loan.loanType === 'equal_payment'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {loanTypeLabel[loan.loanType]}
                      </span>
                      {loan.owner !== 'shared' && (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-purple-100 text-purple-600 shrink-0">
                          {loan.owner}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-500">{loan.bank}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-red-600 text-sm sm:text-base">
                      {loan.remainingPrincipal.toLocaleString()}원
                    </p>
                    <p className="text-xs text-gray-400">남은 원금</p>
                  </div>
                  <div className="shrink-0 self-center">
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                </div>

                {/* 상환 게이지 (항상 표시) */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>상환률 {repayRatio.toFixed(1)}%</span>
                    <span>{paidAmount.toLocaleString()} / {loan.principal.toLocaleString()}원</span>
                  </div>
                  <div className="w-full bg-red-100 rounded-full h-2.5">
                    <motion.div
                      className="bg-gradient-to-r from-red-500 to-orange-400 h-2.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${repayRatio}%` }}
                      transition={{ duration: 0.7, delay: index * 0.06 }}
                    />
                  </div>
                </div>
              </div>

              {/* 카드 상세 (펼쳤을 때) */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 pb-4 bg-white border-t border-gray-100"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Percent className="w-3.5 h-3.5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">연 이자율</p>
                        <p className="text-sm font-semibold text-gray-900">{loan.interestRate}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">월 납부금</p>
                        <p className="text-sm font-semibold text-gray-900">{loan.monthlyPayment.toLocaleString()}원</p>
                      </div>
                    </div>
                    {monthsLeft > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-3.5 h-3.5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">만기까지</p>
                          <p className="text-sm font-semibold text-gray-900">약 {monthsLeft}개월</p>
                        </div>
                      </div>
                    )}
                    {loan.startDate && (
                      <div>
                        <p className="text-xs text-gray-400">시작일</p>
                        <p className="text-sm font-medium text-gray-700">{loan.startDate}</p>
                      </div>
                    )}
                    {loan.endDate && (
                      <div>
                        <p className="text-xs text-gray-400">만기일</p>
                        <p className="text-sm font-medium text-gray-700">{loan.endDate}</p>
                      </div>
                    )}
                    {loan.totalMonths > 0 && (
                      <div>
                        <p className="text-xs text-gray-400">총 상환 기간</p>
                        <p className="text-sm font-medium text-gray-700">{loan.totalMonths}개월</p>
                      </div>
                    )}
                  </div>
                  {loan.memo && (
                    <p className="mt-2 text-xs text-gray-400 bg-gray-50 rounded-lg p-2">{loan.memo}</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex gap-3">
                    <button onClick={() => onEdit(loan)} className="text-xs text-blue-500 hover:underline font-medium">
                      수정
                    </button>
                    <button onClick={() => onDelete(loan.id)} className="text-xs text-red-500 hover:underline font-medium">
                      삭제
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 합계 */}
      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">총 대출 원금</span>
          <span className="font-semibold text-gray-900">{totalPrincipal.toLocaleString()}원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">총 남은 원금</span>
          <span className="font-semibold text-red-600">{totalRemaining.toLocaleString()}원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">월 납부 합계</span>
          <span className="font-semibold text-orange-600">{totalMonthlyPay.toLocaleString()}원</span>
        </div>
      </div>
    </motion.div>
  );
}
