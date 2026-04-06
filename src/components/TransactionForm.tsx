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

  // 새 커스텀 카테고리 추가
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [newCatEmoji, setNewCatEmoji] = useState('📌');
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  // 카테고리 편집 (기본 + 커스텀 통합)
  const [editingCatKey, setEditingCatKey] = useState<string | null>(null); // builtin: cat.id, custom: cat.id
  const [editCatEmoji, setEditCatEmoji] = useState('');
  const [editCatName, setEditCatName] = useState('');
  const [editCatNameEditable, setEditCatNameEditable] = useState(false); // 기본 카테고리는 이름 수정 불가

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
    setEditingCatKey(null);
  }, [editTransaction, year, month, isOpen]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory('');
    setEditingCatKey(null);
    setShowCustomInput(false);
  };

  const baseCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const customOfType = customCategories.filter((c) => c.type === type);

  const builtinIdSet = new Set(baseCategories.map((b) => b.id));
  // 기본 카테고리 오버라이드 맵 (이모지 변경 또는 숨김 처리)
  const builtinOverrideMap = new Map(
    customOfType.filter((c) => builtinIdSet.has(c.name)).map((c) => [c.name, c])
  );
  // 숨겨지지 않은 기본 카테고리
  const visibleBuiltins = baseCategories.filter((b) => !builtinOverrideMap.get(b.id)?.hidden);
  // 진짜 커스텀 카테고리 (숨겨지지 않은 것만)
  const trueCustomCategories = customOfType.filter((c) => !builtinIdSet.has(c.name) && !c.hidden);

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

  // ── 새 커스텀 카테고리 추가 ──
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

  // ── 편집 시작 (기본 카테고리) ──
  const handleStartEditBuiltin = (builtinId: string, currentIcon: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCatKey(`builtin:${builtinId}`);
    setEditCatEmoji(currentIcon);
    setEditCatName(''); // 기본 카테고리 이름은 수정 불가
    setEditCatNameEditable(false);
    setShowCustomInput(false);
  };

  // ── 편집 시작 (커스텀 카테고리) ──
  const handleStartEditCustom = (cat: CustomCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCatKey(`custom:${cat.id}`);
    setEditCatEmoji(cat.icon || '📌');
    setEditCatName(cat.name);
    setEditCatNameEditable(true);
    setShowCustomInput(false);
  };

  // ── 저장 ──
  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingCatKey) return;

    if (editingCatKey.startsWith('builtin:')) {
      const builtinId = editingCatKey.slice(8);
      const existing = builtinOverrideMap.get(builtinId);
      if (existing) {
        await onUpdateCustomCategory?.(existing.id, { icon: editCatEmoji, hidden: false });
      } else {
        await onAddCustomCategory?.({ name: builtinId, type, icon: editCatEmoji });
      }
    } else {
      const catId = editingCatKey.slice(7);
      const cat = trueCustomCategories.find((c) => c.id === catId);
      if (!cat || !editCatName.trim()) return;
      const oldName = cat.name;
      await onUpdateCustomCategory?.(catId, { name: editCatName.trim(), icon: editCatEmoji });
      if (category === oldName) setCategory(editCatName.trim());
    }
    setEditingCatKey(null);
  };

  // ── 삭제/숨김 ──
  const handleDelete = async (target: { type: 'builtin'; id: string; label: string } | { type: 'custom'; cat: CustomCategory }, e: React.MouseEvent) => {
    e.stopPropagation();
    if (target.type === 'builtin') {
      if (!confirm(`'${target.label}' 카테고리를 숨기겠습니까?\n(언제든 다시 복원할 수 있습니다)`)) return;
      const existing = builtinOverrideMap.get(target.id);
      if (existing) {
        await onUpdateCustomCategory?.(existing.id, { hidden: true });
      } else {
        await onAddCustomCategory?.({ name: target.id, type, icon: baseCategories.find(b => b.id === target.id)?.icon || '📌', hidden: true });
      }
      if (category === target.id) setCategory('');
    } else {
      if (!confirm(`'${target.cat.name}' 카테고리를 삭제하시겠습니까?`)) return;
      await onDeleteCustomCategory?.(target.cat.id);
      if (category === target.cat.name) setCategory('');
    }
  };

  const accentBg =
    type === 'income' ? 'bg-green-100 ring-2 ring-green-500/30' : 'bg-red-100 ring-2 ring-red-500/30';
  const accentText = type === 'income' ? 'text-green-700' : 'text-red-700';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? '거래 수정' : '거래 내역 추가'} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* 입력자 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">입력자</label>
          <div className="flex gap-2">
            {(['shared', partnerNames[0], partnerNames[1]] as string[]).map((name) => (
              <button key={name} type="button" onClick={() => setOwner(name)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${owner === name ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {name === 'shared' ? '공동' : name}
              </button>
            ))}
          </div>
        </div>

        {/* 수입/지출 토글 */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          <button type="button" onClick={() => handleTypeChange('income')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <ArrowDownLeft className="w-5 h-5" /> 수입
          </button>
          <button type="button" onClick={() => handleTypeChange('expense')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${type === 'expense' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <ArrowUpRight className="w-5 h-5" /> 지출
          </button>
        </div>

        {/* 금액 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">금액</label>
          <div className="relative">
            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={amount} onChange={(e) => setAmount(formatInputAmount(e.target.value))} placeholder="0"
              className="w-full pl-12 pr-12 py-4 bg-gray-50 rounded-xl text-2xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">원</span>
          </div>
        </div>

        {/* 날짜 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all" />
          </div>
        </div>

        {/* 카테고리 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
          <div className="flex flex-wrap gap-2">

            {/* ── 편집 인라인 폼 (공통) ── */}
            {editingCatKey && (
              <div className="w-full flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-xl border-2 border-blue-300">
                <input type="text" value={editCatEmoji} onChange={(e) => setEditCatEmoji(e.target.value)}
                  onClick={(e) => e.stopPropagation()} maxLength={2} autoFocus
                  className="w-9 text-center bg-white rounded-lg py-1 text-sm border border-gray-200 focus:outline-none" />
                {editCatNameEditable ? (
                  <input type="text" value={editCatName} onChange={(e) => setEditCatName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveEdit(e as unknown as React.MouseEvent); } if (e.key === 'Escape') setEditingCatKey(null); }}
                    className="flex-1 px-2 py-1 bg-white rounded-lg text-sm border border-gray-200 focus:outline-none" />
                ) : (
                  <span className="flex-1 text-sm text-gray-500 px-1">이모지만 수정 가능</span>
                )}
                <button type="button" onClick={handleSaveEdit} disabled={editCatNameEditable && !editCatName.trim()}
                  className="w-7 h-7 flex items-center justify-center bg-blue-500 text-white rounded-lg disabled:opacity-50">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); setEditingCatKey(null); }}
                  className="w-7 h-7 flex items-center justify-center bg-gray-300 text-white rounded-lg">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* ── 기본 카테고리 ── */}
            {visibleBuiltins.map((cat) => {
              const override = builtinOverrideMap.get(cat.id);
              const displayIcon = override?.icon || cat.icon;
              const isSelected = category === cat.id;
              return (
                <div key={cat.id} className="group relative">
                  <button type="button" onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${isSelected ? accentBg + ' ' + accentText : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    <span>{displayIcon}</span>
                    <span>{cat.label}</span>
                  </button>
                  <div className="absolute -top-1.5 -right-1.5 hidden group-hover:flex gap-0.5 z-10">
                    <button type="button" onClick={(e) => handleStartEditBuiltin(cat.id, displayIcon, e)}
                      className="w-5 h-5 flex items-center justify-center bg-white rounded-full shadow border border-gray-200 hover:border-blue-300" title="이모지 수정">
                      <Pencil className="w-2.5 h-2.5 text-gray-500" />
                    </button>
                    <button type="button" onClick={(e) => handleDelete({ type: 'builtin', id: cat.id, label: cat.label }, e)}
                      className="w-5 h-5 flex items-center justify-center bg-white rounded-full shadow border border-red-200 hover:border-red-400" title="숨기기">
                      <Trash2 className="w-2.5 h-2.5 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* ── 커스텀 카테고리 ── */}
            {trueCustomCategories.map((cat) => {
              const isSelected = category === cat.name;
              return (
                <div key={cat.id} className="group relative">
                  <button type="button" onClick={() => setCategory(cat.name)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${isSelected ? accentBg + ' ' + accentText : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    <span>{cat.icon || '📌'}</span>
                    <span>{cat.name}</span>
                  </button>
                  <div className="absolute -top-1.5 -right-1.5 hidden group-hover:flex gap-0.5 z-10">
                    <button type="button" onClick={(e) => handleStartEditCustom(cat, e)}
                      className="w-5 h-5 flex items-center justify-center bg-white rounded-full shadow border border-gray-200 hover:border-blue-300" title="수정">
                      <Pencil className="w-2.5 h-2.5 text-gray-500" />
                    </button>
                    <button type="button" onClick={(e) => handleDelete({ type: 'custom', cat }, e)}
                      className="w-5 h-5 flex items-center justify-center bg-white rounded-full shadow border border-red-200 hover:border-red-400" title="삭제">
                      <Trash2 className="w-2.5 h-2.5 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* ── 직접 추가 ── */}
            {onAddCustomCategory && (
              showCustomInput ? (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 rounded-xl border-2 border-orange-200">
                  <input type="text" value={newCatEmoji} onChange={(e) => setNewCatEmoji(e.target.value)}
                    maxLength={2} className="w-9 text-center bg-white rounded-lg py-1 text-sm border border-gray-200 focus:outline-none" title="이모지" />
                  <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomCategory(); } if (e.key === 'Escape') setShowCustomInput(false); }}
                    placeholder="카테고리명" autoFocus
                    className="w-24 px-2 py-1 bg-white rounded-lg text-sm border border-gray-200 focus:outline-none" />
                  <button type="button" onClick={handleAddCustomCategory} disabled={isAddingCat || !newCatName.trim()}
                    className="w-7 h-7 flex items-center justify-center bg-orange-500 text-white rounded-lg disabled:opacity-50">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => setShowCustomInput(false)}
                    className="w-7 h-7 flex items-center justify-center bg-gray-300 text-white rounded-lg">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => { setShowCustomInput(true); setEditingCatKey(null); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 border-2 border-dashed border-gray-200 transition-all">
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
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="어떤 거래인가요?"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all" />
          </div>
        </div>

        {/* 제출 */}
        <button type="submit" disabled={!amount || !category}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
            type === 'income'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
              : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
          } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}>
          {isEditMode ? '수정 완료' : type === 'income' ? '수입 추가' : '지출 추가'}
        </button>
      </form>
    </Modal>
  );
}
