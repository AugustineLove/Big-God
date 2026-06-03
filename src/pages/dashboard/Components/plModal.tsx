import React, { useState, useMemo } from 'react';
import {
  X, TrendingUp, TrendingDown, Download, Calendar,
  ArrowUpRight, ArrowDownRight, DollarSign, BarChart3,
  Lightbulb, RefreshCw, Loader2
} from 'lucide-react';
import { companyId } from '../../../constants/appConstants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PLModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: any) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCedi = (n: any) => `¢${fmt(n)}`;
const fmtPct = (n: any) => `${Number(n || 0).toFixed(1)}%`;

const DATE_RANGES = [
  { value: 'this-month',  label: 'This Month' },
  { value: 'last-month',  label: 'Last Month' },
  { value: 'quarter',     label: 'This Quarter' },
  { value: 'year',        label: 'This Year' },
  { value: 'custom',      label: 'Custom Range' },
];

// ─── Export Helpers ───────────────────────────────────────────────────────────

const exportToCSV = (plData: any, range: string, periodLabel: string) => {
  const { summary, expenseByCategory, monthlyTrend } = plData;

  let csv = `Profit & Loss Statement — ${periodLabel}\n`;
  csv += `Generated: ${new Date().toLocaleString()}\n\n`;

  csv += `INCOME SUMMARY\n`;
  csv += `Revenue,${fmtCedi(summary.totalRevenue)}\n`;
  csv += `Commission Income,${fmtCedi(summary.totalCommission)}\n`;
  csv += `Total Income,${fmtCedi(summary.totalIncome)}\n\n`;

  csv += `EXPENSES\n`;
  csv += `Total Operating Expenses,${fmtCedi(summary.totalExpenses)}\n`;
  expenseByCategory.forEach((cat: any) => {
    csv += `  ${cat.category},${fmtCedi(cat.amount)},${fmtPct(cat.pct)}\n`;
  });
  csv += `\n`;

  csv += `PROFITABILITY\n`;
  csv += `Gross Profit,${fmtCedi(summary.grossProfit)}\n`;
  csv += `Profit Margin,${fmtPct(summary.profitMargin)}\n`;
  csv += `Expense/Revenue Ratio,${fmtPct(summary.expenseToRevenueRatio)}\n\n`;

  csv += `MONTHLY TREND\nMonth,Revenue,Expenses,Commission,Profit\n`;
  monthlyTrend.forEach((m: any) => {
    csv += `${m.month},${m.revenue},${m.expenses},${m.commissions},${m.profit}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pl-statement-${range}-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

const exportToPDF = async (plData: any, periodLabel: string) => {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const { summary, expenseByCategory, monthlyTrend } = plData;

  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pw, 36, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('Profit & Loss Statement', pw / 2, 15, { align: 'center' });
  doc.setFontSize(9);
  doc.text(`${periodLabel}  |  Generated ${new Date().toLocaleString()}`, pw / 2, 27, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  let y = 46;

  // Income
  doc.setFontSize(12);
  doc.text('Income Summary', 14, y); y += 4;
  autoTable(doc, {
    startY: y,
    head: [['Item', 'Amount']],
    body: [
      ['Revenue', fmtCedi(summary.totalRevenue)],
      ['Commission Income', fmtCedi(summary.totalCommission)],
      ['Total Income', fmtCedi(summary.totalIncome)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241], textColor: 255 },
    styles: { fontSize: 10 },
  });
  // @ts-ignore
  y = doc.lastAutoTable.finalY + 8;

  // Profitability
  doc.setFontSize(12);
  doc.text('Profitability', 14, y); y += 4;
  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: [
      ['Total Expenses', fmtCedi(summary.totalExpenses)],
      ['Gross Profit', fmtCedi(summary.grossProfit)],
      ['Profit Margin', fmtPct(summary.profitMargin)],
      ['Expense/Revenue Ratio', fmtPct(summary.expenseToRevenueRatio)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    styles: { fontSize: 10 },
  });
  // @ts-ignore
  y = doc.lastAutoTable.finalY + 8;

  // Expense breakdown
  if (expenseByCategory.length > 0) {
    doc.setFontSize(12);
    doc.text('Expense Breakdown', 14, y); y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Category', 'Amount', '%']],
      body: expenseByCategory.map((c: any) => [c.category, fmtCedi(c.amount), fmtPct(c.pct)]),
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11], textColor: 255 },
      styles: { fontSize: 10 },
    });
    // @ts-ignore
    y = doc.lastAutoTable.finalY + 8;
  }

  // Monthly trend (new page if needed)
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.text('Monthly Trend', 14, y); y += 4;
  autoTable(doc, {
    startY: y,
    head: [['Month', 'Revenue', 'Expenses', 'Commission', 'Profit']],
    body: monthlyTrend.map((m: any) => [
      m.month,
      fmtCedi(m.revenue),
      fmtCedi(m.expenses),
      fmtCedi(m.commissions),
      fmtCedi(m.profit),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    styles: { fontSize: 9 },
  });

  doc.save(`pl-statement-${Date.now()}.pdf`);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const KPICard = ({ label, value, sub, icon: Icon, bg, textColor, subColor }: any) => (
  <div className={`${bg} rounded-2xl p-4 border border-opacity-20`}>
    <div className="flex items-start justify-between">
      <div>
        <p className={`text-[11px] font-semibold uppercase tracking-wider ${textColor} opacity-70 mb-1`}>{label}</p>
        <p className={`text-2xl font-medium ${textColor} tracking-tight leading-none`}>{value}</p>
        {sub && <p className={`text-[11px] mt-1.5 font-medium ${subColor || textColor} opacity-80`}>{sub}</p>}
      </div>
      <div className="opacity-40">
        <Icon className={`w-5 h-5 ${textColor}`} />
      </div>
    </div>
  </div>
);

const BarRow = ({ label, value, max, color, pct }: any) => {
  const width = max > 0 ? Math.max((value / max) * 100, 2) : 2;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[12px] font-medium text-gray-700 truncate max-w-[140px]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400">{fmtPct(pct)}</span>
          <span className="text-[12px] font-semibold text-gray-800 tabular-nums">{fmtCedi(value)}</span>
        </div>
      </div>
      <div className="bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-700`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
};

const PLRow = ({ label, value, isTotal, isIncome, indent }: any) => (
  <div className={`flex justify-between items-center py-2.5
    ${isTotal ? 'border-t border-gray-200 mt-1' : 'border-b border-gray-50'}
    ${indent ? 'pl-4' : ''}`}>
    <span className={`text-[13px] ${isTotal ? 'font-semibold text-gray-900' : indent ? 'text-gray-500' : 'font-medium text-gray-700'}`}>
      {label}
    </span>
    <span className={`text-[13px] font-semibold tabular-nums
      ${isTotal
        ? (Number(value) >= 0 ? 'text-emerald-600' : 'text-red-500')
        : isIncome ? 'text-emerald-600' : 'text-red-500'}`}>
      {isIncome ? '+' : Number(value) < 0 ? '' : '-'}{fmtCedi(Math.abs(value))}
    </span>
  </div>
);

// ─── Main Modal ───────────────────────────────────────────────────────────────

const PLModal: React.FC<PLModalProps> = ({ isOpen, onClose }) => {
  const [range, setRange] = useState('this-month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [plData, setPLData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'trend' | 'breakdown'>('overview');

  const periodLabel = useMemo(() => {
    const r = DATE_RANGES.find(d => d.value === range);
    if (range === 'custom' && startDate && endDate) return `${startDate} – ${endDate}`;
    return r?.label || range;
  }, [range, startDate, endDate]);

  const fetchPLData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ range });
      if (range === 'custom') {
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
      }
      const res = await fetch(
        `https://susu-pro-backend.onrender.com/api/financials/get-financials/${companyId}?${params}`
      );
      if (!res.ok) throw new Error('Request failed');
      const json = await res.json();

      const { data } = json;
      const { plSummary, expenseByCategory, monthlyTrend } = data;

      // Enrich categories with pct
      const totalExp = Number(plSummary.totalExpenses);
      const enrichedCategories = (expenseByCategory || []).map((c: any) => ({
        ...c,
        amount: Number(c.amount),
        pct: totalExp > 0 ? (Number(c.amount) / totalExp) * 100 : 0,
      }));

      setPLData({
        summary: plSummary,
        expenseByCategory: enrichedCategories,
        monthlyTrend: (monthlyTrend || []).map((m: any) => ({
          ...m,
          revenue: Number(m.revenue),
          expenses: Number(m.expenses),
          commissions: Number(m.commissions),
          profit: Number(m.profit),
        })),
        operationalMetrics: data.operationalMetrics,
      });
    } catch (e) {
      setError('Failed to load P&L data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch when range changes (not on custom until dates set)
  React.useEffect(() => {
    if (!isOpen) return;
    if (range === 'custom' && (!startDate || !endDate)) return;
    fetchPLData();
  }, [range, isOpen]);

  const handleCustomFetch = () => {
    if (startDate && endDate) fetchPLData();
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!plData) return;
    setExportLoading(true);
    try {
      if (format === 'csv') {
        exportToCSV(plData, range, periodLabel);
      } else {
        await exportToPDF(plData, periodLabel);
      }
    } catch (e) {
      console.error('Export error', e);
    } finally {
      setExportLoading(false);
    }
  };

  if (!isOpen) return null;

  const SECTION_TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'trend', label: 'Monthly Trend' },
    { id: 'breakdown', label: 'Expense Breakdown' },
  ];

  const BAR_COLORS = [
    'bg-indigo-500', 'bg-violet-500', 'bg-blue-500',
    'bg-teal-500', 'bg-amber-500', 'bg-pink-500', 'bg-rose-500',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
    >
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">

        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Profit & Loss Statement</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">{periodLabel}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Range selector */}
            <div className="relative">
              <select
                value={range}
                onChange={(e) => { setRange(e.target.value); setPLData(null); }}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pr-7 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
              >
                {DATE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">▼</span>
            </div>

            {/* Custom date pickers */}
            {range === 'custom' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date" value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <span className="text-gray-400 text-[11px]">to</span>
                <input
                  type="date" value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  onClick={handleCustomFetch}
                  disabled={!startDate || !endDate}
                  className="px-3 py-2 bg-indigo-500 text-white text-[12px] font-medium rounded-xl hover:bg-indigo-600 disabled:opacity-40 transition-colors"
                >
                  Apply
                </button>
              </div>
            )}

            {/* Refresh */}
            <button
              onClick={fetchPLData}
              disabled={loading}
              className="p-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Export CSV */}
            <button
              onClick={() => handleExport('csv')}
              disabled={!plData || exportLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12px] font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>

            {/* Export PDF */}
            <button
              onClick={() => handleExport('pdf')}
              disabled={!plData || exportLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-500 text-white rounded-xl text-[12px] font-medium hover:bg-indigo-600 disabled:opacity-40 transition-colors"
            >
              {exportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              PDF
            </button>

            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* ── Section tabs ── */}
        <div className="px-6 pt-3 pb-0 border-b border-gray-100 flex gap-1 flex-shrink-0">
          {SECTION_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-4 py-2.5 text-[12px] font-medium rounded-t-lg border-b-2 transition-colors
                ${activeSection === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-[13px] text-gray-400">Loading P&L data…</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-[13px] text-red-500">{error}</p>
              <button onClick={fetchPLData} className="text-[12px] text-indigo-600 underline">Try again</button>
            </div>
          )}

          {/* Custom range prompt */}
          {!loading && !error && !plData && range === 'custom' && (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Calendar className="w-8 h-8 text-gray-300" />
              <p className="text-[13px] text-gray-400">Select a start and end date above, then click Apply.</p>
            </div>
          )}

          {/* Data */}
          {!loading && !error && plData && (

            <>
              {/* ─ OVERVIEW ─ */}
              {activeSection === 'overview' && (
                <div className="space-y-5">

                  {/* KPI strip */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KPICard
                      label="Total Income"
                      value={fmtCedi(plData.summary.totalIncome)}
                      sub="Revenue + Commission"
                      icon={ArrowUpRight}
                      bg="bg-emerald-50" textColor="text-emerald-700"
                    />
                    <KPICard
                      label="Total Expenses"
                      value={fmtCedi(plData.summary.totalExpenses)}
                      sub="All categories"
                      icon={ArrowDownRight}
                      bg="bg-red-50" textColor="text-red-700"
                    />
                    <KPICard
                      label="Net Profit"
                      value={fmtCedi(plData.summary.grossProfit)}
                      sub={`${fmtPct(plData.summary.profitMargin)} margin`}
                      icon={plData.summary.grossProfit >= 0 ? TrendingUp : TrendingDown}
                      bg={plData.summary.grossProfit >= 0 ? 'bg-indigo-50' : 'bg-orange-50'}
                      textColor={plData.summary.grossProfit >= 0 ? 'text-indigo-700' : 'text-orange-700'}
                    />
                    <KPICard
                      label="Profit Margin"
                      value={fmtPct(plData.summary.profitMargin)}
                      sub={periodLabel}
                      icon={BarChart3}
                      bg="bg-violet-50" textColor="text-violet-700"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* Income Statement */}
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-100">
                        <p className="text-[13px] font-semibold text-gray-800">Income Statement</p>
                      </div>
                      <div className="px-5 py-4">
                        {/* Income */}
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Income</p>
                        <PLRow label="Revenue" value={plData.summary.totalRevenue} isIncome />
                        <PLRow label="Commission" value={plData.summary.totalCommission} isIncome indent />
                        <PLRow label="Total Income" value={plData.summary.totalIncome} isTotal isIncome />

                        {/* Expenses */}
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-4 mb-2">Expenses</p>
                        {plData.expenseByCategory.slice(0, 5).map((cat: any) => (
                          <PLRow key={cat.category} label={cat.category} value={cat.amount} indent />
                        ))}
                        {plData.expenseByCategory.length > 5 && (
                          <PLRow
                            label={`+${plData.expenseByCategory.length - 5} more categories`}
                            value={plData.expenseByCategory.slice(5).reduce((s: number, c: any) => s + c.amount, 0)}
                            indent
                          />
                        )}
                        <PLRow label="Total Expenses" value={plData.summary.totalExpenses} isTotal />

                        {/* Net */}
                        <div className="mt-4 pt-4 border-t-2 border-gray-200 flex justify-between items-center">
                          <span className="text-[14px] font-bold text-gray-900">Net Profit</span>
                          <span className={`text-[16px] font-bold tabular-nums
                            ${plData.summary.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {plData.summary.grossProfit >= 0 ? '+' : ''}{fmtCedi(plData.summary.grossProfit)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Key Insights */}
                    <div className="flex flex-col gap-3">
                      <div className="bg-white border border-gray-100 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          <p className="text-[13px] font-semibold text-gray-800">Key Insights</p>
                        </div>
                        <div className="space-y-3">
                          {[
                            {
                              label: 'Top Expense Category',
                              value: plData.summary.topExpenseCategory,
                              sub: `${fmtCedi(plData.summary.topExpenseCategoryAmount)} (${fmtPct(plData.summary.topExpenseCategoryPct)})`,
                              color: 'bg-orange-50',
                            },
                            {
                              label: 'Expense / Revenue Ratio',
                              value: fmtPct(plData.summary.expenseToRevenueRatio),
                              sub: plData.summary.expenseToRevenueRatio < 70 ? 'Healthy ratio' : 'Consider optimising',
                              color: plData.summary.expenseToRevenueRatio < 70 ? 'bg-emerald-50' : 'bg-amber-50',
                            },
                            {
                              label: 'Break-even Point',
                              value: fmtCedi(plData.summary.breakEvenPoint),
                              sub: 'Monthly revenue needed',
                              color: 'bg-indigo-50',
                            },
                            {
                              label: 'Cash Runway',
                              value: `${Number(plData.operationalMetrics?.runway || 0).toFixed(1)} months`,
                              sub: 'Based on burn rate',
                              color: 'bg-violet-50',
                            },
                          ].map(insight => (
                            <div key={insight.label} className={`${insight.color} rounded-xl p-3`}>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">{insight.label}</p>
                              <p className="text-[14px] font-semibold text-gray-900">{insight.value}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">{insight.sub}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─ TREND ─ */}
              {activeSection === 'trend' && (
                <div className="space-y-4">
                  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-gray-800">6-Month Trend</p>
                      <div className="flex items-center gap-4 text-[11px]">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block" />Revenue</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-400 inline-block" />Expenses</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block" />Profit</span>
                      </div>
                    </div>
                    <div className="px-5 py-4 space-y-5">
                      {(() => {
                        const maxVal = Math.max(...plData.monthlyTrend.flatMap((m: any) => [m.revenue, m.expenses]), 1);
                        return plData.monthlyTrend.map((m: any, i: number) => (
                          <div key={i}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[12px] font-semibold text-gray-700 w-20">{m.month}</span>
                              <div className="flex gap-4 text-[11px]">
                                <span className="text-emerald-600 tabular-nums">Rev: {fmtCedi(m.revenue + m.commissions)}</span>
                                <span className="text-red-500 tabular-nums">Exp: {fmtCedi(m.expenses)}</span>
                                <span className={`tabular-nums font-semibold ${m.profit >= 0 ? 'text-indigo-600' : 'text-orange-500'}`}>
                                  P/L: {fmtCedi(m.profit)}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 w-12">Revenue</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-3">
                                  <div className="bg-emerald-400 h-3 rounded-full" style={{ width: `${(m.revenue + m.commissions / maxVal) * 100}%` }} />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 w-12">Expenses</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-3">
                                  <div className="bg-red-400 h-3 rounded-full" style={{ width: `${(m.expenses / maxVal) * 100}%` }} />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 w-12">Profit</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-3">
                                  <div
                                    className={`h-3 rounded-full ${m.profit >= 0 ? 'bg-indigo-500' : 'bg-orange-400'}`}
                                    style={{ width: `${Math.min((Math.abs(m.profit) / maxVal) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* ─ BREAKDOWN ─ */}
              {activeSection === 'breakdown' && (
                <div className="space-y-4">
                  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-gray-800">Expense Breakdown</p>
                      <span className="text-[11px] text-gray-400">{plData.expenseByCategory.length} categories</span>
                    </div>
                    {plData.expenseByCategory.length > 0 ? (
                      <div className="px-5 py-4 space-y-4">
                        {plData.expenseByCategory.map((cat: any, i: number) => (
                          <BarRow
                            key={cat.category}
                            label={cat.category}
                            value={cat.amount}
                            max={plData.expenseByCategory[0].amount}
                            color={BAR_COLORS[i % BAR_COLORS.length]}
                            pct={cat.pct}
                          />
                        ))}
                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-[12px] font-semibold text-gray-700">Total Expenses</span>
                          <span className="text-[14px] font-bold text-red-500 tabular-nums">{fmtCedi(plData.summary.totalExpenses)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-[13px] text-gray-400">No expense data for this period</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between flex-shrink-0">
          <p className="text-[11px] text-gray-400">
            Last refreshed: {new Date().toLocaleString()}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PLModal;
