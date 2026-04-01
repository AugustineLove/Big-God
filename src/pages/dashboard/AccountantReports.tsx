import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Download, TrendingUp, TrendingDown, BarChart3, Filter, Loader2,
  CheckCircle, XCircle, RefreshCw, ArrowUpRight, ArrowDownRight,
  Calendar, DollarSign, AlertCircle, Clock, FileText, Activity,
  CreditCard, PieChart, Layers, ChevronDown, ChevronRight,
  AlertTriangle, Users, Banknote, Receipt, Target, Wallet
} from 'lucide-react';
import autoTable from 'jspdf-autotable';
import { companyId } from '../../constants/appConstants';

const BASE_URL = 'https://susu-pro-backend.onrender.com';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'loan_portfolio' | 'cash_flow';
type ExportFormat = 'pdf' | 'xlsx' | 'csv';

interface ExportStatus { type: 'success' | 'error' | null; message: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt  = (n: any) => Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtN = (n: any) => Number(n || 0).toLocaleString();
const fmtCedi = (n: any) => `GH₵ ${fmt(n)}`;
const pct  = (n: any) => `${Number(n || 0).toFixed(1)}%`;
const sign = (n: any) => Number(n) >= 0 ? '+' : '';

// ─── Config ───────────────────────────────────────────────────────────────────

const REPORT_TYPES: { id: ReportType; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'daily',          label: 'Daily',          icon: Clock,      desc: "Today's activity & hourly breakdown" },
  { id: 'weekly',         label: 'Weekly',          icon: Calendar,   desc: 'Week-over-week trends & agent performance' },
  { id: 'monthly',        label: 'Monthly',         icon: BarChart3,  desc: 'Full month with loans, deposits & overdue' },
  { id: 'quarterly',      label: 'Quarterly',       icon: PieChart,   desc: 'Quarter with PAR, customer growth & loan types' },
  { id: 'annual',         label: 'Annual',          icon: TrendingUp, desc: 'Year-over-year with full loan stats & commissions' },
  { id: 'loan_portfolio', label: 'Loan Portfolio',  icon: CreditCard, desc: 'Deep-dive: PAR ageing, borrowers & repayments' },
  { id: 'cash_flow',      label: 'Cash Flow',       icon: Wallet,     desc: 'Operating vs financing cash flow statement' },
];

const PERIOD_OPTIONS: Record<ReportType, { value: string; label: string }[]> = {
  daily:          [{ value: '', label: 'Today' }],
  weekly:         [{ value: 'this_week', label: 'This Week' }, { value: 'last_week', label: 'Last Week' }, { value: 'custom', label: 'Custom Range' }],
  monthly:        [{ value: 'this_month', label: 'This Month' }, { value: 'last_month', label: 'Last Month' }, { value: 'custom', label: 'Custom Range' }],
  quarterly:      [{ value: 'this_quarter', label: 'This Quarter' }, { value: 'last_quarter', label: 'Last Quarter' }, { value: 'custom', label: 'Custom Range' }],
  annual:         [{ value: 'this_year', label: 'This Year' }, { value: 'last_year', label: 'Last Year' }, { value: 'custom', label: 'Custom Range' }],
  loan_portfolio: [{ value: 'this_month', label: 'This Month' }, { value: 'last_month', label: 'Last Month' }, { value: 'this_year', label: 'This Year' }, { value: 'custom', label: 'Custom Range' }],
  cash_flow:      [{ value: 'this_month', label: 'This Month' }, { value: 'last_month', label: 'Last Month' }, { value: 'this_year', label: 'This Year' }, { value: 'custom', label: 'Custom Range' }],
};

// ─── Shared UI ────────────────────────────────────────────────────────────────

const KPICard = ({ label, value, sub, icon: Icon, trend, accent = 'blue' }: any) => {
  const accents: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-600 border-blue-100',
    green:  'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber:  'bg-amber-50 text-amber-600 border-amber-100',
    red:    'bg-red-50 text-red-600 border-red-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    slate:  'bg-slate-50 text-slate-600 border-slate-100',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl border ${accents[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${Number(trend) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {sign(trend)}{pct(trend)}
          </span>
        )}
      </div>
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
};

const Section = ({ title, icon: Icon, children }: any) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2.5">
      <Icon className="h-4 w-4 text-gray-400" />
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Empty = ({ msg = 'No data available' }: { msg?: string }) => (
  <div className="py-10 text-center text-gray-300 text-sm">{msg}</div>
);

const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    completed: 'bg-emerald-100 text-emerald-700',
    approved:  'bg-green-100 text-green-700',
    active:    'bg-blue-100 text-blue-700',
    pending:   'bg-amber-100 text-amber-700',
    rejected:  'bg-red-100 text-red-700',
    overdue:   'bg-orange-100 text-orange-700',
    defaulted: 'bg-rose-100 text-rose-700',
    reversed:  'bg-gray-100 text-gray-500',
  };
  const key = (status || '').toLowerCase();
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${map[key] || 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
};

const HBar = ({ label, value, max, secondary }: any) => {
  const w = max > 0 ? Math.max((value / max) * 100, 2) : 2;
  return (
    <div className="flex items-center gap-3 group">
      <div className="w-24 text-xs text-gray-500 truncate shrink-0">{label}</div>
      <div className="flex-1 bg-gray-50 rounded-full h-6 overflow-hidden">
        <div
          className="h-6 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 flex items-center justify-end pr-2 transition-all duration-700"
          style={{ width: `${w}%` }}
        >
          {w > 30 && <span className="text-white text-[10px] font-semibold">{fmtCedi(value)}</span>}
        </div>
      </div>
      <div className="w-28 text-right shrink-0">
        <div className="text-xs font-semibold text-gray-800">{fmtCedi(value)}</div>
        {secondary && <div className="text-[10px] text-gray-400">{secondary}</div>}
      </div>
    </div>
  );
};

const DataTable = ({ heads, rows, striped = true }: { heads: string[]; rows: (string | React.ReactNode)[][]; striped?: boolean }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-gray-100">
          {heads.map((h, i) => (
            <th key={i} className={`py-2.5 px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors ${striped && i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
            {row.map((cell, j) => (
              <td key={j} className={`py-2.5 px-3 text-xs text-gray-700 ${j === 0 ? 'text-left' : 'text-right font-medium'}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── Report Previews ─────────────────────────────────────────────────────────

// DAILY
const DailyView = ({ data }: { data: any }) => {
  const s = data.summary || {};
  const hourly: any[] = data.hourlyBreakdown || [];
  const txs: any[] = data.transactions || [];
  const maxHourly = Math.max(...hourly.map((h: any) => Number(h.deposits || 0)), 1);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard label="Total Deposits"    value={fmtCedi(s.total_deposits)}    sub={`${fmtN(s.deposit_count)} txns`}     icon={ArrowUpRight}   accent="green" />
        <KPICard label="Total Withdrawals" value={fmtCedi(s.total_withdrawals)}  sub={`${fmtN(s.withdrawal_count)} txns`}  icon={ArrowDownRight}  accent="red"   />
        <KPICard label="Net Cash Flow"     value={fmtCedi(s.net_cash_flow)}      sub="Deposits + repayments − withdrawals" icon={TrendingUp}      accent={Number(s.net_cash_flow) >= 0 ? 'green' : 'red'} />
        <KPICard label="Loan Repayments"   value={fmtCedi(s.total_repaid)}       sub={`${fmtN(s.repayment_count)} collected`} icon={Receipt}     accent="blue"  />
        <KPICard label="New Loan Apps"     value={fmtN(s.new_loan_applications)} sub={`${fmtN(s.loans_approved_today)} approved`} icon={CreditCard} accent="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Hourly Deposit Activity" icon={Activity}>
          {hourly.length > 0 ? (
            <div className="space-y-2">
              {hourly.map((h: any) => (
                <HBar key={h.hour} label={`${String(h.hour).padStart(2, '0')}:00`} value={h.deposits} max={maxHourly} secondary={`${fmtN(h.count)} txns`} />
              ))}
            </div>
          ) : <Empty />}
        </Section>

        <Section title="Today's Transactions" icon={FileText}>
          {txs.length > 0 ? (
            <div className="max-h-80 overflow-y-auto space-y-1">
              {txs.slice(0, 30).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-xs font-medium text-gray-800">{t.customer_name || '—'}</div>
                    <div className="text-[10px] text-gray-400">{t.account_type} · {t.reference || '—'}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-semibold ${t.type === 'deposit' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {t.type === 'deposit' ? '+' : '-'}{fmtCedi(t.amount)}
                    </div>
                    <StatusPill status={t.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty msg="No transactions today" />}
        </Section>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KPICard label="New Customers"  value={fmtN(s.new_customers)}  sub="Registered today"     icon={Users}         accent="blue"  />
        <KPICard label="Pending Txns"   value={fmtN(s.pending_count)}  sub="Awaiting processing"  icon={Clock}         accent="amber" />
        <KPICard label="Failed Txns"    value={fmtN(s.failed_count)}   sub="Require attention"    icon={AlertCircle}   accent="red"   />
      </div>
    </div>
  );
};

// WEEKLY
const WeeklyView = ({ data }: { data: any }) => {
  const s = data.summary || {};
  const cmp = data.comparison || {};
  const daily: any[] = data.dailyBreakdown || [];
  const agents: any[] = data.topAgents || [];
  const maxDep = Math.max(...daily.map((d: any) => Number(d.deposits || 0)), 1);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard label="Deposits"     value={fmtCedi(s.total_deposits)}    sub={`${fmtN(s.deposit_count)} txns`}    icon={ArrowUpRight}  accent="green"  trend={cmp.deposit_change_pct} />
        <KPICard label="Withdrawals"  value={fmtCedi(s.total_withdrawals)} sub={`${fmtN(s.withdrawal_count)} txns`} icon={ArrowDownRight} accent="red"    />
        <KPICard label="Net Flow"     value={fmtCedi(s.net_flow)}          sub="Week net"                           icon={TrendingUp}     accent={Number(s.net_flow) >= 0 ? 'green' : 'red'} />
        <KPICard label="New Loans"    value={fmtN(s.new_loans)}            sub={fmtCedi(s.loans_amount)}            icon={CreditCard}     accent="blue"   />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Daily Deposit Breakdown" icon={BarChart3}>
          {daily.length > 0 ? (
            <div className="space-y-2">
              {daily.map((d: any, i: number) => (
                <HBar key={i} label={d.day_label} value={d.deposits} max={maxDep} secondary={`${fmtN(d.tx_count)} txns`} />
              ))}
            </div>
          ) : <Empty />}
        </Section>

        <Section title="Top Collecting Agents" icon={Users}>
          {agents.length > 0 ? (
            <DataTable
              heads={['Agent', 'Txns', 'Collected']}
              rows={agents.map((a: any) => [
                a.created_by || 'Unknown',
                fmtN(a.transaction_count),
                fmtCedi(a.deposits_collected),
              ])}
            />
          ) : <Empty msg="No agent data" />}
        </Section>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">vs. Previous Week</h3>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: 'Prev Deposits',    val: fmtCedi(cmp.prev_deposits) },
            { label: 'Prev Withdrawals', val: fmtCedi(cmp.prev_withdrawals) },
            { label: 'Deposit Change',   val: cmp.deposit_change_pct != null ? `${sign(cmp.deposit_change_pct)}${pct(cmp.deposit_change_pct)}` : 'N/A' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">{item.label}</p>
              <p className="text-base font-bold text-gray-800 mt-1">{item.val}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// MONTHLY
const MonthlyView = ({ data }: { data: any }) => {
  const s  = data.summary || {};
  const l  = data.loans   || {};
  const weekly: any[] = data.weeklyBreakdown || [];
  const overdue: any[] = data.overdueLoans   || [];
  const topDep: any[]  = data.topDepositors  || [];
  const balances: any[] = data.accountBalances || [];
  const maxWk = Math.max(...weekly.map((w: any) => Number(w.deposits || 0)), 1);
  const maxBal = Math.max(...balances.map((b: any) => Number(b.total_balance || 0)), 1);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard label="Deposits"      value={fmtCedi(s.total_deposits)}    sub={`${fmtN(s.deposit_count)} txns`}  icon={ArrowUpRight}  accent="green"  />
        <KPICard label="Withdrawals"   value={fmtCedi(s.total_withdrawals)} sub={`${fmtN(s.withdrawal_count)} txns`} icon={ArrowDownRight} accent="red"  />
        <KPICard label="Net Cash Flow" value={fmtCedi(s.net_cash_flow)}     sub="Month net"                        icon={TrendingUp}     accent={Number(s.net_cash_flow) >= 0 ? 'green' : 'red'} />
        <KPICard label="New Customers" value={fmtN(s.new_customers)}        sub="Registered"                       icon={Users}          accent="blue"   />
        <KPICard label="Commissions"   value={fmtCedi(s.total_commissions)} sub="Total paid"                       icon={Receipt}        accent="violet" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="Loans in Portfolio" value={fmtN(l.total_in_portfolio)}  sub="All types"              icon={Layers}       accent="blue"   />
        <KPICard label="Outstanding"        value={fmtCedi(l.total_outstanding)} sub="Total owed"            icon={Banknote}     accent="amber"  />
        <KPICard label="Overdue"            value={fmtN(l.overdue_count)}        sub={fmtCedi(l.overdue_amount)} icon={AlertTriangle} accent="red" />
        <KPICard label="Repayments"         value={fmtCedi(l.repayments_collected)} sub={`${fmtN(l.repayment_count)} payments`} icon={CheckCircle} accent="green" />
        <KPICard label="New Applications"   value={fmtN(l.new_this_period)}      sub={`${fmtN(l.approved_this_period)} approved`} icon={CreditCard} accent="violet" />
        <KPICard label="Pending Apps"       value={fmtN(l.pending_applications)} sub="Awaiting decision"     icon={Clock}        accent="slate"  />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Weekly Deposit Trend" icon={BarChart3}>
          {weekly.length > 0 ? (
            <div className="space-y-2">
              {weekly.map((w: any, i: number) => (
                <HBar key={i} label={`Wk ${w.week_label}`} value={w.deposits} max={maxWk} secondary={`${fmtN(w.tx_count)} txns`} />
              ))}
            </div>
          ) : <Empty />}
        </Section>

        <Section title="Balance by Account Type" icon={Wallet}>
          {balances.length > 0 ? (
            <div className="space-y-3">
              {balances.map((b: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize text-gray-600 font-medium">{b.account_type}</span>
                    <span className="font-semibold text-gray-800">{fmtCedi(b.total_balance)} <span className="text-gray-400">({fmtN(b.account_count)} accts)</span></span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-violet-500 to-purple-400 h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${Math.max((b.total_balance / maxBal) * 100, 2)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty />}
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Top 10 Depositors" icon={Users}>
          {topDep.length > 0 ? (
            <DataTable
              heads={['Client', 'Phone', 'Deposits', 'Total']}
              rows={topDep.map((c: any) => [c.name, c.phone_number, fmtN(c.deposit_count), fmtCedi(c.total_deposited)])}
            />
          ) : <Empty />}
        </Section>

        <Section title="Top Overdue Loans" icon={AlertTriangle}>
          {overdue.length > 0 ? (
            <DataTable
              heads={['Borrower', 'Type', 'Days Overdue', 'Outstanding']}
              rows={overdue.map((l: any) => [l.customer_name || l.group_name || '—', l.loantype, fmtN(l.days_overdue), fmtCedi(l.outstandingbalance)])}
            />
          ) : <Empty msg="No overdue loans 🎉" />}
        </Section>
      </div>
    </div>
  );
};

// QUARTERLY
const QuarterlyView = ({ data }: { data: any }) => {
  const s  = data.summary  || {};
  const p  = data.portfolio || {};
  const cu = data.customers || {};
  const monthly: any[]   = data.monthlyBreakdown  || [];
  const origins: any[]   = data.loanOrigination   || [];
  const repays: any[]    = data.repaymentsByMonth  || [];
  const loanTypes: any[] = data.loanTypeBreakdown  || [];
  const maxMo = Math.max(...monthly.map((m: any) => Number(m.deposits || 0)), 1);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard label="Total Deposits"    value={fmtCedi(s.total_deposits)}    sub={`${fmtN(s.total_transactions)} txns`} icon={ArrowUpRight} accent="green"  />
        <KPICard label="Total Withdrawals" value={fmtCedi(s.total_withdrawals)} sub="Approved + completed"                icon={ArrowDownRight} accent="red"   />
        <KPICard label="Net Flow"          value={fmtCedi(s.net_flow)}          sub="Quarter net"                         icon={TrendingUp}    accent={Number(s.net_flow) >= 0 ? 'green' : 'red'} />
        <KPICard label="Commissions"       value={fmtCedi(s.total_commissions)} sub="Total"                               icon={Receipt}       accent="violet" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard label="Outstanding"  value={fmtCedi(p.total_outstanding)}   sub="Total loan portfolio" icon={Banknote}     accent="blue"  />
        <KPICard label="Overdue"      value={fmtCedi(p.overdue_outstanding)} sub={`${fmtN(p.overdue_count)} loans`} icon={AlertTriangle} accent="amber" />
        <KPICard label="PAR Rate"     value={pct(p.par_rate)}                sub="Portfolio at risk"    icon={Target}       accent={Number(p.par_rate) > 10 ? 'red' : 'green'} />
        <KPICard label="Defaulted"    value={fmtN(p.defaulted_count)}        sub="Loans defaulted"      icon={XCircle}      accent="red"   />
        <KPICard label="New Customers" value={fmtN(cu.new_this_period)}      sub={`${fmtN(cu.active)} active`} icon={Users} accent="blue"  />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Monthly Deposit Trend" icon={BarChart3}>
          {monthly.length > 0 ? (
            <div className="space-y-2">
              {monthly.map((m: any, i: number) => (
                <HBar key={i} label={m.month} value={m.deposits} max={maxMo} secondary={`${fmtN(m.tx_count)} txns`} />
              ))}
            </div>
          ) : <Empty />}
        </Section>

        <Section title="Loan Type Breakdown" icon={Layers}>
          {loanTypes.length > 0 ? (
            <DataTable
              heads={['Type', 'Count', 'Amount', 'Outstanding']}
              rows={loanTypes.map((l: any) => [l.loantype, fmtN(l.count), fmtCedi(l.total_amount), fmtCedi(l.outstanding)])}
            />
          ) : <Empty />}
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Loan Origination by Month" icon={CreditCard}>
          {origins.length > 0 ? (
            <DataTable
              heads={['Month', 'Loans', 'Amount']}
              rows={origins.map((o: any) => [o.month, fmtN(o.loan_count), fmtCedi(o.amount)])}
            />
          ) : <Empty />}
        </Section>

        <Section title="Repayments by Month" icon={Receipt}>
          {repays.length > 0 ? (
            <DataTable
              heads={['Month', 'Payments', 'Total']}
              rows={repays.map((r: any) => [r.month, fmtN(r.count), fmtCedi(r.total)])}
            />
          ) : <Empty />}
        </Section>
      </div>
    </div>
  );
};

// ANNUAL
const AnnualView = ({ data }: { data: any }) => {
  const s   = data.summary      || {};
  const yoy = data.yearOverYear  || {};
  const l   = data.loans         || {};
  const monthly: any[]   = data.monthlyBreakdown   || [];
  const quarterly: any[] = data.quarterlyBreakdown  || [];
  const repays: any[]    = data.loanRepayments      || [];
  const custGrowth: any[] = data.customerGrowth     || [];
  const commissions: any[] = data.commissionsByMonth || [];
  const maxMo = Math.max(...monthly.map((m: any) => Number(m.deposits || 0)), 1);
  const maxCG = Math.max(...custGrowth.map((c: any) => Number(c.new_customers || 0)), 1);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard label="Total Deposits"    value={fmtCedi(s.total_deposits)}    sub={`${fmtN(s.deposit_count)} txns`}    icon={ArrowUpRight}  accent="green"  trend={yoy.deposit_change_pct} />
        <KPICard label="Total Withdrawals" value={fmtCedi(s.total_withdrawals)} sub={`${fmtN(s.withdrawal_count)} txns`} icon={ArrowDownRight} accent="red"    />
        <KPICard label="Net Cash Flow"     value={fmtCedi(s.net_cash_flow)}     sub="Year net"                           icon={TrendingUp}     accent={Number(s.net_cash_flow) >= 0 ? 'green' : 'red'} />
        <KPICard label="Avg Deposit"       value={fmtCedi(s.avg_deposit)}       sub="Per transaction"                    icon={DollarSign}     accent="blue"   />
        <KPICard label="Commissions"       value={fmtCedi(s.total_commissions)} sub="Total year"                         icon={Receipt}        accent="violet" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="Total Loans"      value={fmtN(l.total_loans)}        sub="All types"              icon={Layers}      accent="blue"   />
        <KPICard label="Originated"       value={fmtCedi(l.total_originated)} sub="Total loan value"      icon={Banknote}    accent="violet" />
        <KPICard label="Disbursed"        value={fmtCedi(l.total_disbursed)} sub="Cash out"               icon={ArrowUpRight} accent="green" />
        <KPICard label="Collected"        value={fmtCedi(l.total_collected)} sub="Cash in (repayments)"   icon={ArrowDownRight} accent="emerald" />
        <KPICard label="Repayment Rate"   value={pct(l.repayment_rate_pct)}  sub="Collected vs originated" icon={Target}     accent={Number(l.repayment_rate_pct) > 80 ? 'green' : 'amber'} />
        <KPICard label="Defaults"         value={fmtN(l.defaulted_loans)}    sub={`${fmtN(l.overdue_loans)} overdue`} icon={AlertTriangle} accent="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Monthly Deposits" icon={BarChart3}>
          {monthly.length > 0 ? (
            <div className="space-y-2">
              {monthly.map((m: any, i: number) => (
                <HBar key={i} label={m.month} value={m.deposits} max={maxMo} secondary={`${fmtN(m.tx_count)} txns`} />
              ))}
            </div>
          ) : <Empty />}
        </Section>

        <Section title="Customer Growth by Month" icon={Users}>
          {custGrowth.length > 0 ? (
            <div className="space-y-2">
              {custGrowth.map((c: any, i: number) => (
                <HBar key={i} label={c.month} value={c.new_customers} max={maxCG} secondary="new clients" />
              ))}
            </div>
          ) : <Empty />}
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Quarterly Breakdown" icon={PieChart}>
          {quarterly.length > 0 ? (
            <DataTable
              heads={['Quarter', 'Deposits', 'Withdrawals', 'Net']}
              rows={quarterly.map((q: any) => [
                q.quarter,
                fmtCedi(q.deposits),
                fmtCedi(q.withdrawals),
                fmtCedi(Number(q.deposits) - Number(q.withdrawals)),
              ])}
            />
          ) : <Empty />}
        </Section>

        <Section title="Repayments & Commissions" icon={Receipt}>
          <DataTable
            heads={['Month', 'Repayments', 'Commissions']}
            rows={repays.map((r: any, i: number) => {
              const comm = commissions[i];
              return [r.month, fmtCedi(r.total), comm ? fmtCedi(comm.total) : '—'];
            })}
          />
        </Section>
      </div>

      {/* YoY comparison */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Year-over-Year Comparison</h3>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Prev Deposits</p>
            <p className="text-lg font-bold text-gray-800 mt-1">{fmtCedi(yoy.prev_deposits)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Prev Withdrawals</p>
            <p className="text-lg font-bold text-gray-800 mt-1">{fmtCedi(yoy.prev_withdrawals)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Deposit YoY Change</p>
            <p className={`text-lg font-bold mt-1 ${Number(yoy.deposit_change_pct) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {yoy.deposit_change_pct != null ? `${sign(yoy.deposit_change_pct)}${pct(yoy.deposit_change_pct)}` : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// LOAN PORTFOLIO
const LoanPortfolioView = ({ data }: { data: any }) => {
  const snap = data.snapshot   || {};
  const byType: any[] = data.byType      || [];
  const ageing: any[] = data.parAgeing   || [];
  const newLoans: any[] = data.newInPeriod  || [];
  const repays: any[]  = data.repayments    || [];
  const topBorr: any[] = data.topBorrowers  || [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="Total Loans"     value={fmtN(snap.total_loans)}       sub="In portfolio"             icon={Layers}      accent="blue"   />
        <KPICard label="Disbursed"       value={fmtCedi(snap.total_disbursed)} sub="Cash out"                icon={Banknote}    accent="green"  />
        <KPICard label="Outstanding"     value={fmtCedi(snap.total_outstanding)} sub="Total owed"            icon={DollarSign}  accent="amber"  />
        <KPICard label="Collected"       value={fmtCedi(snap.total_collected)} sub="Total repaid"            icon={Receipt}     accent="violet" />
        <KPICard label="Repayment Rate"  value={pct(snap.repayment_rate_pct)} sub="Collected vs disbursed"  icon={Target}      accent={Number(snap.repayment_rate_pct) > 80 ? 'green' : 'red'} />
        <KPICard label="PAR Rate"        value={pct(snap.par_rate_pct)}       sub="Portfolio at risk"        icon={AlertTriangle} accent={Number(snap.par_rate_pct) > 10 ? 'red' : 'green'} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="Active"    value={fmtN(snap.active_count)}    sub="Running loans"  icon={Activity}     accent="green"  />
        <KPICard label="Pending"   value={fmtN(snap.pending_count)}   sub="Applications"   icon={Clock}        accent="amber"  />
        <KPICard label="Overdue"   value={fmtN(snap.overdue_count)}   sub="Late payments"  icon={AlertCircle}  accent="red"    />
        <KPICard label="Completed" value={fmtN(snap.completed_count)} sub="Fully repaid"   icon={CheckCircle}  accent="blue"   />
        <KPICard label="Defaulted" value={fmtN(snap.defaulted_count)} sub="Written off"    icon={XCircle}      accent="red"    />
        <KPICard label="Avg Amount" value={fmtCedi(snap.avg_loan_amount)} sub={`Avg ${Number(snap.avg_loan_term || 0).toFixed(0)} term`} icon={Banknote} accent="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Portfolio at Risk — Ageing Buckets" icon={AlertTriangle}>
          {ageing.length > 0 ? (
            <DataTable
              heads={['Bucket', 'Loans', 'Outstanding']}
              rows={ageing.map((b: any) => [b.bucket, fmtN(b.loan_count), fmtCedi(b.outstanding)])}
            />
          ) : <Empty />}
        </Section>

        <Section title="Loan Type Breakdown" icon={PieChart}>
          {byType.length > 0 ? (
            <DataTable
              heads={['Type', 'Count', 'Amount', 'Outstanding', 'Collected']}
              rows={byType.map((t: any) => [t.loantype, fmtN(t.count), fmtCedi(t.total_amount), fmtCedi(t.outstanding), fmtCedi(t.collected)])}
            />
          ) : <Empty />}
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Top Borrowers by Outstanding Balance" icon={Users}>
          {topBorr.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              <DataTable
                heads={['Borrower', 'Type', 'Disbursed', 'Outstanding', 'Status']}
                rows={topBorr.map((b: any) => [
                  b.customer_name || b.group_name || '—',
                  b.loantype,
                  fmtCedi(b.disbursedamount),
                  fmtCedi(b.outstandingbalance),
                  <StatusPill status={b.status} />,
                ])}
              />
            </div>
          ) : <Empty />}
        </Section>

        <Section title="Recent Repayments in Period" icon={Receipt}>
          {repays.length > 0 ? (
            <div className="max-h-80 overflow-y-auto space-y-1">
              {repays.slice(0, 20).map((r: any, i: number) => (
                <div key={r.id || i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-xs font-medium text-gray-800">{r.customer_name || '—'}</div>
                    <div className="text-[10px] text-gray-400">{r.loantype} · {new Date(r.payment_date).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-emerald-600">{fmtCedi(r.amount)}</div>
                    <div className="text-[10px] text-gray-400">Bal: {fmtCedi(r.balance_after)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty />}
        </Section>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <KPICard label="Projected Interest" value={fmtCedi(snap.projected_interest)} sub="Expected interest income" icon={TrendingUp} accent="violet" />
        <KPICard label="Realised Interest"  value={fmtCedi(snap.realised_interest)}  sub="Actual interest collected" icon={DollarSign} accent="green" />
      </div>
    </div>
  );
};

// CASH FLOW
const CashFlowView = ({ data }: { data: any }) => {
  const op = data.operating        || {};
  const fi = data.financing        || {};
  const bs = data.balanceSnapshot  || {};
  const daily: any[] = data.dailyCashFlow || [];
  const maxDaily = Math.max(...daily.map((d: any) => Math.max(Number(d.inflow || 0), Number(d.outflow || 0))), 1);

  return (
    <div className="space-y-5">
      {/* Statement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Operating */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100">
            <h3 className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">Operating Activities</h3>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: 'Deposit Inflows',      value: fmtCedi(op.cash_inflow_deposits),     color: 'text-emerald-600' },
              { label: 'Fees Collected',        value: fmtCedi(op.fees_collected),           color: 'text-emerald-600' },
              { label: 'Withdrawal Outflows',   value: `-${fmtCedi(op.cash_outflow_withdrawals)}`, color: 'text-red-500' },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-600">{row.label}</span>
                <span className={`text-xs font-semibold ${row.color}`}>{row.value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-emerald-200">
              <span className="text-xs font-bold text-gray-800">Net Operating</span>
              <span className={`text-sm font-bold ${Number(op.net_operating) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtCedi(op.net_operating)}</span>
            </div>
          </div>
        </div>

        {/* Financing */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-blue-50 px-5 py-3 border-b border-blue-100">
            <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-widest">Financing Activities</h3>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: 'Loan Repayments (In)',   value: fmtCedi(fi.cash_in_repayments),      color: 'text-emerald-600' },
              { label: 'Commission Income',       value: fmtCedi(fi.commission_income),        color: 'text-emerald-600' },
              { label: 'Loan Disbursements (Out)', value: `-${fmtCedi(fi.cash_out_disbursements)}`, color: 'text-red-500' },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-600">{row.label}</span>
                <span className={`text-xs font-semibold ${row.color}`}>{row.value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-blue-200">
              <span className="text-xs font-bold text-gray-800">Net Financing</span>
              <span className={`text-sm font-bold ${Number(fi.net_financing) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtCedi(fi.net_financing)}</span>
            </div>
          </div>
        </div>

        {/* Net + Snapshot */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Net Position</p>
            <p className={`text-3xl font-black ${Number(data.netPosition) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtCedi(data.netPosition)}</p>
            <p className="text-xs text-gray-400 mt-1">Operating + Financing</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Balance Snapshot</p>
            <div className="flex justify-between"><span className="text-xs text-gray-600">Total Savings</span><span className="text-xs font-semibold text-gray-800">{fmtCedi(bs.total_savings_balance)}</span></div>
            <div className="flex justify-between"><span className="text-xs text-gray-600">Loans Outstanding</span><span className="text-xs font-semibold text-amber-600">{fmtCedi(bs.total_loan_outstanding)}</span></div>
          </div>
        </div>
      </div>

      {/* Daily flow chart */}
      <Section title="Daily Cash Flow" icon={Activity}>
        {daily.length > 0 ? (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {daily.map((d: any, i: number) => (
              <div key={i} className="space-y-1">
                <div className="text-[10px] font-medium text-gray-500">{new Date(d.day).toLocaleDateString('en-GH', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-50 rounded-full h-4 overflow-hidden">
                    <div className="bg-emerald-400 h-4 rounded-full" style={{ width: `${Math.max((d.inflow / maxDaily) * 100, 2)}%` }} />
                  </div>
                  <span className="text-[10px] text-emerald-600 w-24 text-right font-medium">{fmtCedi(d.inflow)}</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-50 rounded-full h-4 overflow-hidden">
                    <div className="bg-red-400 h-4 rounded-full" style={{ width: `${Math.max((d.outflow / maxDaily) * 100, 2)}%` }} />
                  </div>
                  <span className="text-[10px] text-red-500 w-24 text-right font-medium">{fmtCedi(d.outflow)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : <Empty />}
      </Section>
    </div>
  );
};

// ─── Export helpers ───────────────────────────────────────────────────────────

const flattenSummary = (data: any): [string, any][] => {
  const s = data?.summary || {};
  return Object.entries(s).map(([k, v]) => [k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), v]);
};

const exportPDF = async (reportType: ReportType, period: string, data: any) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const label = REPORT_TYPES.find(r => r.id === reportType)?.label || reportType;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pw, 38, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16); doc.setFont('helvetica', 'bold');
  doc.text(`${label} Report`, pw / 2, 16, { align: 'center' });
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${period}  ·  Generated: ${new Date().toLocaleString()}`, pw / 2, 28, { align: 'center' });

  let y = 48;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, y); y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: flattenSummary(data),
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
  });
  // @ts-ignore
  y = doc.lastAutoTable.finalY + 10;

  // Additional sections
  const sections: { title: string; rows: any[][] }[] = [];
  if (data.monthlyBreakdown) sections.push({ title: 'Monthly Breakdown', rows: data.monthlyBreakdown.map((r: any) => Object.values(r)) });
  if (data.dailyBreakdown)   sections.push({ title: 'Daily Breakdown',   rows: data.dailyBreakdown.map((r: any)   => Object.values(r)) });
  if (data.overdueLoans)     sections.push({ title: 'Overdue Loans',     rows: data.overdueLoans.map((r: any)     => [r.customer_name || r.group_name, r.loantype, r.days_overdue, r.outstandingbalance]) });
  if (data.topDepositors)    sections.push({ title: 'Top Depositors',    rows: data.topDepositors.map((r: any)    => [r.name, r.phone_number, r.deposit_count, r.total_deposited]) });
  if (data.parAgeing)        sections.push({ title: 'PAR Ageing',        rows: data.parAgeing.map((r: any)        => [r.bucket, r.loan_count, r.outstanding]) });

  for (const sec of sections) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text(sec.title, 14, y); y += 4;
    autoTable(doc, {
      startY: y,
      body: sec.rows,
      theme: 'striped',
      bodyStyles: { fontSize: 8 },
    });
    // @ts-ignore
    y = doc.lastAutoTable.finalY + 10;
  }

  doc.save(`accountant-${reportType}-${Date.now()}.pdf`);
};

const exportXLSX = async (reportType: ReportType, data: any) => {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const summarySheet = XLSX.utils.aoa_to_sheet([
    [`${REPORT_TYPES.find(r => r.id === reportType)?.label} Report`],
    [`Generated: ${new Date().toLocaleString()}`], [],
    ['Metric', 'Value'], ...flattenSummary(data)
  ]);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  const tables: Record<string, any[]> = {
    monthlyBreakdown: data.monthlyBreakdown, dailyBreakdown: data.dailyBreakdown,
    weeklyBreakdown: data.weeklyBreakdown, overdueLoans: data.overdueLoans,
    topDepositors: data.topDepositors, parAgeing: data.parAgeing,
    byType: data.byType, topBorrowers: data.topBorrowers,
    transactions: data.transactions, dailyCashFlow: data.dailyCashFlow,
  };

  for (const [name, rows] of Object.entries(tables)) {
    if (!rows?.length) continue;
    const headers = Object.keys(rows[0]).map(h => h.replace(/_/g, ' ').toUpperCase());
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows.map(r => Object.values(r))]);
    XLSX.utils.book_append_sheet(wb, sheet, name.slice(0, 31));
  }

  XLSX.writeFile(wb, `accountant-${reportType}-${Date.now()}.xlsx`);
};

const exportCSV = (reportType: ReportType, data: any) => {
  let csv = `Report,${reportType}\nGenerated,${new Date().toLocaleString()}\n\nMetric,Value\n`;
  flattenSummary(data).forEach(([k, v]) => { csv += `"${k}","${v}"\n`; });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `accountant-${reportType}-${Date.now()}.csv`;
  document.body.appendChild(a); a.click();
  URL.revokeObjectURL(url); document.body.removeChild(a);
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const AccountantReports: React.FC = () => {
  const [reportType, setReportType]   = useState<ReportType>('monthly');
  const [period, setPeriod]           = useState('this_month');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [loanType, setLoanType]       = useState('all');
  const [loanStatus, setLoanStatus]   = useState('all');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [loading, setLoading]         = useState(false);
  const [exporting, setExporting]     = useState(false);
  const [data, setData]               = useState<any>(null);
  const [meta, setMeta]               = useState<{ period?: string; dateRange?: any } | null>(null);
  const [status, setStatus]           = useState<ExportStatus>({ type: null, message: '' });
  const previewRef = useRef<HTMLDivElement>(null);

  const showStatus = (type: ExportStatus['type'], message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: null, message: '' }), 6000);
  };

  // Sync default period when report type changes
  useEffect(() => {
    const opts = PERIOD_OPTIONS[reportType];
    if (opts.length) setPeriod(opts[0].value);
    setData(null);
  }, [reportType]);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({ type: reportType });
    if (reportType === 'daily') {
      // use today; optionally pass ?date=
    } else {
      params.set('period', period === '' ? 'this_month' : period);
      if (period === 'custom') {
        if (startDate) params.set('startDate', startDate);
        if (endDate)   params.set('endDate', endDate);
      }
    }
    if (reportType === 'loan_portfolio') {
      params.set('loanType', loanType);
      params.set('status', loanStatus);
    }
    return `${BASE_URL}/api/reports/accountant/${companyId}?${params}`;
  }, [reportType, period, startDate, endDate, loanType, loanStatus]);

  const generate = useCallback(async () => {
    setLoading(true);
    setStatus({ type: null, message: '' });
    try {
      const res = await fetch(buildUrl());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data);
      setMeta({ period: json.period, dateRange: json.dateRange });
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
      showStatus('success', `${REPORT_TYPES.find(r => r.id === reportType)?.label} report generated successfully.`);
    } catch (err: any) {
      showStatus('error', `Failed to generate report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [buildUrl, reportType]);

  const doExport = async () => {
    if (!data) { showStatus('error', 'Generate the report first before exporting.'); return; }
    setExporting(true);
    try {
      const periodLabel = meta?.period || period || 'custom';
      if (exportFormat === 'pdf')  await exportPDF(reportType, periodLabel, data);
      else if (exportFormat === 'xlsx') await exportXLSX(reportType, data);
      else exportCSV(reportType, data);
      showStatus('success', `Report exported as ${exportFormat.toUpperCase()}.`);
    } catch (err: any) {
      showStatus('error', `Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const periodOpts   = PERIOD_OPTIONS[reportType];
  const isCustom     = period === 'custom';
  const isPortfolio  = reportType === 'loan_portfolio';
  const currentType  = REPORT_TYPES.find(r => r.id === reportType)!;

  return (
    <div className="min-h-screen bg-gray-50/60 font-sans">

      {/* ── Page Header ─────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-900 rounded-xl">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">Accountant Reports</h1>
              <p className="text-xs text-gray-400 mt-0.5">Generate, preview & export financial reports</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
              {loading ? 'Generating…' : 'Generate'}
            </button>
            <button
              onClick={doExport}
              disabled={exporting || !data}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 transition-all shadow-sm"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {exporting ? 'Exporting…' : 'Export'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Status Banner ─────────────────────────── */}
        {status.type && (
          <div className={`flex items-center gap-3 p-4 rounded-2xl border text-sm font-medium ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
            {status.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
            {status.message}
          </div>
        )}

        {/* ── Report Type Cards ─────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {REPORT_TYPES.map(rt => {
            const active = reportType === rt.id;
            return (
              <button
                key={rt.id}
                onClick={() => setReportType(rt.id)}
                className={`rounded-2xl border p-3 text-left transition-all hover:shadow-sm ${active ? 'bg-gray-900 border-gray-900 shadow-md' : 'bg-white border-gray-100 hover:border-gray-200'}`}
              >
                <rt.icon className={`h-4 w-4 mb-2 ${active ? 'text-white' : 'text-gray-400'}`} />
                <div className={`text-xs font-semibold leading-tight ${active ? 'text-white' : 'text-gray-700'}`}>{rt.label}</div>
                <div className={`text-[9px] mt-0.5 leading-tight ${active ? 'text-gray-300' : 'text-gray-400'}`}>{rt.desc}</div>
              </button>
            );
          })}
        </div>

        {/* ── Configuration ─────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Report Configuration</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">

            {/* Period */}
            {periodOpts.length > 1 && (
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Period</label>
                <select
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white"
                >
                  {periodOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}

            {/* Custom dates */}
            {isCustom && (
              <>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900" />
                </div>
              </>
            )}

            {/* Loan-specific filters */}
            {isPortfolio && (
              <>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Loan Type</label>
                  <select value={loanType} onChange={e => setLoanType(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 bg-white">
                    {['all', 'individual', 'group', 'p2p'].map(v => <option key={v} value={v}>{v === 'all' ? 'All Types' : v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Loan Status</label>
                  <select value={loanStatus} onChange={e => setLoanStatus(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 bg-white">
                    {['all', 'active', 'overdue', 'completed', 'defaulted', 'pending', 'rejected'].map(v => <option key={v} value={v}>{v === 'all' ? 'All Statuses' : v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Export format */}
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Export Format</label>
              <select value={exportFormat} onChange={e => setExportFormat(e.target.value as ExportFormat)}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 bg-white">
                <option value="pdf">PDF Document</option>
                <option value="xlsx">Excel (XLSX)</option>
                <option value="csv">CSV Spreadsheet</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Preview ───────────────────────────────── */}
        {data ? (
          <div ref={previewRef} className="space-y-5">
            {/* Preview header */}
            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-xl">
                  <currentType.icon className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{currentType.label} Report — {meta?.period || period}</p>
                  {meta?.dateRange?.startDate && (
                    <p className="text-[10px] text-gray-400">
                      {new Date(meta.dateRange.startDate).toLocaleDateString()} – {new Date(meta.dateRange.endDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={generate} disabled={loading}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl transition-colors">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {reportType === 'daily'          && <DailyView data={data} />}
            {reportType === 'weekly'         && <WeeklyView data={data} />}
            {reportType === 'monthly'        && <MonthlyView data={data} />}
            {reportType === 'quarterly'      && <QuarterlyView data={data} />}
            {reportType === 'annual'         && <AnnualView data={data} />}
            {reportType === 'loan_portfolio' && <LoanPortfolioView data={data} />}
            {reportType === 'cash_flow'      && <CashFlowView data={data} />}
          </div>
        ) : (
          /* Empty state */
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <currentType.icon className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">{currentType.label} Report</h3>
            <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">{currentType.desc}. Configure your filters above and click <strong>Generate</strong>.</p>
            <button
              onClick={generate}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
              {loading ? 'Generating…' : 'Generate Report'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountantReports;
