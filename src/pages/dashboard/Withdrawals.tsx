import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, CheckCircle, XCircle, Clock, Eye, Filter,
  Undo2, ChevronLeft, ChevronRight,
  Users,
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

// ─── Pagination Component ───────────────────────────────────────────────────────

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

// ─── Main Component ─────────────────────────────────────────────────────────────

const Withdrawals: React.FC = () => {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
  // ── Approval lock ─────────────────────────────────────────────────────────
  const [isApproving, setIsApproving] = useState(false);
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

  // ── Core fetch — page + filters passed explicitly (no stale closure) ──────
  const doFetch = useCallback(
    async (page: number, search: string, status: string) => {
      const filters = {
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
      };
      const meta = await fetchWithdrawals(String(page), 20, filters);
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
    doFetch(1, '', 'all');
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounce filter changes ───────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      doFetch(1, searchTerm, statusFilter);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Page change ───────────────────────────────────────────────────────────
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      doFetch(page, searchTerm, statusFilter);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [doFetch, searchTerm, statusFilter],
  );

  // ── Client-side filter (on top of server page) ────────────────────────────
  const filteredWithdrawals = withdrawals.filter(w => {
    const matchesSearch =
      w.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.unique_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const pendingWithdrawals     = withdrawals.filter(w => w.status === 'pending');
  const approvedWithdrawals    = withdrawals.filter(w => w.status === 'approved' || w.status === 'completed');
  const totalPendingAmount     = pendingWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
  const totalApprovedAmount    = approvedWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

  const now = new Date();
  const approvedWithdrawalsThisMonth = withdrawals.filter(w => {
    const date = new Date(w.transaction_date);
    return (
      w.status === 'approved' &&
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
    const tellers = dashboardStaffList?.filter(
    (staff) => staff.role === "teller"
  );
    try {
      const approvalSuccess = await approveTransaction(
        withdrawalId,
        {
          messageTo: customerPhone,
          message: `Hello ${customerName} you have withdrawn an amount of GHS${withdrawalAmount}`,
          messageFrom: makeSuSuProName(parentCompanyName),
        },
        customerId,
        accountId,
        customerPhone,
        withdrawalAmount,
        accountType,
        accountNumber,
        teller_id,
      );

      if (approvalSuccess) {
        toast.success('Transaction approved successfully!', { id: toastId });

        setCommissionTransactionId(withdrawalId);

        // Refresh accounts and get new balance
        const updatedAccounts = await refreshAccounts(customerId);
        const newAccountBalance = updatedAccounts?.find((a: any) => a.id === accountId)?.balance;

        // Send balance notification (non-blocking)
        const finalMessageData = {
          messageTo: customerPhone,
          message: `An amount of GHS${withdrawalAmount} has been debited from your ${accountNumber} ${accountType} account. Your new balance is GHS${newAccountBalance}`,
          messageFrom: makeSuSuProName(parentCompanyName),
        };
        sendMessage(finalMessageData).catch(err =>
          console.warn('Message sending failed but transaction was approved:', err),
        );

        // Show commission modal for commission-type withdrawals
        if (withdrawalType === 'commission') {
          setShowCommissionModal(true);
        }
      } else {
        toast.error('Failed to approve transaction', { id: toastId });
      }
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('An unexpected error occurred', { id: toastId });
    } finally {
      // ✅ Always release the lock — was missing in the original
      setIsApproving(false);
    }
  };

  // ── Reject ────────────────────────────────────────────────────────────────
  const handleReject = async (withdrawalId: string) => {
    if (!window.confirm('Are you sure you want to reject this withdrawal request?')) return;
    const toastId = toast.loading('Rejecting transaction...');
    try {
      await rejectTransaction(withdrawalId);
      toast.success('Transaction rejected', { id: toastId });
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject transaction', { id: toastId });
    }
  };

  // ── Reverse ───────────────────────────────────────────────────────────────
  const handleReverse = async (withdrawalId: string) => {
    const toastId = toast.loading('Reversing transaction...');
    try {
      await reverseTransaction(userUUID, withdrawalId, 'Wrong amount paid');
      await refreshCommissionStats();
      toast.success('Transaction reversed', { id: toastId });
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
      } else {
        toast.error('Error adding commission', { id: toastId });
      }
    } catch (error) {
      toast.error('Failed to add commission', { id: toastId });
    } finally {
      setShowCommissionModal(false);
    }
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
          <p className="text-gray-600">Manage client withdrawal requests</p>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      {userPermissions.VIEW_BRIEFING && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingWithdrawals.length}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ¢{totalPendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Eye className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved This Month</p>
                <p className="text-2xl font-bold text-green-600">{approvedWithdrawalsThisMonth.length}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Approved</p>
                <p className="text-2xl font-bold text-green-600">¢{totalApprovedAmount.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by code, client name or reason..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="reversed">Reversed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Loading bar ── */}
      {loading && (
        <div className="flex items-center justify-center py-4 bg-white border border-gray-200 rounded-xl">
          <div className="h-5 w-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mr-2" />
          <span className="text-sm text-gray-500">Loading withdrawals…</span>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Code</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredWithdrawals.length > 0 ? (
                filteredWithdrawals.map(withdrawal => (
                  <tr key={withdrawal.transaction_id} className="hover:bg-gray-50 transition-colors">

                    {/* Client */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-indigo-600 cursor-pointer font-medium text-sm"
                          onClick={() => openInNewTab(withdrawal.customer_name,`/dashboard/clients/customer-details/${withdrawal.customer_id}`,Users)}>
                            {withdrawal.customer_name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{withdrawal.customer_name}</div>
                          <div className="text-sm text-gray-700 font-medium">{withdrawal.customer_account_number}</div>
                          <p className="text-[10px] text-gray-500">Staff: {withdrawal.recorded_staff_name}</p>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-semibold text-gray-900">
                        ¢{Number(withdrawal.amount).toLocaleString()}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(withdrawal.transaction_date).toLocaleDateString()}
                    </td>

                    {/* Unique Code */}
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={withdrawal.unique_code}>
                        {withdrawal.unique_code}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(withdrawal.status)}`}>
                        {getStatusIcon(withdrawal.status)}
                        <span className="capitalize">{withdrawal.status}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {withdrawal.status === 'pending' && (
                        <div className="flex space-x-2">
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
                                withdrawal.account_number,
                              );
                            }}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isApproving ? 'Approving…' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(withdrawal.transaction_id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {withdrawal.status === 'approved' && (
                        <div className="flex items-center gap-2">
                          {userPermissions.REVERSE_TRANSACTIONS && (
                            <button
                              onClick={() => handleReverse(withdrawal.transaction_id)}
                              className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 transition-colors flex items-center gap-1"
                            >
                              <Undo2 className="h-3.5 w-3.5" />
                              Reverse
                            </button>
                          )}
                        </div>
                      )}

                      {(withdrawal.status === 'completed' || withdrawal.status === 'rejected' || withdrawal.status === 'reversed') && (
                        <div className="text-gray-400 text-xs space-y-0.5">
                          {withdrawal.transaction_date && (
                            <div>
                              {withdrawal.status === 'rejected' ? 'Rejected' : withdrawal.status === 'reversed' ? 'Reversed' : 'Completed'} on{' '}
                              {new Date(withdrawal.transaction_date).toLocaleDateString()}
                            </div>
                          )}
                          {withdrawal.recorded_staff_name && (
                            <div>by {withdrawal.recorded_staff_name}</div>
                          )}
                          {withdrawal.status === 'reversed' && withdrawal.reversed_by_name && (
                            <div className="text-orange-500">
                              Reversed by {withdrawal.reversed_by_name}
                              {withdrawal.reversed_at && ` on ${new Date(withdrawal.reversed_at).toLocaleDateString()}`}
                              {withdrawal.reversal_reason && (
                                <div className="text-red-400">Reason: {withdrawal.reversal_reason}</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <XCircle className="h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No withdrawals found</h3>
                      <p className="text-gray-500">
                        {searchTerm || statusFilter !== 'all'
                          ? 'Try adjusting your search or filter criteria.'
                          : 'No withdrawal requests have been made yet.'}
                      </p>
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