import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatPercent } from '../lib/formatters';

interface KpiCardProps {
  label: string;
  value: number | null;
  change?: number;
  format: 'currency' | 'percent' | 'ratio';
  color: string;
  positive?: boolean;
  helper?: string;
}

const colorClasses = {
  green: 'border-green-500 bg-green-50',
  blue: 'border-blue-500 bg-blue-50',
  purple: 'border-purple-500 bg-purple-50',
  orange: 'border-orange-500 bg-orange-50',
  red: 'border-red-500 bg-red-50',
  cyan: 'border-cyan-500 bg-cyan-50',
  teal: 'border-teal-500 bg-teal-50',
  indigo: 'border-indigo-500 bg-indigo-50',
  pink: 'border-pink-500 bg-pink-50'
};

export default function KpiCard({ 
  label, 
  value, 
  change, 
  format,
  color,
  positive = true,
  helper
}: KpiCardProps) {
  const formatValue = (val: number | null) => {
    if (val === null) return '—';
    if (format === 'currency') return formatCurrency(val);
    if (format === 'percent') return formatPercent(val);
    if (format === 'ratio') return `${val.toFixed(2)}:1`;
    return val.toLocaleString();
  };

  const showChange = change !== undefined && value !== null && value !== 0;
  const isPositiveChange = (positive && change! >= 0) || (!positive && change! <= 0);

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${colorClasses[color as keyof typeof colorClasses]} transition-all hover:shadow-md`}>
      <p className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-slate-900 mb-3">
        {formatValue(value)}
      </p>
      {showChange ? (
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full ${
            isPositiveChange ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {change! >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(change!).toFixed(1)}%
          </div>
          {helper && <span className="text-xs text-slate-500">{helper}</span>}
        </div>
      ) : (
        <div className="h-8"></div>
      )}
    </div>
  );
}
