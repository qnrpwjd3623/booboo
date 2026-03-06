import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface YearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  minYear?: number;
  maxYear?: number;
}

export function YearSelector({ 
  selectedYear, 
  onYearChange, 
  minYear = 2024, 
  maxYear = 2050 
}: YearSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pageOffset, setPageOffset] = useState(0);
  const yearsPerPage = 12;

  const availableYears = useMemo(() => {
    const years = [];
    for (let year = minYear; year <= maxYear; year++) {
      years.push(year);
    }
    return years;
  }, [minYear, maxYear]);

  const totalPages = Math.ceil(availableYears.length / yearsPerPage);
  const currentPageYears = availableYears.slice(
    pageOffset * yearsPerPage, 
    (pageOffset + 1) * yearsPerPage
  );

  const handlePrevPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPageOffset(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPageOffset(prev => Math.min(totalPages - 1, prev + 1));
  };

  const handleYearSelect = (year: number) => {
    onYearChange(year);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 bg-white rounded-xl sm:rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-shadow"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
        <span className="text-base sm:text-lg font-semibold text-gray-900">{selectedYear}년</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 mt-2 w-64 sm:w-72 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden z-50"
            >
              {/* Pagination Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <button
                  onClick={handlePrevPage}
                  disabled={pageOffset === 0}
                  className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-sm font-medium text-gray-600">
                  {currentPageYears[0]} - {currentPageYears[currentPageYears.length - 1]}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={pageOffset >= totalPages - 1}
                  className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Year Grid */}
              <div className="grid grid-cols-3 gap-2 p-3">
                {currentPageYears.map((year) => (
                  <motion.button
                    key={year}
                    onClick={() => handleYearSelect(year)}
                    className={`
                      px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                      ${selectedYear === year 
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {year}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
