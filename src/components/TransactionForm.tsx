import { useState, useEffect } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, Calendar, Tag, Plus, Check, Pencil, Trash2, X } from 'lucide-react';
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
  onUpdateCustomCategory?: (id: string, updates: Partial<Omit<CustomCategory, 'id'>>) => Promise<void>;
  onDeleteCustomCategory?: (id: string) => Promise<void>;
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
  onUpdateCustomCategory,
  onDeleteCustomCategory,
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
  const [newCatEmoji, setNewCatEmoji] = useState('📌');
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  // 커스텀 카테고리 편집 상태
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatEmoji, setEditCatEmoji] = useState('');
  const [editCatName, setEditCatName] = useState('');

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
      setType('expense');
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(`${year}-${String(month).padStart(2, '0')}-01`);
      setOwner('shared');
    }
    setShowCustomInput(false);
    setNewCatEmoji('📌');
    setNewCatName('');
    setEditingCatId(null);
  }, [editTransaction, year, month, isOpen]);

  // 타입 변경 시 카테고리·편집 상태 초기화
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory('');
    setEditingCatId(null);
    setShowCustomInput(false);
  };

  const baseCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const customOfType = customCategories.filter((c) => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(amount.replace(/,/g, ''));
    if (!amountNum || !category) return;

    const dateStr = date || `${year}-${String(month).padStart(2, '0')}-01`;
    const dateParts = dateStr.split('-');
    const txYear = Number(dateParts[0]) || year;
    const txMonth = Number(dateParts[1]) || month;

    if (isEditMode && onUpdate && editTransaction) {
      onUpdate(editTransaction.id, { date: dateStr, year: txYear, month: txMonth, type, category, description, amount: amountNum, owner });
    } else {
      onAdd({ date: dateStr, year: txYear, month: txMonth, type, category, description, amount: amountNum, owner });
    }
    onClose();
  };

  const formatInputAmount = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    return numbers ? Number(numbers).toLocaleString() : '';
  };

  // 새 커스텀 카테고리 추가
  const handleAddCustomCategory = async () => {
    const name = newCatName.trim();
    if (!name || !onAddCustomCategory) return;
    setIsAddingCat(true);
    const newCat = await onAddCustomCategory({ name, type, icon: newCatEmoji });
    setIsAddingCat(false);
    if (newCat) setCategory(newCat.name);
    setShowCustomInput(false);
    setNewCatEmoji('📌');
    setNewCatName('');
  };

  // 커스텀 카테고리 편집 시작
  const handleStartEdit = (cat: CustomCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCatId(cat.id);
    setEditCatEmoji(cat.icon || '📌');
    setEditCatName(cat.name);
    setShowCustomInput(false);
  };

  // 커스텀 카테고리 편집 저장
  const handleSaveEdit = async (cat: CustomCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editCatName.trim() || !onUpdateCustomCategory) return;
    const oldName = cat.name;
    const newName = editCatName.trim();
    await onUpdateCustomCategory(cat.id, { name: newName, icon: editCatEmoji });
    // 선택된 카테고리가 이 카테고리였으면 이름도 업데이트
    if (category === oldName) setCategory(newName);
    setEditingCatId(null);
  };

  // 커스텀 카테고리 삭제
  const handleDeleteCat = async (cat: CustomCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteCustomCategory) return;
    if (!confirm(`'${cat.name}' 카테고리를 삭제하시겠습니까?`)) return;
    await onDeleteCustomCategory(cat.id);
    if (category === cat.name) setCategory('');
  };

  const accentClass =
    type === 'income'
      ? 'bg-green-100 text-green-700 ring-2 ring-green-500/30'
      : 'bg-red-100 text-red-700 ring-2 ring-red-500/30';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? '거래 수정' : '거래 내역 추가'} maxWidth="max-w-md">
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
                  owner === name ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            {/* 기본 카테고리 */}
            {baseCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  category === cat.id ? accentClass : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}

            {/* 커스텀 카테고리 (편집/삭제 가능) */}
            {customOfType.map((cat) =>
              editingCatId === cat.id ? (
                // 편집 중인 카테고리
                <div key={cat.id} className="flex items-center gap-1 p-1 bg-blue-50 rounded-xl border-2 border-blue-300">
                  <input
                    type="text"
                    value={editCatEmoji}
                    onChange={(e) => setEditCatEmoji(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    maxLength={2}
                    className="w-9 text-center bg-white rounded-lg py-1 text-sm border border-gray-200 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveEdit(cat, e as unknown as React.MouseEvent); } if (e.key === 'Escape') setEditingCatId(null); }}
                    autoFocus
                    className="w-20 px-2 py-1 bg-white rounded-lg text-sm border border-gray-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={(e) => handleSaveEdit(cat, e)}
                    disabled={!editCatName.trim()}
                    className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded-lg disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setEditingCatId(null); }}
                    className="w-6 h-6 flex items-center justify-center bg-gray-300 text-white rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                // 일반 커스텀 카테고리 버튼
                <div key={cat.id} className="group relative flex items-center">
                  <button
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`flex items-center gap-1 pl-3 pr-8 py-1.5 rounded-xl text-sm font-medium transition-all ${
                      category === cat.name ? accentClass : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{cat.icon || '📌'}</span>
                    <span>{cat.name}</span>
                  </button>
                  {/* 편집/삭제 버튼 — hover 시 표시 */}
                  <div className="absolute right-0.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-white/90 rounded-lg px-0.5 shadow-sm">
                    <button
                      type="button"
                      onClick={(e) => handleStartEdit(cat, e)}
                      className="p-1 rounded text-gray-400 hover:text-blue-500 transition-colors"
                      title="수정"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCat(cat, e)}
                      className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            )}

            {/* 직접 추가 버튼 */}
            {onAddCustomCategory && (
              showCustomInput ? (
                <div className="flex items-center gap-1.5 p-1 bg-orange-50 rounded-xl border-2 border-orange-200">
                  <input
                    type="text"
                    value={newCatEmoji}
                    onChange={(e) => setNewCatEmoji(e.target.value)}
                    maxLength={2}
                    className="w-9 text-center bg-white rounded-lg py-1 text-sm border border-gray-200 focus:outline-none"
                    title="이모지"
                  />
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomCategory(); } if (e.key === 'Escape') setShowCustomInput(false); }}
                    placeholder="카테고리명"
                    autoFocus
                    className="w-24 px-2 py-1 bg-white rounded-lg text-sm border border-gray-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCategory}
                    disabled={isAddingCat || !newCatName.trim()}
                    className="w-7 h-7 flex items-center justify-center bg-orange-500 text-white rounded-lg disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(false)}
                    className="w-7 h-7 flex items-center justify-center bg-gray-300 text-white rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setShowCustomInput(true); setEditingCatId(null); }}
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
          {isEditMode ? '수정 완료' : type === 'income' ? '수입 추가' : '지출 추가'}
        </button>
      </form>
    </Modal>
  );
}
