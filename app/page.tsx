'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, PieChart as PieChartIcon, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { parseXeroProfitLoss, parseXeroBalanceSheet, mergeXeroData, XeroMonthlyData } from '../lib/xero-parser';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const defaultData: XeroMonthlyData[] = [{
  month: 'Feb 2026',
  revenue: 0,
  costOfSales: 0,
  grossProfit: 0,
  grossMargin: 0,
  operatingExpenses: 0,
  depreciation: 0,
  ebitda: 0,
  ebitdaMargin: 0,
  expenses: 0,
  profit: 0,
  assets: 0,
  currentAssets: 0,
  liabilities: 0,
  currentLiabilities: 0,
  equity: 0,
  accountsReceivable: 0,
  accountsPayable: 0,
  workingCapital: 0,
  currentRatio: 0,
  quickRatio: 0,
  opexRatio: 0
}];

export default function NavarooDashboard() {
  const [data, setData] = useState<XeroMonthlyData[]>(defaultData);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [comparisonMode, setComparisonMode] = useState<'mom' | 'yoy'>('mom');
  const [forecastRevenue, setForecastRevenue] = useState<number>(0);
  const [showForecast, setShowForecast] = useState(false);

  const currentMonth = data[selectedMonthIndex] || defaultData[0];
  const comparisonMonth = comparisonMode === 'mom' 
    ? data[selectedMonthIndex + 1] 
    : data[selectedMonthIndex + 12];

  // Calculate changes
  const calcChange = (current: number, previous: number) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const revenueChange = comparisonMonth ? calcChange(currentMonth.revenue, comparisonMonth.revenue) : 0;
  const profitChange = comparisonMonth ? calcChange(currentMonth.profit, comparisonMonth.profit) : 0;
  const ebitdaChange = comparisonMonth ? calcChange(currentMonth.ebitda, comparisonMonth.ebitda) : 0;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadStatus('Processing...');

    try {
      let plData: XeroMonthlyData[] = [];
      let bsData: Record<string, any> = {};

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name.toLowerCase();
        const buffer = await file.arrayBuffer();

        if (fileName.includes('profit') || fileName.includes('p&l') || fileName.includes('loss')) {
          plData = parseXeroProfitLoss(buffer);
        } else if (fileName.includes('balance')) {
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
        const mergedData = Object.keys(bsData).length > 0 ? mergeXeroData(plData, bsData) : plData;
        setData(mergedData);
        setUploadStatus(`✓ Loaded ${mergedData.length} months`);
      } else {
        setUploadStatus('⚠ No valid data found');
      }
    } catch (error: any) {
      setUploadStatus(`✗ ${error.message}`);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadStatus(''), 5000);
    }
  };

  const KPICard = ({ 
    title, 
    value, 
    change, 
    prefix = '$', 
    suffix = '', 
    borderColor,
    positive = true 
  }: any) => (
    <div className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${borderColor}`}>
      <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
      <p className="text-3xl font-bold text-slate-900 mb-2">
        {prefix}{typeof value === 'number' ? value.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : value}{suffix}
      </p>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-sm font-semibold ${
          (positive && change >= 0) || (!positive && change <= 0) ? 'text-green-600' : 'text-red-600'
        }`}>
          {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {Math.abs(change).toFixed(1)}% {comparisonMode === 'mom' ? 'MoM' : 'YoY'}
        </div>
      )}
    </div>
  );

  const trendData = data.slice(0, 12).reverse();
  const forecastData = showForecast && forecastRevenue > 0 ? [
    ...trendData,
    {
      ...currentMonth,
      month: 'Forecast',
      revenue: forecastRevenue,
      expenses: currentMonth.expenses * 1.05,
      profit: forecastRevenue - (currentMonth.expenses * 1.05)
    }
  ] : trendData;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-[#0f172a] text-white p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Navaroo</h1>
          <p className="text-slate-400 text-sm">Financial Dashboard</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600 text-white">
            <Activity className="w-5 h-5" />
            <span className="font-medium">Overview</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800">
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Reports</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800">
            <PieChartIcon className="w-5 h-5" />
            <span className="font-medium">Analytics</span>
          </a>
        </nav>

        <div className="mt-auto">
          <label className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all cursor-pointer flex items-center justify-center gap-2 font-medium">
            <Upload className="w-4 h-4" />
            Upload Data
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
              multiple
            />
          </label>
          {uploadStatus && (
            <p className={`text-xs mt-2 ${
              uploadStatus.includes('✓') ? 'text-green-400' : 
              uploadStatus.includes('✗') ? 'text-red-400' : 
              'text-yellow-400'
            }`}>
              {uploadStatus}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Financial Overview</h2>
            <p className="text-slate-600 mt-1">Real-time insights into your business performance</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Month Selector */}
            <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm px-4 py-2 border border-slate-200">
              <button
                onClick={() => setSelectedMonthIndex(Math.min(selectedMonthIndex + 1, data.length - 1))}
                disabled={selectedMonthIndex >= data.length - 1}
                className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4 text-slate-700" />
              </button>
              <div className="flex items-center gap-2 min-w-[140px] justify-center">
                <Calendar className="w-4 h-4 text-slate-600" />
                <span className="font-semibold text-slate-900">{currentMonth.month}</span>
              </div>
              <button
                onClick={() => setSelectedMonthIndex(Math.max(selectedMonthIndex - 1, 0))}
                disabled={selectedMonthIndex === 0}
                className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4 text-slate-700" />
              </button>
            </div>

            {/* Comparison Toggle */}
            <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-1">
              <button
                onClick={() => setComparisonMode('mom')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  comparisonMode === 'mom' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                MoM
              </button>
              <button
                onClick={() => setComparisonMode('yoy')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  comparisonMode === 'yoy' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                YoY
              </button>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Revenue"
            value={currentMonth.revenue}
            change={revenueChange}
            borderColor="border-green-500"
          />
          <KPICard
            title="Gross Profit"
            value={currentMonth.grossProfit}
            change={comparisonMonth ? calcChange(currentMonth.grossProfit, comparisonMonth.grossProfit) : 0}
            borderColor="border-blue-500"
          />
          <KPICard
            title="EBITDA"
            value={currentMonth.ebitda}
            change={ebitdaChange}
            borderColor="border-purple-500"
          />
          <KPICard
            title="Net Profit"
            value={currentMonth.profit}
            change={profitChange}
            borderColor="border-orange-500"
          />
        </div>

        {/* Margin Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Gross Margin"
            value={currentMonth.grossMargin.toFixed(1)}
            prefix=""
            suffix="%"
            borderColor="border-green-500"
            change={comparisonMonth ? calcChange(currentMonth.grossMargin, comparisonMonth.grossMargin) : 0}
          />
          <KPICard
            title="EBITDA Margin"
            value={currentMonth.ebitdaMargin.toFixed(1)}
            prefix=""
            suffix="%"
            borderColor="border-purple-500"
            change={comparisonMonth ? calcChange(currentMonth.ebitdaMargin, comparisonMonth.ebitdaMargin) : 0}
          />
          <KPICard
            title="OpEx Ratio"
            value={currentMonth.opexRatio.toFixed(1)}
            prefix=""
            suffix="%"
            borderColor="border-red-500"
            change={comparisonMonth ? calcChange(currentMonth.opexRatio, comparisonMonth.opexRatio) : 0}
            positive={false}
          />
          <KPICard
            title="Working Capital"
            value={currentMonth.workingCapital}
            borderColor="border-blue-500"
            change={comparisonMonth ? calcChange(currentMonth.workingCapital, comparisonMonth.workingCapital) : 0}
          />
        </div>

        {/* Balance Sheet Ratios */}
        {currentMonth.currentRatio > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <KPICard
              title="Current Ratio"
              value={currentMonth.currentRatio.toFixed(2)}
              prefix=""
              suffix=":1"
              borderColor="border-cyan-500"
            />
            <KPICard
              title="Quick Ratio"
              value={currentMonth.quickRatio.toFixed(2)}
              prefix=""
              suffix=":1"
              borderColor="border-teal-500"
            />
            <KPICard
              title="Accounts Receivable"
              value={currentMonth.accountsReceivable}
              borderColor="border-indigo-500"
            />
            <KPICard
              title="Accounts Payable"
              value={currentMonth.accountsPayable}
              borderColor="border-pink-500"
            />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue vs Expenses Trend */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue vs Expenses (12 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip 
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} name="Revenue" dot={{ fill: '#10b981', r: 4 }} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} name="Expenses" dot={{ fill: '#ef4444', r: 4 }} />
                <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} name="Profit" dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Expense Breakdown</h3>
            {currentMonth.expenseBreakdown && currentMonth.expenseBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={currentMonth.expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="amount"
                      label={(entry: any) => `${entry.name} ${entry.percentage.toFixed(0)}%`}
                      labelLine={false}
                    >
                      {currentMonth.expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {currentMonth.expenseBreakdown.slice(0, 5).map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                        <span className="text-slate-700 font-medium">{cat.name}</span>
                      </div>
                      <span className="font-semibold text-slate-900">${cat.amount.toLocaleString('en-AU', { minimumFractionDigits: 0 })}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-slate-500 text-center py-8">Upload data to see breakdown</p>
            )}
          </div>
        </div>

        {/* Forecast Tool */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue Forecast Model</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Projected Revenue</label>
              <input
                type="number"
                value={forecastRevenue || ''}
                onChange={(e) => setForecastRevenue(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                placeholder="Enter projected revenue"
              />
            </div>
            <button
              onClick={() => setShowForecast(!!forecastRevenue)}
              className="md:col-span-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold mt-auto"
            >
              Apply Forecast
            </button>
            <button
              onClick={() => { setShowForecast(false); setForecastRevenue(0); }}
              className="md:col-span-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all font-semibold mt-auto"
            >
              Clear
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Historical Table */}
        {data.length > 1 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Historical Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-bold text-slate-700">Month</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-slate-700">Revenue</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-slate-700">Gross Profit</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-slate-700">EBITDA</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-slate-700">Net Profit</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-slate-700">Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 12).map((month, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-semibold text-slate-900">{month.month}</td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-slate-900">
                        ${month.revenue.toLocaleString('en-AU', { minimumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-slate-700">
                        ${month.grossProfit.toLocaleString('en-AU', { minimumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-slate-700">
                        ${month.ebitda.toLocaleString('en-AU', { minimumFractionDigits: 0 })}
                      </td>
                      <td className={`py-3 px-4 text-sm text-right font-bold ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${month.profit.toLocaleString('en-AU', { minimumFractionDigits: 0 })}
                      </td>
                      <td className={`py-3 px-4 text-sm text-right font-semibold ${month.grossMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {month.grossMargin.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
