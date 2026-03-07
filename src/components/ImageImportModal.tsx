import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, ImagePlus, Check, AlertCircle, Loader2 } from 'lucide-react';
import type { Transaction, CustomCategory } from '@/types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryIcon } from '@/constants/categories';
import { parseSpendingScreenshot } from '@/services/aiApi';

// ─── 타입 ───────────────────────────────────────────────────────────────────
interface ParsedDraft {
  _id: string;
  included: boolean;
  category: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  day: number;
  owner: string;
}

interface ImageImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number;
  partnerNames: [string, string];
  customCategories: CustomCategory[];
  onImport: (transactions: Omit<Transaction, 'id'>[]) => Promise<void>;
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export function ImageImportModal({
  isOpen,
  onClose,
  year,
  month,
  partnerNames,
  customCategories,
  onImport,
}: ImageImportModalProps) {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'review'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<ParsedDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxDay = new Date(year, month, 0).getDate();

  // 전체 카테고리 목록 (지출 + 수입 + 커스텀)
  const allExpenseCats = [
    ...EXPENSE_CATEGORIES,
    ...customCategories.filter(c => c.type === 'expense').map(c => ({
      id: c.name, label: c.name, icon: c.icon || '📌',
    })),
  ];
  const allIncomeCats = [
    ...INCOME_CATEGORIES,
    ...customCategories.filter(c => c.type === 'income').map(c => ({
      id: c.name, label: c.name, icon: c.icon || '📌',
    })),
  ];

  const analyzeImage = useCallback(async (base64: string, mimeType: string) => {
    setStep('analyzing');
    setError(null);
    try {
      const items = await parseSpendingScreenshot(base64, mimeType, year, month);
      if (items.length === 0) {
        setError('거래 내역을 찾지 못했어요. 다른 이미지를 시도해주세요.');
        setStep('upload');
        return;
      }
      setDrafts(
        items.map((item, i) => ({
          _id: `draft-${Date.now()}-${i}`,
          included: true,
          category: item.category,
          description: item.description,
          amount: item.amount,
          type: item.type,
          day: item.day ?? 1,
          owner: partnerNames[0],
        })),
      );
      setStep('review');
    } catch (err) {
      console.error(err);
      setError('이미지 분석에 실패했어요. 다시 시도해주세요.');
      setStep('upload');
    }
  }, [year, month, partnerNames]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능해요.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const [header, base64] = result.split(',');
      const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
      setImagePreview(result);
      analyzeImage(base64, mimeType);
    };
    reader.readAsDataURL(file);
  };

  const handleImport = async () => {
    const included = drafts.filter(d => d.included);
    if (included.length === 0) return;
    setIsImporting(true);
    const txns: Omit<Transaction, 'id'>[] = included.map(d => ({
      date: `${year}-${String(month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`,
      year,
      month,
      type: d.type,
      category: d.category,
      description: d.description,
      amount: d.amount,
      owner: d.owner,
    }));
    await onImport(txns);
    setIsImporting(false);
    handleClose();
  };

  const handleClose = () => {
    setStep('upload');
    setImagePreview(null);
    setDrafts([]);
    setError(null);
    onClose();
  };

  const updateDraft = (id: string, updates: Partial<ParsedDraft>) =>
    setDrafts(prev => prev.map(d => (d._id === id ? { ...d, ...updates } : d)));

  if (!isOpen) return null;

  const includedCount = drafts.filter(d => d.included).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">이미지로 가져오기</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {year}년 {month}월 · AI 자동 분석
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* STEP: Upload */}
          {step === 'upload' && (
            <div className="p-6">
              <div
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFile(f);
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                <ImagePlus className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="font-semibold text-gray-700 mb-1">가계부 스크린샷 업로드</p>
                <p className="text-sm text-gray-400">클릭하거나 이미지를 끌어다 놓으세요</p>
                <p className="text-xs text-gray-300 mt-1.5">PNG · JPG · WEBP 지원</p>
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-5 text-center leading-relaxed">
                💡 은행앱, 카드사앱, 가계부앱의 소비내역 화면을 캡처해서 올리면<br />
                AI가 자동으로 카테고리 분류 및 금액을 읽어드려요
              </p>
            </div>
          )}

          {/* STEP: Analyzing */}
          {step === 'analyzing' && (
            <div className="py-14 flex flex-col items-center gap-5">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="분석 중"
                  className="w-28 h-44 object-cover rounded-2xl shadow-md opacity-60"
                />
              )}
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                <div>
                  <p className="font-semibold text-gray-900">AI 분석 중...</p>
                  <p className="text-sm text-gray-400">거래 내역을 읽고 있어요</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP: Review */}
          {step === 'review' && (
            <div className="px-4 py-4">
              {/* 상단 컨트롤 */}
              <div className="flex items-center justify-between px-1 mb-3">
                <p className="text-sm text-gray-500">
                  <span className="font-bold text-gray-900">{includedCount}건</span> 선택됨
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDrafts(prev => prev.map(d => ({ ...d, included: true })))}
                    className="text-xs text-orange-500 font-medium hover:underline"
                  >
                    전체 선택
                  </button>
                  <button
                    onClick={() => setDrafts(prev => prev.map(d => ({ ...d, included: false })))}
                    className="text-xs text-gray-400 hover:underline"
                  >
                    전체 해제
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {drafts.map((draft) => (
                  <DraftItem
                    key={draft._id}
                    draft={draft}
                    maxDay={maxDay}
                    partnerNames={partnerNames}
                    expenseCats={allExpenseCats}
                    incomeCats={allIncomeCats}
                    onChange={(u) => updateDraft(draft._id, u)}
                    onRemove={() => setDrafts(prev => prev.filter(d => d._id !== draft._id))}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer (review 단계만) */}
        {step === 'review' && (
          <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
            <button
              onClick={handleImport}
              disabled={isImporting || includedCount === 0}
              className="w-full py-3.5 bg-orange-500 text-white rounded-2xl font-bold text-sm hover:bg-orange-600 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isImporting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 등록 중...</>
              ) : (
                <><Check className="w-4 h-4" /> {includedCount}건 등록하기</>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── 개별 항목 컴포넌트 ──────────────────────────────────────────────────────
interface CatOption { id: string; label: string; icon: string; }

function DraftItem({
  draft,
  maxDay,
  partnerNames,
  expenseCats,
  incomeCats,
  onChange,
  onRemove,
}: {
  draft: ParsedDraft;
  maxDay: number;
  partnerNames: [string, string];
  expenseCats: CatOption[];
  incomeCats: CatOption[];
  onChange: (u: Partial<ParsedDraft>) => void;
  onRemove: () => void;
}) {
  const icon = getCategoryIcon(draft.category);
  const catOptions = draft.type === 'expense' ? expenseCats : incomeCats;
  const ownerOptions = [partnerNames[0], partnerNames[1], 'shared'];
  const ownerLabel = draft.owner === 'shared' ? '공동' : draft.owner;

  return (
    <div
      className={`rounded-2xl p-3.5 border transition-all ${
        draft.included
          ? 'bg-white border-gray-100 shadow-sm'
          : 'bg-gray-50 border-gray-100 opacity-40'
      }`}
    >
      {/* Row 1 */}
      <div className="flex items-center gap-2">
        {/* 체크박스 */}
        <button
          onClick={() => onChange({ included: !draft.included })}
          className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
            draft.included ? 'bg-orange-500' : 'border-2 border-gray-200 hover:border-orange-300'
          }`}
        >
          {draft.included && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </button>

        {/* 카테고리 아이콘 */}
        <span className="text-xl flex-shrink-0">{icon}</span>

        {/* 카테고리 선택 */}
        <select
          value={draft.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className="flex-1 text-xs font-semibold bg-gray-50 rounded-lg px-2 py-1.5 text-gray-800 border-0 focus:outline-none focus:ring-2 focus:ring-orange-500/20 min-w-0"
        >
          {catOptions.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
          ))}
        </select>

        {/* 금액 */}
        <input
          type="number"
          value={draft.amount}
          onChange={(e) => onChange({ amount: Number(e.target.value) })}
          className="w-24 text-xs text-right font-bold text-gray-900 bg-gray-50 rounded-lg px-2 py-1.5 border-0 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        />

        {/* 지출/수입 토글 */}
        <button
          onClick={() => onChange({ type: draft.type === 'expense' ? 'income' : 'expense' })}
          className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex-shrink-0 transition-colors ${
            draft.type === 'expense'
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'bg-green-100 text-green-600 hover:bg-green-200'
          }`}
        >
          {draft.type === 'expense' ? '지출' : '수입'}
        </button>
      </div>

      {/* Row 2 */}
      <div className="flex items-center gap-2 mt-2 pl-7">
        {/* 내역 설명 */}
        <input
          type="text"
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="상호명/내역"
          className="flex-1 text-xs text-gray-500 bg-transparent border-b border-gray-100 focus:outline-none focus:border-orange-300 py-0.5 min-w-0"
        />

        {/* 일자 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <input
            type="number"
            min={1}
            max={maxDay}
            value={draft.day}
            onChange={(e) =>
              onChange({ day: Math.min(maxDay, Math.max(1, Number(e.target.value))) })
            }
            className="w-10 text-xs text-center bg-gray-50 rounded-lg px-1 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
          <span className="text-xs text-gray-400">일</span>
        </div>

        {/* 소유자 (클릭으로 순환) */}
        <button
          onClick={() => {
            const idx = ownerOptions.indexOf(draft.owner);
            onChange({ owner: ownerOptions[(idx + 1) % ownerOptions.length] });
          }}
          className="text-xs px-2.5 py-1 bg-gray-100 rounded-lg text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors flex-shrink-0 font-medium"
        >
          {ownerLabel}
        </button>

        {/* 삭제 */}
        <button
          onClick={onRemove}
          className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
