import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Wallet, TrendingUp, Calendar, FileText, PiggyBank, Landmark, Shield, BarChart3 } from 'lucide-react';
import { Modal } from './Modal';
import type { FinancialProduct } from '@/types';

interface FinancialProductFormProps {
  onAdd: (product: Omit<FinancialProduct, 'id'>) => void;
  onUpdate?: (id: string, product: Partial<FinancialProduct>) => void;
  onClose: () => void;
  isOpen: boolean;
  editProduct?: FinancialProduct | null;
}

const productTypes = [
  { id: 'irp', name: 'IRP', icon: PiggyBank, color: 'bg-purple-100 text-purple-600' },
  { id: 'isa', name: 'ISA', icon: Shield, color: 'bg-blue-100 text-blue-600' },
  { id: 'pension', name: '연금저축', icon: Landmark, color: 'bg-green-100 text-green-600' },
  { id: 'fund', name: '펀드', icon: BarChart3, color: 'bg-orange-100 text-orange-600' },
  { id: 'deposit', name: '예금', icon: Wallet, color: 'bg-cyan-100 text-cyan-600' },
  { id: 'savings', name: '적금', icon: PiggyBank, color: 'bg-pink-100 text-pink-600' },
] as const;

export function FinancialProductForm({ onAdd, onUpdate, onClose, isOpen, editProduct }: FinancialProductFormProps) {
  const [type, setType] = useState<FinancialProduct['type']>('irp');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [principal, setPrincipal] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [memo, setMemo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');

  const isEditing = !!editProduct;

  useEffect(() => {
    if (editProduct) {
      setType(editProduct.type);
      setName(editProduct.name);
      setCompany(editProduct.company);
      setPrincipal(editProduct.principal.toString());
      setCurrentValue(editProduct.currentValue.toString());
      setMemo(editProduct.memo || '');
      setStartDate(editProduct.startDate || '');
      setMaturityDate(editProduct.maturityDate || '');
    } else {
      setType('irp');
      setName('');
      setCompany('');
      setPrincipal('');
      setCurrentValue('');
      setMemo('');
      setStartDate('');
      setMaturityDate('');
    }
  }, [editProduct, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !company || !principal || !currentValue) return;

    const principalNum = Number(principal.replace(/,/g, ''));
    const currentValueNum = Number(currentValue.replace(/,/g, ''));
    const returnRate = principalNum > 0 ? ((currentValueNum - principalNum) / principalNum) * 100 : 0;

    const productData = {
      type,
      name,
      company,
      principal: principalNum,
      currentValue: currentValueNum,
      returnRate,
      memo,
      startDate: startDate || undefined,
      maturityDate: maturityDate || undefined,
    };

    if (isEditing && editProduct && onUpdate) {
      onUpdate(editProduct.id, productData);
    } else {
      onAdd(productData);
    }

    onClose();
  };

  const formatNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    return numbers ? Number(numbers).toLocaleString() : '';
  };

  const principalNum = Number(principal.replace(/,/g, '') || 0);
  const currentValueNum = Number(currentValue.replace(/,/g, '') || 0);
  const returnValue = currentValueNum - principalNum;
  const returnRate = principalNum > 0 ? (returnValue / principalNum) * 100 : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? '상품 수정' : '상품 추가'} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Product Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">상품 유형</label>
          <div className="grid grid-cols-3 gap-2">
            {productTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                  type === t.id
                    ? 'bg-gray-900 text-white ring-2 ring-gray-900 ring-offset-2'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <t.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Name & Company */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">상품명</label>
            <div className="relative">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="상품명"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">증권사/은행</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="삼성증권"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Principal & Current Value */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">원금</label>
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
        </div>

        {/* Return Preview */}
        {principal && currentValue && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-gray-50 rounded-xl"
          >
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">수익률</span>
              <span className={`font-bold ${returnRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {returnRate >= 0 ? '+' : ''}{returnRate.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">평가손익</span>
              <span className={`font-medium ${returnValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {returnValue >= 0 ? '+' : ''}{returnValue.toLocaleString()}원
              </span>
            </div>
          </motion.div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">가입일 (선택)</label>
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
        </div>

        {/* Memo */}
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!name || !company || !principal || !currentValue}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isEditing ? '수정하기' : '추가하기'}
        </button>
      </form>
    </Modal>
  );
}
