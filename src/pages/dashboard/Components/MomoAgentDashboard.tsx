import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  RefreshCw, Search, CheckCircle, XCircle, Clock,
  PhoneCall, CreditCard, Hash, CalendarDays, SlidersHorizontal,
  X, AlertCircle, ChevronRight, Banknote, ArrowUpRight,
  MessageSquare, Info,
} from 'lucide-react';
import { MomoPendingWithdrawal, useMomoAgent } from '../../../contexts/dashboard/MomoAgent';
import { companyId, userUUID } from '../../../constants/appConstants';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProcessingStatus = 'paid' | 'failed';
type FilterStatus     = 'all' | 'pending' | 'paid' | 'failed';
interface ToastState  { message: string; type: 'success' | 'error' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatAmount = (amount: string) =>
  `¢${parseFloat(amount).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GH', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' });

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const AVATAR_PALETTES = [
  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  { bg: 'bg-pink-100',   text: 'text-pink-700'   },
  { bg: 'bg-emerald-100',text: 'text-emerald-700' },
  { bg: 'bg-orange-100', text: 'text-orange-700'  },
  { bg: 'bg-blue-100',   text: 'text-blue-700'    },
  { bg: 'bg-purple-100', text: 'text-purple-700'  },
];
const avatarPalette = (name: string) =>
  AVATAR_PALETTES[name.charCodeAt(0) % AVATAR_PALETTES.length];

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string; processing_status: string | null }> = ({
  status, processing_status,
}) => {
  const s = processing_status || status;
  if (s === 'paid')
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
        <CheckCircle size={10} strokeWidth={2.5} /> Paid
      </span>
    );
  if (s === 'failed')
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle size={10} strokeWidth={2.5} /> Failed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <Clock size={10} strokeWidth={2.5} /> Pending
    </span>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────

const Toast: React.FC<{ toast: ToastState; onClose: () => void }> = ({ toast, onClose }) => (
  <div
    className={`fixed top-5 right-5 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border max-w-sm
      ${toast.type === 'success'
        ? 'bg-white border-green-200'
        : 'bg-white border-rose-200'}`}
    style={{ animation: 'slideIn 0.25s cubic-bezier(0.16,1,0.3,1)' }}
  >
    {toast.type === 'success'
      ? <CheckCircle size={17} strokeWidth={2} className="text-green-500 shrink-0" />
      : <AlertCircle size={17} strokeWidth={2} className="text-rose-500 shrink-0" />}
    <p className={`text-sm font-medium flex-1 ${toast.type === 'success' ? 'text-green-800' : 'text-rose-800'}`}>
      {toast.message}
    </p>
    <button
      onClick={onClose}
      className="text-slate-300 hover:text-slate-500 transition-colors ml-1"
    >
      <X size={14} />
    </button>
  </div>
);

// ─── Process Modal ────────────────────────────────────────────────────────────

interface ModalProps {
  tx: MomoPendingWithdrawal;
  updatingId: string | null;
  onConfirm: (status: ProcessingStatus, note: string) => Promise<void>;
  onClose: () => void;
}

const ProcessModal: React.FC<ModalProps> = ({ tx, updatingId, onConfirm, onClose }) => {
  const [note,   setNote]   = useState('');
  const [chosen, setChosen] = useState<ProcessingStatus | null>(null);
  const isUpdating          = updatingId === tx.transaction_id;
  const palette             = avatarPalette(tx.customer_name);

  const handleConfirm = async (status: ProcessingStatus) => {
    if (isUpdating) return;
    setChosen(status);
    await onConfirm(status, note);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget && !isUpdating) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[440px] shadow-2xl overflow-hidden"
        style={{ animation: 'modalIn 0.2s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* ── Modal header ─────────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${palette.bg} ${palette.text}`}>
              {getInitials(tx.customer_name)}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-[15px] leading-snug">{tx.customer_name}</p>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{tx.unique_code ?? '—'}</p>
            </div>
          </div>
          <button
            onClick={() => { if (!isUpdating) onClose(); }}
            className="text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-lg p-1.5 transition-colors mt-0.5 shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Amount card */}
          <div className="rounded-xl bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-100 border border-blue-100 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.1em] mb-1">Amount to send</p>
              <p className="text-[28px] font-bold text-blue-800 leading-none">{formatAmount(tx.amount)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Banknote size={22} className="text-blue-400" strokeWidth={1.75} />
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-2">
            {([
              { icon: <PhoneCall    size={12} className="text-slate-400" />, label: 'Phone',      value: tx.customer_phone },
              { icon: <CreditCard   size={12} className="text-slate-400" />, label: 'Account no.', value: tx.account_number },
              { icon: <Hash         size={12} className="text-slate-400" />, label: 'Account type', value: tx.account_type  },
              { icon: <CalendarDays size={12} className="text-slate-400" />, label: 'Requested at', value: formatTime(tx.transaction_date) },
            ] as { icon: React.ReactNode; label: string; value: string }[]).map(({ icon, label, value }) => (
              <div key={label} className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  {icon}
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{label}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Agent note */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
              <MessageSquare size={12} className="text-slate-400" />
              Agent note
              <span className="text-slate-300 font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              disabled={isUpdating}
              placeholder="e.g. paid via MTN MoMo, transaction ref: 789456…"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 resize-none outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Confirm hint */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5">
            <Info size={13} className="text-amber-400 mt-0.5 shrink-0" strokeWidth={2} />
            <p className="text-xs text-amber-700 leading-relaxed">
             Please paste Mobile Money message in agent note section.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5">
            <button
              onClick={() => handleConfirm('paid')}
              disabled={isUpdating}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border transition-all
                ${isUpdating && chosen === 'paid'
                  ? 'bg-green-100 border-green-200 text-green-700 cursor-not-allowed'
                  : isUpdating
                  ? 'opacity-40 cursor-not-allowed bg-green-50 border-green-200 text-green-700'
                  : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 active:scale-[0.98] cursor-pointer'}`}
            >
              {isUpdating && chosen === 'paid' ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <CheckCircle size={15} strokeWidth={2.5} />
              )}
              {isUpdating && chosen === 'paid' ? 'Saving…' : 'Mark as paid'}
            </button>

            <button
              onClick={() => handleConfirm('failed')}
              disabled={isUpdating}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border transition-all
                ${isUpdating && chosen === 'failed'
                  ? 'bg-rose-100 border-rose-200 text-rose-700 cursor-not-allowed'
                  : isUpdating
                  ? 'opacity-40 cursor-not-allowed bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 hover:border-rose-300 active:scale-[0.98] cursor-pointer'}`}
            >
              {isUpdating && chosen === 'failed' ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <XCircle size={15} strokeWidth={2.5} />
              )}
              {isUpdating && chosen === 'failed' ? 'Saving…' : 'Mark as failed'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

// ─── Note tooltip (shown in processed rows) ───────────────────────────────────

const NoteTooltip: React.FC<{ note: string }> = ({ note }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-slate-300 hover:text-slate-400 transition-colors"
      >
        <MessageSquare size={13} />
      </button>
      {show && (
        <div className="absolute bottom-full right-0 mb-2 w-52 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl z-10 leading-relaxed">
          {note}
          <div className="absolute top-full right-3 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
};

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

const SkeletonRow: React.FC = () => (
  <tr className="border-b border-slate-50 animate-pulse">
    {[160, 110, 80, 110, 70, 120, 80, 50].map((w, i) => (
      <td key={i} className="px-4 py-4">
        <div className="h-3 bg-slate-100 rounded-md" style={{ width: w }} />
        {i === 0 && <div className="h-2.5 bg-slate-100 rounded-md mt-2" style={{ width: 80 }} />}
      </td>
    ))}
  </tr>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const MomoAgentDashboard: React.FC = () => {
  const {
    withdrawals,
    loading,
    updatingId,
    error,
    fetchPendingWithdrawals,
    updateProcessingStatus,
  } = useMomoAgent();

  const [searchTerm,    setSearchTerm]    = useState('');
  const [filterStatus,  setFilterStatus]  = useState<FilterStatus>('all');
  const [selectedTx,    setSelectedTx]    = useState<MomoPendingWithdrawal | null>(null);
  const [toast,         setToast]         = useState<ToastState | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchPendingWithdrawals(companyId);
    setLastRefreshed(new Date());
  }, [fetchPendingWithdrawals]);

  useEffect(() => { handleRefresh(); }, [handleRefresh]);

  useEffect(() => {
    if (error) showToast(error, 'error');
  }, [error, showToast]);

  const handleUpdateStatus = useCallback(async (status: ProcessingStatus, note: string) => {
    if (!selectedTx) return;

    const result = await updateProcessingStatus(selectedTx.transaction_id, {
      processing_status: status,
      agent_note: note || undefined,
      agent_id: userUUID,
    });

    if (result.success) {
      showToast(
        status === 'paid'
          ? `Marked as paid — ${selectedTx.customer_name}`
          : `Marked as failed — ${selectedTx.customer_name}`,
        status === 'paid' ? 'success' : 'error'
      );
    } else {
      showToast(result.message || 'Update failed. Please try again.', 'error');
    }

    setSelectedTx(null);
  }, [selectedTx, updateProcessingStatus, showToast]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const pending      = withdrawals.filter(w => w.processing_status === 'pending' && w.status === 'pending');
    const paid         = withdrawals.filter(w => w.processing_status === 'paid');
    const failed       = withdrawals.filter(w => w.processing_status === 'failed');
    const pendingValue = pending.reduce((s, w) => s + parseFloat(w.amount), 0);
    const paidValue    = paid.reduce((s, w) => s + parseFloat(w.amount), 0);
    return { pending: pending.length, paid: paid.length, failed: failed.length, pendingValue, paidValue };
  }, [withdrawals]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return withdrawals.filter(w => {
      const s           = w.processing_status || (w.status === 'pending' ? 'pending' : w.status);
      const matchFilter = filterStatus === 'all' || s === filterStatus;
      const q           = searchTerm.toLowerCase();
      const matchSearch = !q
        || w.customer_name.toLowerCase().includes(q)
        || w.customer_phone.includes(q)
        || (w.unique_code ?? '').toLowerCase().includes(q)
        || w.account_number.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [withdrawals, filterStatus, searchTerm]);

  const filterTabs: { label: string; value: FilterStatus; count: number }[] = [
    { label: 'All',     value: 'all',     count: withdrawals.length },
    { label: 'Pending', value: 'pending', count: stats.pending      },
    { label: 'paid',    value: 'paid',    count: stats.paid         },
    { label: 'Failed',  value: 'failed',  count: stats.failed       },
  ];

  const statCards = [
    {
      label: 'Pending',
      value: stats.pending,
      sub:   `${formatAmount(stats.pendingValue.toFixed(2))} to send`,
      wrap:  'bg-amber-50 border-amber-200',
      num:   'text-amber-800',
      sub_:  'text-amber-500',
      icon:  <Clock size={22} className="text-amber-300" />,
    },
    {
      label: 'Paid today',
      value: stats.paid,
      sub:   `${formatAmount(stats.paidValue.toFixed(2))} disbursed`,
      wrap:  'bg-green-50 border-green-200',
      num:   'text-green-800',
      sub_:  'text-green-500',
      icon:  <CheckCircle size={22} className="text-green-300" />,
    },
    {
      label: 'Failed',
      value: stats.failed,
      sub:   'needs follow-up',
      wrap:  'bg-rose-50 border-rose-200',
      num:   'text-rose-800',
      sub_:  'text-rose-400',
      icon:  <XCircle size={22} className="text-rose-300" />,
    },
    {
      label: 'Total today',
      value: withdrawals.length,
      sub:   'all requests',
      wrap:  'bg-slate-50 border-slate-200',
      num:   'text-slate-800',
      sub_:  'text-slate-400',
      icon:  <ArrowUpRight size={22} className="text-slate-300" />,
    },
  ];

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50/60">

      {/* Toast */}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-3.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm shadow-blue-200 shrink-0">
              <Banknote size={17} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-[16px] font-bold text-slate-900 leading-tight">Agent portal</h1>
              <p className="text-[11px] text-slate-400">
                Big God Susu &middot; Refreshed {lastRefreshed.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 md:px-8 py-6 space-y-5">

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map(({ label, value, sub, wrap, num, sub_, icon }) => (
            <div key={label} className={`rounded-2xl border px-4 py-4 flex items-center justify-between ${wrap}`}>
              <div>
                <p className={`text-xs font-semibold mb-1 ${num} opacity-70`}>{label}</p>
                <p className={`text-[28px] font-bold leading-none mb-1.5 ${num}`}>{value}</p>
                <p className={`text-[11px] font-medium ${sub_}`}>{sub}</p>
              </div>
              {icon}
            </div>
          ))}
        </div>

        {/* ── Table card ──────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

          {/* Toolbar */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">

            {/* Filter tabs */}
            <div className="flex gap-0.5 bg-slate-100 border border-slate-200 rounded-xl p-1">
              {filterTabs.map(({ label, value, count }) => (
                <button
                  key={value}
                  onClick={() => setFilterStatus(value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all
                    ${filterStatus === value
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {label}
                  <span className={`min-w-[20px] text-center px-1.5 py-px rounded-full text-[11px] font-bold
                    ${filterStatus === value
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-slate-200/80 text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-[280px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Name, phone, code, account…"
                className="w-full pl-8 pr-8 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  {(['Customer', 'Phone', 'Amount', 'Account', 'Type', 'Date', 'Status', 'Processed', ''] as const).map((h, i) => (
                    <th
                      key={i}
                      className={`px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap
                        ${h === 'Amount' ? 'text-right' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)

                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2.5">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <SlidersHorizontal size={20} className="text-slate-300" strokeWidth={1.5} />
                        </div>
                        <p className="text-sm font-semibold text-slate-400">No withdrawals found</p>
                        <p className="text-xs text-slate-300">
                          {searchTerm ? 'Try a different search term' : 'Try adjusting the filter above'}
                        </p>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                ) : (
                  filtered.map(w => {
                    const palette   = avatarPalette(w.customer_name);
                    const isPending = w.status === 'pending' && w.processing_status === 'pending';
                    const ispaid    = w.processing_status === 'paid';
                    const isFailed  = w.processing_status === 'failed';

                    return (
                      <tr
                        key={w.transaction_id}
                        className={`transition-colors group
                          ${isPending ? 'hover:bg-blue-50/30 cursor-default' : ''}
                          ${ispaid    ? 'bg-green-50/20' : ''}
                          ${isFailed  ? 'bg-rose-50/20'  : ''}`}
                      >
                        {/* Customer */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${palette.bg} ${palette.text}`}>
                              {getInitials(w.customer_name)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-[13px] leading-tight">{w.customer_name}</p>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{w.unique_code ?? '—'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-slate-600 text-[13px]">
                            <PhoneCall size={11} className="text-slate-300 shrink-0" />
                            {w.customer_phone}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900 text-[13px]">
                          {formatAmount(w.amount)}
                        </td>

                        {/* Account */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-slate-500 text-[13px]">
                            <CreditCard size={11} className="text-slate-300 shrink-0" />
                            {w.account_number}
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-500">
                            {w.account_type}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-slate-400 text-[12px] whitespace-nowrap font-medium">
                          {formatDate(w.transaction_date)}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <StatusBadge status={w.status} processing_status={w.processing_status} />
                        </td>

                        {/* Processed at + note */}
                        <td className="px-4 py-3.5">
                          {w.processed_at ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[12px] text-slate-400 font-medium whitespace-nowrap">
                                {formatTime(w.processed_at)}
                              </span>
                              {w.agent_note && <NoteTooltip note={w.agent_note} />}
                            </div>
                          ) : (
                            <span className="text-slate-200 text-xs">—</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3.5 text-right">
                          {isPending ? (
                            <button
                              onClick={() => setSelectedTx(w)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.97] transition-all shadow-sm shadow-blue-100 whitespace-nowrap"
                            >
                              Process <ChevronRight size={12} strokeWidth={2.5} />
                            </button>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">Done</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <p className="text-[11px] text-slate-400">
                Showing <strong className="text-slate-600 font-semibold">{filtered.length}</strong> of{' '}
                <strong className="text-slate-600 font-semibold">{withdrawals.length}</strong> withdrawals
              </p>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  {stats.pending} pending
                </span>
                <span className="flex items-center gap-1 text-[11px] text-green-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  {stats.paid} paid
                </span>
                <span className="flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
                  {stats.failed} failed
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Process Modal */}
      {selectedTx && (
        <ProcessModal
          tx={selectedTx}
          updatingId={updatingId}
          onConfirm={handleUpdateStatus}
          onClose={() => { if (!updatingId) setSelectedTx(null); }}
        />
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(20px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes modalIn {
          from { transform: scale(0.96) translateY(6px); opacity: 0; }
          to   { transform: scale(1)    translateY(0);   opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MomoAgentDashboard;
