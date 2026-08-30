import React, { useState, useMemo } from 'react';
import { ChevronDown, Undo2 } from 'lucide-react';
import { userPermissions } from '../../../../constants/appConstants';
import { formatCurrency, formatDate } from '../../../../utils/Formatters';
import TransactionDetailModal, { TransactionType } from './TransactionDetailModal';

interface TransactionsTabProps {
  customerTransactions: any[];
  accounts: any[];
  onReverseClick: (transactionId: string) => void;
}

const STATUS_COLOR: Record<string, string> = {
  completed: 'var(--forest)',
  approved: 'var(--brass)',
  pending: '#b8963f',
  reversed: 'var(--ink-faint)',
  rejected: 'var(--clay)',
};

const TransactionsTab: React.FC<TransactionsTabProps> = ({
  customerTransactions,
  accounts,
  onReverseClick,
}) => {
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType | null>(null);

  const filteredTransactions = useMemo(
    () =>
      customerTransactions.filter((txn) => {
        if (selectedAccount === 'all' && transactionFilter === 'all') return true;
        if (selectedAccount !== 'all' && txn.account_type !== selectedAccount) return false;
        if (transactionFilter !== 'all' && txn.type !== transactionFilter) return false;
        return true;
      }),
    [customerTransactions, selectedAccount, transactionFilter]
  );

  const selectClass =
    'appearance-none bg-[var(--paper)] border border-[var(--paper-line)] rounded-xl pl-3 pr-8 py-2.5 text-sm text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--forest-mid)] cursor-pointer w-full sm:w-auto';

  const handleRowClick = (transaction: any) => {
    setSelectedTransaction(transaction as TransactionType);
  };

  const handleReverseFromModal = (transactionId: string) => {
    setSelectedTransaction(null);
    onReverseClick(transactionId);
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 sm:px-6 py-5 border-b border-[var(--paper-line)]">
        <div>
          <h3 className="cd-display text-base font-semibold text-[var(--ink)]">Transaction history</h3>
          <p className="text-xs text-[var(--ink-faint)] mt-0.5">{filteredTransactions.length} transactions</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className={selectClass}
            >
              <option value="all">All accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.account_type}>
                  •••• {a.account_number.slice(-4)} — {a.account_type.toLowerCase()}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-faint)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={transactionFilter}
              onChange={(e) => setTransactionFilter(e.target.value)}
              className={selectClass}
            >
              <option value="all">All types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="payment">Payments</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-faint)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="py-14 text-center">
          <p className="text-sm text-[var(--ink-faint)]">No transactions found</p>
          <p className="text-xs text-[var(--ink-faint)] mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          {/* Mobile: stacked ledger cards */}
          <div className="md:hidden divide-y divide-dashed divide-[var(--paper-line)]">
            {filteredTransactions.map((transaction) => {
              const isReversed = transaction.status === 'reversed';
              const isDeleted = transaction.is_deleted;
              const isInflow = transaction.type === 'deposit' || transaction.type === 'transfer_in' || transaction.type === 'salary';
              const dot = STATUS_COLOR[transaction.status] ?? 'var(--ink-faint)';

              return (
                <div
                  key={transaction.id}
                  onClick={() => handleRowClick(transaction)}
                  className={`px-5 py-3.5 cursor-pointer hover:bg-[var(--paper)] transition-colors ${
                    isReversed || isDeleted ? 'opacity-40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={`text-[13px] font-medium truncate ${
                          isReversed ? 'line-through text-[var(--ink-faint)]' : 'text-[var(--ink)]'
                        }`}
                      >
                        {transaction.description || '—'}
                      </p>
                      <p className="text-[11px] text-[var(--ink-faint)] mt-0.5 capitalize">
                        {transaction.account_type} · {transaction.type.replace('_', ' ')} ·{' '}
                        {formatDate(transaction.transaction_date)}
                      </p>
                    </div>
                    <span
                      className="cd-mono text-sm font-semibold tabular-nums flex-shrink-0"
                      style={{ color: isReversed ? 'var(--ink-faint)' : isInflow ? 'var(--forest)' : 'var(--clay)' }}
                    >
                      {isInflow ? '+' : '−'}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
                      <span style={{ color: dot }}>{transaction.status}</span>
                      <span className="text-[var(--ink-faint)] ml-1">
                        · {transaction.payment_method ?? 'Cash'}
                      </span>
                    </span>

                    {userPermissions.REVERSE_TRANSACTIONS && !isReversed && (
                      <button
                        disabled={isDeleted}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isDeleted) onReverseClick(transaction.id);
                        }}
                        className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-md px-2 py-1
                          ${
                            isDeleted
                              ? 'text-[var(--ink-faint)] cursor-not-allowed'
                              : 'text-[var(--ink-faint)] hover:text-[var(--clay)] hover:bg-[var(--clay-soft)]'
                          }`}
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        Reverse
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop / tablet: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--paper-line)]">
                  {['Date', 'Account', 'Type', 'Method', 'Description', '', '', ''].map((h, i) => (
                    <th
                      key={i}
                      className={`py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-faint)] bg-[var(--paper)]
                        ${i === 0 ? 'pl-5 text-left' : ''}
                        ${i === 5 ? 'text-right' : ''}
                        ${i === 6 ? 'text-center' : ''}
                        ${i === 7 ? 'pr-5 text-right' : ''}
                        ${i > 0 && i < 5 ? 'text-left' : ''}`}
                    >
                      {['Date', 'Account', 'Type', 'Method', 'Description', 'Amount', 'Status', ''][i]}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--paper-line)]">
                {filteredTransactions.map((transaction) => {
                  const isReversed = transaction.status === 'reversed';
                  const isDeleted = transaction.is_deleted;
                  const isInflow = transaction.type === 'deposit' || transaction.type === 'transfer_in' || transaction.type === 'salary';
                  const dot = STATUS_COLOR[transaction.status] ?? 'var(--ink-faint)';

                  return (
                    <tr
                      key={transaction.id}
                      onClick={() => handleRowClick(transaction)}
                      className={`group transition-colors last:border-0 cursor-pointer
                        ${isReversed || isDeleted ? 'opacity-40' : 'hover:bg-[var(--paper)]'}`}
                    >
                      <td className="py-3 pl-5 pr-3 whitespace-nowrap">
                        <span
                          className={`text-xs font-medium ${
                            isReversed ? 'text-[var(--ink-faint)]' : 'text-[var(--ink-soft)]'
                          }`}
                        >
                          {formatDate(transaction.transaction_date)}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 bg-[var(--paper)] rounded-md px-2 py-0.5 text-[11px] font-medium text-[var(--ink-soft)]">
                          {transaction.account_type}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-block rounded-md px-2 py-0.5 text-[11px] font-medium capitalize bg-[var(--paper)] text-[var(--ink-soft)]">
                          {transaction.type.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-block rounded-md px-2 py-0.5 text-[11px] font-medium capitalize bg-[var(--paper)] text-[var(--ink-soft)]">
                          {transaction.payment_method ?? 'Cash'}
                        </span>
                      </td>

                      <td className="py-3 px-3 max-w-[180px]">
                        <p
                          className={`text-xs truncate ${
                            isReversed ? 'line-through text-[var(--ink-faint)]' : 'text-[var(--ink-soft)]'
                          }`}
                        >
                          {transaction.description || <span className="text-[var(--ink-faint)]">—</span>}
                        </p>
                        {isReversed && transaction.reversed_by_name ? (
                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--clay)' }}>
                            Reversed by {transaction.reversed_by_name}
                          </p>
                        ) : (
                          <p className="text-[11px] text-[var(--ink-faint)] mt-0.5">
                            by {transaction.recorded_staff_name}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span
                          className="cd-mono text-sm font-semibold tabular-nums"
                          style={{
                            color: isReversed ? 'var(--ink-faint)' : isInflow ? 'var(--forest)' : 'var(--clay)',
                          }}
                        >
                          {isInflow ? '+' : '−'}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot }} />
                          <span style={{ color: dot }}>{transaction.status}</span>
                        </span>
                      </td>

                      <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
                        {userPermissions.REVERSE_TRANSACTIONS && !isReversed && (
                          <button
                            disabled={isDeleted}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isDeleted) onReverseClick(transaction.id);
                            }}
                            className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-md px-2 py-1 transition-all
                              ${
                                isDeleted
                                  ? 'text-[var(--ink-faint)] cursor-not-allowed'
                                  : 'text-[var(--ink-faint)] hover:text-[var(--clay)] hover:bg-[var(--clay-soft)] opacity-0 group-hover:opacity-100 cursor-pointer'
                              }`}
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            Reverse
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <TransactionDetailModal
        isOpen={!!selectedTransaction}
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onReverseClick={handleReverseFromModal}
      />
    </div>
  );
};

export default TransactionsTab;