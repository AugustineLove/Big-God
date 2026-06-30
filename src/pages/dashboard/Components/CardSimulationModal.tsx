// components/CardSimulationModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Stamp,
  Clock3,
  CircleDashed,
  CheckCircle2,
  ArrowUpRight,
  Coins,
} from "lucide-react";

type CardLine = {
  lineNumber: number;
  side: "left" | "right";
  sideIndex: number;
  amount: number;
  filled: boolean;
  date: string | null;
  pending: boolean;
  pendingAmount: number;
  pendingPercent: number;
};

type CardPage = {
  pageNumber: number;
  pageCapacity: number;
  linesStaked: number;
  linesRemaining: number;
  stakedAmount: number;
  status: "completed" | "advance" | "open";
  withdrawnOnPage: number;
  commissionTaken: number;
  balanceOnPage: number;
  payoutToCustomer: number;
  lines: CardLine[];
};

type CardData = {
  account: {
    account_number: string;
    account_type: string;
    status: string;
    start_date: string;
    rate: number;
    current_balance: number;
  };
  rate: number;
  pageCapacity: number;
  totals: {
    totalDeposited: number;
    totalWithdrawn: number;
    totalLinesStaked: number;
    partialDepositProgress: number;
    completedPages: number;
    advanceOnCurrentPage: number;
    totalCommissionEarned: number;
    totalPaidToCustomer: number;
  };
  currentPage: number;
  totalPages: number;
  pages: CardPage[];
};

// ── Derived per-line withdrawal state, computed client-side from
//    page.withdrawnOnPage. Withdrawals consume lines in order (1 → 31),
//    same convention as deposits filling them in order. ─────────────────
type LineRuntimeState = "withdrawn" | "partial-withdrawn" | "staked" | "depositing" | "open";

function getLineRuntimeState(
  line: CardLine,
  lineNumber: number,
  withdrawnLinesCount: number,
  partialWithdrawnAmount: number,
  rate: number,
  pageStatus: CardPage["status"]
): LineRuntimeState {
  // A fully completed/stamped page: every line — including the commission
  // line — has been paid out. Show it as withdrawn across the board.
  if (pageStatus === "completed") return "withdrawn";

  if (lineNumber <= withdrawnLinesCount) return "withdrawn";

  if (lineNumber === withdrawnLinesCount + 1 && partialWithdrawnAmount > 0.0001) {
    return "partial-withdrawn";
  }

  if (line.filled) return "staked";
  if (line.pending) return "depositing";
  return "open";
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(n || 0);

const formatDate = (d: string | null) => {
  if (!d) return null;
  const date = new Date(d);
  return isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-GH", { year: "2-digit", month: "short", day: "numeric" });
};

const pageStatusMeta: Record <
  CardPage["status"],
  { label: string; pill: string; dot: string; icon: React.ReactNode; bannerClass: string }
> = {
  completed: {
    label: "Completed — Stamped",
    pill: "bg-red-50 text-red-700",
    dot: "bg-red-400",
    icon: <Stamp className="w-3.5 h-3.5" />,
    bannerClass: "from-[#3a1d1d] to-[#5c2b2b]",
  },
  advance: {
    label: "Advance — In Progress",
    pill: "bg-amber-50 text-amber-700",
    dot: "bg-amber-400",
    icon: <Clock3 className="w-3.5 h-3.5" />,
    bannerClass: "from-[#1d2b22] to-[#3a5841]",
  },
  open: {
    label: "Open — Untouched",
    pill: "bg-gray-100 text-gray-500",
    dot: "bg-gray-300",
    icon: <CircleDashed className="w-3.5 h-3.5" />,
    bannerClass: "from-[#1d2b22] to-[#3a5841]",
  },
};

const lineStateMeta: Record <
  LineRuntimeState,
  { rowClass: string; badgeClass: string; amountClass: string; icon: React.ReactNode }
> = {
  withdrawn: {
    rowClass: "bg-red-50/70",
    badgeClass: "bg-red-500 text-white",
    amountClass: "text-red-600",
    icon: <ArrowUpRight className="w-2.5 h-2.5" />,
  },
  "partial-withdrawn": {
    rowClass: "bg-gradient-to-r from-red-50/70 to-amber-50/60",
    badgeClass: "bg-gradient-to-br from-red-400 to-amber-400 text-white",
    amountClass: "text-red-500",
    icon: <Clock3 className="w-2.5 h-2.5" />,
  },
  staked: {
    rowClass: "bg-emerald-50/60",
    badgeClass: "bg-emerald-500 text-white",
    amountClass: "text-emerald-700",
    icon: <CheckCircle2 className="w-2.5 h-2.5" />,
  },
  depositing: {
    rowClass: "bg-amber-50/60",
    badgeClass: "bg-amber-400 text-white",
    amountClass: "text-amber-700",
    icon: <Clock3 className="w-2.5 h-2.5" />,
  },
  open: {
    rowClass: "bg-gray-50",
    badgeClass: "bg-gray-200 text-gray-400",
    amountClass: "text-gray-300",
    icon: <CircleDashed className="w-2.5 h-2.5" />,
  },
};
interface Props {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  apiBaseUrl: string; // e.g. import.meta.env.VITE_API_URL
  authHeaders?: Record<string, string>; // pass e.g. { Authorization: `Bearer ${token}` } if your API needs it
}

const CardSimulationModal: React.FC<Props> = ({ isOpen, onClose, accountId, apiBaseUrl, authHeaders }) => {
  const [card, setCard] = useState<CardData | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !accountId) return;

    const fetchCard = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBaseUrl}/accounts/${accountId}/card-simulate`, {
          headers: authHeaders,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to load card");
        setCard(json.data);
        setPageIndex(Math.max(0, (json.data.currentPage || 1) - 1));
      } catch (err: any) {
        setError(err.message || "Failed to load card");
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [isOpen, accountId, apiBaseUrl]);

  const page = card?.pages?.[pageIndex];
  const rate = card?.rate ?? 0;

  // Compute how many lines on this page have been consumed by withdrawals,
  // and whether the line right after the cutoff is a partial withdrawal.
  const { withdrawnLinesCount, partialWithdrawnAmount } = useMemo(() => {
    if (!page || !rate) return { withdrawnLinesCount: 0, partialWithdrawnAmount: 0 };
    const count = Math.floor(page.withdrawnOnPage / rate + 0.0001);
    const partial = +(page.withdrawnOnPage - count * rate).toFixed(2);
    return { withdrawnLinesCount: count, partialWithdrawnAmount: partial };
  }, [page, rate]);

  if (!isOpen) return null;

  const leftLines = page?.lines.filter((l) => l.side === "left") ?? [];
  const rightLines = page?.lines.filter((l) => l.side === "right") ?? [];
  const isCommissionLine = (lineNumber: number) => lineNumber === 31;

  const renderLine = (line: CardLine) => {
    if (!page) return null;
    const date = formatDate(line.date);
    const state = getLineRuntimeState(
      line,
      line.lineNumber,
      withdrawnLinesCount,
      partialWithdrawnAmount,
      rate,
      page.status
    );
    const meta = lineStateMeta[state];
    const showsCommissionTag = page.status === "completed" && isCommissionLine(line.lineNumber);

    return (
      <div
        key={line.lineNumber}
        className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${meta.rowClass}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${meta.badgeClass}`}
          >
            {line.lineNumber}
          </span>
          <span className={`font-mono truncate ${state === "open" ? "text-gray-300" : "text-gray-700"}`}>
            {showsCommissionTag
              ? "Commission"
              : state === "depositing"
              ? `${line.pendingPercent}% staked`
              : state === "partial-withdrawn"
              ? `${formatCurrency(partialWithdrawnAmount)} drawn`
              : date || "—"}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {meta.icon}
          <span className={`font-semibold tabular-nums ${meta.amountClass}`}>{line.amount}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-sm font-semibold text-gray-900">Susu Card Simulation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && <div className="p-10 text-center text-sm text-gray-400">Loading card…</div>}
        {error && <div className="p-10 text-center text-sm text-red-500">{error}</div>}

        {card && page && (
          <div className="p-5 space-y-4">
            {/* Card header strip — account number / start date / rate.
                Tints red when this specific page is fully completed/stamped. */}
            <div
              className={`bg-gradient-to-br ${pageStatusMeta[page.status].bannerClass} text-white rounded-2xl p-5 relative overflow-hidden`}
            >
              {page.status === "completed" && (
                <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5" />
              )}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/50">Account Number</p>
                  <p className="text-lg font-mono tracking-wider mt-0.5">{card.account.account_number}</p>
                </div>
                <span className="text-[10px] uppercase tracking-wider bg-white/10 rounded-full px-2.5 py-1">
                  {card.account.account_type}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/50">Start Date</p>
                  <p className="text-sm font-medium mt-0.5">{formatDate(card.account.start_date)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/50">Daily Rate</p>
                  <p className="text-sm font-medium mt-0.5">{formatCurrency(card.rate)}</p>
                </div>
              </div>
              {page.status === "completed" && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-red-500/20 border border-red-300/30 text-red-100 rounded-full px-2.5 py-1 text-[10px] font-medium">
                  <Stamp className="w-3 h-3" />
                  This page is fully withdrawn & stamped
                </div>
              )}
            </div>

            {/* Page navigator */}
            <div className="flex items-center justify-between">
              <button
                disabled={pageIndex === 0}
                onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-center">
                <p className="text-xs font-semibold text-gray-700">
                  Page {page.pageNumber} of {card.totalPages}
                </p>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium mt-1 ${pageStatusMeta[page.status].pill}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${pageStatusMeta[page.status].dot}`} />
                  {pageStatusMeta[page.status].label}
                </span>
              </div>

              <button
                disabled={pageIndex >= card.totalPages - 1}
                onClick={() => setPageIndex((i) => Math.min(card.totalPages - 1, i + 1))}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Color legend */}
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 px-1">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Staked
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Withdrawn
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> In progress
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300" /> Open
              </span>
            </div>

            {/* 31 lines: 15 left / 16 right */}
            <div
              className={`border rounded-2xl p-4 bg-[repeating-linear-gradient(180deg,#fff,#fff_27px,#f8f8f6_28px)] transition-colors ${
                page.status === "completed" ? "border-red-100" : "border-gray-100"
              }`}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">{leftLines.map(renderLine)}</div>
                <div className="space-y-1">{rightLines.map(renderLine)}</div>
              </div>
            </div>

            {/* Page footer summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 font-medium">Staked on page</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">
                  {page.linesStaked}/31 · {formatCurrency(page.stakedAmount)}
                </p>
              </div>
              <div className={`rounded-xl p-3 ${page.withdrawnOnPage > 0 ? "bg-red-50" : "bg-gray-50"}`}>
                <p className={`text-[10px] font-medium ${page.withdrawnOnPage > 0 ? "text-red-500" : "text-gray-400"}`}>
                  Withdrawn on page
                </p>
                <p className={`text-sm font-semibold mt-0.5 ${page.withdrawnOnPage > 0 ? "text-red-600" : "text-gray-800"}`}>
                  {formatCurrency(page.withdrawnOnPage)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 font-medium">Balance on page</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatCurrency(page.balanceOnPage)}</p>
              </div>
              <div className={`rounded-xl p-3 ${page.commissionTaken > 0 ? "bg-red-50" : "bg-gray-50"}`}>
                <p className={`text-[10px] font-medium flex items-center gap-1 ${page.commissionTaken > 0 ? "text-red-500" : "text-gray-400"}`}>
                  <Coins className="w-3 h-3" /> Commission taken
                </p>
                <p className={`text-sm font-semibold mt-0.5 ${page.commissionTaken > 0 ? "text-red-600" : "text-gray-800"}`}>
                  {page.commissionTaken > 0 ? formatCurrency(page.commissionTaken) : "—"}
                </p>
              </div>
            </div>

            {/* Account-wide totals */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-[11px] font-semibold text-gray-500 mb-2">Account Totals</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="flex justify-between bg-emerald-50 rounded-lg px-3 py-2">
                  <span className="text-emerald-700">Total Deposited</span>
                  <span className="font-semibold text-emerald-700">{formatCurrency(card.totals.totalDeposited)}</span>
                </div>
                <div className="flex justify-between bg-red-50 rounded-lg px-3 py-2">
                  <span className="text-red-700">Total Withdrawn</span>
                  <span className="font-semibold text-red-600">{formatCurrency(card.totals.totalWithdrawn)}</span>
                </div>
                <div className="flex justify-between bg-red-50 rounded-lg px-3 py-2">
                  <span className="text-red-700">Commission Earned</span>
                  <span className="font-semibold text-red-600">{formatCurrency(card.totals.totalCommissionEarned)}</span>
                </div>
                <div className="flex justify-between bg-red-50 rounded-lg px-3 py-2">
                  <span className="text-red-700">Pages Completed</span>
                  <span className="font-semibold text-red-600">{card.totals.completedPages}</span>
                </div>
                <div className="flex justify-between bg-blue-50 rounded-lg px-3 py-2">
                  <span className="text-blue-700">Paid to Customer</span>
                  <span className="font-semibold text-blue-700">{formatCurrency(card.totals.totalPaidToCustomer)}</span>
                </div>
                <div className="flex justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-gray-600">Current Balance</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(card.account.current_balance)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardSimulationModal;