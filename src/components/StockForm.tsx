import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Hash, DollarSign, Building2, FileText, Search, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import type { StockItem } from '@/types';
import { fetchStockPrice, fetchUSStockPrice, fetchUSDToKRW, isKoreanTicker } from '@/services/stockApi';
import { formatCurrency } from '@/utils/format';

type StockMarket = 'domestic' | 'us';

interface FetchedPriceInfo {
  priceKRW: number;
  priceOriginal: number;  // USD for US, KRW for domestic
  usdKrwRate?: number;
  name: string;
}

interface StockFormProps {
  onAdd: (stock: Omit<StockItem, 'id'>) => void;
  onUpdate?: (id: string, stock: Partial<StockItem>) => void;
  onClose: () => void;
  isOpen: boolean;
  editStock?: StockItem | null;
  partnerNames: [string, string];
}

export function StockForm({ onAdd, onUpdate, onClose, isOpen, editStock, partnerNames }: StockFormProps) {
  const [market, setMarket] = useState<StockMarket>('domestic');
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [shares, setShares] = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [memo, setMemo] = useState('');
  const [owner, setOwner] = useState('shared');

  // 가격 조회 상태
  const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [fetchedInfo, setFetchedInfo] = useState<FetchedPriceInfo | null>(null);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEditing = !!editStock;

  useEffect(() => {
    if (editStock) {
      setMarket(isKoreanTicker(editStock.ticker) ? 'domestic' : 'us');
      setName(editStock.name);
      setTicker(editStock.ticker);
      setShares(editStock.shares.toString());
      setAvgPrice(editStock.avgPrice.toString());
      setCurrentPrice(editStock.currentPrice.toString());
      setMemo(editStock.memo || '');
      setOwner(editStock.owner || 'shared');
    } else {
      setMarket('domestic');
      setName('');
      setTicker('');
      setShares('');
      setAvgPrice('');
      setCurrentPrice('');
      setMemo('');
      setOwner('shared');
    }
    setFetchState('idle');
    setFetchedInfo(null);
  }, [editStock, isOpen]);

  // 마켓 변경 시 관련 필드 초기화
  useEffect(() => {
    if (!editStock) {
      setTicker('');
      setName('');
      setCurrentPrice('');
      setFetchState('idle');
      setFetchedInfo(null);
    }
  }, [editStock, market]);

  const handleFetchPrice = useCallback(async () => {
    if (!ticker) return;
    setFetchState('loading');
    setFetchedInfo(null);

    try {
      if (market === 'domestic') {
        const result = await fetchStockPrice(ticker);
        if (result) {
          setFetchedInfo({ priceKRW: result.currentPrice, priceOriginal: result.currentPrice, name: result.name });
          setCurrentPrice(result.currentPrice.toLocaleString());
          if (!name) setName(result.name);
          setFetchState('success');
        } else {
          setFetchState('error');
        }
      } else {
        // 미국: USD 조회 + 환율 변환
        const [usdResult, krwRate] = await Promise.all([
          fetchUSStockPrice(ticker),
          fetchUSDToKRW(),
        ]);
        if (usdResult) {
          const priceKRW = Math.round(usdResult.currentPrice * krwRate);
          setFetchedInfo({
            priceKRW,
            priceOriginal: usdResult.currentPrice,
            usdKrwRate: krwRate,
            name: usdResult.name,
          });
          setCurrentPrice(priceKRW.toLocaleString());
          if (!name) setName(usdResult.name);
          setFetchState('success');
        } else {
          setFetchState('error');
        }
      }
    } catch {
      setFetchState('error');
    }
  }, [market, name, ticker]);

  // 티커 입력 시 자동 조회 (debounce 800ms)
  useEffect(() => {
    if (!ticker || ticker.length < 1) {
      setFetchState('idle');
      setFetchedInfo(null);
      return;
    }
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(() => {
      handleFetchPrice();
    }, 800);
    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    };
  }, [ticker, handleFetchPrice]);

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

  const tickerLabel = market === 'domestic' ? '종목코드' : '티커';
  const tickerPlaceholder = market === 'domestic' ? '005930' : 'AAPL';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? '주식 수정' : '주식 추가'} maxWidth="max-w-md">
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
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {n === 'shared' ? '공동' : n}
              </button>
            ))}
          </div>
        </div>

        {/* 시장 구분 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">시장</label>
          <div className="flex gap-2">
            {([
              { id: 'domestic', label: '🇰🇷 국내주식' },
              { id: 'us',       label: '🇺🇸 미국주식' },
            ] as { id: StockMarket; label: string }[]).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMarket(m.id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  market === m.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* 종목코드/티커 — 자동 조회 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {tickerLabel}
            <span className="ml-2 text-xs text-gray-400 font-normal">입력하면 자동 조회됩니다</span>
          </label>
          <div className="relative">
            <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(
                market === 'domestic'
                  ? e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
                  : e.target.value.toUpperCase().replace(/[^A-Z0-9.-]/g, '')
              )}
              placeholder={tickerPlaceholder}
              className="w-full pl-12 pr-12 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
            />
            {/* 조회 상태 아이콘 */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {fetchState === 'loading' && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
              {fetchState === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {fetchState === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
              {fetchState === 'idle' && ticker.length >= 1 && (
                <button type="button" onClick={handleFetchPrice}>
                  <Search className="w-5 h-5 text-gray-400 hover:text-blue-500 transition-colors" />
                </button>
              )}
            </div>
          </div>

          {/* 조회 결과 표시 */}
          {fetchState === 'success' && fetchedInfo && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 px-3 py-2 bg-green-50 rounded-lg flex items-center justify-between"
            >
              <span className="text-xs text-green-700 font-medium truncate mr-2">{fetchedInfo.name}</span>
              <span className="text-xs text-green-800 font-bold whitespace-nowrap">
                {market === 'us' && fetchedInfo.usdKrwRate
                  ? `$${fetchedInfo.priceOriginal.toFixed(2)} × ${fetchedInfo.usdKrwRate.toLocaleString()} = ${formatCurrency(fetchedInfo.priceKRW)}`
                  : formatCurrency(fetchedInfo.priceKRW)
                }
              </span>
            </motion.div>
          )}
          {fetchState === 'error' && (
            <p className="mt-2 text-xs text-red-500 px-1">
              {market === 'domestic'
                ? '종목코드를 확인해주세요 (6자리 숫자)'
                : '티커를 확인해주세요 (예: AAPL, TSLA)'}
            </p>
          )}
        </div>

        {/* 종목명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">종목명</label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={market === 'domestic' ? '삼성전자' : 'Apple Inc.'}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* 보유 수량 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">보유 수량</label>
          <div className="relative">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="100"
              min="0"
              step={market === 'us' ? '0.0001' : '1'}
              className="w-full pl-12 pr-12 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">주</span>
          </div>
        </div>

        {/* 매수평단가 / 현재가 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">매수평단가 (원)</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={avgPrice}
                onChange={(e) => setAvgPrice(formatNumber(e.target.value))}
                placeholder={market === 'domestic' ? '65,000' : '240,000'}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">현재가 (원)</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(formatNumber(e.target.value))}
                placeholder={market === 'domestic' ? '78,500' : '250,000'}
                className={`w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all ${
                  fetchState === 'success' ? 'ring-2 ring-green-300 bg-green-50' : ''
                }`}
              />
            </div>
          </div>
        </div>

        {/* 손익 미리보기 */}
        {shares && avgPrice && currentPrice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-gray-50 rounded-xl space-y-2"
          >
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">투자금액</span>
              <span className="font-medium">{formatCurrency(investment)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">평가금액</span>
              <span className="font-medium">{formatCurrency(currentValue)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
              <span className="text-gray-500">평가손익</span>
              <span className={`font-bold ${returnValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {returnValue >= 0 ? '+' : ''}{formatCurrency(returnValue)} ({returnRate >= 0 ? '+' : ''}{returnRate.toFixed(1)}%)
              </span>
            </div>
          </motion.div>
        )}

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
          disabled={!name || !ticker || !shares || !avgPrice || !currentPrice}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isEditing ? '수정하기' : '추가하기'}
        </button>
      </form>
    </Modal>
  );
}
