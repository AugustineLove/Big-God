import React, { useState, useEffect } from "react";
import {
  Moon, RefreshCw, ChevronDown, ChevronRight, Calendar,
  AlertTriangle, TrendingUp, Users, Wallet, CreditCard,
  BarChart3, UserCheck, FileSearch, Loader2, CheckCircle2,
  XCircle, Lock, ArrowUpRight, ArrowDownRight, Activity,
  Clock, Banknote, PiggyBank, Building2, BadgeCheck,
  ReceiptText, FileBarChart2, X,
} from "lucide-react";
import { userPermissions, userRole, userUUID } from "../../../constants/appConstants";
import { useDayEnd } from "../../../contexts/dashboard/DayEnd";
// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fmt  = (n: any) =>
  Number(n || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtN = (n: any) => Number(n || 0).toLocaleString();
const cedi = (n: any) => `¢${fmt(n)}`;
const today = () => new Date().toISOString().split("T")[0];
const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" }) : "—";
const initials = (name: string) =>
  (name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

// ─────────────────────────────────────────────────────────────────────────────
// REPORT DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

const REPORT_DEFS = [
  { key: "summary",                 label: "Master Summary",        desc: "Full day snapshot — transactions, float, loans, commissions", icon: FileBarChart2, roles: ["CEO","Manager","Accountant"],          permission: "VIEW_BRIEFING",    accent: "#344a2e", accentLight: "#e8f0e5" },
  { key: "teller-reconciliation",   label: "Teller Reconciliation", desc: "Per-teller float breakdown, opening vs closing position",      icon: Wallet,       roles: ["Teller","Manager","Accountant","CEO"], permission: "TRANSACTION_CREATE",               accent: "#1d4ed8", accentLight: "#dbeafe" },
  { key: "financial-close",         label: "Financial Close",       desc: "Day P&L, budget utilisation, commission payables",             icon: ReceiptText,  roles: ["Accountant","CEO","Manager"],          permission: "ALTER_FINANCE",    accent: "#7c3aed", accentLight: "#ede9fe" },
  { key: "loan-report",             label: "Loan Officer Report",   desc: "Applications, approvals, repayments, overdue analysis",        icon: CreditCard,   roles: ["Loan Officer","Manager","CEO"],         permission: "LOAN_PRIVILEGES",  accent: "#b45309", accentLight: "#fef3c7" },
  { key: "sales-report",            label: "Sales Manager Report",  desc: "Agent performance, new accounts, deposit trends",              icon: TrendingUp,   roles: ["Sales Manager","Manager","CEO"],         permission: "DELETE_CUSTOMER",               accent: "#0f766e", accentLight: "#ccfbf1" },
  { key: "hr-report",               label: "HR Report",             desc: "Staff activity, attendance, float assignments",                icon: UserCheck,    roles: ["HR","Manager","CEO"],                  permission: "MANAGE_STAFF",     accent: "#db2777", accentLight: "#fce7f3" },
  { key: "audit-trail",             label: "Audit Trail",           desc: "All reversals, rejections, deletions & budget changes",        icon: FileSearch,   roles: ["Admin","Manager","CEO"],                  permission: "MANAGE_STAFF",               accent: "#374151", accentLight: "#f3f4f6" },
] as const;

type ReportKey = typeof REPORT_DEFS[number]["key"];

// ─────────────────────────────────────────────────────────────────────────────
// ATOMS
// ─────────────────────────────────────────────────────────────────────────────

const Pill = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
    style={{ background: color + "22", color }}>
    {children}
  </span>
);

const Stat = ({ label, value, sub, icon: Icon, accent, accentLight }: any) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-start justify-between gap-3 hover:shadow-md transition-shadow">
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-0.5 leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
    <div className="rounded-xl p-2.5 shrink-0" style={{ background: accentLight }}>
      <Icon className="h-5 w-5" style={{ color: accent }} />
    </div>
  </div>
);

const AlertBadge = ({ active, label }: { active: boolean; label: string }) => (
  <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium ${active ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-600 border border-green-100"}`}>
    {active ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
    {label}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-3 flex items-center gap-2">
    {children}
  </h3>
);

const TableWrap = ({ children }: { children: React.ReactNode }) => (
  <div className="overflow-x-auto rounded-xl border border-gray-100">
    <table className="w-full text-sm">{children}</table>
  </div>
);
const TH = ({ children }: { children: React.ReactNode }) => (
  <th className="text-left px-3 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 bg-gray-50 border-b border-gray-100">
    {children}
  </th>
);
const TD = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
  <td className={`px-3 py-2.5 border-b border-gray-50 text-gray-700 ${right ? "text-right font-semibold" : ""}`}>
    {children}
  </td>
);

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BAR
// ─────────────────────────────────────────────────────────────────────────────

const StatusBar = () => {
  const { statusData, fetchStatus, loading } = useDayEnd();

  useEffect(() => { fetchStatus(); }, []);

  const s = statusData;
  if (!s) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-center gap-2 text-gray-400 text-sm">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading live status…
    </div>
  );

  const pos = s.net_today >= 0;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#344a2e]" />
          <span className="text-sm font-bold text-gray-800">Live Status</span>
          <span className="text-[10px] text-gray-400">as of {new Date().toLocaleTimeString()}</span>
        </div>
        <button onClick={fetchStatus} disabled={loading.status} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <RefreshCw className={`h-3.5 w-3.5 ${loading.status ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
        {[
          { label: "Deposits",    value: cedi(s.today_deposits),    pos: true  },
          { label: "Withdrawals", value: cedi(s.today_withdrawals), pos: false },
          { label: "Net",         value: cedi(Math.abs(s.net_today)), pos      },
          { label: "Active Loans",value: fmtN(s.active_loans),     neutral: true },
          { label: "Open Floats", value: fmtN(s.open_floats),      neutral: true },
        ].map((item: any) => (
          <div key={item.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{item.label}</p>
            <p className={`text-sm font-bold mt-0.5 ${item.neutral ? "text-gray-800" : item.pos ? "text-emerald-600" : "text-red-500"}`}>{item.value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <AlertBadge active={s.alerts.has_pending_withdrawals} label={`${fmtN(s.pending_withdrawals)} pending withdrawals`} />
        <AlertBadge active={s.alerts.has_open_floats}         label={`${fmtN(s.open_floats)} open floats`} />
        <AlertBadge active={s.alerts.has_overdue_loans}       label={`${fmtN(s.overdue_loans)} overdue loans`} />
        <AlertBadge active={s.alerts.has_pending_loans}       label={`${fmtN(s.pending_loan_applications)} pending applications`} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REPORT VIEWS
// ─────────────────────────────────────────────────────────────────────────────

const SummaryView = ({ data }: { data: any }) => {
  const d = data?.data;
  if (!d) return null;
  return (
    <div className="space-y-6">
      <div>
        <SectionTitle><BarChart3 className="h-3.5 w-3.5" />Transactions</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total Tx"    value={fmtN(d.transactions.total)}                                                   icon={Activity}       accent="#344a2e" accentLight="#e8f0e5" />
          <Stat label="Deposits"    value={cedi(d.transactions.deposits.total)}    sub={`${fmtN(d.transactions.deposits.count)} tx`}    icon={ArrowUpRight}   accent="#059669" accentLight="#d1fae5" />
          <Stat label="Withdrawals" value={cedi(d.transactions.withdrawals.total)} sub={`${fmtN(d.transactions.withdrawals.count)} tx`} icon={ArrowDownRight} accent="#dc2626" accentLight="#fee2e2" />
          <Stat label="Net Flow"    value={cedi(Math.abs(d.transactions.net_flow))} sub={d.transactions.net_flow >= 0 ? "Positive" : "Negative"} icon={TrendingUp} accent={d.transactions.net_flow >= 0 ? "#059669" : "#dc2626"} accentLight={d.transactions.net_flow >= 0 ? "#d1fae5" : "#fee2e2"} />
        </div>
      </div>
      <div>
        <SectionTitle><Wallet className="h-3.5 w-3.5" />Float Position</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <Stat label="Allocated" value={cedi(d.float.total_allocated)} icon={Banknote}      accent="#1d4ed8" accentLight="#dbeafe" />
          <Stat label="Spent"     value={cedi(d.float.total_spent)}     icon={ArrowDownRight} accent="#b45309" accentLight="#fef3c7" />
          <Stat label="Remaining" value={cedi(d.float.total_remaining)} icon={PiggyBank}     accent="#0f766e" accentLight="#ccfbf1" />
        </div>
        {d.float.teller_floats?.length > 0 && (
          <TableWrap>
            <thead><tr><TH>Teller</TH><TH>Allocated</TH><TH>Spent</TH><TH>Remaining</TH><TH>Status</TH></tr></thead>
            <tbody>
              {d.float.teller_floats.map((f: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <TD><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">{initials(f.teller_name)}</div><span className="font-medium text-gray-800">{f.teller_name || "—"}</span></div></TD>
                  <TD right>{cedi(f.allocated)}</TD>
                  <TD right>{cedi(f.spent)}</TD>
                  <TD right>{cedi(f.remaining)}</TD>
                  <TD><Pill color={f.status === "Active" ? "#059669" : "#6b7280"}>{f.status}</Pill></TD>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </div>
      <div>
        <SectionTitle><CreditCard className="h-3.5 w-3.5" />Loan Activity</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="New Applications" value={fmtN(d.loans.new_applications)}  icon={CreditCard}   accent="#7c3aed" accentLight="#ede9fe" />
          <Stat label="Approved Today"   value={fmtN(d.loans.approved_today)}    icon={CheckCircle2} accent="#059669" accentLight="#d1fae5" />
          <Stat label="Repayments"       value={cedi(d.loans.repayments.total)}  sub={`${fmtN(d.loans.repayments.count)} payments`} icon={ReceiptText} accent="#0f766e" accentLight="#ccfbf1" />
          <Stat label="Overdue"          value={fmtN(d.loans.total_overdue)}     icon={AlertTriangle} accent="#dc2626" accentLight="#fee2e2" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <SectionTitle><BadgeCheck className="h-3.5 w-3.5" />Commissions</SectionTitle>
          {[["Total Earned", cedi(d.commissions?.total_earned)], ["Paid Out", cedi(d.commissions?.paid_amount)], ["Reversed", cedi(d.commissions?.reversed_amount)], ["Count", fmtN(d.commissions?.count)]].map(([l, v]) => (
            <div key={l} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0"><span className="text-xs text-gray-500">{l}</span><span className="text-sm font-semibold text-gray-800">{v}</span></div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <SectionTitle><Building2 className="h-3.5 w-3.5" />Financials</SectionTitle>
          {[["Revenue Today", cedi(d.financials.revenue_today)], ["Expenses Today", cedi(d.financials.expenses_today)], ["Net Cash Position", cedi(d.financials.net_cash_position)], ["New Customers", fmtN(d.customers.new_today)]].map(([l, v]) => (
            <div key={l} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0"><span className="text-xs text-gray-500">{l}</span><span className="text-sm font-semibold text-gray-800">{v}</span></div>
          ))}
        </div>
      </div>
      {d.staff_activity?.length > 0 && (
        <div>
          <SectionTitle><Users className="h-3.5 w-3.5" />Staff Activity</SectionTitle>
          <TableWrap>
            <thead><tr><TH>Name</TH><TH>Role</TH><TH>Deposits</TH><TH>Value</TH><TH>Customers</TH><TH>Last Seen</TH></tr></thead>
            <tbody>
              {d.staff_activity.map((s: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <TD><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-[#e8f0e5] flex items-center justify-center text-[#344a2e] text-xs font-bold shrink-0">{initials(s.name)}</div><span className="font-medium">{s.name}</span></div></TD>
                  <TD><Pill color="#6b7280">{s.role}</Pill></TD>
                  <TD right>{fmtN(s.deposits_recorded)}</TD>
                  <TD right>{cedi(s.deposit_value)}</TD>
                  <TD right>{fmtN(s.customers_registered)}</TD>
                  <TD>{s.last_activity ? fmtDate(s.last_activity) : "—"}</TD>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      )}
    </div>
  );
};

const TellerView = ({ data }: { data: any }) => {
  const d = data?.data;
  if (!d) return null;
  const s = d.summary;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="Total Allocated" value={cedi(s.total_allocated)} icon={Banknote}      accent="#1d4ed8" accentLight="#dbeafe" />
        <Stat label="Total Spent"     value={cedi(s.total_spent)}     icon={ArrowDownRight} accent="#b45309" accentLight="#fef3c7" />
        <Stat label="Remaining"       value={cedi(s.total_remaining)} icon={PiggyBank}     accent="#0f766e" accentLight="#ccfbf1" />
      </div>
      {d.teller_floats?.length > 0 && (
        <div>
          <SectionTitle><Wallet className="h-3.5 w-3.5" />Float Detail Per Teller</SectionTitle>
          <div className="space-y-3">
            {d.teller_floats.map((t: any, i: number) => {
              const pct = t.allocated > 0 ? (t.spent / t.allocated) * 100 : 0;
              return (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-sm">{initials(t.teller_name)}</div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{t.teller_name || "Unknown"}</p>
                        <p className="text-[11px] text-gray-400">Expected closing: {cedi(t.expected_closing_balance ?? (t.allocated - t.spent))}</p>
                      </div>
                    </div>
                    <Pill color={t.status === "Active" ? "#059669" : "#6b7280"}>{t.status}</Pill>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    {[["Allocated", cedi(t.allocated)], ["Spent", cedi(t.spent)], ["Remaining", cedi(t.remaining)]].map(([l, v]) => (
                      <div key={l} className="bg-gray-50 rounded-xl p-2"><p className="text-[10px] text-gray-400 uppercase tracking-wider">{l}</p><p className="text-sm font-bold text-gray-800 mt-0.5">{v}</p></div>
                    ))}
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: pct > 90 ? "#dc2626" : pct > 60 ? "#d97706" : "#059669" }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 text-right">{pct.toFixed(1)}% utilised</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const FinancialView = ({ data }: { data: any }) => {
  const d = data?.data;
  if (!d) return null;
  const pl = d.income_statement;
  const profit = pl.net_profit >= 0;
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <SectionTitle><ReceiptText className="h-3.5 w-3.5" />Day P&L Statement</SectionTitle>
        <div className="divide-y divide-gray-50">
          {[
            { l: "Revenue",          v: cedi(pl.total_revenue),         color: "#059669", bold: false },
            { l: "Commission Paid",  v: cedi(pl.total_commission_paid),  color: "#059669", bold: false },
            { l: "Loan Repayments",  v: cedi(pl.loan_repayment_income),  color: "#059669", bold: false },
            { l: "Total Income",     v: cedi(pl.total_income),           color: "#059669", bold: true  },
            { l: "Total Expenses",   v: cedi(pl.total_expenses),         color: "#dc2626", bold: false },
            { l: "Net Profit",       v: cedi(Math.abs(pl.net_profit)),   color: profit ? "#059669" : "#dc2626", bold: true },
            { l: "Profit Margin",    v: `${pl.profit_margin_pct}%`,      color: profit ? "#059669" : "#dc2626", bold: false },
          ].map(row => (
            <div key={row.l} className={`flex justify-between py-2.5 ${row.bold ? "font-bold" : ""}`}>
              <span className="text-sm text-gray-600">{row.l}</span>
              <span className="text-sm font-semibold" style={{ color: row.color }}>{row.v}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <SectionTitle><Wallet className="h-3.5 w-3.5" />Budget Reconciliation</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Stat label="Allocated"   value={cedi(d.budget_reconciliation.total_allocated)} icon={Banknote}      accent="#1d4ed8" accentLight="#dbeafe" />
          <Stat label="Spent"       value={cedi(d.budget_reconciliation.total_spent)}     icon={ArrowDownRight} accent="#b45309" accentLight="#fef3c7" />
          <Stat label="Variance"    value={cedi(d.budget_reconciliation.total_variance)}  icon={TrendingUp}    accent="#0f766e" accentLight="#ccfbf1" />
          <Stat label="Utilisation" value={`${d.budget_reconciliation.utilisation_pct}%`} icon={BarChart3}     accent="#7c3aed" accentLight="#ede9fe" />
        </div>
      </div>
      {d.expense_breakdown?.length > 0 && (
        <div>
          <SectionTitle><ArrowDownRight className="h-3.5 w-3.5" />Expenses By Category</SectionTitle>
          <div className="space-y-2">
            {d.expense_breakdown.map((e: any) => {
              const total = d.expense_breakdown.reduce((s: number, x: any) => s + Number(x.amount), 0);
              const pct = total > 0 ? (e.amount / total) * 100 : 0;
              return (
                <div key={e.category} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600 w-28 shrink-0 capitalize">{e.category || "Other"}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-5 rounded-full transition-all duration-700 flex items-center justify-end pr-2" style={{ width: `${Math.max(pct, 4)}%`, background: "#7c3aed" }}>
                      {pct > 20 && <span className="text-white text-xs font-medium">{cedi(e.amount)}</span>}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-24 text-right">{cedi(e.amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {d.commission_payables?.count > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <SectionTitle><AlertTriangle className="h-3.5 w-3.5 text-amber-500" />Pending Commission Payables</SectionTitle>
          <p className="text-sm text-amber-700 font-semibold">{fmtN(d.commission_payables.count)} items · {cedi(d.commission_payables.total)} outstanding</p>
        </div>
      )}
    </div>
  );
};

const LoanView = ({ data }: { data: any }) => {
  const d = data?.data;
  if (!d) return null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="New Applications" value={fmtN(d.totals.new_applications)}  icon={CreditCard}   accent="#7c3aed" accentLight="#ede9fe" />
        <Stat label="Repayment Total"  value={cedi(d.totals.total_repayments)}  sub={`${fmtN(d.totals.repayment_count)} payments`} icon={ReceiptText} accent="#059669" accentLight="#d1fae5" />
        <Stat label="Overdue Count"    value={fmtN(d.totals.total_overdue)}     icon={AlertTriangle} accent="#dc2626" accentLight="#fee2e2" />
        <Stat label="Loan Types"       value={fmtN(d.loan_summary_by_type?.length)} icon={BarChart3} accent="#b45309" accentLight="#fef3c7" />
      </div>
      {d.repayments_today?.length > 0 && (
        <div>
          <SectionTitle><ReceiptText className="h-3.5 w-3.5" />Repayments Today</SectionTitle>
          <TableWrap>
            <thead><tr><TH>Customer</TH><TH>Type</TH><TH>Amount</TH><TH>Balance After</TH></tr></thead>
            <tbody>
              {d.repayments_today.map((r: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <TD><span className="font-medium">{r.customer_name || "—"}</span><br /><span className="text-xs text-gray-400">{r.phone_number}</span></TD>
                  <TD><Pill color="#7c3aed">{r.loantype}</Pill></TD>
                  <TD right>{cedi(r.amount)}</TD>
                  <TD right>{cedi(r.balance_after)}</TD>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      )}
      {d.overdue_loans?.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <SectionTitle><AlertTriangle className="h-3.5 w-3.5 text-red-500" />Overdue Loans</SectionTitle>
          <TableWrap>
            <thead><tr><TH>Customer</TH><TH>Type</TH><TH>Days Overdue</TH><TH>Outstanding</TH></tr></thead>
            <tbody>
              {d.overdue_loans.map((l: any, i: number) => (
                <tr key={i} className="hover:bg-red-50/50">
                  <TD><span className="font-medium">{l.customer_name}</span></TD>
                  <TD><Pill color="#b45309">{l.loantype}</Pill></TD>
                  <TD><Pill color="#dc2626">{l.days_overdue}d</Pill></TD>
                  <TD right>{cedi(l.outstandingbalance)}</TD>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      )}
    </div>
  );
};

const SalesView = ({ data }: { data: any }) => {
  const d = data?.data;
  if (!d) return null;
  const s = d.summary;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total Deposits"  value={cedi(s.total_deposits_today)}  icon={PiggyBank}  accent="#0f766e" accentLight="#ccfbf1" />
        <Stat label="New Customers"   value={fmtN(s.total_new_customers)}   icon={Users}      accent="#1d4ed8" accentLight="#dbeafe" />
        <Stat label="Active Agents"   value={fmtN(s.active_agents)}         icon={UserCheck}  accent="#344a2e" accentLight="#e8f0e5" />
        <Stat label="Best Agent"      value={s.best_agent}                  sub={cedi(s.best_agent_total)} icon={TrendingUp} accent="#b45309" accentLight="#fef3c7" />
      </div>
      {d.agent_performance?.filter((a: any) => a.deposit_count > 0).length > 0 && (
        <div>
          <SectionTitle><UserCheck className="h-3.5 w-3.5" />Agent Performance</SectionTitle>
          <div className="space-y-3">
            {d.agent_performance.filter((a: any) => a.deposit_count > 0).map((a: any, i: number) => {
              const maxVal = Math.max(...d.agent_performance.map((x: any) => Number(x.deposit_total)), 1);
              const pct = (a.deposit_total / maxVal) * 100;
              return (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-[#e8f0e5] flex items-center justify-center text-[#344a2e] font-bold text-sm shrink-0">{initials(a.agent_name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-800 truncate">{a.agent_name}</span>
                      <span className="text-sm font-bold text-[#344a2e] ml-2 shrink-0">{cedi(a.deposit_total)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-2 rounded-full bg-[#344a2e] transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex gap-3 mt-1 text-[10px] text-gray-400">
                      <span>{fmtN(a.deposit_count)} deposits</span>
                      <span>{fmtN(a.new_customers)} new clients</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {d.hourly_trend?.length > 0 && (
        <div>
          <SectionTitle><Clock className="h-3.5 w-3.5" />Hourly Deposit Trend</SectionTitle>
          <div className="flex items-end gap-1 h-24">
            {Array.from({ length: 24 }, (_, h) => {
              const item = d.hourly_trend.find((t: any) => Number(t.hour) === h);
              const max = Math.max(...d.hourly_trend.map((t: any) => Number(t.total)), 1);
              const pct = item ? (Number(item.total) / max) * 100 : 0;
              return (
                <div key={h} className="flex-1 flex flex-col items-center gap-1" title={`${h}:00 — ${cedi(item?.total || 0)}`}>
                  <div className="w-full rounded-t-sm" style={{ height: `${pct}%`, minHeight: pct > 0 ? "4px" : "0", background: "#344a2e", opacity: pct > 0 ? 1 : 0.15 }} />
                  {h % 4 === 0 && <span className="text-[8px] text-gray-400">{h}h</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const HRView = ({ data }: { data: any }) => {
  const d = data?.data;
  if (!d) return null;
  const s = d.summary;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total Staff"  value={fmtN(s.total_staff)}  icon={Users}      accent="#344a2e" accentLight="#e8f0e5" />
        <Stat label="Active Today" value={fmtN(s.active_today)} icon={Activity}   accent="#059669" accentLight="#d1fae5" />
        <Stat label="Idle Today"   value={fmtN(s.idle_today)}   icon={Clock}      accent="#b45309" accentLight="#fef3c7" />
        <Stat label="New Hires"    value={fmtN(s.new_hires)}    icon={UserCheck}  accent="#7c3aed" accentLight="#ede9fe" />
      </div>
      {d.staff_activity?.length > 0 && (
        <div>
          <SectionTitle><Users className="h-3.5 w-3.5" />Staff Activity</SectionTitle>
          <TableWrap>
            <thead><tr><TH>Name</TH><TH>Role</TH><TH>Status</TH><TH>Transactions</TH><TH>Deposits</TH><TH>Clients Reg.</TH></tr></thead>
            <tbody>
              {d.staff_activity.map((st: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <TD><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-[#e8f0e5] flex items-center justify-center text-[#344a2e] text-xs font-bold shrink-0">{initials(st.full_name)}</div><span className="font-medium">{st.full_name}</span></div></TD>
                  <TD><Pill color="#6b7280">{st.role}</Pill></TD>
                  <TD><Pill color={st.day_status === "Active" ? "#059669" : "#6b7280"}>{st.day_status}</Pill></TD>
                  <TD right>{fmtN(st.transactions_today)}</TD>
                  <TD right>{cedi(st.deposits_today)}</TD>
                  <TD right>{fmtN(st.customers_registered)}</TD>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      )}
    </div>
  );
};

const AuditView = ({ data }: { data: any }) => {
  const d = data?.data;
  if (!d) return null;
  const s = d.summary;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Reversals"     value={fmtN(s.total_reversals)}    icon={XCircle}      accent="#dc2626" accentLight="#fee2e2" />
        <Stat label="Rejections"    value={fmtN(s.total_rejections)}   icon={XCircle}      accent="#b45309" accentLight="#fef3c7" />
        <Stat label="Approvals"     value={fmtN(s.total_approvals)}    icon={CheckCircle2} accent="#059669" accentLight="#d1fae5" />
        <Stat label="Deletions"     value={fmtN(s.total_deletions)}    icon={AlertTriangle} accent="#7c3aed" accentLight="#ede9fe" />
        <Stat label="Budget Events" value={fmtN(s.total_budget_events)} icon={Wallet}       accent="#1d4ed8" accentLight="#dbeafe" />
      </div>
      {d.reversals?.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <SectionTitle><XCircle className="h-3.5 w-3.5 text-red-500" />Reversals Today</SectionTitle>
          <TableWrap>
            <thead><tr><TH>Type</TH><TH>Customer</TH><TH>Amount</TH><TH>Reversed By</TH><TH>Time</TH></tr></thead>
            <tbody>
              {d.reversals.map((r: any, i: number) => (
                <tr key={i} className="hover:bg-red-50/40">
                  <TD><Pill color="#dc2626">{r.type}</Pill></TD>
                  <TD><span className="font-medium">{r.customer_name || "—"}</span></TD>
                  <TD right>{cedi(r.amount)}</TD>
                  <TD>{r.reversed_by_name || "—"}</TD>
                  <TD>{r.reversed_at ? fmtDate(r.reversed_at) : "—"}</TD>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      )}
      {d.approved_loans?.length > 0 && (
        <div>
          <SectionTitle><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />Loans Approved Today</SectionTitle>
          <TableWrap>
            <thead><tr><TH>Customer</TH><TH>Type</TH><TH>Amount</TH><TH>Approved By</TH><TH>Time</TH></tr></thead>
            <tbody>
              {d.approved_loans.map((l: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <TD><span className="font-medium">{l.customer_name || "—"}</span></TD>
                  <TD><Pill color="#7c3aed">{l.loantype}</Pill></TD>
                  <TD right>{cedi(l.loanamount)}</TD>
                  <TD>{l.approved_by_name || "—"}</TD>
                  <TD>{l.approved_at ? fmtDate(l.approved_at) : "—"}</TD>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      )}
      {d.budget_events?.length > 0 && (
        <div>
          <SectionTitle><Wallet className="h-3.5 w-3.5" />Budget Events</SectionTitle>
          <TableWrap>
            <thead><tr><TH>Event</TH><TH>Teller</TH><TH>Amount</TH><TH>Recorded By</TH><TH>Time</TH></tr></thead>
            <tbody>
              {d.budget_events.map((e: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <TD><Pill color={e.event_type === "topup" ? "#059669" : "#b45309"}>{e.event_type}</Pill></TD>
                  <TD>{e.teller_name || "—"}</TD>
                  <TD right>{cedi(e.amount)}</TD>
                  <TD>{e.recorded_by_name || "—"}</TD>
                  <TD>{e.created_at ? fmtDate(e.created_at) : "—"}</TD>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CLOSE DAY MODAL
// ─────────────────────────────────────────────────────────────────────────────

const CloseDayModal = ({ onClose }: { onClose: () => void }) => {
  const { closeDay, loading } = useDayEnd();
  const [date, setDate] = useState(today());
  const [result, setResult] = useState<any>(null);

  const handle = async () => {
    const r = await closeDay(date);
    if (r) setResult(r);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#e8f0e5] flex items-center justify-center"><Lock className="h-4 w-4 text-[#344a2e]" /></div>
            <div><h3 className="text-sm font-bold text-gray-900">Close Day</h3><p className="text-[11px] text-gray-400">This will lock all open floats</p></div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {!result ? (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Date to Close</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#344a2e] outline-none" />
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2 text-xs text-amber-700">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>All active floats for this date will be marked <strong>Closed</strong>. This action is logged and irreversible without admin access.</span>
              </div>
              <button onClick={handle} disabled={loading.close} className="w-full bg-[#344a2e] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#2a3a25] disabled:opacity-50 flex items-center justify-center gap-2">
                {loading.close ? <><Loader2 className="h-4 w-4 animate-spin" />Closing…</> : <><Lock className="h-4 w-4" />Close Day</>}
              </button>
            </>
          ) : (
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 className="h-7 w-7 text-green-600" /></div>
              <p className="text-sm font-bold text-gray-900">Day Closed — {result.report_date}</p>
              <div className="grid grid-cols-2 gap-2 text-left">
                {[["Floats Closed", fmtN(result.floats_closed_now)], ["Transactions", fmtN(result.snapshot?.total_transactions)], ["Deposits", cedi(result.snapshot?.total_deposits)], ["Withdrawals", cedi(result.snapshot?.total_withdrawals)]].map(([l, v]) => (
                  <div key={l} className="bg-gray-50 rounded-xl p-2.5"><p className="text-[10px] text-gray-400 uppercase tracking-wider">{l}</p><p className="text-sm font-bold text-gray-800">{v}</p></div>
                ))}
              </div>
              <button onClick={onClose} className="w-full bg-gray-100 text-gray-700 rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-200">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

const DayEndPage = () => {
  const { loading, summaryData, tellerData, loanReportData, financialData, salesData, hrData, auditData, fetchSummary, fetchTellerReconciliation, fetchLoanReport, fetchFinancialClose, fetchSalesReport, fetchHRReport, fetchAuditTrail } = useDayEnd();
  const [selectedReport, setSelectedReport] = useState<ReportKey | null>(null);
  const [date, setDate] = useState(today());
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const visibleReports = REPORT_DEFS.filter(r => {
    const hasRole = (r.roles as readonly string[]).includes(userRole) || userRole === "CEO" || userRole === "Manager";
    const hasPerm = !r.permission || (userPermissions as any)?.[r.permission];
    return hasRole || hasPerm;
  });

  const fetchMap: Record<ReportKey, (q?: any) => Promise<any>> = {
    "summary": fetchSummary,
    "teller-reconciliation": fetchTellerReconciliation,
    "loan-report": fetchLoanReport,
    "financial-close": fetchFinancialClose,
    "sales-report": fetchSalesReport,
    "hr-report": fetchHRReport,
    "audit-trail": fetchAuditTrail,
  };

  const dataMap: Record<ReportKey, any> = {
    "summary": summaryData,
    "teller-reconciliation": tellerData,
    "loan-report": loanReportData,
    "financial-close": financialData,
    "sales-report": salesData,
    "hr-report": hrData,
    "audit-trail": auditData,
  };

  const viewMap: Record<ReportKey, React.FC<{ data: any }>> = {
    "summary": SummaryView,
    "teller-reconciliation": TellerView,
    "loan-report": LoanView,
    "financial-close": FinancialView,
    "sales-report": SalesView,
    "hr-report": HRView,
    "audit-trail": AuditView,
  };

  const handleSelect = async (key: ReportKey) => {
    setSelectedReport(key);
    setExpanded(false);
    await fetchMap[key]({ date, staff_id: userUUID });
  };

  const handleRefresh = async () => {
    if (!selectedReport) return;
    await fetchMap[selectedReport]({ date });
  };

  const currentDef  = selectedReport ? REPORT_DEFS.find(r => r.key === selectedReport) : null;
  const currentData = selectedReport ? dataMap[selectedReport] : null;
  const CurrentView = selectedReport ? viewMap[selectedReport] : null;
  const isLoading   = selectedReport ? loading[selectedReport] : false;
  const canCloseDay = userRole === "Manager" || userRole === "Accountant" || userRole === "CEO" || (userPermissions as any)?.ALTER_FINANCE;

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Day-End Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">Select a report type and load your end-of-day data</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#344a2e] focus:border-[#344a2e] outline-none bg-white shadow-sm" />
          </div>
          {canCloseDay && (
            <button onClick={() => setShowCloseModal(true)} className="flex items-center gap-2 bg-[#344a2e] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#2a3a25] transition-colors shadow-sm">
              <Lock className="h-3.5 w-3.5" />Close Day
            </button>
          )}
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Report selector */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button onClick={() => setExpanded(p => !p)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="h-4 w-4 text-[#344a2e]" />
            <div>
              <p className="text-sm font-bold text-gray-900">Select Report Type</p>
              {currentDef && !expanded && <p className="text-xs text-gray-400">Currently: <span className="font-semibold text-[#344a2e]">{currentDef.label}</span></p>}
            </div>
          </div>
          {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
        </button>
        {expanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4 border-t border-gray-50">
            {visibleReports.map(r => {
              const Icon = r.icon;
              const active = selectedReport === r.key;
              return (
                <button key={r.key} onClick={() => handleSelect(r.key)}
                  className={`rounded-2xl p-4 text-left transition-all border-2 hover:shadow-md ${active ? "shadow-md" : "border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200"}`}
                  style={active ? { borderColor: r.accent, background: r.accentLight } : {}}>
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl p-2.5 shrink-0" style={{ background: active ? r.accent + "22" : "#f3f4f6" }}>
                      <Icon className="h-5 w-5" style={{ color: active ? r.accent : "#6b7280" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: active ? r.accent : "#111827" }}>{r.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-snug">{r.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Report panel */}
      {selectedReport && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {currentDef && <div className="rounded-xl p-2" style={{ background: currentDef.accentLight }}><currentDef.icon className="h-5 w-5" style={{ color: currentDef.accent }} /></div>}
              <div>
                <p className="text-sm font-bold text-gray-900">{currentDef?.label}</p>
                <p className="text-xs text-gray-400">{currentData?.report_date ? `Report date: ${currentData.report_date}` : `Date: ${date}`}{currentData?.generated_at && ` · Generated ${fmtDate(currentData.generated_at)}`}</p>
              </div>
            </div>
            <button onClick={handleRefresh} disabled={isLoading} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />Refresh
            </button>
          </div>
          <div className="p-5">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin text-[#344a2e]" />
                <p className="text-sm">Loading {currentDef?.label}…</p>
              </div>
            ) : currentData && CurrentView ? (
              <CurrentView data={currentData} />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                  {currentDef && <currentDef.icon className="h-7 w-7 text-gray-400" />}
                </div>
                <p className="text-sm font-semibold text-gray-500">No data loaded yet</p>
                <button onClick={handleRefresh} className="flex items-center gap-2 bg-[#344a2e] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#2a3a25]">
                  <RefreshCw className="h-3.5 w-3.5" />Load Report
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedReport && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 bg-[#e8f0e5] rounded-2xl flex items-center justify-center"><Moon className="h-7 w-7 text-[#344a2e]" /></div>
          <p className="text-base font-bold text-gray-700">Select a report above</p>
          <p className="text-sm text-gray-400">Choose from {visibleReports.length} available day-end reports for your role</p>
        </div>
      )}

      {showCloseModal && <CloseDayModal onClose={() => setShowCloseModal(false)} />}
    </div>
  );
};

export default DayEndPage;
