import { useState } from 'react';
import { useCountUp } from '@/hooks/useCountUp';
import { useInView } from '@/hooks/useInView';
import { TrendingUp, TrendingDown, Minus, Wallet, Target, PiggyBank } from 'lucide-react';
import { formatCurrency, calculateGrowthRate } from '@/utils/format';

/**
 * 아이콘 배경 색조.
 *
 * 전에는 아이콘 뒤에 `bg-gradient-to-br ${color} bg-opacity-10`을 깔았는데,
 * bg-opacity는 그라데이션에 안 걸려서 진한 색이 그대로 칠해졌다. 그 위에
 * 같은 계열 아이콘(초록 배경 위 초록 아이콘)을 올리니 아이콘이 보이지 않고
 * 색 블록만 남았다. 연한 색조로 깔아서 아이콘이 드러나게 한다.
 */
const TINT: Record<string, string> = {
  'from-green-400 to-green-600': 'bg-green-100',
  'from-orange-400 to-orange-600': 'bg-orange-100',
  'from-purple-400 to-purple-600': 'bg-purple-100',
};

interface NetWorthBreakdownItem {
  name: string;
  value: number;
}

interface NetWorthBreakdown {
  stocks: number;
  products: number;
  debt: number;
  stockItems?: NetWorthBreakdownItem[];
  productItems?: NetWorthBreakdownItem[];
}

interface SummaryCardsProps {
  currentNetWorth: number;
  targetNetWorth: number;
  averageSavingsRate: number;
  previousNetWorth?: number;
  totalLoan?: number; // kept for prop compatibility, no longer displayed
  netWorthBreakdown?: NetWorthBreakdown;
}

interface CardProps {
  title: string;
  value: number;
  previousValue?: number;
  suffix?: string;
  prefix?: string;
  icon: React.ReactNode;
  color: string;
  delay: number;
  isInView: boolean;
  formatAsCurrency?: boolean;
}

function Card({ title, value, previousValue, suffix = '', prefix = '', icon, color, delay, isInView, formatAsCurrency = true }: CardProps) {
  const tintClass = TINT[color] ?? 'bg-gray-100';
  const displayValue = isInView ? value : 0;
  const { formattedValue } = useCountUp({
    end: displayValue,
    duration: 2000,
    delay,
    decimals: 0,
    suffix,
    prefix
  });

  const growthRate = previousValue ? calculateGrowthRate(value, previousValue) : 0;
  const isPositive = growthRate > 0;
  const isNegative = growthRate < 0;

  return (
    <div
      className="group relative surface p-4 sm:p-6
                 hover:border-[color:var(--c-accent)]/30
                 transition-all duration-500 ease-out cursor-pointer overflow-hidden"
    >
      {/* Background gradient on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${tintClass} flex items-center justify-center`}>
            {icon}
          </div>
          {previousValue !== undefined && (
            <div className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-gray-400'}`}>
              {isPositive && <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />}
              {isNegative && <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />}
              {!isPositive && !isNegative && <Minus className="w-3 h-3 sm:w-4 sm:h-4" />}
              <span>{Math.abs(growthRate).toFixed(1)}%</span>
            </div>
          )}
        </div>

        <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">{title}</p>
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
          {formatAsCurrency ? formatCurrency(displayValue) : formattedValue}
        </p>
      </div>
    </div>
  );
}

// ─── Net Worth card with breakdown tooltip on hover ───────────────────────────
function NetWorthBreakdownCard({
  value,
  previousValue,
  icon,
  color,
  isInView,
  breakdown,
}: {
  value: number;
  previousValue?: number;
  icon: React.ReactNode;
  color: string;
  isInView: boolean;
  breakdown?: NetWorthBreakdown;
}) {
  const [hovered, setHovered] = useState(false);
  const displayValue = isInView ? value : 0;
  const tintClass = TINT[color] ?? 'bg-gray-100';

  const growthRate = previousValue ? calculateGrowthRate(value, previousValue) : 0;
  const isPositive = growthRate > 0;
  const isNegative = growthRate < 0;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Main card — same style as Card */}
      <div className="group relative surface p-4 sm:p-6
                      hover:border-[color:var(--c-accent)]/30
                      transition-all duration-500 ease-out cursor-pointer overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${tintClass} flex items-center justify-center`}>
              {icon}
            </div>
            {previousValue !== undefined && (
              <div className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-gray-400'}`}>
                {isPositive && <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />}
                {isNegative && <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />}
                {!isPositive && !isNegative && <Minus className="w-3 h-3 sm:w-4 sm:h-4" />}
                <span>{Math.abs(growthRate).toFixed(1)}%</span>
              </div>
            )}
          </div>

          <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">현재 순자산</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
            {formatCurrency(displayValue)}
          </p>
        </div>
      </div>

      {/* Breakdown tooltip */}
      {breakdown && (
        <div
          className={`absolute left-0 right-0 top-full mt-2 z-50
                      bg-white rounded-2xl border border-gray-100
                      shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-4
                      transition-all duration-200
                      ${hovered
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 -translate-y-1 pointer-events-none'
                      }`}
        >
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
            순자산 구성
          </p>

          <div className="space-y-2.5">
            {/* 자산 항목 — 주식(합산 1줄) + 금융상품을 금액 큰 순으로 정렬 */}
            {(() => {
              const assetRows: { name: string; value: number; dot: string }[] = [];
              if (breakdown.stocks > 0) {
                assetRows.push({ name: '주식', value: breakdown.stocks, dot: 'bg-orange-400' });
              }
              if (breakdown.products > 0) {
                if (breakdown.productItems && breakdown.productItems.length > 0) {
                  for (const item of breakdown.productItems) {
                    assetRows.push({ name: item.name, value: item.value, dot: 'bg-purple-400' });
                  }
                } else {
                  assetRows.push({ name: '금융상품', value: breakdown.products, dot: 'bg-purple-400' });
                }
              }
              assetRows.sort((a, b) => b.value - a.value);
              return assetRows.map((row, idx) => (
                <div key={`${row.name}-${idx}`} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${row.dot} flex-shrink-0`} />
                    <span className="text-xs text-gray-600 truncate max-w-[100px]">{row.name}</span>
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-gray-900">
                    +{formatCurrency(row.value)}
                  </span>
                </div>
              ));
            })()}

            {/* Debt */}
            {breakdown.debt > 0 && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600">대출</span>
                </div>
                <span className="text-xs font-semibold tabular-nums text-red-500">
                  -{formatCurrency(breakdown.debt)}
                </span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">= 합계</span>
            <span className="text-sm font-bold text-gray-900 tabular-nums">
              {formatCurrency(value)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function SummaryCards({
  currentNetWorth,
  targetNetWorth,
  averageSavingsRate,
  previousNetWorth,
  netWorthBreakdown,
}: SummaryCardsProps) {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <div ref={ref} className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
      {/* 현재 순자산 — hover로 구성 내역 표시 */}
      <NetWorthBreakdownCard
        value={currentNetWorth}
        previousValue={previousNetWorth}
        icon={<Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />}
        color="from-green-400 to-green-600"
        isInView={isInView}
        breakdown={netWorthBreakdown}
      />

      {/* 올해 목표 금액 */}
      <Card
        title="올해 목표 금액"
        value={targetNetWorth}
        icon={<Target className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />}
        color="from-orange-400 to-orange-600"
        delay={200}
        isInView={isInView}
        formatAsCurrency={true}
      />

      {/* 평균 저축률 — 소수점 제외 */}
      <Card
        title="평균 저축률"
        value={Math.round(averageSavingsRate)}
        suffix="%"
        icon={<PiggyBank className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />}
        color="from-purple-400 to-purple-600"
        delay={300}
        isInView={isInView}
        formatAsCurrency={false}
      />
    </div>
  );
}
