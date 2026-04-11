import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, CheckCircle, XCircle, Clock, Eye, Filter,
  Undo2, ChevronLeft, ChevronRight, Users, Calendar,
  DollarSign, Phone, Banknote, Smartphone, Landmark,
  AlertCircle, RefreshCw, UserCheck, UserX, Send,
  Printer, Download, MoreVertical,
  CreditCard,
} from 'lucide-react';
import { Commission } from '../../data/mockData';
import { useStats } from '../../contexts/dashboard/DashboardStat';
import { TransactionType, useTransactions } from '../../contexts/dashboard/Transactions';
import { toast } from 'react-hot-toast';
import {
  companyId, companyName, makeSuSuProName,
  parentCompanyName, userPermissions, userUUID,
} from '../../constants/appConstants';
import { CommissionModal } from '../../components/financeModals';
import { FormDataState } from './Finance';
import { useCommissionStats } from '../../contexts/dashboard/Commissions';
import { useAccounts } from '../../contexts/dashboard/Account';
import { useTabContext } from '../../layouts/DashboardLayout';
import { useStaff } from '../../contexts/dashboard/Staff';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PaginationMeta {
  total: number;
  totalPages: number;
  currentPage: number;
}

interface FilterState {
  search: string;
  status: string;
  paymentMethod: string;
  dateRange: string;
  withdrawalType: string;
}

// ─── Payment Method Icons ─────────────────────────────────────────────────────

const getPaymentMethodIcon = (method: string) => {
  switch (method?.toLowerCase()) {
    case 'momo':
      return <Smartphone className="h-3.5 w-3.5" />;
    case 'bank':
      return <Landmark className="h-3.5 w-3.5" />;
    case 'cash':
      return <Banknote className="h-3.5 w-3.5" />;
    default:
      return <CreditCard className="h-3.5 w-3.5" />;
  }
};

const getPaymentMethodColor = (method: string) => {
  switch (method?.toLowerCase()) {
    case 'momo':
      return 'bg-purple-100 text-purple-700';
    case 'bank':
      return 'bg-blue-100 text-blue-700';
    case 'cash':
      return 'bg-emerald-100 text-emerald-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

// ─── Pagination Component ─────────────────────────────────────────────────────

interface PaginationProps {
  meta: PaginationMeta;
  currentPage: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ meta, currentPage, loading, onPageChange }) => {
  if (meta.totalPages <= 1) return null;

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
        <span className="font-semibold text-gray-900">{meta.total}</span> total withdrawals
      </p>

      <div className="flex items-center gap-1">
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

// ─── Stats Card Component ─────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`${color.replace('text', 'bg')} bg-opacity-10 p-3 rounded-lg`}>
        {icon}
      </div>
    </div>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────────

const Withdrawals: React.FC = () => {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    paymentMethod: 'all',
    dateRange: 'all',
    withdrawalType: 'all',
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // ── Pagination state ──────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    total: 0,
    totalPages: 1,
    currentPage: 1,
  });

  // ── Commission modal state ─────────────────────────────────────────────────
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionData, setCommissionData] = useState<TransactionType | undefined>();
  const [commissionTransactionId, setCommissionTransactionId] = useState('');
  const [commissionFormData, setCommissionFormData] = useState<FormDataState>({ amount: 0 });
  const { openInNewTab } = useTabContext();
  
  // ── Action locks ─────────────────────────────────────────────────────────
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  
  const { dashboardStaffList } = useStaff();
  
  // ── Debounce ref ──────────────────────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Context ───────────────────────────────────────────────────────────────
  const { stats } = useStats();
  const {
    withdrawals,
    fetchWithdrawals,
    approveTransaction,
    rejectTransaction,
    reverseTransaction,
    deductCommission,
    sendMessage,
    loading,
  } = useTransactions();
  const { refreshCommissionStats } = useCommissionStats();
  const { refreshAccounts } = useAccounts();

  // ── Core fetch — page + filters passed explicitly ──────────────────────
  const doFetch = useCallback(
    async (page: number, currentFilters: FilterState) => {
      const apiFilters: any = {
        search: currentFilters.search || undefined,
        status: currentFilters.status !== 'all' ? currentFilters.status : undefined,
        payment_method: currentFilters.paymentMethod !== 'all' ? currentFilters.paymentMethod : undefined,
        withdrawal_type: currentFilters.withdrawalType !== 'all' ? currentFilters.withdrawalType : undefined,
      };
      
      // Handle date range
      if (currentFilters.dateRange !== 'all') {
        const now = new Date();
        const startDate = new Date();
        switch (currentFilters.dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            startDate.setMonth(now.getMonth() - 3);
            break;
        }
        apiFilters.start_date = startDate.toISOString();
        apiFilters.end_date = now.toISOString();
      }
      
      const meta = await fetchWithdrawals(String(page), 20, apiFilters);
      if (meta) {
        setPaginationMeta({
          total: meta.total ?? 0,
          totalPages: meta.totalPages ?? 1,
          currentPage: meta.page ?? page,
        });
      }
    },
    [fetchWithdrawals],
  );

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    doFetch(1, filters);
  }, []);

  // ── Debounce filter changes ───────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      doFetch(1, filters);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filters.search, filters.status, filters.paymentMethod, filters.dateRange, filters.withdrawalType]);

  // ── Page change ───────────────────────────────────────────────────────────
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      doFetch(page, filters);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [doFetch, filters],
  );

  // ── Apply filters to displayed withdrawals ────────────────────────────────
  const filteredWithdrawals = withdrawals.filter(w => {
    // Search filter
    if (filters.search && !w.customer_name?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !w.description?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !w.unique_code?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !w.account_number?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (filters.status !== 'all' && w.status !== filters.status) return false;
    
    // Payment method filter
    if (filters.paymentMethod !== 'all' && w.payment_method !== filters.paymentMethod) return false;
    
    // Withdrawal type filter
    if (filters.withdrawalType !== 'all' && w.withdrawal_type !== filters.withdrawalType) return false;
    
    return true;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const approvedWithdrawals = withdrawals.filter(w => w.status === 'approved' || w.status === 'completed');
  const totalPendingAmount = pendingWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
  const totalApprovedAmount = approvedWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

  const now = new Date();
  const approvedWithdrawalsThisMonth = withdrawals.filter(w => {
    const date = new Date(w.transaction_date);
    return (
      (w.status === 'approved' || w.status === 'completed') &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });

  // ── Approve ───────────────────────────────────────────────────────────────
  const handleApproveClick = async (
    withdrawalId: string,
    withdrawalType: string,
    customerPhone: string,
    customerName: string,
    withdrawalAmount: string,
    customerId: string,
    accountId: string,
    accountType: string,
    accountNumber: string,
  ) => {
    if (isApproving) return;
    setIsApproving(true);
    const toastId = toast.loading('Approving transaction...');
    const tellers = dashboardStaffList?.filter(staff => staff.role === "teller");
    
    try {
      const approvalSuccess = await approveTransaction(
        withdrawalId,
        {
          messageTo: customerPhone,
          message: `Hello ${customerName}, you have withdrawn an amount of GHS${withdrawalAmount}`,
          messageFrom: makeSuSuProName(parentCompanyName),
        },
        customerId,
        accountId,
        customerPhone,
        withdrawalAmount,
        accountType,
        accountNumber,
        tellers?.find(teller => teller.id === ''),
      );

      if (approvalSuccess) {
        toast.success('Transaction approved successfully!', { id: toastId });
        setCommissionTransactionId(withdrawalId);

        const updatedAccounts = await refreshAccounts(customerId);
        const newAccountBalance = updatedAccounts?.find((a: any) => a.id === accountId)?.balance;

        const finalMessageData = {
          messageTo: customerPhone,
          message: `An amount of GHS${withdrawalAmount} has been debited from your ${accountNumber} ${accountType} account. Your new balance is GHS${newAccountBalance}`,
          messageFrom: makeSuSuProName(parentCompanyName),
        };
        sendMessage(finalMessageData).catch(err =>
          console.warn('Message sending failed but transaction was approved:', err),
        );

        if (withdrawalType === 'commission') {
          setShowCommissionModal(true);
        }
        
        // Refresh data
        doFetch(currentPage, filters);
      } else {
        toast.error('Failed to approve transaction', { id: toastId });
      }
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('An unexpected error occurred', { id: toastId });
    } finally {
      setIsApproving(false);
    }
  };

  // ── Reject ────────────────────────────────────────────────────────────────
  const handleReject = async (withdrawalId: string, withdrawal: TransactionType) => {
    if (isRejecting) return;
    
    // Custom confirmation dialog
    const userConfirmed = window.confirm(
      `Are you sure you want to reject this withdrawal request for ${withdrawal.customer_name}?\n\nAmount: GHS${Number(withdrawal.amount).toLocaleString()}\n\nThis action cannot be undone.`
    );
    
    if (!userConfirmed) return;
    
    setIsRejecting(true);
    const toastId = toast.loading('Rejecting transaction...');
    try {
      await rejectTransaction(withdrawalId);
      toast.success(`Withdrawal for ${withdrawal.customer_name} rejected`, { id: toastId });
      doFetch(currentPage, filters);
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject transaction', { id: toastId });
    } finally {
      setIsRejecting(false);
    }
  };

  // ── Finalize ──────────────────────────────────────────────────────────────
  const handleFinalize = async (withdrawalId: string) => {
    if (isFinalizing) return;
    
    setIsFinalizing(true);
    const toastId = toast.loading('Finalizing transaction...');
    try {
      // Add finalization logic here
      toast.success('Transaction finalized successfully', { id: toastId });
      doFetch(currentPage, filters);
    } catch (error) {
      console.error('Finalization error:', error);
      toast.error('Failed to finalize transaction', { id: toastId });
    } finally {
      setIsFinalizing(false);
    }
  };

  // ── Reverse ───────────────────────────────────────────────────────────────
  const handleReverse = async (withdrawalId: string, customerName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to reverse this withdrawal for ${customerName}?\n\nThis will restore the amount to the customer's account.`
    );
    
    if (!confirmed) return;
    
    const toastId = toast.loading('Reversing transaction...');
    try {
      await reverseTransaction(userUUID, withdrawalId, 'Wrong amount paid');
      await refreshCommissionStats();
      toast.success('Transaction reversed successfully', { id: toastId });
      doFetch(currentPage, filters);
    } catch (error) {
      console.error('Reversal error:', error);
      toast.error('Failed to reverse transaction', { id: toastId });
    }
  };

  // ── Commission submit ─────────────────────────────────────────────────────
  const submitCommission = async (formData: FormDataState, transactionId: string, companyId: string) => {
    const toastId = toast.loading('Adding commission...');
    try {
      const newCommissionData = {
        account_id: commissionData?.account_id,
        amount: formData.amount,
        created_by: userUUID === companyId ? companyId : userUUID,
        created_by_type: userUUID === companyId ? 'company' : 'staff',
        company_id: companyId,
        transaction_id: transactionId,
      };
      const res = await deductCommission(newCommissionData as Commission, commissionData);
      if (res) {
        toast.success('Commission added successfully', { id: toastId });
        doFetch(currentPage, filters);
      } else {
        toast.error('Error adding commission', { id: toastId });
      }
    } catch (error) {
      toast.error('Failed to add commission', { id: toastId });
    } finally {
      setShowCommissionModal(false);
    }
  };

  // ── Export functionality ──────────────────────────────────────────────────
  const handleExport = () => {
    const exportData = filteredWithdrawals.map(w => ({
      'Customer Name': w.customer_name,
      'Amount': w.amount,
      'Payment Method': w.payment_method || 'N/A',
      'Status': w.status,
      'Processing Status': w.processing_status || 'N/A',
      'Request Date': new Date(w.transaction_date).toLocaleString(),
      'Account Number': w.account_number,
      'Withdrawal Type': w.withdrawal_type || 'N/A',
    }));
    
    const csv = [
      Object.keys(exportData[0] || {}).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `withdrawals_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  // ── Reset filters ─────────────────────────────────────────────────────────
  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      paymentMethod: 'all',
      dateRange: 'all',
      withdrawalType: 'all',
    });
    setCurrentPage(1);
    doFetch(1, {
      search: '',
      status: 'all',
      paymentMethod: 'all',
      dateRange: 'all',
      withdrawalType: 'all',
    });
    toast.success('Filters reset');
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':   return 'bg-yellow-100 text-yellow-800';
      case 'approved':  return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected':  return 'bg-red-100 text-red-800';
      case 'reversed':  return 'bg-orange-100 text-orange-800';
      default:          return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':  return <CheckCircle className="h-4 w-4" />;
      case 'rejected':   return <XCircle className="h-4 w-4" />;
      default:           return <Clock className="h-4 w-4" />;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Withdrawals</h1>
          <p className="text-gray-600">Manage and process client withdrawal requests</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => doFetch(currentPage, filters)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      {userPermissions.VIEW_BRIEFING && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Pending Requests"
            value={pendingWithdrawals.length}
            icon={<Clock className="h-6 w-6 text-yellow-600" />}
            color="text-yellow-600"
            subtitle="Awaiting approval"
          />
          <StatCard
            title="Pending Amount"
            value={`¢${totalPendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<DollarSign className="h-6 w-6 text-yellow-600" />}
            color="text-yellow-600"
          />
          <StatCard
            title="Approved This Month"
            value={approvedWithdrawalsThisMonth.length}
            icon={<CheckCircle className="h-6 w-6 text-green-600" />}
            color="text-green-600"
          />
          <StatCard
            title="Total Approved"
            value={`¢${totalApprovedAmount.toLocaleString()}`}
            icon={<Eye className="h-6 w-6 text-green-600" />}
            color="text-green-600"
          />
        </div>
      )}

      {/* ── Filters Section ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col gap-4">
          {/* Primary filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by name, code, account number or reason..."
                  value={filters.search}
                  onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filters.status}
                onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="reversed">Reversed</option>
              </select>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors
                  ${showAdvancedFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              <button
                onClick={resetFilters}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Advanced filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Payment Method</label>
                <select
                  value={filters.paymentMethod}
                  onChange={e => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="all">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="momo">Mobile Money</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Withdrawal Type</label>
                <select
                  value={filters.withdrawalType}
                  onChange={e => setFilters(prev => ({ ...prev, withdrawalType: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="advance">Advance</option>
                  <option value="commission">Commission</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={e => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="quarter">Last 90 Days</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Results count ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-900">{filteredWithdrawals.length}</span> of{' '}
          <span className="font-semibold text-gray-900">{withdrawals.length}</span> withdrawals
        </p>
      </div>

      {/* ── Loading state ── */}
      {loading && (
        <div className="flex items-center justify-center py-8 bg-white border border-gray-200 rounded-xl">
          <div className="h-6 w-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mr-3" />
          <span className="text-sm text-gray-500">Loading withdrawals…</span>
        </div>
      )}

      {/* ── Table ── */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Request Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Processing</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredWithdrawals.length > 0 ? (
                  filteredWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.transaction_id} className="hover:bg-gray-50 transition-colors group">
                      {/* Client */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div 
                            onClick={() =>
                              openInNewTab(
                                withdrawal.customer_name,
                                `/dashboard/clients/customer-details/${withdrawal.customer_id}`,
                                Users
                              )
                            }
                            className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center shrink-0 cursor-pointer hover:from-indigo-200 hover:to-indigo-300 transition-all"
                          >
                            <span className="text-indigo-700 font-semibold text-sm">
                              {withdrawal.customer_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-semibold text-gray-900">
                              {withdrawal.customer_name}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {withdrawal.account_number}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {withdrawal.recorded_staff_name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <div className="text-base font-bold text-gray-900">
                          ¢{Number(withdrawal.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {withdrawal.withdrawal_type && (
                          <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mt-1 ${
                            withdrawal.withdrawal_type === 'commission' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {withdrawal.withdrawal_type}
                          </span>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${getPaymentMethodColor(withdrawal.payment_method)}`}>
                          {getPaymentMethodIcon(withdrawal.payment_method)}
                          {withdrawal.payment_method || "CASH"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(withdrawal.transaction_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(withdrawal.transaction_date).toLocaleTimeString()}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(withdrawal.status)}`}>
                          {getStatusIcon(withdrawal.status)}
                          {withdrawal.status}
                        </span>
                      </td>

                      {/* Processing Status */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                            withdrawal.processing_status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : withdrawal.processing_status === "sent"
                              ? "bg-green-100 text-green-700"
                              : withdrawal.processing_status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {withdrawal.processing_status === "pending" && <Clock className="h-3 w-3" />}
                            {withdrawal.processing_status === "sent" && <Send className="h-3 w-3" />}
                            {withdrawal.processing_status || "N/A"}
                          </span>
                          {withdrawal.payment_reference && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              Ref: {withdrawal.payment_reference.slice(0, 8)}...
                            </span>
                          )}
                          {withdrawal.processed_at && (
                            <span className="text-[10px] text-gray-400">
                              {new Date(withdrawal.processed_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        {/* Pending - Show Approve/Reject */}
                        {withdrawal.status === "pending" && withdrawal.processing_status === "sent" && (
                          <div className="flex gap-2">
                            <button
                              disabled={isApproving}
                              onClick={() => {
                                setCommissionData(withdrawal);
                                handleApproveClick(
                                  withdrawal.transaction_id,
                                  withdrawal.withdrawal_type,
                                  withdrawal.customer_phone,
                                  withdrawal.customer_name,
                                  withdrawal.amount.toLocaleString(),
                                  withdrawal.customer_id,
                                  withdrawal.account_id,
                                  withdrawal.account_type,
                                  withdrawal.account_number
                                );
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Approve
                            </button>
                            <button
                              disabled={isRejecting}
                              onClick={() => handleReject(withdrawal.transaction_id, withdrawal)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </div>
                        )}

                        {/* Approved & Waiting for agent - Show Reject (but not Approve) */}
                        {withdrawal.status === "pending" && withdrawal.processing_status === "pending" && (
                          <div className="flex flex-col gap-2">
                            <span className="inline-flex items-center gap-1 text-yellow-600 text-xs font-medium bg-yellow-50 px-2 py-1 rounded-full">
                              <Clock className="h-3 w-3" />
                              Waiting for agent
                            </span>
                            <button
                              disabled={isRejecting}
                              onClick={() => handleReject(withdrawal.transaction_id, withdrawal)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </div>
                        )}

                        {/* Approved & Sent - Show Finalize */}
                        {/* {withdrawal.status === "approved" && withdrawal.processing_status === "sent" && (
                          <button
                            disabled={isFinalizing}
                            onClick={() => handleFinalize(withdrawal.transaction_id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Finalize
                          </button>
                        )} */}

                        {/* Completed - Show Reverse */}
                        {withdrawal.status === "approved" && userPermissions?.MANAGE_CASHACCOUNTS && (
                          <button
                            onClick={() => handleReverse(withdrawal.transaction_id, withdrawal.customer_name)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors"
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                            Reverse
                          </button>
                        )}

                        {/* Rejected/Reversed - Show nothing or view details */}
                        {withdrawal.status === "approved" && withdrawal.processing_status === "sent" && !userPermissions?.MANAGE_CASHACCOUNTS && (
                          <span className="text-xs text-gray-400">No actions available</span>
                        )}
                        {(withdrawal.status === "rejected" || withdrawal.status === "reversed") && (
                          <span className="text-xs text-gray-400">No actions available</span>
                        )}
                       </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <XCircle className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No withdrawals found
                        </h3>
                        <p className="text-gray-500">
                          {filters.search || filters.status !== 'all' || filters.paymentMethod !== 'all'
                            ? "Try adjusting your filters to see more results"
                            : "No withdrawal requests available at this time"}
                        </p>
                        {(filters.search || filters.status !== 'all' || filters.paymentMethod !== 'all') && (
                          <button
                            onClick={resetFilters}
                            className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                          >
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && filteredWithdrawals.length > 0 && (
        <Pagination
          meta={paginationMeta}
          currentPage={currentPage}
          loading={loading}
          onPageChange={handlePageChange}
        />
      )}

      {/* ── Commission Modal ── */}
      {showCommissionModal && (
        <CommissionModal
          show={showCommissionModal}
          onClose={() => setShowCommissionModal(false)}
          onSubmit={formData => submitCommission(formData, commissionTransactionId, companyId)}
          formData={commissionFormData}
          onFormChange={(field, value) =>
            setCommissionFormData(prev => ({ ...prev, [field]: value }))
          }
          loading={loading}
        />
      )}
    </div>
  );
};

export default Withdrawals;