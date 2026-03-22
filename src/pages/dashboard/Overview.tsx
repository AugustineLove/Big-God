import React, { useEffect, useState } from 'react';
import { Users, PiggyBank, ArrowUpDown, TrendingUp, Plus, Eye, Download, Layers } from 'lucide-react';
import { Customer, mockClients, mockContributions, mockWithdrawals, Transaction } from '../../data/mockData';
import { useStats } from '../../contexts/dashboard/DashboardStat';
import { useTransactions } from '../../contexts/dashboard/Transactions';
import { Link, useNavigate } from 'react-router-dom';
import { ClientModal } from './Components/clientModal';
import { useCustomers } from '../../contexts/dashboard/Customers';
import {TransactionModal} from './Components/transactionModal';
import { companyId, getDisplayName, userPermissions, userRole, userUUID } from '../../constants/appConstants';
import { useFinance } from '../../contexts/dashboard/Finance';
import { useCommissionStats } from '../../contexts/dashboard/Commissions';
import BulkTransactionModal from './Components/buildTransactionModal';

const Overview: React.FC = () => {
 
  const { stats } = useStats();
  const { transactions, totals, approveTransaction, refreshTransactions, rejectTransaction } = useTransactions();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showBulkTransactionModal, setShowBulkTransactionModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Customer | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { customers, setCustomers, addCustomer, refreshCustomers  } = useCustomers();
  const { data, fetchFinanceData, addExpense, addPayment, addAsset, addBudget, loading } = useFinance();
  const pendingWithdrawals = transactions?.filter(w => w && w.status === 'pending').length || 0;
  const recentTransactions = transactions.slice(0, 5);
  const { commissionStats } = useCommissionStats();
  const recentWithdrawals = mockWithdrawals
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
    .slice(0, 3);
  const budgets = data.budgets;
  const navigate = useNavigate();
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  const today = new Date().toISOString().split("T")[0];

  const todayBudgets = budgets.filter(
    (budget) => budget.date.split("T")[0] === today && budget.teller_name === getDisplayName()
  );
  
  // console.log(`View briefing permission: ${JSON.stringify(userPermissions.VIEW_BRIEFING)}`);
  const localStats = [
    {
      title: 'Total Customers',
      value: stats?.totalCustomers,
      subtitle: `All company customers (including inactive)`,
      icon: Users,
      color: 'indigo',
      change: '+12%'
    },
    {
      title: 'Total Deposits',
      value: `¢${stats?.totalDeposits}` || 0,
      subtitle: 'Total customer deposits',
      icon: PiggyBank,
      color: 'green',
      change: '+8.2%'
    },
    {
      title: 'Total Withdrawals',
      value: `¢${stats?.totalApprovedWithdrawals}` || 0,
      subtitle: 'Total customer withdrawals',
      icon: PiggyBank,
      color: 'green',
      change: '+8.2%'
    },
    {
      title: 'Total Commission',
      value: `¢${stats?.totalCommissions}` || 0,
      subtitle: 'Total customer commissions',
      icon: TrendingUp,
      color: 'green',
      change: '+8.2%'
    },
    {
      title: 'Customer Balance',
      value: `¢${stats?.totalBalance}` || 0,
      subtitle: 'Customer balance',
      icon: TrendingUp,
      color: 'blue',
      change: '+15.3%'
    },
    {
      title: 'Pending Withdrawals',
      value: stats?.totalPendingWithdrawals,
      subtitle: 'Awaiting approval',
      icon: ArrowUpDown,
      color: 'orange',
      change: '-2'
    }
  ];

   const handleAddClient = (newClient: Omit<Customer, 'id'>) => {
    const companyJSON = localStorage.getItem('susupro_company');
      const company = companyJSON ? JSON.parse(companyJSON) : null;
      const companyId = company?.id;

      const client: Customer = {
        ...newClient,
        company_id: companyId,
      };
      console.log('Adding new client:', client);
      // addCustomer(client, '');
      window.location.reload();
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
  
    const handleEditClient = (updatedClient: Customer) => {
      setCustomers(customers.map(client =>
      {
        if (client.id === updatedClient.id) {
          return { ...client, ...updatedClient };
        }
        return client;
      }));
      setEditingClient(null);
    };
  
    const handleDeleteClient = (clientId: string) => {
      if (window.confirm('Are you sure you want to delete this client?')) {
        setCustomers(customers.filter(customer => customer.id !== clientId));
      }
    };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionColor = (type: string) => {
    return type === 'deposit' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  
  if (!userPermissions) window.location.reload();

  return (
    
    <div className="space-y-6">
      {/* Welcome Header */}
   <div className="relative overflow-hidden bg-gradient-to-br from-[#1a2e1a] via-[#2d442d] to-[#3d5a3d] rounded-2xl px-8 py-4 shadow-sm border border-white/10 text-white">
  {/* Subtle decorative background element */}
  <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

  <div className="relative flex flex-col md:flex-row md:items-center justify-between">
    <div className="">
      <div className="flex items-center mb-1">
        <div className="h-1 w-8 bg-cream-100/40 rounded-full" /> {/* Accent line */}
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
          Executive Summary
        </span>
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight">
        Dashboard Overview
      </h1>
      <p className="text-white/80 font-medium max-w-md leading-relaxed">
        Welcome back! Here is a real-time pulse of your operations for today.
      </p>
    </div>

    {/* Live Date / Status Pill */}
    <div className="flex items-center gap-3 self-start md:self-center">
      <div className="flex flex-col items-end">
        {/* <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Current Date</span>
        <span className="text-sm font-bold text-white">
          {new Date().toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </span> */}
      </div>
      <div className="h-10 w-[1px] bg-white/10 hidden md:block mx-2" />
      <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-xs font-bold tracking-wide">Live Updates</span>
      </div>
    </div>
  </div>
</div>

      {/* localStats Grid */}
      {userPermissions.VIEW_BRIEFING && (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {localStats.map((stat, index) => {
      const Icon = stat.icon;
      const isPositive = stat.change?.startsWith('+');

      return (
        <div 
          key={index} 
          className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-md hover:border-blue-100 transition-all duration-300"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {stat.title}
              </span>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {stat.value}
                </h3>
              </div>
            </div>

            {/* Icon Container with subtle background wrap */}
            <div className={`p-2.5 rounded-xl transition-colors duration-300 bg-${stat.color}-50 group-hover:bg-${stat.color}-100`}>
              <Icon className={`h-5 w-5 text-${stat.color}-600`} />
            </div>
          </div>

          <div className="mt-2 pt-4 border-t border-gray-50 flex items-center justify-between">
            {/* <div className="flex items-center">
              {stat.change && (
                <span className={`flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                  isPositive 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'bg-rose-50 text-rose-600'
                }`}>
                  {isPositive ? '↑' : '↓'} {stat.change.replace('+', '').replace('-', '')}
                </span>
              )}
              <span className="text-[11px] text-gray-400 ml-2 font-medium">
                vs last month
              </span>
            </div> */}
            
            <p className="text-[11px] font-medium text-gray-500 italic">
              {stat.subtitle}
            </p>
          </div>
        </div>
      );
    })}
  </div>
)}
    {userRole === 'Teller' && (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
    {/* Header Section */}
    <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
      <h3 className="text-base font-bold text-gray-800 tracking-tight">
        Daily Budget
      </h3>
      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
        Live Tracking
      </span>
    </div>

    <div className="p-6">
      {todayBudgets.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-gray-400 text-sm">No active budget for today.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {todayBudgets.map((budget) => {
            const percentage = budget.allocated ? Math.round((budget.spent / budget.allocated) * 100) : 0;
            const remaining = budget.allocated - budget.spent;
            const isOver = remaining < 0;

            return (
              <div
                key={budget.id}
                onClick={() => navigate(`expenses/budgets/${budget.id}`, { state: { budget } })}
                className="group relative p-5 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Total Spent</p>
                    <h4 className="text-2xl font-bold text-gray-900">
                      ₵{budget.spent.toLocaleString()}
                      <span className="text-sm font-normal text-gray-400 ml-2">
                        / ₵{budget.allocated.toLocaleString()}
                      </span>
                    </h4>
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    isOver ? "bg-red-50 text-red-600" : 
                    percentage > 80 ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"
                  }`}>
                    {isOver ? "Limit Exceeded" : `${percentage}% Used`}
                  </div>
                </div>

                {/* Modern Progress Bar */}
                <div className="relative w-full h-2 bg-gray-200/60 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      percentage > 90 ? "bg-red-500" : 
                      percentage > 70 ? "bg-orange-400" : "bg-blue-500"
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Remaining</span>
                    <span className={`text-sm font-bold ${isOver ? "text-red-500" : "text-gray-700"}`}>
                      ₵{Math.abs(remaining).toLocaleString()} {isOver && "over"}
                    </span>
                  </div>
                  <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-xs font-semibold">
                    View Details
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
)}


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

  {/* ── Recent Contributions ── */}
  <div className="bg-white border border-gray-100 rounded-[18px] overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <h2 className="text-[14px] font-semibold text-gray-900">Recent contributions</h2>
      <Link
        to="/dashboard/all-transactions"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
      >
        <Eye className="w-3.5 h-3.5" />
        View all
      </Link>
    </div>

    <div className="divide-y divide-gray-50">
      {recentTransactions.map((tx) => {
        const initials = tx.customer_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
        const isDeposit = tx.type === 'deposit';

        const statusDot: Record<string, string> = {
          completed: 'bg-emerald-400',
          approved:  'bg-indigo-400',
          pending:   'bg-amber-400',
          reversed:  'bg-gray-300',
          rejected:  'bg-red-400',
        };
        const statusText: Record<string, string> = {
          completed: 'text-emerald-600',
          approved:  'text-indigo-600',
          pending:   'text-amber-600',
          reversed:  'text-gray-400',
          rejected:  'text-red-500',
        };

        return (
          <div
            key={tx.transaction_id}
            className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
          >
            {/* Left: avatar + info */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-900 leading-snug">{tx.customer_name}</p>
                <p className="text-[11px] text-gray-400">
                  {new Date(tx.transaction_date).toLocaleString(undefined, {
                    dateStyle: 'medium', timeStyle: 'short',
                  })}
                </p>
              
              </div>
            </div>
            <div className='flex flex-col items-center justify-center'>
                      <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5
                ${isDeposit ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                {tx.type}
              </span>
                      <p className="text-[10px] text-gray-300 mt-0.5">
                  Processed by {tx.recorded_staff_name}
                </p>
                  
            </div>

            {/* Right: amount + type + status */}
            <div className="flex flex-col items-end gap-1">
              <span className="text-[14px] font-semibold text-gray-900 tabular-nums">
                ¢{Number(tx.amount).toLocaleString()}
              </span>
             
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${statusText[tx.status] || 'text-gray-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusDot[tx.status] || 'bg-gray-300'}`} />
                {tx.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  </div>

  {/* ── Quick Actions ── */}
  <div className="bg-white border border-gray-100 rounded-[18px] overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100">
      <h2 className="text-[14px] font-semibold text-gray-900">Quick actions</h2>
    </div>
    <div className="p-4">
      <div className="grid grid-cols-2 gap-3">

        {userPermissions.CUSTOMER_CREATE && (
          <button
            onClick={() => setShowAddModal(true)}
            className="group flex flex-col items-center justify-center gap-2.5 py-6 px-4 border-[1.5px] border-dashed border-gray-200 rounded-2xl hover:border-solid hover:border-indigo-400 hover:bg-indigo-50 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
              <Plus className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-center">
              <p className="text-[12px] font-semibold text-gray-700">Add customer</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Register new client</p>
            </div>
          </button>
        )}

        {userPermissions.PROCESS_TRANSACTIONS && (
          <button
            onClick={() => setShowTransactionModal(true)}
            className="group flex flex-col items-center justify-center gap-2.5 py-6 px-4 border-[1.5px] border-dashed border-gray-200 rounded-2xl hover:border-solid hover:border-emerald-400 hover:bg-emerald-50 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
              <ArrowUpDown className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="text-[12px] font-semibold text-gray-700">Transaction</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Deposit or withdrawal</p>
            </div>
          </button>
        )}

        {userPermissions.PROCESS_TRANSACTIONS && (
          <button
            onClick={() => setShowBulkTransactionModal(true)}
            className="group flex flex-col items-center justify-center gap-2.5 py-6 px-4 border-[1.5px] border-dashed border-gray-200 rounded-2xl hover:border-solid hover:border-teal-400 hover:bg-teal-50 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center transition-colors">
              <Layers className="w-5 h-5 text-teal-600" />
            </div>
            <div className="text-center">
              <p className="text-[12px] font-semibold text-gray-700">Bulk transaction</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Process multiple at once</p>
            </div>
          </button>
        )}

      </div>
    </div>
  </div>

</div>

      {/* Pending Withdrawals */}
      {pendingWithdrawals > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Pending Withdrawals</h2>
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                {pendingWithdrawals} pending
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {transactions
                ?.filter(t => t && t.status === 'pending') 
                 .map((withdrawal) => (
                  <div key={withdrawal.transaction_id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 font-medium text-sm">
                          {withdrawal.customer_name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{withdrawal.customer_name}</p>
                        <p className="text-sm text-gray-600">{withdrawal.description}</p>
                        <p className="text-xs text-gray-500">Requested on {new Date(withdrawal.transaction_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">¢{withdrawal.amount.toLocaleString()}</p>
                      {/* <div className="flex space-x-2 mt-2">
                        <button onClick={() => {approveTransaction(withdrawal.transaction_id); refreshTransactions(); refreshCustomers();}} className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
                          Approve
                        </button>
                        <button onClick={()=> {rejectTransaction(withdrawal.transaction_id); refreshTransactions(); refreshCustomers();}} className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700">
                          Reject
                        </button>
                      </div> */}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Client Modal */}
            {(showAddModal || editingClient) && (
              <ClientModal
              account={null}
                client={editingClient}
                onSave={editingClient ? handleEditClient : handleAddClient}
                onClose={() => {
                  setShowAddModal(false);
                  setEditingClient(null);
                }}
              />
            )}
        {/* Add/Edit Transaction Modal */}
              {(showTransactionModal || editingTransaction) && (
                <TransactionModal
                  transaction={editingTransaction}
                  onSave={editingTransaction ? handleEditTransaction : handleAddTransaction}
                  onClose={() => {
                    setShowTransactionModal(false);
                    setEditingTransaction(null);
                  }}
                />
              )}

            {
              showBulkTransactionModal && (
                <BulkTransactionModal
                companyId={companyId}
                userUUID={userUUID}
                userRole={userRole}
                onClose={() => setShowBulkTransactionModal(false)}
                onComplete={(results) => console.log(results)} // summary callback
              />
              )
            }

              
    </div>
  );
};

export default Overview;
