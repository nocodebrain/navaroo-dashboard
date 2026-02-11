'use client';

import { useState } from 'react';
import { Plus, Trash2, TrendingUp, DollarSign } from 'lucide-react';
import { XeroMonthlyData } from '../lib/xero-parser';
import { formatCurrency } from '../lib/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Deal {
  id: string;
  name: string;
  amount: number;
  month: string;
  probability: number;
}

interface Adjustment {
  id: string;
  type: 'revenue' | 'expense';
  description: string;
  amount: number;
  month: string;
}

interface ForecastTabProps {
  historicalData: XeroMonthlyData[];
  hasData: boolean;
}

export default function ForecastTab({ historicalData, hasData }: ForecastTabProps) {
  const [revenueGrowth, setRevenueGrowth] = useState(10);
  const [expenseGrowth, setExpenseGrowth] = useState(5);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [showAddAdjustment, setShowAddAdjustment] = useState(false);

  // New deal form
  const [newDeal, setNewDeal] = useState({ name: '', amount: '', month: '', probability: 50 });
  const [newAdjustment, setNewAdjustment] = useState({ type: 'revenue' as 'revenue' | 'expense', description: '', amount: '', month: '' });

  const addDeal = () => {
    if (newDeal.name && newDeal.amount && newDeal.month) {
      setDeals([...deals, {
        id: Date.now().toString(),
        name: newDeal.name,
        amount: Number(newDeal.amount),
        month: newDeal.month,
        probability: newDeal.probability
      }]);
      setNewDeal({ name: '', amount: '', month: '', probability: 50 });
      setShowAddDeal(false);
    }
  };

  const addAdjustment = () => {
    if (newAdjustment.description && newAdjustment.amount && newAdjustment.month) {
      setAdjustments([...adjustments, {
        id: Date.now().toString(),
        type: newAdjustment.type,
        description: newAdjustment.description,
        amount: Number(newAdjustment.amount),
        month: newAdjustment.month
      }]);
      setNewAdjustment({ type: 'revenue', description: '', amount: '', month: '' });
      setShowAddAdjustment(false);
    }
  };

  const removeDeal = (id: string) => setDeals(deals.filter(d => d.id !== id));
  const removeAdjustment = (id: string) => setAdjustments(adjustments.filter(a => a.id !== id));

  // Generate forecast data
  const generateForecast = () => {
    if (!hasData || historicalData.length === 0) return [];

    const lastMonth = historicalData[0];
    const forecast = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 1; i <= 12; i++) {
      const baseRevenue = lastMonth.revenue * Math.pow(1 + revenueGrowth / 100, i / 12);
      const baseExpenses = lastMonth.expenses * Math.pow(1 + expenseGrowth / 100, i / 12);

      // Add deals for this month
      const monthLabel = `Month +${i}`;
      const dealRevenue = deals
        .filter(d => d.month === monthLabel)
        .reduce((sum, d) => sum + (d.amount * d.probability / 100), 0);

      // Add adjustments
      const revAdjustments = adjustments
        .filter(a => a.type === 'revenue' && a.month === monthLabel)
        .reduce((sum, a) => sum + a.amount, 0);
      
      const expAdjustments = adjustments
        .filter(a => a.type === 'expense' && a.month === monthLabel)
        .reduce((sum, a) => sum + a.amount, 0);

      const totalRevenue = baseRevenue + dealRevenue + revAdjustments;
      const totalExpenses = baseExpenses + expAdjustments;

      forecast.push({
        month: monthLabel,
        baseRevenue: Math.round(baseRevenue),
        revenue: Math.round(totalRevenue),
        expenses: Math.round(totalExpenses),
        profit: Math.round(totalRevenue - totalExpenses),
        dealRevenue: Math.round(dealRevenue)
      });
    }

    return forecast;
  };

  const forecastData = generateForecast();

  const totalPipelineValue = deals.reduce((sum, d) => sum + (d.amount * d.probability / 100), 0);
  const totalAdjustments = adjustments.reduce((sum, a) => 
    sum + (a.type === 'revenue' ? a.amount : -a.amount), 0
  );

  if (!hasData) {
    return (
      <div className="text-center py-20">
        <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-700 mb-2">No Historical Data</h3>
        <p className="text-slate-500">Upload financial data to create forecasts</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Scenario Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue Growth</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Annual Growth Rate</span>
                <span className="text-lg font-bold text-green-600">{revenueGrowth}%</span>
              </div>
              <input
                type="range"
                min="-20"
                max="50"
                value={revenueGrowth}
                onChange={(e) => setRevenueGrowth(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>-20%</span>
                <span>0%</span>
                <span>+50%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Expense Growth</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Annual Growth Rate</span>
                <span className="text-lg font-bold text-red-600">{expenseGrowth}%</span>
              </div>
              <input
                type="range"
                min="-10"
                max="30"
                value={expenseGrowth}
                onChange={(e) => setExpenseGrowth(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>-10%</span>
                <span>0%</span>
                <span>+30%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Impact Summary</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-600 mb-1">Pipeline Value (Weighted)</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalPipelineValue)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Net Adjustments</p>
              <p className={`text-xl font-bold ${totalAdjustments >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalAdjustments)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-6">12-Month Forecast</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
            <YAxis stroke="#64748b" style={{ fontSize: '12px' }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
            <Tooltip 
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} name="Projected Revenue" dot={{ fill: '#10b981', r: 4 }} />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} name="Projected Expenses" dot={{ fill: '#ef4444', r: 4 }} />
            <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} name="Projected Profit" dot={{ fill: '#3b82f6', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Deal Pipeline */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">Deal Pipeline</h3>
          <button
            onClick={() => setShowAddDeal(!showAddDeal)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Deal
          </button>
        </div>

        {showAddDeal && (
          <div className="bg-slate-50 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Deal name"
              value={newDeal.name}
              onChange={(e) => setNewDeal({ ...newDeal, name: e.target.value })}
              className="px-4 py-2 border border-slate-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="Amount"
              value={newDeal.amount}
              onChange={(e) => setNewDeal({ ...newDeal, amount: e.target.value })}
              className="px-4 py-2 border border-slate-300 rounded-lg"
            />
            <select
              value={newDeal.month}
              onChange={(e) => setNewDeal({ ...newDeal, month: e.target.value })}
              className="px-4 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">Select month</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={`Month +${i + 1}`}>Month +{i + 1}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Probability %"
              min="0"
              max="100"
              value={newDeal.probability}
              onChange={(e) => setNewDeal({ ...newDeal, probability: Number(e.target.value) })}
              className="px-4 py-2 border border-slate-300 rounded-lg"
            />
            <button
              onClick={addDeal}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              Add
            </button>
          </div>
        )}

        {deals.length > 0 ? (
          <div className="space-y-3">
            {deals.map(deal => (
              <div key={deal.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{deal.name}</p>
                  <p className="text-sm text-slate-600">{deal.month} • {deal.probability}% probability</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-lg font-bold text-green-600">{formatCurrency(deal.amount)}</p>
                  <p className="text-sm text-slate-500">Weighted: {formatCurrency(deal.amount * deal.probability / 100)}</p>
                  <button
                    onClick={() => removeDeal(deal.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8">No deals added yet</p>
        )}
      </div>

      {/* One-off Adjustments */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">One-off Adjustments</h3>
          <button
            onClick={() => setShowAddAdjustment(!showAddAdjustment)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Adjustment
          </button>
        </div>

        {showAddAdjustment && (
          <div className="bg-slate-50 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={newAdjustment.type}
              onChange={(e) => setNewAdjustment({ ...newAdjustment, type: e.target.value as 'revenue' | 'expense' })}
              className="px-4 py-2 border border-slate-300 rounded-lg"
            >
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
            </select>
            <input
              type="text"
              placeholder="Description"
              value={newAdjustment.description}
              onChange={(e) => setNewAdjustment({ ...newAdjustment, description: e.target.value })}
              className="px-4 py-2 border border-slate-300 rounded-lg md:col-span-2"
            />
            <input
              type="number"
              placeholder="Amount"
              value={newAdjustment.amount}
              onChange={(e) => setNewAdjustment({ ...newAdjustment, amount: e.target.value })}
              className="px-4 py-2 border border-slate-300 rounded-lg"
            />
            <select
              value={newAdjustment.month}
              onChange={(e) => setNewAdjustment({ ...newAdjustment, month: e.target.value })}
              className="px-4 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">Select month</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={`Month +${i + 1}`}>Month +{i + 1}</option>
              ))}
            </select>
            <button
              onClick={addAdjustment}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold md:col-span-5"
            >
              Add
            </button>
          </div>
        )}

        {adjustments.length > 0 ? (
          <div className="space-y-3">
            {adjustments.map(adj => (
              <div key={adj.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      adj.type === 'revenue' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {adj.type === 'revenue' ? 'Revenue' : 'Expense'}
                    </span>
                    <p className="font-semibold text-slate-900">{adj.description}</p>
                  </div>
                  <p className="text-sm text-slate-600">{adj.month}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className={`text-lg font-bold ${adj.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                    {adj.type === 'revenue' ? '+' : '-'}{formatCurrency(adj.amount)}
                  </p>
                  <button
                    onClick={() => removeAdjustment(adj.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8">No adjustments added yet</p>
        )}
      </div>
    </div>
  );
}
