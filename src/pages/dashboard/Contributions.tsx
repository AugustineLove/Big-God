import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Calendar, Filter, Download, PiggyBank, Eye, User, Undo, Undo2 } from 'lucide-react';
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

const Contributions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [officeStaffFilter, setOfficeStaffFilter] = useState('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState('');
  const [isDeleteTransactionModal, setisDeletTransactionModal] = useState(false);
  const { transactions, deleteTransaction } = useTransactions();
  const { stats } = useStats();
  const { staffList } = useStaff();
  const { refreshCustomers } = useCustomers();

  const filteredContributions = useMemo(() => {
  return transactions.filter(contribution => {
    // Search filter
    const matchesSearch = contribution.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || contribution.status === statusFilter;
    
    // Staff filter
    const matchesStaff = staffFilter === 'all' || contribution.mobile_banker_id === staffFilter;
    
    // Transaction type filter
    const matchesType = transactionTypeFilter === 'all' || contribution.type === transactionTypeFilter;
    
    // Office staff filter
    const matchesOfficeStaff = officeStaffFilter === 'all' || contribution.recorded_staff_id === officeStaffFilter;

    // Date range filter
    let matchesDate = true;
    
    if (dateRange !== 'all') {
      // Parse contribution date and strip time (set to midnight)
      const contributionDate = new Date(contribution.transaction_date);
      contributionDate.setHours(0, 0, 0, 0);
      
      if (dateRange === 'custom' && (startDate || endDate)) {
        // Custom range: include both start and end dates fully
        const start = startDate ? new Date(startDate) : new Date('1900-01-01');
        start.setHours(0, 0, 0, 0);
        
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999); // End of the day
        
        matchesDate = contributionDate >= start && contributionDate <= end;
      } else {
        // Preset ranges: compare dates properly
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const diffTime = now.getTime() - contributionDate.getTime();
        const daysDiff = Math.floor(diffTime / (1000 * 3600 * 24));
        
        switch (dateRange) {
          case 'today':
            matchesDate = daysDiff === 0;
            break;
          case 'week':
            matchesDate = daysDiff >= 0 && daysDiff < 7;
            break;
          case 'month':
            matchesDate = daysDiff >= 0 && daysDiff < 30;
            break;
          case 'quarter':
            matchesDate = daysDiff >= 0 && daysDiff < 90;
            break;
          case 'year':
            matchesDate = daysDiff >= 0 && daysDiff < 365;
            break;
        }
      }
    }
    
    return matchesSearch && matchesStatus && matchesStaff && matchesDate && matchesType && matchesOfficeStaff;
  });
}, [transactions, searchTerm, statusFilter, staffFilter, transactionTypeFilter, officeStaffFilter, dateRange, startDate, endDate]);
  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    const completedTransactions = filteredContributions.filter(c => c.status === 'completed');
    const pendingTransactions = filteredContributions.filter(c => c.status === 'pending');
    const depositTransactions = filteredContributions.filter(c => c.type === 'deposit');
    
    const totalAmount = completedTransactions.reduce((sum, c) => Number(sum) + Number(c.amount), 0);
    const pendingAmount = pendingTransactions.reduce((sum, c) => sum + Number(c.amount), 0);
    const totalDeposits = depositTransactions.reduce((sum, c) => sum + Number(c.amount), 0);
    const averageAmount = completedTransactions.length > 0 ? totalAmount / completedTransactions.length : 0;

    return {
      totalAmount,
      pendingAmount,
      totalDeposits,
      averageAmount,
      transactionCount: filteredContributions.length,
      completedCount: completedTransactions.length
    };
  }, [filteredContributions]);

  const handleAddContribution = (newContribution: Omit<Contribution, 'id'>) => {
    const contribution: Contribution = {
      ...newContribution,
      id: (transactions.length + 1).toString()
    };
    setShowAddModal(false);
  };

  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id'>) => {
    const companyJSON = localStorage.getItem('susupro_company');
    const company = companyJSON ? JSON.parse(companyJSON) : null;
    const companyId = company?.id;

    const transaction: Transaction = {
      ...newTransaction,
      company_id: companyId,
    };
    console.log('Adding new transaction:', transaction);
    
    setShowAddModal(false);
    setShowTransactionModal(false);
    setEditingTransaction(null);
  };

  const handleEditTransaction = (updatedTransaction: Transaction) => {
    setEditingTransaction(null);
  };

  const handleDeleteClick = async (transaction_id: string) => {
    setSelectedTransaction(transaction_id);
    setisDeletTransactionModal(true);
  }
  const handleDeleteCancel = () => {
    setSelectedTransaction('');
    setisDeletTransactionModal(false);
  }
  const handleDeleteConfirm = async (transactionId: string) => {
    setIsDeleting(true);
    const toastId = toast.loading("Deleting transaction...")
    try {
      console.log(`Transaction: ${transactionId}`)
      const res = await deleteTransaction(transactionId);
      if (res){
      setisDeletTransactionModal(false);
      setSelectedTransaction('');
      await refreshCustomers();
      toast.success("Transaction deleted successfully", {id: toastId})
      setIsDeleting(false);
      }
      
    } catch (error) {
      console.log(error);
      setIsDeleting(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'cash':
        return 'bg-blue-100 text-blue-800';
      case 'bank_transfer':
        return 'bg-purple-100 text-purple-800';
      case 'mobile_money':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatMethod = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'mobile_money':
        return 'Mobile Money';
      case 'cash':
        return 'Cash';
      default:
        return method;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'withdrawal'
    ? 'text-red-500' : 'text-green-500';
  }

  const getStaffName = (staffId: string) => {
    const staff = staffList.find(s => s.id === staffId);
    return staff ? `${staff.full_name}` : 'Unknown Staff';
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
  
  return (
    <div className="space-y-6">
      {/* Header */}
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
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          onClick={()=> handlePdfExport(filteredContributions)}
          >
            <Download className="h-5 w-5 mr-2" />
            Export
          </button>
          {
            userPermissions.PROCESS_TRANSACTIONS && (
              <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Log Contribution
          </button>
            )
          }
        </div>
      </div>

      {/* Enhanced Stats Cards - showing filtered data */}
      {
        userPermissions.VIEW_BRIEFING && (
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

        )
      }
      {/* Enhanced Filters */}
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
                placeholder="Search by client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Staff Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Staff</label>
            <select
              value={officeStaffFilter}
              onChange={(e) => setOfficeStaffFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Staff</option>
              {staffList.filter(staff => staff.role?.toLocaleLowerCase() === 'teller' || staff.role?.toLocaleLowerCase() === 'accountant').map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.full_name} {staff.staff_id ? `(${staff.staff_id})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile Banker Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Bankers</label>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Staff</option>
              {staffList.filter(staff => staff.role?.toLocaleLowerCase() === 'mobile banker' || staff.role?.toLocaleLowerCase() === 'mobile_banker').map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.full_name} {staff.staff_id ? `(${staff.staff_id})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={transactionTypeFilter}
              onChange={(e) => setTransactionTypeFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="commission">Commission</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
              onChange={(e) => setDateRange(e.target.value)}
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
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Contributions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
               
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredContributions.length > 0 ? (
  filteredContributions.map((contribution) => {
    const isDeleted = contribution.is_deleted;
    console.log(isDeleted);
    return (
      <tr
        key={contribution.transaction_id}
        className={`transition ${
          isDeleted
            ? "bg-gray-100 text-gray-400 opacity-70"
            : "hover:bg-gray-50"
        }`}
      >
        {/* Customer */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDeleted ? "bg-gray-200" : "bg-indigo-100"
              }`}
            >
              <span
                className={`font-medium text-sm ${
                  isDeleted ? "text-gray-400" : "text-indigo-600"
                }`}
              >
                {contribution.customer_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>

            <div className="ml-4">
              <div className="text-sm font-medium">
                {contribution.customer_name}
              </div>
              <div className="text-xs text-gray-400">
                Assigned Banker:{" "}
                {contribution.mobile_banker_name
                  ? getStaffName(contribution.mobile_banker_id)
                  : "Unassigned"}
              </div>
            </div>
          </div>
        </td>

        {/* Amount */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-lg font-semibold">
            ¢{Number(contribution.amount).toLocaleString()}
          </div>
        </td>

        {/* Date */}
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          {new Date(contribution.transaction_date).toLocaleDateString()}
        </td>

        {/* Type */}
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              getTransactionTypeColor(
                contribution.type || contribution.status
              )
            } ${isDeleted ? "opacity-60" : ""}`}
          >
            {formatMethod(contribution.type || contribution.status)}
          </span>
        </td>

        {/* Status */}
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              getStatusColor(contribution.status)
            }`}
          >
            {contribution.status}
          </span>

          {isDeleted && (
            <span className="ml-2 inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-300 text-gray-700">
              Reversed
            </span>
          )}
        </td>

        {/* Description */}
        <td className="px-6 py-4 text-sm max-w-xs truncate">
          {contribution.description ? (
            <div>
                <p>{contribution.description}</p>
                <div className='text-sm flex'>
              <p className='text-[11px] mr-1'>Transaction recorded by {" "}</p>
              <span className="font-semibold text-[11px]">
                {getStaffName(contribution.recorded_staff_id)}
              </span>
            </div>
            </div>
          ) : (
            <>
              Transaction recorded by{" "}
              <span className="font-semibold">
                {getStaffName(contribution.recorded_staff_id)}
              </span>
            </>
          )}
        </td>

        {/* Reverse Action */}
        {
          !userPermissions.PROCESS_TRANSACTIONS && (
            <td className="px-6 py-4">
          <div
            className={`flex items-center justify-center gap-1 ${
              isDeleted
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer"
            }`}
            onClick={() => {
              if (!isDeleted) {
                handleDeleteClick(contribution.transaction_id);
              }
            }}
          >
            <Undo2
              className={`h-4 w-4 ${
                isDeleted ? "text-gray-400" : "text-red-600"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                isDeleted ? "text-gray-400" : "text-red-600"
              }`}
            >
              Reverse
            </span>
          </div>
        </td>
          )
        }
      </tr>
    );
  })
) 
 : (
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

      {/* Add Contribution Modal */}
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

       {/* Delete Modal */}
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