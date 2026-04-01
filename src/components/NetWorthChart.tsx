
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Cell,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { MonthlyData } from '@/types';
import { calculateGrowthRate } from '@/utils/format';
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
  const [displayValue, setDisplayValue] = useState(0);
  const animRef = useRef<number | null>(null);

  const data = payload?.[0]?.payload;
  // chartData에서 netWorth는 억 단위로 변환됨 → 다시 원 단위로 복원
  const targetValue = data?.netWorth != null ? Math.round(data.netWorth * 100000000) : 0;

  useEffect(() => {
    if (!active || targetValue === 0) return;

    const duration = 500;
    const startTime = performance.now();

    if (animRef.current) cancelAnimationFrame(animRef.current);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplayValue(Math.round(targetValue * eased));
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [targetValue, active]);

  if (!active || !payload?.length || !data) return null;

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-4 border border-gray-100 min-w-[200px]">
      <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
      <p className="text-xl font-bold text-gray-900 mb-1 tabular-nums tracking-tight">
        {displayValue.toLocaleString('ko-KR')}원
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

interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function BarTooltip({ active, payload, label }: BarTooltipProps) {
  if (active && payload && payload.length) {
    const income = payload.find(p => p.name === '수입');
    const expense = payload.find(p => p.name === '지출');
    const savings = (income?.value ?? 0) - (expense?.value ?? 0);
    return (
      <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-4 border border-gray-100 min-w-[140px]">
        <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
        {income && income.value > 0 && (
          <div className="flex justify-between gap-4 text-sm mb-1">
            <span className="text-gray-500">수입</span>
            <span className="font-medium text-green-600">{(income.value / 10000).toFixed(0)}만원</span>
          </div>
        )}
        {expense && expense.value > 0 && (
          <div className="flex justify-between gap-4 text-sm mb-1">
            <span className="text-gray-500">지출</span>
            <span className="font-medium text-red-500">{(expense.value / 10000).toFixed(0)}만원</span>
          </div>
        )}
        {(income?.value ?? 0) > 0 && (
          <div className="flex justify-between gap-4 text-sm pt-1 border-t border-gray-100 mt-1">
            <span className="text-gray-500">저축</span>
            <span className={`font-bold ${savings >= 0 ? 'text-blue-500' : 'text-red-500'}`}>{(savings / 10000).toFixed(0)}만원</span>
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

  // Target line = 1월 순자산 + 올해 목표금액 (converted to 억원)
  const firstMonthNetWorth = validData.length > 0 ? validData[0].netWorth : 0;
  const effectiveTarget = (firstMonthNetWorth + targetNetWorth) / 100000000;

  // Future months show as null so they don't drop to 0 on the chart
  const chartData = monthlyData.map(d => ({
    ...d,
    netWorth: d.netWorth > 0 ? d.netWorth / 100000000 : null,
  }));

  // Smart Y-axis domain: fit the actual data range + target line, with padding
  const validChartValues = chartData.filter(d => d.netWorth != null).map(d => d.netWorth as number);
  const allValues = validChartValues.length > 0 ? [...validChartValues, effectiveTarget] : [effectiveTarget, 0];
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const range = dataMax - dataMin;
  const padding = range > 0 ? range * 0.2 : Math.max(dataMax * 0.1, 0.1);
  const yDomainMin = Math.max(0, dataMin - padding);
  const yDomainMax = dataMax + padding;

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
              tickFormatter={(value) => `${value.toFixed(1)}억`}
              dx={-10}
              domain={[yDomainMin, yDomainMax]}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={effectiveTarget}
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

      {/* Divider */}
      <div className="border-t border-gray-100 my-6" />

      {/* 월별 수입/지출 바 차트 */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-1">월별 수입 / 지출</h4>
        <p className="text-xs text-gray-400 mb-4">1월 ~ 12월 수입·지출 현황</p>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              barCategoryGap="30%"
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F7" vertical={false} />
              <XAxis
                dataKey="monthName"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8E8E93', fontSize: 11 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8E8E93', fontSize: 11 }}
                tickFormatter={(v) => v >= 10000000 ? `${(v / 100000000).toFixed(1)}억` : `${Math.round(v / 10000)}만`}
                dx={-4}
                width={44}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 8 }} />
              <Bar dataKey="income" name="수입" fill="#34C759" radius={[6, 6, 0, 0]}>
                {monthlyData.map((d) => (
                  <Cell key={d.month} fill={d.income > 0 ? '#34C759' : '#E5E5EA'} />
                ))}
              </Bar>
              <Bar dataKey="expense" name="지출" fill="#FF3B30" radius={[6, 6, 0, 0]}>
                {monthlyData.map((d) => (
                  <Cell key={d.month} fill={d.expense > 0 ? '#FF3B30' : '#E5E5EA'} />
                ))}
              </Bar>
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingTop: '12px', fontSize: '12px', color: '#6B7280' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
