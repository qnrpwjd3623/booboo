import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ChevronDown, Building2, Landmark } from 'lucide-react';
import type { FinancialProduct } from '@/types';
import { formatCurrencyWon } from '@/utils/format';
import { fetchStockPrice } from '@/services/stockApi';
import { useInView } from '@/hooks/useInView';

interface RetirementPortfolioProps {
  products: FinancialProduct[];
}

const TYPE_LABEL: Record<string, string> = {
  irp: 'IRP',
  isa: 'ISA',
  fund: 'DC',
};

const TYPE_COLOR: Record<string, string> = {
  irp: 'bg-purple-100 text-purple-600',
  isa: 'bg-blue-100 text-blue-600',
  fund: 'bg-orange-100 text-orange-600',
};

export function RetirementPortfolio({ products }: RetirementPortfolioProps) {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  const accounts = products.filter((p) => ['irp', 'isa', 'fund'].includes(p.type));

  // 계좌의 현재 평가액 계산 (ETF 모드: livePrices 우선, 없으면 저장값)
  const getAccountValue = useCallback((product: FinancialProduct): number => {
    if (product.holdings && product.holdings.length > 0) {
      const total = product.holdings.reduce((sum, h) => {
        const price = livePrices[h.ticker] ?? null;
        return sum + (price !== null ? price * h.shares : 0);
      }, 0);
      // 아직 가격 미조회면 저장된 currentValue 사용
      const hasLive = product.holdings.some((h) => livePrices[h.ticker] !== undefined);
      return hasLive ? Math.round(total) : product.currentValue;
    }
    return product.currentValue;
  }, [livePrices]);

  // 전체 합계
  const totalPrincipal = accounts.reduce((s, p) => s + p.principal, 0);
  const totalCurrentValue = accounts.reduce((s, p) => s + getAccountValue(p), 0);
  const totalReturn = totalCurrentValue - totalPrincipal;
  const totalReturnRate = totalPrincipal > 0 ? (totalReturn / totalPrincipal) * 100 : 0;

  // ETF 현재가 자동 조회 (마운트 시 + 5분 간격)
  useEffect(() => {
    const tickers = [...new Set(accounts.flatMap((p) => p.holdings?.map((h) => h.ticker) ?? []))];
    if (tickers.length === 0) return;

    const fetchPrices = async () => {
      const results = await Promise.allSettled(
        tickers.map(async (ticker) => {
          const r = await fetchStockPrice(ticker);
          return { ticker, price: r?.currentPrice ?? null };
        })
      );
      setLivePrices((prev) => {
        const next = { ...prev };
        results.forEach((r) => {
          if (r.status === 'fulfilled' && r.value.price !== null) {
            next[r.value.ticker] = r.value.price;
          }
        });
        return next;
      });
    };

    fetchPrices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.map((a) => a.id).join(',')]);

  if (accounts.length === 0) return null;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-[28px] p-4 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Landmark className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">퇴직연금 포트폴리오</h3>
            <p className="text-xs sm:text-sm text-gray-500">IRP · ISA · DC퇴직금 {accounts.length}개 계좌</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">총 수익률</p>
            <div className={`flex items-center gap-1 ${totalReturnRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalReturnRate >= 0 ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />}
              <span className="text-base sm:text-lg font-bold">{totalReturnRate >= 0 ? '+' : ''}{totalReturnRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 계좌 목록 */}
      <div className="space-y-2 sm:space-y-3">
        {accounts.map((account, index) => {
          const currentVal = getAccountValue(account);
          const ret = currentVal - account.principal;
          const retRate = account.principal > 0 ? (ret / account.principal) * 100 : 0;
          const isProfit = ret >= 0;
          const isEtfMode = account.holdings && account.holdings.length > 0;
          const isExpanded = expandedId === account.id;

          return (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: index * 0.05 + 0.2 }}
              className="bg-gray-50 rounded-xl sm:rounded-2xl overflow-hidden"
            >
              {/* 계좌 행 */}
              <div
                className={`group p-3 sm:p-4 ${isEtfMode ? 'cursor-pointer hover:bg-gray-100' : ''} transition-colors`}
                onClick={() => isEtfMode && setExpandedId(isExpanded ? null : account.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* 타입 뱃지 */}
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-xs font-bold ${TYPE_COLOR[account.type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABEL[account.type] ?? account.type.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{account.name}</p>
                        {account.owner && account.owner !== 'shared' && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-500">{account.owner}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Building2 className="w-3 h-3" />
                        <span>{account.company}</span>
                        {isEtfMode && <span className="text-purple-400">· ETF {account.holdings!.length}종목</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">{formatCurrencyWon(currentVal)}</p>
                      <div className={`flex items-center justify-end gap-1 text-xs ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                        {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{isProfit ? '+' : ''}{retRate.toFixed(1)}%</span>
                      </div>
                    </div>
                    {isEtfMode && (
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </div>

                {/* 기본 요약 (hover 시) */}
                <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-3 gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">납입 원금</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-700">{formatCurrencyWon(account.principal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">평가금액</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-700">{formatCurrencyWon(currentVal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">평가손익</p>
                    <p className={`text-xs sm:text-sm font-medium ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                      {isProfit ? '+' : ''}{formatCurrencyWon(ret)}
                    </p>
                  </div>
                </div>
              </div>

              {/* ETF 종목 펼침 */}
              <AnimatePresence>
                {isExpanded && isEtfMode && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2 border-t border-gray-200">
                      <p className="text-xs text-gray-400 pt-3 mb-2">보유 ETF</p>
                      {account.holdings!.map((holding, hi) => {
                        const livePrice = livePrices[holding.ticker] ?? null;
                        const holdingValue = livePrice !== null ? Math.round(livePrice * holding.shares) : null;
                        const holdingCost = holding.avgPrice ? holding.avgPrice * holding.shares : null;
                        const holdingReturn = holdingValue !== null && holdingCost !== null ? holdingValue - holdingCost : null;
                        const holdingRate = holdingCost && holdingCost > 0 && holdingReturn !== null
                          ? (holdingReturn / holdingCost) * 100 : null;
                        const htProfit = holdingReturn !== null ? holdingReturn >= 0 : true;

                        return (
                          <div key={hi} className="flex items-center justify-between p-2.5 bg-white rounded-xl">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${htProfit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                                {holding.ticker.slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-800">{holding.name || holding.ticker}</p>
                                <p className="text-xs text-gray-400">{holding.ticker} · {holding.shares}좌</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {holdingValue !== null ? (
                                <>
                                  <p className="text-xs font-semibold text-gray-800">{formatCurrencyWon(holdingValue)}</p>
                                  {holdingRate !== null && (
                                    <p className={`text-xs ${htProfit ? 'text-green-500' : 'text-red-500'}`}>
                                      {htProfit ? '+' : ''}{holdingRate.toFixed(1)}%
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className="text-xs text-gray-400">
                                  {holding.avgPrice ? `매수 ${formatCurrencyWon(holding.avgPrice)}` : '-'}
                                  <br />
                                  <span className="text-purple-400">↑ 갱신 필요</span>
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">총 납입 원금</span>
          <span className="font-semibold text-gray-900">{formatCurrencyWon(totalPrincipal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">총 평가금액</span>
          <span className="font-semibold text-gray-900">{formatCurrencyWon(totalCurrentValue)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">총 평가손익</span>
          <span className={`font-bold ${totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalReturn >= 0 ? '+' : ''}{formatCurrencyWon(totalReturn)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
