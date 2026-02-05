import React, { useEffect, useState } from 'react';
import { Users, PiggyBank, ArrowUpDown, TrendingUp, Plus, Eye, Download } from 'lucide-react';
import { Customer, mockClients, mockContributions, mockWithdrawals, Transaction } from '../../data/mockData';
import { useStats } from '../../contexts/dashboard/DashboardStat';
import { useTransactions } from '../../contexts/dashboard/Transactions';
import { Link, useNavigate } from 'react-router-dom';
import { ClientModal } from './Components/clientModal';
import { useCustomers } from '../../contexts/dashboard/Customers';
import {TransactionModal} from './Components/transactionModal';
import { userPermissions } from '../../constants/appConstants';
import { useFinance } from '../../contexts/dashboard/Finance';
import { useCommissionStats } from '../../contexts/dashboard/Commissions';

const Overview: React.FC = () => {
 
  const { stats } = useStats();
  const { transactions, totals, approveTransaction, refreshTransactions, rejectTransaction } = useTransactions();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
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
    (budget) => budget.date.split("T")[0] === today
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
      value: `¢${Math.round(totals?.totalDeposits)}` || 0,
      subtitle: 'All total customer deposits',
      icon: PiggyBank,
      color: 'green',
      change: '+8.2%'
    },
    {
      title: 'Total Withdrawals',
      value: `¢${totals?.totalApprovedWithdrawals.toLocaleString()}` || 0,
      subtitle: 'All total customer withdrawals',
      icon: PiggyBank,
      color: 'green',
      change: '+8.2%'
    },
    {
      title: 'Total Commission',
      value: `¢${commissionStats?.total_amount}` || 0,
      subtitle: 'All total customer commissions',
      icon: TrendingUp,
      color: 'green',
      change: '+8.2%'
    },
    {
      title: 'Customer Balance',
      value: `¢${stats?.totalBalance}` || 0,
      subtitle: 'Available funds',
      icon: TrendingUp,
      color: 'blue',
      change: '+15.3%'
    },
    {
      title: 'Pending Withdrawals',
      value: pendingWithdrawals.toString(),
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
      <div className="bg-gradient-to-r from-indigo-600 to-teal-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Dashboard Overview</h1>
        <p className="text-indigo-100">Welcome back! Here's what's happening with your susu operations today.</p>
      </div>

      {/* localStats Grid */}
      {userPermissions.VIEW_BRIEFING && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {localStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.subtitle}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {/* <span className={`text-sm font-medium ${
                  stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">from last month</span> */}
              </div>
            </div>
          );
        })}
      </div>
    )}
    {!userPermissions.VIEW_BRIEFING && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
    <h3 className="text-lg font-semibold text-gray-900 mb-6">
      Budget for Today
    </h3>

    <div className="space-y-6">
      {todayBudgets.length === 0 ? (
        <p className="text-gray-500 text-sm">No budget set for today.</p>
      ) : (
        todayBudgets.map((budget) => {
          const percentage = budget.allocated
            ? Math.round((budget.spent / budget.allocated) * 100)
            : 0;

          const remaining = budget.allocated - budget.spent;

          return (
            <div
              key={budget.id}
              onClick={() => navigate(`expenses/budgets/${budget.id}`, { state: { budget } })}
              className="border border-gray-100 rounded-lg p-4 hover:shadow-sm cursor-pointer transition-shadow"
                    >
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-900">
                  {formatDate(budget.date)}
                </h4>

                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    ₵{budget.spent.toLocaleString()} / ₵
                    {budget.allocated.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {percentage}% used
                  </p>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    percentage > 80
                      ? "bg-red-500"
                      : percentage > 60
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  Remaining: ₵{remaining.toLocaleString()}
                </span>
                <span>
                  {remaining < 0
                    ? "Over budget"
                    : percentage > 80
                    ? "Approaching limit"
                    : "On track"}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
)}


      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Contributions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Contributions</h2>
              <Link to="/dashboard/all-transactions" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                View All
              </Link>
            </div>
          </div>
          <div className="0">
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
              <div
                key={transaction.transaction_id}
                className="flex items-center justify-between bg-white rounded-xl p-4 transition-shadow duration-300"
              >
               <div className="flex items-center justify-start bg-white rounded-xl p-4">
                  {/* Customer */}
                  <div className="flex items-center space-x-4 w-64 min-w-0">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      {transaction.customer_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>

                      <div className='flex flex-col justify-start content-start'>
                          <div className="min-w-0 w-44">
                            <p className="font-semibold text-gray-900 truncate">
                              {transaction.customer_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(transaction.transaction_date).toLocaleString(undefined, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </p>
                          </div>
                           {/* Staff */}
                          <div className="flex sm:flex text-center text-xs text-gray-600 w-48">
                            <p className="text-[10px] text-gray-400 mr-1">Processed by {" "}</p>
                            <p className="font-medium truncate">{transaction.recorded_staff_name}</p>
                          </div>
                      </div>
                  </div>
                  
                  <div className="hidden sm:block text-center text-xs text-gray-600 w-28">
                    <p className="text-[10px] text-gray-400">Status</p>
                    <p className={`font-medium p-1 rounded ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-center w-32">
                    <p className="text-gray-900 font-bold text-sm">
                      ¢{Number(transaction.amount).toLocaleString()}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                      transaction.type === 'deposit'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {transaction.type}
                    </span>
                  </div>
                </div>

                  </div>
                ))}

            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <button onClick={()=> {setShowAddModal(true)}} className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                <Plus className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Add Customer</span>
              </button>
              {
                userPermissions.PROCESS_TRANSACTIONS && <button onClick={()=> {setShowTransactionModal(true)}} className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-colors">
                <ArrowUpDown className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Transaction</span>
              </button>
              }
              {/* <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors">
                <Download className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Generate Report</span>
              </button>
              <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors">
                <ArrowUpDown className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Process Withdrawal</span>
              </button> */}
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

              
    </div>
  );
};

export default Overview;
