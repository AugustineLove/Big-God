import React, { useState } from 'react';
import {
  Users,
  PiggyBank,
  ArrowUpDown,
  TrendingUp,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Eye,
  Layers,
  Wallet,
} from 'lucide-react';
import { Customer, Transaction } from '../../data/mockData';
import { useStats } from '../../contexts/dashboard/DashboardStat';
import { useTransactions } from '../../contexts/dashboard/Transactions';
import { Link, useNavigate } from 'react-router-dom';
import { ClientModal } from './Components/clientModal';
import { useCustomers } from '../../contexts/dashboard/Customers';
import { TransactionModal } from './Components/transactionModal';
import {
  companyId,
  getDisplayName,
  userPermissions,
  userRole,
  userUUID,
} from '../../constants/appConstants';
import { useFinance } from '../../contexts/dashboard/Finance';
import BulkTransactionModal from './Components/buildTransactionModal';
import TellerFloatCard from './Components/TellerFloatCard';

/* ============================================================
   ROLES
============================================================ */

const FIELD_ROLES = ['Teller', 'Mobile Banker'];

/* ============================================================
   PERMISSIONS
============================================================ */

const canDeposit =
  (userPermissions as any)?.PROCESS_DEPOSITS

const canWithdraw =
  (userPermissions as any)?.PROCESS_WITHDRAWALS

/* ============================================================
   COLORS / STATUS — matches OverviewTab's STATUS_COLOR
============================================================ */

const statusColor: Record<string, string> = {
  completed: 'var(--forest)',
  approved: 'var(--brass)',
  pending: '#b8963f',
  reversed: 'var(--ink-faint)',
  rejected: 'var(--clay)',
};

/* ============================================================
   OVERVIEW
============================================================ */

const Overview: React.FC = () => {
  const { stats } = useStats();

  const {
    transactions,
  } = useTransactions();

const [showAddModal, setShowAddModal] = useState(false);

const [transactionModalType, setTransactionModalType] = useState<
  'deposit' | 'withdrawal' | null
>(null);

  const [showBulkTransactionModal, setShowBulkTransactionModal] =
    useState(false);

  const [editingClient, setEditingClient] =
    useState<Customer | null>(null);

  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const {
    customers,
    setCustomers,
  } = useCustomers();

  const {
    data,
  } = useFinance();

  const navigate = useNavigate();

  /* ============================================================
     GENERAL DATA
  ============================================================ */

  const pendingWithdrawals =
    transactions?.filter(
      (transaction) =>
        transaction && transaction.status === 'pending'
    ).length || 0;

  const recentTransactions =
    transactions?.slice(0, 5) || [];

  const myRecentTransactions =
    transactions
      ?.filter(
        (transaction) =>
          transaction &&
          (
            transaction.recorded_staff_id === userUUID ||
            transaction.staff_id === userUUID
          )
      )
      .slice(0, 4) || [];

  const budgets = data?.budgets || [];

  const today = new Date()
    .toISOString()
    .split('T')[0];

  const isFieldRole =
    FIELD_ROLES.includes(userRole);

  const todaysAllFloats =
    budgets.filter(
      (budget) =>
        budget.date.split('T')[0] === today
    );

  /* ============================================================
     STATS
  ============================================================ */

  const localStats = [
    {
      title: 'Total Customers',
      value: stats?.totalCustomers ?? 0,
      subtitle: 'All company customers',
      icon: Users,
    },
    {
      title: 'Total Deposits',
      value: stats?.totalDeposits
        ? `¢${stats.totalDeposits}`
        : '¢0',
      subtitle: 'Customer deposits',
      icon: PiggyBank,
    },
    {
      title: 'Total Withdrawals',
      value: stats?.totalApprovedWithdrawals
        ? `¢${stats.totalApprovedWithdrawals}`
        : '¢0',
      subtitle: 'Approved withdrawals',
      icon: ArrowUpDown,
    },
    {
      title: 'Total Commission',
      value: stats?.totalCommissions
        ? `¢${stats.totalCommissions}`
        : '¢0',
      subtitle: 'Customer commissions',
      icon: TrendingUp,
    },
    {
      title: 'Customer Balance',
      value: stats?.totalBalance
        ? `¢${stats.totalBalance}`
        : '¢0',
      subtitle: 'Current customer balance',
      icon: Wallet,
    },
    {
      title: 'Pending Withdrawals',
      value: stats?.totalPendingWithdrawals ?? 0,
      subtitle: 'Awaiting approval',
      icon: ArrowUpDown,
    },
  ];

  /* ============================================================
     CUSTOMER HANDLERS
  ============================================================ */

  const handleAddClient = (
    newClient: Omit<Customer, 'id'>
  ) => {
    const companyJSON =
      localStorage.getItem('susupro_company');

    const company = companyJSON
      ? JSON.parse(companyJSON)
      : null;

    const companyId = company?.id;

    const client: Customer = {
      ...newClient,
      company_id: companyId,
    };

    console.log('New client:', client);

    setShowAddModal(false);

    window.location.reload();
  };

  /* ============================================================
     TRANSACTION HANDLERS
  ============================================================ */

  const handleAddTransaction = (
    newTransaction: Omit<Transaction, 'id'>
  ) => {
    const companyJSON =
      localStorage.getItem('susupro_company');

    const company = companyJSON
      ? JSON.parse(companyJSON)
      : null;

    const companyId = company?.id;

    const transaction: Transaction = {
      ...newTransaction,
      company_id: companyId,
    };

    console.log('New transaction:', transaction);

    setShowAddModal(false);
    setTransactionModalType(null);
    setEditingTransaction(null);
  };

  const handleEditTransaction = (
    updatedTransaction: Transaction
  ) => {
    console.log(
      'Updated transaction:',
      updatedTransaction
    );

    setEditingTransaction(null);
  };

  const handleEditClient = (
    updatedClient: Customer
  ) => {
    setCustomers(
      customers.map((client) =>
        client.id === updatedClient.id
          ? {
              ...client,
              ...updatedClient,
            }
          : client
      )
    );

    setEditingClient(null);
  };

  /* ============================================================
     QUICK ACTIONS
  ============================================================ */

  const QuickActions = () => (
    <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--paper-line)]">
        <h2 className="cd-display text-sm font-semibold text-[var(--ink)]">
          Quick actions
        </h2>

        <p className="text-[11px] text-[var(--ink-faint)] mt-0.5">
          Common tasks you can perform
        </p>
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">

          {/* ADD CUSTOMER */}
          {userPermissions.CUSTOMER_CREATE && (
            <button
              type="button"
              onClick={() =>
                setShowAddModal(true)
              }
              className="
                group
                flex flex-col
                items-center
                justify-center
                gap-3
                py-6
                px-4
                rounded-xl
                border
                border-[var(--paper-line)]
                bg-[var(--paper)]
                hover:bg-[var(--card)]
                hover:border-[var(--forest)]
                hover:shadow-sm
                transition-all
              "
            >
              <div
                className="
                  w-11 h-11
                  rounded-xl
                  bg-[var(--card)]
                  border border-[var(--paper-line)]
                  shadow-sm
                  flex items-center
                  justify-center
                "
              >
                <Plus
                  className="w-5 h-5"
                  style={{ color: 'var(--forest)' }}
                />
              </div>

              <div className="text-center">
                <p className="text-[12px] font-semibold text-[var(--ink)]">
                  Add customer
                </p>

                <p className="text-[10px] text-[var(--ink-faint)] mt-0.5">
                  Register new client
                </p>
              </div>
            </button>
          )}

          {/* DEPOSIT */}
          {canDeposit && (
            <button
              type="button"
              onClick={() =>
                setTransactionModalType('deposit')
              }
              className="
                group
                flex flex-col
                items-center
                justify-center
                gap-3
                py-6
                px-4
                rounded-xl
                border
                border-[var(--paper-line)]
                bg-[var(--paper)]
                hover:bg-[var(--card)]
                hover:border-[var(--forest)]
                hover:shadow-sm
                transition-all
              "
            >
              <div
                className="
                  w-11 h-11
                  rounded-xl
                  flex items-center
                  justify-center
                "
                style={{
                  background: 'rgba(47,74,50,0.1)',
                  border: '1px solid rgba(47,74,50,0.18)',
                }}
              >
                <ArrowUpCircle
                  className="w-5 h-5"
                  style={{ color: 'var(--forest)' }}
                />
              </div>

              <div className="text-center">
                <p className="text-[12px] font-semibold text-[var(--ink)]">
                  Deposit
                </p>

                <p className="text-[10px] text-[var(--ink-faint)] mt-0.5">
                  Record a deposit
                </p>
              </div>
            </button>
          )}

          {/* WITHDRAWAL */}
          {canWithdraw && (
            <button
              type="button"
              onClick={() =>
                setTransactionModalType('withdrawal')
              }
              className="
                group
                flex flex-col
                items-center
                justify-center
                gap-3
                py-6
                px-4
                rounded-xl
                border
                border-[var(--paper-line)]
                bg-[var(--paper)]
                hover:bg-[var(--card)]
                hover:border-[var(--clay)]
                hover:shadow-sm
                transition-all
              "
            >
              <div
                className="
                  w-11 h-11
                  rounded-xl
                  flex items-center
                  justify-center
                "
                style={{
                  background: 'rgba(169,74,62,0.1)',
                  border: '1px solid rgba(169,74,62,0.18)',
                }}
              >
                <ArrowDownCircle
                  className="w-5 h-5"
                  style={{ color: 'var(--clay)' }}
                />
              </div>

              <div className="text-center">
                <p className="text-[12px] font-semibold text-[var(--ink)]">
                  Withdrawal
                </p>

                <p className="text-[10px] text-[var(--ink-faint)] mt-0.5">
                  Record a withdrawal
                </p>
              </div>
            </button>
          )}

          {/* BULK TRANSACTION */}
          {userPermissions.PROCESS_TRANSACTIONS && (
            <button
              type="button"
              onClick={() =>
                setShowBulkTransactionModal(true)
              }
              className="
                group
                flex flex-col
                items-center
                justify-center
                gap-3
                py-6
                px-4
                rounded-xl
                border
                border-[var(--paper-line)]
                bg-[var(--paper)]
                hover:bg-[var(--card)]
                hover:border-[var(--forest)]
                hover:shadow-sm
                transition-all
              "
            >
              <div
                className="
                  w-11 h-11
                  rounded-xl
                  bg-[var(--card)]
                  border border-[var(--paper-line)]
                  shadow-sm
                  flex items-center
                  justify-center
                "
              >
                <Layers
                  className="w-5 h-5"
                  style={{ color: 'var(--forest)' }}
                />
              </div>

              <div className="text-center">
                <p className="text-[12px] font-semibold text-[var(--ink)]">
                  Bulk transaction
                </p>

                <p className="text-[10px] text-[var(--ink-faint)] mt-0.5">
                  Process multiple at once
                </p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  /* ============================================================
     TRANSACTION ROW
  ============================================================ */

  const TransactionRow = ({
    tx,
  }: {
    tx: any;
  }) => {
    const initials =
      tx.customer_name
        ?.split(' ')
        .map((name: string) => name[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || '--';

    const isDeposit =
      tx.type === 'deposit';

    const status =
      statusColor[tx.status] ||
      'var(--ink-faint)';

    return (
      <div
        className="
          flex items-center
          justify-between
          gap-3
          px-5 py-3.5
          hover:bg-[var(--paper)]
          transition-colors
        "
      >
        {/* CUSTOMER */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="
              w-9 h-9
              rounded-xl
              bg-gray-100 border border-gray-200
              text-[11px]
              font-bold
              flex items-center
              justify-center
              flex-shrink-0
            "
            style={{ color: 'var(--forest-deep)' }}
          >
            {initials}
          </div>

          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[var(--ink)] truncate">
              {tx.customer_name}
            </p>

            <p className="text-[11px] text-[var(--ink-faint)]">
              {new Date(
                tx.transaction_date
              ).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
        </div>

        {/* TYPE */}
        <div className="hidden sm:flex flex-col items-center justify-center flex-shrink-0">
          <span
            className="
              text-[10px]
              font-semibold
              rounded-full
              px-2.5 py-1
              capitalize
            "
            style={{
              background: isDeposit
                ? 'rgba(47,74,50,0.1)'
                : 'rgba(169,74,62,0.1)',
              color: isDeposit
                ? 'var(--forest)'
                : 'var(--clay)',
            }}
          >
            {tx.type}
          </span>

          <p className="text-[10px] text-[var(--ink-faint)] mt-1">
            by {tx.recorded_staff_name}
          </p>
        </div>

        {/* AMOUNT */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="cd-mono text-[14px] font-semibold text-[var(--ink)] tabular-nums">
            ¢
            {Number(
              tx.amount
            ).toLocaleString()}
          </span>

          <span
            className="
              inline-flex
              items-center
              gap-1
              text-[10px]
              font-semibold
              capitalize
            "
            style={{
              color: status,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: status,
              }}
            />

            {tx.status}
          </span>
        </div>
      </div>
    );
  };

  /* ============================================================
     PENDING WITHDRAWALS
  ============================================================ */

  const PendingWithdrawalsPanel =
    () =>
      pendingWithdrawals > 0 && (
        <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl overflow-hidden shadow-sm">

          {/* HEADER */}
          <div className="px-5 sm:px-6 py-4 border-b border-[var(--paper-line)] flex items-center justify-between">
            <div>
              <h2 className="cd-display text-sm font-semibold text-[var(--ink)]">
                Pending transactions
              </h2>

              <p className="text-[11px] text-[var(--ink-faint)] mt-0.5">
                Transactions awaiting action
              </p>
            </div>

            <span
              className="
                text-[10px]
                font-semibold
                px-2.5 py-1
                rounded-full
                bg-[var(--paper)]
                text-[var(--ink-soft)]
              "
            >
              {pendingWithdrawals} pending
            </span>
          </div>

          {/* LIST */}
          <div className="divide-y divide-[var(--paper-line)]">
            {transactions
              ?.filter(
                (transaction) =>
                  transaction &&
                  transaction.status ===
                    'pending'
              )
              .map((withdrawal) => (
                <div
                  key={
                    withdrawal.transaction_id
                  }
                  className="
                    flex items-center
                    justify-between
                    gap-3
                    px-5 sm:px-6
                    py-3.5
                  "
                >
                  <div className="flex items-center gap-3 min-w-0">

                    <div
                      className="
                        w-10 h-10
                        rounded-xl
                        flex items-center
                        justify-center
                        flex-shrink-0
                      "
                      style={{
                        background: 'rgba(169,74,62,0.1)',
                        border: '1px solid rgba(169,74,62,0.18)',
                      }}
                    >
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: 'var(--clay)' }}
                      >
                        {withdrawal.customer_name
                          ?.split(' ')
                          .map(
                            (name) =>
                              name[0]
                          )
                          .join('')
                          .toUpperCase()}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[var(--ink)] truncate">
                        {withdrawal.customer_name}
                      </p>

                      <p className="text-[11px] text-[var(--ink-faint)] truncate">
                        {withdrawal.description}
                      </p>

                      <p className="text-[11px] text-[var(--ink-faint)] mt-0.5 opacity-80">
                        {new Date(
                          withdrawal.transaction_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <p className="cd-mono text-[14px] font-semibold text-[var(--ink)] flex-shrink-0">
                    ¢
                    {Number(
                      withdrawal.amount
                    ).toLocaleString()}
                  </p>
                </div>
              ))}
          </div>
        </div>
      );

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="space-y-4">

      {/* ========================================================
          FIELD VIEW
      ======================================================== */}

      {isFieldRole ? (
        <>
          {/* GREETING */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">
              Mobile Banker
            </p>

            <h1 className="cd-display text-xl sm:text-2xl font-semibold text-[var(--ink)] mt-0.5">
              {(() => {
                const hour =
                  new Date().getHours();

                if (hour < 12)
                  return 'Good morning';

                if (hour < 17)
                  return 'Good afternoon';

                return 'Good evening';
              })()}
              , {getDisplayName()}
            </h1>

            <p className="text-[12px] text-[var(--ink-faint)] mt-0.5">
              Here's what needs your attention today.
            </p>
          </div>

          <TellerFloatCard />

          <QuickActions />

          <PendingWithdrawalsPanel />

          {myRecentTransactions.length >
            0 && (
            <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-[var(--paper-line)]">
                <h2 className="cd-display text-sm font-semibold text-[var(--ink)]">
                  Your recent activity
                </h2>
              </div>

              <div className="divide-y divide-[var(--paper-line)]">
                {myRecentTransactions.map(
                  (tx) => (
                    <TransactionRow
                      key={
                        tx.transaction_id
                      }
                      tx={tx}
                    />
                  )
                )}
              </div>
            </div>
          )}
        </>
      ) : (

        /* ======================================================
           ADMIN / MANAGER VIEW
        ====================================================== */

        <>
          {/* HERO */}
          <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl overflow-hidden shadow-sm">
            <div
              className="
                cd-stitch
                relative
                overflow-hidden
                px-6 sm:px-8
                py-7
              "
              style={{
                background: 'linear-gradient(145deg,#062e1b 0%,#0b4325 55%,#14532d 100%)',
              }}
            >
              {/* subtle pattern */}
              <div
                className="
                  absolute inset-0
                  opacity-[0.06]
                  pointer-events-none
                "
                style={{
                  backgroundImage:
                    'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize:
                    '18px 18px',
                }}
              />

              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                    Executive summary
                  </p>

                  <h1 className="cd-display text-2xl sm:text-3xl font-medium text-white mt-1">
                    Dashboard overview
                  </h1>

                  <p className="text-white/60 text-[13px] mt-1 max-w-md leading-relaxed">
                    A real-time pulse of your operations for today.
                  </p>
                </div>

                {/* LIVE */}
                <div
                  className="
                    self-start
                    md:self-center
                    inline-flex
                    items-center
                    gap-2
                    bg-white/10
                    border border-white/10
                    backdrop-blur-md
                    px-3.5 py-2
                    rounded-xl
                  "
                >
                  <span className="relative flex h-2 w-2">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70"
                      style={{ background: 'var(--brass-soft)' }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-2 w-2"
                      style={{ background: 'var(--brass-soft)' }}
                    />
                  </span>

                  <span className="text-[11px] font-semibold tracking-wide text-white">
                    Live updates
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================
              STATS
          ==================================================== */}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {localStats.map(
              (stat, index) => {
                const Icon =
                  stat.icon;

                return (
                  <div
                    key={index}
                    className="
                      bg-[var(--card)]
                      border border-[var(--paper-line)]
                      rounded-2xl
                      p-4
                      shadow-sm
                      hover:shadow-md
                      transition-shadow
                    "
                  >
                    {/* ICON */}
                    <div
                      className="
                        w-10 h-10
                        rounded-xl
                        bg-gray-100 border border-gray-200
                        flex items-center
                        justify-center
                        mb-4
                      "
                    >
                      <Icon
                        className="w-4.5 h-4.5"
                        style={{ color: 'var(--forest-deep)' }}
                      />
                    </div>

                    {/* VALUE */}
                    <p
                      className="
                        cd-mono
                        text-lg sm:text-xl
                        font-semibold
                        text-[var(--ink)]
                        leading-none
                        tracking-tight
                        tabular-nums
                      "
                    >
                      {stat.value}
                    </p>

                    {/* TITLE */}
                    <p className="text-[11px] font-medium text-[var(--ink-soft)] mt-2 leading-tight">
                      {stat.title}
                    </p>

                    {/* SUBTITLE */}
                    <p className="text-[10px] text-[var(--ink-faint)] mt-1 leading-tight">
                      {stat.subtitle}
                    </p>
                  </div>
                );
              }
            )}
          </div>

          {/* ====================================================
              RECENT + QUICK ACTIONS
          ==================================================== */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* RECENT TRANSACTIONS */}
            <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl overflow-hidden shadow-sm">

              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--paper-line)]">
                <div>
                  <h2 className="cd-display text-sm font-semibold text-[var(--ink)]">
                    Recent contributions
                  </h2>

                  <p className="text-[11px] text-[var(--ink-faint)] mt-0.5">
                    Latest customer transactions
                  </p>
                </div>

                <Link
                  to="/dashboard/all-transactions"
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    text-[11px]
                    font-medium
                    bg-[var(--paper)]
                    border border-[var(--paper-line)]
                    hover:border-[var(--forest)]
                    px-3 py-1.5
                    rounded-lg
                    transition-colors
                  "
                  style={{ color: 'var(--forest)' }}
                >
                  <Eye className="w-3.5 h-3.5" />
                  View all
                </Link>
              </div>

              <div className="divide-y divide-[var(--paper-line)]">
                {recentTransactions.map(
                  (tx) => (
                    <TransactionRow
                      key={
                        tx.transaction_id
                      }
                      tx={tx}
                    />
                  )
                )}
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <QuickActions />
          </div>

          {/* ====================================================
              TODAY'S FLOAT
          ==================================================== */}

          {todaysAllFloats.length > 0 && (
            <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl overflow-hidden shadow-sm">

              <div className="px-5 sm:px-6 py-4 border-b border-[var(--paper-line)] flex justify-between items-center">
                <div>
                  <h3 className="cd-display text-sm font-semibold text-[var(--ink)]">
                    Today's float — all tellers
                  </h3>

                  <p className="text-[11px] text-[var(--ink-faint)] mt-0.5">
                    Current teller allocations
                  </p>
                </div>

                <span
                  className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-widest
                    px-2.5 py-1
                    rounded-full
                  "
                  style={{
                    background: 'rgba(47,74,50,0.08)',
                    border: '1px solid rgba(47,74,50,0.18)',
                    color: 'var(--forest)',
                  }}
                >
                  Live
                </span>
              </div>

              <div className="divide-y divide-[var(--paper-line)]">
                {todaysAllFloats.map(
                  (budget: any) => {
                    const percentage =
                      budget.allocated
                        ? Math.round(
                            (budget.spent /
                              budget.allocated) *
                              100
                          )
                        : 0;

                    const remaining =
                      budget.allocated -
                      budget.spent;

                    const isOver =
                      remaining < 0;

                    return (
                      <div
                        key={budget.id}
                        onClick={() =>
                          navigate(
                            `finance/budgets/${budget.id}`,
                            {
                              state: {
                                budget,
                              },
                            }
                          )
                        }
                        className="
                          flex items-center
                          justify-between
                          gap-3
                          px-5 sm:px-6
                          py-4
                          hover:bg-[var(--paper)]
                          transition-colors
                          cursor-pointer
                        "
                      >
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[var(--ink)] truncate">
                            {budget.teller_name ||
                              'Unassigned'}
                          </p>

                          <p className="cd-mono text-[11px] text-[var(--ink-faint)] mt-0.5">
                            ¢
                            {Number(
                              budget.spent
                            ).toLocaleString()}{' '}
                            / ¢
                            {Number(
                              budget.allocated
                            ).toLocaleString()}
                          </p>
                        </div>

                        <span
                          className="
                            px-2.5 py-1
                            rounded-full
                            text-[10px]
                            font-semibold
                            flex-shrink-0
                          "
                          style={{
                            background: isOver
                              ? 'rgba(169,74,62,0.1)'
                              : percentage > 80
                              ? 'var(--paper)'
                              : 'rgba(47,74,50,0.1)',

                            color: isOver
                              ? 'var(--clay)'
                              : percentage > 80
                              ? 'var(--ink-soft)'
                              : 'var(--forest)',
                          }}
                        >
                          {isOver
                            ? 'Limit exceeded'
                            : `${percentage}% used`}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* ====================================================
              PENDING
          ==================================================== */}

          <PendingWithdrawalsPanel />
        </>
      )}

      {/* ========================================================
          MODALS
      ======================================================== */}

      {(showAddModal ||
        editingClient) && (
        <ClientModal
          account={null}
          client={editingClient}
          onSave={
            editingClient
              ? handleEditClient
              : handleAddClient
          }
          onClose={() => {
            setShowAddModal(false);
            setEditingClient(null);
          }}
        />
      )}

      {(transactionModalType ||
        editingTransaction) && (
        <TransactionModal
          transaction={
            editingTransaction
          }
          transactionType={
            editingTransaction
              ? undefined
              : transactionModalType ??
                undefined
          }
          onSave={
            editingTransaction
              ? handleEditTransaction
              : handleAddTransaction
          }
          onClose={() => {
            setTransactionModalType(null);
            setEditingTransaction(null);
          }}
        />
      )}

      {showBulkTransactionModal && (
        <BulkTransactionModal
          companyId={companyId}
          userUUID={userUUID}
          userRole={userRole}
          onClose={() =>
            setShowBulkTransactionModal(false)
          }
          onComplete={() => {}}
        />
      )}
    </div>
  );
};

export default Overview;