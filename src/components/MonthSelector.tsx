import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, CalendarDays, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MonthSelectorProps {
  selectedMonth: number | null;
  onMonthChange: (month: number | null) => void;
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (month: number) => {
    onMonthChange(selectedMonth === month ? null : month);
    setIsOpen(false);
  };

  return (
    <>
      {/* 트리거 버튼 */}
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium ${
          selectedMonth !== null
            ? 'bg-orange-500 text-white shadow-orange-200'
            : 'bg-white text-gray-700'
        }`}
      >
        <CalendarDays className="w-4 h-4" />
        {selectedMonth !== null ? `${selectedMonth}월` : '월 선택'}
        {selectedMonth !== null ? (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onMonthChange(null);
            }}
            className="ml-0.5 hover:bg-orange-400 rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3" />
          </span>
        ) : (
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* 월 선택 드롭다운 — portal로 body에 렌더링하여 overflow clip 방지 */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              style={{ top: dropdownPos.top, right: dropdownPos.right }}
              className="fixed bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-[9999] w-52"
            >
              <p className="text-xs text-gray-400 font-medium mb-2 px-1">월간 거래 관리</p>
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                  const isSelected = selectedMonth === month;
                  return (
                    <button
                      key={month}
                      onClick={() => handleSelect(month)}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                    >
                      {month}월
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
