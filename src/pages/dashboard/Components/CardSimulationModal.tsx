// components/CardSimulationModal.tsx
import React, { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Stamp, Clock3, CircleDashed } from "lucide-react";

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

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(n || 0);

const formatDate = (d: string | null) => {
  if (!d) return null;
  const date = new Date(d);
  return isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-GH", { year: "2-digit", month: "short", day: "numeric" });
};

const statusMeta: Record<string, { label: string; pill: string; dot: string; icon: React.ReactNode }> = {
  completed: {
    label: "Completed — Stamped",
    pill: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-400",
    icon: <Stamp className="w-3.5 h-3.5" />,
  },
  advance: {
    label: "Advance",
    pill: "bg-amber-50 text-amber-700",
    dot: "bg-amber-400",
    icon: <Clock3 className="w-3.5 h-3.5" />,
  },
  open: {
    label: "Open",
    pill: "bg-gray-100 text-gray-400",
    dot: "bg-gray-300",
    icon: <CircleDashed className="w-3.5 h-3.5" />,
  },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  apiBaseUrl: string; // e.g. import.meta.env.VITE_API_URL
}

const CardSimulationModal: React.FC<Props> = ({ isOpen, onClose, accountId, apiBaseUrl }) => {
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
          credentials: "include",
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

  if (!isOpen) return null;

  const page = card?.pages?.[pageIndex];
  const leftLines = page?.lines.filter((l) => l.side === "left") ?? [];
  const rightLines = page?.lines.filter((l) => l.side === "right") ?? [];

  const renderLine = (line: CardLine) => {
    const date = formatDate(line.date);
    return (
      <div
        key={line.lineNumber}
        className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[11px]
          ${line.filled ? "bg-emerald-50/60" : line.pending ? "bg-amber-50/60" : "bg-gray-50"}`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0
              ${line.filled ? "bg-emerald-500 text-white" : line.pending ? "bg-amber-400 text-white" : "bg-gray-200 text-gray-400"}`}
          >
            {line.lineNumber}
          </span>
          <span className={`font-mono ${line.filled ? "text-gray-700" : "text-gray-300"}`}>
            {date || (line.pending ? `${line.pendingPercent}% staked` : "—")}
          </span>
        </div>
        <span className={`font-semibold tabular-nums ${line.filled ? "text-emerald-700" : "text-gray-300"}`}>
          {line.amount}
        </span>
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

            {/* Card header strip — account number / start date / rate */}
            <div className="bg-gradient-to-br from-[#1d2b22] to-[#3a5841] text-white rounded-2xl p-5">
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
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium mt-1
                    ${statusMeta[page.status].pill}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusMeta[page.status].dot}`} />
                  {statusMeta[page.status].label}
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

            {/* 31 lines: 15 left / 16 right */}
            <div className="border border-gray-100 rounded-2xl p-4 bg-[repeating-linear-gradient(180deg,#fff,#fff_27px,#f8f8f6_28px)]">
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
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 font-medium">Withdrawn on page</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">
                  {formatCurrency(page.withdrawnOnPage)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 font-medium">Balance on page</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">
                  {formatCurrency(page.balanceOnPage)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 font-medium">Commission taken</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">
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
                <div className="flex justify-between bg-amber-50 rounded-lg px-3 py-2">
                  <span className="text-amber-700">Commission Earned</span>
                  <span className="font-semibold text-amber-700">{formatCurrency(card.totals.totalCommissionEarned)}</span>
                </div>
                <div className="flex justify-between bg-indigo-50 rounded-lg px-3 py-2">
                  <span className="text-indigo-700">Pages Completed</span>
                  <span className="font-semibold text-indigo-700">{card.totals.completedPages}</span>
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