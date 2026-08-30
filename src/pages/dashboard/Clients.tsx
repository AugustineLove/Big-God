import React, { useState, useMemo, useCallback } from 'react';
import {
  Search, Plus, Edit, Trash2, Users, Wallet,
  Calendar, Download, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, Loader2, MapPin, Mail, Phone,
} from 'lucide-react';
import { Customer, Account } from '../../data/mockData';
import { useCustomers } from '../../contexts/dashboard/Customers';
import { useStats } from '../../contexts/dashboard/DashboardStat';
import { ClientModal } from './Components/clientModal';
import { useNavigate } from 'react-router-dom';
import DeleteCustomerModal from '../../components/deleteComfirmationModal';
import { userPermissions } from '../../constants/appConstants';
import { useTabContext } from '../../layouts/DashboardLayout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchParams {
  // Identity
  name: string;
  phone_number: string;
  email: string;
  account_number: string;
  id_card: string;
  momo_number: string;
  // Demographics
  gender: string;
  status: string;
  location: string;
  city: string;
  // Registration
  registered_by_name: string;
  date_from: string;
  date_to: string;
  date_of_birth: string;
  // Financial
  daily_rate_min: string;
  daily_rate_max: string;
  balance_min: string;
  balance_max: string;
}

const EMPTY_SEARCH: SearchParams = {
  name: '', phone_number: '', email: '', account_number: '',
  id_card: '', momo_number: '', gender: '', status: '',
  location: '', city: '', registered_by_name: '',
  date_from: '', date_to: '', date_of_birth: '',
  daily_rate_min: '', daily_rate_max: '',
  balance_min: '', balance_max: '',
};

interface PaginationMeta {
  total: number;
  totalPages: number;
  currentPage: number;
}

// ─── Shared field input (themed) ───────────────────────────────────────────────

const inputCls =
  'w-full bg-[var(--paper)] border border-[var(--paper-line)] rounded-xl px-3 py-2 text-sm text-[var(--ink)] ' +
  'placeholder:text-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)]/20 focus:border-[var(--forest)] transition-colors';

const labelCls = 'block text-[11px] font-medium text-[var(--ink-soft)] mb-1';

// ─── Pagination (ledger style) ─────────────────────────────────────────────────

const Pagination: React.FC<{
  meta: PaginationMeta;
  currentPage: number;
  loading: boolean;
  onPageChange: (p: number) => void;
}> = ({ meta, currentPage, loading, onPageChange }) => {
  if (meta.totalPages <= 1) return null;

  const pages: (number | 'ellipsis')[] = [];
  const delta = 2;
  const rangeStart = Math.max(2, currentPage - delta);
  const rangeEnd = Math.min(meta.totalPages - 1, currentPage + delta);
  pages.push(1);
  if (rangeStart > 2) pages.push('ellipsis');
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
  if (rangeEnd < meta.totalPages - 1) pages.push('ellipsis');
  if (meta.totalPages > 1) pages.push(meta.totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl">
      <p className="text-[12px] text-[var(--ink-faint)]">
        Page <span className="font-semibold text-[var(--ink)]">{currentPage}</span> of{' '}
        <span className="font-semibold text-[var(--ink)]">{meta.totalPages}</span>
        <span className="mx-1.5 opacity-50">·</span>
        <span className="font-semibold text-[var(--ink)]">{meta.total}</span> total
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-[var(--paper-line)] rounded-lg hover:bg-[var(--paper)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[var(--ink-soft)]"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </button>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="w-8 text-center text-[var(--ink-faint)] text-xs">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              disabled={loading}
              className={`w-8 h-8 text-xs font-semibold rounded-lg border transition-colors disabled:cursor-not-allowed
                ${p === currentPage
                  ? 'bg-[var(--forest)] text-white border-[var(--forest)]'
                  : 'border-[var(--paper-line)] text-[var(--ink-soft)] hover:bg-[var(--paper)]'}`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= meta.totalPages || loading}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-[var(--paper-line)] rounded-lg hover:bg-[var(--paper)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[var(--ink-soft)]"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const Clients: React.FC = () => {
  const [form, setForm] = useState<SearchParams>(EMPTY_SEARCH);
  const [submittedParams, setSubmittedParams] = useState<SearchParams | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({ total: 0, totalPages: 1, currentPage: 1 });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { customers, customerLoading, findCustomers, addCustomer, editCustomer, refreshCustomers, deleteCustomer } = useCustomers();
  const { stats } = useStats();
  const navigate = useNavigate();
  const { openInNewTab } = useTabContext();

  // ── Field change handler ──────────────────────────────────────────────────
  const setField = (key: keyof SearchParams, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  // ── Core fetch — only called explicitly ──────────────────────────────────
  const doFetch = useCallback(async (page: number, params: SearchParams) => {
    const filters = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '')
    );
    const meta = await findCustomers(String(page), 20, filters);
    if (meta) {
      setPaginationMeta({ total: meta.total, totalPages: meta.totalPages, currentPage: meta.page });
    }
  }, [refreshCustomers, findCustomers]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setCurrentPage(1);
    setSubmittedParams(form);
    setHasSearched(true);
    await doFetch(1, form);
  };

  // ── Pagination (reuses last submitted params) ─────────────────────────────
  const handlePageChange = (page: number) => {
    if (!submittedParams) return;
    setCurrentPage(page);
    doFetch(page, submittedParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Clear ─────────────────────────────────────────────────────────────────
  const handleClear = () => {
    setForm(EMPTY_SEARCH);
    setSubmittedParams(null);
    setHasSearched(false);
    setPaginationMeta({ total: 0, totalPages: 1, currentPage: 1 });
    setCurrentPage(1);
  };

  // ── Sort (client-side on current page) ────────────────────────────────────
  const handleSort = (key: string) =>
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-3.5 w-3.5 text-[var(--ink-faint)]" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 text-[var(--forest)]" />
      : <ArrowDown className="h-3.5 w-3.5 text-[var(--forest)]" />;
  };

  const sortedCustomers = useMemo(() => {
    if (!sortConfig.key) return customers;
    return [...customers].sort((a, b) => {
      let av: any, bv: any;
      switch (sortConfig.key) {
        case 'name':       av = a.name?.toLowerCase(); bv = b.name?.toLowerCase(); break;
        case 'balance':    av = parseFloat(a.total_balance_across_all_accounts || '0'); bv = parseFloat(b.total_balance_across_all_accounts || '0'); break;
        case 'date_joined':av = new Date(a.date_of_registration).getTime(); bv = new Date(b.date_of_registration).getTime(); break;
        default: return 0;
      }
      if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
      if (av > bv) return sortConfig.direction === 'asc' ?  1 : -1;
      return 0;
    });
  }, [customers, sortConfig]);

  // ── Page stats ────────────────────────────────────────────────────────────
  const pageStats = useMemo(() => {
    const totalBalance = customers.reduce((s, c) => s + (parseFloat(c.total_balance_across_all_accounts) || 0), 0);
    const avgDailyRate = customers.length > 0 ? customers.reduce((s, c) => s + (parseFloat(c.daily_rate) || 0), 0) / customers.length : 0;
    return {
      maleCount:   customers.filter(c => c.gender?.toLowerCase() === 'male').length,
      femaleCount: customers.filter(c => c.gender?.toLowerCase() === 'female').length,
      totalBalance, avgDailyRate,
      activeCount:   customers.filter(c => c.status?.toLowerCase() === 'active').length,
      inactiveCount: customers.filter(c => c.status?.toLowerCase() === 'inactive').length,
    };
  }, [customers]);

  // ── Export ────────────────────────────────────────────────────────────────
  const exportData = () => {
    const rows = [
      ['Name','Email','Phone','Account Number','Balance','Location','Registered By','Join Date','Daily Rate'],
      ...customers.map(c => [c.name, c.email, c.phone_number, c.account_number, c.total_balance_across_all_accounts, c.location, c.registered_by_name, new Date(c.date_of_registration).toLocaleDateString()]),
    ];
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `clients_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleDeleteClick   = (c: Customer) => { setSelectedCustomer(c); setIsDeleteModalOpen(true); };
  const handleDeleteCancel  = () => { setIsDeleteModalOpen(false); setSelectedCustomer(null); };
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteCustomer(selectedCustomer?.id);
      setIsDeleteModalOpen(false); setSelectedCustomer(null);
      if (submittedParams) doFetch(currentPage, submittedParams);
    } catch (e) { console.error(e); }
    finally { setIsDeleting(false); }
  };

  const handleAddClient = (newClient: Omit<Customer, 'id'>) => {
    const company = JSON.parse(localStorage.getItem('susupro_company') || '{}');
    addCustomer({ ...newClient, company_id: company?.id }, '');
    setShowAddModal(false);
  };

  const handleEditClient = (updated: Customer) => {
    editCustomer(updated);
    if (!customerLoading) setEditingClient(null);
    if (submittedParams) doFetch(currentPage, submittedParams);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--paper)] p-1">
      <div className="flex flex-col gap-4">

        {/* ── Ledger cover header ─────────────────────────────────────────── */}
        <div className="cd-root rounded-3xl overflow-hidden shadow-[0_1px_2px_rgba(20,32,20,0.08),0_12px_28px_-14px_rgba(20,32,20,0.35)]">
          <div className="cd-stitch relative overflow-hidden bg-[linear-gradient(145deg,#062e1b_0%,#0b4325_55%,#14532d_100%)] px-5 pt-6 pb-6 sm:px-7">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[rgba(255,255,255,0.5)]">Client register</p>
                <h1 className="cd-display text-xl sm:text-2xl font-medium text-white mt-1">Find a client</h1>
              
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {hasSearched && (
                  <button
                    onClick={exportData}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.16)] text-white text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                )}
                {userPermissions.CUSTOMER_CREATE && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--brass-soft)] hover:brightness-95 text-[var(--forest-deep)] text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add customer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Search Form ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSearch} className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl overflow-hidden">

          {/* Identity */}
          <div className="px-5 sm:px-6 py-5 border-b border-dashed border-[var(--paper-line)]">
            <p className="text-[11px] font-semibold text-[var(--brass)] uppercase tracking-wider mb-3">Identity</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'name',           label: 'Full name',       placeholder: 'e.g. Kwame Mensah' },
                { key: 'phone_number',   label: 'Phone number',    placeholder: 'e.g. 0244…' },
                { key: 'email',          label: 'Email address',   placeholder: 'e.g. kwame@…' },
                { key: 'account_number', label: 'Account number',  placeholder: 'e.g. ACC-0012' },
                { key: 'id_card',        label: 'ID card number',  placeholder: 'e.g. GHA-123…' },
                { key: 'momo_number',    label: 'MoMo number',     placeholder: 'e.g. 0551…' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input
                    type="text"
                    value={(form as any)[key]}
                    onChange={e => setField(key as keyof SearchParams, e.target.value)}
                    placeholder={placeholder}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Demographics */}
          <div className="px-5 sm:px-6 py-5 border-b border-dashed border-[var(--paper-line)]">
            <p className="text-[11px] font-semibold text-[var(--brass)] uppercase tracking-wider mb-3">Demographics</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Gender</label>
                <select value={form.gender} onChange={e => setField('gender', e.target.value)} className={inputCls}>
                  <option value="">Any</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select value={form.status} onChange={e => setField('status', e.target.value)} className={inputCls}>
                  <option value="">Any</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Location</label>
                <input type="text" value={form.location} onChange={e => setField('location', e.target.value)}
                  placeholder="e.g. Accra" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input type="text" value={form.city} onChange={e => setField('city', e.target.value)}
                  placeholder="e.g. Kumasi" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Registration */}
          <div className="px-5 sm:px-6 py-5 border-b border-dashed border-[var(--paper-line)]">
            <p className="text-[11px] font-semibold text-[var(--brass)] uppercase tracking-wider mb-3">Registration</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Registered by (staff)</label>
                <input type="text" value={form.registered_by_name} onChange={e => setField('registered_by_name', e.target.value)}
                  placeholder="Staff name…" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Registered from</label>
                <input type="date" value={form.date_from} onChange={e => setField('date_from', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Registered to</label>
                <input type="date" value={form.date_to} onChange={e => setField('date_to', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Date of birth</label>
                <input type="date" value={form.date_of_birth} onChange={e => setField('date_of_birth', e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Financial
          <div>
            ...
          </div> */}

          {/* Actions */}
          <div className="flex items-center gap-3 px-5 sm:px-6 py-4">
            <button
              type="submit"
              disabled={customerLoading}
              className="bg-[var(--forest)] text-white px-6 py-2 rounded-xl hover:brightness-110 transition-all flex items-center gap-2 text-sm font-semibold disabled:opacity-60"
            >
              {customerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-sm text-[var(--ink-soft)] border border-[var(--paper-line)] rounded-xl hover:bg-[var(--paper)] transition-colors"
            >
              Clear
            </button>
            {hasSearched && (
              <span className="text-[12px] text-[var(--ink-faint)]">
                {paginationMeta.total} client{paginationMeta.total !== 1 ? 's' : ''} found
              </span>
            )}
          </div>
        </form>

        {/* ── Stats (shown after a search) ──────────────────────────────── */}
        {hasSearched && userPermissions.VIEW_BRIEFING && customers.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Page balance', value: `¢${pageStats.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Wallet },
              { label: 'Active', value: pageStats.activeCount, icon: Users },
              { label: 'Inactive', value: pageStats.inactiveCount, icon: Users },
              { label: 'Avg. daily rate', value: `¢${pageStats.avgDailyRate.toFixed(2)}`, icon: Calendar },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl p-4 flex items-start justify-between"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--ink-faint)] mb-1.5">
                    {label}
                  </p>
                  <p className="cd-display text-xl font-medium text-[var(--ink)] tracking-tight leading-none truncate">
                    {value}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[var(--brass-soft)] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[var(--forest-deep)]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Results ──────────────────────────────────────────────────────── */}
        {hasSearched && (
          <>
            <div className="flex items-center justify-between px-1">
              <p className="text-[12px] text-[var(--ink-faint)]">
                Showing <span className="font-semibold text-[var(--ink)]">{customers.length}</span> of{' '}
                <span className="font-semibold text-[var(--ink)]">{paginationMeta.total}</span> results
                {paginationMeta.totalPages > 1 && (
                  <> · Page {currentPage} of {paginationMeta.totalPages}</>
                )}
              </p>

              {/* Sort chips (replaces sortable table headers now that rows are cards) */}
              <div className="hidden sm:flex items-center gap-1.5">
                {[
                  { key: 'name', label: 'Name' },
                  { key: 'balance', label: 'Balance' },
                  { key: 'date_joined', label: 'Joined' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleSort(key)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors
                      ${sortConfig.key === key
                        ? 'bg-[var(--brass-soft)] border-[var(--brass-soft)] text-[var(--forest-deep)]'
                        : 'border-[var(--paper-line)] text-[var(--ink-faint)] hover:bg-[var(--card)]'}`}
                  >
                    {label} {getSortIcon(key)}
                  </button>
                ))}
              </div>
            </div>

            {/* Ledger rows */}
            <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl overflow-hidden">
              {customerLoading ? (
                <div>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={`animate-pulse flex items-center gap-4 px-5 sm:px-6 py-4 ${i < 5 ? 'border-b border-dashed border-[var(--paper-line)]' : ''}`}
                    >
                      <div className="w-11 h-11 rounded-full bg-[var(--paper)] flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-[var(--paper)] rounded w-1/3" />
                        <div className="h-3 bg-[var(--paper)] rounded w-1/4" />
                      </div>
                      <div className="h-3.5 bg-[var(--paper)] rounded w-20" />
                    </div>
                  ))}
                </div>
              ) : sortedCustomers.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--paper)] flex items-center justify-center">
                    <Users className="h-6 w-6 text-[var(--ink-faint)]" />
                  </div>
                  <p className="cd-display text-base font-medium text-[var(--ink)] mb-1">No clients found</p>
                  <p className="text-[12px] text-[var(--ink-faint)]">Try adjusting your filters or search terms</p>
                  <button
                    onClick={handleClear}
                    className="mt-4 text-[12px] font-medium text-[var(--forest)] bg-[var(--brass-soft)] hover:brightness-95 px-3 py-1.5 rounded-lg transition"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                sortedCustomers.map((customer, i) => {
                  const isActive = customer.status === 'Active';
                  const isVip = parseFloat(customer.total_balance_across_all_accounts || '0') > 3000;
                  const daysAgo = Math.floor(
                    (Date.now() - new Date(customer.date_of_registration).getTime()) / 86_400_000
                  );

                  return (
                    <div
                      key={customer.id}
                      onClick={() => openInNewTab(customer.name, `clients/customer-details/${customer.id}`, Users)}
                      className={`group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 sm:px-6 py-4 cursor-pointer
                        hover:bg-[var(--paper)] transition-colors
                        ${i < sortedCustomers.length - 1 ? 'border-b border-dashed border-[var(--paper-line)]' : ''}`}
                    >
                      {/* Avatar + identity */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-xl bg-[var(--brass-soft)] flex items-center justify-center text-sm font-semibold text-[var(--forest-deep)] flex-shrink-0 cd-mono">
                          {customer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-semibold text-[var(--ink)] group-hover:text-[var(--forest)] transition-colors truncate">
                              {customer.name}
                            </span>
                            {isVip && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[var(--brass-soft)] text-[var(--forest-deep)] flex-shrink-0">
                                VIP
                              </span>
                            )}
                          </div>
                          <p className="cd-mono text-[11px] text-[var(--ink-faint)] mt-0.5 tracking-wide truncate">
                            {customer.account_number}
                          </p>
                          <p className="text-[11px] text-[var(--ink-faint)] mt-0.5 truncate">
                            Registered by {customer.registered_by_name}
                          </p>
                        </div>
                      </div>

                      {/* Contact */}
                      <div className="hidden md:flex flex-col gap-1 w-44 flex-shrink-0">
                        <div className="flex items-center gap-1.5 text-[12px] text-[var(--ink-soft)] truncate">
                          <Mail className="w-3 h-3 text-[var(--ink-faint)] flex-shrink-0" />
                          <span className="truncate" title={customer.email}>{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-[var(--ink-faint)] truncate">
                          <Phone className="w-3 h-3 text-[var(--ink-faint)] flex-shrink-0" />
                          {customer.phone_number}
                        </div>
                      </div>

                      {/* Location */}
                      <div className="hidden lg:flex flex-col gap-1 w-32 flex-shrink-0">
                        <div className="flex items-center gap-1.5 text-[12px] text-[var(--ink-soft)] truncate">
                          <MapPin className="w-3 h-3 text-[var(--ink-faint)] flex-shrink-0" />
                          {customer.location || 'Unknown'}
                        </div>
                        <p className="text-[11px] text-[var(--ink-faint)] pl-[18px] capitalize">{customer.gender}</p>
                      </div>

                      {/* Joined */}
                      <div className="hidden sm:block w-28 flex-shrink-0">
                        <p className="text-[12px] font-medium text-[var(--ink)]">
                          {new Date(customer.date_of_registration).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </p>
                        <p className="text-[11px] text-[var(--ink-faint)] mt-0.5">{daysAgo}d ago</p>
                      </div>

                      {/* Balance + status */}
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1 w-full sm:w-32 flex-shrink-0">
                        <p className="cd-mono text-[15px] font-semibold text-[var(--ink)] tabular-nums">
                          ¢{parseFloat(customer.total_balance_across_all_accounts || '0')
                              .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                          style={{
                            background: isActive ? 'rgba(47,74,50,0.1)' : 'var(--clay-soft)',
                            color: isActive ? 'var(--forest)' : 'var(--clay)',
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? 'var(--forest)' : 'var(--clay)' }} />
                          {customer.status}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => { e.stopPropagation(); setEditingClient(customer); }}
                          title="Edit"
                          className="w-8 h-8 rounded-lg bg-[var(--paper)] flex items-center justify-center text-[var(--ink-faint)] hover:text-[var(--forest)] transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        {userPermissions.DELETE_CUSTOMER && (
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteClick(customer); }}
                            title="Delete"
                            className="w-8 h-8 rounded-lg bg-[var(--paper)] flex items-center justify-center text-[var(--ink-faint)] hover:text-[var(--clay)] transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`customer-details/${customer.id}`); }}
                          title="View details"
                          className="w-8 h-8 rounded-lg bg-[var(--paper)] flex items-center justify-center text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <Pagination meta={paginationMeta} currentPage={currentPage} loading={customerLoading} onPageChange={handlePageChange} />
          </>
        )}

        {/* ── Empty state (before first search) ───────────────────────────── */}
        {!hasSearched && (
          <div className="bg-[var(--card)] border border-dashed border-[var(--paper-line)] rounded-2xl py-16 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--paper)] flex items-center justify-center">
              <Search className="h-6 w-6 text-[var(--ink-faint)]" />
            </div>
            <p className="cd-display text-base font-medium text-[var(--ink)] mb-1">Enter search criteria above</p>
            <p className="text-[12px] text-[var(--ink-faint)]">Results will appear here after you submit</p>
          </div>
        )}
      </div>

      {/* ── Modals (unchanged) ─────────────────────────────────────────── */}
      {(showAddModal || editingClient) && (
        <ClientModal account={{} as Account} client={editingClient}
          onSave={editingClient ? handleEditClient : handleAddClient}
          onClose={() => { setShowAddModal(false); setEditingClient(null); }} />
      )}
      {selectedCustomer && (
        <DeleteCustomerModal customer={selectedCustomer} isOpen={isDeleteModalOpen}
          onClose={handleDeleteCancel} onConfirm={handleDeleteConfirm} iscustomerLoading={isDeleting} />
      )}
    </div>
  );
};

export default Clients;