import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Download, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const PLModal = ({ isOpen, onClose, operationalMetrics, expenses, commissionStats, budgets }) => {
  const [timeRange, setTimeRange] = useState('this-month'); // this-month, last-month, quarter, year

  if (!isOpen) return null;

  // Calculate detailed P&L metrics
  const calculatePLData = () => {
    const totalRevenue = operationalMetrics.monthlyRevenue;
    const totalCommission = commissionStats?.this_month_amount || 0;
    const totalIncome = totalRevenue + totalCommission;
    
    // Break down expenses by category
    const expensesByCategory = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      acc[category] = (acc[category] || 0) + Number(expense.amount);
      return acc;
    }, {});

    const totalExpenses = operationalMetrics.monthlyExpenses;
    const grossProfit = totalIncome - totalExpenses;
    const netProfitMargin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;

    return {
      totalRevenue,
      totalCommission,
      totalIncome,
      expensesByCategory,
      totalExpenses,
      grossProfit,
      netProfitMargin
    };
  };

  const plData = calculatePLData();

  // Data for expense breakdown chart
  const expenseCategories = Object.entries(plData.expensesByCategory).map(([category, amount]) => ({
    category,
    amount: Number(amount),
    percentage: (Number(amount) / plData.totalExpenses) * 100
  })).sort((a, b) => b.amount - a.amount);

  // Monthly trend data (mock data - replace with actual historical data)
  const monthlyTrend = [
    { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000 },
    { month: 'Feb', revenue: 52000, expenses: 35000, profit: 17000 },
    { month: 'Mar', revenue: 48000, expenses: 33000, profit: 15000 },
    { month: 'Apr', revenue: operationalMetrics.monthlyRevenue, expenses: operationalMetrics.monthlyExpenses, profit: operationalMetrics.grossProfit }
  ];

  const maxValue = Math.max(...monthlyTrend.map(m => Math.max(m.revenue, m.expenses)));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Profit & Loss Statement</h2>
            <p className="text-sm text-gray-600 mt-1">Detailed financial performance analysis</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium">
              <Download className="w-4 h-4" />
              Export
            </button>
            
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          
          {/* Key Metrics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-sm text-green-700 font-medium mb-1">Total Income</p>
              <p className="text-2xl font-bold text-green-900">¢{plData.totalIncome.toLocaleString()}</p>
              <div className="flex items-center mt-2 text-green-600">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                <span className="text-xs">Revenue + Commission</span>
              </div>
            </div>

            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <p className="text-sm text-red-700 font-medium mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-red-900">¢{plData.totalExpenses.toLocaleString()}</p>
              <div className="flex items-center mt-2 text-red-600">
                <ArrowDownRight className="w-4 h-4 mr-1" />
                <span className="text-xs">All categories</span>
              </div>
            </div>

            <div className={`${plData.grossProfit >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'} rounded-xl p-4 border`}>
              <p className={`text-sm font-medium mb-1 ${plData.grossProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net Profit</p>
              <p className={`text-2xl font-bold ${plData.grossProfit >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                ¢{plData.grossProfit.toLocaleString()}
              </p>
              <div className={`flex items-center mt-2 ${plData.grossProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {plData.grossProfit >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                <span className="text-xs">{plData.netProfitMargin.toFixed(1)}% margin</span>
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <p className="text-sm text-purple-700 font-medium mb-1">Profit Margin</p>
              <p className="text-2xl font-bold text-purple-900">{plData.netProfitMargin.toFixed(1)}%</p>
              <div className="flex items-center mt-2 text-purple-600">
                <Calendar className="w-4 h-4 mr-1" />
                <span className="text-xs">This month</span>
              </div>
            </div>
          </div>

          {/* Monthly Trend Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">4-Month Trend Analysis</h3>
            <div className="space-y-6">
              {monthlyTrend.map((data, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{data.month}</span>
                    <div className="flex gap-6 text-xs">
                      <span className="text-green-600">Revenue: ¢{data.revenue.toLocaleString()}</span>
                      <span className="text-red-600">Expenses: ¢{data.expenses.toLocaleString()}</span>
                      <span className={data.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}>
                        Profit: ¢{data.profit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-12 bg-gray-50 rounded-lg overflow-hidden">
                    {/* Revenue Bar */}
                    <div 
                      className="absolute top-0 left-0 h-4 bg-green-400 rounded"
                      style={{ width: `${(data.revenue / maxValue) * 100}%` }}
                    />
                    {/* Expenses Bar */}
                    <div 
                      className="absolute top-5 left-0 h-4 bg-red-400 rounded"
                      style={{ width: `${(data.expenses / maxValue) * 100}%` }}
                    />
                    {/* Profit Indicator */}
                    <div 
                      className={`absolute top-10 left-0 h-2 rounded ${data.profit >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`}
                      style={{ width: `${Math.abs(data.profit / maxValue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded"></div>
                <span className="text-xs text-gray-600">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded"></div>
                <span className="text-xs text-gray-600">Expenses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-xs text-gray-600">Profit</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Detailed Income Statement */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Income Statement</h3>
              
              {/* Revenue Section */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-900">Revenue</span>
                  <span className="text-sm font-semibold text-green-600">
                    ¢{plData.totalRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 pl-4">
                  <span className="text-sm text-gray-600">Commission Income</span>
                  <span className="text-sm font-medium text-green-600">
                    +¢{plData.totalCommission.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 pt-3 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-900">Total Income</span>
                  <span className="text-sm font-bold text-green-600">
                    ¢{plData.totalIncome.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Expenses Section */}
              <div className="space-y-3 mb-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-900">Operating Expenses</span>
                  <span className="text-sm font-semibold text-red-600">
                    ¢{plData.totalExpenses.toLocaleString()}
                  </span>
                </div>
                {expenseCategories.slice(0, 5).map((cat, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 pl-4">
                    <span className="text-sm text-gray-600">{cat.category}</span>
                    <span className="text-sm font-medium text-red-600">
                      -¢{cat.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Net Profit */}
              <div className="pt-4 border-t-2 border-gray-300">
                <div className="flex justify-between items-center py-2">
                  <span className="text-base font-bold text-gray-900">Net Profit</span>
                  <span className={`text-lg font-bold ${plData.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {plData.grossProfit >= 0 ? '+' : ''}¢{plData.grossProfit.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">Net Margin</span>
                  <span className={`text-sm font-medium ${plData.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {plData.netProfitMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Expense Breakdown Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Expense Breakdown</h3>
              
              <div className="space-y-4">
                {expenseCategories.map((cat, idx) => {
                  const colors = [
                    'bg-blue-500',
                    'bg-purple-500',
                    'bg-pink-500',
                    'bg-orange-500',
                    'bg-teal-500',
                    'bg-indigo-500',
                    'bg-red-500'
                  ];
                  const color = colors[idx % colors.length];
                  
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 ${color} rounded`}></div>
                          <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            ¢{cat.amount.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({cat.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className={`${color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Expenses</span>
                  <span className="text-lg font-bold text-red-600">
                    ¢{plData.totalExpenses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">Number of categories</span>
                  <span className="text-xs font-medium text-gray-700">
                    {expenseCategories.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mt-8 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Top Expense Category</p>
                <p className="text-sm font-bold text-gray-900">{expenseCategories[0]?.category}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ¢{expenseCategories[0]?.amount.toLocaleString()} ({expenseCategories[0]?.percentage.toFixed(1)}%)
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Expense to Revenue Ratio</p>
                <p className="text-sm font-bold text-gray-900">
                  {((plData.totalExpenses / plData.totalIncome) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {((plData.totalExpenses / plData.totalIncome) * 100) < 70 ? 'Healthy ratio' : 'Consider optimization'}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Break-even Point</p>
                <p className="text-sm font-bold text-gray-900">
                  ¢{plData.totalExpenses.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Monthly revenue needed
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-8 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
            >
              Close
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              Schedule Report
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PLModal;