import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Search, Plus, Trash2, Calendar, Filter, Download,
  PiggyBank, Eye, User, Undo2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { mockContributions, mockClients, Contribution, Transaction } from '../../data/mockData';
import { useTransactions } from '../../contexts/dashboard/Transactions';
import { useStats } from '../../contexts/dashboard/DashboardStat';
import { TransactionModal } from './Components/transactionModal';
import { useStaff } from '../../contexts/dashboard/Staff';
import DeleteTransactionModal from '../../components/deleteTransactionModal';
import toast from 'react-hot-toast';
import { useCustomers } from '../../contexts/dashboard/Customers';
import { userPermissions } from '../../constants/appConstants';
import { handlePdfExport } from '../../utils/helper';
import { useNavigate } from 'react-router-dom';

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

  const getPageNumbers = (): (number | 'ellipsis')[] => {
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
      <p className="text-sm text-gray-600 whitespace-nowrap">
        Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
        <span className="font-semibold text-gray-900">{meta.totalPages}</span>
        <span className="text-gray-400 mx-1">·</span>
        <span className="font-semibold text-gray-900">{meta.total}</span> total transactions
      </p>

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

const Contributions: React.FC = () => {
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [officeStaffFilter, setOfficeStaffFilter] = useState('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    isSearching: false,
  });

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState('');
  const [isDeleteTransactionModal, setIsDeleteTransactionModal] = useState(false);

  // Refs
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Context
  const { transactions, deleteTransaction, refreshTransactions, loading, contextPaginationMeta } = useTransactions();
  const { stats } = useStats();
  const { staffList } = useStaff();
  const { refreshCustomers } = useCustomers();
  const navigate = useNavigate();

  // ── Sync context pagination meta on mount ──────────────────────────────────
  useEffect(() => {
    if (contextPaginationMeta) {
      setPaginationMeta({
        total: contextPaginationMeta.total ?? 0,
        totalPages: contextPaginationMeta.totalPages ?? 1,
        currentPage: contextPaginationMeta.currentPage ?? 1,
        isSearching: contextPaginationMeta.isSearching ?? false,
      });
    }
  }, [contextPaginationMeta]);

  // ── Fetch (called on page change or filter change) ─────────────────────────
  const doFetch = useCallback(async (page: number) => {
     const filters = {
      search:    searchTerm    || undefined,
      status:    statusFilter   !== 'all' ? statusFilter   : undefined,
      staff:     officeStaffFilter    !== 'all' ? officeStaffFilter    : undefined,
      dateRange: dateRange !== 'all' ? dateRange : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
    console.log(filters);
    const meta = await refreshTransactions(String(page), 20, filters);
    console.log(`Meta ${JSON.stringify(meta)}`)
    if (meta) {
      setPaginationMeta({
        total: meta.total ?? 0,
        totalPages: meta.totalPages ?? 1,
        currentPage: meta.page ?? page,
        isSearching: meta.isSearching ?? false,
      });
    }
  }, [searchTerm, statusFilter, startDate, endDate, officeStaffFilter, dateRange, refreshTransactions]);

  // ── Debounce filter changes → reset to page 1 ─────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      doFetch(1);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, statusFilter, startDate, endDate, staffFilter, dateRange, officeStaffFilter, transactionTypeFilter]);

  // ── Page change ────────────────────────────────────────────────────────────
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    doFetch(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [doFetch]);

  // ── Client-side filtering (applied on top of server data) ─────────────────
  const filteredContributions = useMemo(() => {
    return transactions.filter(contribution => {
      const matchesSearch = contribution.customer_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || contribution.status === statusFilter;

      const matchesStaff =
        staffFilter === 'all' || contribution.mobile_banker_id === staffFilter;

      const matchesType =
        transactionTypeFilter === 'all' || contribution.type === transactionTypeFilter;

      const matchesOfficeStaff =
        officeStaffFilter === 'all' || contribution.recorded_staff_id === officeStaffFilter;

      let matchesDate = true;
      if (dateRange !== 'all') {
        const contributionDate = new Date(contribution.transaction_date);
        contributionDate.setHours(0, 0, 0, 0);

        if (dateRange === 'custom' && (startDate || endDate)) {
          const start = startDate ? new Date(startDate) : new Date('1900-01-01');
          start.setHours(0, 0, 0, 0);
          const end = endDate ? new Date(endDate) : new Date();
          end.setHours(23, 59, 59, 999);
          matchesDate = contributionDate >= start && contributionDate <= end;
        } else {
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const diffTime = now.getTime() - contributionDate.getTime();
          const daysDiff = Math.floor(diffTime / (1000 * 3600 * 24));

          switch (dateRange) {
            case 'today':    matchesDate = daysDiff === 0; break;
            case 'week':     matchesDate = daysDiff >= 0 && daysDiff < 7; break;
            case 'month':    matchesDate = daysDiff >= 0 && daysDiff < 30; break;
            case 'quarter':  matchesDate = daysDiff >= 0 && daysDiff < 90; break;
            case 'year':     matchesDate = daysDiff >= 0 && daysDiff < 365; break;
          }
        }
      }

      return matchesSearch && matchesStatus && matchesStaff && matchesDate && matchesType && matchesOfficeStaff;
    });
  }, [transactions, searchTerm, statusFilter, staffFilter, transactionTypeFilter, officeStaffFilter, dateRange, startDate, endDate]);

  // ── Filtered stats ─────────────────────────────────────────────────────────
  const filteredStats = useMemo(() => {
    const completed = filteredContributions.filter(c => c.status === 'completed');
    const pending   = filteredContributions.filter(c => c.status === 'pending');

    const totalAmount   = completed.reduce((sum, c) => sum + Number(c.amount), 0);
    const pendingAmount = pending.reduce((sum, c) => sum + Number(c.amount), 0);
    const totalDeposits = filteredContributions
      .filter(c => c.type === 'deposit')
      .reduce((sum, c) => sum + Number(c.amount), 0);
    const averageAmount = completed.length > 0 ? totalAmount / completed.length : 0;

    return {
      totalAmount,
      pendingAmount,
      totalDeposits,
      averageAmount,
      transactionCount: filteredContributions.length,
      completedCount: completed.length,
    };
  }, [filteredContributions]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id'>) => {
    setShowAddModal(false);
    setEditingTransaction(null);
  };

  const handleEditTransaction = (_updated: Transaction) => {
    setEditingTransaction(null);
  };

  const handleDeleteClick = (transaction_id: string) => {
    setSelectedTransaction(transaction_id);
    setIsDeleteTransactionModal(true);
  };

  const handleDeleteCancel = () => {
    setSelectedTransaction('');
    setIsDeleteTransactionModal(false);
  };

  const handleDeleteConfirm = async (transactionId: string) => {
    setIsDeleting(true);
    const toastId = toast.loading('Deleting transaction…');
    try {
      const res = await deleteTransaction(transactionId);
      if (res) {
        setIsDeleteTransactionModal(false);
        setSelectedTransaction('');
        await refreshCustomers();
        toast.success('Transaction deleted successfully', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete transaction', { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setStaffFilter('all');
    setTransactionTypeFilter('all');
    setOfficeStaffFilter('all');
    setDateRange('all');
    setStartDate('');
    setEndDate('');
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending':   return 'bg-yellow-100 text-yellow-800';
      case 'failed':    return 'bg-red-100 text-red-800';
      case 'approved':  return 'bg-blue-100 text-blue-800';
      default:          return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeColor = (type: string) =>
    type === 'withdrawal' ? 'text-red-500' : 'text-green-500';

  const formatMethod = (method: string) => {
    switch (method) {
      case 'bank_transfer': return 'Bank Transfer';
      case 'mobile_money':  return 'Mobile Money';
      case 'cash':          return 'Cash';
      case 'deposit':       return 'Deposit';
      case 'withdrawal':    return 'Withdrawal';
      case 'commission':    return 'Commission';
      default:              return method;
    }
  };

  const getStaffName = (staffId: string) => {
    const staff = staffList.find(s => s.id === staffId);
    return staff ? staff.full_name : 'Unknown Staff';
  };

  const eligibleStaff = staffList.filter(s => {
    const role = s.role?.toLowerCase() ?? '';
    return role === 'teller' || role === 'mobile_banker' || role === 'mobile banker' || role === 'accountant';
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contributions</h1>
          <p className="text-gray-600">
            Track and manage all client contributions
            {filteredContributions.length !== transactions.length && (
              <span className="text-indigo-600 ml-2">
                ({filteredContributions.length} of {transactions.length} showing)
              </span>
            )}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
            onClick={() => handlePdfExport(filteredContributions)}
          >
            <Download className="h-5 w-5 mr-2" />
            Export
          </button>
          {userPermissions.PROCESS_TRANSACTIONS && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Log Contribution
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Cards ── */}
      {userPermissions.VIEW_BRIEFING && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall received deposits</p>
                <p className="text-2xl font-bold text-green-600">¢{filteredStats.totalAmount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{filteredStats.completedCount} transactions</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <PiggyBank className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total amounts due</p>
                <p className="text-2xl font-bold text-blue-600">¢{stats?.totalBalance.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Filtered period</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">¢{filteredStats.pendingAmount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Eye className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Amount</p>
                <p className="text-2xl font-bold text-teal-600">¢{Math.round(filteredStats.averageAmount).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Per transaction</p>
              </div>
              <div className="bg-teal-100 p-3 rounded-lg">
                <PiggyBank className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </h3>
          <button
            onClick={clearFilters}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Client</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by client name…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Staff Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Staff</label>
            <select
              value={officeStaffFilter}
              onChange={e => setOfficeStaffFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Staff</option>
              {eligibleStaff.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.full_name}{staff.staff_id ? ` (${staff.staff_id})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={transactionTypeFilter}
              onChange={e => setTransactionTypeFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="commission">Commission</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateRange === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center py-6 border-b border-gray-100">
            <div className="h-5 w-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mr-2" />
            <span className="text-sm text-gray-500">Loading transactions…</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredContributions.length > 0 ? (
                filteredContributions.map(contribution => {
                  const isDeleted = contribution.is_deleted;
                  return (
                    <tr
                      key={contribution.transaction_id}
                      className={`transition ${
                        isDeleted
                          ? 'bg-gray-100 text-gray-400 opacity-70'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Customer */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDeleted ? 'bg-gray-200' : 'bg-indigo-100'}`}>
                            <span
                              className={`font-medium text-sm cursor-pointer ${isDeleted ? 'text-gray-400' : 'text-indigo-600'}`}
                              onClick={() => navigate(`/dashboard/clients/customer-details/${contribution.customer_id}`)}
                            >
                              {contribution.customer_name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium">{contribution.customer_name}</div>
                            <div className="text-xs text-gray-400">
                              Assigned Banker:{' '}
                              {contribution.mobile_banker_id
                                ? getStaffName(contribution.mobile_banker_id)
                                : 'Unassigned'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-lg font-semibold ${getTransactionTypeColor(contribution.type)}`}>
                          {contribution.type === 'withdrawal' ? '-' : '+'}¢{Number(contribution.amount).toLocaleString()}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(contribution.transaction_date).toLocaleDateString()}
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isDeleted ? 'opacity-60' : ''} ${getTransactionTypeColor(contribution.type || contribution.status)}`}>
                          {formatMethod(contribution.type || contribution.status)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contribution.status)}`}>
                          {contribution.status}
                        </span>
                        {isDeleted && (
                          <span className="ml-2 inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-300 text-gray-700">
                            Reversed
                          </span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="px-6 py-4 text-sm max-w-xs truncate">
                        {contribution.description ? (
                          <div>
                            <p>{contribution.description}</p>
                            <div className="text-[11px] flex mt-0.5">
                              <p className="mr-1">Recorded by</p>
                              <span className="font-semibold">
                                {getStaffName(contribution.recorded_staff_id ?? '')}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span>
                            Recorded by{' '}
                            <span className="font-semibold">
                              {getStaffName(contribution.recorded_staff_id ?? '')}
                            </span>
                          </span>
                        )}
                      </td>

                      {/* Actions — show Reverse button for users WITH PROCESS_TRANSACTIONS permission */}
                      <td className="px-6 py-4">
                        {userPermissions.PROCESS_TRANSACTIONS && (
                          <div
                            className={`flex items-center gap-1 ${
                              isDeleted ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                            }`}
                            onClick={() => {
                              if (!isDeleted) handleDeleteClick(contribution.transaction_id);
                            }}
                          >
                            <Undo2 className={`h-4 w-4 ${isDeleted ? 'text-gray-400' : 'text-red-600'}`} />
                            <span className={`text-sm font-medium ${isDeleted ? 'text-gray-400' : 'text-red-600'}`}>
                              Reverse
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Search className="h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No contributions found</h3>
                      <p className="text-gray-500">Try adjusting your filters to see more results.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      <Pagination
        meta={paginationMeta}
        currentPage={currentPage}
        loading={loading}
        onPageChange={handlePageChange}
      />

      {/* ── Add / Edit Modal ── */}
      {showAddModal && (
        <TransactionModal
          transaction={editingTransaction}
          onSave={editingTransaction ? handleEditTransaction : handleAddTransaction}
          onClose={() => {
            setShowAddModal(false);
            setEditingTransaction(null);
          }}
        />
      )}

      {/* ── Delete / Reverse Modal ── */}
      {isDeleteTransactionModal && (
        <DeleteTransactionModal
          transaction_id={selectedTransaction}
          isOpen={isDeleteTransactionModal}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default Contributions;