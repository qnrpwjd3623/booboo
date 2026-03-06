import { useState } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, Calendar, Tag } from 'lucide-react';
import { Modal } from './Modal';
import type { Transaction, TransactionType } from '@/types';

interface TransactionFormProps {
  year: number;
  month: number;
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
  isOpen: boolean;
  partnerNames: [string, string];
}

const incomeCategories = ['급여', '병수당', '투자수익', '기타수입'];
const expenseCategories = ['식비', '교통비', '통신비', '주거비', '쇼핑', '외식', '취미', '의료비', '교육비', '기타'];

export function TransactionForm({ year, month, onAdd, onClose, isOpen, partnerNames }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(`${year}-${String(month).padStart(2, '0')}-01`);
  const [owner, setOwner] = useState('shared');

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;

    onAdd({
      date,
      year,
      month,
      type,
      category,
      description,
      amount: Number(amount.replace(/,/g, '')),
      owner,
    });

    // Reset form
    setAmount('');
    setCategory('');
    setDescription('');
    onClose();
  };

  const formatInputAmount = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    return numbers ? Number(numbers).toLocaleString() : '';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="거래 내역 추가" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Owner Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">입력자</label>
          <div className="flex gap-2">
            {['shared', partnerNames[0], partnerNames[1]].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setOwner(name)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${owner === name
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {name === 'shared' ? '공동' : name}
              </button>
            ))}
          </div>
        </div>

        {/* Type Toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => { setType('income'); setCategory(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${type === 'income'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <ArrowDownLeft className="w-5 h-5" />
            수입
          </button>
          <button
            type="button"
            onClick={() => { setType('expense'); setCategory(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${type === 'expense'
                ? 'bg-white text-red-500 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <ArrowUpRight className="w-5 h-5" />
            지출
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">금액</label>
          <div className="relative">
            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(formatInputAmount(e.target.value))}
              placeholder="0"
              className="w-full pl-12 pr-12 py-4 bg-gray-50 rounded-xl text-2xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">원</span>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${category === cat
                    ? type === 'income'
                      ? 'bg-green-100 text-green-700 ring-2 ring-green-500/30'
                      : 'bg-red-100 text-red-700 ring-2 ring-red-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">메모 (선택)</label>
          <div className="relative">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어떤 거래인가요?"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!amount || !category}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all ${type === 'income'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
              : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
            } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
        >
          {type === 'income' ? '수입 추가' : '지출 추가'}
        </button>
      </form>
    </Modal>
  );
}
