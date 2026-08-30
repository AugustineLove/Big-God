import React from 'react';
import { Edit3, Download, UserRound, Wallet } from 'lucide-react';
import { CustomerViewData } from './Types';
import { formatCurrencyCompact, formatDate } from '../../../../utils/Formatters';
import { userPermissions } from '../../../../constants/appConstants';
interface CustomerHeaderProps {
  customerData: CustomerViewData;
  accounts: any[];
  accountSummary: any;
  onEdit: () => void;
}

interface Chip {
  label: string;
  value: number | null | undefined;
  sign: '+' | '−';
}

const CHIPS = (accountSummary: any): Chip[] => [
  {
    label: 'Deposits',
    value: accountSummary?.totalDeposits,
    sign: '+',
  },
  {
    label: 'Withdrawals',
    value: accountSummary?.totalWithdrawals,
    sign: '−',
  },
  {
    label: 'Transfer in',
    value: accountSummary?.totalTransferIns,
    sign: '+',
  },
  {
    label: 'Transfer out',
    value: accountSummary?.totalTransferOuts,
    sign: '−',
  },
  {
    label: 'Commission',
    value: accountSummary?.totalCommissions,
    sign: '+',
  },
];

const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  customerData,
  accounts,
  accountSummary,
  onEdit,
}) => {
  const isActive = customerData.status === 'Active';
  
  const initials =
    customerData.fullName
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((name) => name.charAt(0))
      .join('')
      .toUpperCase() || 'CU';

  const balance = Number(accountSummary?.totalBalance || 0);

  return (
    <div
      className="
        overflow-hidden
        rounded-3xl
        border border-[#dfe5df]
        bg-white
        shadow-[0_1px_3px_rgba(20,32,20,0.06),0_14px_35px_-18px_rgba(20,32,20,0.28)]
      "
    >
      {/* =========================================================
          DARK CUSTOMER COVER
      ========================================================== */}
      <section
        className="
          relative
          overflow-hidden
          bg-[linear-gradient(145deg,#062e1b_0%,#0a4024_48%,#14532d_100%)]
          px-5
          pb-6
          pt-5
          sm:px-7
          sm:pb-7
          sm:pt-6
        "
      >
        {/* Decorative glow */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-20
            -top-24
            h-64
            w-64
            rounded-full
            bg-white/[0.035]
            blur-2xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -bottom-28
            -left-24
            h-64
            w-64
            rounded-full
            bg-[#65d83a]/[0.035]
            blur-3xl
          "
        />

        {/* =====================================================
            TOP ROW
        ====================================================== */}
        <div className="relative flex items-start justify-between gap-4">
          {/* Customer identity */}
          <div className="flex min-w-0 items-center gap-3">
            {/* White avatar */}
            <div
              className="
                flex
                h-11
                w-11
                flex-shrink-0
                items-center
                justify-center
                rounded-2xl
                border
                border-white/60
                bg-white
                text-sm
                font-semibold
                text-[#12351f]
                shadow-[0_5px_14px_rgba(0,0,0,0.16)]
                sm:h-12
                sm:w-12
              "
            >
              {initials}
            </div>

            <div className="min-w-0">
              <h1
                className="
                  truncate
                  text-[17px]
                  font-semibold
                  leading-tight
                  tracking-[-0.02em]
                  text-white
                  sm:text-lg
                "
              >
                {customerData.fullName || 'Unnamed customer'}
              </h1>

              <p
                className="
                  mt-1
                  truncate
                  font-mono
                  text-[10px]
                  tracking-wide
                  text-white/50
                "
              >
                {customerData.id || 'No customer ID'}
              </p>

              <p className="mt-1 text-[10px] text-white/45">
                Member since{' '}
                {customerData.date_of_registration
                  ? formatDate(customerData.date_of_registration)
                  : '—'}
              </p>
            </div>
          </div>

          {/* Status */}
          <div
            className={`
              flex
              flex-shrink-0
              items-center
              gap-1.5
              rounded-full
              border
              px-2.5
              py-1.5
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.12em]
              backdrop-blur-sm
              ${
                isActive
                  ? 'border-white/15 bg-white/[0.09] text-white/90'
                  : 'border-white/10 bg-black/10 text-white/50'
              }
            `}
          >
            <span
              className={`
                h-1.5
                w-1.5
                rounded-full
                ${isActive ? 'bg-[#8ee66b]' : 'bg-white/35'}
              `}
            />

            {isActive ? 'Active' : 'Paused'}
          </div>
        </div>

        {/* =====================================================
            BALANCE
        ====================================================== */}
        <div className="relative mt-7">
          <div className="flex items-center gap-2">
            <Wallet className="h-3.5 w-3.5 text-white/40" />

            <p
              className="
                text-[9px]
                font-medium
                uppercase
                tracking-[0.18em]
                text-white/45
              "
            >
              Current balance
            </p>
          </div>

          <p
            className="
              mt-1
              text-3xl
              font-semibold
              tracking-[-0.04em]
              text-white
              sm:text-4xl
            "
          >
            {formatCurrencyCompact(balance)}
          </p>
        </div>

        {/* =====================================================
            SUMMARY CHIPS
        ====================================================== */}
        <div
          className="
            cd-scroller
            relative
            -mx-1
            mt-5
            flex
            gap-2
            overflow-x-auto
            px-1
            pb-1
            sm:flex-wrap
          "
        >
          {CHIPS(accountSummary).map((chip) => (
            <div
              key={chip.label}
              className="
                flex-shrink-0
                rounded-xl
                border
                border-white/[0.12]
                bg-white/[0.075]
                px-3
                py-2.5
                shadow-[0_2px_8px_rgba(0,0,0,0.06)]
                backdrop-blur-sm
              "
            >
              <p className="whitespace-nowrap text-[9px] font-medium text-white/45">
                {chip.label}
              </p>

              <p
                className={`
                  mt-0.5
                  whitespace-nowrap
                  font-mono
                  text-[12px]
                  font-medium
                  ${
                    chip.sign === '+'
                      ? 'text-white/90'
                      : 'text-white/70'
                  }
                `}
              >
                {chip.sign} GHS{' '}
                {Number(chip.value || 0).toLocaleString('en-GH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          ))}
        </div>

        {/* =====================================================
            ACTIONS
        ====================================================== */}
        <div className="relative mt-5 flex items-center gap-2">
          {userPermissions.CUSTOMER_CREATE && (
            <button
              type="button"
              onClick={onEdit}
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-xl
                border
                border-white/15
                bg-white/[0.10]
                px-3
                py-2
                text-xs
                font-medium
                text-white
                shadow-sm
                backdrop-blur-sm
                transition-all
                duration-200
                hover:bg-white/[0.16]
                active:scale-[0.98]
              "
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit profile
            </button>
          )}

          <button
            type="button"
            className="
              inline-flex
              items-center
              gap-1.5
              rounded-xl
              border
              border-white/15
              bg-white/[0.06]
              px-3
              py-2
              text-xs
              font-medium
              text-white/85
              transition-all
              duration-200
              hover:bg-white/[0.12]
              active:scale-[0.98]
            "
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </section>

      {/* =========================================================
          ACCOUNTS SECTION
      ========================================================== */}
      <section className="bg-white">
        {/* Section heading */}
        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-[#e5e9e5]
            bg-[#fafbfa]
            px-4
            py-3
            sm:px-5
          "
        >
          <div className="flex items-center gap-2">
            <div
              className="
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-lg
                bg-[#eef2ee]
                text-[#2f4a32]
              "
            >
              <UserRound className="h-3.5 w-3.5" />
            </div>

            <div>
              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-[#5c6b5d]
                "
              >
                Accounts
              </p>

              <p className="text-[10px] text-[#97a395]">
                {accounts?.length || 0}{' '}
                {accounts?.length === 1 ? 'account' : 'accounts'} on file
              </p>
            </div>
          </div>
        </div>

        {/* Account list */}
        {accounts?.length > 0 ? (
          <div>
            {accounts.map((acc, index) => (
              <div
                key={acc.id || acc.account_number || index}
                className="
                  group
                  flex
                  items-center
                  gap-2
                  border-b
                  border-dashed
                  border-[#e5e9e5]
                  px-4
                  py-3.5
                  transition-colors
                  last:border-b-0
                  hover:bg-[#f8faf8]
                  sm:px-5
                "
              >
                {/* Account icon */}
                <div
                  className="
                    flex
                    h-8
                    w-8
                    flex-shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    bg-[#f1f4f1]
                    text-[#3e6142]
                    transition-colors
                    group-hover:bg-[#e7eee8]
                  "
                >
                  <Wallet className="h-3.5 w-3.5" />
                </div>

                {/* Account details */}
                <div className="min-w-0">
                  <p
                    className="
                      truncate
                      text-xs
                      font-semibold
                      capitalize
                      text-[#1e2a1f]
                    "
                  >
                    {acc.account_type || 'Account'}
                  </p>

                  <p
                    className="
                      mt-0.5
                      truncate
                      font-mono
                      text-[9px]
                      tracking-wide
                      text-[#97a395]
                    "
                  >
                    {acc.account_number || 'No account number'}
                  </p>
                </div>

                {/* Dotted leader */}
                <div
                  className="
                    mx-1
                    min-w-[20px]
                    flex-1
                    border-b
                    border-dotted
                    border-[#dfe5df]
                  "
                />

                {/* Balance */}
                <div className="flex-shrink-0 text-right">
                  <p
                    className="
                      font-mono
                      text-xs
                      font-semibold
                      tabular-nums
                      text-[#1e2a1f]
                    "
                  >
                    GHS{' '}
                    {Number(acc.balance || 0).toLocaleString('en-GH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="px-5 py-8 text-center">
            <div
              className="
                mx-auto
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-[#f1f3f1]
                text-[#8b9890]
              "
            >
              <Wallet className="h-4 w-4" />
            </div>

            <p className="mt-2 text-xs font-medium text-[#5c6b5d]">
              No accounts found
            </p>

            <p className="mt-0.5 text-[10px] text-[#97a395]">
              This customer has no accounts on file.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default CustomerHeader;