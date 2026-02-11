'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, TrendingUp, TrendingDown, DollarSign, Calendar, RefreshCw, AlertCircle, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { parseXeroProfitLoss, parseXeroBalanceSheet, mergeXeroData, XeroMonthlyData } from '../lib/xero-parser';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

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

  // Calculate month-over-month changes
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

  // Calculate cash flow (simplified: revenue - expenses)
  const cashFlow = data.slice(0, 6).reverse().map(month => ({
    month: month.month,
    inflow: month.revenue,
    outflow: month.expenses,
    net: month.profit
  }));

  // Prepare forecast data
  const forecastData = showForecast && forecastRevenue > 0 ? [
    ...data.slice(0, 6).reverse(),
    {
      month: 'Forecast',
      revenue: forecastRevenue,
      expenses: forecastExpenses || (currentMonth.expenses * 1.05), // Default 5% increase
      profit: forecastRevenue - (forecastExpenses || (currentMonth.expenses * 1.05)),
      assets: 0,
      liabilities: 0,
      equity: 0
    }
  ] : data.slice(0, 6).reverse();

  // Expense breakdown (mock data - would parse from detailed Xero accounts)
  const expenseBreakdown = [
    { name: 'Wages & Salaries', value: currentMonth.expenses * 0.45 },
    { name: 'Insurance', value: currentMonth.expenses * 0.15 },
    { name: 'Equipment & Hire', value: currentMonth.expenses * 0.12 },
    { name: 'Subscriptions', value: currentMonth.expenses * 0.08 },
    { name: 'Rent', value: currentMonth.expenses * 0.10 },
    { name: 'Other', value: currentMonth.expenses * 0.10 }
  ];

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
        setUploadStatus(`✓ Successfully loaded ${mergedData.length} month(s) of data`);
      } else {
        setUploadStatus('⚠ No valid Xero data found');
      }
    } catch (error: any) {
      console.error('File upload error:', error);
      setUploadStatus(`✗ Error: ${error.message}`);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadStatus(''), 7000);
    }
  };

  const handleForecastSubmit = () => {
    if (forecastRevenue > 0) {
      setShowForecast(true);
      setUploadStatus('✓ Forecast applied to charts');
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Navaroo Pty Ltd</h1>
              <p className="text-slate-600 mt-1">Financial Dashboard</p>
            </div>
            <div className="flex gap-3">
              {xeroConnected ? (
                <button
                  onClick={fetchXeroData}
                  disabled={loadingXero}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingXero ? 'animate-spin' : ''}`} />
                  {loadingXero ? 'Loading...' : 'Refresh'}
                </button>
              ) : (
                <button
                  onClick={connectXero}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  Connect Xero
                </button>
              )}
              <label className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload
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

        {/* Executive Summary */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Executive Summary - {currentMonth.month}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-blue-100 text-sm mb-1">Revenue</p>
              <p className="text-3xl font-bold">${currentMonth.revenue.toLocaleString('en-AU', { minimumFractionDigits: 0 })}</p>
              <p className={`text-sm mt-1 flex items-center gap-1 ${revenueChange >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {revenueChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(revenueChange).toFixed(1)}% vs last month
              </p>
            </div>
            <div>
              <p className="text-blue-100 text-sm mb-1">Expenses</p>
              <p className="text-3xl font-bold">${currentMonth.expenses.toLocaleString('en-AU', { minimumFractionDigits: 0 })}</p>
              <p className={`text-sm mt-1 flex items-center gap-1 ${expensesChange <= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {expensesChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(expensesChange).toFixed(1)}% vs last month
              </p>
            </div>
            <div>
              <p className="text-blue-100 text-sm mb-1">Net Profit</p>
              <p className="text-3xl font-bold">${currentMonth.profit.toLocaleString('en-AU', { minimumFractionDigits: 0 })}</p>
              <p className={`text-sm mt-1 flex items-center gap-1 ${profitChange >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {profitChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(profitChange).toFixed(1)}% vs last month • {profitMargin.toFixed(1)}% margin
              </p>
            </div>
          </div>
        </div>

        {/* Cash Flow Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Cash Flow Analysis (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashFlow}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="inflow" fill="#10b981" name="Revenue" />
              <Bar dataKey="outflow" fill="#ef4444" name="Expenses" />
              <Bar dataKey="net" fill="#3b82f6" name="Net Cash Flow" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Forecasting Tool */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Revenue Forecasting</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Projected Revenue</label>
              <input
                type="number"
                value={forecastRevenue || ''}
                onChange={(e) => setForecastRevenue(Number(e.target.value))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 150000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Projected Expenses</label>
              <input
                type="number"
                value={forecastExpenses || ''}
                onChange={(e) => setForecastExpenses(Number(e.target.value))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Leave blank for auto"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleForecastSubmit}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Forecast
              </button>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setShowForecast(false); setForecastRevenue(0); setForecastExpenses(0); }}
                className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Revenue Trend with Forecast */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
              <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown & Profit Margin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expense Breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Expense Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Profit Margin Trend */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Profit Margin Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.slice(0, 6).reverse().map(m => ({
                month: m.month,
                margin: m.revenue > 0 ? (m.profit / m.revenue) * 100 : 0
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                <Legend />
                <Line type="monotone" dataKey="margin" stroke="#8b5cf6" strokeWidth={2} name="Profit Margin %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Historical Data Table */}
        {data.length > 1 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
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
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">MoM Change</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((month, index) => {
                    const margin = month.revenue > 0 ? (month.profit / month.revenue) * 100 : 0;
                    const prevMonth = data[index + 1];
                    const momChange = prevMonth && prevMonth.revenue > 0
                      ? ((month.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
                      : 0;
                    return (
                      <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm text-slate-900 font-medium">{month.month}</td>
                        <td className="py-3 px-4 text-sm text-right text-slate-900">
                          ${month.revenue.toLocaleString('en-AU', { minimumFractionDigits: 0 })}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-slate-900">
                          ${month.expenses.toLocaleString('en-AU', { minimumFractionDigits: 0 })}
                        </td>
                        <td className={`py-3 px-4 text-sm text-right font-medium ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${month.profit.toLocaleString('en-AU', { minimumFractionDigits: 0 })}
                        </td>
                        <td className={`py-3 px-4 text-sm text-right font-medium ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {margin.toFixed(1)}%
                        </td>
                        <td className={`py-3 px-4 text-sm text-right ${momChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
