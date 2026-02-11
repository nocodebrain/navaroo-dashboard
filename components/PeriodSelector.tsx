import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface PeriodSelectorProps {
  currentMonth: string;
  selectedMonthIndex: number;
  totalMonths: number;
  comparisonMode: 'mom' | 'yoy';
  onMonthChange: (index: number) => void;
  onComparisonChange: (mode: 'mom' | 'yoy') => void;
}

export default function PeriodSelector({
  currentMonth,
  selectedMonthIndex,
  totalMonths,
  comparisonMode,
  onMonthChange,
  onComparisonChange
}: PeriodSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm px-5 py-3 border border-slate-200">
        <button
          onClick={() => onMonthChange(Math.min(selectedMonthIndex + 1, totalMonths - 1))}
          disabled={selectedMonthIndex >= totalMonths - 1}
          className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex items-center gap-3 min-w-[160px] justify-center">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-slate-900 text-lg">{currentMonth}</span>
        </div>
        <button
          onClick={() => onMonthChange(Math.max(selectedMonthIndex - 1, 0))}
          disabled={selectedMonthIndex === 0}
          className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-1">
        <button
          onClick={() => onComparisonChange('mom')}
          className={`px-5 py-2.5 rounded-md text-sm font-semibold transition-all ${
            comparisonMode === 'mom' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Month over Month
        </button>
        <button
          onClick={() => onComparisonChange('yoy')}
          className={`px-5 py-2.5 rounded-md text-sm font-semibold transition-all ${
            comparisonMode === 'yoy' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Year over Year
        </button>
      </div>
    </div>
  );
}
