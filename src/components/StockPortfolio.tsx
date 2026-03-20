import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Package, Edit2, Trash2 } from 'lucide-react';
import type { StockItem } from '@/types';
import { formatCurrencyWon } from '@/utils/format';
import { useInView } from '@/hooks/useInView';

interface StockPortfolioProps {
  stocks: StockItem[];
  onEdit: (stock: StockItem) => void;
  onDelete: (id: string) => void;
}

export function StockPortfolio({ stocks, onEdit, onDelete }: StockPortfolioProps) {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.2 });

  const totalInvestment = stocks.reduce((sum, stock) => sum + (stock.shares * stock.avgPrice), 0);
  const totalCurrentValue = stocks.reduce((sum, stock) => sum + (stock.shares * stock.currentPrice), 0);
  const totalReturn = totalCurrentValue - totalInvestment;
  const totalReturnRate = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;

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
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">주식 포트폴리오</h3>
            <p className="text-xs sm:text-sm text-gray-500">{stocks.length}개 종목</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">총 수익률</p>
          <div className={`flex items-center gap-1 ${totalReturnRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalReturnRate >= 0 ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />}
            <span className="text-base sm:text-lg font-bold">{totalReturnRate >= 0 ? '+' : ''}{totalReturnRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Stock List */}
      <div className="space-y-2 sm:space-y-3">
        {stocks.map((stock, index) => {
          const investment = stock.shares * stock.avgPrice;
          const currentValue = stock.shares * stock.currentPrice;
          const stockReturn = currentValue - investment;
          const returnRate = investment > 0 ? (stockReturn / investment) * 100 : 0;
          const isProfit = stockReturn >= 0;

          return (
            <motion.div
              key={stock.id}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: index * 0.05 + 0.2 }}
              className="group p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                {/* Stock Info */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`
                    w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold
                    ${isProfit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}
                  `}>
                    {stock.ticker.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">{stock.name}</p>
                      {stock.owner && stock.owner !== 'shared' && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-500">{stock.owner}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{stock.ticker} · {stock.shares}주</p>
                  </div>
                </div>

                {/* Price Info */}
                <div className="text-right">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">{formatCurrencyWon(currentValue)}</p>
                  <div className={`flex items-center justify-end gap-1 text-xs ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                    {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{isProfit ? '+' : ''}{returnRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Expanded Info */}
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 grid grid-cols-3 gap-2 sm:gap-4 opacity-60 group-hover:opacity-100 transition-opacity">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">매수평단</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-700">{formatCurrencyWon(stock.avgPrice)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">현재가</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-700">{formatCurrencyWon(stock.currentPrice)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">평가손익</p>
                  <p className={`text-xs sm:text-sm font-medium ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                    {isProfit ? '+' : ''}{formatCurrencyWon(stockReturn)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-2 pt-2 border-t border-gray-200 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(stock)}
                  className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
                >
                  <Edit2 className="w-3 h-3" />
                  수정
                </button>
                <button
                  onClick={() => onDelete(stock.id)}
                  className="flex items-center gap-1 text-xs text-red-500 hover:underline"
                >
                  <Trash2 className="w-3 h-3" />
                  삭제
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">총 투자금액</span>
          <span className="font-semibold text-gray-900">{formatCurrencyWon(totalInvestment)}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-500">총 평가금액</span>
          <span className="font-semibold text-gray-900">{formatCurrencyWon(totalCurrentValue)}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-500">총 평가손익</span>
          <span className={`font-semibold ${totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalReturn >= 0 ? '+' : ''}{formatCurrencyWon(totalReturn)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
