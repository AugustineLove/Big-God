import React, { useState } from 'react';
import {
  CreditCard,
  Building,
  Settings,
  Trash2,
  ArrowLeftRight,
  TrendingUp,
} from 'lucide-react';
import { userPermissions } from '../../../../constants/appConstants';
// This tab now sits one folder deeper than the old page-level imports did
// (…/CustomerDetails/Components/CustomerDetails/AccountsTab.tsx), so the
// path gains one '../' versus the original './Components/accountSettingsModal'.
import AccountSettingsModal from '../accountSettingsModal';
import { formatCurrency, formatDate } from '../../../../utils/Formatters';

interface AccountsTabProps {
  accounts: any[];
  customerLoans: any[];
  id: string | undefined;
  toggleAccountStatus: (accountId: string) => Promise<void>;
  refreshAccounts: (id: string) => Promise<void>;
  onAddAccountClick: () => void;
  onTransferClick: () => void;
  onInvestClick: () => void;
  onChargesClick: () => void;
  onCardClick: (accountId: string) => void;
  onDeleteAccount: (accountId: string) => void;
}

const ACTIONS = [
  { key: 'add', label: 'Add account', icon: CreditCard, permission: 'ALTER_ACCOUNT' as const },
  { key: 'transfer', label: 'Transfer', icon: ArrowLeftRight, permission: 'MANAGE_CASHACCOUNTS' as const },
  { key: 'invest', label: 'Invest', icon: TrendingUp, permission: 'MANAGE_CASHACCOUNTS' as const },
  { key: 'charges', label: 'Charges', icon: CreditCard, permission: 'MANAGE_CASHACCOUNTS' as const },
];

const AccountsTab: React.FC<AccountsTabProps> = ({
  accounts,
  customerLoans,
  id,
  toggleAccountStatus,
  refreshAccounts,
  onAddAccountClick,
  onTransferClick,
  onInvestClick,
  onChargesClick,
  onCardClick,
  onDeleteAccount,
}) => {
  const handlers: Record<string, () => void> = {
    add: onAddAccountClick,
    transfer: onTransferClick,
    invest: onInvestClick,
    charges: onChargesClick,
  };

  // Settings modal is only relevant to this tab, so it lives here instead
  // of being threaded through the page-level state.
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsAccount, setSettingsAccount] = useState<any>(undefined);

  const handleOpenSettings = (account: any) => {
    setSettingsAccount(account);
    setShowSettingsModal(true);
  };

  const handleSettingsSave = async (_updatedAccount: any) => {
    // Hook up to refreshAccounts / API call as needed.
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h3 className="cd-display text-base sm:text-lg font-semibold text-[var(--ink)]">
          Customer accounts
        </h3>

        <div className="cd-scroller flex gap-2 overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
          {ACTIONS.filter((a) => userPermissions[a.permission]).map((a) => (
            <button
              key={a.key}
              onClick={handlers[a.key]}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-white bg-[var(--forest)] hover:bg-[var(--forest-deep)] transition-colors whitespace-nowrap"
            >
              <a.icon className="w-3.5 h-3.5" />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts grid */}
      {accounts.length === 0 ? (
        <div className="text-center py-10 bg-[var(--paper)] rounded-xl border border-dashed border-[var(--paper-line)]">
          <CreditCard className="w-7 h-7 mx-auto mb-2 text-[var(--ink-faint)]" />
          <p className="text-sm text-[var(--ink-soft)]">This customer has no operational accounts yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-[var(--card)] border border-[var(--paper-line)] border-l-[3px] border-l-[var(--brass)] rounded-2xl overflow-hidden hover:shadow-[0_10px_24px_-16px_rgba(20,32,20,0.4)] transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-[var(--forest)] flex items-center justify-center">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--ink-faint)]">{account.status}</span>
                    <button
                      onClick={async () => {
                        await toggleAccountStatus(account.id);
                        await refreshAccounts(id || '');
                      }}
                      className="relative inline-flex h-[18px] w-[34px] items-center rounded-full transition-colors"
                      style={{ background: account.status === 'Active' ? 'var(--forest)' : 'var(--paper-line)' }}
                    >
                      <span
                        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform"
                        style={{
                          transform: account.status === 'Active' ? 'translateX(18px)' : 'translateX(2px)',
                        }}
                      />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--ink-faint)] mb-0.5">
                  {account.account_type} account
                </p>
                <p className="cd-mono text-sm text-[var(--ink-soft)] tracking-wider">
                  {account.account_number}
                </p>

                {account.account_type !== 'savings' && (
                  <div className="mt-4">
                    <p className="text-[11px] text-[var(--ink-faint)] mb-1">Rate</p>
                    <p
                      className="cd-mono text-[12px] tracking-tight leading-none"
                      style={{ color: Number(account.daily_rate) >= 0 ? 'var(--ink)' : 'var(--clay)' }}
                    >
                      {formatCurrency(account.daily_rate)}
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <p className="text-[11px] text-[var(--ink-faint)] mb-1">Balance</p>
                  <p
                    className="cd-display text-[26px] sm:text-[28px] font-medium tracking-tight leading-none"
                    style={{ color: Number(account.balance) >= 0 ? 'var(--ink)' : 'var(--clay)' }}
                  >
                    {formatCurrency(account.balance)}
                  </p>
                </div>
              </div>

              <div className="border-t border-[var(--paper-line)] flex">
                <div className="flex-1 px-5 py-3">
                  <p className="text-[11px] text-[var(--ink-faint)] mb-0.5">Min balance</p>
                  <p className="cd-mono text-sm font-medium text-[var(--brass)]">
                    {formatCurrency(account.minimum_balance)}
                  </p>
                </div>
                <div className="flex-1 px-5 py-3 border-l border-[var(--paper-line)]">
                  <p className="text-[11px] text-[var(--ink-faint)] mb-0.5">Opened</p>
                  <p className="text-sm font-medium text-[var(--ink-soft)]">{formatDate(account.created_at)}</p>
                </div>
              </div>

              <div className="border-t border-[var(--paper-line)] flex">
                <button
                  onClick={() => handleOpenSettings(account)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--paper)] hover:text-[var(--ink)] transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={() => onCardClick(account.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium text-[var(--ink-soft)] border-l border-[var(--paper-line)] hover:bg-[var(--paper)] hover:text-[var(--ink)] transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  Card
                </button>
                <button
                  onClick={() => onDeleteAccount(account.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium text-[var(--ink-faint)] border-l border-[var(--paper-line)] hover:bg-[var(--clay-soft)] hover:text-[var(--clay)] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loans */}
      <div className="mt-10">
        <h3 className="cd-display text-base sm:text-lg font-semibold text-[var(--ink)] mb-4">
          Loan accounts
        </h3>

        {customerLoans.length === 0 ? (
          <div className="text-center py-10 bg-[var(--paper)] rounded-xl border border-dashed border-[var(--paper-line)]">
            <CreditCard className="w-7 h-7 mx-auto mb-2 text-[var(--ink-faint)]" />
            <p className="text-sm text-[var(--ink-soft)]">This customer has not requested any loans.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {customerLoans.map((loan) => (
              <div
                key={loan.id}
                className="border border-[var(--paper-line)] rounded-xl p-5 sm:p-6 bg-[var(--card)] hover:shadow-[0_10px_24px_-16px_rgba(20,32,20,0.4)] transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--forest)] flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{
                      background:
                        loan.status === 'approved'
                          ? 'rgba(47,74,50,0.1)'
                          : loan.status === 'overdue'
                          ? 'var(--clay-soft)'
                          : 'var(--brass-soft)',
                      color:
                        loan.status === 'approved'
                          ? 'var(--forest)'
                          : loan.status === 'overdue'
                          ? 'var(--clay)'
                          : '#8a6224',
                    }}
                  >
                    {loan.status}
                  </span>
                </div>

                <h4 className="cd-display text-lg font-semibold text-[var(--ink)]">{loan.loanType}</h4>
                <p className="text-[10px] text-[var(--ink-faint)] mb-2">Loan ID {loan.id}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-soft)]">Requested amount:</span>
                    <span className="cd-mono font-medium text-[var(--ink)]">
                      {formatCurrency(loan.loanAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-soft)]">Tenure:</span>
                    <span className="font-medium text-[var(--ink)]">{loan.loanTerm} months</span>
                  </div>
                  {loan.interestRateLoan && (
                    <div className="flex justify-between">
                      <span className="text-[var(--ink-soft)]">Interest:</span>
                      <span className="font-medium text-[var(--ink)]">{loan.interestRateLoan}%</span>
                    </div>
                  )}
                  {loan.disbursementDate && (
                    <div className="flex justify-between">
                      <span className="text-[var(--ink-soft)]">Disbursed:</span>
                      <span className="font-medium text-[var(--ink)]">{formatDate(loan.disbursementDate)}</span>
                    </div>
                  )}
                  {loan.maturityDate && (
                    <div className="flex justify-between">
                      <span className="text-[var(--ink-soft)]">Maturity:</span>
                      <span className="font-medium text-[var(--ink)]">{formatDate(loan.maturityDate)}</span>
                    </div>
                  )}
                  {loan.daysOverdue > 0 && (
                    <div className="mt-2 text-xs" style={{ color: 'var(--clay)' }}>
                      {loan.daysOverdue} days overdue
                    </div>
                  )}
                </div>

                {loan.purpose && (
                  <div className="mt-3 p-2 bg-[var(--paper)] rounded-lg border border-[var(--paper-line)] text-xs text-[var(--ink-soft)]">
                    Purpose: {loan.purpose}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AccountSettingsModal
        account={settingsAccount}
        isOpen={showSettingsModal}
        onClose={() => {
          setShowSettingsModal(false);
          setSettingsAccount(undefined);
        }}
        onSave={handleSettingsSave}
      />
    </div>
  );
};

export default AccountsTab;