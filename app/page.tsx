'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, TrendingUp, TrendingDown, DollarSign, Building2, FileText, Calendar, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { parseXeroProfitLoss, parseXeroBalanceSheet, mergeXeroData, XeroMonthlyData } from '../lib/xero-parser';

const defaultData: XeroMonthlyData[] = [
  {
    month: 'Feb 2026',
    revenue: 0,
    expenses: 0,
    profit: 0,
    assets: 0,
    liabilities: 0,
    equity: 0
  }
];

export default function NavarooVisionexDashboard() {
  const [data, setData] = useState<XeroMonthlyData[]>(defaultData);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [xeroConnected, setXeroConnected] = useState(false);
  const [loadingXero, setLoadingXero] = useState(false);

  // Check if Xero is connected on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('xero') === 'connected') {
      setXeroConnected(true);
      setUploadStatus('✓ Successfully connected to Xero!');
      fetchXeroData();
      // Clean URL
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const currentMonth = data[0] || defaultData[0];
  const profitMargin = currentMonth.revenue > 0
    ? Math.round((currentMonth.profit / currentMonth.revenue) * 100)
    : 0;

  const fetchXeroData = async () => {
    setLoadingXero(true);
    setUploadStatus('Loading data from Xero...');

    try {
      const response = await fetch('/api/xero/reports');
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
        setXeroConnected(true);
        setUploadStatus(`✓ Loaded ${result.data.length} month(s) from Xero`);
      } else {
        throw new Error(result.error || 'Failed to fetch Xero data');
      }
    } catch (error: any) {
      console.error('Error fetching Xero data:', error);
      setUploadStatus(`✗ Error: ${error.message}`);
      setXeroConnected(false);
    } finally {
      setLoadingXero(false);
      setTimeout(() => setUploadStatus(''), 5000);
    }
  };

  const connectXero = () => {
    window.location.href = '/api/xero/auth';
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadStatus('Processing files...');

    try {
      let plData: XeroMonthlyData[] = [];
      let bsData: Record<string, any> = {};

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name.toLowerCase();
        const buffer = await file.arrayBuffer();

        if (fileName.includes('profit') || fileName.includes('p&l') || fileName.includes('pl')) {
          setUploadStatus('Parsing Profit & Loss...');
          plData = parseXeroProfitLoss(buffer);
        } else if (fileName.includes('balance') || fileName.includes('bs')) {
          setUploadStatus('Parsing Balance Sheet...');
          bsData = parseXeroBalanceSheet(buffer);
        } else {
          const workbook = XLSX.read(buffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0].toLowerCase();
          
          if (sheetName.includes('profit') || sheetName.includes('loss')) {
            plData = parseXeroProfitLoss(buffer);
          } else if (sheetName.includes('balance')) {
            bsData = parseXeroBalanceSheet(buffer);
          } else {
            plData = parseXeroProfitLoss(buffer);
          }
        }
      }

      if (plData.length > 0) {
        const mergedData = Object.keys(bsData).length > 0 
          ? mergeXeroData(plData, bsData)
          : plData;
        
        setData(mergedData);
        setUploadStatus(`✓ Successfully loaded ${mergedData.length} month(s) of data from Xero exports`);
      } else {
        setUploadStatus('⚠ No valid Xero data found. Please upload Profit & Loss report from Xero.');
      }
    } catch (error: any) {
      console.error('File upload error:', error);
      setUploadStatus(`✗ Error: ${error.message || 'Could not parse Xero file.'}`);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadStatus(''), 7000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Navaroo & Visionex Solutions</h1>
              <p className="text-slate-600 mt-1">Business Performance Dashboard - Powered by Xero</p>
            </div>
            <div className="flex gap-3">
              {xeroConnected ? (
                <button
                  onClick={fetchXeroData}
                  disabled={loadingXero}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingXero ? 'animate-spin' : ''}`} />
                  {loadingXero ? 'Loading...' : 'Refresh from Xero'}
                </button>
              ) : (
                <button
                  onClick={connectXero}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <LinkIcon className="w-4 h-4" />
                  Connect Xero
                </button>
              )}
              <label className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Files
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                  multiple
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-700 text-sm font-medium">Revenue</span>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">
                ${currentMonth.revenue.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-700 text-sm font-medium">Expenses</span>
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-900">
                ${currentMonth.expenses.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-700 text-sm font-medium">Net Profit</span>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">
                ${currentMonth.profit.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-blue-700 mt-1">{profitMargin}% margin</p>
            </div>
          </div>
        </div>

        {/* Balance Sheet Overview */}
        {(currentMonth.assets > 0 || currentMonth.liabilities > 0) && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-600" />
              Balance Sheet
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <span className="text-purple-700 text-sm font-medium block mb-2">Total Assets</span>
                <p className="text-2xl font-bold text-purple-900">
                  ${currentMonth.assets.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                <span className="text-orange-700 text-sm font-medium block mb-2">Total Liabilities</span>
                <p className="text-2xl font-bold text-orange-900">
                  ${currentMonth.liabilities.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg">
                <span className="text-indigo-700 text-sm font-medium block mb-2">Equity</span>
                <p className="text-2xl font-bold text-indigo-900">
                  ${currentMonth.equity.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Historical Data Table */}
        {data.length > 1 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Historical Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Month</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Revenue</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Expenses</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Profit</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((month, index) => {
                    const margin = month.revenue > 0 
                      ? Math.round((month.profit / month.revenue) * 100)
                      : 0;
                    return (
                      <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm text-slate-900 font-medium">{month.month}</td>
                        <td className="py-3 px-4 text-sm text-right text-slate-900">
                          ${month.revenue.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-slate-900">
                          ${month.expenses.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </td>
                        <td className={`py-3 px-4 text-sm text-right font-medium ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${month.profit.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </td>
                        <td className={`py-3 px-4 text-sm text-right font-medium ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {margin}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Upload from Xero
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
              <li>Log into Xero</li>
              <li>Go to Reports → Profit and Loss</li>
              <li>Select date range (last 12 months)</li>
              <li>Export as Excel (.xlsx)</li>
              <li>Upload here using "Upload Files"</li>
            </ol>
          </div>

          <div className="bg-green-50 rounded-xl p-6">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Direct Xero Connection
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-green-800 text-sm">
              <li>Click "Connect Xero" above</li>
              <li>Authorize access to your Xero account</li>
              <li>Dashboard automatically pulls latest data</li>
              <li>Click "Refresh" anytime for updated data</li>
            </ol>
            <p className="text-green-700 text-sm mt-4 font-medium">
              No manual exports needed! Data updates with one click.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
