import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Wallet, Percent, Calendar, FileText, CreditCard } from 'lucide-react';
import { Modal } from './Modal';
import type { LoanItem } from '@/types';

interface LoanFormProps {
  onAdd: (loan: Omit<LoanItem, 'id'>) => void;
  onUpdate?: (id: string, loan: Partial<LoanItem>) => void;
  onClose: () => void;
  isOpen: boolean;
  editLoan?: LoanItem | null;
  partnerNames: [string, string];
}

export function LoanForm({ onAdd, onUpdate, onClose, isOpen, editLoan, partnerNames }: LoanFormProps) {
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [loanType, setLoanType] = useState<'equal_payment' | 'equal_principal'>('equal_payment');
  const [principal, setPrincipal] = useState('');
  const [remainingPrincipal, setRemainingPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalMonths, setTotalMonths] = useState('');
  const [owner, setOwner] = useState('shared');
  const [memo, setMemo] = useState('');

  const isEditing = !!editLoan;

  useEffect(() => {
    if (editLoan) {
      setName(editLoan.name);
      setBank(editLoan.bank);
      setLoanType(editLoan.loanType);
      setPrincipal(editLoan.principal.toLocaleString());
      setRemainingPrincipal(editLoan.remainingPrincipal.toLocaleString());
      setInterestRate(editLoan.interestRate.toString());
      setMonthlyPayment(editLoan.monthlyPayment.toLocaleString());
      setStartDate(editLoan.startDate || '');
      setEndDate(editLoan.endDate || '');
      setTotalMonths(editLoan.totalMonths.toString());
      setOwner(editLoan.owner || 'shared');
      setMemo(editLoan.memo || '');
    } else {
      setName('');
      setBank('');
      setLoanType('equal_payment');
      setPrincipal('');
      setRemainingPrincipal('');
      setInterestRate('');
      setMonthlyPayment('');
      setStartDate('');
      setEndDate('');
      setTotalMonths('');
      setOwner('shared');
      setMemo('');
    }
  }, [editLoan, isOpen]);

  const formatNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    return numbers ? Number(numbers).toLocaleString() : '';
  };
  const parseNum = (value: string) => Number(value.replace(/,/g, '') || 0);

  const principalNum = parseNum(principal);
  const remainingNum = parseNum(remainingPrincipal);
  const monthlyNum = parseNum(monthlyPayment);
  const rateNum = parseFloat(interestRate || '0');
  const totalMonthsNum = parseInt(totalMonths || '0');

  // 상환률: (원금 - 남은원금) / 원금
  const paidAmount = principalNum - remainingNum;
  const repayRatio = principalNum > 0 ? Math.max(0, Math.min(100, (paidAmount / principalNum) * 100)) : 0;

  // 총 이자 예상 (원리금균등 단순 계산)
  const totalPaid = monthlyNum * totalMonthsNum;
  const totalInterest = totalPaid > principalNum ? totalPaid - principalNum : 0;

  // 남은 납부 개월 추정 (남은원금 / 월납부금)
  const estimatedMonthsLeft = monthlyNum > 0 ? Math.ceil(remainingNum / monthlyNum) : 0;

  const isValid = name && bank && principalNum > 0 && remainingNum >= 0 && rateNum > 0 && monthlyNum > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const loanData: Omit<LoanItem, 'id'> = {
      name,
      bank,
      loanType,
      principal: principalNum,
      remainingPrincipal: remainingNum,
      interestRate: rateNum,
      monthlyPayment: monthlyNum,
      startDate,
      endDate,
      totalMonths: totalMonthsNum,
      owner,
      memo: memo || undefined,
    };

    if (isEditing && editLoan && onUpdate) {
      onUpdate(editLoan.id, loanData);
    } else {
      onAdd(loanData);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? '대출 수정' : '대출 추가'} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">

        {/* 소유자 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">소유자</label>
          <div className="flex gap-2">
            {['shared', partnerNames[0], partnerNames[1]].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setOwner(n)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  owner === n
                    ? 'bg-red-100 text-red-700 ring-2 ring-red-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {n === 'shared' ? '공동' : n}
              </button>
            ))}
          </div>
        </div>

        {/* 대출명 + 은행 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">대출명</label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="주택담보대출"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">은행/금융기관</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                placeholder="국민은행"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* 상환 방식 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">상환 방식</label>
          <div className="flex gap-2">
            {[
              { id: 'equal_payment', label: '원리금균등', desc: '매월 동일한 금액 납부' },
              { id: 'equal_principal', label: '원금균등', desc: '원금 고정, 이자 감소' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setLoanType(t.id as 'equal_payment' | 'equal_principal')}
                className={`flex-1 py-3 px-3 rounded-xl text-sm transition-all text-left ${
                  loanType === t.id
                    ? 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-2'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="font-semibold">{t.label}</div>
                <div className={`text-xs mt-0.5 ${loanType === t.id ? 'text-red-100' : 'text-gray-400'}`}>
                  {t.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 대출 원금 + 현재 남은 원금 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">대출 원금</label>
            <div className="relative">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={principal}
                onChange={(e) => setPrincipal(formatNumber(e.target.value))}
                placeholder="300,000,000"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">현재 남은 원금</label>
            <div className="relative">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={remainingPrincipal}
                onChange={(e) => setRemainingPrincipal(formatNumber(e.target.value))}
                placeholder="250,000,000"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* 이자율 + 월 납부금 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">연 이자율 (%)</label>
            <div className="relative">
              <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="4.50"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              월 납부금 {loanType === 'equal_principal' ? '(현재 기준)' : ''}
            </label>
            <div className="relative">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(formatNumber(e.target.value))}
                placeholder="1,500,000"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* 대출 시작일 + 만기일 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">대출 시작일</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">만기일</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* 총 납부 개월 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">총 상환 개월 수</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={totalMonths}
              onChange={(e) => setTotalMonths(e.target.value)}
              placeholder="360  (30년 = 360개월)"
              min="1"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* 상환 진행률 preview */}
        {principalNum > 0 && remainingNum >= 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-red-50 rounded-xl space-y-3"
          >
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 font-medium">상환 진행률</span>
              <span className="font-bold text-red-600">{repayRatio.toFixed(1)}%</span>
            </div>
            {/* 게이지 */}
            <div className="w-full bg-red-200 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-red-500 to-orange-400 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${repayRatio}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>
                <span className="text-gray-400">갚은 원금</span>
                <p className="font-semibold text-gray-800">{paidAmount.toLocaleString()}원</p>
              </div>
              <div>
                <span className="text-gray-400">남은 원금</span>
                <p className="font-semibold text-red-600">{remainingNum.toLocaleString()}원</p>
              </div>
              {monthlyNum > 0 && (
                <div>
                  <span className="text-gray-400">월 납부금</span>
                  <p className="font-semibold text-gray-800">{monthlyNum.toLocaleString()}원</p>
                </div>
              )}
              {estimatedMonthsLeft > 0 && (
                <div>
                  <span className="text-gray-400">남은 기간 (추정)</span>
                  <p className="font-semibold text-gray-800">약 {estimatedMonthsLeft}개월</p>
                </div>
              )}
            </div>
            {totalInterest > 0 && (
              <div className="pt-2 border-t border-red-100 flex justify-between text-xs">
                <span className="text-gray-400">총 이자 예상 (원리금균등)</span>
                <span className="font-medium text-red-500">{totalInterest.toLocaleString()}원</span>
              </div>
            )}
          </motion.div>
        )}

        {/* 메모 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">메모 (선택)</label>
          <div className="relative">
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="메모를 입력하세요"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!isValid}
          className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isEditing ? '수정하기' : '추가하기'}
        </button>
      </form>
    </Modal>
  );
}
