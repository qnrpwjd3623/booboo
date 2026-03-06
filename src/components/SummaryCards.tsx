import { useCountUp } from '@/hooks/useCountUp';
import { useInView } from '@/hooks/useInView';
import { TrendingUp, TrendingDown, Minus, Wallet, Target, PiggyBank } from 'lucide-react';
import { formatCurrency, calculateGrowthRate } from '@/utils/format';

interface SummaryCardsProps {
  currentNetWorth: number;
  targetNetWorth: number;
  averageSavingsRate: number;
  previousNetWorth?: number;
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
      className="group relative bg-white rounded-[24px] p-4 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] 
                 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] hover:-translate-y-1 
                 transition-all duration-500 ease-out cursor-pointer overflow-hidden"
    >
      {/* Background gradient on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${color} bg-opacity-10 flex items-center justify-center`}>
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

export function SummaryCards({ 
  currentNetWorth, 
  targetNetWorth, 
  averageSavingsRate,
  previousNetWorth 
}: SummaryCardsProps) {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.2 });

  const cards = [
    {
      title: '현재 순자산',
      value: currentNetWorth,
      previousValue: previousNetWorth,
      icon: <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />,
      color: 'from-green-400 to-green-600',
      delay: 0,
      formatAsCurrency: true
    },
    {
      title: '올해 목표 금액',
      value: targetNetWorth,
      icon: <Target className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />,
      color: 'from-orange-400 to-orange-600',
      delay: 200,
      formatAsCurrency: true
    },
    {
      title: '평균 저축률',
      value: averageSavingsRate,
      suffix: '%',
      icon: <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />,
      color: 'from-purple-400 to-purple-600',
      delay: 400,
      formatAsCurrency: false
    }
  ];

  return (
    <div ref={ref} className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
      {cards.map((card, index) => (
        <Card
          key={index}
          {...card}
          isInView={isInView}
        />
      ))}
    </div>
  );
}
