import React, { useEffect, useState } from 'react';
import { Users, PiggyBank, ArrowUpDown, TrendingUp, Plus, Eye, Download, Layers, Wallet, Activity } from 'lucide-react';
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
import TellerFloatCard from './Components/TellerFloatCard';

// Roles that should get the minimal, task-focused view instead of the
// full admin dashboard — they're at a counter or in the field, not
// running the business, so they don't need company-wide numbers.
const FIELD_ROLES = ['Teller', 'Mobile Banker'];

const statColorMap: Record<string, { bg: string; text: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  green:  { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  blue:   { bg: 'bg-blue-50', text: 'text-blue-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
};

const statusDot: Record<string, string> = {
  completed: 'bg-emerald-400', approved: 'bg-indigo-400', pending: 'bg-amber-400',
  reversed: 'bg-gray-300', rejected: 'bg-red-400',
};
const statusText: Record<string, string> = {
  completed: 'text-emerald-600', approved: 'text-indigo-600', pending: 'text-amber-600',
  reversed: 'text-gray-400', rejected: 'text-red-500',
};

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
  const myRecentTransactions = transactions
    .filter(t => t && (t.recorded_staff_id === userUUID || t.staff_id === userUUID))
    .slice(0, 4);
  const { commissionStats } = useCommissionStats();
  const budgets = data.budgets;
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const isFieldRole = FIELD_ROLES.includes(userRole);

  const todaysAllFloats = budgets.filter((budget) => budget.date.split("T")[0] === today);

  const localStats = [
    {
      title: 'Total Customers',
      value: stats?.totalCustomers ?? 0,
      subtitle: 'All company customers (including inactive)',
      icon: Users,
      color: 'indigo',
    },
    {
      title: 'Total Deposits',
      value: stats?.totalDeposits ? `¢${stats.totalDeposits}` : '¢0',
      subtitle: 'Total customer deposits',
      icon: PiggyBank,
      color: 'green',
    },
    {
      title: 'Total Withdrawals',
      value: stats?.totalApprovedWithdrawals ? `¢${stats.totalApprovedWithdrawals}` : '¢0',
      subtitle: 'Total customer withdrawals',
      icon: ArrowUpDown,
      color: 'orange',
    },
    {
      title: 'Total Commission',
      value: stats?.totalCommissions ? `¢${stats.totalCommissions}` : '¢0',
      subtitle: 'Total customer commissions',
      icon: TrendingUp,
      color: 'green',
    },
    {
      title: 'Customer Balance',
      value: stats?.totalBalance ? `¢${stats.totalBalance}` : '¢0',
      subtitle: 'Customer balance',
      icon: Wallet,
      color: 'blue',
    },
    {
      title: 'Pending Withdrawals',
      value: stats?.totalPendingWithdrawals ?? 0,
      subtitle: 'Awaiting approval',
      icon: ArrowUpDown,
      color: 'orange',
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

  if (!userPermissions) {
    window.location.reload()
  };

   if (userRole === 'Momo Agent'){
      navigate('/dashboard/momo-agent')
    }

  // ── Shared: quick action tiles (used by both views) ──────────────────
  const QuickActions = () => (
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
  );

  // ── Shared: a transaction row (used by both recent-activity lists) ───
  const TransactionRow = ({ tx }: { tx: any }) => {
    const initials = tx.customer_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
    const isDeposit = tx.type === 'deposit';
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
  };

  // ── Shared: pending withdrawals panel ─────────────────────────────────
  const PendingWithdrawalsPanel = () => pendingWithdrawals > 0 && (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Pending Transactions</h2>
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
                    <p className="text-xs text-gray-500">Transaction date: {new Date(withdrawal.transaction_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">¢{withdrawal.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {isFieldRole ? (
        // ═══════════════════════════════════════════════════════════════
        // MINIMAL VIEW — Teller / Mobile Banker
        // Just what they need to do their job: their float, quick ways
        // to record a transaction, and what's pending or theirs today.
        // No company-wide stats, no admin panels.
        // ═══════════════════════════════════════════════════════════════
        <>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {(() => {
                const h = new Date().getHours();
                return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
              })()}, {getDisplayName()}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Here's what needs your attention today.</p>
          </div>

          <TellerFloatCard />

          <QuickActions />

          <PendingWithdrawalsPanel />

          {myRecentTransactions.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-[18px] overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-[14px] font-semibold text-gray-900">Your recent activity</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {myRecentTransactions.map((tx) => <TransactionRow key={tx.transaction_id} tx={tx} />)}
              </div>
            </div>
          )}
        </>
      ) : (
        // ═══════════════════════════════════════════════════════════════
        // FULL VIEW — Admin / Manager / everyone else
        // ═══════════════════════════════════════════════════════════════
        <>
          <div className="relative overflow-hidden bg-gradient-to-br from-[#1a2e1a] via-[#2d442d] to-[#3d5a3d] rounded-2xl px-8 py-6 shadow-sm border border-white/10 text-white">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <div className="flex items-center mb-1">
                  <div className="h-1 w-8 bg-cream-100/40 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 ml-2">
                    Executive Summary
                  </span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">Dashboard Overview</h1>
                <p className="text-white/80 font-medium max-w-md leading-relaxed">
                  Welcome back! Here is a real-time pulse of your operations for today.
                </p>
              </div>
              <div className="flex items-center gap-3 self-start md:self-center">
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

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {localStats.map((stat, i) => {
              const c = statColorMap[stat.color] || statColorMap.blue;
              return (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
                    <stat.icon className={`h-4 w-4 ${c.text}`} />
                  </div>
                  <p className="text-xl font-bold text-gray-900 leading-none">{stat.value}</p>
                  <p className="text-[11px] text-gray-400 mt-1.5 leading-tight">{stat.title}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                {recentTransactions.map((tx) => <TransactionRow key={tx.transaction_id} tx={tx} />)}
              </div>
            </div>

            <QuickActions />
          </div>

          {/* Today's float across all tellers — admin visibility into cash on hand */}
          {todaysAllFloats.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                <h3 className="text-base font-bold text-gray-800 tracking-tight">Today's Float — All Tellers</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                  Live
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {todaysAllFloats.map((budget: any) => {
                  const percentage = budget.allocated ? Math.round((budget.spent / budget.allocated) * 100) : 0;
                  const remaining = budget.allocated - budget.spent;
                  const isOver = remaining < 0;
                  return (
                    <div
                      key={budget.id}
                      onClick={() => navigate(`finance/budgets/${budget.id}`, { state: { budget } })}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/60 transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{budget.teller_name || 'Unassigned'}</p>
                        <p className="text-xs text-gray-400">
                          ₵{Number(budget.spent).toLocaleString()} / ₵{Number(budget.allocated).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        isOver ? 'bg-red-50 text-red-600' :
                        percentage > 80 ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {isOver ? 'Limit Exceeded' : `${percentage}% Used`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <PendingWithdrawalsPanel />
        </>
      )}

      {/* ── Modals (shared across both views) ── */}
      {(showAddModal || editingClient) && (
        <ClientModal
          account={null}
          client={editingClient}
          onSave={editingClient ? handleEditClient : handleAddClient}
          onClose={() => { setShowAddModal(false); setEditingClient(null); }}
        />
      )}
      {(showTransactionModal || editingTransaction) && (
        <TransactionModal
          transaction={editingTransaction}
          onSave={editingTransaction ? handleEditTransaction : handleAddTransaction}
          onClose={() => { setShowTransactionModal(false); setEditingTransaction(null); }}
        />
      )}
      {showBulkTransactionModal && (
        <BulkTransactionModal
          companyId={companyId}
          userUUID={userUUID}
          userRole={userRole}
          onClose={() => setShowBulkTransactionModal(false)}
          onComplete={(results) => {}}
        />
      )}
    </div>
  );
};

export default Overview;