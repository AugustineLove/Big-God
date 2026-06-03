import React, { useEffect, useState, useCallback } from 'react';
import {
  Clock, CheckCircle, XCircle, AlertTriangle, ChevronDown,
  ChevronUp, Filter, RefreshCw, Calendar, ArrowUpRight,
  ArrowDownLeft, Loader2, Info, CheckSquare, Square,
  TrendingUp, TrendingDown, ReceiptText, ShieldAlert,
} from 'lucide-react';
import { companyId, userUUID } from '../../constants/appConstants';
const BASE_URL = 'https://susu-pro-backend.onrender.com/transactions';

// ─── tiny helpers ──────────────────────────────────────────────────────────────
const fmt  = (n) => Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtD = (d) => d ? new Date(d).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDT = (d) => d ? new Date(d).toLocaleString('en-GH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const plural = (n, word) => `${n} ${word}${n !== 1 ? 's' : ''}`;

// ─── toast ─────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);
  return { toasts, push };
}

const ToastContainer = ({ toasts }) => (
  <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => {
      const styles = {
        success: 'bg-emerald-700 border-emerald-600',
        error:   'bg-red-700 border-red-600',
        warning: 'bg-amber-600 border-amber-500',
        info:    'bg-[#1a2e1a] border-[#2d442d]',
      };
      const icons = {
        success: <CheckCircle size={15} />,
        error:   <XCircle size={15} />,
        warning: <AlertTriangle size={15} />,
        info:    <Info size={15} />,
      };
      return (
        <div key={t.id}
          className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl border text-white text-sm font-medium shadow-xl max-w-sm animate-fade-in ${styles[t.type] || styles.info}`}>
          <span className="mt-0.5 flex-shrink-0 opacity-80">{icons[t.type]}</span>
          <span className="leading-snug">{t.message}</span>
        </div>
      );
    })}
  </div>
);

// ─── confirm modal ─────────────────────────────────────────────────────────────
const ConfirmModal = ({ open, title, message, confirmLabel, confirmStyle, onConfirm, onCancel, loading, extra }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
          {extra}
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition flex items-center justify-center gap-2 disabled:opacity-60 ${confirmStyle}`}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── reject reason modal ───────────────────────────────────────────────────────
const RejectModal = ({ open, onConfirm, onCancel, loading }) => {
  const [reason, setReason] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Reject Transaction</h3>
        </div>
        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-gray-600">Provide a reason for rejection (optional but recommended).</p>
          <textarea
            rows={3}
            placeholder="e.g. Amount does not match supporting document…"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={() => onConfirm(reason)} disabled={loading}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-red-600 text-white hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Confirm Rejection
          </button>
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── row expandable card ───────────────────────────────────────────────────────
const TransactionRow = ({ tx, selected, onToggleSelect, onApprove, onReject, approving, rejecting }) => {
  const [expanded, setExpanded] = useState(false);

  const isDeposit    = tx.type === 'deposit';
  const daysOffset   = tx.date_offset_days;
  const isFuture     = daysOffset > 0;
  const absDays      = Math.abs(daysOffset);

  const initials = (tx.customer_name || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const offsetLabel = isFuture
    ? `Future-dated ${plural(absDays, 'day')} ahead`
    : `Backdated ${plural(absDays, 'day')} ago`;

  const offsetColour = isFuture
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : absDays > 7
      ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-200 ${selected ? 'border-[#2d442d] shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'} bg-white`}>
      {/* ── main row ── */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* checkbox */}
        <button onClick={() => onToggleSelect(tx.transaction_id)} className="flex-shrink-0 text-gray-400 hover:text-[#1a2e1a] transition-colors">
          {selected
            ? <CheckSquare size={18} className="text-[#1a2e1a]" />
            : <Square size={18} />}
        </button>

        {/* avatar */}
        <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
          {initials}
        </div>

        {/* customer + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13px] font-semibold text-gray-900 leading-snug truncate">{tx.customer_name}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${offsetColour}`}>
              {offsetLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Calendar size={10} />
              Tx date: {fmtD(tx.transaction_date)}
            </span>
            <span className="text-gray-200 text-[10px]">·</span>
            <span className="text-[11px] text-gray-400">Submitted: {fmtDT(tx.created_at)}</span>
            {tx.teller_name && (
              <>
                <span className="text-gray-200 text-[10px]">·</span>
                <span className="text-[11px] text-gray-400">By {tx.teller_name}</span>
              </>
            )}
          </div>
        </div>

        {/* amount + type */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            {isDeposit
              ? <ArrowDownLeft size={14} className="text-emerald-600" />
              : <ArrowUpRight  size={14} className="text-red-500" />}
            <span className={`text-[15px] font-bold tabular-nums ${isDeposit ? 'text-emerald-700' : 'text-red-600'}`}>
              ¢{fmt(tx.amount)}
            </span>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isDeposit ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {tx.type}
          </span>
        </div>

        {/* action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <button onClick={() => onApprove(tx)} disabled={approving || rejecting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a2e1a] text-white rounded-xl text-[11px] font-semibold hover:bg-[#2d442d] transition disabled:opacity-50">
            {approving ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
            Approve
          </button>
          <button onClick={() => onReject(tx)} disabled={approving || rejecting}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-xl text-[11px] font-semibold hover:bg-red-50 transition disabled:opacity-50">
            {rejecting ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
            Reject
          </button>
          <button onClick={() => setExpanded(v => !v)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* ── expanded detail ── */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-50 bg-gray-50/40 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { label: 'Account Type',     value: tx.account_type },
            { label: 'Current Balance',  value: `¢${fmt(tx.current_balance)}` },
            { label: 'Payment Method',   value: tx.payment_method || '—' },
            { label: 'Withdrawal Type',  value: tx.withdrawal_type || '—' },
            { label: 'Account No.',      value: tx.customer_account_number || '—' },
            { label: 'Customer Phone',   value: tx.customer_phone || '—' },
            { label: 'Description',      value: tx.description || '—' },
            { label: 'Unique Code',      value: tx.unique_code || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-gray-400 font-medium uppercase tracking-wide text-[9px] mb-0.5">{label}</p>
              <p className="font-semibold text-gray-700 truncate">{value}</p>
            </div>
          ))}
          {tx.type === 'withdrawal' && (
            <div className="col-span-2 md:col-span-4 mt-1 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <ShieldAlert size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 text-[11px] leading-snug">
                Balance will drop from <strong>¢{fmt(tx.current_balance)}</strong> to{' '}
                <strong>¢{fmt(tx.current_balance - tx.amount)}</strong> after approval.
                {tx.minimum_balance > 0 && ` Minimum balance is ¢${fmt(tx.minimum_balance)}.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── main component ────────────────────────────────────────────────────────────
const PendingBackdatedTransactions = () => {
  const toast = useToast();

  // data state
  const [transactions, setTransactions] = useState([]);
  const [summary,      setSummary]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [meta,         setMeta]         = useState({ total: 0, pages: 1 });

  // filters
  const [filters, setFilters] = useState({ type: '', from: '', to: '', staff_id: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const LIMIT = 20;

  // selection
  const [selected, setSelected] = useState(new Set());

  // action states
  const [approvingId,  setApprovingId]  = useState(null);
  const [rejectingId,  setRejectingId]  = useState(null);

  // confirm modals
  const [confirmApprove, setConfirmApprove] = useState(null);  // single tx
  const [confirmBulk,    setConfirmBulk]    = useState(false); // bulk
  const [rejectTarget,   setRejectTarget]   = useState(null);  // single tx for reject

  // ── fetch ────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit:  LIMIT,
        offset: page * LIMIT,
        ...(filters.type     && { type:     filters.type }),
        ...(filters.from     && { from:     filters.from }),
        ...(filters.to       && { to:       filters.to }),
        ...(filters.staff_id && { staff_id: filters.staff_id }),
      });

      const [listRes, sumRes] = await Promise.all([
        fetch(`${BASE_URL}/${companyId}/pending-backdated?${params}`),
        fetch(`${BASE_URL}/${companyId}/pending-backdated/summary`),
      ]);

      const [listData, sumData] = await Promise.all([listRes.json(), sumRes.json()]);

      if (listData.status === 'success') {
        setTransactions(listData.data);
        setMeta(listData.meta);
      } else {
        toast.push(listData.message || 'Failed to load transactions', 'error');
      }

      if (sumData.status === 'success') setSummary(sumData.data);

    } catch {
      toast.push('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── selection helpers ────────────────────────────────────────
  const allSelected    = transactions.length > 0 && transactions.every(t => selected.has(t.transaction_id));
  const someSelected   = transactions.some(t => selected.has(t.transaction_id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(transactions.map(t => t.transaction_id)));
    }
  };
  const toggleOne = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── single approve ───────────────────────────────────────────
  const handleApprove = async () => {
    const tx = confirmApprove;
    setConfirmApprove(null);
    setApprovingId(tx.transaction_id);
    const transactionId = tx.transaction_id;
    try {
      const res  = await fetch(
        `${BASE_URL}/${companyId}/pending-backdated/${transactionId}/approve`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ approved_by: userUUID }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Approval failed');
      toast.push(`✓ ${tx.type} of ¢${fmt(tx.amount)} for ${tx.customer_name} approved`, 'success');
      setSelected(prev => { const n = new Set(prev); n.delete(tx.transaction_id); return n; });
      fetchData();
    } catch (e) {
      toast.push(e.message, 'error');
    } finally {
      setApprovingId(null);
    }
  };

  // ── single reject ────────────────────────────────────────────
  const handleReject = async (reason) => {
    const tx = rejectTarget;
    setRejectTarget(null);
    setRejectingId(tx.transaction_id);
    try {
      const res  = await fetch(
        `${BASE_URL}/${companyId}/pending-backdated/${tx.transaction_id}/reject`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ rejected_by: userUUID, reason }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Rejection failed');
      toast.push(`Transaction for ${tx.customer_name} rejected`, 'warning');
      setSelected(prev => { const n = new Set(prev); n.delete(tx.transaction_id); return n; });
      fetchData();
    } catch (e) {
      toast.push(e.message, 'error');
    } finally {
      setRejectingId(null);
    }
  };

  // ── bulk approve ─────────────────────────────────────────────
  const [bulkLoading, setBulkLoading] = useState(false);
  const handleBulkApprove = async () => {
    setConfirmBulk(false);
    setBulkLoading(true);
    const ids = [...selected];
    try {
      const res  = await fetch(
        `${BASE_URL}/${companyId}/pending-backdated/bulk-approve`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ transaction_ids: ids, approved_by: userUUID }),
        }
      );
      const data = await res.json();
      if (data.status === 'error') throw new Error(data.message);

      const { approved, failed } = data.results;
      if (approved.length > 0) toast.push(`✓ ${plural(approved.length, 'transaction')} approved`, 'success');
      if (failed.length  > 0) toast.push(`${plural(failed.length, 'transaction')} failed — check details`, 'warning');

      setSelected(new Set());
      fetchData();
    } catch (e) {
      toast.push(e.message, 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  // ── filter reset ─────────────────────────────────────────────
  const resetFilters = () => {
    setFilters({ type: '', from: '', to: '', staff_id: '' });
    setPage(0);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── page header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a2e1a] via-[#2d442d] to-[#3d5a3d] rounded-2xl px-7 py-5 shadow-sm border border-white/10 text-white">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="opacity-60" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Pending Review</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Backdated Transactions</h1>
            <p className="text-white/70 text-sm mt-0.5">
              Transactions submitted with a date different from today — journal entries post on approval.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {someSelected && (
              <button onClick={() => setConfirmBulk(true)} disabled={bulkLoading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">
                {bulkLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Approve {selected.size} selected
              </button>
            )}
            <button onClick={fetchData}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition border border-white/10">
              <RefreshCw size={15} />
            </button>
            <button onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition border ${
                hasActiveFilters
                  ? 'bg-amber-500 border-amber-400 text-white'
                  : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
              }`}>
              <Filter size={14} />
              Filters {hasActiveFilters && `(${Object.values(filters).filter(Boolean).length})`}
            </button>
          </div>
        </div>
      </div>

      {/* ── summary strip ── */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label:  'Total Pending',
              value:  summary.total_count,
              sub:    `¢${fmt(summary.total_amount)}`,
              icon:   Clock,
              colour: 'bg-amber-50 text-amber-700 border-amber-100',
              iconCl: 'text-amber-600',
            },
            {
              label:  'Deposits',
              value:  summary.deposit_count,
              sub:    `¢${fmt(summary.total_deposit_amount)}`,
              icon:   ArrowDownLeft,
              colour: 'bg-emerald-50 text-emerald-700 border-emerald-100',
              iconCl: 'text-emerald-600',
            },
            {
              label:  'Withdrawals',
              value:  summary.withdrawal_count,
              sub:    `¢${fmt(summary.total_withdrawal_amount)}`,
              icon:   ArrowUpRight,
              colour: 'bg-red-50 text-red-700 border-red-100',
              iconCl: 'text-red-600',
            },
            {
              label:  'Backdated / Future',
              value:  `${summary.backdated_count} / ${summary.future_dated_count}`,
              sub:    summary.oldest_date ? `Oldest: ${fmtD(summary.oldest_date)}` : 'No records',
              icon:   Calendar,
              colour: 'bg-blue-50 text-blue-700 border-blue-100',
              iconCl: 'text-blue-600',
            },
          ].map(({ label, value, sub, icon: Icon, colour, iconCl }) => (
            <div key={label} className={`flex items-start gap-3 p-4 rounded-2xl border ${colour}`}>
              <div className={`p-2 rounded-xl bg-white/70 ${iconCl}`}>
                <Icon size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
                <p className="text-xl font-extrabold leading-tight">{value}</p>
                <p className="text-[11px] font-medium opacity-70">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── filter panel ── */}
      {showFilters && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e1a]/20"
                value={filters.type}
                onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setPage(0); }}>
                <option value="">All types</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tx Date From</label>
              <input type="date"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e1a]/20"
                value={filters.from}
                onChange={e => { setFilters(f => ({ ...f, from: e.target.value })); setPage(0); }} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tx Date To</label>
              <input type="date"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e1a]/20"
                value={filters.to}
                onChange={e => { setFilters(f => ({ ...f, to: e.target.value })); setPage(0); }} />
            </div>
            <div className="flex items-end">
              <button onClick={resetFilters}
                className="w-full py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── bulk select bar ── */}
      {transactions.length > 0 && (
        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm">
          <label className="flex items-center gap-2.5 cursor-pointer select-none" onClick={toggleAll}>
            <span className="text-gray-400 hover:text-[#1a2e1a] transition-colors">
              {allSelected
                ? <CheckSquare size={17} className="text-[#1a2e1a]" />
                : someSelected
                  ? <CheckSquare size={17} className="text-gray-400" />
                  : <Square size={17} />}
            </span>
            <span className="text-sm font-semibold text-gray-700">
              {allSelected
                ? 'Deselect all'
                : someSelected
                  ? `${selected.size} selected`
                  : `Select all ${transactions.length}`}
            </span>
          </label>
          <p className="text-xs text-gray-400 tabular-nums">
            {meta.total} total · page {page + 1} of {meta.pages}
          </p>
        </div>
      )}

      {/* ── list ── */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white border border-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl py-20 text-center shadow-sm">
          <ReceiptText size={44} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 font-semibold">No pending backdated transactions</p>
          <p className="text-gray-400 text-sm mt-1">
            {hasActiveFilters ? 'Try clearing your filters.' : 'All caught up! Nothing awaiting review.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {transactions.map(tx => (
            <TransactionRow
              key={tx.transaction_id}
              tx={tx}
              selected={selected.has(tx.transaction_id)}
              onToggleSelect={toggleOne}
              onApprove={(t) => setConfirmApprove(t)}
              onReject={(t)  => setRejectTarget(t)}
              approving={approvingId === tx.transaction_id}
              rejecting={rejectingId === tx.transaction_id}
            />
          ))}
        </div>
      )}

      {/* ── pagination ── */}
      {meta.pages > 1 && (
        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed">
            ← Previous
          </button>
          <span className="text-sm text-gray-500 tabular-nums">
            Page {page + 1} of {meta.pages} — {meta.total} transactions
          </span>
          <button onClick={() => setPage(p => Math.min(meta.pages - 1, p + 1))} disabled={page >= meta.pages - 1}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed">
            Next →
          </button>
        </div>
      )}

      {/* ── modals ── */}
      <ConfirmModal
        open={!!confirmApprove}
        title="Approve Transaction"
        confirmLabel="Yes, Approve & Post JE"
        confirmStyle="bg-[#1a2e1a] hover:bg-[#2d442d]"
        loading={!!approvingId}
        onConfirm={handleApprove}
        onCancel={() => setConfirmApprove(null)}
        message={
          confirmApprove
            ? `You are about to approve a ${confirmApprove.type} of ¢${fmt(confirmApprove.amount)} for ${confirmApprove.customer_name}, dated ${fmtD(confirmApprove.transaction_date)}. A journal entry will be posted to the books for that date.`
            : ''
        }
        extra={
          confirmApprove?.type === 'withdrawal' && (
            <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 text-[12px] leading-snug">
                Account balance will decrease from{' '}
                <strong>¢{fmt(confirmApprove.current_balance)}</strong> to{' '}
                <strong>¢{fmt(confirmApprove.current_balance - confirmApprove.amount)}</strong>.
              </p>
            </div>
          )
        }
      />

      <ConfirmModal
        open={confirmBulk}
        title={`Bulk Approve ${selected.size} Transactions`}
        confirmLabel={`Approve All ${selected.size}`}
        confirmStyle="bg-[#1a2e1a] hover:bg-[#2d442d]"
        loading={bulkLoading}
        onConfirm={handleBulkApprove}
        onCancel={() => setConfirmBulk(false)}
        message={`This will approve ${selected.size} pending transactions, post their journal entries to the respective dates, and update all account balances. Individual failures will be reported without affecting the others.`}
      />

      <RejectModal
        open={!!rejectTarget}
        onConfirm={handleReject}
        onCancel={() => setRejectTarget(null)}
        loading={!!rejectingId}
      />

      <ToastContainer toasts={toast.toasts} />
    </div>
  );
};

export default PendingBackdatedTransactions;