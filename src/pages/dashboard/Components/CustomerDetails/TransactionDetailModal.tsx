import React from 'react';
import {
  X,
  Calendar,
  Hash,
  CreditCard,
  User,
  Phone,
  Landmark,
  FileText,
  Wallet,
  Undo2,
  ShieldCheck,
  AlertTriangle,
  StickyNote,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../../utils/Formatters';
import { userPermissions } from '../../../../constants/appConstants';

export type TransactionType = {
  transaction_id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'commission';
  description: string;
  transaction_date: string;
  account_number: string;
  customer_name: string;
  customer_phone: string;
  staff_name: string;
  account_type: string;
  status: string;
  account_id?: string;
  customer_id?: string;
  unique_code: string;
  recorded_staff_name?: string;
  mobile_banker_name?: string;
  recorded_staff_id?: string;
  mobile_banker_id?: string;
  reversed_at?: string;
  reversed_by?: string;
  reversal_reason?: string;
  reversed_by_name?: string;
  is_deleted?: boolean;
  withdrawal_type?: string;
  processing_status?: string;
  processed_by?: string;
  processed_at?: string;
  payment_reference?: string;
  agent_note?: string;
  payment_method?: string;
};

interface TransactionDetailModalProps {
  isOpen: boolean;
  transaction: TransactionType | null;
  onClose: () => void;
  onReverseClick?: (transactionId: string) => void;
}

const STATUS_COLOR: Record<string, string> = {
  completed: 'var(--forest)',
  approved: 'var(--brass)',
  pending: '#b8963f',
  reversed: 'var(--ink-faint)',
  rejected: 'var(--clay)',
};

const Row = ({
  icon: Icon,
  label,
  value,
  mono,
  border,
}: {
  icon: any;
  label: string;
  value?: React.ReactNode;
  mono?: boolean;
  border?: boolean;
}) => (
  <div className={`flex items-start gap-3 py-3 ${border ? 'border-b border-dashed border-[var(--paper-line)]' : ''}`}>
    <div className="w-8 h-8 rounded-lg bg-[var(--paper)] flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-3.5 h-3.5 text-[var(--ink-faint)]" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-medium text-[var(--ink-faint)] mb-0.5">{label}</p>
      <p
        className={`text-[13px] font-medium text-[var(--ink)] break-words leading-snug ${
          mono ? 'cd-mono tracking-wide text-[12px]' : ''
        }`}
      >
        {value ?? '—'}
      </p>
    </div>
  </div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-semibold text-[var(--brass)] uppercase tracking-wider mb-1 mt-5 first:mt-0">
    {children}
  </p>
);

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onReverseClick,
}) => {
  if (!isOpen || !transaction) return null;

  const isReversed = transaction.status === 'reversed';
  const isDeleted = !!transaction.is_deleted;
  const isInflow = transaction.type === 'deposit';
  const dot = STATUS_COLOR[transaction.status] ?? 'var(--ink-faint)';
  const canReverse = userPermissions.REVERSE_TRANSACTIONS && !isReversed && !isDeleted;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[rgba(6,20,10,0.55)] backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="cd-root w-full max-w-lg max-h-[90vh] overflow-hidden rounded-3xl shadow-[0_1px_2px_rgba(20,32,20,0.08),0_24px_48px_-16px_rgba(20,32,20,0.45)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover: dark passbook face */}
        <div className="cd-stitch relative overflow-hidden bg-[linear-gradient(145deg,#062e1b_0%,#0b4325_55%,#14532d_100%)] px-5 pt-5 pb-6 sm:px-7 sm:pt-6 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.18)] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <p className="text-[10px] uppercase tracking-[0.18em] text-[rgba(255,255,255,0.5)]">
            Transaction
          </p>
          <p className="cd-mono text-[11px] text-[rgba(255,255,255,0.55)] mt-1 tracking-wide">
            {transaction.unique_code || transaction.transaction_id}
          </p>

          <p className="cd-display text-3xl sm:text-4xl font-medium text-white mt-4 tabular-nums">
            {isInflow ? '+' : '−'}
            {formatCurrency(transaction.amount)}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
            >
              {transaction.type}
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
              {transaction.status}
            </span>
            {isDeleted && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-[rgba(169,74,62,0.25)] text-white">
                Deleted
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="bg-[var(--card)] px-5 sm:px-7 py-5 overflow-y-auto">
          <SectionLabel>Transaction</SectionLabel>
          <Row icon={Calendar} label="Date" value={formatDate(transaction.transaction_date)} border />
          <Row
            icon={FileText}
            label="Description"
            value={transaction.description || undefined}
            border
          />
          <Row
            icon={Wallet}
            label="Payment method"
            value={<span className="capitalize">{transaction.payment_method || 'Cash'}</span>}
            border
          />
          {transaction.withdrawal_type && (
            <Row
              icon={Wallet}
              label="Withdrawal type"
              value={<span className="capitalize">{transaction.withdrawal_type}</span>}
              border
            />
          )}
          <Row
            icon={Hash}
            label="Payment reference"
            value={transaction.payment_reference || undefined}
            mono
          />

          <SectionLabel>Account &amp; customer</SectionLabel>
          <Row
            icon={CreditCard}
            label="Account number"
            value={transaction.account_number}
            mono
            border
          />
          <Row
            icon={Landmark}
            label="Account type"
            value={<span className="capitalize">{transaction.account_type}</span>}
            border
          />
          <Row icon={User} label="Customer" value={transaction.customer_name} border />
          <Row icon={Phone} label="Customer phone" value={transaction.customer_phone} />

          <SectionLabel>Staff</SectionLabel>
          <Row
            icon={User}
            label="Recorded by"
            value={transaction.recorded_staff_name || transaction.staff_name}
            border
          />
          <Row icon={User} label="Mobile banker" value={transaction.mobile_banker_name || undefined} />

          {transaction.processing_status && (
            <>
              <SectionLabel>Processing</SectionLabel>
              <Row
                icon={ShieldCheck}
                label="Processing status"
                value={<span className="capitalize">{transaction.processing_status}</span>}
                border
              />
              <Row icon={User} label="Processed by" value={transaction.processed_by || undefined} border />
              <Row
                icon={Calendar}
                label="Processed at"
                value={transaction.processed_at ? formatDate(transaction.processed_at) : undefined}
              />
            </>
          )}

          {transaction.agent_note && (
            <>
              <SectionLabel>Agent note</SectionLabel>
              <Row icon={StickyNote} label="Note" value={transaction.agent_note} />
            </>
          )}

          {isReversed && (
            <>
              <SectionLabel>Reversal</SectionLabel>
              <div className="rounded-xl border border-dashed p-1" style={{ borderColor: 'var(--clay)' }}>
                <Row
                  icon={AlertTriangle}
                  label="Reversed at"
                  value={transaction.reversed_at ? formatDate(transaction.reversed_at) : undefined}
                  border
                />
                <Row icon={User} label="Reversed by" value={transaction.reversed_by_name} border />
                <Row icon={FileText} label="Reason" value={transaction.reversal_reason || undefined} />
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-[var(--card)] border-t border-[var(--paper-line)] px-5 sm:px-7 py-4 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--ink-soft)] border border-[var(--paper-line)] rounded-xl hover:bg-[var(--paper)] transition-colors"
          >
            Close
          </button>
          {canReverse && onReverseClick && (
            <button
              onClick={() => onReverseClick(transaction.transaction_id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-colors"
              style={{ background: 'var(--clay-soft)', color: 'var(--clay)' }}
            >
              <Undo2 className="w-3.5 h-3.5" />
              Reverse transaction
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;