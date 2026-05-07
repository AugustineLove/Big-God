import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Search, Plus, Edit, Trash2, Users, TrendingUp,
  Calendar, Download, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, Loader2, Filter
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

// ─── Pagination ───────────────────────────────────────────────────────────────

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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm">
      <p className="text-sm text-gray-600">
        Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
        <span className="font-semibold text-gray-900">{meta.totalPages}</span>
        <span className="text-gray-400 mx-1">·</span>
        <span className="font-semibold text-gray-900">{meta.total}</span> total
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1 || loading}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>
        {pages.map((p, i) =>
          p === 'ellipsis'
            ? <span key={`e-${i}`} className="w-9 text-center text-gray-400 text-sm">…</span>
            : <button key={p} onClick={() => onPageChange(p as number)} disabled={loading}
                className={`w-9 h-9 text-sm font-medium rounded-lg border transition-colors
                  ${p === currentPage ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}
                  disabled:cursor-not-allowed`}>
                {p}
              </button>
        )}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= meta.totalPages || loading}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const Clients: React.FC = () => {
  const [form, setForm] = useState<SearchParams>(EMPTY_SEARCH);
  // The last submitted params — used when paginating (so page changes re-use same query)
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
    // Strip empty strings so backend doesn't get spurious filters
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
    if (sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 text-indigo-600" /> : <ArrowDown className="h-4 w-4 text-indigo-600" />;
  };

  const sortedCustomers = useMemo(() => {
    if (!sortConfig.key) return customers;
    return [...customers].sort((a, b) => {
      let av: any, bv: any;
      switch (sortConfig.key) {
        case 'name':       av = a.name?.toLowerCase(); bv = b.name?.toLowerCase(); break;
        case 'balance':    av = parseFloat(a.total_balance_across_all_accounts || '0'); bv = parseFloat(b.total_balance_across_all_accounts || '0'); break;
        case 'daily_rate': av = parseFloat(a.daily_rate || '0'); bv = parseFloat(b.daily_rate || '0'); break;
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
      ...customers.map(c => [c.name, c.email, c.phone_number, c.account_number, c.total_balance_across_all_accounts, c.location, c.registered_by_name, new Date(c.date_of_registration).toLocaleDateString(), c.daily_rate]),
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
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600">Search for clients using any combination of fields below</p>
        </div>
        <div className="flex items-center gap-3">
          {hasSearched && (
            <button onClick={exportData}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm">
              <Download className="h-4 w-4 mr-2" /> Export
            </button>
          )}
          {userPermissions.CUSTOMER_CREATE && (
            <button onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center">
              <Plus className="h-5 w-5 mr-2" /> Add Customer
            </button>
          )}
        </div>
      </div>

      {/* ── Search Form ─────────────────────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">

        {/* Identity */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Identity</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type="text" value={(form as any)[key]} onChange={e => setField(key as keyof SearchParams, e.target.value)}
                  placeholder={placeholder}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Demographics */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Demographics</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select value={form.gender} onChange={e => setField('gender', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">Any</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setField('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">Any</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" value={form.location} onChange={e => setField('location', e.target.value)}
                placeholder="e.g. Accra"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" value={form.city} onChange={e => setField('city', e.target.value)}
                placeholder="e.g. Kumasi"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </div>
        </div>

        {/* Registration */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Registration</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registered by (staff)</label>
              <input type="text" value={form.registered_by_name} onChange={e => setField('registered_by_name', e.target.value)}
                placeholder="Staff name…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registered from</label>
              <input type="date" value={form.date_from} onChange={e => setField('date_from', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registered to</label>
              <input type="date" value={form.date_to} onChange={e => setField('date_to', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
              <input type="date" value={form.date_of_birth} onChange={e => setField('date_of_birth', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </div>
        </div>

        {/* Financial
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Financial</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { key: 'daily_rate_min', label: 'Min daily rate (¢)', placeholder: '0' },
              { key: 'daily_rate_max', label: 'Max daily rate (¢)', placeholder: '999' },
              { key: 'balance_min',    label: 'Min balance (¢)',    placeholder: '0' },
              { key: 'balance_max',    label: 'Max balance (¢)',    placeholder: '9999' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type="number" min="0" value={(form as any)[key]} onChange={e => setField(key as keyof SearchParams, e.target.value)}
                  placeholder={placeholder}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            ))}
          </div>
        </div> */}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <button type="submit" disabled={customerLoading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-60">
            {customerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>
          <button type="button" onClick={handleClear}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Clear
          </button>
          {hasSearched && (
            <span className="text-sm text-gray-500">
              {paginationMeta.total} client{paginationMeta.total !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
      </form>

      {/* ── Stats (only shown after a search) ─────────────────────────────── */}
      {hasSearched && userPermissions.VIEW_BRIEFING && customers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* ... same stat cards as before, using pageStats ... */}
        </div>
      )}

      {/* ── Results Table ────────────────────────────────────────────────── */}
      {hasSearched && (
        <>
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{customers.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{paginationMeta.total}</span> results
              {paginationMeta.totalPages > 1 && (
                <> · Page {currentPage} of {paginationMeta.totalPages}</>
              )}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                {/* Client */}
                <th onClick={() => handleSort('name')}
                  className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors">
                  <div className="flex items-center gap-2"><span>Client</span>{getSortIcon('name')}</div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Contact</th>
                {/* Balance */}
                <th onClick={() => handleSort('balance')}
                  className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors">
                  <div className="flex items-center gap-2"><span>Balance</span>{getSortIcon('balance')}</div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Location</th>
                {/* Join Date */}
                <th onClick={() => handleSort('date_joined')}
                  className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors">
                  <div className="flex items-center gap-2"><span>Join Date</span>{getSortIcon('date_joined')}</div>
                </th>
                {/* Daily Rate */}
                <th onClick={() => handleSort('daily_rate')}
                  className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors">
                  <div className="flex items-center gap-2"><span>Daily Rate</span>{getSortIcon('daily_rate')}</div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {/* Loading skeleton */}
              {customerLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sortedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium text-gray-500 mb-1">No clients found</p>
                    <p className="text-sm text-gray-400">
                      {'Try adjusting your filters or search terms'}
                    </p>
                    <button onClick={handleClear}
                        className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 underline">
                        Clear all filters
                      </button>
                    
                  </td>
                </tr>
              ) : (
                sortedCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => openInNewTab(customer.name, `clients/customer-details/${customer.id}`, Users)}
                    className="group hover:bg-blue-50/50 transition-all duration-200 cursor-pointer border-b border-gray-100 last:border-0"
                  >
                    {/* ── Client Info ───────────────────────────────────── */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="relative flex-shrink-0">
                          <div className="w-11 h-11 bg-gradient-to-br from-[#f4fff0] to-[#faffe7] rounded-full flex items-center justify-center shadow-md ring-2 ring-[#344a2e] group-hover:ring-indigo-300 transition-all">
                            <span className="text-[#344a2e] font-semibold text-sm">
                              {customer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                              {customer.name}
                            </span>
                            {parseFloat(customer.total_balance_across_all_accounts || '0') > 3000 && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full flex-shrink-0">
                                VIP
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            ID: {customer.account_number}
                          </p>
                          <p className="flex items-center text-xs text-gray-400 mt-0.5">
                            <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                            </svg>
                            <span className="truncate">{customer.registered_by_name}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ── Contact ───────────────────────────────────────── */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate max-w-[160px]" title={customer.email}>{customer.email}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {customer.phone_number}
                        </div>
                      </div>
                    </td>

                    {/* ── Balance & Status ──────────────────────────────── */}
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs text-gray-500 font-medium">Balance:</span>
                          <span className="text-base font-bold text-gray-900">
                            ¢{parseFloat(customer.total_balance_across_all_accounts || '0')
                                .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full
                          ${customer.status === 'Active'
                            ? 'bg-green-100 text-green-700 ring-1 ring-green-600/20'
                            : 'bg-red-100 text-red-700 ring-1 ring-red-600/20'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${customer.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                          {customer.status}
                        </span>
                      </div>
                    </td>

                    {/* ── Location ──────────────────────────────────────── */}
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm text-gray-700 font-medium">{customer.location || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-sm text-gray-600">{customer.gender}</span>
                        </div>
                      </div>
                    </td>

                    {/* ── Join Date ─────────────────────────────────────── */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(customer.date_of_registration).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {Math.floor(
                          (Date.now() - new Date(customer.date_of_registration).getTime()) / 86_400_000
                        )} days ago
                      </p>
                    </td>

                    {/* ── Daily Rate ────────────────────────────────────── */}
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center px-3 py-1.5 text-sm font-bold rounded-lg bg-gradient-to-r from-[#f4fff0] to-[#faffe7] text-[#344a2e] shadow-sm border border-[#344a2e]/20">
                        ¢{parseFloat(customer.daily_rate || '0').toFixed(2)}
                      </div>
                    </td>

                    {/* ── Actions ───────────────────────────────────────── */}
                    <td className="px-6 py-4">
                      {/* Desktop: reveal on hover */}
                      <div className="hidden md:flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={e => { e.stopPropagation(); setEditingClient(customer); }}
                          title="Edit"
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {userPermissions.DELETE_CUSTOMER && (
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteClick(customer); }}
                            title="Delete"
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`customer-details/${customer.id}`); }}
                          title="View details"
                          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Mobile: always visible */}
                      <div className="flex md:hidden items-center justify-end gap-1">
                        <button
                          onClick={e => { e.stopPropagation(); setEditingClient(customer); }}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {userPermissions.DELETE_CUSTOMER && (
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteClick(customer); }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>

          <Pagination meta={paginationMeta} currentPage={currentPage} loading={customerLoading} onPageChange={handlePageChange} />
        </>
      )}

      {/* ── Empty state (before first search) ───────────────────────────── */}
      {!hasSearched && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-16 text-center">
          <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-500 mb-1">Enter search criteria above</p>
          <p className="text-sm text-gray-400">Results will appear here after you submit</p>
        </div>
      )}

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