import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  CreditCard, Plus, Search, Filter, Eye, CheckCircle, XCircle, Clock,
  DollarSign, Calendar, AlertTriangle, FileText, Download, Phone, Mail,
  User, Building, Percent, Target, Banknote, Receipt, Users, Home,
  Briefcase, Car, GraduationCap, ChevronRight, ChevronDown, X, RefreshCw,
  TrendingUp, TrendingDown, BarChart2, PieChart, ArrowUpRight, ArrowDownRight,
  Layers, Activity, CheckSquare, Sliders, SortAsc, SortDesc, MoreVertical,
  Printer, Share2, Bell, Info, ArrowLeft, Loader2
} from 'lucide-react';

import { useAccounts } from '../../contexts/dashboard/Account';
import { companyId, userRole, userUUID } from '../../constants/appConstants';
import { Account } from '../../data/mockData';
import {
  ApprovePayload, useActiveLoans, useGroupLoans,
  useLoanApplications, useLoans
} from '../../contexts/dashboard/Loan';
import { useCustomers } from '../../contexts/dashboard/Customers';
import NewLoanModal from './Components/NewLoanModal';
import GroupLoanBreakdownModal from './Components/GroupLoanBreakDownModal';
import LoanDetailModal from './Components/LoanDetailModal';

/* ─────────────── TYPES ─────────────── */
interface ApprovalForm {
  disbursedamount: number;
  interestRate: number;
  loanterm: number;
  disbursementdate: string;
  notes: string;
}

type TabId = 'overview' | 'loans' | 'applications';
type SortField = 'disbursedamount' | 'status' | 'created_at' | 'loanterm';
type SortDir = 'asc' | 'desc';

/* ─────────────── HELPERS ─────────────── */
const fmt = (n: number) =>
  n >= 1000000
    ? `₵${(n / 1000000).toFixed(1)}M`
    : n >= 1000
    ? `₵${(n / 1000).toFixed(1)}K`
    : `₵${n.toLocaleString()}`;

const fmtFull = (n: number) => `₵${(n ?? 0).toLocaleString()}`;

const statusMeta: Record<string, { label: string; color: string; dot: string }> = {
  active:           { label: 'Active',          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',  dot: 'bg-emerald-500' },
  approved:         { label: 'Approved',         color: 'bg-emerald-50 text-emerald-700 border-emerald-200',  dot: 'bg-emerald-500' },
  overdue:          { label: 'Overdue',          color: 'bg-red-50 text-red-700 border-red-200',              dot: 'bg-red-500' },
  pending_approval: { label: 'Pending',          color: 'bg-amber-50 text-amber-700 border-amber-200',        dot: 'bg-amber-500' },
  completed:        { label: 'Completed',        color: 'bg-blue-50 text-blue-700 border-blue-200',           dot: 'bg-blue-500' },
  defaulted:        { label: 'Defaulted',        color: 'bg-gray-100 text-gray-600 border-gray-200',          dot: 'bg-gray-400' },
  under_review:     { label: 'Under Review',     color: 'bg-orange-50 text-orange-700 border-orange-200',     dot: 'bg-orange-500' },
  rejected:         { label: 'Rejected',         color: 'bg-red-50 text-red-700 border-red-200',              dot: 'bg-red-400' },
};

const StatusBadge = ({ status }: { status?: string }) => {
  const meta = statusMeta[status ?? ''] ?? { label: status ?? '—', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

const LoanTypeIcon = ({ type }: { type?: string }) => {
  const icons: Record<string, React.ReactNode> = {
    'Business Loan': <Briefcase size={14} />,
    'Personal Loan': <User size={14} />,
    'Agricultural Loan': <Home size={14} />,
    'Mortgage': <Building size={14} />,
    'Education Loan': <GraduationCap size={14} />,
    'Auto Loan': <Car size={14} />,
    group: <Users size={14} />,
    individual: <User size={14} />,
  };
  return <span className="text-[#4A635D]">{icons[type ?? ''] ?? <CreditCard size={14} />}</span>;
};

const Avatar = ({ name, size = 'md' }: { name?: string; size?: 'sm' | 'md' | 'lg' }) => {
  const sz = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }[size];
  return (
    <div className={`${sz} rounded-full bg-[#E8EDE8] flex items-center justify-center font-bold text-[#4A635D] shrink-0`}>
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  );
};

const MetricCard = ({
  label, value, sub, icon, trend, color = 'blue',
}: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode;
  trend?: { value: number; up: boolean }; color?: string;
}) => {
  const colors: Record<string, string> = {
    blue:   'from-[#1d4ed8] to-[#2563eb]',
    green:  'from-[#059669] to-[#10b981]',
    red:    'from-[#dc2626] to-[#ef4444]',
    purple: 'from-[#7c3aed] to-[#8b5cf6]',
    teal:   'from-[#0d9488] to-[#14b8a6]',
    amber:  'from-[#d97706] to-[#f59e0b]',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend.up ? 'bg-white/20' : 'bg-white/20'}`}>
            {trend.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-black tracking-tight">{value}</div>
      <div className="text-sm font-semibold opacity-80 mt-0.5">{label}</div>
      {sub && <div className="text-xs opacity-60 mt-1">{sub}</div>}
    </div>
  );
};

/* ─────────────── SEARCH & FILTER BAR ─────────────── */
const SearchFilterBar = ({
  search, setSearch, statusFilter, setStatusFilter,
  typeFilter, setTypeFilter, sortField, setSortField,
  sortDir, setSortDir, onExport, resultCount,
}: {
  search: string; setSearch: (v: string) => void;
  statusFilter: string; setStatusFilter: (v: string) => void;
  typeFilter: string; setTypeFilter: (v: string) => void;
  sortField: SortField; setSortField: (v: SortField) => void;
  sortDir: SortDir; setSortDir: (v: SortDir) => void;
  onExport: () => void; resultCount: number;
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const activeFilters = [statusFilter, typeFilter].filter(f => f !== 'all').length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, phone, purpose…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A635D]/30 focus:border-[#4A635D] transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        {/* Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              showFilters || activeFilters > 0
                ? 'bg-[#4A635D] text-white border-[#4A635D]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#4A635D]'
            }`}
          >
            <Sliders size={15} />
            Filters
            {activeFilters > 0 && (
              <span className="w-5 h-5 bg-white text-[#4A635D] rounded-full flex items-center justify-center text-[10px] font-black">
                {activeFilters}
              </span>
            )}
          </button>

          {/* Sort */}
          <select
            value={`${sortField}:${sortDir}`}
            onChange={e => {
              const [f, d] = e.target.value.split(':');
              setSortField(f as SortField);
              setSortDir(d as SortDir);
            }}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:outline-none focus:border-[#4A635D] cursor-pointer"
          >
            <option value="created_at:desc">Newest First</option>
            <option value="created_at:asc">Oldest First</option>
            <option value="disbursedamount:desc">Amount ↓</option>
            <option value="disbursedamount:asc">Amount ↑</option>
            <option value="loanterm:desc">Term ↓</option>
          </select>

          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-[#4A635D] hover:text-[#4A635D] transition-all"
          >
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#4A635D]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="completed">Completed</option>
              <option value="defaulted">Defaulted</option>
              <option value="under_review">Under Review</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Type</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#4A635D]"
            >
              <option value="all">All Types</option>
              <option value="group">Group</option>
              <option value="individual">Individual</option>
            </select>
          </div>
          {activeFilters > 0 && (
            <button
              onClick={() => { setStatusFilter('all'); setTypeFilter('all'); }}
              className="self-end flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              <X size={13} /> Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Result count */}
      <p className="text-xs text-gray-400 font-medium">
        Showing <span className="text-gray-700 font-bold">{resultCount}</span> results
        {search && <> for "<span className="text-[#4A635D] font-bold">{search}</span>"</>}
      </p>
    </div>
  );
};

/* ─────────────── STAT ROW ─────────────── */
const StatRow = ({ label, value, pct }: { label: string; value: string; pct?: number }) => (
  <div className="flex items-center gap-3">
    <div className="flex-1">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500 font-medium">{label}</span>
        <span className="text-gray-800 font-bold">{value}</span>
      </div>
      {pct !== undefined && (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#4A635D] rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      )}
    </div>
  </div>
);

/* ══════════════ MAIN COMPONENT ══════════════ */
const LoanManagement = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedLoan, setSelectedLoan] = useState<Account | undefined>();
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [repaymentLoanId, setRepaymentLoanId] = useState('');

  // Search / filter state (shared between tabs via lifting)
  const [loanSearch, setLoanSearch] = useState('');
  const [loanStatus, setLoanStatus] = useState('all');
  const [loanType, setLoanType] = useState('all');
  const [loanSort, setLoanSort] = useState<SortField>('created_at');
  const [loanDir, setLoanDir] = useState<SortDir>('desc');

  const { companyLoans, fetchLoanAccounts } = useAccounts();
  const { getGroupLoanWithMembers, logRepayment, allCompanyLoans, loading, approveLoan, rejectLoan } = useLoans();
  const applications = useLoanApplications();
  const activeLoans = useActiveLoans();
  const { customers } = useCustomers();

  useEffect(() => {
    if (companyId) fetchLoanAccounts(companyId);
  }, [companyId]);

  /* ── Portfolio Metrics ── */
  const metrics = useMemo(() => {
    const loans = companyLoans;
    const byStatus = (s: string) => loans.filter(l => l.status === s);
    const totalDisbursed   = loans.filter(l=> l.status === 'active').reduce((s, l) => Number(s) + (Number(l.disbursedamount) ?? Number(l.disbursedAmount) ?? 0), 0);
    const totalOutstanding = loans.filter(l=> l.status === 'active').reduce((s, l) => Number(s) + (Number(l.outstandingbalance) ?? Number(l.outstandingBalance) ?? 0), 0);
    const totalRepaid      = loans.reduce((s, l) => Number(s) + (Number(l.amountpaid) ?? Number(l.amountPaid) ?? 0), 0);
    const totalInterest    = loans.filter(l=> l.status ==='active').reduce((s, l) => s + ((l.totalpayable ?? 0) - (l.disbursedamount ?? l.disbursedAmount ?? 0)), 0);
    const overdueLoans     = byStatus('overdue');
    const overdueAmt       = overdueLoans.reduce((s, l) => s + (l.outstandingbalance ?? l.outstandingBalance ?? 0), 0);
    const repaymentRate    = totalDisbursed > 0 ? (totalRepaid / totalDisbursed) * 100 : 0;
    const parRate          = totalOutstanding > 0 ? (overdueAmt / totalOutstanding) * 100 : 0;

    return {
      totalLoans:      loans.length,
      totalDisbursed, totalOutstanding, totalRepaid, totalInterest,
      overdueCount:    overdueLoans.length, overdueAmt,
      activeCount:     byStatus('active').length + byStatus('approved').length,
      pendingCount:    applications.length,
      completedCount:  byStatus('completed').length,
      defaultedCount:  byStatus('defaulted').length,
      repaymentRate, parRate,
      byStatus,
    };
  }, [companyLoans, applications]);

  /* ── Filtered/sorted loans ── */
  const filteredLoans = useMemo(() => {
    let list = [...(activeLoans ?? [])];
    const q = loanSearch.toLowerCase();
    if (q) {
      list = list.filter(l =>
        l.id?.toLowerCase().includes(q) ||
        (l.group_name ?? l.recipient_name ?? '').toLowerCase().includes(q) ||
        (l.customer_phone ?? l.recipient_phone ?? '').includes(q) ||
        (l.purpose ?? '').toLowerCase().includes(q)
      );
    }
    if (loanStatus !== 'all') list = list.filter(l => l.status === loanStatus);
    if (loanType !== 'all') list = list.filter(l => l.loantype === loanType);

    list.sort((a, b) => {
      let va: number | string = 0, vb: number | string = 0;
      if (loanSort === 'disbursedamount') { va = a.disbursedamount ?? 0; vb = b.disbursedamount ?? 0; }
      else if (loanSort === 'loanterm')   { va = a.loanterm ?? 0;       vb = b.loanterm ?? 0; }
      else { va = a.created_at ?? ''; vb = b.created_at ?? ''; }
      if (va < vb) return loanDir === 'asc' ? -1 : 1;
      if (va > vb) return loanDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [activeLoans, loanSearch, loanStatus, loanType, loanSort, loanDir]);

  const handleExport = useCallback(() => {
    const rows = filteredLoans.map(l => ({
      ID: l.id,
      Name: l.group_name ?? l.recipient_name,
      Type: l.loantype,
      Status: l.status,
      Disbursed: l.disbursedamount,
      Outstanding: l.outstandingbalance ?? l.outstandingBalance,
      Paid: l.amountpaid,
      Rate: l.interestrateloan,
      Term: l.loanterm,
    }));
    const csv = [
      Object.keys(rows[0] ?? {}).join(','),
      ...rows.map(r => Object.values(r).join(','))
    ].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = `loans_${Date.now()}.csv`;
    a.click();
  }, [filteredLoans]);

  const handleApproveLoan = async (data: ApprovePayload) => {
    await approveLoan(data);
    setShowApprovalModal(false);
    setSelectedLoan(undefined);
  };

  const openRepayment = (loanId: string) => {
    setRepaymentLoanId(loanId);
    setShowRepaymentModal(true);
  };

  /* ════════════ OVERVIEW TAB ════════════ */
  const OverviewTab = () => {
    const recentActivity = useMemo(() => {
      const sorted = [...companyLoans].sort((a, b) =>
        (b.updated_at ?? b.created_at ?? '') > (a.updated_at ?? a.created_at ?? '') ? 1 : -1
      );
      return sorted.slice(0, 6);
    }, []);

    return (
      <div className="space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Disbursed"
            value={fmt(metrics.totalDisbursed)}
            sub={`${metrics.totalLoans} loans issued`}
            icon={<Banknote size={20} />}
            color="teal"
          />
          <MetricCard
            label="Outstanding"
            value={fmt(metrics.totalOutstanding)}
            sub={`${metrics.repaymentRate.toFixed(1)}% repaid`}
            icon={<Target size={20} />}
            color="blue"
          />
          <MetricCard
            label="Overdue Amount"
            value={fmt(metrics.overdueAmt)}
            sub={`PAR: ${metrics.parRate.toFixed(1)}%`}
            icon={<AlertTriangle size={20} />}
            color="red"
          />
          <MetricCard
            label="Interest Earned"
            value={fmt(metrics.totalInterest)}
            sub="From active portfolio"
            icon={<TrendingUp size={20} />}
            color="purple"
          />
        </div>

        {/* Second row: counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Loans',      count: metrics.activeCount,    icon: <CheckCircle size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { label: 'Pending Approval',  count: metrics.pendingCount,   icon: <Clock size={18} />,       color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100' },
            { label: 'Overdue',           count: metrics.overdueCount,   icon: <XCircle size={18} />,     color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-100' },
            { label: 'Completed',         count: metrics.completedCount, icon: <FileText size={18} />,    color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100' },
          ].map(({ label, count, icon, color, bg, border }) => (
            <div key={label} className={`bg-white border ${border} rounded-2xl p-5 flex items-center gap-4`}>
              <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center`}>{icon}</div>
              <div>
                <div className="text-2xl font-black text-gray-900">{count}</div>
                <div className="text-xs text-gray-500 font-medium">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Portfolio Health + Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Health */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Portfolio Health</h3>
              <Activity size={18} className="text-[#4A635D]" />
            </div>
            <div className="space-y-4">
              <StatRow
                label="Repayment Rate"
                value={`${metrics.repaymentRate.toFixed(1)}%`}
                pct={metrics.repaymentRate}
              />
              <StatRow
                label="Portfolio at Risk (PAR)"
                value={`${metrics.parRate.toFixed(1)}%`}
                pct={metrics.parRate}
              />
              <StatRow
                label="Total Repaid"
                value={fmtFull(metrics.totalRepaid)}
                pct={(metrics.totalRepaid / (metrics.totalDisbursed || 1)) * 100}
              />
              <StatRow
                label="Defaults"
                value={`${metrics.defaultedCount} loans`}
                pct={(metrics.defaultedCount / (metrics.totalLoans || 1)) * 100}
              />
            </div>
          </div>

          {/* Loan Type Breakdown */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Loan Breakdown</h3>
              <PieChart size={18} className="text-[#4A635D]" />
            </div>
            {[
              { label: 'Group Loans',      count: companyLoans.filter(l => l.loantype === 'group').length },
              { label: 'Individual Loans', count: companyLoans.filter(l => l.loantype !== 'group' && l.loantype !== 'p2p').length },
              { label: 'P2P Lending',      count: companyLoans.filter(l => l.loantype === 'p2p').length },
              { label: 'Active',           count: metrics.activeCount },
              { label: 'Pending',          count: metrics.pendingCount },
            ].map(({ label, count }) => {
              const pct = metrics.totalLoans > 0 ? (count / metrics.totalLoans) * 100 : 0;
              return (
                <div key={label} className="flex items-center gap-3 mb-3">
                  <div className="text-xs text-gray-500 w-28 shrink-0">{label}</div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#4A635D] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs font-bold text-gray-700 w-6 text-right">{count}</div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-5">Quick Actions</h3>
            <div className="space-y-3">
              {[
                { label: 'New Loan Application',  icon: <Plus size={16} />,         action: () => setShowNewLoanModal(true),         cls: 'bg-[#4A635D] text-white hover:bg-[#3d524d]' },
                { label: 'Record Payment',        icon: <Receipt size={16} />,       action: () => openRepayment(''),                  cls: 'bg-white border border-gray-200 text-gray-700 hover:border-[#4A635D]' },
                { label: 'View Applications',     icon: <FileText size={16} />,      action: () => setActiveTab('applications'),      cls: 'bg-white border border-gray-200 text-gray-700 hover:border-[#4A635D]' },
                { label: 'Export Portfolio',      icon: <Download size={16} />,      action: handleExport,                            cls: 'bg-white border border-gray-200 text-gray-700 hover:border-[#4A635D]' },
              ].map(({ label, icon, action, cls }) => (
                <button
                  key={label}
                  onClick={action}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${cls}`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">Recent Loan Activity</h3>
            <button
              onClick={() => setActiveTab('loans')}
              className="text-xs text-[#4A635D] font-bold flex items-center gap-1 hover:underline"
            >
              View All <ChevronRight size={13} />
            </button>
          </div>
          {companyLoans.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No recent activity</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {[...companyLoans]
                .sort((a, b) => (b.created_at ?? '') > (a.created_at ?? '') ? 1 : -1)
                .slice(0, 6)
                .map((loan) => {
                  const name = loan.group_name ?? loan.recipient_name ?? loan.customer_name ?? '—';
                  const amt  = loan.disbursedamount ?? loan.disbursedAmount ?? 0;
                  const icons: Record<string, { icon: React.ReactNode; bg: string }> = {
                    active:           { icon: <CheckCircle size={15} />, bg: 'bg-emerald-50 text-emerald-600' },
                    overdue:          { icon: <AlertTriangle size={15} />, bg: 'bg-red-50 text-red-500' },
                    pending_approval: { icon: <Clock size={15} />, bg: 'bg-amber-50 text-amber-600' },
                    completed:        { icon: <CheckSquare size={15} />, bg: 'bg-blue-50 text-blue-600' },
                  };
                  const ic = icons[loan.status] ?? { icon: <CreditCard size={15} />, bg: 'bg-gray-50 text-gray-500' };
                  return (
                    <div key={loan.id} className="flex items-center gap-4 py-3.5 hover:bg-gray-50/50 rounded-lg px-2 -mx-2 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ic.bg}`}>{ic.icon}</div>
                      <Avatar name={name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
                        <p className="text-xs text-gray-400 font-mono">#{loan.id?.slice(0, 8)}</p>
                      </div>
                      <StatusBadge status={loan.status} />
                      <div className="text-sm font-bold text-gray-800 shrink-0">{fmtFull(amt)}</div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ════════════ LOANS TAB ════════════ */
  const LoansTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Loan Portfolio</h2>
          <p className="text-sm text-gray-500 mt-0.5">All active and approved loans</p>
        </div>
        <button
          onClick={() => setShowNewLoanModal(true)}
          className="flex items-center gap-2 bg-[#4A635D] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-[#3d524d] hover:shadow-md transition-all"
        >
          <Plus size={16} /> New Loan
        </button>
      </div>

      <SearchFilterBar
        search={loanSearch} setSearch={setLoanSearch}
        statusFilter={loanStatus} setStatusFilter={setLoanStatus}
        typeFilter={loanType} setTypeFilter={setLoanType}
        sortField={loanSort} setSortField={setLoanSort}
        sortDir={loanDir} setSortDir={setLoanDir}
        onExport={handleExport}
        resultCount={filteredLoans.length}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse space-y-4">
              <div className="flex justify-between"><div className="h-4 bg-gray-100 rounded w-24" /><div className="h-4 bg-gray-100 rounded w-16" /></div>
              <div className="h-10 bg-gray-50 rounded-xl" />
              <div className="space-y-2">
                <div className="h-2 bg-gray-100 rounded-full" />
                <div className="h-2 bg-gray-100 rounded-full w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <CreditCard size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500 font-semibold">No loans found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
          {(loanSearch || loanStatus !== 'all' || loanType !== 'all') && (
            <button
              onClick={() => { setLoanSearch(''); setLoanStatus('all'); setLoanType('all'); }}
              className="mt-4 text-[#4A635D] text-sm font-bold hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredLoans.map((loan) => {
            const paid     = loan.amountpaid ?? 0;
            const total    = loan.totalpayable ?? 1;
            const progress = Math.min((paid / total) * 100, 100);
            const isGroup  = loan.loantype === 'group';
            const name     = loan.group_name ?? loan.recipient_name ?? '—';
            const phone    = loan.customer_phone ?? loan.recipient_phone ?? '';
            const daysLeft = loan.duedate
              ? Math.ceil((new Date(loan.duedate).getTime() - Date.now()) / 86400000)
              : null;

            return (
              <div key={loan.id} className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col overflow-hidden">
                {/* Top bar */}
                <div className="p-5 pb-3 flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${isGroup ? 'bg-violet-50 text-violet-600' : 'bg-sky-50 text-sky-600'}`}>
                      <LoanTypeIcon type={loan.loantype} />
                      <span className="ml-1">{loan.loantype}</span>
                    </div>
                  </div>
                  <StatusBadge status={loan.status} />
                </div>

                {/* Identity */}
                <div className="px-5 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar name={name} />
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 leading-tight truncate">{name}</p>
                      {phone && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone size={10} />{phone}
                        </p>
                      )}
                      <p className="text-[10px] font-mono text-gray-300 mt-0.5">#{loan.id?.slice(0, 8)}</p>
                    </div>
                  </div>

                  {/* Amount row */}
                  <div className="bg-gray-50 rounded-xl p-3.5 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Disbursed</p>
                      <p className="text-xl font-black text-gray-900">{fmtFull(loan.disbursedamount ?? 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rate / Term</p>
                      <p className="text-sm font-bold text-[#4A635D]">{loan.interestrateloan}% · {loan.loanterm}m</p>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="px-5 pb-4 space-y-2">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-gray-400 uppercase tracking-wider">Repayment</span>
                    <span className="text-gray-700">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        progress >= 90 ? 'bg-emerald-500' : progress >= 50 ? 'bg-[#4A635D]' : 'bg-amber-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Paid: <span className="text-gray-600 font-semibold">{fmtFull(paid)}</span></span>
                    <span>Balance: <span className="text-gray-600 font-semibold">{fmtFull(total - paid)}</span></span>
                  </div>
                </div>

                {/* Due date indicator */}
                {daysLeft !== null && (
                  <div className={`mx-5 mb-3 px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 ${
                    daysLeft < 0 ? 'bg-red-50 text-red-600' :
                    daysLeft <= 7 ? 'bg-amber-50 text-amber-700' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    <Calendar size={11} />
                    {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` :
                     daysLeft === 0 ? 'Due today' :
                     `Due in ${daysLeft} days`}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto px-5 pb-5 flex gap-2.5">
                  <button
                    onClick={() => setSelectedLoan(loan)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:border-[#4A635D] hover:text-[#4A635D] transition-all"
                  >
                    <Eye size={15} /> Details
                  </button>
                  <button
                    onClick={() => openRepayment(loan.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#4A635D] text-white rounded-xl text-sm font-bold hover:bg-[#3d524d] shadow-sm hover:shadow-md transition-all"
                  >
                    <Receipt size={15} /> Pay
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ════════════ APPLICATIONS TAB ════════════ */
  const ApplicationsTab = () => {
    const apps = useLoanApplications();
    const { approveLoan: approve, rejectLoan: reject, loading: appLoading } = useLoans();
    const [appSearch, setAppSearch] = useState('');
    const [groupModal, setGroupModal] = useState<string | null>(null);
    const [actionId, setActionId] = useState<string | null>(null);

    const filtered = useMemo(() => {
      const q = appSearch.toLowerCase();
      return apps.filter(a =>
        !q ||
        a.group_name?.toLowerCase().includes(q) ||
        a.customer_name?.toLowerCase().includes(q) ||
        a.id?.toLowerCase().includes(q) ||
        a.purpose?.toLowerCase().includes(q)
      );
    }, [apps, appSearch]);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Loan Applications</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {apps.length} pending application{apps.length !== 1 ? 's' : ''} awaiting review
            </p>
          </div>
          {apps.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
              <Bell size={15} className="text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">{apps.length} requiring action</span>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={appSearch}
            onChange={e => setAppSearch(e.target.value)}
            placeholder="Search applications…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A635D]/30 focus:border-[#4A635D]"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <FileText size={40} className="text-gray-300 mb-3" />
            <p className="text-gray-500 font-semibold">No applications found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((app) => (
              <div key={app.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                {/* Header */}
                <div className="p-5 pb-0 flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={app.group_name ?? app.customer_name} size="lg" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-gray-900 text-lg">{app.group_name ?? app.customer_name}</h3>
                        <StatusBadge status={app.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="font-mono">#{app.id?.slice(0, 8)}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {app.created_at ? new Date(app.created_at).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                        {app.customer_phone && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1"><Phone size={11} />{app.customer_phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <button
                      onClick={async () => { setActionId(app.id); await reject({ loanId: app.id }); setActionId(null); }}
                      disabled={appLoading && actionId === app.id}
                      className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition-all disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={async () => { setActionId(app.id); await approve({ loanId: app.id }); setActionId(null); }}
                      disabled={appLoading && actionId === app.id}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#4A635D] hover:bg-[#3d524d] rounded-xl shadow-sm transition-all disabled:opacity-50"
                    >
                      {appLoading && actionId === app.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                      Approve
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-y border-gray-50 mx-5 my-4">
                  {[
                    { label: 'Loan Amount',  value: fmtFull(app.loanamount ?? 0),        icon: <Banknote size={14} /> },
                    { label: 'Duration',     value: `${app.loanterm} Months`,             icon: <Clock size={14} /> },
                    { label: 'Interest Rate',value: `${app.interestrateloan}%`,           icon: <Percent size={14} /> },
                    { label: 'Members',      value: `${app.member_count ?? 1} people`,    icon: <Users size={14} /> },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="py-4 px-3 border-r last:border-r-0 border-gray-50">
                      <div className="flex items-center gap-1.5 text-gray-400 mb-1">{icon}<span className="text-[10px] font-bold uppercase tracking-wider">{label}</span></div>
                      <p className="text-sm font-black text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {app.purpose && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Briefcase size={13} />
                      <span className="italic">Purpose: {app.purpose}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setGroupModal(app.id)}
                    className="ml-auto text-[#4A635D] text-xs font-bold flex items-center gap-1 hover:underline"
                  >
                    View Full Breakdown <ChevronRight size={13} />
                  </button>
                </div>

                {groupModal === app.id && (
                  <GroupLoanBreakdownModal
                    groupId={app.id}
                    isOpen={true}
                    onClose={() => setGroupModal(null)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  /* ════════════ REPAYMENT MODAL ════════════ */
  const RepaymentModal = () => {
    const [form, setForm] = useState({
      loanId: repaymentLoanId,
      amount: '',
      method: 'Cash',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!showRepaymentModal) return null;

    const activeLoansList = companyLoans.filter(l => l.status === 'active' || l.status === 'approved');

    const handleSubmit = async () => {
      if (!form.loanId || !form.amount) return;
      setSubmitting(true);
      try {
        await logRepayment({ loanId: form.loanId, amount: Number(form.amount), method: form.method, date: form.date, reference: form.reference, notes: form.notes });
        setSuccess(true);
        setTimeout(() => { setShowRepaymentModal(false); setSuccess(false); }, 1500);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Receipt size={18} className="text-emerald-600" />
                </div>
                <h2 className="text-lg font-black text-gray-900">Record Payment</h2>
              </div>
              <button onClick={() => setShowRepaymentModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <X size={16} />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <CheckCircle size={48} className="text-emerald-500" />
                <p className="font-bold text-gray-800">Payment recorded successfully!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Select Loan</label>
                  <select
                    value={form.loanId}
                    onChange={e => setForm(f => ({ ...f, loanId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4A635D] focus:ring-2 focus:ring-[#4A635D]/20"
                  >
                    <option value="">— Select a loan —</option>
                    {activeLoansList.map(l => (
                      <option key={l.id} value={l.id}>
                        #{l.id?.slice(0, 8)} · {l.group_name ?? l.recipient_name} · Balance: {fmtFull(l.outstandingbalance ?? l.outstandingBalance ?? 0)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Amount (₵)</label>
                    <input
                      type="number" step="0.01"
                      value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4A635D] focus:ring-2 focus:ring-[#4A635D]/20"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Method</label>
                    <select
                      value={form.method}
                      onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4A635D]"
                    >
                      {['Cash', 'Mobile Money', 'Bank Transfer', 'Cheque'].map(m => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Payment Date</label>
                    <input
                      type="date" value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4A635D]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Reference #</label>
                    <input
                      type="text" value={form.reference}
                      onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4A635D]"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Notes</label>
                  <textarea
                    rows={2} value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4A635D] resize-none"
                    placeholder="Optional notes…"
                  />
                </div>
              </div>
            )}

            {!success && (
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowRepaymentModal(false)}
                  className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !form.loanId || !form.amount}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                  Record Payment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ════════════ APPROVAL MODAL ════════════ */
  const ApprovalModal = ({ interestmethod }: { interestmethod: string }) => {
    const [form, setForm] = useState<ApprovalForm>({
      disbursedamount: Number(selectedLoan?.disbursedamount ?? selectedLoan?.disbursedAmount) || 0,
      interestRate: selectedLoan?.interestrateloan || 0,
      loanterm: selectedLoan?.loanterm || 12,
      disbursementdate: '',
      notes: '',
    });

    if (!showApprovalModal) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      setForm(p => ({ ...p, [name]: type === 'number' ? Number(value) : value }));
    };

    const handleSubmit = async () => {
      if (!selectedLoan || form.disbursedamount <= 0) return;
      await handleApproveLoan({
        loanId: selectedLoan.id || '',
        disbursedamount: form.disbursedamount,
        interestrateloan: form.interestRate,
        loanterm: form.loanterm,
        disbursementdate: form.disbursementdate,
        notes: form.notes,
        approvedby: userUUID,
        created_by_type: userRole,
        interestmethod,
      });
    };

    const monthly = form.disbursedamount > 0
      ? ((form.disbursedamount * (1 + (form.interestRate / 100))) / form.loanterm).toFixed(2)
      : '0.00';

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <CheckCircle size={18} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Approve Loan</h2>
                  {selectedLoan && <p className="text-xs text-gray-400 font-mono">#{selectedLoan.id?.slice(0, 8)}</p>}
                </div>
              </div>
              <button
                onClick={() => { setShowApprovalModal(false); setSelectedLoan(undefined); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X size={16} />
              </button>
            </div>

            {/* Monthly payment preview */}
            {form.disbursedamount > 0 && (
              <div className="bg-[#4A635D]/5 border border-[#4A635D]/20 rounded-xl p-4 mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#4A635D] uppercase tracking-wider">Estimated Monthly Payment</p>
                  <p className="text-2xl font-black text-[#4A635D]">₵{Number(monthly).toLocaleString()}</p>
                </div>
                <Calculator size={28} className="text-[#4A635D]/40" />
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Approved Amount (₵)</label>
                  <input type="number" name="disbursedamount" value={form.disbursedamount} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4A635D] focus:ring-2 focus:ring-[#4A635D]/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Interest Rate (%)</label>
                  <input type="number" step="0.1" name="interestRate" value={form.interestRate} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4A635D] focus:ring-2 focus:ring-[#4A635D]/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tenure (Months)</label>
                  <select name="loanterm" value={form.loanterm} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4A635D]">
                    {[3, 6, 12, 18, 24, 36, 60].map(m => <option key={m} value={m}>{m} months</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Disbursement Date</label>
                  <input type="date" name="disbursementdate" value={form.disbursementdate} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4A635D]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Conditions / Notes</label>
                <textarea name="notes" rows={3} value={form.notes} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4A635D] resize-none"
                  placeholder="Add any approval conditions or notes…" />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => { setShowApprovalModal(false); setSelectedLoan(undefined); }}
                className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                Approve Loan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ────────── Tab config ────────── */
  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: 'overview',      label: 'Overview' },
    { id: 'loans',         label: 'All Loans',     badge: activeLoans?.length || 0 },
    { id: 'applications',  label: 'Applications',  badge: applications?.length || 0 },
  ];

  /* ════════════ RENDER ════════════ */
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="mx-auto sm:px-6 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Loan Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Comprehensive loan portfolio management</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchLoanAccounts(companyId)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-[#4A635D] hover:text-[#4A635D] transition-all"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={() => setShowNewLoanModal(true)}
              className="flex items-center gap-2 bg-[#4A635D] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-[#3d524d] hover:shadow-md transition-all"
            >
              <Plus size={16} /> New Loan
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 mb-8 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#4A635D] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'overview'     && <OverviewTab />}
          {activeTab === 'loans'        && <LoansTab />}
          {activeTab === 'applications' && <ApplicationsTab />}
        </div>
      </div>

      {/* Modals */}
      <LoanDetailModal
        selectedLoan={selectedLoan}
        setSelectedLoan={setSelectedLoan}
        setShowRepaymentModal={setShowRepaymentModal}
        getGroupLoanWithMembers={getGroupLoanWithMembers}
        logRepayment={logRepayment}
      />
      <NewLoanModal
        showNewLoanModal={showNewLoanModal}
        setShowNewLoanModal={setShowNewLoanModal}
        availableCustomers={customers}
      />
      <RepaymentModal />
      <ApprovalModal interestmethod={selectedLoan?.interestmethod ?? ''} />
    </div>
  );
};

export default LoanManagement;
