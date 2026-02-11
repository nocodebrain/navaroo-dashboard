import { Upload } from 'lucide-react';

interface ChartCardProps {
  title: string;
  hasData: boolean;
  children: React.ReactNode;
}

export default function ChartCard({ title, hasData, children }: ChartCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h3 className="text-xl font-bold text-slate-900 mb-6">{title}</h3>
      {hasData ? (
        children
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-slate-100 rounded-full p-6 mb-4">
            <Upload className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium mb-2">No data available</p>
          <p className="text-sm text-slate-500">Upload financial data to view this chart</p>
        </div>
      )}
    </div>
  );
}
