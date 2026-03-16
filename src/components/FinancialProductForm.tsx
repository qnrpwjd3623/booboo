import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Wallet, TrendingUp, Calendar, FileText,
  PiggyBank, Landmark, Shield, BarChart3, Home, Percent, Coins
} from 'lucide-react';
import { Modal } from './Modal';
import type { FinancialProduct } from '@/types';

interface FinancialProductFormProps {
  onAdd: (product: Omit<FinancialProduct, 'id'>) => void;
  onUpdate?: (id: string, product: Partial<FinancialProduct>) => void;
  onClose: () => void;
  isOpen: boolean;
  editProduct?: FinancialProduct | null;
  partnerNames: [string, string];
}

const productTypes = [
  { id: 'irp',        name: 'IRP',    icon: PiggyBank,  color: 'bg-purple-100 text-purple-600', group: 'investment' },
  { id: 'isa',        name: 'ISA',    icon: Shield,     color: 'bg-blue-100 text-blue-600',     group: 'investment' },
  { id: 'pension',    name: '연금저축', icon: Landmark,  color: 'bg-green-100 text-green-600',  group: 'investment' },
  { id: 'fund',       name: 'DC 퇴직금', icon: BarChart3,  color: 'bg-orange-100 text-orange-600', group: 'investment' },
  { id: 'deposit',    name: '예금',   icon: Wallet,     color: 'bg-cyan-100 text-cyan-600',     group: 'deposit' },
  { id: 'savings',    name: '적금',   icon: PiggyBank,  color: 'bg-pink-100 text-pink-600',     group: 'savings' },
  { id: 'realestate', name: '부동산', icon: Home,       color: 'bg-amber-100 text-amber-600',   group: 'realestate' },
  { id: 'coin',       name: '코인',   icon: Coins,      color: 'bg-yellow-100 text-yellow-600', group: 'investment' },
] as const;

type ProductTypeId = typeof productTypes[number]['id'];

function getGroup(type: ProductTypeId): string {
  return productTypes.find(t => t.id === type)?.group ?? 'investment';
}

export function FinancialProductForm({
  onAdd, onUpdate, onClose, isOpen, editProduct, partnerNames
}: FinancialProductFormProps) {
  const [type, setType] = useState<ProductTypeId>('irp');
  const [name, setName] = useState('');
  const [company, setCompany] = useState(''); // 증권사/은행/주소
  const [principal, setPrincipal] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [interestRate, setInterestRate] = useState(''); // 예금/적금 이자율
  const [monthlyPayment, setMonthlyPayment] = useState(''); // 적금 월납입금
  const [paidMonths, setPaidMonths] = useState(''); // 적금 납입회차
  const [totalMonths, setTotalMonths] = useState(''); // 적금 목표회차
  const [address, setAddress] = useState(''); // 부동산 주소
  const [memo, setMemo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [owner, setOwner] = useState('shared');

  const isEditing = !!editProduct;
  const group = getGroup(type);

  useEffect(() => {
    if (editProduct) {
      setType(editProduct.type as ProductTypeId);
      setName(editProduct.name);
      setCompany(editProduct.company);
      setPrincipal(editProduct.principal.toString());
      setCurrentValue(editProduct.currentValue.toString());
      setMemo(editProduct.memo || '');
      setStartDate(editProduct.startDate || '');
      setMaturityDate(editProduct.maturityDate || '');
      setOwner(editProduct.owner || 'shared');
      setInterestRate(editProduct.interestRate?.toString() || '');
      setMonthlyPayment(editProduct.monthlyPayment?.toString() || '');
      setPaidMonths(editProduct.paidMonths?.toString() || '');
      setTotalMonths(editProduct.totalMonths?.toString() || '');
      setAddress(editProduct.address || '');
    } else {
      setType('irp');
      setName('');
      setCompany('');
      setPrincipal('');
      setCurrentValue('');
      setMemo('');
      setStartDate('');
      setMaturityDate('');
      setOwner('shared');
      setInterestRate('');
      setMonthlyPayment('');
      setPaidMonths('');
      setTotalMonths('');
      setAddress('');
    }
  }, [editProduct, isOpen]);

  // type 바뀌면 유형별 필드 초기화
  useEffect(() => {
    if (!editProduct) {
      setCurrentValue('');
      setInterestRate('');
      setMonthlyPayment('');
      setPaidMonths('');
      setTotalMonths('');
      setAddress('');
    }
  }, [type]);

  const formatNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    return numbers ? Number(numbers).toLocaleString() : '';
  };
  const parseNum = (value: string) => Number(value.replace(/,/g, '') || 0);

  // 유형별 computed values
  const principalNum = parseNum(principal);
  const currentValueNum = parseNum(currentValue);
  const monthlyPaymentNum = parseNum(monthlyPayment);
  const paidMonthsNum = parseInt(paidMonths || '0');
  const totalMonthsNum = parseInt(totalMonths || '0');

  // 적금: 납입총액 = 월납입금 * 납입회차
  const savingsPrincipal = monthlyPaymentNum * paidMonthsNum;
  // 적금: 목표금액 = 월납입금 * 목표회차
  const savingsTarget = monthlyPaymentNum * totalMonthsNum;

  // 투자상품: 수익률/손익
  const investReturnValue = currentValueNum - principalNum;
  const investReturnRate = principalNum > 0 ? (investReturnValue / principalNum) * 100 : 0;

  // 부동산: 평가손익
  const realReturnValue = currentValueNum - principalNum;
  const realReturnRate = principalNum > 0 ? (realReturnValue / principalNum) * 100 : 0;

  // 유형별 isValid
  const isValid = (() => {
    if (!name) return false;
    switch (group) {
      case 'investment': return !!(company && principalNum > 0 && currentValueNum > 0);
      case 'deposit':    return !!(company && principalNum > 0);
      case 'savings':    return !!(company && monthlyPaymentNum > 0);
      case 'realestate': return !!(principalNum > 0 && currentValueNum > 0);
      default:           return false;
    }
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    let finalPrincipal = principalNum;
    let finalCurrentValue = currentValueNum;
    let finalReturnRate = 0;

    if (group === 'investment') {
      finalReturnRate = principalNum > 0 ? (investReturnValue / principalNum) * 100 : 0;
    } else if (group === 'deposit') {
      finalCurrentValue = principalNum; // 예금은 currentValue = principal
      finalReturnRate = parseFloat(interestRate || '0');
    } else if (group === 'savings') {
      finalPrincipal = savingsPrincipal;
      finalCurrentValue = savingsPrincipal;
      finalReturnRate = parseFloat(interestRate || '0');
    } else if (group === 'realestate') {
      finalReturnRate = principalNum > 0 ? (realReturnValue / principalNum) * 100 : 0;
    }

    const productData: Omit<FinancialProduct, 'id'> = {
      type,
      name,
      company: group === 'realestate' ? (address || company || name) : company,
      principal: finalPrincipal,
      currentValue: finalCurrentValue,
      returnRate: finalReturnRate,
      memo,
      startDate: startDate || undefined,
      maturityDate: maturityDate || undefined,
      owner,
      // 유형별 확장 필드
      interestRate: (group === 'deposit' || group === 'savings') ? parseFloat(interestRate || '0') : undefined,
      monthlyPayment: group === 'savings' ? monthlyPaymentNum : undefined,
      paidMonths: group === 'savings' ? paidMonthsNum : undefined,
      totalMonths: group === 'savings' ? totalMonthsNum : undefined,
      address: group === 'realestate' ? (address || undefined) : undefined,
    };

    if (isEditing && editProduct && onUpdate) {
      onUpdate(editProduct.id, productData);
    } else {
      onAdd(productData);
    }
    onClose();
  };

  const companyLabel = group === 'realestate' ? '위치/지역' : (type === 'coin' ? '거래소' : (group === 'investment' ? '증권사/은행' : '은행명'));
  const companyPlaceholder = group === 'realestate' ? '서울 강남구' : (type === 'coin' ? '업비트' : (group === 'investment' ? '삼성증권' : '국민은행'));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? '자산 수정' : '자산 추가'} maxWidth="max-w-md">
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
                    ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {n === 'shared' ? '공동' : n}
              </button>
            ))}
          </div>
        </div>

        {/* 자산 유형 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">자산 유형</label>
          <div className="grid grid-cols-4 gap-2">
            {productTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${
                  type === t.id
                    ? 'bg-gray-900 text-white ring-2 ring-gray-900 ring-offset-2'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <t.icon className="w-4 h-4" />
                <span className="text-xs font-medium">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 자산명 + 기관명/주소 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {group === 'realestate' ? '부동산명' : '상품명'}
            </label>
            <div className="relative">
              {group === 'realestate' ? (
                <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              ) : (
                <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              )}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={group === 'realestate' ? '역삼 롯데캐슬' : type === 'coin' ? '비트코인' : '상품명'}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{companyLabel}</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={group === 'realestate' ? address : company}
                onChange={(e) => group === 'realestate' ? setAddress(e.target.value) : setCompany(e.target.value)}
                placeholder={companyPlaceholder}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* 유형별 금액 필드 */}
        <AnimatePresence mode="wait">
          {/* 투자상품 (IRP/ISA/연금/펀드): 원금 + 현재 평가액 */}
          {group === 'investment' && (
            <motion.div
              key="investment"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">납입금 (원금)</label>
                <div className="relative">
                  <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={principal}
                    onChange={(e) => setPrincipal(formatNumber(e.target.value))}
                    placeholder="10,000,000"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">현재 평가액</label>
                <div className="relative">
                  <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(formatNumber(e.target.value))}
                    placeholder="12,000,000"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* 예금: 원금 + 이자율 */}
          {group === 'deposit' && (
            <motion.div
              key="deposit"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">예치금 (원금)</label>
                <div className="relative">
                  <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={principal}
                    onChange={(e) => setPrincipal(formatNumber(e.target.value))}
                    placeholder="10,000,000"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">연 이자율 % (선택)</label>
                <div className="relative">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="3.5"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* 적금: 월납입금 + 납입회차 + 목표회차 + 이자율 */}
          {group === 'savings' && (
            <motion.div
              key="savings"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">월 납입금</label>
                  <div className="relative">
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={monthlyPayment}
                      onChange={(e) => setMonthlyPayment(formatNumber(e.target.value))}
                      placeholder="300,000"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">연 이자율 % (선택)</label>
                  <div className="relative">
                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      step="0.1"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      placeholder="4.0"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">현재 납입 회차 (개월)</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={paidMonths}
                      onChange={(e) => setPaidMonths(e.target.value)}
                      placeholder="6"
                      min="0"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">목표 회차 (개월)</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={totalMonths}
                      onChange={(e) => setTotalMonths(e.target.value)}
                      placeholder="24"
                      min="1"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
              {/* 적금 진행률 preview */}
              {monthlyPaymentNum > 0 && totalMonthsNum > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-pink-50 rounded-xl space-y-2"
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">현재 납입총액</span>
                    <span className="font-semibold text-gray-900">{savingsPrincipal.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">목표 금액</span>
                    <span className="font-medium text-pink-600">{savingsTarget.toLocaleString()}원</span>
                  </div>
                  {totalMonthsNum > 0 && (
                    <>
                      <div className="w-full bg-pink-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-pink-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((paidMonthsNum / totalMonthsNum) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-pink-600 text-right font-medium">
                        {paidMonthsNum}/{totalMonthsNum}개월 ({((paidMonthsNum / totalMonthsNum) * 100).toFixed(0)}%)
                      </p>
                    </>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* 부동산: 매입가 + 현재 시세 */}
          {group === 'realestate' && (
            <motion.div
              key="realestate"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">매입 가격</label>
                <div className="relative">
                  <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={principal}
                    onChange={(e) => setPrincipal(formatNumber(e.target.value))}
                    placeholder="500,000,000"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">현재 시세</label>
                <div className="relative">
                  <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(formatNumber(e.target.value))}
                    placeholder="550,000,000"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 수익률 / 평가손익 preview (투자상품 & 부동산) */}
        {(group === 'investment' || group === 'realestate') && principalNum > 0 && currentValueNum > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-gray-50 rounded-xl"
          >
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{group === 'realestate' ? '시세차익' : '수익률'}</span>
              <span className={`font-bold ${(group === 'investment' ? investReturnRate : realReturnRate) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {(group === 'investment' ? investReturnRate : realReturnRate) >= 0 ? '+' : ''}
                {(group === 'investment' ? investReturnRate : realReturnRate).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">평가손익</span>
              <span className={`font-medium ${(group === 'investment' ? investReturnValue : realReturnValue) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {(group === 'investment' ? investReturnValue : realReturnValue) >= 0 ? '+' : ''}
                {(group === 'investment' ? investReturnValue : realReturnValue).toLocaleString()}원
              </span>
            </div>
          </motion.div>
        )}

        {/* 예금 미리보기 */}
        {group === 'deposit' && principalNum > 0 && parseFloat(interestRate || '0') > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-cyan-50 rounded-xl"
          >
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">만기 예상 이자 (1년 단순)</span>
              <span className="font-semibold text-cyan-600">
                +{(principalNum * parseFloat(interestRate) / 100).toLocaleString()}원
              </span>
            </div>
          </motion.div>
        )}

        {/* 날짜 (가입일 / 만기일) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {group === 'realestate' ? '취득일 (선택)' : '가입일 (선택)'}
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
          {group !== 'realestate' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">만기일 (선택)</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={maturityDate}
                  onChange={(e) => setMaturityDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                />
              </div>
            </div>
          )}
        </div>

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
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={!isValid}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isEditing ? '수정하기' : '추가하기'}
        </button>
      </form>
    </Modal>
  );
}
