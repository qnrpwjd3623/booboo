import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Minus, Pencil } from 'lucide-react';
import type { MonthlyData } from '@/types';
import { useInView } from '@/hooks/useInView';

interface MonthlyHeatmapProps {
  monthlyData: MonthlyData[];
  monthlyTargets: Record<number, number>;
  onUpdateTarget: (month: number, target: number) => void;
}

export function MonthlyHeatmap({ monthlyData, monthlyTargets, onUpdateTarget }: MonthlyHeatmapProps) {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.2 });
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingMonth !== null) {
      // Small delay to ensure DOM is ready after AnimatePresence
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editingMonth]);

  const getStatusColor = (data: MonthlyData): string => {
    if (data.netWorth === 0) return 'bg-gray-100 text-gray-400'; // Future
    if (data.targetAchieved) return 'bg-green-100 text-green-600 border-green-200'; // Success
    return 'bg-red-50 text-red-500 border-red-200'; // Failed
  };

  const getStatusIcon = (data: MonthlyData) => {
    if (data.netWorth === 0) return <Minus className="w-4 h-4" />;
    if (data.targetAchieved) return <Check className="w-4 h-4" />;
    return <X className="w-4 h-4" />;
  };

  const handleStartEdit = useCallback((e: React.MouseEvent, data: MonthlyData) => {
    e.stopPropagation();
    if (editingMonth === data.month) return; // Already editing this month
    const currentTarget = monthlyTargets[data.month] ?? data.targetSavingsRate;
    setEditValue(String(currentTarget));
    setEditingMonth(data.month);
  }, [editingMonth, monthlyTargets]);

  const handleSaveEdit = useCallback(() => {
    if (editingMonth === null) return;
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      onUpdateTarget(editingMonth, parsed);
    }
    setEditingMonth(null);
  }, [editingMonth, editValue, onUpdateTarget]);

  const handleCancelEdit = useCallback(() => {
    setEditingMonth(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  // Close edit when clicking outside
  useEffect(() => {
    if (editingMonth === null) return;
    const handleClickOutside = () => setEditingMonth(null);
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [editingMonth]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-white rounded-[28px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">월별 달성 현황</h3>

      <div className="grid grid-cols-4 gap-3">
        {monthlyData.map((data, index) => {
          const isFuture = data.netWorth === 0;
          const isEditing = editingMonth === data.month;

          return (
            <motion.div
              key={data.month}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: index * 0.05 + 0.3 }}
              className={`
                group relative aspect-square rounded-2xl flex flex-col items-center justify-center
                border-2 transition-all duration-300 cursor-pointer
                ${isEditing ? '' : 'hover:scale-105 hover:shadow-lg'}
                ${getStatusColor(data)}
              `}
              onClick={(e) => !isEditing && handleStartEdit(e, data)}
            >
              <span className="text-xs font-medium mb-1">{data.monthName}</span>
              <motion.div
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{ delay: index * 0.05 + 0.5, type: "spring" }}
              >
                {getStatusIcon(data)}
              </motion.div>

              {/* Tooltip on hover - show target & actual */}
              {!isEditing && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  <div className="flex flex-col gap-0.5">
                    <span>🎯 목표: {data.targetSavingsRate}%</span>
                    {!isFuture && (
                      <>
                        <span>📊 실제: {data.savingsRate.toFixed(1)}%</span>
                        <span>{data.targetAchieved ? '✅ 달성' : '❌ 미달성'}</span>
                      </>
                    )}
                    <span className="text-gray-400 text-[10px] mt-0.5 flex items-center gap-1">
                      <Pencil className="w-2.5 h-2.5" /> 클릭하여 목표 수정
                    </span>
                  </div>
                  {/* Tooltip arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              )}

              {/* Inline Edit Modal */}
              <AnimatePresence>
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-blue-400 shadow-xl p-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[10px] font-medium text-gray-500 mb-1">목표 저축률</span>
                    <div className="flex items-center gap-0.5">
                      <input
                        ref={inputRef}
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-10 h-6 text-center text-xs font-bold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-xs font-bold text-gray-500">%</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                        className="w-6 h-5 flex items-center justify-center bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                        className="w-6 h-5 flex items-center justify-center bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-lg bg-green-100 border-2 border-green-200 flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-green-600" />
          </div>
          <span className="text-xs text-gray-500">달성</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-lg bg-red-50 border-2 border-red-200 flex items-center justify-center">
            <X className="w-2.5 h-2.5 text-red-500" />
          </div>
          <span className="text-xs text-gray-500">미달성</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-lg bg-gray-100 flex items-center justify-center">
            <Minus className="w-2.5 h-2.5 text-gray-400" />
          </div>
          <span className="text-xs text-gray-500">미래</span>
        </div>
      </div>
    </motion.div>
  );
}
