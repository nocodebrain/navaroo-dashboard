'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, TrendingUp, TrendingDown, DollarSign, Users, FileText, Calendar } from 'lucide-react';

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  activeClients: number;
  newClients: number;
  tendersSubmitted: number;
  tendersWon: number;
}

const defaultData: MonthlyData[] = [
  {
    month: 'January 2026',
    revenue: 125000,
    expenses: 78000,
    profit: 47000,
    activeClients: 12,
    newClients: 3,
    tendersSubmitted: 8,
    tendersWon: 3
  }
];

export default function NavarooVisionexDashboard() {
  const [data, setData] = useState<MonthlyData[]>(defaultData);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const currentMonth = data[data.length - 1] || defaultData[0];
  const winRate = currentMonth.tendersSubmitted > 0 
    ? Math.round((currentMonth.tendersWon / currentMonth.tendersSubmitted) * 100)
    : 0;
  const profitMargin = currentMonth.revenue > 0
    ? Math.round((currentMonth.profit / currentMonth.revenue) * 100)
    : 0;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus('Processing file...');

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Handle Excel files
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

        // Parse the Excel data
        const parsedData: MonthlyData[] = jsonData.map((row: any) => ({
          month: row['Month'] || row['month'] || '',
          revenue: parseFloat(row['Revenue'] || row['revenue'] || 0),
          expenses: parseFloat(row['Expenses'] || row['expenses'] || 0),
          profit: parseFloat(row['Profit'] || row['profit'] || 0),
          activeClients: parseInt(row['Active Clients'] || row['activeClients'] || 0),
          newClients: parseInt(row['New Clients'] || row['newClients'] || 0),
          tendersSubmitted: parseInt(row['Tenders Submitted'] || row['tendersSubmitted'] || 0),
          tendersWon: parseInt(row['Tenders Won'] || row['tendersWon'] || 0)
        }));

        if (parsedData.length > 0) {
          setData(parsedData);
          setUploadStatus(`✓ Successfully loaded ${parsedData.length} month(s) of data`);
        } else {
          setUploadStatus('⚠ No valid data found in file');
        }
      } else if (fileExtension === 'pdf') {
        setUploadStatus('⚠ PDF parsing requires backend processing. Please use Excel format for now.');
      } else {
        setUploadStatus('⚠ Unsupported file type. Please upload Excel (.xlsx, .xls) files.');
      }
    } catch (error) {
      console.error('File upload error:', error);
      setUploadStatus('✗ Error processing file. Please check the format and try again.');
    } finally {
      setUploading(false);
      // Clear status after 5 seconds
      setTimeout(() => setUploadStatus(''), 5000);
    }
  };

  const downloadTemplate = () => {
    // Create template Excel file
    const template = [
      {
        'Month': 'January 2026',
        'Revenue': 125000,
        'Expenses': 78000,
        'Profit': 47000,
        'Active Clients': 12,
        'New Clients': 3,
        'Tenders Submitted': 8,
        'Tenders Won': 3
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Data');
    XLSX.writeFile(workbook, 'navaroo-visionex-template.xlsx');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Navaroo & Visionex Solutions</h1>
              <p className="text-slate-600 mt-1">Business Performance Dashboard</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Download Template
              </button>
              <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Data
                <input
                  type="file"
                  accept=".xlsx,.xls,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
          {uploadStatus && (
            <div className={`mt-4 p-3 rounded-lg ${
              uploadStatus.includes('✓') ? 'bg-green-50 text-green-700' :
              uploadStatus.includes('✗') ? 'bg-red-50 text-red-700' :
              'bg-yellow-50 text-yellow-700'
            }`}>
              {uploadStatus}
            </div>
          )}
        </div>

        {/* Current Month Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900">{currentMonth.month}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-700 text-sm font-medium">Revenue</span>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">
                ${currentMonth.revenue.toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-700 text-sm font-medium">Expenses</span>
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-900">
                ${currentMonth.expenses.toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-700 text-sm font-medium">Profit</span>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">
                ${currentMonth.profit.toLocaleString()}
              </p>
              <p className="text-sm text-blue-700 mt-1">{profitMargin}% margin</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-700 text-sm font-medium">Active Clients</span>
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {currentMonth.activeClients}
              </p>
              <p className="text-sm text-purple-700 mt-1">+{currentMonth.newClients} new</p>
            </div>
          </div>
        </div>

        {/* Tender Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Tender Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-slate-900">{currentMonth.tendersSubmitted}</p>
              <p className="text-slate-600 mt-2">Tenders Submitted</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">{currentMonth.tendersWon}</p>
              <p className="text-slate-600 mt-2">Tenders Won</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">{winRate}%</p>
              <p className="text-slate-600 mt-2">Win Rate</p>
            </div>
          </div>
        </div>

        {/* Historical Data Table */}
        {data.length > 1 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Historical Data</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Month</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Revenue</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Expenses</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Profit</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Clients</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((month, index) => {
                    const monthWinRate = month.tendersSubmitted > 0
                      ? Math.round((month.tendersWon / month.tendersSubmitted) * 100)
                      : 0;
                    return (
                      <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm text-slate-900">{month.month}</td>
                        <td className="py-3 px-4 text-sm text-right text-slate-900">
                          ${month.revenue.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-slate-900">
                          ${month.expenses.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-medium text-green-600">
                          ${month.profit.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-slate-900">
                          {month.activeClients}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-medium text-blue-600">
                          {monthWinRate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Upload Instructions */}
        <div className="mt-6 bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">How to Update Monthly Data</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>Click "Download Template" to get the Excel template with the correct column structure</li>
            <li>Fill in your monthly data in Excel (Revenue, Expenses, Profit, Active Clients, New Clients, Tenders Submitted, Tenders Won)</li>
            <li>Click "Upload Data" and select your completed Excel file</li>
            <li>The dashboard will automatically update with your new data</li>
          </ol>
          <p className="text-blue-700 text-sm mt-4">
            <strong>Supported formats:</strong> Excel (.xlsx, .xls). PDF support requires backend processing.
          </p>
        </div>
      </div>
    </div>
  );
}
