import React, { useState, useCallback } from "react";
import {
  Calendar, RefreshCw, FileBarChart2, ChevronDown, ChevronRight,
  ArrowUpRight, ArrowDownRight, TrendingUp, Activity, Loader2,
  AlertTriangle, CheckCircle2, Banknote, CreditCard, BadgeCheck,
  ReceiptText, Users, Lock,
} from "lucide-react";
import { companyId, formatDate } from "../../constants/appConstants";

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt   = (n: any) => Number(n || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtN  = (n: any) => Number(n || 0).toLocaleString();
const cedi  = (n: any) => `¢${fmt(n)}`;
const today = () => new Date().toISOString().split("T")[0];
const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" }) : "—";
const fmtDateMed = (d: string) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("en-GH", { dateStyle: "medium" }) : "—";
const initials = (name: string) =>
  (name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

// ─── types ───────────────────────────────────────────────────────────────────
interface DayEndLog {
  id: string;
  company_id: string;
  report_date: string;
  closed_by: string;
  closed_by_name: string | null;
  closed_at: string;
  total_deposits: number;
  total_withdrawals: number;
  pending_withdrawals: number;
  total_transactions: number;
  loans_approved: number;
  disbursed_today: number;
  commissions_paid: number;
  floats_closed: number;
  loan_repayments: number;
}

// ─── atoms ───────────────────────────────────────────────────────────────────
const Pill = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <span
    className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full"
    style={{ background: color + "22", color }}
  >
    {children}
  </span>
);

const Stat = ({ label, value, sub, icon: Icon, accent, accentLight }: any) => (
  <div className="bg-gray-50 rounded-xl p-3">
    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
    <p className="text-lg font-bold text-gray-900 mt-0.5 leading-none">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const TH = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
  <th className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 bg-gray-50 border-b border-gray-100 ${right ? "text-right" : "text-left"}`}>
    {children}
  </th>
);
const TD = ({ children, right, className }: { children: React.ReactNode; right?: boolean; className?: string }) => (
  <td className={`px-3 py-2.5 border-b border-gray-50 text-gray-700 ${right ? "text-right font-semibold" : ""} ${className || ""}`}>
    {children}
  </td>
);

// ─── main page ───────────────────────────────────────────────────────────────
const DayEndLogsPage = () => {
  const [mode, setMode]               = useState<"single" | "range">("single");
  const [dateSingle, setDateSingle]   = useState(today());
  const [dateStart, setDateStart]     = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [dateEnd, setDateEnd]         = useState(today());
  const [logs, setLogs]               = useState<DayEndLog[]>([]);
  const [loading, setLoading]         = useState(false);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [loaded, setLoaded]           = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setLoaded(false);
    setExpandedId(null);
    try {
      let url = `https://susu-pro-backend.onrender.com/api/day-end/${companyId}/`;
      if (mode === "single") {
        url += `?date=${dateSingle}`;
      } else {
        url += `?start_date=${dateStart}&end_date=${dateEnd}`;
      }
      const res  = await fetch(url);
      const json = await res.json();
      setLogs(json.status === "success" ? json.data : []);
    } catch (e) {
      console.error("fetchLogs error:", e);
      setLogs([]);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [mode, dateSingle, dateStart, dateEnd]);

  // ─── summary aggregates
  const totDeposits    = logs.reduce((s, r) => s + Number(r.total_deposits), 0);
  const totWithdrawals = logs.reduce((s, r) => s + Number(r.total_withdrawals), 0);
  const totDisbursed   = logs.reduce((s, r) => s + Number(r.disbursed_today), 0);
  const totComm        = logs.reduce((s, r) => s + Number(r.commissions_paid), 0);
  const totTx          = logs.reduce((s, r) => s + Number(r.total_transactions), 0);

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Day-End Logs</h1>
          <p className="text-sm text-gray-400 mt-0.5">Browse and review closed day snapshots</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 bg-[#344a2e] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#2a3a25] transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Mode</label>
            <select
              value={mode}
              onChange={e => setMode(e.target.value as "single" | "range")}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#344a2e] outline-none bg-white"
            >
              <option value="single">Single date</option>
              <option value="range">Date range</option>
            </select>
          </div>

          {mode === "single" ? (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Date</label>
              <div className="relative">
                <Calendar className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="date" value={dateSingle}
                  onChange={e => setDateSingle(e.target.value)}
                  className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#344a2e] outline-none"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">From</label>
                <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#344a2e] outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">To</label>
                <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#344a2e] outline-none" />
              </div>
            </>
          )}

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 bg-[#344a2e] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#2a3a25] transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileBarChart2 className="h-3.5 w-3.5" />}
            {loading ? "Loading…" : "Load Logs"}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex items-center justify-center gap-3 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin text-[#344a2e]" />
          <span className="text-sm">Fetching day-end logs…</span>
        </div>
      )}

      {/* Summary strip */}
      {!loading && loaded && logs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Activity className="h-3.5 w-3.5" />
            Period summary
            <span className="bg-[#344a2e] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {logs.length} {logs.length === 1 ? "day" : "days"}
            </span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            <Stat label="Total Deposits"    value={cedi(totDeposits)}    sub="inflow"           icon={ArrowUpRight}   accent="#059669" accentLight="#d1fae5" />
            <Stat label="Total Withdrawals" value={cedi(totWithdrawals)} sub="outflow"          icon={ArrowDownRight} accent="#dc2626" accentLight="#fee2e2" />
            <Stat label="Net Flow"          value={cedi(totDeposits - totWithdrawals)} sub={totDeposits - totWithdrawals >= 0 ? "positive" : "negative"} icon={TrendingUp} accent={totDeposits-totWithdrawals>=0?"#059669":"#dc2626"} accentLight={totDeposits-totWithdrawals>=0?"#d1fae5":"#fee2e2"} />
            <Stat label="Disbursed"         value={cedi(totDisbursed)}   sub="loans"            icon={Banknote}       accent="#1d4ed8" accentLight="#dbeafe" />
            <Stat label="Transactions"      value={fmtN(totTx)}          sub="total processed"  icon={ReceiptText}    accent="#7c3aed" accentLight="#ede9fe" />
          </div>
        </div>
      )}

      {/* Log table */}
      {!loading && loaded && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <FileBarChart2 className="h-4 w-4 text-[#344a2e]" />
            <span className="text-sm font-bold text-gray-900">Log Entries</span>
          </div>

          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                <FileBarChart2 className="h-7 w-7 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-500">No day-end logs found for this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <TH>Date</TH>
                    <TH>Closed by</TH>
                    <TH right>Deposits</TH>
                    <TH right>Withdrawals</TH>
                    <TH right>Net</TH>
                    <TH right>Transactions</TH>
                    <TH>Pending W/D</TH>
                    <TH>{/* expand */}</TH>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const net      = Number(log.total_deposits) - Number(log.total_withdrawals);
                    const isOpen   = expandedId === log.id;
                    const hasPend  = log.pending_withdrawals > 0;

                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setExpandedId(isOpen ? null : log.id)}
                        >
                          <TD>
                            <span className="font-semibold text-gray-900">{formatDate(log.closed_at)}</span>
                          </TD>
                          <TD>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#e8f0e5] flex items-center justify-center text-[#344a2e] text-xs font-bold shrink-0">
                                {initials(log.closed_by_name || "")}
                              </div>
                              <span>{log.closed_by_name || "—"}</span>
                            </div>
                          </TD>
                          <TD right className="text-emerald-600 font-semibold">{cedi(log.total_deposits)}</TD>
                          <TD right className="text-red-500 font-semibold">{cedi(log.total_withdrawals)}</TD>
                          <TD right>
                            <span className={`font-bold ${net >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                              {cedi(Math.abs(net))}
                            </span>
                          </TD>
                          <TD right>{fmtN(log.total_transactions)}</TD>
                          <TD>
                            {hasPend
                              ? <Pill color="#b45309">{log.pending_withdrawals} pending</Pill>
                              : <Pill color="#059669">clear</Pill>
                            }
                          </TD>
                          <TD>
                            {isOpen
                              ? <ChevronDown className="h-4 w-4 text-gray-400" />
                              : <ChevronRight className="h-4 w-4 text-gray-400" />
                            }
                          </TD>
                        </tr>

                        {/* Expandable detail row */}
                        {isOpen && (
                          <tr>
                            <td colSpan={8} className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                                {[
                                  ["Loans Approved",   fmtN(log.loans_approved),          CreditCard,    "#7c3aed"],
                                  ["Disbursed Today",  cedi(log.disbursed_today),          Banknote,      "#1d4ed8"],
                                  ["Commissions Paid", cedi(log.commissions_paid),         BadgeCheck,    "#0f766e"],
                                  ["Floats Closed",    fmtN(log.floats_closed),            Lock,          "#344a2e"],
                                  ["Closed By",        log.closed_by_name || "—",          Users,         "#6b7280"],
                                  ["Closed At",        fmtDate(log.closed_at),             Activity,      "#6b7280"],
                                  ["Loan Repayments",           log.loan_repayments,                             FileBarChart2, "#6b7280"],
                                  ["Pending W/D",      hasPend ? `${fmtN(log.pending_withdrawals)} pending` : "None", AlertTriangle, hasPend ? "#b45309" : "#6b7280"],
                                ].map(([label, value, Icon, accent]: any) => (
                                  <div key={label} className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex items-start gap-2.5">
                                    <div className="rounded-lg p-1.5 shrink-0" style={{ background: accent + "18" }}>
                                      <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
                                      <p className="text-xs font-semibold text-gray-800 mt-0.5 truncate">{value}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Initial empty state */}
      {!loading && !loaded && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 bg-[#e8f0e5] rounded-2xl flex items-center justify-center">
            <FileBarChart2 className="h-7 w-7 text-[#344a2e]" />
          </div>
          <p className="text-base font-bold text-gray-700">Set a filter and load logs</p>
          <p className="text-sm text-gray-400">Choose a date or date range above, then click <strong>Load Logs</strong></p>
        </div>
      )}
    </div>
  );
};

export default DayEndLogsPage;