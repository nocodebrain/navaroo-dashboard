import { Upload, FileSpreadsheet, TrendingUp } from 'lucide-react';

interface EmptyStatePanelProps {
  onUpload: () => void;
}

export default function EmptyStatePanel({ onUpload }: EmptyStatePanelProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-12 border-2 border-dashed border-blue-200 text-center mb-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-20 rounded-full"></div>
            <div className="relative bg-white rounded-full p-6 shadow-lg">
              <FileSpreadsheet className="w-16 h-16 text-blue-600" />
            </div>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          Upload your financial data to get started
        </h2>
        <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto">
          Import your Xero Profit & Loss and Balance Sheet reports to see real-time analytics, trends, and forecasts.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <button
            onClick={onUpload}
            className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl flex items-center gap-3"
          >
            <Upload className="w-6 h-6" />
            Upload Excel Files
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="bg-green-100 rounded-lg p-3 w-fit mb-3">
              <FileSpreadsheet className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Export from Xero</h3>
            <p className="text-sm text-slate-600">
              Download Profit & Loss and Balance Sheet reports in Excel format
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="bg-blue-100 rounded-lg p-3 w-fit mb-3">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Upload Files</h3>
            <p className="text-sm text-slate-600">
              Click "Upload Data" in the sidebar and select your Excel files
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="bg-purple-100 rounded-lg p-3 w-fit mb-3">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">View Insights</h3>
            <p className="text-sm text-slate-600">
              Instant KPIs, charts, and forecasts populate automatically
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
