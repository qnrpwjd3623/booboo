
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { MonthlyData } from '@/types';
import { formatCurrency, calculateGrowthRate } from '@/utils/format';
import { useInView } from '@/hooks/useInView';

interface NetWorthChartProps {
  monthlyData: MonthlyData[];
  targetNetWorth: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: MonthlyData }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-4 border border-gray-100">
        <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
        <p className="text-lg font-bold text-gray-900 mb-1">
          {formatCurrency(data.netWorth)}
        </p>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">저축률:</span>
          <span className={`font-medium ${data.savingsRate >= 40 ? 'text-green-500' : 'text-orange-500'}`}>
            {data.savingsRate.toFixed(1)}%
          </span>
        </div>
        {data.targetAchieved && (
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
            <span className="text-xs font-medium text-green-600">목표 달성</span>
          </div>
        )}
      </div>
    );
  }
  return null;
}

export function NetWorthChart({ monthlyData, targetNetWorth }: NetWorthChartProps) {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.2 });

  // Filter out future months (netWorth = 0)
  const validData = monthlyData.filter(d => d.netWorth > 0);
  const currentMonth = validData[validData.length - 1];
  const previousMonth = validData.length > 1 ? validData[validData.length - 2] : null;
  
  const monthlyGrowth = previousMonth 
    ? calculateGrowthRate(currentMonth.netWorth, previousMonth.netWorth)
    : 0;

  const chartData = monthlyData.map(d => ({
    ...d,
    netWorth: d.netWorth / 100000000, // Convert to 억원 for display
  }));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-white rounded-[28px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">순자산 성장 추이</h3>
          <p className="text-sm text-gray-500">1월 ~ 12월 순자산 변화</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">전월대비</p>
            <div className={`flex items-center gap-1 ${monthlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {monthlyGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span className="text-sm font-semibold">{Math.abs(monthlyGrowth).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}

          >
            <defs>
              <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F7" vertical={false} />
            <XAxis 
              dataKey="monthName" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8E8E93', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8E8E93', fontSize: 12 }}
              tickFormatter={(value) => `${value}억`}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine 
              y={targetNetWorth / 100000000} 
              stroke="#34C759" 
              strokeDasharray="5 5"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke="#007AFF"
              strokeWidth={3}
              fill="url(#colorNetWorth)"
              animationDuration={2000}
              animationBegin={300}
              dot={false}
              activeDot={{ r: 8, fill: '#007AFF', stroke: '#fff', strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-xs text-gray-500">순자산</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" style={{ background: 'repeating-linear-gradient(45deg, #34C759, #34C759 2px, transparent 2px, transparent 4px)' }} />
          <span className="text-xs text-gray-500">목표 금액</span>
        </div>
      </div>
    </motion.div>
  );
}
