'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, TrendingUp, TrendingDown, DollarSign, Calendar, RefreshCw, AlertCircle, Activity, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { parseXeroProfitLoss, parseXeroBalanceSheet, mergeXeroData, XeroMonthlyData } from '../lib/xero-parser';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const defaultData: XeroMonthlyData[] = [{
  month: 'Feb 2026',
  revenue: 0,
  expenses: 0,
  profit: 0,
  assets: 0,
  liabilities: 0,
  equity: 0
}];

export default function NavarooFinancialDashboard() {
  const [data, setData] = useState<XeroMonthlyData[]>(defaultData);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [xeroConnected, setXeroConnected] = useState(false);
  const [loadingXero, setLoadingXero] = useState(false);
  const [forecastRevenue, setForecastRevenue] = useState<number>(0);
  const [forecastExpenses, setForecastExpenses] = useState<number>(0);
  const [showForecast, setShowForecast] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('xero') === 'connected') {
      setXeroConnected(true);
      setUploadStatus('✓ Successfully connected to Xero!');
      fetchXeroData();
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const currentMonth = data[0] || defaultData[0];
  const previousMonth = data[1] || currentMonth;

  // Calculate KPIs
  const revenueChange = previousMonth.revenue > 0 
    ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100 
    : 0;
  const expensesChange = previousMonth.expenses > 0
    ? ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100
    : 0;
  const profitChange = previousMonth.profit !== 0
    ? ((currentMonth.profit - previousMonth.profit) / Math.abs(previousMonth.profit)) * 100
    : 0;

  const profitMargin = currentMonth.revenue > 0
    ? (currentMonth.profit / currentMonth.revenue) * 100
    : 0;

  // Calculate burn rate (average monthly expenses over last 3 months)
  const last3Months = data.slice(0, 3);
  const avgMonthlyBurn = last3Months.length > 0
    ? last3Months.reduce((sum, m) => sum + m.expenses, 0) / last3Months.length
    : 0;

  // Calculate runway (assuming current cash = assets - liabilities)
  const currentCash = currentMonth.assets - currentMonth.liabilities;
  const runway = avgMonthlyBurn > 0 ? currentCash / avgMonthlyBurn : 0;

  // Cash flow data
  const cashFlow = data.slice(0, 6).reverse().map(month => ({
    month: month.month,
    inflow: month.revenue,
    outflow: month.expenses,
    net: month.profit
  }));

  // Forecast data
  const forecastData = showForecast && forecastRevenue > 0 ? [
    ...data.slice(0, 6).reverse(),
    {
      month: 'Forecast',
      revenue: forecastRevenue,
      expenses: forecastExpenses || (currentMonth.expenses * 1.05),
      profit: forecastRevenue - (forecastExpenses || (currentMonth.expenses * 1.05)),
      assets: 0,
      liabilities: 0,
      equity: 0
    }
  ] : data.slice(0, 12).reverse();

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
          plData = parseXeroProfitLoss(buffer);
        } else if (fileName.includes('balance') || fileName.includes('bs')) {
          bsData = parseXeroBalanceSheet(buffer);
        } else {
          const workbook = XLSX.read(buffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0].toLowerCase();
          
          if (sheetName.includes('profit') || sheetName.includes('loss')) {
            plData = parseXeroProfitLoss(buffer);
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
        setUploadStatus(`✓ Loaded ${mergedData.length} months • ${currentMonth.expenseBreakdown?.length || 0} expense categories`);
      } else {
        setUploadStatus('⚠ No valid data found');
      }
    } catch (error: any) {
      setUploadStatus(`✗ Error: ${error.message}`);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadStatus(''), 7000);
    }
  };

  const handleForecastSubmit = () => {
    if (forecastRevenue > 0) {
      setShowForecast(true);
      setUploadStatus('✓ Forecast applied');
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Navaroo Pty Ltd</h1>
              <p className="text-slate-600 mt-1">Financial Performance Dashboard</p>
            </div>
            <div className="flex gap-3">
              {xeroConnected && (
                <button
                  onClick={fetchXeroData}
                  disabled={loadingXero}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingXero ? 'animate-spin' : ''}`} />
                  {loadingXero ? 'Loading...' : 'Refresh'}
                </button>
              )}
              <label className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all cursor-pointer flex items-center gap-2 shadow-sm hover:shadow-md">
                <Upload className="w-4 h-4" />
                Upload Xero Export
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
            <div className={`mt-4 p-3 rounded-xl border ${
              uploadStatus.includes('✓') ? 'bg-green-50 text-green-700 border-green-200' :
              uploadStatus.includes('✗') ? 'bg-red-50 text-red-700 border-red-200' :
              'bg-yellow-50 text-yellow-700 border-yellow-200'
            }`}>
              {uploadStatus}
            </div>
          )}
        </div>

        {/* Executive Summary */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Executive Summary</h2>
              <p className="text-blue-100">{currentMonth.month}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <p className="text-blue-100 text-sm font-medium mb-2">Revenue</p>
              <p className="text-3xl font-bold">${currentMonth.revenue.toLocaleString('en-AU', { minimumFractionDigits: 0 })}</p>
              <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${revenueChange >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {revenueChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(revenueChange).toFixed(1)}% MoM
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <p className="text-blue-100 text-sm font-medium mb-2">Expenses</p>
              <p className="text-3xl font-bold">${currentMonth.expenses.toLocaleString('en-AU', { minimumFractionDigits: 0 })}</p>
              <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${expensesChange <= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {expensesChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(expensesChange).toFixed(1)}% MoM
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <p className="text-blue-100 text-sm font-medium mb-2">Net Profit</p>
              <p className="text-3xl font-bold">${currentMonth.profit.toLocaleString('en-AU', { minimumFractionDigits: 0 })}</p>
              <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${profitChange >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {profitChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(profitChange).toFixed(1)}% MoM • {profitMargin.toFixed(1)}% margin
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <p className="text-blue-100 text-sm font-medium mb-2">Cash Runway</p>
              <p className="text-3xl font-bold">{runway > 0 ? `${runway.toFixed(1)}` : '-'} <span className="text-xl font-normal">months</span></p>
              <p className="text-blue-100 text-sm mt-2">Burn: ${avgMonthlyBurn.toLocaleString('en-AU', { minimumFractionDigits: 0 })}/mo</p>
            </div>
          </div>
        </div>

        {/* Revenue Forecasting Tool */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">Revenue Forecast Model</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Projected Monthly Revenue</label>
              <input
                type="number"
                value={forecastRevenue || ''}
                onChange={(e) => setForecastRevenue(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="e.g., 150000"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Projected Monthly Expenses (optional)</label>
              <input
                type="number"
                value={forecastExpenses || ''}
                onChange={(e) => setForecastExpenses(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="Auto-calculated if blank"
              />
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleForecastSubmit}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-sm hover:shadow-md"
              >
                Apply
              </button>
              <button
                onClick={() => { setShowForecast(false); setForecastRevenue(0); setForecastExpenses(0); }}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all font-medium"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Revenue Trend Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} name="Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={2} name="Expenses" />
                <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} name="Profit" dot={{ fill: '#3b82f6', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cash Flow + Expense Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cash Flow Analysis */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Cash Flow Analysis</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Legend />
                  <Bar dataKey="inflow" fill="#10b981" name="Inflow" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="outflow" fill="#ef4444" name="Outflow" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="net" fill="#3b82f6" name="Net" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Expense Breakdown - {currentMonth.month}</h2>
            {currentMonth.expenseBreakdown && currentMonth.expenseBreakdown.length > 0 ? (
              <>
                <div className="h-48 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={currentMonth.expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {currentMonth.expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {currentMonth.expenseBreakdown.slice(0, 6).map((category, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-slate-700">{category.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-xs">{category.percentage.toFixed(1)}%</span>
                        <span className="font-semibold text-slate-900">${category.amount.toLocaleString('en-AU', { minimumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-slate-500 text-center py-8">Upload data to see expense breakdown</p>
            )}
          </div>
        </div>

        {/* Historical Performance Table */}
        {data.length > 1 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Historical Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700">Month</th>
                    <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700">Revenue</th>
                    <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700">Expenses</th>
                    <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700">Profit</th>
                    <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700">Margin</th>
                    <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700">MoM</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 12).map((month, index) => {
                    const margin = month.revenue > 0 ? (month.profit / month.revenue) * 100 : 0;
                    const prevMonth = data[index + 1];
                    const momChange = prevMonth && prevMonth.revenue > 0
                      ? ((month.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
                      : 0;
                    return (
                      <tr key={index} className="border-b border-slate-100 hover:bg-blue-50/50 transition-colors">
                        <td className="py-4 px-4 text-sm text-slate-900 font-medium">{month.month}</td>
                        <td className="py-4 px-4 text-sm text-right text-slate-900 font-medium">
                          ${month.revenue.toLocaleString('en-AU', { minimumFractionDigits: 0 })}
                        </td>
                        <td className="py-4 px-4 text-sm text-right text-slate-600">
                          ${month.expenses.toLocaleString('en-AU', { minimumFractionDigits: 0 })}
                        </td>
                        <td className={`py-4 px-4 text-sm text-right font-bold ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${month.profit.toLocaleString('en-AU', { minimumFractionDigits: 0 })}
                        </td>
                        <td className={`py-4 px-4 text-sm text-right font-semibold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {margin.toFixed(1)}%
                        </td>
                        <td className={`py-4 px-4 text-sm text-right font-medium ${momChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {prevMonth ? `${momChange >= 0 ? '+' : ''}${momChange.toFixed(1)}%` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
