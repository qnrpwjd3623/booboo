import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Wallet, Percent, Calendar, FileText, CreditCard, Clock } from 'lucide-react';
import { Modal } from './Modal';
import type { LoanItem } from '@/types';

// ─── 자동계산 함수 ───────────────────────────────────────────

/** 원리금균등 월 납부금 */
function calcEqualPayment(p: number, r: number, n: number): number {
  if (n <= 0 || p <= 0) return 0;
  if (r === 0) return Math.round(p / n);
  const f = Math.pow(1 + r, n);
  return Math.round(p * r * f / (f - 1));
}

/** 원금균등 k번째 납부 후 월 납부금 */
function calcEqualPrincipalPayment(p: number, r: number, n: number, k: number): number {
  if (n <= 0 || p <= 0) return 0;
  const remaining = p * (1 - Math.min(k, n) / n);
  return Math.round(p / n + remaining * r);
}

/** 원리금균등 k번 납부 후 남은 원금 */
function calcRemainingEqual(p: number, r: number, n: number, k: number): number {
  if (k <= 0) return p;
  if (k >= n) return 0;
  if (r === 0) return Math.max(0, Math.round(p * (1 - k / n)));
  const f = Math.pow(1 + r, n);
  return Math.max(0, Math.round(p * (f - Math.pow(1 + r, k)) / (f - 1)));
}

/** 원금균등 k번 납부 후 남은 원금 */
function calcRemainingEqualPrincipal(p: number, n: number, k: number): number {
  if (k <= 0) return p;
  if (k >= n) return 0;
  return Math.max(0, Math.round(p * (1 - k / n)));
}

// ─────────────────────────────────────────────────────────────

interface LoanFormProps {
  onAdd: (loan: Omit<LoanItem, 'id'>) => void;
  onUpdate?: (id: string, loan: Partial<LoanItem>) => void;
  onClose: () => void;
  isOpen: boolean;
  editLoan?: LoanItem | null;
  partnerNames: [string, string];
}

export function LoanForm({ onAdd, onUpdate, onClose, isOpen, editLoan, partnerNames }: LoanFormProps) {
  const [name,          setName]          = useState('');
  const [bank,          setBank]          = useState('');
  const [loanType,      setLoanType]      = useState<'equal_payment' | 'equal_principal'>('equal_payment');
  const [principal,     setPrincipal]     = useState('');
  const [interestRate,  setInterestRate]  = useState('');
  const [duration,      setDuration]      = useState('');
  const [durationUnit,  setDurationUnit]  = useState<'years' | 'months'>('years');
  const [startDate,     setStartDate]     = useState('');
  const [owner,         setOwner]         = useState('shared');
  const [memo,          setMemo]          = useState('');
  const [hasGracePeriod,    setHasGracePeriod]    = useState(false);
  const [gracePeriodMonths, setGracePeriodMonths] = useState('');

  const isEditing = !!editLoan;

  useEffect(() => {
    if (editLoan) {
      setName(editLoan.name);
      setBank(editLoan.bank);
      setLoanType(editLoan.loanType);
      setPrincipal(editLoan.principal.toLocaleString());
      setInterestRate(editLoan.interestRate.toString());
      // totalMonths → 년/월 변환 (12 배수면 년으로)
      if (editLoan.totalMonths > 0 && editLoan.totalMonths % 12 === 0) {
        setDuration((editLoan.totalMonths / 12).toString());
        setDurationUnit('years');
      } else {
        setDuration(editLoan.totalMonths.toString());
        setDurationUnit('months');
      }
      setStartDate(editLoan.startDate || '');
      setOwner(editLoan.owner || 'shared');
      setMemo(editLoan.memo || '');
      setHasGracePeriod(editLoan.hasGracePeriod || false);
      setGracePeriodMonths(editLoan.gracePeriodMonths > 0 ? editLoan.gracePeriodMonths.toString() : '');
    } else {
      setName(''); setBank(''); setLoanType('equal_payment');
      setPrincipal(''); setInterestRate('');
      setDuration(''); setDurationUnit('years');
      setStartDate(''); setOwner('shared'); setMemo('');
      setHasGracePeriod(false); setGracePeriodMonths('');
    }
  }, [editLoan, isOpen]);

  // ─── 파싱 ───
  const formatNumber = (v: string) => {
    const n = v.replace(/[^0-9]/g, '');
    return n ? Number(n).toLocaleString() : '';
  };
  const parseNum = (v: string) => Number(v.replace(/,/g, '') || 0);

  const principalNum        = parseNum(principal);
  const rateNum             = parseFloat(interestRate || '0');
  const durationNum         = parseFloat(duration || '0');
  const gracePeriodMonthsNum = parseInt(gracePeriodMonths || '0');

  // ─── 파생 계산 ───
  const totalMonthsNum = durationUnit === 'years'
    ? Math.round(durationNum * 12)
    : Math.round(durationNum);

  const repayMonths = hasGracePeriod
    ? Math.max(0, totalMonthsNum - gracePeriodMonthsNum)
    : totalMonthsNum;

  const monthlyRate        = rateNum / 100 / 12;
  const monthlyInterestOnly = principalNum > 0 && monthlyRate > 0
    ? Math.round(principalNum * monthlyRate)
    : 0;

  // 상환 기간 경과 개월 (시작일 기준)
  let repayElapsed = 0;
  if (startDate) {
    const start = new Date(startDate);
    const now   = new Date();
    const total = Math.max(0,
      (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
    );
    repayElapsed = hasGracePeriod ? Math.max(0, total - gracePeriodMonthsNum) : total;
  }
  const repayElapsedCapped = Math.min(repayElapsed, repayMonths);

  // 월 납부금 자동계산
  let calculatedMonthlyPayment = 0;
  if (principalNum > 0 && repayMonths > 0) {
    if (loanType === 'equal_payment') {
      calculatedMonthlyPayment = calcEqualPayment(principalNum, monthlyRate, repayMonths);
    } else {
      const k = Math.min(repayElapsed, Math.max(0, repayMonths - 1));
      calculatedMonthlyPayment = calcEqualPrincipalPayment(principalNum, monthlyRate, repayMonths, k);
    }
  }

  // 남은 원금 자동계산
  let calculatedRemainingPrincipal = principalNum;
  if (principalNum > 0 && repayMonths > 0 && repayElapsedCapped > 0) {
    if (loanType === 'equal_payment') {
      calculatedRemainingPrincipal = calcRemainingEqual(principalNum, monthlyRate, repayMonths, repayElapsedCapped);
    } else {
      calculatedRemainingPrincipal = calcRemainingEqualPrincipal(principalNum, repayMonths, repayElapsedCapped);
    }
  }

  // 만기일 자동계산
  let calculatedEndDate = '';
  if (startDate && totalMonthsNum > 0) {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + totalMonthsNum);
    calculatedEndDate = d.toISOString().split('T')[0];
  }

  // 상환 진행률
  const paidAmount  = principalNum - calculatedRemainingPrincipal;
  const repayRatio  = principalNum > 0 ? Math.max(0, Math.min(100, (paidAmount / principalNum) * 100)) : 0;

  // 총 이자 예상
  const graceInterest = hasGracePeriod ? monthlyInterestOnly * gracePeriodMonthsNum : 0;
  const repayInterest = loanType === 'equal_payment' && calculatedMonthlyPayment > 0 && repayMonths > 0
    ? Math.max(0, calculatedMonthlyPayment * repayMonths - principalNum)
    : 0;
  const totalInterest = graceInterest + repayInterest;

  // 현재 거치 기간 중인지
  let isCurrentlyInGracePeriod = false;
  if (hasGracePeriod && gracePeriodMonthsNum > 0 && startDate) {
    const graceEnd = new Date(startDate);
    graceEnd.setMonth(graceEnd.getMonth() + gracePeriodMonthsNum);
    isCurrentlyInGracePeriod = new Date() < graceEnd;
  }

  const showPreview = principalNum > 0 && rateNum > 0 && totalMonthsNum > 0;
  const isValid = !!(name && bank && principalNum > 0 && rateNum > 0 && totalMonthsNum > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const loanData: Omit<LoanItem, 'id'> = {
      name, bank, loanType,
      principal: principalNum,
      remainingPrincipal: calculatedRemainingPrincipal,
      interestRate: rateNum,
      monthlyPayment: calculatedMonthlyPayment,
      startDate,
      endDate: calculatedEndDate,
      totalMonths: totalMonthsNum,
      owner,
      memo: memo || undefined,
      hasGracePeriod,
      gracePeriodMonths: hasGracePeriod ? gracePeriodMonthsNum : 0,
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
                key={n} type="button" onClick={() => setOwner(n)}
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
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="주택담보대출"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">은행/금융기관</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={bank} onChange={(e) => setBank(e.target.value)}
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
              { id: 'equal_payment',   label: '원리금균등', desc: '매월 동일한 금액 납부' },
              { id: 'equal_principal', label: '원금균등',   desc: '원금 고정, 이자 감소' },
            ].map((t) => (
              <button
                key={t.id} type="button"
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

        {/* 거치 여부 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">거치 여부</label>
          <div className="flex gap-2">
            {[
              { val: false, label: '비거치', desc: '처음부터 원금+이자 납부' },
              { val: true,  label: '거치',   desc: '거치 기간엔 이자만 납부' },
            ].map((t) => (
              <button
                key={String(t.val)} type="button"
                onClick={() => setHasGracePeriod(t.val)}
                className={`flex-1 py-3 px-3 rounded-xl text-sm transition-all text-left ${
                  hasGracePeriod === t.val
                    ? 'bg-amber-500 text-white ring-2 ring-amber-500 ring-offset-2'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="font-semibold">{t.label}</div>
                <div className={`text-xs mt-0.5 ${hasGracePeriod === t.val ? 'text-amber-100' : 'text-gray-400'}`}>
                  {t.desc}
                </div>
              </button>
            ))}
          </div>

          {/* 거치기간 입력 */}
          <AnimatePresence>
            {hasGracePeriod && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 relative flex items-center bg-amber-50 rounded-xl border border-amber-200 focus-within:ring-2 focus-within:ring-amber-500/30 focus-within:bg-white transition-all">
                  {/* 아이콘 */}
                  <Clock className="shrink-0 w-4 h-4 text-amber-500 ml-3.5" />
                  {/* 숫자 입력 */}
                  <input
                    type="number"
                    value={gracePeriodMonths}
                    onChange={(e) => setGracePeriodMonths(e.target.value)}
                    placeholder="12"
                    min="1"
                    className="flex-1 pl-2.5 pr-1 py-3 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none"
                  />
                  {/* 단위 */}
                  <span className="shrink-0 pr-4 text-sm font-medium text-amber-700 pointer-events-none select-none">
                    개월
                  </span>
                </div>
                {gracePeriodMonthsNum > 0 && monthlyInterestOnly > 0 && (
                  <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1 pl-1">
                    <span>💡 거치 기간 월 납부(이자만):</span>
                    <span className="font-semibold">{monthlyInterestOnly.toLocaleString()}원/월</span>
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 대출 원금 + 이자율 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">대출 원금</label>
            <div className="relative">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text" value={principal}
                onChange={(e) => setPrincipal(formatNumber(e.target.value))}
                placeholder="300,000,000"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">연 이자율 (%)</label>
            <div className="relative">
              <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number" step="0.01" value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="4.50"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* 대출 기간 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">대출 기간</label>
          <div className="flex gap-2">
            {/* 숫자 입력 */}
            <div className="relative flex-1">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder={durationUnit === 'years' ? '30' : '360'}
                min="1"
                step={durationUnit === 'years' ? '0.5' : '1'}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all"
              />
            </div>
            {/* 단위 드롭다운 */}
            <select
              value={durationUnit}
              onChange={(e) => setDurationUnit(e.target.value as 'years' | 'months')}
              className="px-4 py-3 bg-gray-50 rounded-xl text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all cursor-pointer appearance-none text-center"
            >
              <option value="years">년</option>
              <option value="months">개월</option>
            </select>
          </div>
          {/* 변환 표시 */}
          {durationNum > 0 && totalMonthsNum > 0 && (
            <p className="mt-1.5 text-xs text-gray-400 pl-1">
              {durationUnit === 'years'
                ? `= ${totalMonthsNum}개월`
                : `= ${(totalMonthsNum / 12).toFixed(1)}년`}
              {hasGracePeriod && gracePeriodMonthsNum > 0 && (
                <span className="text-amber-500">
                  {` · 거치 ${gracePeriodMonthsNum}개월 + 상환 ${Math.max(0, totalMonthsNum - gracePeriodMonthsNum)}개월`}
                </span>
              )}
            </p>
          )}
        </div>

        {/* 대출 시작일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">대출 시작일</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date" value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all"
            />
          </div>
          {calculatedEndDate && (
            <p className="mt-1.5 text-xs text-gray-400 pl-1">
              만기일: <span className="font-medium text-gray-600">{calculatedEndDate}</span>
            </p>
          )}
        </div>

        {/* 자동계산 프리뷰 */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-red-50 rounded-xl space-y-3"
          >
            {/* 자동계산 뱃지 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">자동 계산 결과</span>
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">자동</span>
            </div>

            {/* 거치 상태 뱃지 */}
            {hasGracePeriod && (
              <div className="flex items-center gap-2">
                {isCurrentlyInGracePeriod ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-semibold">
                    <Clock className="w-3 h-3" /> 현재 거치 중
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold">
                    ✅ 상환 중
                  </span>
                )}
              </div>
            )}

            {/* 핵심 수치 그리드 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 월 납부금 */}
              <div className="bg-white rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">
                  {loanType === 'equal_principal' ? '월 납부금 (현재)' : '월 납부금 (고정)'}
                </p>
                <p className="text-sm font-bold text-red-600">
                  {calculatedMonthlyPayment > 0 ? `${calculatedMonthlyPayment.toLocaleString()}원` : '—'}
                </p>
                {loanType === 'equal_principal' && (
                  <p className="text-xs text-gray-400 mt-0.5">매월 감소</p>
                )}
              </div>

              {/* 거치 기간 이자 (거치 선택 시) */}
              {hasGracePeriod && monthlyInterestOnly > 0 && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <p className="text-xs text-amber-600 mb-0.5">거치 기간 납부</p>
                  <p className="text-sm font-bold text-amber-700">
                    {monthlyInterestOnly.toLocaleString()}원
                  </p>
                  <p className="text-xs text-amber-500 mt-0.5">이자만</p>
                </div>
              )}

              {/* 남은 원금 */}
              <div className="bg-white rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">
                  {startDate ? '현재 남은 원금' : '남은 원금 (시작일 입력 시 자동계산)'}
                </p>
                <p className="text-sm font-bold text-gray-800">
                  {calculatedRemainingPrincipal.toLocaleString()}원
                </p>
              </div>

              {/* 총 예상 이자 */}
              {totalInterest > 0 && (
                <div className="bg-white rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">
                    총 이자{hasGracePeriod ? ' (거치 포함)' : ''}
                  </p>
                  <p className="text-sm font-bold text-orange-500">
                    {totalInterest.toLocaleString()}원
                  </p>
                </div>
              )}
            </div>

            {/* 상환 진행률 게이지 */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500">상환 진행률</span>
                <span className="font-bold text-red-600">{repayRatio.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-red-200 rounded-full h-3">
                <motion.div
                  className="bg-gradient-to-r from-red-500 to-orange-400 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${repayRatio}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-gray-400">
                <span>갚은 원금 {paidAmount.toLocaleString()}원</span>
                <span>원금 {principalNum.toLocaleString()}원</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* 메모 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">메모 (선택)</label>
          <div className="relative">
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text" value={memo}
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
