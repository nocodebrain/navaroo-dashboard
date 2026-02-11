import { Upload, Activity, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

interface SidebarProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  uploadStatus: string;
}

export default function Sidebar({ onFileUpload, uploading, uploadStatus }: SidebarProps) {
  return (
    <div className="w-72 bg-[#0f172a] text-white p-6 flex flex-col shadow-2xl">
      <div className="mb-12">
        <h1 className="text-3xl font-bold mb-1">Navaroo</h1>
        <p className="text-slate-400 text-sm font-medium">Financial Dashboard</p>
      </div>
      
      <nav className="flex-1 space-y-2">
        <a href="#" className="flex items-center gap-3 px-4 py-3.5 rounded-lg bg-blue-600 text-white shadow-lg transition-all">
          <Activity className="w-5 h-5" />
          <span className="font-semibold">Overview</span>
        </a>
        <a href="#" className="flex items-center gap-3 px-4 py-3.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all">
          <BarChart3 className="w-5 h-5" />
          <span className="font-semibold">Reports</span>
        </a>
        <a href="#" className="flex items-center gap-3 px-4 py-3.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all">
          <PieChartIcon className="w-5 h-5" />
          <span className="font-semibold">Analytics</span>
        </a>
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-700">
        <label 
          id="file-upload"
          className={`w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all cursor-pointer flex items-center justify-center gap-3 font-bold shadow-lg hover:shadow-xl ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Upload className="w-5 h-5" />
          {uploading ? 'Processing...' : 'Upload Data'}
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={onFileUpload}
            className="hidden"
            disabled={uploading}
            multiple
          />
        </label>
        {uploadStatus && (
          <p className={`text-sm mt-3 font-medium ${
            uploadStatus.includes('✓') ? 'text-green-400' : 
            uploadStatus.includes('✗') ? 'text-red-400' : 
            'text-yellow-400'
          }`}>
            {uploadStatus}
          </p>
        )}
      </div>
    </div>
  );
}
