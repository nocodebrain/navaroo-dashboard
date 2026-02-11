'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { parseXeroProfitLoss, parseXeroBalanceSheet, mergeXeroData, XeroMonthlyData } from '../lib/xero-parser';
import DashboardHeader from '../components/DashboardHeader';
import PeriodSelector from '../components/PeriodSelector';
import KpiGrid from '../components/KpiGrid';
import EmptyStatePanel from '../components/EmptyStatePanel';
import ChartCard from '../components/ChartCard';
import TopNav from '../components/TopNav';
import ForecastTab from '../components/ForecastTab';
import { formatCurrency, formatPercent } from '../lib/formatters';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

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
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'forecast' | 'upload' | 'settings'>('dashboard');

  const hasData = data.length > 1 || (data.length === 1 && data[0].month !== 'No Data' && data[0].revenue > 0);
  const currentMonth = data[selectedMonthIndex] || defaultData[0];
  const comparisonMonth = comparisonMode === 'mom' 
    ? data[selectedMonthIndex + 1] 
    : data[selectedMonthIndex + 12];

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
        setCurrentTab('dashboard');
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

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav 
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onFileUpload={handleFileUpload}
        uploading={uploading}
        uploadStatus={uploadStatus}
      />

      <div className="max-w-[1400px] mx-auto p-8">
        {currentTab === 'dashboard' && (
          <>
            {!hasData && <EmptyStatePanel onUpload={() => setCurrentTab('upload')} />}

            {hasData && (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">Financial Overview</h1>
                  <p className="text-slate-600">Real-time insights into your business performance</p>
                </div>

                <PeriodSelector
                  currentMonth={currentMonth.month}
                  selectedMonthIndex={selectedMonthIndex}
                  totalMonths={data.length}
                  comparisonMode={comparisonMode}
                  onMonthChange={setSelectedMonthIndex}
                  onComparisonChange={setComparisonMode}
                />

                <div className="space-y-8 mt-8">
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
                </div>
              </>
            )}
          </>
        )}

        {currentTab === 'forecast' && (
          <div className="pt-4">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Revenue Forecast & Scenarios</h1>
              <p className="text-slate-600">Model growth scenarios and track your deal pipeline</p>
            </div>
            <ForecastTab historicalData={data} hasData={hasData} />
          </div>
        )}

        {currentTab === 'upload' && (
          <div className="pt-20">
            <EmptyStatePanel onUpload={() => {}} />
          </div>
        )}

        {currentTab === 'settings' && (
          <div className="pt-20 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Settings</h2>
            <p className="text-slate-600">Configuration options coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
