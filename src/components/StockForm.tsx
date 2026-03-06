import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Hash, DollarSign, Building2, FileText } from 'lucide-react';
import { Modal } from './Modal';
import type { StockItem } from '@/types';

interface StockFormProps {
  onAdd: (stock: Omit<StockItem, 'id'>) => void;
  onUpdate?: (id: string, stock: Partial<StockItem>) => void;
  onClose: () => void;
  isOpen: boolean;
  editStock?: StockItem | null;
  partnerNames: [string, string];
}

export function StockForm({ onAdd, onUpdate, onClose, isOpen, editStock, partnerNames }: StockFormProps) {
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [shares, setShares] = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [memo, setMemo] = useState('');
  const [owner, setOwner] = useState('shared');

  const isEditing = !!editStock;

  useEffect(() => {
    if (editStock) {
      setName(editStock.name);
      setTicker(editStock.ticker);
      setShares(editStock.shares.toString());
      setAvgPrice(editStock.avgPrice.toString());
      setCurrentPrice(editStock.currentPrice.toString());
      setMemo(editStock.memo || '');
      setOwner(editStock.owner || 'shared');
    } else {
      setName('');
      setTicker('');
      setShares('');
      setAvgPrice('');
      setCurrentPrice('');
      setMemo('');
      setOwner('shared');
    }
  }, [editStock, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ticker || !shares || !avgPrice || !currentPrice) return;

    const stockData = {
      name,
      ticker,
      shares: Number(shares),
      avgPrice: Number(avgPrice.replace(/,/g, '')),
      currentPrice: Number(currentPrice.replace(/,/g, '')),
      memo,
      owner,
    };

    if (isEditing && editStock && onUpdate) {
      onUpdate(editStock.id, stockData);
    } else {
      onAdd(stockData);
    }

    onClose();
  };

  const formatNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    return numbers ? Number(numbers).toLocaleString() : '';
  };

  const investment = Number(shares || 0) * Number(avgPrice.replace(/,/g, '') || 0);
  const currentValue = Number(shares || 0) * Number(currentPrice.replace(/,/g, '') || 0);
  const returnValue = currentValue - investment;
  const returnRate = investment > 0 ? (returnValue / investment) * 100 : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? '주식 수정' : '주식 추가'} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Owner Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">소유자</label>
          <div className="flex gap-2">
            {['shared', partnerNames[0], partnerNames[1]].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setOwner(n)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${owner === n
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {n === 'shared' ? '공동' : n}
              </button>
            ))}
          </div>
        </div>

        {/* Stock Name & Ticker */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">종목명</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="삼성전자"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">티커</label>
            <div className="relative">
              <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="005930"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Shares */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">보유 수량</label>
          <div className="relative">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="100"
              className="w-full pl-12 pr-12 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">주</span>
          </div>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">매수평단가</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={avgPrice}
                onChange={(e) => setAvgPrice(formatNumber(e.target.value))}
                placeholder="65,000"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">현재가</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(formatNumber(e.target.value))}
                placeholder="78,500"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        {shares && avgPrice && currentPrice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-gray-50 rounded-xl space-y-2"
          >
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">투자금액</span>
              <span className="font-medium">{investment.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">평가금액</span>
              <span className="font-medium">{currentValue.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
              <span className="text-gray-500">평가손익</span>
              <span className={`font-bold ${returnValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {returnValue >= 0 ? '+' : ''}{returnValue.toLocaleString()}원 ({returnRate >= 0 ? '+' : ''}{returnRate.toFixed(1)}%)
              </span>
            </div>
          </motion.div>
        )}

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
          disabled={!name || !ticker || !shares || !avgPrice || !currentPrice}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isEditing ? '수정하기' : '추가하기'}
        </button>
      </form>
    </Modal>
  );
}
