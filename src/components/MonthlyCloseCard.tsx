import { useState } from 'react';
import { Check, CheckCircle2, Landmark, Loader2, TrendingUp, WalletCards } from 'lucide-react';
import { Modal } from './Modal';
import { formatCurrency } from '@/utils/format';
import type { NetWorthSnapshot } from '@/types';

export interface MonthlyClosePreview {
  previousNetWorth: number | null;
  income: number;
  expense: number;
  savings: number;
  assetChange: number;
  cash: number;
  stocks: number;
  products: number;
  debt: number;
  netWorth: number;
}

interface MonthlyCloseCardProps {
  year: number;
  month: number;
  snapshot?: NetWorthSnapshot;
  preview: MonthlyClosePreview;
  isCurrentMonth: boolean;
  onConfirm: () => Promise<void>;
}

function SignedAmount({ value }: { value: number }) {
  return (
    <span className={`font-semibold ${value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
      {value >= 0 ? '+' : ''}{formatCurrency(value)}
    </span>
  );
}

export function MonthlyCloseCard({
  year,
  month,
  snapshot,
  preview,
  isCurrentMonth,
  onConfirm,
}: MonthlyCloseCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const isClosed = Boolean(snapshot && !snapshot.isEstimated);
  const displayedNetWorth = isClosed && snapshot ? snapshot.netWorth : preview.netWorth;

  const handleConfirm = async () => {
    setError('');
    setIsSaving(true);
    try {
      await onConfirm();
      setIsOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '자산 마감 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="mt-4 border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-xs text-gray-400">
            {isClosed && <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />}
            <span className="truncate">
              {isClosed
                ? `${month}월 순자산 ${formatCurrency(displayedNetWorth)} 저장됨`
                : `${month}월 자산 마감 전`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex-shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          >
            {isClosed ? '내역 보기' : '자산 마감'}
          </button>
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => !isSaving && setIsOpen(false)}
        title={`${year}년 ${month}월 자산 마감`}
        maxWidth="max-w-xl"
      >
        <div className="space-y-5 p-6">
          {!isCurrentMonth && (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">
              과거 월을 다시 마감하면 현재 입력된 자산 평가액으로 해당 월 기록을 덮어씁니다.
            </div>
          )}

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">순자산 계산</p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">전월 마감 순자산</span>
                <span className="font-semibold text-gray-800">
                  {preview.previousNetWorth == null ? '기록 없음' : formatCurrency(preview.previousNetWorth)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">이번 달 순저축</span>
                <SignedAmount value={preview.savings} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">자산 평가 변동</span>
                <SignedAmount value={preview.assetChange} />
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-end justify-between">
                  <span className="font-semibold text-gray-900">{month}월 마감 순자산</span>
                  <span className="text-2xl font-bold text-blue-600">{formatCurrency(preview.netWorth)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">현재 자산 구성</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-100 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-gray-400"><WalletCards className="h-3.5 w-3.5" />현금·통장 추정</div>
                <p className="font-semibold text-gray-900">{formatCurrency(preview.cash)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-gray-400"><TrendingUp className="h-3.5 w-3.5" />주식</div>
                <p className="font-semibold text-gray-900">{formatCurrency(preview.stocks)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-gray-400"><Landmark className="h-3.5 w-3.5" />금융상품·부동산</div>
                <p className="font-semibold text-gray-900">{formatCurrency(preview.products)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="mb-1 text-xs text-gray-400">대출</p>
                <p className="font-semibold text-red-500">{preview.debt > 0 ? '-' : ''}{formatCurrency(preview.debt)}</p>
              </div>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-gray-400">
            마감 후 주가나 부동산 가격이 바뀌어도 이 월의 확정값은 유지됩니다. 다시 마감하면 최신 입력값으로 덮어씁니다.
          </p>

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isClosed ? `${month}월 다시 마감` : `${month}월 마감 확정`}
          </button>
        </div>
      </Modal>
    </>
  );
}
