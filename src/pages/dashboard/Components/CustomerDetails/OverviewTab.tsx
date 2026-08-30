import React from 'react';
import { Wallet, Calendar } from 'lucide-react';
import { formatCurrency, formatDate, getTransactionIcon } from '../../../../utils/Formatters';
import { CustomerViewData } from './Types';

interface OverviewTabProps {
  customerData: CustomerViewData;
  accounts: any[];
  customerTransactions: any[];
  onViewAllTransactions: () => void;
}

const STATUS_COLOR: Record<string, string> = {
  completed: 'var(--forest)',
  approved: 'var(--brass)',
  pending: '#b8963f',
  reversed: 'var(--ink-faint)',
  rejected: 'var(--clay)',
};

const OverviewTab: React.FC<OverviewTabProps> = ({
  customerData,
  accounts,
  customerTransactions,
  onViewAllTransactions,
}) => {
  const statCards = [
    {
      label: 'Total balance',
      value: formatCurrency(customerData.totalBalance),
      icon: Wallet,
    },
    {
      label: 'Monthly contribution',
      value: formatCurrency(customerData.monthlyContribution),
      icon: Calendar,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl p-4 sm:p-5 flex items-start justify-between"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-faint)] mb-1.5">
                {label}
              </p>
              <p className="cd-display text-2xl sm:text-[26px] font-medium text-[var(--ink)] tracking-tight leading-none truncate">
                {value}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--brass-soft)] flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-[var(--forest-deep)]" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Transactions — ledger rows */}
        <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--paper-line)]">
            <h3 className="cd-display text-sm font-semibold text-[var(--ink)]">Recent transactions</h3>
            <button
              onClick={onViewAllTransactions}
              className="text-[12px] font-medium text-[var(--forest)] bg-[var(--brass-soft)] hover:brightness-95 px-3 py-1.5 rounded-lg transition"
            >
              View all
            </button>
          </div>

          <div>
            {customerTransactions.slice(0, 5).map((tx, i) => {
              const isInflow = tx.type === 'deposit' || tx.type === 'transfer_in' || tx.type === 'salary';
              const dot = STATUS_COLOR[tx.status] ?? 'var(--ink-faint)';

              return (
                <div
                  key={tx.transaction_id}
                  className={`flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 hover:bg-[var(--paper)] transition-colors
                    ${i < 4 ? 'border-b border-dashed border-[var(--paper-line)]' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isInflow ? 'rgba(47,74,50,0.1)' : 'rgba(169,74,62,0.1)',
                        color: isInflow ? 'var(--forest)' : 'var(--clay)',
                      }}
                    >
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[var(--ink)] leading-snug truncate">
                        {tx.description || '—'}
                      </p>
                      <p className="text-[11px] text-[var(--ink-faint)] mt-0.5 capitalize truncate">
                        {tx.account_type} · {tx.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className="cd-mono text-[14px] font-semibold tabular-nums"
                      style={{ color: isInflow ? 'var(--forest)' : 'var(--clay)' }}
                    >
                      {isInflow ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </p>
                    <p className="text-[11px] text-[var(--ink-faint)] mt-0.5">
                      {formatDate(tx.transaction_date)}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
                      <span style={{ color: dot }}>{tx.status}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Account Summary — passbook stubs */}
        <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--paper-line)]">
            <h3 className="cd-display text-sm font-semibold text-[var(--ink)]">Account summary</h3>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="border border-dashed border-[var(--paper-line)] rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[12px] font-semibold text-[var(--ink-soft)] capitalize">
                    {account.account_type}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: account.status === 'Active' ? 'rgba(47,74,50,0.1)' : 'var(--paper)',
                      color: account.status === 'Active' ? 'var(--forest)' : 'var(--ink-faint)',
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: account.status === 'Active' ? 'var(--forest)' : 'var(--ink-faint)' }}
                    />
                    {account.status}
                  </span>
                </div>
                <p
                  className="cd-display text-[20px] font-medium tracking-tight leading-none"
                  style={{ color: Number(account.balance) >= 0 ? 'var(--ink)' : 'var(--clay)' }}
                >
                  {formatCurrency(account.balance)}
                </p>
                <p className="cd-mono text-[11px] text-[var(--ink-faint)] mt-1.5 tracking-wide">
                  •••• {account.account_number?.slice(-4)}
                </p>
                <p className="text-[11px] text-[var(--ink-faint)] mt-0.5">
                  Opened {formatDate(account.created_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;