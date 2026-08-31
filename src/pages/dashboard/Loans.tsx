import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  CreditCard, Plus, Search, Filter, Eye, CheckCircle, XCircle, Clock,
  DollarSign, Calendar, AlertTriangle, FileText, Download, Phone, Mail,
  User, Building, Percent, Target, Banknote, Receipt, Users, Home,
  Briefcase, Car, GraduationCap, ChevronRight, ChevronDown, X, RefreshCw,
  TrendingUp, TrendingDown, BarChart2, PieChart, ArrowUpRight, ArrowDownRight,
  Layers, Activity, CheckSquare, Sliders, SortAsc, SortDesc, MoreVertical,
  Printer, Share2, Bell, Info, ArrowLeft, Loader2, Calculator,
  Send
} from 'lucide-react';

import { useAccounts } from '../../contexts/dashboard/Account';
import { companyId, userPermissions, userRole, userUUID } from '../../constants/appConstants';
import { Account } from '../../data/mockData';
import {
  ApprovePayload, useActiveLoans, useGroupLoans,
  useLoanApplications, useLoans
} from '../../contexts/dashboard/Loan';
import { useCustomers } from '../../contexts/dashboard/Customers';
import NewLoanModal from './Components/NewLoanModal';
import GroupLoanBreakdownModal from './Components/GroupLoanBreakDownModal';
import LoanDetailModal from './Components/LoanDetailModal';
import LoanApprovalModal from './Components/LoanApprovalModal';

// Shared passbook theme — same file used across CustomerDetailsPage,
// StaffManagement and Withdrawals.
import './Components/CustomerDetails/theme.css';

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

// Every status maps to one of three semantic roles — forest (good/active),
// brass (waiting/attention), clay (bad/stopped) — plus a neutral gray for
// closed-out states. Kept as inline styles since the lookup is dynamic.
const statusMeta: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  active:           { label: 'Active',       bg: 'rgba(47,74,50,0.1)',   color: 'var(--forest)',    dot: 'var(--forest)' },
  approved:         { label: 'Approved',     bg: 'rgba(47,74,50,0.1)',   color: 'var(--forest)',    dot: 'var(--forest)' },
  overdue:          { label: 'Overdue',      bg: 'var(--clay-soft)',     color: 'var(--clay)',      dot: 'var(--clay)' },
  pending_approval: { label: 'Pending',      bg: 'var(--brass-soft)',    color: '#8a6224',          dot: 'var(--brass)' },
  completed:        { label: 'Completed',    bg: 'rgba(62,97,66,0.12)',  color: 'var(--forest-mid)', dot: 'var(--forest-mid)' },
  defaulted:        { label: 'Defaulted',    bg: 'var(--paper)',         color: 'var(--ink-faint)', dot: 'var(--ink-faint)' },
  under_review:     { label: 'Under review', bg: 'var(--brass-soft)',    color: 'var(--brass)',     dot: 'var(--brass)' },
  rejected:         { label: 'Rejected',     bg: 'var(--clay-soft)',     color: 'var(--clay)',      dot: 'var(--clay)' },
};

const StatusBadge = ({ status }: { status?: string; size?: 'sm' | 'md' }) => {
  const meta = statusMeta[status ?? ''] ?? { label: status ?? '—', bg: 'var(--paper)', color: 'var(--ink-faint)', dot: 'var(--ink-faint)' };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: meta.bg, color: meta.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
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
  return <span style={{ color: 'var(--forest)' }}>{icons[type ?? ''] ?? <CreditCard size={14} />}</span>;
};

const Avatar = ({ name, size = 'md' }: { name?: string; size?: 'sm' | 'md' | 'lg' }) => {
  const sz = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }[size];
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-semibold shrink-0 cd-mono`}
      style={{ background: 'var(--brass-soft)', color: 'var(--forest-deep)' }}
    >
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  );
};

// Metric-card accents kept to the four semantic roles the theme actually
// defines, mapped from the original six ad-hoc names.
const metricAccents: Record<string, { chipBg: string; chipColor: string }> = {
  blue:   { chipBg: 'rgba(62,97,66,0.12)', chipColor: 'var(--forest-mid)' },
  green:  { chipBg: 'rgba(47,74,50,0.1)',  chipColor: 'var(--forest)' },
  red:    { chipBg: 'var(--clay-soft)',    chipColor: 'var(--clay)' },
  purple: { chipBg: 'var(--brass-soft)',   chipColor: 'var(--brass)' },
  teal:   { chipBg: 'rgba(47,74,50,0.1)',  chipColor: 'var(--forest)' },
  amber:  { chipBg: 'var(--brass-soft)',   chipColor: '#8a6224' },
};

const MetricCard = ({
  label,
  value,
  sub,
  icon,
  trend,
  color = 'blue',
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  trend?: { value: number; up: boolean };
  color?: string;
}) => {
  const accent = metricAccents[color] ?? metricAccents.blue;

  return (
    <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl p-5 hover:shadow-[0_10px_24px_-16px_rgba(20,32,20,0.4)] transition-all">
      <div className="flex items-start justify-between mb-5">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: accent.chipBg, color: accent.chipColor }}
        >
          {icon}
        </div>

        {trend && (
          <div
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={
              trend.up
                ? { background: 'rgba(47,74,50,0.1)', color: 'var(--forest)' }
                : { background: 'var(--clay-soft)', color: 'var(--clay)' }
            }
          >
            {trend.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div className="cd-display text-2xl font-semibold tracking-tight text-[var(--ink)]">
        {value}
      </div>

      <div className="text-sm font-medium text-[var(--ink-soft)] mt-1">
        {label}
      </div>

      {sub && (
        <div className="text-xs text-[var(--ink-faint)] mt-1">
          {sub}
        </div>
      )}
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
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, phone, purpose…"
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--card)] border border-[var(--paper-line)] rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--forest-mid)] focus:border-[var(--forest-mid)] transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] hover:text-[var(--ink-soft)]">
              <X size={14} />
            </button>
          )}
        </div>
        {/* Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all"
            style={
              showFilters || activeFilters > 0
                ? { background: 'var(--forest)', color: '#fff', borderColor: 'var(--forest)' }
                : { background: 'var(--card)', color: 'var(--ink-soft)', borderColor: 'var(--paper-line)' }
            }
          >
            <Sliders size={15} />
            Filters
            {activeFilters > 0 && (
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: '#fff', color: 'var(--forest)' }}
              >
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
            className="px-3 py-2.5 bg-[var(--card)] border border-[var(--paper-line)] rounded-xl text-sm font-medium text-[var(--ink-soft)] focus:outline-none focus:border-[var(--forest-mid)] cursor-pointer"
          >
            <option value="created_at:desc">Newest first</option>
            <option value="created_at:asc">Oldest first</option>
            <option value="disbursedamount:desc">Amount ↓</option>
            <option value="disbursedamount:asc">Amount ↑</option>
            <option value="loanterm:desc">Term ↓</option>
          </select>

          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card)] border border-[var(--paper-line)] rounded-xl text-sm font-medium text-[var(--ink-soft)] hover:border-[var(--forest-mid)] hover:text-[var(--forest)] transition-all"
          >
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-[var(--paper)] rounded-xl border border-[var(--paper-line)]">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase text-[var(--ink-faint)] tracking-widest">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[var(--card)] border border-[var(--paper-line)] rounded-lg text-sm text-[var(--ink-soft)] focus:outline-none focus:border-[var(--forest-mid)]"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
              <option value="pending_approval">Pending approval</option>
              <option value="completed">Completed</option>
              <option value="defaulted">Defaulted</option>
              <option value="under_review">Under review</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase text-[var(--ink-faint)] tracking-widest">Type</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-[var(--card)] border border-[var(--paper-line)] rounded-lg text-sm text-[var(--ink-soft)] focus:outline-none focus:border-[var(--forest-mid)]"
            >
              <option value="all">All types</option>
              <option value="group">Group</option>
              <option value="individual">Individual</option>
            </select>
          </div>
          {activeFilters > 0 && (
            <button
              onClick={() => { setStatusFilter('all'); setTypeFilter('all'); }}
              className="self-end flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors font-medium"
              style={{ color: 'var(--clay)' }}
            >
              <X size={13} /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* Result count */}
      <p className="text-xs text-[var(--ink-faint)] font-medium">
        Showing <span className="cd-mono text-[var(--ink)] font-semibold">{resultCount}</span> results
        {search && <> for "<span className="font-semibold" style={{ color: 'var(--forest)' }}>{search}</span>"</>}
      </p>
    </div>
  );
};

/* ─────────────── STAT ROW ─────────────── */
const StatRow = ({ label, value, pct }: { label: string; value: string; pct?: number }) => (
  <div className="flex items-center gap-3">
    <div className="flex-1">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[var(--ink-soft)] font-medium">{label}</span>
        <span className="cd-mono text-[var(--ink)] font-semibold">{value}</span>
      </div>
      {pct !== undefined && (
        <div className="h-1.5 bg-[var(--paper)] rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: 'var(--forest)' }} />
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
  console.log(companyLoans);
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
    let list = [...(allCompanyLoans ?? [])];
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
      <div className="space-y-6 sm:space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MetricCard
            label="Total disbursed"
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
            label="Overdue amount"
            value={fmt(metrics.overdueAmt)}
            sub={`PAR: ${metrics.parRate.toFixed(1)}%`}
            icon={<AlertTriangle size={20} />}
            color="red"
          />
          <MetricCard
            label="Interest earned"
            value={fmt(metrics.totalInterest)}
            sub="From active portfolio"
            icon={<TrendingUp size={20} />}
            color="purple"
          />
        </div>

        {/* Second row: counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Active loans',     count: metrics.activeCount,    icon: <CheckCircle size={18} />, accent: 'forest' },
            { label: 'Pending approval', count: metrics.pendingCount,   icon: <Clock size={18} />,       accent: 'brass' },
            { label: 'Overdue',          count: metrics.overdueCount,   icon: <XCircle size={18} />,     accent: 'clay' },
            { label: 'Completed',        count: metrics.completedCount, icon: <FileText size={18} />,    accent: 'forest-mid' },
          ].map(({ label, count, icon, accent }) => {
            const styles: Record<string, { bg: string; color: string }> = {
              forest:      { bg: 'rgba(47,74,50,0.1)',  color: 'var(--forest)' },
              brass:       { bg: 'var(--brass-soft)',   color: '#8a6224' },
              clay:        { bg: 'var(--clay-soft)',    color: 'var(--clay)' },
              'forest-mid': { bg: 'rgba(62,97,66,0.12)', color: 'var(--forest-mid)' },
            };
            const s = styles[accent];
            return (
              <div key={label} className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl p-4 sm:p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={s}>{icon}</div>
                <div>
                  <div className="cd-display text-2xl font-semibold text-[var(--ink)]">{count}</div>
                  <div className="text-xs text-[var(--ink-faint)] font-medium">{label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Portfolio Health + Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Portfolio Health */}
          <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="cd-display font-semibold text-[var(--ink)]">Portfolio health</h3>
              <Activity size={18} style={{ color: 'var(--forest)' }} />
            </div>
            <div className="space-y-4">
              <StatRow label="Repayment rate" value={`${metrics.repaymentRate.toFixed(1)}%`} pct={metrics.repaymentRate} />
              <StatRow label="Portfolio at risk (PAR)" value={`${metrics.parRate.toFixed(1)}%`} pct={metrics.parRate} />
              <StatRow
                label="Total repaid"
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
          <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="cd-display font-semibold text-[var(--ink)]">Loan breakdown</h3>
              <PieChart size={18} style={{ color: 'var(--forest)' }} />
            </div>
            {[
              { label: 'Group loans',      count: companyLoans.filter(l => l.loantype === 'group').length },
              { label: 'Individual loans', count: companyLoans.filter(l => l.loantype !== 'group' && l.loantype !== 'p2p').length },
              { label: 'P2P lending',      count: companyLoans.filter(l => l.loantype === 'p2p').length },
              { label: 'Active',           count: metrics.activeCount },
              { label: 'Pending',          count: metrics.pendingCount },
            ].map(({ label, count }) => {
              const pct = metrics.totalLoans > 0 ? (count / metrics.totalLoans) * 100 : 0;
              return (
                <div key={label} className="flex items-center gap-3 mb-3">
                  <div className="text-xs text-[var(--ink-faint)] w-28 shrink-0">{label}</div>
                  <div className="flex-1 h-2 bg-[var(--paper)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--forest)' }} />
                  </div>
                  <div className="cd-mono text-xs font-semibold text-[var(--ink-soft)] w-6 text-right">{count}</div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl p-6">
            <h3 className="cd-display font-semibold text-[var(--ink)] mb-5">Quick actions</h3>
            <div className="space-y-3">
              {[
                { label: 'New loan application', icon: <Plus size={16} />,    action: () => setShowNewLoanModal(true), primary: true },
                { label: 'Record payment',       icon: <Receipt size={16} />,  action: () => openRepayment(''),         primary: false },
                { label: 'View applications',    icon: <FileText size={16} />, action: () => setActiveTab('applications'), primary: false },
                { label: 'Export portfolio',     icon: <Download size={16} />, action: handleExport,                    primary: false },
              ].map(({ label, icon, action, primary }) => (
                <button
                  key={label}
                  onClick={action}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={
                    primary
                      ? { background: 'var(--forest)', color: '#fff' }
                      : { background: 'var(--card)', border: '1px solid var(--paper-line)', color: 'var(--ink-soft)' }
                  }
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="cd-display font-semibold text-[var(--ink)]">Recent loan activity</h3>
            <button
              onClick={() => setActiveTab('loans')}
              className="text-xs font-semibold flex items-center gap-1 hover:underline"
              style={{ color: 'var(--forest)' }}
            >
              View all <ChevronRight size={13} />
            </button>
          </div>
          {companyLoans.length === 0 ? (
            <div className="text-center py-8 text-[var(--ink-faint)] text-sm">No recent activity</div>
          ) : (
            <div className="divide-y divide-dashed divide-[var(--paper-line)]">
              {[...companyLoans]
                .sort((a, b) => (b.created_at ?? '') > (a.created_at ?? '') ? 1 : -1)
                .slice(0, 6)
                .map((loan) => {
                  const name = loan.group_name ?? loan.recipient_name ?? loan.customer_name ?? '—';
                  const amt  = loan.disbursedamount ?? loan.disbursedAmount ?? 0;
                  const iconStyles: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
                    active:           { icon: <CheckCircle size={15} />,   bg: 'rgba(47,74,50,0.1)', color: 'var(--forest)' },
                    overdue:          { icon: <AlertTriangle size={15} />, bg: 'var(--clay-soft)',   color: 'var(--clay)' },
                    pending_approval: { icon: <Clock size={15} />,         bg: 'var(--brass-soft)',  color: '#8a6224' },
                    completed:        { icon: <CheckSquare size={15} />,   bg: 'rgba(62,97,66,0.12)', color: 'var(--forest-mid)' },
                  };
                  const ic = iconStyles[loan.status] ?? { icon: <CreditCard size={15} />, bg: 'var(--paper)', color: 'var(--ink-faint)' };
                  return (
                    <div key={loan.id} className="flex items-center gap-4 py-3.5 hover:bg-[var(--paper)] rounded-lg px-2 -mx-2 transition-colors">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: ic.bg, color: ic.color }}>{ic.icon}</div>
                      <Avatar name={name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--ink)] truncate">{name}</p>
                        <p className="cd-mono text-xs text-[var(--ink-faint)]">#{loan.id?.slice(0, 8)}</p>
                      </div>
                      <StatusBadge status={loan.status} />
                      <div className="cd-mono text-sm font-semibold text-[var(--ink)] shrink-0">{fmtFull(amt)}</div>
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
  <div className="space-y-5">
    {/* Header Section */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
      <div>
        <h1 className="cd-display text-2xl font-semibold text-[var(--ink)] tracking-tight">Loans</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">Manage loan disbursements and repayments</p>
      </div>
      <button
        onClick={() => setShowNewLoanModal(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-xl hover:bg-[var(--forest-deep)] transition-colors"
        style={{ background: 'var(--forest)' }}
      >
        <Plus size={18} /> New loan
      </button>
    </div>

    {/* Search & Filters */}
    <SearchFilterBar
      search={loanSearch} setSearch={setLoanSearch}
      statusFilter={loanStatus} setStatusFilter={setLoanStatus}
      typeFilter={loanType} setTypeFilter={setLoanType}
      sortField={loanSort} setSortField={setLoanSort}
      sortDir={loanDir} setSortDir={setLoanDir}
      onExport={handleExport}
      resultCount={filteredLoans.length}
    />

    {/* Loading State */}
    {loading && (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-[var(--card)] border border-[var(--paper-line)] rounded-xl p-5 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="h-5 bg-[var(--paper)] rounded w-32" />
              <div className="h-6 bg-[var(--paper)] rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Empty State */}
    {!loading && filteredLoans.length === 0 && (
      <div className="text-center py-16 bg-[var(--card)] rounded-xl border border-[var(--paper-line)]">
        <CreditCard size={48} className="text-[var(--ink-faint)] mx-auto mb-3" />
        <p className="text-[var(--ink-soft)] font-medium">No loans found</p>
        <p className="text-[var(--ink-faint)] text-sm mt-1">Adjust filters or create a new loan</p>
        {(loanSearch || loanStatus !== 'all' || loanType !== 'all') && (
          <button
            onClick={() => { setLoanSearch(''); setLoanStatus('all'); setLoanType('all'); }}
            className="mt-4 text-sm font-medium hover:underline"
            style={{ color: 'var(--forest)' }}
          >
            Clear all filters
          </button>
        )}
      </div>
    )}

    {/* Loan List */}
    {!loading && filteredLoans.length > 0 && (
      <div className="bg-[var(--card)] rounded-xl border border-[var(--paper-line)] overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-[var(--paper)] border-b border-[var(--paper-line)] text-xs font-medium text-[var(--ink-faint)] uppercase tracking-wider">
          <div className="col-span-3">Borrower</div>
          <div className="col-span-2">Loan details</div>
          <div className="col-span-2">Disbursed</div>
          <div className="col-span-2">Repayment</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[var(--paper-line)]">
          {filteredLoans.map((loan) => {
            const paid = loan.amountpaid ?? 0;
            const total = loan.totalpayable ?? 1;
            const progress = Math.min((paid / total) * 100, 100);
            const isGroup = loan.loantype === 'group';
            const name = loan.group_name ?? loan.customer_name ?? loan.recipient_name ?? '—';

            return (
              <div
                key={loan.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-4 sm:px-5 py-4 hover:bg-[var(--paper)] transition-colors"
              >
                {/* Borrower Info */}
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={name} size="sm" />
                    <div>
                      <p className="font-medium text-[var(--ink)] text-sm">{name}</p>
                      <p className="cd-mono text-xs text-[var(--ink-faint)]">#{loan.id?.slice(-6)}</p>
                    </div>
                  </div>
                </div>

                {/* Loan Details */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded capitalize"
                      style={
                        isGroup
                          ? { background: 'rgba(47,74,50,0.1)', color: 'var(--forest)' }
                          : { background: 'rgba(62,97,66,0.12)', color: 'var(--forest-mid)' }
                      }
                    >
                      {loan.loantype}
                    </span>
                    <span className="text-xs text-[var(--ink-faint)]">{loan.loanterm}m</span>
                  </div>
                  <p className="text-xs text-[var(--ink-faint)] mt-1">{loan.interestrateloan}% interest</p>
                </div>

                {/* Disbursed Amount */}
                <div className="col-span-2">
                  <p className="cd-mono font-semibold text-[var(--ink)] text-base">{fmtFull(loan.disbursedamount ?? 0)}</p>
                  {loan.duedate && (
                    <p className="text-xs text-[var(--ink-faint)] mt-0.5">
                      Due {new Date(loan.duedate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Repayment Progress */}
                <div className="col-span-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="cd-mono text-[var(--ink-soft)]">{fmtFull(paid)}</span>
                    <span className="cd-mono text-[var(--ink-faint)]">of {fmtFull(total)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--paper)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'var(--forest)' }} />
                  </div>
                  <p className="text-xs text-[var(--ink-faint)] mt-1">{progress.toFixed(0)}% repaid</p>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <StatusBadge status={loan.status} />
                  {loan.duedate && <DaysRemaining dueDate={loan.duedate} />}
                </div>

                {/* Action Button */}
                <div className="col-span-1 md:text-right">
                  <button
                    onClick={() => setSelectedLoan(loan)}
                    className="text-[var(--ink-faint)] hover:text-[var(--forest)] transition-colors"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>
);

// Helper Component for Days Remaining
const DaysRemaining = ({ dueDate }) => {
  const daysLeft = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);

  if (daysLeft < 0) {
    return <p className="text-xs mt-1" style={{ color: 'var(--clay)' }}>Overdue</p>;
  }
  if (daysLeft <= 3) {
    return <p className="text-xs mt-1" style={{ color: 'var(--brass)' }}>{daysLeft} days left</p>;
  }
  return <p className="text-xs text-[var(--ink-faint)] mt-1">{daysLeft} days left</p>;
};

  /* ════════════ APPLICATIONS TAB ════════════ */
  const ApplicationsTab = () => {
  const apps = useLoanApplications();

  const {
    approveLoan: approve,
    rejectLoan: reject,
    loading: appLoading,
  } = useLoans();

  const [appSearch, setAppSearch] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = appSearch.toLowerCase();

    return apps.filter((a) => {
      const loanType = (a.loantype || '').toLowerCase();

      return (
        !q ||
        a.group_name?.toLowerCase().includes(q) ||
        a.customer_name?.toLowerCase().includes(q) ||
        a.recipient_name?.toLowerCase().includes(q) ||
        a.id?.toLowerCase().includes(q) ||
        a.purpose?.toLowerCase().includes(q) ||
        loanType.includes(q)
      );
    });
  }, [apps, appSearch]);

  const getLoanType = (loan: any) => {
    const type = (loan?.loantype || '').toLowerCase();

    if (type === 'group') return 'group';
    if (type === 'p2p') return 'p2p';

    return 'individual';
  };

  const typeConfig = {
    group: {
      label: 'Group loan',
      bg: 'rgba(47,74,50,0.1)',
      color: 'var(--forest)',
      icon: <Users size={13} />,
      button: 'View group breakdown',
    },
    individual: {
      label: 'Individual loan',
      bg: 'rgba(62,97,66,0.12)',
      color: 'var(--forest-mid)',
      icon: <User size={13} />,
      button: 'View loan details',
    },
    p2p: {
      label: 'P2P loan',
      bg: 'var(--brass-soft)',
      color: '#8a6224',
      icon: <Send size={13} />,
      button: 'View P2P details',
    },
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="cd-display text-xl font-semibold text-[var(--ink)]">Loan applications</h2>
            <p className="text-sm text-[var(--ink-soft)] mt-1">
              {apps.length} pending application{apps.length !== 1 ? 's' : ''} awaiting review
            </p>
          </div>

          {apps.length > 0 && (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl border"
              style={{ background: 'var(--brass-soft)', borderColor: 'var(--brass)' }}
            >
              <Bell size={15} style={{ color: '#8a6224' }} />
              <span className="text-sm font-semibold" style={{ color: '#8a6224' }}>
                {apps.length} requiring action
              </span>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
          <input
            value={appSearch}
            onChange={(e) => setAppSearch(e.target.value)}
            placeholder="Search applications..."
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--card)] border border-[var(--paper-line)] rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--forest-mid)] focus:border-[var(--forest-mid)]"
          />
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-[var(--paper)] rounded-2xl border-2 border-dashed border-[var(--paper-line)]">
            <FileText size={42} className="text-[var(--ink-faint)] mb-3" />
            <p className="text-[var(--ink-soft)] font-semibold">No applications found</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {filtered.map((app) => {
              const loanType = getLoanType(app);
              const config = typeConfig[loanType];

              const displayName =
                loanType === 'group'
                  ? app.group_name
                  : loanType === 'p2p'
                  ? app.recipient_name || app.customer_name
                  : app.customer_name;

              return (
                <div
                  key={app.id}
                  className="bg-[var(--card)] border border-[var(--paper-line)] rounded-3xl overflow-hidden hover:shadow-[0_10px_24px_-16px_rgba(20,32,20,0.4)] transition-all"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                      {/* LEFT */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <Avatar name={displayName} size="lg" />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="cd-display text-lg font-semibold text-[var(--ink)] truncate">
                              {displayName}
                            </h3>
                            <StatusBadge status={app.status} />
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                              style={{ background: config.bg, color: config.color }}
                            >
                              {config.icon}
                              {config.label}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[var(--ink-faint)]">
                            <span className="cd-mono">#{app.id?.slice(0, 8)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {app.created_at
                                ? new Date(app.created_at).toLocaleDateString('en-GH', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </span>
                            {(app.customer_phone || app.recipient_phone) && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Phone size={11} />
                                  {app.customer_phone || app.recipient_phone}
                                </span>
                              </>
                            )}
                          </div>

                          {app.purpose && (
                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--paper)] rounded-xl text-xs text-[var(--ink-soft)]">
                              <Briefcase size={13} />
                              <span className="italic">{app.purpose}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ACTIONS */}
                      {userPermissions.APPROVE_LOANS && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto shrink-0">
                          <button
                            onClick={async () => {
                              setActionId(app.id);
                              await reject({ loanId: app.id });
                              setActionId(null);
                            }}
                            disabled={appLoading && actionId === app.id}
                            className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                            style={{ color: 'var(--clay)', background: 'var(--clay-soft)' }}
                          >
                            Reject
                          </button>

                          <button
                            onClick={async () => {
                              setActionId(app.id);
                              await approve({ loanId: app.id });
                              setActionId(null);
                            }}
                            disabled={appLoading && actionId === app.id}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50"
                            style={{ background: 'var(--forest)' }}
                          >
                            {appLoading && actionId === app.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle size={14} />
                            )}
                            Approve
                          </button>
                        </div>
                      )}
                    </div>

                    {/* STATS */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
                      <div className="bg-[var(--paper)] rounded-2xl p-4">
                        <div className="flex items-center gap-1 text-[var(--ink-faint)] mb-1">
                          <Banknote size={13} />
                          <span className="text-[10px] font-semibold uppercase tracking-wider">Loan amount</span>
                        </div>
                        <p className="cd-mono text-sm font-semibold text-[var(--ink)]">{fmtFull(app.loanamount ?? 0)}</p>
                      </div>

                      <div className="bg-[var(--paper)] rounded-2xl p-4">
                        <div className="flex items-center gap-1 text-[var(--ink-faint)] mb-1">
                          <Clock size={13} />
                          <span className="text-[10px] font-semibold uppercase tracking-wider">Duration</span>
                        </div>
                        <p className="cd-mono text-sm font-semibold text-[var(--ink)]">{app.loanterm} months</p>
                      </div>

                      <div className="bg-[var(--paper)] rounded-2xl p-4">
                        <div className="flex items-center gap-1 text-[var(--ink-faint)] mb-1">
                          <Percent size={13} />
                          <span className="text-[10px] font-semibold uppercase tracking-wider">Interest</span>
                        </div>
                        <p className="cd-mono text-sm font-semibold text-[var(--ink)]">{app.interestrateloan}%</p>
                      </div>

                      <div className="bg-[var(--paper)] rounded-2xl p-4">
                        <div className="flex items-center gap-1 text-[var(--ink-faint)] mb-1">
                          {loanType === 'group' ? <Users size={13} /> : loanType === 'p2p' ? <Send size={13} /> : <User size={13} />}
                          <span className="text-[10px] font-semibold uppercase tracking-wider">
                            {loanType === 'group' ? 'Members' : loanType === 'p2p' ? 'Type' : 'Borrower'}
                          </span>
                        </div>
                        <p className="cd-mono text-sm font-semibold text-[var(--ink)]">
                          {loanType === 'group'
                            ? `${app.member_count ?? 1} people`
                            : loanType === 'p2p'
                            ? 'Peer lending'
                            : 'Single user'}
                        </p>
                      </div>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-5 flex items-center justify-end">
                      <button
                        onClick={() => setSelectedLoan(app)}
                        className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"
                        style={{ color: 'var(--forest)' }}
                      >
                        {config.button}
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic modal */}
      {selectedLoan && (
        <LoanApprovalModal
          loan={selectedLoan}
          isOpen={!!selectedLoan}
          onClose={() => setSelectedLoan(null)}
          approveLoan={approve}
          rejectLoan={reject}
          getGroupLoanWithMembers={getGroupLoanWithMembers}
          loading={appLoading}
        />
      )}
    </>
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
    const fieldClass =
      'w-full border border-[var(--paper-line)] rounded-xl px-3 py-2.5 text-sm bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:border-[var(--forest-mid)] focus:ring-2 focus:ring-[var(--forest-mid)]';

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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="cd-root bg-[var(--card)] rounded-2xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(47,74,50,0.1)' }}>
                  <Receipt size={18} style={{ color: 'var(--forest)' }} />
                </div>
                <h2 className="cd-display text-lg font-semibold text-[var(--ink)]">Record payment</h2>
              </div>
              <button onClick={() => setShowRepaymentModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--paper)] text-[var(--ink-faint)] transition-colors">
                <X size={16} />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <CheckCircle size={48} style={{ color: 'var(--forest)' }} />
                <p className="font-semibold text-[var(--ink)]">Payment recorded successfully!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-faint)] uppercase tracking-wider mb-1.5">Select loan</label>
                  <select value={form.loanId} onChange={e => setForm(f => ({ ...f, loanId: e.target.value }))} className={fieldClass}>
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
                    <label className="block text-xs font-semibold text-[var(--ink-faint)] uppercase tracking-wider mb-1.5">Amount (₵)</label>
                    <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={`${fieldClass} cd-mono`} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink-faint)] uppercase tracking-wider mb-1.5">Method</label>
                    <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} className={fieldClass}>
                      {['Cash', 'Mobile Money', 'Bank Transfer', 'Cheque'].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink-faint)] uppercase tracking-wider mb-1.5">Payment date</label>
                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={fieldClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink-faint)] uppercase tracking-wider mb-1.5">Reference #</label>
                    <input type="text" value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} className={fieldClass} placeholder="Optional" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-faint)] uppercase tracking-wider mb-1.5">Notes</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={`${fieldClass} resize-none`} placeholder="Optional notes…" />
                </div>
              </div>
            )}

            {!success && (
              <div className="flex gap-3 mt-6 pt-4 border-t border-[var(--paper-line)]">
                <button
                  onClick={() => setShowRepaymentModal(false)}
                  className="flex-1 border border-[var(--paper-line)] text-[var(--ink-soft)] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--paper)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !form.loanId || !form.amount}
                  className="flex-1 flex items-center justify-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                  style={{ background: 'var(--forest)' }}
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                  Record payment
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

    const fieldClass =
      'w-full border border-[var(--paper-line)] rounded-xl px-3 py-2.5 text-sm bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:border-[var(--forest-mid)] focus:ring-2 focus:ring-[var(--forest-mid)]';

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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="cd-root bg-[var(--card)] rounded-2xl max-w-lg w-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(47,74,50,0.1)' }}>
                  <CheckCircle size={18} style={{ color: 'var(--forest)' }} />
                </div>
                <div>
                  <h2 className="cd-display text-lg font-semibold text-[var(--ink)]">Approve loan</h2>
                  {selectedLoan && <p className="cd-mono text-xs text-[var(--ink-faint)]">#{selectedLoan.id?.slice(0, 8)}</p>}
                </div>
              </div>
              <button
                onClick={() => { setShowApprovalModal(false); setSelectedLoan(undefined); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--paper)] text-[var(--ink-faint)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Monthly payment preview */}
            {form.disbursedamount > 0 && (
              <div
                className="rounded-xl p-4 mb-5 flex items-center justify-between border"
                style={{ background: 'rgba(47,74,50,0.06)', borderColor: 'rgba(47,74,50,0.2)' }}
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--forest)' }}>
                    Estimated monthly payment
                  </p>
                  <p className="cd-display text-2xl font-semibold" style={{ color: 'var(--forest)' }}>
                    ₵{Number(monthly).toLocaleString()}
                  </p>
                </div>
                <Calculator size={28} style={{ color: 'var(--forest)', opacity: 0.4 }} />
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-faint)] uppercase tracking-wider mb-1.5">Approved amount (₵)</label>
                  <input type="number" name="disbursedamount" value={form.disbursedamount} onChange={handleChange} className={`${fieldClass} cd-mono`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-faint)] uppercase tracking-wider mb-1.5">Interest rate (%)</label>
                  <input type="number" step="0.1" name="interestRate" value={form.interestRate} onChange={handleChange} className={`${fieldClass} cd-mono`} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-faint)] uppercase tracking-wider mb-1.5">Tenure (months)</label>
                  <select name="loanterm" value={form.loanterm} onChange={handleChange} className={fieldClass}>
                    {[3, 6, 12, 18, 24, 36, 60].map(m => <option key={m} value={m}>{m} months</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-faint)] uppercase tracking-wider mb-1.5">Disbursement date</label>
                  <input type="date" name="disbursementdate" value={form.disbursementdate} onChange={handleChange} className={fieldClass} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink-faint)] uppercase tracking-wider mb-1.5">Conditions / notes</label>
                <textarea name="notes" rows={3} value={form.notes} onChange={handleChange} className={`${fieldClass} resize-none`} placeholder="Add any approval conditions or notes…" />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-[var(--paper-line)]">
              <button
                onClick={() => { setShowApprovalModal(false); setSelectedLoan(undefined); }}
                className="flex-1 border border-[var(--paper-line)] text-[var(--ink-soft)] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--paper)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ background: 'var(--forest)' }}
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                Approve loan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ────────── Tab config ────────── */
  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: 'overview',     label: 'Overview' },
    { id: 'loans',        label: 'All loans',    badge: allCompanyLoans?.length || 0 },
    { id: 'applications', label: 'Applications', badge: applications?.length || 0 },
  ];

  /* ════════════ RENDER ════════════ */
  return (
    <div className="cd-root min-h-screen">
      <div className="mx-auto sm:px-6 py-6 sm:py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8 px-4 sm:px-0">
          <div>
            <h1 className="cd-display text-2xl font-semibold text-[var(--ink)] tracking-tight">Loan management</h1>
            <p className="text-sm text-[var(--ink-soft)] mt-0.5">Comprehensive loan portfolio management</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => fetchLoanAccounts(companyId)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--card)] border border-[var(--paper-line)] rounded-xl text-sm font-medium text-[var(--ink-soft)] hover:border-[var(--forest-mid)] hover:text-[var(--forest)] transition-all"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={() => setShowNewLoanModal(true)}
              className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--forest-deep)] transition-all"
              style={{ background: 'var(--forest)' }}
            >
              <Plus size={16} /> New loan
            </button>
          </div>
        </div>

        {/* Tabs — snap-scroll on mobile */}
        <div className="cd-scroller flex gap-1 bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl p-1 mb-6 sm:mb-8 mx-4 sm:mx-0 overflow-x-auto w-fit max-w-[calc(100%-2rem)] sm:max-w-fit">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
                style={
                  isActive
                    ? { background: 'var(--forest)', color: '#fff' }
                    : { color: 'var(--ink-soft)' }
                }
              >
                {tab.label}
                {tab.badge != null && tab.badge > 0 && (
                  <span
                    className="min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={isActive ? { background: 'rgba(255,255,255,0.2)', color: '#fff' } : { background: 'var(--paper)', color: 'var(--ink-soft)' }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="px-4 sm:px-0">
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