import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Search, Plus, Edit, Trash2, Filter, Users, TrendingUp,
  Calendar, Download, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { Customer, Account } from '../../data/mockData';
import { useStats } from '../../contexts/dashboard/DashboardStat';
import { useCustomers } from '../../contexts/dashboard/Customers';
import { ClientModal } from './Components/clientModal';
import { useNavigate } from 'react-router-dom';
import DeleteCustomerModal from '../../components/deleteComfirmationModal';
import { userPermissions } from '../../constants/appConstants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaginationMeta {
  total: number;
  totalPages: number;
  currentPage: number;
  isSearching: boolean;
}

// ─── Pagination Component ─────────────────────────────────────────────────────

interface PaginationProps {
  meta: PaginationMeta;
  currentPage: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ meta, currentPage, loading, onPageChange }) => {
  if (meta.isSearching || meta.totalPages <= 1) return null;

  const getPageNumbers = () => {
    const total = meta.totalPages;
    const current = currentPage;
    const delta = 2;
    const pages: (number | 'ellipsis')[] = [];

    const rangeStart = Math.max(2, current - delta);
    const rangeEnd = Math.min(total - 1, current + delta);

    pages.push(1);
    if (rangeStart > 2) pages.push('ellipsis');
    for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
    if (rangeEnd < total - 1) pages.push('ellipsis');
    if (total > 1) pages.push(total);

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Info */}
      <p className="text-sm text-gray-600 whitespace-nowrap">
        Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
        <span className="font-semibold text-gray-900">{meta.totalPages}</span>
        <span className="text-gray-400 mx-1">·</span>
        <span className="font-semibold text-gray-900">{meta.total}</span> total clients
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg
                     hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, i) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${i}`} className="w-9 text-center text-gray-400 text-sm">…</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                disabled={loading}
                className={`w-9 h-9 text-sm font-medium rounded-lg border transition-colors
                  ${page === currentPage
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  } disabled:cursor-not-allowed`}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= meta.totalPages || loading}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg
                     hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Clients: React.FC = () => {
  // ── Filter State ──────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm]       = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [staffFilter, setStaffFilter]     = useState('all');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [sortConfig, setSortConfig]       = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

  // ── Pagination State ──────────────────────────────────────────────────────
  const [currentPage, setCurrentPage]     = useState(1);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    total: 0, totalPages: 1, currentPage: 1, isSearching: false,
  });

  // ── Modal State ───────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal]         = useState(false);
  const [editingClient, setEditingClient]       = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting]             = useState(false);

  // ── Context / Router ──────────────────────────────────────────────────────
  const { customers, contextPaginationMeta, customerLoading, addCustomer, editCustomer, refreshCustomers, deleteCustomer } = useCustomers();
  const { stats } = useStats();
  const navigate  = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Filter options (derived from currently loaded page — good enough for dropdowns) ──
  const uniqueLocations = useMemo(() =>
    Array.from(new Set(customers.map(c => c.location).filter(Boolean))), [customers]);

  const uniqueStaff = useMemo(() =>
    Array.from(new Set(customers.map(c => c.registered_by_name).filter(Boolean))), [customers]);

  // ── Active filter check ───────────────────────────────────────────────────
  const hasActiveFilters = searchTerm !== '' || locationFilter !== 'all' ||
    staffFilter !== 'all' || statusFilter !== 'all' || dateRangeFilter !== 'all';

  // ── Fetch helper — sends all active filters to backend ───────────────────
  const doFetch = useCallback(async (page: number) => {
    const filters = {
      search:    searchTerm    || undefined,
      location:  locationFilter !== 'all' ? locationFilter : undefined,
      status:    statusFilter   !== 'all' ? statusFilter   : undefined,
      staff:     staffFilter    !== 'all' ? staffFilter    : undefined,
      dateRange: dateRangeFilter !== 'all' ? dateRangeFilter : undefined,
    };

    const meta = await refreshCustomers(String(page), 20, filters);
    console.log(`Meta: ${JSON.stringify(meta)}`)
    if (meta) {
      setPaginationMeta({
        total:       meta.total,
        totalPages:  meta.totalPages,
        currentPage: meta.page,
        isSearching: meta.isSearching ?? false,
      });
    }
  }, [searchTerm, locationFilter, statusFilter, staffFilter, dateRangeFilter, refreshCustomers]);

  // ── Debounce filter changes, reset to page 1 ─────────────────────────────
  useEffect(() => {
    setPaginationMeta(contextPaginationMeta)
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      doFetch(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, locationFilter, statusFilter, staffFilter, dateRangeFilter]);

  // ── Page change (no debounce needed) ─────────────────────────────────────
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    doFetch(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Sort (client-side on current page only) ───────────────────────────────
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp   className="h-4 w-4 text-indigo-600" />
      : <ArrowDown className="h-4 w-4 text-indigo-600" />;
  };

  const sortedCustomers = useMemo(() => {
    if (!sortConfig.key) return customers;
    return [...customers].sort((a, b) => {
      let av: any, bv: any;
      switch (sortConfig.key) {
        case 'name':
          av = a.name?.toLowerCase(); bv = b.name?.toLowerCase(); break;
        case 'balance':
          av = parseFloat(a.total_balance_across_all_accounts || '0');
          bv = parseFloat(b.total_balance_across_all_accounts || '0'); break;
        case 'daily_rate':
          av = parseFloat(a.daily_rate || '0');
          bv = parseFloat(b.daily_rate || '0'); break;
        case 'date_joined':
          av = new Date(a.date_of_registration).getTime();
          bv = new Date(b.date_of_registration).getTime(); break;
        default: return 0;
      }
      if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
      if (av > bv) return sortConfig.direction === 'asc' ?  1 : -1;
      return 0;
    });
  }, [customers, sortConfig]);

  // ── Stats (from current visible page) ─────────────────────────────────────
  const pageStats = useMemo(() => {
    const maleCount   = customers.filter(c => c.gender?.toLowerCase() === 'male').length;
    const femaleCount = customers.filter(c => c.gender?.toLowerCase() === 'female').length;
    const totalBalance = customers.reduce((s, c) =>
      s + (parseFloat(c.total_balance_across_all_accounts) || 0), 0);
    const avgDailyRate = customers.length > 0
      ? customers.reduce((s, c) => s + (parseFloat(c.daily_rate) || 0), 0) / customers.length
      : 0;
    const activeCount   = customers.filter(c => c.status?.toLowerCase() === 'active').length;
    const inactiveCount = customers.filter(c => c.status?.toLowerCase() === 'inactive').length;
    return { maleCount, femaleCount, totalBalance, avgDailyRate, activeCount, inactiveCount };
  }, [customers]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const clearFilters = () => {
    setSearchTerm(''); setLocationFilter('all'); setStaffFilter('all');
    setStatusFilter('all'); setDateRangeFilter('all');
  };

  const exportData = () => {
    const rows = [
      ['Name','Email','Phone','Account Number','Balance','Location','Registered By','Join Date','Daily Rate'],
      ...customers.map(c => [
        c.name, c.email, c.phone_number, c.account_number,
        c.total_balance_across_all_accounts, c.location,
        c.registered_by_name,
        new Date(c.date_of_registration).toLocaleDateString(),
        c.daily_rate,
      ]),
    ];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `clients_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleDeleteClick   = (c: Customer) => { setSelectedCustomer(c); setIsDeleteModalOpen(true); };
  const handleDeleteCancel  = () => { setIsDeleteModalOpen(false); setSelectedCustomer(null); };
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteCustomer(selectedCustomer?.customer_id);
      setIsDeleteModalOpen(false); setSelectedCustomer(null);
      doFetch(currentPage);
    } catch (e) { console.error(e); }
    finally { setIsDeleting(false); }
  };

  const handleAddClient = (newClient: Omit<Customer, 'id'>) => {
    const company   = JSON.parse(localStorage.getItem('susupro_company') || '{}');
    const client    = { ...newClient, company_id: company?.id };
    addCustomer(client, '');
    setShowAddModal(false);
    doFetch(1);
  };

  const handleEditClient = (updated: Customer) => {
    editCustomer(updated);
    if (!customerLoading) setEditingClient(null);
    doFetch(currentPage);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600">
            Manage your susu clients and their information
            {hasActiveFilters && (
              <span className="ml-2 text-sm text-indigo-600">
                ({paginationMeta.total} results)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportData}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm">
            <Download className="h-4 w-4 mr-2" /> Export
          </button>
          {userPermissions.CUSTOMER_CREATE && (
            <button onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center">
              <Plus className="h-5 w-5 mr-2" /> Add Customer
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Cards ────────────────────────────────────────────────────── */}
      {userPermissions.VIEW_BRIEFING && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{paginationMeta.total}</p>
                <div className="flex gap-3 mt-1">
                  <p className="text-xs text-gray-500">Active: {pageStats.activeCount}</p>
                  <p className="text-xs text-gray-500">Inactive: {pageStats.inactiveCount}</p>
                </div>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex gap-4">
                  <div><p className="text-xs text-gray-600">Males</p>   <p className="text-xl font-bold text-blue-600">{pageStats.maleCount}</p></div>
                  <div><p className="text-xs text-gray-600">Females</p> <p className="text-xl font-bold text-pink-600">{pageStats.femaleCount}</p></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Gender Distribution</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg"><Users className="h-6 w-6 text-green-600" /></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold text-blue-600">¢{pageStats.totalBalance.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Across all accounts</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg"><TrendingUp className="h-6 w-6 text-blue-600" /></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Daily Rate</p>
                <p className="text-2xl font-bold text-teal-600">¢{pageStats.avgDailyRate.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Per customer (this page)</p>
              </div>
              <div className="bg-teal-100 p-3 rounded-lg"><Calendar className="h-6 w-6 text-teal-600" /></div>
            </div>
          </div>
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or account number…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {customerLoading && searchTerm && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 animate-spin" />
            )}
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            {[
              { value: locationFilter,  setter: setLocationFilter,  label: 'All Locations', options: uniqueLocations.map(l => ({ v: l!, label: l! })) },
              { value: staffFilter,     setter: setStaffFilter,     label: 'All Staff',     options: uniqueStaff.map(s    => ({ v: s!, label: s! })) },
              { value: statusFilter,    setter: setStatusFilter,    label: 'All Statuses',  options: [{ v: 'Active', label: 'Active' }, { v: 'Inactive', label: 'Inactive' }] },
              { value: dateRangeFilter, setter: setDateRangeFilter, label: 'All Time',      options: [
                { v: 'last_week', label: 'Last Week' },
                { v: 'last_month', label: 'Last Month' },
                { v: 'last_3_months', label: 'Last 3 Months' },
                { v: 'this_year', label: 'This Year' },
              ]},
            ].map(({ value, setter, label, options }) => (
              <select
                key={label}
                value={value}
                onChange={e => setter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">{label}</option>
                {options.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
              </select>
            ))}

            {hasActiveFilters && (
              <button onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-800 px-3 py-2 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors">
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Results Meta ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-600">
          {paginationMeta.isSearching ? (
            <>Showing all <span className="font-semibold text-gray-900">{customers.length}</span> matching results</>
          ) : (
            <>
              Showing <span className="font-semibold text-gray-900">{customers.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{paginationMeta.total}</span> clients
              <span className="text-gray-400 mx-1">·</span>
              Page {currentPage} of {paginationMeta.totalPages}
            </>
          )}
        </p>
        {sortConfig.key && (
          <p className="text-xs text-gray-500">
            Sorted by {sortConfig.key} ({sortConfig.direction === 'asc' ? 'ascending' : 'descending'})
          </p>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
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
                      {hasActiveFilters ? 'Try adjusting your filters or search terms' : 'Get started by adding your first client'}
                    </p>
                    {hasActiveFilters && (
                      <button onClick={clearFilters}
                        className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 underline">
                        Clear all filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                sortedCustomers.map((customer) => (
                  <tr
                    key={customer.customer_id}
                    onClick={() => navigate(`customer-details/${customer.customer_id}`)}
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
                            {parseFloat(customer.total_balance_across_all_accounts || '0') > 2000 && (
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
                          onClick={e => { e.stopPropagation(); navigate(`customer-details/${customer.customer_id}`); }}
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
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {paginationMeta.isSearching ? (
        <p className="text-sm text-center text-indigo-600 py-1">
          Showing all <span className="font-semibold">{customers.length}</span> matching results —{' '}
          <button onClick={clearFilters} className="underline hover:text-indigo-800">clear filters</button> to restore pagination
        </p>
      ) : (
        <Pagination
          meta={paginationMeta}
          currentPage={currentPage}
          loading={customerLoading}
          onPageChange={handlePageChange}
        />
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {(showAddModal || editingClient) && (
        <ClientModal
          account={{} as Account}
          client={editingClient}
          onSave={editingClient ? handleEditClient : handleAddClient}
          onClose={() => { setShowAddModal(false); setEditingClient(null); }}
        />
      )}
      {selectedCustomer && (
        <DeleteCustomerModal
          customer={selectedCustomer}
          isOpen={isDeleteModalOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          iscustomerLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default Clients;