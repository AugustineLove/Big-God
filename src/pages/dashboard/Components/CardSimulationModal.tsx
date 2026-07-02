// components/CardSimulationModal.tsx
//
// Design note: this renders the susu card as a physical ledger book.
// Desktop shows a two-page spread (left page + right page, 31 lines each,
// joined by a bound spine). Mobile shows one page at a time with a
// page-turn control, so the 31-line layout is never compressed or split.
//
// Optional: for the full ledger feel, add a serif display face in your
// app's global stylesheet, e.g. Fraunces or Source Serif 4, and swap the
// `font-serif` utility below to use it. Works fine with the system serif
// fallback if you skip that.

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Stamp,
  Clock3,
  CircleDashed,
  CircleSlash,
  CheckCircle2,
  ArrowUpRight,
  Coins,
  AlertTriangle,
  ArrowRightLeft,
  BookOpen,
} from "lucide-react";

type LineStatus = "withdrawn" | "commission" | "partial-withdrawn" | "staked" | "depositing" | "open" | "void";

type CardLine = {
  lineNumber: number;
  side: "left" | "right";
  sideIndex: number;
  amount: number;
  status: LineStatus;
  date: string | null;
  pendingAmount: number;
  pendingPercent: number;
};

type CardPage = {
  pageNumber: number;
  rate: number;
  pageCapacity: number;
  linesStaked: number;
  linesRemaining: number;
  stakedAmount: number;
  status: "completed" | "advance" | "open";
  closedEarly: boolean;
  overdrawn: boolean;
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
  pageLines: number;
  totals: {
    totalDeposited: number;
    totalWithdrawn: number;
    completedPages: number;
    totalCommissionEarned: number;
    totalPaidToCustomer: number;
  };
  currentPage: number;
  totalPages: number;
  warnings: string[];
  pages: CardPage[];
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  apiBaseUrl: string;
  authHeaders?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Ledger palette — aged parchment pages inside an oxblood leather cover,
// red stamp ink for withdrawals, brass for completed-page accents.
// ---------------------------------------------------------------------------
const ink = {
  paper: "#F6EEDD",
  paperShadowLine: "#E6D9B8",
  cover: "#2e5339",
  coverLight: "#2e5339",
  coverInlay: "#8A4A2A",
  gold: "#B08D57",
  goldSoft: "#E4CE9C",
  text: "#2B2115",
  textSoft: "#7A6F58",
  green: "#2E5339",
  greenSoft: "#E4EEDF",
  red: "#A6332A",
  redSoft: "#F5E4DF",
  amber: "#A8762E",
  amberSoft: "#F3E7CE",
  fade: "#BDB393",
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

const pageStatusMeta: Record<
  CardPage["status"],
  { label: string; pillClass: string; dotColor: string }
> = {
  completed: { label: "Completed", pillClass: "text-white/90 bg-white/10 border border-white/15", dotColor: ink.gold },
  advance: { label: "In progress", pillClass: "text-white/90 bg-white/10 border border-white/15", dotColor: "#D9A34A" },
  open: { label: "Untouched", pillClass: "text-white/60 bg-white/5 border border-white/10", dotColor: "#9CA3AF" },
};

const lineStateMeta: Record<
  LineStatus,
  { textColor: string; badgeBg: string; badgeText: string; icon: React.ReactNode; dashed?: boolean; faint?: boolean }
> = {
  withdrawn: { textColor: ink.red, badgeBg: ink.red, badgeText: "#fff", icon: <ArrowUpRight className="w-2.5 h-2.5" /> },
  commission: { textColor: "#7A2620", badgeBg: "#7A2620", badgeText: "#fff", icon: <Coins className="w-2.5 h-2.5" /> },
  "partial-withdrawn": { textColor: ink.amber, badgeBg: ink.amber, badgeText: "#fff", icon: <Clock3 className="w-2.5 h-2.5" /> },
  staked: { textColor: ink.green, badgeBg: ink.green, badgeText: "#fff", icon: <CheckCircle2 className="w-2.5 h-2.5" /> },
  depositing: { textColor: ink.amber, badgeBg: ink.amber, badgeText: "#fff", icon: <Clock3 className="w-2.5 h-2.5" /> },
  open: { textColor: ink.fade, badgeBg: "#E9E2CB", badgeText: ink.fade, icon: <CircleDashed className="w-2.5 h-2.5" />, faint: true },
  void: { textColor: ink.fade, badgeBg: "#E9E2CB", badgeText: ink.fade, icon: <CircleSlash className="w-2.5 h-2.5" />, dashed: true, faint: true },
};

const lineLabel = (line: CardLine) => {
  const date = formatDate(line.date);
  switch (line.status) {
    case "commission":
      return "Commission";
    case "void":
      return "Not staked";
    case "depositing":
      return `${line.pendingPercent}% staked`;
    case "partial-withdrawn":
      return `${formatCurrency(line.pendingAmount)} drawn`;
    default:
      return date || "—";
  }
};

// ---------------------------------------------------------------------------
// A single ledger line (one row of the 31-line page)
// ---------------------------------------------------------------------------
const LedgerLine: React.FC<{ line: CardLine }> = ({ line }) => {
  const meta = lineStateMeta[line.status];
  return (
    <div
      className={`flex items-center justify-between gap-2 px-2 py-[3px] rounded-md text-[11px] leading-none ${
        meta.dashed ? "border border-dashed" : ""
      }`}
      style={meta.dashed ? { borderColor: "#D8CDA9" } : undefined}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
          style={{ backgroundColor: meta.badgeBg, color: meta.badgeText }}
        >
          {line.lineNumber}
        </span>
        <span
          className={`font-mono truncate ${meta.faint ? "italic" : ""}`}
          style={{ color: meta.faint ? ink.fade : ink.text }}
        >
          {lineLabel(line)}
        </span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {meta.icon}
        <span className="font-semibold tabular-nums font-mono" style={{ color: meta.textColor }}>
          {line.amount}
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// One page of the ledger book (31 lines), used for both left/right/mobile
// ---------------------------------------------------------------------------
const LedgerPage: React.FC<{
  page: CardPage;
  prevPage: CardPage | null;
  side: "left" | "right" | "single";
}> = ({ page, prevPage, side }) => {
  const rateChanged = !!(prevPage && prevPage.rate !== page.rate);
  const sortedLines = useMemo(() => [...page.lines].sort((a, b) => a.lineNumber - b.lineNumber), [page.lines]);
  const midpoint = Math.ceil(sortedLines.length / 2); // 1–15 left sub-column, 16–31 right sub-column
  const firstColumn = sortedLines.slice(0, midpoint);
  const secondColumn = sortedLines.slice(midpoint);
  const meta = pageStatusMeta[page.status];

  const roundedClass =
    side === "left" ? "rounded-l-[4px] rounded-r-none" : side === "right" ? "rounded-r-[4px] rounded-l-none" : "rounded-[4px]";

  return (
    <div
      className={`relative flex-1 min-w-0 flex flex-col ${roundedClass} overflow-hidden`}
      style={{
        background: `repeating-linear-gradient(180deg, ${ink.paper} 0px, ${ink.paper} 20px, ${ink.paperShadowLine} 21px)`,
      }}
    >
      {/* inner edge shadow toward the spine */}
      {side !== "single" && (
        <div
          className={`pointer-events-none absolute top-0 bottom-0 w-6 ${side === "left" ? "right-0" : "left-0"}`}
          style={{
            background:
              side === "left"
                ? "linear-gradient(to right, transparent, rgba(0,0,0,0.09))"
                : "linear-gradient(to left, transparent, rgba(0,0,0,0.09))",
          }}
        />
      )}

      <div className="relative p-3.5 sm:p-4 flex flex-col h-full">
        {/* page head */}
        <div className="flex items-start justify-between mb-2.5">
          <div>
            <p className="font-serif text-[13px] font-semibold tracking-wide" style={{ color: ink.text }}>
              Page {page.pageNumber}
            </p>
            <p className="text-[10px] font-mono" style={{ color: ink.textSoft }}>
              {formatCurrency(page.rate)} × 31 lines · cap {formatCurrency(page.pageCapacity)}
            </p>
          </div>
          <span
            className="text-[9px] uppercase tracking-wider rounded-full px-2 py-0.5 font-semibold flex-shrink-0"
            style={{
              backgroundColor:
                page.status === "completed" ? ink.goldSoft : page.status === "advance" ? ink.amberSoft : "#EDE7D4",
              color: page.status === "completed" ? "#6B4A1E" : page.status === "advance" ? ink.amber : ink.fade,
            }}
          >
            {meta.label}
          </span>
        </div>

        {/* flags */}
        {(rateChanged || page.closedEarly || page.overdrawn) && (
          <div className="flex flex-wrap gap-1 mb-2">
            {rateChanged && (
              <span
                className="inline-flex items-center gap-1 text-[9px] font-medium rounded-full px-1.5 py-0.5"
                style={{ backgroundColor: "#EDE7D4", color: ink.textSoft }}
              >
                <ArrowRightLeft className="w-2.5 h-2.5" />
                {formatCurrency(prevPage!.rate)} → {formatCurrency(page.rate)}
              </span>
            )}
            {page.closedEarly && (
              <span
                className="inline-flex items-center gap-1 text-[9px] font-medium rounded-full px-1.5 py-0.5"
                style={{ backgroundColor: "#EDE7D4", color: ink.textSoft }}
              >
                <CircleSlash className="w-2.5 h-2.5" />
                {page.linesRemaining} never staked
              </span>
            )}
            {page.overdrawn && (
              <span
                className="inline-flex items-center gap-1 text-[9px] font-medium rounded-full px-1.5 py-0.5"
                style={{ backgroundColor: ink.redSoft, color: ink.red }}
              >
                <AlertTriangle className="w-2.5 h-2.5" />
                Overdrawn
              </span>
            )}
          </div>
        )}

        {/* 31 lines: 1–15 in the left sub-column, 16–31 in the right sub-column */}
        <div className="grid grid-cols-2 gap-x-3 flex-1">
          <div className="space-y-[3px]">
            {firstColumn.map((line) => (
              <LedgerLine key={line.lineNumber} line={line} />
            ))}
          </div>
          <div className="space-y-[3px] border-l border-dashed pl-3" style={{ borderColor: "#DED0A6" }}>
            {secondColumn.map((line) => (
              <LedgerLine key={line.lineNumber} line={line} />
            ))}
          </div>
        </div>

        {/* page footer strip */}
        <div className="mt-3 pt-2.5 border-t grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]" style={{ borderColor: "#DED0A6" }}>
          <div className="flex justify-between">
            <span style={{ color: ink.textSoft }}>Staked</span>
            <span className="font-mono font-semibold" style={{ color: ink.green }}>
              {page.linesStaked}/31 · {formatCurrency(page.stakedAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: ink.textSoft }}>Balance</span>
            <span className="font-mono font-semibold" style={{ color: ink.text }}>
              {formatCurrency(page.balanceOnPage)}
            </span>
          </div>
          {page.withdrawnOnPage > 0 && (
            <div className="flex justify-between">
              <span style={{ color: ink.red }}>Withdrawn</span>
              <span className="font-mono font-semibold" style={{ color: ink.red }}>
                {formatCurrency(page.withdrawnOnPage)}
              </span>
            </div>
          )}
          {page.commissionTaken > 0 && (
            <div className="flex justify-between">
              <span style={{ color: "#7A2620" }}>Commission</span>
              <span className="font-mono font-semibold" style={{ color: "#7A2620" }}>
                {formatCurrency(page.commissionTaken)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* completed-page stamp */}
      {page.status === "completed" && (
        <div
          className="pointer-events-none absolute top-8 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded border-2 opacity-80"
          style={{
            borderColor: ink.red,
            color: ink.red,
            transform: "rotate(-9deg)",
            mixBlendMode: "multiply",
          }}
        >
          <Stamp className="w-3.5 h-3.5" />
          <span className="font-serif text-[11px] font-bold tracking-widest uppercase">Paid &amp; Closed</span>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Blank inside-cover page (shown on the right when the book has an odd
// number of pages and there's no facing page yet)
// ---------------------------------------------------------------------------
const BlankPage: React.FC<{ side: "left" | "right" }> = ({ side }) => (
  <div
    className={`relative flex-1 min-w-0 flex items-center justify-center ${
      side === "left" ? "rounded-l-[4px]" : "rounded-r-[4px]"
    }`}
    style={{
      background: `repeating-linear-gradient(180deg, ${ink.paper} 0px, ${ink.paper} 20px, ${ink.paperShadowLine} 21px)`,
    }}
  >
    <p className="text-[11px] font-serif italic" style={{ color: ink.fade }}>
      End of card
    </p>
  </div>
);

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------
const CardSimulationModal: React.FC<Props> = ({ isOpen, onClose, accountId, apiBaseUrl, authHeaders }) => {
  const [card, setCard] = useState<CardData | null>(null);
  const [spreadStart, setSpreadStart] = useState(0); // even index — left page of desktop spread
  const [mobileIndex, setMobileIndex] = useState(0); // single-page index for mobile
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
        console.log(json.data);
        const startIdx = Math.max(0, (json.data.currentPage || 1) - 1);
        setSpreadStart(startIdx - (startIdx % 2));
        setMobileIndex(startIdx);
      } catch (err: any) {
        setError(err.message || "Failed to load card");
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [isOpen, accountId, apiBaseUrl]);

  const totalPages = card?.totalPages ?? 0;

  const goSpread = useCallback(
    (delta: number) => {
      setSpreadStart((i) => {
        const next = i + delta * 2;
        return Math.min(Math.max(0, next), Math.max(0, (totalPages - 1) - ((totalPages - 1) % 2)));
      });
    },
    [totalPages]
  );

  const goPage = useCallback(
    (delta: number) => {
      setMobileIndex((i) => Math.min(Math.max(0, i + delta), Math.max(0, totalPages - 1)));
    },
    [totalPages]
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goSpread(-1);
        goPage(-1);
      } else if (e.key === "ArrowRight") {
        goSpread(1);
        goPage(1);
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, goSpread, goPage, onClose]);

  if (!isOpen) return null;

  const leftPage = card?.pages?.[spreadStart] ?? null;
  const rightPage = card?.pages?.[spreadStart + 1] ?? null;
  const leftPrev = card && spreadStart > 0 ? card.pages[spreadStart - 1] : null;
  const rightPrev = leftPage;

  const mobilePage = card?.pages?.[mobileIndex] ?? null;
  const mobilePrev = card && mobileIndex > 0 ? card.pages[mobileIndex - 1] : null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6">
      <div
        className="w-full max-w-5xl max-h-[94vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: `linear-gradient(180deg, ${ink.cover}, ${ink.coverLight})` }}
      >
        {/* cover header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sticky top-0 z-20" style={{ background: ink.cover }}>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" style={{ color: ink.gold }} />
            <h2 className="font-serif text-sm sm:text-base font-semibold tracking-wide text-white/95">
              Card Simulation
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-white/60 hover:text-white transition-colors rounded-full p-1 focus:outline-none focus-visible:ring-2"
            style={{ boxShadow: "none" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && (
          <div className="p-16 text-center text-sm text-white/60 font-serif italic">Opening the ledger…</div>
        )}
        {error && <div className="p-16 text-center text-sm text-red-200">{error}</div>}

        {card && (
          <div className="px-3 sm:px-6 pb-6 space-y-4">
            {/* warnings */}
            {card.warnings.length > 0 && (
              <div
                className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-[11px] border"
                style={{ backgroundColor: "rgba(180,120,40,0.15)", borderColor: "rgba(212,166,80,0.3)", color: ink.goldSoft }}
              >
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {card.warnings.map((w, i) => (
                    <p key={i}>{w}</p>
                  ))}
                </div>
              </div>
            )}

            {/* account plate — brass nameplate on the cover */}
            <div
              className="rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3"
              style={{ background: "rgba(255,255,255,0.06)", border: `1px solid rgba(212,166,80,0.25)` }}
            >
              <div>
                <p className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Account Number
                </p>
                <p className="text-base font-mono tracking-wider text-white">{card.account.account_number}</p>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Started
                  </p>
                  <p className="text-xs font-medium text-white/90">{formatDate(card.account.start_date)}</p>
                </div>
                <span
                  className="text-[10px] uppercase tracking-wider rounded-full px-2.5 py-1"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)", color: ink.goldSoft }}
                >
                  {card.account.account_type}
                </span>
              </div>
            </div>

            {/* ---------------- Desktop: two-page spread ---------------- */}
            {leftPage && (
              <div className="hidden md:block">
                <div
                  className="relative flex rounded-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
                  style={{ padding: "10px 10px" }}
                >
                  <LedgerPage page={leftPage} prevPage={leftPrev} side="left" />
                  {/* spine */}
                  <div
                    className="w-4 flex-shrink-0 relative"
                    style={{
                      background: "linear-gradient(90deg, rgba(0,0,0,0.35), rgba(0,0,0,0.08), rgba(0,0,0,0.35))",
                    }}
                  >
                    <div
                      className="absolute inset-y-1 left-1/2 -translate-x-1/2 w-px"
                      style={{
                        backgroundImage: `repeating-linear-gradient(180deg, ${ink.gold} 0 4px, transparent 4px 9px)`,
                        opacity: 0.6,
                      }}
                    />
                  </div>
                  {rightPage ? (
                    <LedgerPage page={rightPage} prevPage={rightPrev} side="right" />
                  ) : (
                    <BlankPage side="right" />
                  )}
                </div>

                {/* spread nav */}
                <div className="flex items-center justify-between mt-3">
                  <button
                    disabled={spreadStart === 0}
                    onClick={() => goSpread(-1)}
                    aria-label="Previous spread"
                    className="flex items-center gap-1 text-xs font-medium rounded-lg px-3 py-1.5 disabled:opacity-30 transition-colors focus:outline-none focus-visible:ring-2"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "white" }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev pages
                  </button>
                  <p className="text-[11px] font-mono text-white/60">
                    Pages {leftPage.pageNumber}
                    {rightPage ? `–${rightPage.pageNumber}` : ""} of {totalPages}
                  </p>
                  <button
                    disabled={spreadStart + 2 >= totalPages}
                    onClick={() => goSpread(1)}
                    aria-label="Next spread"
                    className="flex items-center gap-1 text-xs font-medium rounded-lg px-3 py-1.5 disabled:opacity-30 transition-colors focus:outline-none focus-visible:ring-2"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "white" }}
                  >
                    Next pages <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ---------------- Mobile: single page ---------------- */}
            {mobilePage && (
              <div className="md:hidden">
                <div className="relative rounded-lg overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.4)] p-2">
                  <LedgerPage page={mobilePage} prevPage={mobilePrev} side="single" />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <button
                    disabled={mobileIndex === 0}
                    onClick={() => goPage(-1)}
                    aria-label="Previous page"
                    className="flex items-center gap-1 text-xs font-medium rounded-lg px-3 py-1.5 disabled:opacity-30 focus:outline-none focus-visible:ring-2"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "white" }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <p className="text-[11px] font-mono text-white/60">
                    Page {mobilePage.pageNumber} of {totalPages}
                  </p>
                  <button
                    disabled={mobileIndex + 1 >= totalPages}
                    onClick={() => goPage(1)}
                    aria-label="Next page"
                    className="flex items-center gap-1 text-xs font-medium rounded-lg px-3 py-1.5 disabled:opacity-30 focus:outline-none focus-visible:ring-2"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "white" }}
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* legend */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] px-1" style={{ color: "rgba(255,255,255,0.55)" }}>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ink.green }} /> Staked
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ink.red }} /> Withdrawn
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#7A2620" }} /> Commission
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ink.amber }} /> In progress
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#BDB393" }} /> Open
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full border border-dashed" style={{ borderColor: "#BDB393" }} /> Never staked
              </span>
            </div>

            {/* account totals */}
            <div className="pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <p className="text-[11px] font-serif font-semibold mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                Account Totals
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <TotalTile label="Total Deposited" value={formatCurrency(card.totals.totalDeposited)} tone="green" />
                <TotalTile label="Total Withdrawn" value={formatCurrency(card.totals.totalWithdrawn)} tone="red" />
                <TotalTile label="Commission Earned" value={formatCurrency(card.totals.totalCommissionEarned)} tone="red" />
                <TotalTile label="Pages Completed" value={`${card.totals.completedPages}`} tone="gold" />
                <TotalTile label="Paid to Customer" value={formatCurrency(card.totals.totalPaidToCustomer)} tone="neutral" />
                <TotalTile label="Current Balance" value={formatCurrency(card.account.current_balance)} tone="neutral" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TotalTile: React.FC<{ label: string; value: string; tone: "green" | "red" | "gold" | "neutral" }> = ({
  label,
  value,
  tone,
}) => {
  const tones: Record<string, { bg: string; text: string; sub: string }> = {
    green: { bg: "rgba(46,83,57,0.18)", text: "#BFE0C8", sub: "#9FCBAA" },
    red: { bg: "rgba(166,51,42,0.18)", text: "#F0BDB6", sub: "#E39B92" },
    gold: { bg: "rgba(176,141,87,0.2)", text: "#E4CE9C", sub: "#D3B77E" },
    neutral: { bg: "rgba(255,255,255,0.06)", text: "#EDEDE7", sub: "rgba(255,255,255,0.5)" },
  };
  const t = tones[tone];
  return (
    <div className="flex justify-between items-center rounded-lg px-3 py-2" style={{ backgroundColor: t.bg }}>
      <span style={{ color: t.sub }}>{label}</span>
      <span className="font-semibold font-mono" style={{ color: t.text }}>
        {value}
      </span>
    </div>
  );
};

export default CardSimulationModal;