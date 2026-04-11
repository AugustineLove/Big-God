import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  RefreshCw, Search, CheckCircle, XCircle, Clock,
  PhoneCall, CreditCard, Hash, CalendarDays, SlidersHorizontal,
  X, AlertCircle, ChevronRight, Banknote, ArrowUpRight,
} from 'lucide-react';
import { MomoPendingWithdrawal, useMomoAgent } from '../../../contexts/dashboard/MomoAgent';
import { companyId, userUUID } from '../../../constants/appConstants';

type ProcessingStatus = 'sent' | 'failed';
type FilterStatus     = 'all' | 'pending' | 'sent' | 'failed';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatAmount = (amount: string) =>
  `¢${parseFloat(amount).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GH', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

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
const avatarPalette = (name: string) => AVATAR_PALETTES[name.charCodeAt(0) % AVATAR_PALETTES.length];

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string; processing_status: string | null }> = ({
  status, processing_status,
}) => {
  const s = processing_status || status;
  if (s === 'sent')
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        <CheckCircle size={11} strokeWidth={2.5} /> Sent
      </span>
    );
  if (s === 'failed')
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle size={11} strokeWidth={2.5} /> Failed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      <Clock size={11} strokeWidth={2.5} /> Pending
    </span>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastState { message: string; type: 'success' | 'error' }

const Toast: React.FC<{ toast: ToastState; onClose: () => void }> = ({ toast, onClose }) => (
  <div
    className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border max-w-sm
      ${toast.type === 'success'
        ? 'bg-green-50 border-green-200 text-green-800'
        : 'bg-rose-50 border-rose-200 text-rose-800'}`}
    style={{ animation: 'slideIn 0.2s ease' }}
  >
    {toast.type === 'success'
      ? <CheckCircle size={16} strokeWidth={2.5} className="text-green-600 shrink-0" />
      : <AlertCircle size={16} strokeWidth={2.5} className="text-rose-600 shrink-0" />}
    <p className="text-sm font-medium flex-1">{toast.message}</p>
    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
      <X size={14} />
    </button>
  </div>
);

// ─── Process Modal ────────────────────────────────────────────────────────────

interface ModalProps {
  tx: MomoPendingWithdrawal;
  updatingId: string | null;
  onConfirm: (status: ProcessingStatus, note: string) => void;
  onClose: () => void;
}

const ProcessModal: React.FC<ModalProps> = ({ tx, updatingId, onConfirm, onClose }) => {
  const [note, setNote]     = useState('');
  const [chosen, setChosen] = useState<ProcessingStatus | null>(null);
  const isUpdating          = updatingId === tx.transaction_id;
  const palette             = avatarPalette(tx.customer_name);

  const handleConfirm = (status: ProcessingStatus) => {
    setChosen(status);
    onConfirm(status, note);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${palette.bg} ${palette.text}`}>
              {getInitials(tx.customer_name)}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-base leading-tight">{tx.customer_name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{tx.unique_code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg p-1.5 transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Amount highlight */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Amount to send</p>
              <p className="text-3xl font-bold text-blue-800">{formatAmount(tx.amount)}</p>
            </div>
            <Banknote size={34} className="text-blue-300" strokeWidth={1.5} />
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {([
              { icon: <PhoneCall size={13} className="text-slate-400" />,    label: 'Phone',     value: tx.customer_phone },
              { icon: <CreditCard size={13} className="text-slate-400" />,   label: 'Account',   value: tx.account_number },
              { icon: <Hash size={13} className="text-slate-400" />,         label: 'Type',      value: tx.account_type   },
              { icon: <CalendarDays size={13} className="text-slate-400" />, label: 'Requested', value: new Date(tx.transaction_date).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' }) },
            ] as { icon: React.ReactNode; label: string; value: string }[]).map(({ icon, label, value }) => (
              <div key={label} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  {icon}
                  <p className="text-xs text-slate-400 font-medium">{label}</p>
                </div>
                <p className="text-sm font-semibold text-slate-800">{value}</p>
              </div>
            ))}
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Agent note (optional)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. Sent via MTN MoMo, ref: 789456…"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-800 resize-none outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={() => handleConfirm('sent')}
              disabled={isUpdating}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-[1.5px] transition-all
                ${chosen === 'sent' && isUpdating
                  ? 'bg-green-100 border-green-300 text-green-800 cursor-not-allowed'
                  : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 cursor-pointer'}`}
            >
              <CheckCircle size={15} strokeWidth={2.5} />
              {chosen === 'sent' && isUpdating ? 'Saving…' : 'Mark as sent'}
            </button>
            <button
              onClick={() => handleConfirm('failed')}
              disabled={isUpdating}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-[1.5px] transition-all
                ${chosen === 'failed' && isUpdating
                  ? 'bg-rose-100 border-rose-300 text-rose-800 cursor-not-allowed'
                  : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 cursor-pointer'}`}
            >
              <XCircle size={15} strokeWidth={2.5} />
              {chosen === 'failed' && isUpdating ? 'Saving…' : 'Mark as failed'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

const SkeletonRow: React.FC = () => (
  <tr className="border-b border-slate-50 animate-pulse">
    {[140, 100, 80, 100, 70, 110, 80, 60].map((w, i) => (
      <td key={i} className="px-4 py-4">
        <div className="h-3.5 bg-slate-100 rounded-md" style={{ width: w }} />
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
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchPendingWithdrawals(companyId);
    setLastRefreshed(new Date());
  }, [fetchPendingWithdrawals]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Bubble API errors as toasts
  useEffect(() => {
    if (error) showToast(error, 'error');
  }, [error, showToast]);

  const handleUpdateStatus = useCallback(async (status: ProcessingStatus, note: string) => {
    if (!selectedTx) return;

    const result = await updateProcessingStatus(selectedTx.transaction_id, {
      processing_status: status,
      agent_note: note,
      agent_id: userUUID,
    });

    if (result.success) {
      showToast(
        status === 'sent'
          ? `Sent to ${selectedTx.customer_name}`
          : `Marked failed for ${selectedTx.customer_name}`,
        status === 'sent' ? 'success' : 'error'
      );
    } else {
      showToast(result.message || 'Update failed. Please try again.', 'error');
    }

    setSelectedTx(null);
  }, [selectedTx, updateProcessingStatus, showToast]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const pending      = withdrawals.filter(w => w.status === 'pending' && !w.processing_status);
    const sent         = withdrawals.filter(w => w.processing_status === 'sent');
    const failed       = withdrawals.filter(w => w.processing_status === 'failed');
    const pendingValue = pending.reduce((s, w) => s + parseFloat(w.amount), 0);
    const sentValue    = sent.reduce((s, w) => s + parseFloat(w.amount), 0);
    return { pending: pending.length, sent: sent.length, failed: failed.length, pendingValue, sentValue };
  }, [withdrawals]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return withdrawals.filter(w => {
      const s = w.processing_status || (w.status === 'pending' ? 'pending' : w.status);
      const matchFilter = filterStatus === 'all' || s === filterStatus;
      const q = searchTerm.toLowerCase();
      const matchSearch = !q ||
        w.customer_name.toLowerCase().includes(q) ||
        w.customer_phone.includes(q) ||
        (w.unique_code || '').toLowerCase().includes(q) ||
        w.account_number.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [withdrawals, filterStatus, searchTerm]);

  const filterTabs: { label: string; value: FilterStatus; count: number }[] = [
    { label: 'All',     value: 'all',     count: withdrawals.length },
    { label: 'Pending', value: 'pending', count: stats.pending      },
    { label: 'Sent',    value: 'sent',    count: stats.sent         },
    { label: 'Failed',  value: 'failed',  count: stats.failed       },
  ];

  const statCards = [
    {
      label:   'Pending',
      value:   stats.pending,
      sub:     `${formatAmount(stats.pendingValue.toString())} to send`,
      wrap:    'bg-amber-50 border-amber-200',
      text:    'text-amber-800',
      sub_cls: 'text-amber-600',
      icon:    <Clock size={20} className="text-amber-400" />,
    },
    {
      label:   'Sent today',
      value:   stats.sent,
      sub:     `${formatAmount(stats.sentValue.toString())} disbursed`,
      wrap:    'bg-green-50 border-green-200',
      text:    'text-green-800',
      sub_cls: 'text-green-600',
      icon:    <CheckCircle size={20} className="text-green-400" />,
    },
    {
      label:   'Failed',
      value:   stats.failed,
      sub:     'needs follow-up',
      wrap:    'bg-rose-50 border-rose-200',
      text:    'text-rose-800',
      sub_cls: 'text-rose-500',
      icon:    <XCircle size={20} className="text-rose-400" />,
    },
    {
      label:   'Total requests',
      value:   withdrawals.length,
      sub:     'all time today',
      wrap:    'bg-blue-50 border-blue-200',
      text:    'text-blue-800',
      sub_cls: 'text-blue-500',
      icon:    <ArrowUpRight size={20} className="text-blue-400" />,
    },
  ];

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Toast */}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* ── Top nav ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-6 md:px-8">
        <div className="max-w-7xl mx-auto py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm">
              <Banknote size={18} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-slate-900 leading-tight">MoMo agent portal</h1>
              <p className="text-xs text-slate-400">
                Big God Susu &middot; Refreshed{' '}
                {lastRefreshed.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-8 py-6 space-y-5">

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map(({ label, value, sub, wrap, text, sub_cls, icon }) => (
            <div key={label} className={`rounded-xl border px-4 py-3.5 flex items-center justify-between ${wrap}`}>
              <div>
                <p className={`text-xs font-semibold mb-0.5 ${text}`}>{label}</p>
                <p className={`text-3xl font-bold leading-none mb-1 ${text}`}>{value}</p>
                <p className={`text-xs ${sub_cls}`}>{sub}</p>
              </div>
              {icon}
            </div>
          ))}
        </div>

        {/* ── Main table card ─────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

          {/* Toolbar */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">

            {/* Filter tabs */}
            <div className="flex gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1">
              {filterTabs.map(({ label, value, count }) => (
                <button
                  key={value}
                  onClick={() => setFilterStatus(value)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm transition-all
                    ${filterStatus === value
                      ? 'bg-white text-slate-900 font-semibold shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {label}
                  <span className={`px-1.5 py-px rounded-full text-xs font-semibold
                    ${filterStatus === value
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-slate-200 text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search name, phone, code…"
                className="w-full pl-8 pr-8 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                <tr className="bg-slate-50 border-b border-slate-100">
                  {(['Customer', 'Phone', 'Amount', 'Account', 'Type', 'Date', 'Status', ''] as const).map((h, i) => (
                    <th
                      key={i}
                      className={`px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap
                        ${h === 'Amount' ? 'text-right' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)

                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <SlidersHorizontal size={30} className="text-slate-300" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-slate-400">No withdrawals found</p>
                        <p className="text-xs text-slate-300">Try adjusting filters or your search</p>
                      </div>
                    </td>
                  </tr>

                ) : (
                  filtered.map(w => {
                    const palette   = avatarPalette(w.customer_name);
                    const isPending = w.status === 'pending' && !w.processing_status;

                    return (
                      <tr
                        key={w.transaction_id}
                        className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                      >
                        {/* Customer */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${palette.bg} ${palette.text}`}>
                              {getInitials(w.customer_name)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 leading-tight">{w.customer_name}</p>
                              <p className="text-xs text-slate-400">{w.unique_code}</p>
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <PhoneCall size={12} className="text-slate-300 shrink-0" />
                            {w.customer_phone}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                          {formatAmount(w.amount)}
                        </td>

                        {/* Account */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <CreditCard size={12} className="text-slate-300 shrink-0" />
                            {w.account_number}
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-500">
                            {w.account_type}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                          {formatDate(w.transaction_date)}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <StatusBadge status={w.status} processing_status={w.processing_status} />
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3.5 text-right">
                          {isPending ? (
                            <button
                              onClick={() => setSelectedTx(w)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-200 whitespace-nowrap"
                            >
                              Process <ChevronRight size={13} />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-300">
                              {w.processed_at
                                ? new Date(w.processed_at).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })
                                : '—'}
                            </span>
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
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>
                Showing{' '}
                <strong className="text-slate-600">{filtered.length}</strong> of{' '}
                <strong className="text-slate-600">{withdrawals.length}</strong> withdrawals
              </span>
              <span>
                {stats.pending} pending &middot; {stats.sent} sent &middot; {stats.failed} failed
              </span>
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
          onClose={() => setSelectedTx(null)}
        />
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(16px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MomoAgentDashboard;
