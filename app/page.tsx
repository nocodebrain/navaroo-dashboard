'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { parseXeroProfitLoss, parseXeroBalanceSheet, mergeXeroData, XeroMonthlyData } from '../lib/xero-parser';
import DashboardHeader from '../components/DashboardHeader';
import PeriodSelector from '../components/PeriodSelector';
import KpiGrid from '../components/KpiGrid';
import EmptyStatePanel from '../components/EmptyStatePanel';
import ChartCard from '../components/ChartCard';
import Sidebar from '../components/Sidebar';
import { formatCurrency, formatPercent } from '../lib/formatters';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const defaultData: XeroMonthlyData[] = [{
  month: 'No Data',
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

  const hasData = data.length > 1 || (data.length === 1 && data[0].month !== 'No Data' && data[0].revenue > 0);
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

  const kpiData: Array<{
    label: string;
    value: number | null;
    change?: number;
    format: 'currency' | 'percent' | 'ratio';
    color: string;
    positive?: boolean;
    helper?: string;
  }> = [
    {
      label: 'Revenue',
      value: hasData ? currentMonth.revenue : null,
      change: hasData && comparisonMonth ? revenueChange : undefined,
      format: 'currency',
      color: 'green',
      helper: comparisonMode === 'mom' ? 'vs last month' : 'vs last year'
    },
    {
      label: 'Gross Profit',
      value: hasData ? currentMonth.grossProfit : null,
      change: hasData && comparisonMonth ? calcChange(currentMonth.grossProfit, comparisonMonth.grossProfit) : undefined,
      format: 'currency',
      color: 'blue',
      helper: comparisonMode === 'mom' ? 'vs last month' : 'vs last year'
    },
    {
      label: 'EBITDA',
      value: hasData ? currentMonth.ebitda : null,
      change: hasData && comparisonMonth ? ebitdaChange : undefined,
      format: 'currency',
      color: 'purple',
      helper: comparisonMode === 'mom' ? 'vs last month' : 'vs last year'
    },
    {
      label: 'Net Profit',
      value: hasData ? currentMonth.profit : null,
      change: hasData && comparisonMonth ? profitChange : undefined,
      format: 'currency',
      color: 'orange',
      helper: comparisonMode === 'mom' ? 'vs last month' : 'vs last year'
    },
    {
      label: 'Gross Margin',
      value: hasData ? currentMonth.grossMargin : null,
      format: 'percent',
      color: 'green',
      change: hasData && comparisonMonth ? calcChange(currentMonth.grossMargin, comparisonMonth.grossMargin) : undefined,
      helper: comparisonMode === 'mom' ? 'vs last month' : 'vs last year'
    },
    {
      label: 'EBITDA Margin',
      value: hasData ? currentMonth.ebitdaMargin : null,
      format: 'percent',
      color: 'purple',
      change: hasData && comparisonMonth ? calcChange(currentMonth.ebitdaMargin, comparisonMonth.ebitdaMargin) : undefined,
      helper: comparisonMode === 'mom' ? 'vs last month' : 'vs last year'
    },
    {
      label: 'OpEx Ratio',
      value: hasData ? currentMonth.opexRatio : null,
      format: 'percent',
      color: 'red',
      change: hasData && comparisonMonth ? calcChange(currentMonth.opexRatio, comparisonMonth.opexRatio) : undefined,
      positive: false,
      helper: comparisonMode === 'mom' ? 'vs last month' : 'vs last year'
    },
    {
      label: 'Working Capital',
      value: hasData ? currentMonth.workingCapital : null,
      format: 'currency',
      color: 'blue',
      change: hasData && comparisonMonth ? calcChange(currentMonth.workingCapital, comparisonMonth.workingCapital) : undefined,
      helper: comparisonMode === 'mom' ? 'vs last month' : 'vs last year'
    }
  ];

  const ratioKpis: Array<{
    label: string;
    value: number | null;
    change?: number;
    format: 'currency' | 'percent' | 'ratio';
    color: string;
    positive?: boolean;
    helper?: string;
  }> = hasData && currentMonth.currentRatio > 0 ? [
    {
      label: 'Current Ratio',
      value: currentMonth.currentRatio,
      format: 'ratio',
      color: 'cyan'
    },
    {
      label: 'Quick Ratio',
      value: currentMonth.quickRatio,
      format: 'ratio',
      color: 'teal'
    },
    {
      label: 'Accounts Receivable',
      value: currentMonth.accountsReceivable,
      format: 'currency',
      color: 'indigo'
    },
    {
      label: 'Accounts Payable',
      value: currentMonth.accountsPayable,
      format: 'currency',
      color: 'pink'
    }
  ] : [];

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
      <Sidebar 
        onFileUpload={handleFileUpload}
        uploading={uploading}
        uploadStatus={uploadStatus}
      />

      <div className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto p-8">
          <DashboardHeader />
          
          {!hasData && <EmptyStatePanel onUpload={() => document.getElementById('file-upload')?.click()} />}

          {hasData && (
            <>
              <PeriodSelector
                currentMonth={currentMonth.month}
                selectedMonthIndex={selectedMonthIndex}
                totalMonths={data.length}
                comparisonMode={comparisonMode}
                onMonthChange={setSelectedMonthIndex}
                onComparisonChange={setComparisonMode}
              />

              <div className="space-y-8">
                <KpiGrid kpis={kpiData} />
                
                {ratioKpis.length > 0 && <KpiGrid kpis={ratioKpis} />}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <ChartCard title="Revenue vs Expenses (12 Months)" hasData={hasData}>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#64748b" style={{ fontSize: '12px' }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <Tooltip 
                          formatter={(value) => formatCurrency(Number(value))}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" dot={{ fill: '#10b981', r: 3 }} />
                        <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" dot={{ fill: '#ef4444', r: 3 }} />
                        <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="Profit" dot={{ fill: '#3b82f6', r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Expense Breakdown" hasData={!!(hasData && currentMonth.expenseBreakdown && currentMonth.expenseBreakdown.length > 0)}>
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
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 space-y-2">
                          {currentMonth.expenseBreakdown.slice(0, 5).map((cat, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                <span className="text-slate-700 font-medium">{cat.name}</span>
                              </div>
                              <span className="font-semibold text-slate-900">{formatCurrency(cat.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </ChartCard>
                </div>

                <ChartCard title="Revenue Forecast Model" hasData={hasData}>
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
                      <YAxis stroke="#64748b" style={{ fontSize: '12px' }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} name="Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                {data.length > 1 && (
                  <ChartCard title="Historical Performance" hasData={hasData}>
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
                              <td className="py-3 px-4 text-sm text-right font-medium text-slate-900">{formatCurrency(month.revenue)}</td>
                              <td className="py-3 px-4 text-sm text-right font-medium text-slate-700">{formatCurrency(month.grossProfit)}</td>
                              <td className="py-3 px-4 text-sm text-right font-medium text-slate-700">{formatCurrency(month.ebitda)}</td>
                              <td className={`py-3 px-4 text-sm text-right font-bold ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(month.profit)}
                              </td>
                              <td className={`py-3 px-4 text-sm text-right font-semibold ${month.grossMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercent(month.grossMargin)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ChartCard>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
