import { useState, useEffect } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, Calendar, Tag, Plus, Check } from 'lucide-react';
import { Modal } from './Modal';
import type { Transaction, TransactionType, CustomCategory } from '@/types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/categories';

interface TransactionFormProps {
  year: number;
  month: number;
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdate?: (id: string, updates: Partial<Transaction>) => void;
  onClose: () => void;
  isOpen: boolean;
  partnerNames: [string, string];
  editTransaction?: Transaction | null;
  customCategories?: CustomCategory[];
  onAddCustomCategory?: (cat: Omit<CustomCategory, 'id'>) => Promise<CustomCategory | undefined>;
}

export function TransactionForm({
  year,
  month,
  onAdd,
  onUpdate,
  onClose,
  isOpen,
  partnerNames,
  editTransaction,
  customCategories = [],
  onAddCustomCategory,
}: TransactionFormProps) {
  const isEditMode = !!editTransaction;

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(`${year}-${String(month).padStart(2, '0')}-01`);
  const [owner, setOwner] = useState('shared');

  // 커스텀 카테고리 추가 UI 상태
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCatName, setCustomCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  // 수정 모드: editTransaction으로 폼 초기화
  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setAmount(editTransaction.amount.toLocaleString());
      setCategory(editTransaction.category);
      setDescription(editTransaction.description || '');
      setDate(editTransaction.date);
      setOwner(editTransaction.owner);
    } else {
      // 추가 모드 초기화
      setType('expense');
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(`${year}-${String(month).padStart(2, '0')}-01`);
      setOwner('shared');
    }
    setShowCustomInput(false);
    setCustomCatName('');
  }, [editTransaction, year, month, isOpen]);

  // 타입 변경 시 카테고리 초기화
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory('');
  };

  // 기본 카테고리 + 커스텀 카테고리 합산
  const baseCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const customOfType = customCategories.filter((c) => c.type === type);
  const allCategories = [
    ...baseCategories,
    ...customOfType.map((c) => ({ id: c.name, label: c.name, icon: c.icon || '📌' })),
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(amount.replace(/,/g, ''));
    if (!amountNum || !category) return;

    const dateStr = date || `${year}-${String(month).padStart(2, '0')}-01`;
    const dateParts = dateStr.split('-');
    const txYear = Number(dateParts[0]) || year;
    const txMonth = Number(dateParts[1]) || month;

    if (isEditMode && onUpdate && editTransaction) {
      onUpdate(editTransaction.id, {
        date: dateStr,
        year: txYear,
        month: txMonth,
        type,
        category,
        description,
        amount: amountNum,
        owner,
      });
    } else {
      onAdd({
        date: dateStr,
        year: txYear,
        month: txMonth,
        type,
        category,
        description,
        amount: amountNum,
        owner,
      });
    }

    onClose();
  };

  const formatInputAmount = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    return numbers ? Number(numbers).toLocaleString() : '';
  };

  const handleAddCustomCategory = async () => {
    const name = customCatName.trim();
    if (!name || !onAddCustomCategory) return;
    setIsAddingCat(true);
    const newCat = await onAddCustomCategory({ name, type });
    setIsAddingCat(false);
    if (newCat) {
      setCategory(newCat.name);
    }
    setShowCustomInput(false);
    setCustomCatName('');
  };

  const accentClass =
    type === 'income'
      ? 'bg-green-100 text-green-700 ring-2 ring-green-500/30'
      : 'bg-red-100 text-red-700 ring-2 ring-red-500/30';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? '거래 수정' : '거래 내역 추가'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* 입력자 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">입력자</label>
          <div className="flex gap-2">
            {(['shared', partnerNames[0], partnerNames[1]] as string[]).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setOwner(name)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  owner === name
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {name === 'shared' ? '공동' : name}
              </button>
            ))}
          </div>
        </div>

        {/* 수입/지출 토글 */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
              type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ArrowDownLeft className="w-5 h-5" />
            수입
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
              type === 'expense' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ArrowUpRight className="w-5 h-5" />
            지출
          </button>
        </div>

        {/* 금액 */}
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

        {/* 날짜 */}
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

        {/* 카테고리 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
          <div className="flex flex-wrap gap-2">
            {allCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  category === cat.id
                    ? accentClass
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}

            {/* 커스텀 카테고리 추가 버튼 */}
            {onAddCustomCategory && (
              showCustomInput ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customCatName}
                    onChange={(e) => setCustomCatName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomCategory(); } }}
                    placeholder="카테고리명"
                    autoFocus
                    className="w-28 px-3 py-1.5 bg-gray-100 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCategory}
                    disabled={isAddingCat || !customCatName.trim()}
                    className="w-8 h-8 flex items-center justify-center bg-orange-500 text-white rounded-xl disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 border-2 border-dashed border-gray-200 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  직접 추가
                </button>
              )
            )}
          </div>
        </div>

        {/* 메모 */}
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

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={!amount || !category}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
            type === 'income'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
              : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
          } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
        >
          {isEditMode
            ? '수정 완료'
            : type === 'income'
            ? '수입 추가'
            : '지출 추가'}
        </button>
      </form>
    </Modal>
  );
}
