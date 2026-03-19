import React, { useEffect, useState, useCallback } from 'react';
import {
  Download, TrendingUp, Users, PiggyBank, BarChart3, Filter,
  Loader2, CheckCircle, XCircle, Eye, PlusCircle, RefreshCw,
  ArrowUpRight, ArrowDownRight, Activity, Calendar, DollarSign,
  AlertCircle, UserX, Clock, FileText
} from 'lucide-react';
import { useStats } from '../../contexts/dashboard/DashboardStat';
import { useTransactions } from '../../contexts/dashboard/Transactions';
import { useCustomers } from '../../contexts/dashboard/Customers';
import { companyId } from '../../constants/appConstants';
import autoTable from 'jspdf-autotable';
import { useCommissionStats } from '../../contexts/dashboard/Commissions';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportData {
  summary: Record<string, any>;
  monthly?: any[];
  status?: any[];
  topCustomers?: any[];
  topContributors?: any[];
  recentDeposits?: any[];
  statusBreakdown?: any[];
  registrationTrend?: any[];
  clientActivity?: any[];
  dormantClients?: any[];
  accountBalances?: any[];
  monthlyFlow?: any[];
  commissions?: Record<string, any>;
  largeTransactions?: any[];
}

interface ExportStatus {
  type: 'success' | 'error' | null;
  message: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  {
    id: 'overview',
    name: 'Business Overview',
    description: 'Full business snapshot: contributions, clients & transactions',
    icon: BarChart3,
    color: 'indigo',
  },
  {
    id: 'contributions',
    name: 'Contributions',
    description: 'Deposit trends, top contributors & status breakdown',
    icon: PiggyBank,
    color: 'emerald',
  },
  {
    id: 'clients',
    name: 'Client Analysis',
    description: 'Registration trends, activity levels & dormant clients',
    icon: Users,
    color: 'blue',
  },
  {
    id: 'financial',
    name: 'Financial Summary',
    description: 'Net flow, account balances & large transactions',
    icon: TrendingUp,
    color: 'violet',
  },
];

const DATE_RANGES = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
  { value: 'all', label: 'All Time' },
];

const colorMap: Record<string, string> = {
  indigo: 'bg-indigo-100 text-indigo-600 border-indigo-500',
  emerald: 'bg-emerald-100 text-emerald-600 border-emerald-500',
  blue: 'bg-blue-100 text-blue-600 border-blue-500',
  violet: 'bg-violet-100 text-violet-600 border-violet-500',
};

const statusColorMap: Record<string, string> = {
  completed: 'bg-emerald-500',
  approved: 'bg-green-500',
  pending: 'bg-yellow-500',
  rejected: 'bg-red-500',
  reversed: 'bg-rose-500',
};

const statusBadgeMap: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  reversed: 'bg-rose-100 text-rose-700',
};

const fmt = (n: any) => Number(n || 0).toLocaleString();
const fmtCedi = (n: any) => `¢${fmt(n)}`;

// ─── Sub-components ───────────────────────────────────────────────────────────

const MetricCard = ({
  label, value, detail, icon: Icon, bg, textColor, prefix = '¢'
}: any) => (
  <div className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{prefix}{fmt(value)}</p>
        {detail && <p className={`text-xs ${textColor} mt-1 font-medium`}>{detail}</p>}
      </div>
      <div className={`${bg} p-3 rounded-xl flex-shrink-0 ml-3`}>
        <Icon className={`h-6 w-6 ${textColor}`} />
      </div>
    </div>
  </div>
);

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">{children}</h3>
);

const BarRow = ({ label, value, max, color = 'from-indigo-500 to-indigo-400' }: any) => {
  const pct = max > 0 ? Math.max((value / max) * 100, 3) : 3;
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-xs font-medium text-gray-600 truncate shrink-0">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
        <div
          className={`bg-gradient-to-r ${color} h-5 rounded-full flex items-center justify-end pr-2 transition-all duration-700`}
          style={{ width: `${pct}%` }}
        >
          {pct > 25 && <span className="text-white text-xs font-medium">{fmtCedi(value)}</span>}
        </div>
      </div>
      <div className="w-24 text-xs font-semibold text-gray-800 text-right shrink-0">{fmtCedi(value)}</div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadgeMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-600'}`}>
    {status}
  </span>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-8 text-gray-400 text-sm">{message}</div>
);

// ─── Preview Sections ─────────────────────────────────────────────────────────

const OverviewPreview = ({ data }: { data: ReportData }) => {
  const { summary, monthly = [], status = [], topCustomers = [] } = data;
  const totalTx = status.reduce((s, i) => s + Number(i.count), 0);
  const maxMonthly = Math.max(...monthly.map(m => Number(m.contributions || 0)), 1);

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard label="Total Clients" value={summary.total_clients} detail={`${fmt(summary.active_clients)} active`} icon={Users} bg="bg-indigo-100" textColor="text-indigo-600" prefix="" />
        <MetricCard label="Active Clients" value={summary.active_clients} detail="Currently active" icon={Activity} bg="bg-green-100" textColor="text-green-600" prefix="" />
        <MetricCard label="Contributions" value={summary.total_contributions} detail="Total deposits" icon={PiggyBank} bg="bg-emerald-100" textColor="text-emerald-600" />
        <MetricCard label="Withdrawals" value={summary.total_withdrawals} detail="Approved + completed" icon={ArrowDownRight} bg="bg-orange-100" textColor="text-orange-600" />
        <MetricCard label="Transactions" value={summary.total_transactions} detail="In selected period" icon={BarChart3} bg="bg-violet-100" textColor="text-violet-600" prefix="" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <SectionHeader><TrendingUp className="h-4 w-4 text-indigo-500" />Monthly Contributions</SectionHeader>
          {monthly.length > 0 ? (
            <div className="space-y-3">
              {monthly.map((d: any, i: number) => (
                <BarRow key={i} label={d.month} value={d.contributions} max={maxMonthly} />
              ))}
            </div>
          ) : <EmptyState message="No contribution data available" />}
        </div>

        {/* Status breakdown */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <SectionHeader><BarChart3 className="h-4 w-4 text-indigo-500" />Transaction Status</SectionHeader>
          {status.length > 0 ? (
            <div className="space-y-3">
              {status.map((item: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium capitalize text-gray-700">{item.status}</span>
                    <span className="text-gray-500">{fmt(item.count)} ({totalTx > 0 ? Math.round((item.count / totalTx) * 100) : 0}%)</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-3">
                    <div
                      className={`${statusColorMap[item.status?.toLowerCase()] || 'bg-gray-400'} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${totalTx > 0 ? (item.count / totalTx) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState message="No transaction status data" />}
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <SectionHeader><Users className="h-4 w-4 text-indigo-500" />Top Clients by Balance</SectionHeader>
        {topCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">#</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">Client</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">Contact</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-gray-500">Balance</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c: any, i: number) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-2 px-2 text-gray-400 font-bold text-xs">#{i + 1}</td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                          {(c.name || 'N/A').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800 truncate">{c.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-gray-500 text-xs">{c.phone_number || c.email || '—'}</td>
                    <td className="py-2 px-2 text-right font-semibold text-indigo-600">{fmtCedi(c.total_balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState message="No client data available" />}
      </div>
    </div>
  );
};

const ContributionsPreview = ({ data }: { data: ReportData }) => {
  const { summary, monthly = [], topContributors = [], statusBreakdown = [], recentDeposits = [] } = data;
  const maxMonthly = Math.max(...monthly.map((m: any) => Number(m.amount || 0)), 1);
  const totalStatusCount = statusBreakdown.reduce((s: number, i: any) => s + Number(i.count), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard label="Total Deposits" value={summary.total_deposits} detail="Transactions" icon={PiggyBank} bg="bg-emerald-100" textColor="text-emerald-600" prefix="" />
        <MetricCard label="Total Amount" value={summary.total_amount} detail="Gross contributions" icon={DollarSign} bg="bg-green-100" textColor="text-green-600" />
        <MetricCard label="Average Deposit" value={Number(summary.average_amount || 0).toFixed(2)} detail="Per transaction" icon={Activity} bg="bg-blue-100" textColor="text-blue-600" />
        <MetricCard label="Highest Deposit" value={summary.highest_deposit} detail="Single transaction" icon={ArrowUpRight} bg="bg-violet-100" textColor="text-violet-600" />
        <MetricCard label="Lowest Deposit" value={summary.lowest_deposit} detail="Single transaction" icon={ArrowDownRight} bg="bg-orange-100" textColor="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <SectionHeader><TrendingUp className="h-4 w-4 text-emerald-500" />Monthly Deposit Trend</SectionHeader>
          {monthly.length > 0 ? (
            <div className="space-y-3">
              {monthly.map((d: any, i: number) => (
                <BarRow key={i} label={d.month} value={d.amount} max={maxMonthly} color="from-emerald-500 to-teal-400" />
              ))}
            </div>
          ) : <EmptyState message="No monthly data in selected range" />}
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5">
          <SectionHeader><BarChart3 className="h-4 w-4 text-emerald-500" />Status Breakdown</SectionHeader>
          {statusBreakdown.length > 0 ? (
            <div className="space-y-4">
              {statusBreakdown.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <StatusBadge status={item.status} />
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                      <div
                        className={`${statusColorMap[item.status?.toLowerCase()] || 'bg-gray-400'} h-2.5 rounded-full`}
                        style={{ width: `${totalStatusCount > 0 ? (item.count / totalStatusCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <div className="text-sm font-semibold text-gray-800">{fmt(item.count)}</div>
                    <div className="text-xs text-gray-400">{fmtCedi(item.amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState message="No status data available" />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top contributors */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <SectionHeader><Users className="h-4 w-4 text-emerald-500" />Top Contributors</SectionHeader>
          {topContributors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">#</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">Client</th>
                    <th className="text-center py-2 px-2 text-xs font-semibold text-gray-500">Deposits</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topContributors.map((c: any, i: number) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 px-2 text-gray-400 text-xs font-bold">#{i + 1}</td>
                      <td className="py-2 px-2">
                        <div className="font-medium text-gray-800">{c.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-400">{c.phone_number}</div>
                      </td>
                      <td className="py-2 px-2 text-center text-gray-600">{fmt(c.deposit_count)}</td>
                      <td className="py-2 px-2 text-right font-semibold text-emerald-600">{fmtCedi(c.total_contributed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState message="No contributor data available" />}
        </div>

        {/* Recent deposits */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <SectionHeader><Clock className="h-4 w-4 text-emerald-500" />Recent Deposits</SectionHeader>
          {recentDeposits.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {recentDeposits.slice(0, 15).map((t: any, i: number) => (
                <div key={t.id || i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                      <PiggyBank className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-800">{t.customer_name || 'Unknown'}</div>
                      <div className="text-xs text-gray-400">{new Date(t.transaction_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{fmtCedi(t.amount)}</div>
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState message="No recent deposits" />}
        </div>
      </div>
    </div>
  );
};

const ClientsPreview = ({ data }: { data: ReportData }) => {
  const { summary, registrationTrend = [], clientActivity = [], dormantClients = [] } = data;
  const maxReg = Math.max(...registrationTrend.map((m: any) => Number(m.new_clients || 0)), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Clients" value={summary.total_clients} detail="All time" icon={Users} bg="bg-blue-100" textColor="text-blue-600" prefix="" />
        <MetricCard label="Active Clients" value={summary.active_clients} detail="Currently active" icon={Activity} bg="bg-green-100" textColor="text-green-600" prefix="" />
        <MetricCard label="Inactive Clients" value={summary.inactive_clients} detail="Need reactivation" icon={UserX} bg="bg-orange-100" textColor="text-orange-600" prefix="" />
        <MetricCard label="New This Month" value={summary.new_this_month} detail="Recent joins" icon={ArrowUpRight} bg="bg-violet-100" textColor="text-violet-600" prefix="" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration trend */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <SectionHeader><TrendingUp className="h-4 w-4 text-blue-500" />Registration Trend (12 months)</SectionHeader>
          {registrationTrend.length > 0 ? (
            <div className="space-y-3">
              {registrationTrend.map((d: any, i: number) => (
                <BarRow key={i} label={d.month} value={d.new_clients} max={maxReg} color="from-blue-500 to-cyan-400" />
              ))}
            </div>
          ) : <EmptyState message="No registration data available" />}
        </div>

        {/* Dormant clients */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <SectionHeader><AlertCircle className="h-4 w-4 text-orange-500" />Dormant Clients (30+ days inactive)</SectionHeader>
          {dormantClients.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dormantClients.map((c: any, i: number) => (
                <div key={c.id || i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xs">
                      {(c.name || 'N/A').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-800">{c.name}</div>
                      <div className="text-xs text-gray-400">{c.phone_number}</div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {c.last_transaction ? `Last: ${new Date(c.last_transaction).toLocaleDateString()}` : 'No transactions'}
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState message="No dormant clients found 🎉" />}
        </div>
      </div>

      {/* Client activity table */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <SectionHeader><Activity className="h-4 w-4 text-blue-500" />Client Activity (Top 20)</SectionHeader>
        {clientActivity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Client</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Transactions</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Deposits</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Withdrawals</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Balance</th>
                </tr>
              </thead>
              <tbody>
                {clientActivity.map((c: any, i: number) => (
                  <tr key={c.id || i} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 px-3">
                      <div className="font-medium text-gray-800">{c.name}</div>
                      <div className="text-xs text-gray-400">{c.phone_number}</div>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-gray-700">{fmt(c.transaction_count)}</td>
                    <td className="py-2 px-3 text-right text-emerald-600 font-medium">{fmtCedi(c.total_deposits)}</td>
                    <td className="py-2 px-3 text-right text-orange-600 font-medium">{fmtCedi(c.total_withdrawals)}</td>
                    <td className="py-2 px-3 text-right text-indigo-600 font-semibold">{fmtCedi(c.current_balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState message="No client activity data" />}
      </div>
    </div>
  );
};

const FinancialPreview = ({ data }: { data: ReportData }) => {
  const { summary, accountBalances = [], monthlyFlow = [], commissions, largeTransactions = [] } = data;
  const maxFlow = Math.max(...monthlyFlow.map((m: any) => Math.max(Number(m.deposits || 0), Number(m.withdrawals || 0))), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Contributions" value={summary.total_contributions} detail="Gross deposits" icon={ArrowUpRight} bg="bg-emerald-100" textColor="text-emerald-600" />
        <MetricCard label="Total Withdrawals" value={summary.total_withdrawals} detail="Approved + completed" icon={ArrowDownRight} bg="bg-red-100" textColor="text-red-600" />
        <MetricCard
          label="Net Flow"
          value={Math.abs(summary.net_flow)}
          detail={Number(summary.net_flow) >= 0 ? '↑ Positive' : '↓ Negative'}
          icon={TrendingUp}
          bg={Number(summary.net_flow) >= 0 ? 'bg-green-100' : 'bg-red-100'}
          textColor={Number(summary.net_flow) >= 0 ? 'text-green-600' : 'text-red-600'}
        />
        <MetricCard label="Total Commissions" value={commissions?.total_commissions} detail={`${fmt(commissions?.commission_count)} records`} icon={PlusCircle} bg="bg-violet-100" textColor="text-violet-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly flow */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <SectionHeader><TrendingUp className="h-4 w-4 text-violet-500" />Monthly Cash Flow (12 months)</SectionHeader>
          {monthlyFlow.length > 0 ? (
            <div className="space-y-4">
              {monthlyFlow.map((d: any, i: number) => (
                <div key={i} className="space-y-1">
                  <div className="text-xs font-medium text-gray-600 mb-1">{d.month}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-600 w-16 shrink-0">In</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-3 rounded-full" style={{ width: `${Math.max((d.deposits / maxFlow) * 100, 3)}%` }} />
                    </div>
                    <span className="text-xs font-medium text-emerald-600 w-20 text-right">{fmtCedi(d.deposits)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-500 w-16 shrink-0">Out</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3">
                      <div className="bg-gradient-to-r from-red-400 to-rose-500 h-3 rounded-full" style={{ width: `${Math.max((d.withdrawals / maxFlow) * 100, 3)}%` }} />
                    </div>
                    <span className="text-xs font-medium text-red-500 w-20 text-right">{fmtCedi(d.withdrawals)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState message="No flow data available" />}
        </div>

        {/* Account balances */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <SectionHeader><DollarSign className="h-4 w-4 text-violet-500" />Balance by Account Type</SectionHeader>
          {accountBalances.length > 0 ? (
            <div className="space-y-3">
              {accountBalances.map((a: any, i: number) => {
                const maxBal = Math.max(...accountBalances.map((x: any) => Number(x.total_balance || 0)), 1);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700 capitalize">{a.account_type}</span>
                      <span className="font-semibold text-violet-600">{fmtCedi(a.total_balance)} <span className="text-gray-400">({fmt(a.account_count)} accts)</span></span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-3">
                      <div className="bg-gradient-to-r from-violet-500 to-purple-400 h-3 rounded-full" style={{ width: `${(a.total_balance / maxBal) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState message="No account balance data" />}
        </div>
      </div>

      {/* Large transactions */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <SectionHeader><FileText className="h-4 w-4 text-violet-500" />Top Transactions by Amount</SectionHeader>
        {largeTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Date</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Client</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Type</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {largeTransactions.map((t: any, i: number) => (
                  <tr key={t.id || i} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-500 text-xs">{new Date(t.transaction_date).toLocaleDateString()}</td>
                    <td className="py-2 px-3 font-medium text-gray-800">{t.customer_name || '—'}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${t.type === 'deposit' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="py-2 px-3"><StatusBadge status={t.status} /></td>
                    <td className="py-2 px-3 text-right font-semibold text-gray-900">{fmtCedi(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState message="No transaction data" />}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [exportStatus, setExportStatus] = useState<ExportStatus>({ type: null, message: '' });

  const { stats } = useStats();
  const { transactions } = useTransactions();
  const { commissionStats, commissions } = useCommissionStats();

  const setStatus = (type: ExportStatus['type'], message: string, duration = 6000) => {
    setExportStatus({ type, message });
    setTimeout(() => setExportStatus({ type: null, message: '' }), duration);
  };

  // Fetch report data from backend
  const fetchReport = useCallback(async () => {
    setIsGenerating(true);
    setExportStatus({ type: null, message: '' });
    try {
      const params = new URLSearchParams({ reportType: selectedReport, dateRange });
      if (dateRange === 'custom') {
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
      }

      const res = await fetch(
        `https://susu-pro-backend.onrender.com/api/reports/dashboard/${companyId}?${params}`
      );
      if (!res.ok) throw new Error('Request failed');
      const json = await res.json();
      setReportData(json.data);
      setShowPreview(true);
      setTimeout(() => {
        document.getElementById('report-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      setStatus('success', 'Report generated! Review below, then export when ready.');
    } catch (err) {
      setStatus('error', 'Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedReport, dateRange, startDate, endDate]);

  // PDF export
  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const reportLabel = REPORT_TYPES.find(r => r.id === selectedReport)?.name || 'Report';
    const rangeLabel = DATE_RANGES.find(r => r.value === dateRange)?.label || dateRange;

    // Header
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pw, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(reportLabel, pw / 2, 18, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Date Range: ${rangeLabel}  |  Generated: ${new Date().toLocaleString()}`, pw / 2, 30, { align: 'center' });

    let y = 50;

    if (!reportData) throw new Error('No data');

    const { summary } = reportData;

    // Summary table
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.text('Summary Metrics', 14, y);
    y += 4;

    const summaryRows: any[] = [];
    if (selectedReport === 'overview' || selectedReport === 'financial') {
      summaryRows.push(
        ['Total Contributions', fmtCedi(summary.total_contributions)],
        ['Total Withdrawals', fmtCedi(summary.total_withdrawals)],
        ['Net Flow', fmtCedi(summary.net_flow ?? (Number(summary.total_contributions) - Number(summary.total_withdrawals)))],
        ['Total Clients', fmt(summary.total_clients)],
        ['Active Clients', fmt(summary.active_clients)],
      );
    }
    if (selectedReport === 'contributions') {
      summaryRows.push(
        ['Total Deposits', fmt(summary.total_deposits)],
        ['Total Amount', fmtCedi(summary.total_amount)],
        ['Average Deposit', fmtCedi(Number(summary.average_amount || 0).toFixed(2))],
        ['Highest Deposit', fmtCedi(summary.highest_deposit)],
      );
    }
    if (selectedReport === 'clients') {
      summaryRows.push(
        ['Total Clients', fmt(summary.total_clients)],
        ['Active Clients', fmt(summary.active_clients)],
        ['Inactive Clients', fmt(summary.inactive_clients)],
        ['New This Month', fmt(summary.new_this_month)],
      );
    }

    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: summaryRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      styles: { fontSize: 10 },
    });

    // @ts-ignore
    y = doc.lastAutoTable.finalY + 12;

    // Monthly data
    const monthly = reportData.monthly || reportData.monthlyFlow || [];
    if (monthly.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.text('Monthly Data', 14, y);
      y += 4;
      const monthHead = reportData.monthlyFlow
        ? [['Month', 'Deposits (In)', 'Withdrawals (Out)']]
        : [['Month', 'Amount', 'Count']];
      const monthBody = reportData.monthlyFlow
        ? (reportData.monthlyFlow as any[]).map(d => [d.month, fmtCedi(d.deposits), fmtCedi(d.withdrawals)])
        : (monthly as any[]).map(d => [d.month, fmtCedi(d.amount ?? d.contributions), fmt(d.count ?? '')]);

      autoTable(doc, {
        startY: y,
        head: monthHead,
        body: monthBody,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
        styles: { fontSize: 10 },
      });
      // @ts-ignore
      y = doc.lastAutoTable.finalY + 12;
    }

    // Transactions / activity table
    const txData = reportData.recentDeposits || reportData.largeTransactions || reportData.clientActivity || [];
    if (txData.length > 0) {
      doc.addPage();
      doc.setFontSize(13);
      doc.text(selectedReport === 'clients' ? 'Client Activity' : 'Transactions', 14, 20);

      const isClients = selectedReport === 'clients';
      autoTable(doc, {
        startY: 25,
        head: [isClients
          ? ['Name', 'Status', 'Transactions', 'Deposits', 'Withdrawals', 'Balance']
          : ['Date', 'Client', 'Type', 'Amount', 'Status']
        ],
        body: isClients
          ? (txData as any[]).map(c => [c.name, c.status, fmt(c.transaction_count), fmtCedi(c.total_deposits), fmtCedi(c.total_withdrawals), fmtCedi(c.current_balance)])
          : (txData as any[]).slice(0, 50).map(t => [
              new Date(t.transaction_date).toLocaleDateString(),
              t.customer_name || '—',
              t.type || 'deposit',
              fmtCedi(t.amount),
              t.status,
            ]),
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
        styles: { fontSize: 9 },
      });
    }

    doc.save(`${selectedReport}-report-${Date.now()}.pdf`);
  };

  // Excel export
  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
    if (!reportData) throw new Error('No data');

    const wb = XLSX.utils.book_new();
    const rangeLabel = DATE_RANGES.find(r => r.value === dateRange)?.label || dateRange;

    // Summary sheet
    const summarySheet = XLSX.utils.aoa_to_sheet([
      [`${REPORT_TYPES.find(r => r.id === selectedReport)?.name} Report`],
      [`Generated: ${new Date().toLocaleString()}`],
      [`Date Range: ${rangeLabel}`],
      [],
      ['Metric', 'Value'],
      ...Object.entries(reportData.summary).map(([k, v]) => [k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), v])
    ]);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Monthly sheet
    const monthly = reportData.monthly || reportData.monthlyFlow || [];
    if (monthly.length > 0) {
      const headers = Object.keys(monthly[0]);
      const monthlySheet = XLSX.utils.aoa_to_sheet([
        headers.map(h => h.replace(/_/g, ' ').toUpperCase()),
        ...monthly.map((row: any) => headers.map(h => row[h]))
      ]);
      XLSX.utils.book_append_sheet(wb, monthlySheet, 'Monthly Data');
    }

    // Detail sheet
    const detail = reportData.recentDeposits || reportData.largeTransactions || reportData.clientActivity || reportData.topContributors || reportData.topCustomers || [];
    if (detail.length > 0) {
      const headers = Object.keys(detail[0]);
      const detailSheet = XLSX.utils.aoa_to_sheet([
        headers.map(h => h.replace(/_/g, ' ').toUpperCase()),
        ...detail.map((row: any) => headers.map(h => row[h]))
      ]);
      XLSX.utils.book_append_sheet(wb, detailSheet, 'Details');
    }

    XLSX.writeFile(wb, `${selectedReport}-report-${Date.now()}.xlsx`);
  };

  // CSV export
  const exportToCSV = () => {
    if (!reportData) throw new Error('No data');
    const rangeLabel = DATE_RANGES.find(r => r.value === dateRange)?.label || dateRange;
    let csv = `Report: ${selectedReport}\nDate Range: ${rangeLabel}\nGenerated: ${new Date().toLocaleString()}\n\n`;

    csv += 'Summary\nMetric,Value\n';
    Object.entries(reportData.summary).forEach(([k, v]) => {
      csv += `"${k.replace(/_/g, ' ')}","${v}"\n`;
    });

    const monthly = reportData.monthly || reportData.monthlyFlow || [];
    if (monthly.length > 0) {
      csv += '\nMonthly Data\n';
      csv += Object.keys(monthly[0]).join(',') + '\n';
      monthly.forEach((row: any) => {
        csv += Object.values(row).join(',') + '\n';
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${selectedReport}-report-${Date.now()}.csv`;
    document.body.appendChild(a); a.click();
    URL.revokeObjectURL(url); document.body.removeChild(a);
  };

  const handleExport = async () => {
    if (!showPreview || !reportData) {
      setStatus('error', 'Please generate the report first before exporting.');
      return;
    }
    setIsExporting(true);
    try {
      if (exportFormat === 'pdf') await exportToPDF();
      else if (exportFormat === 'xlsx') await exportToExcel();
      else exportToCSV();
      setStatus('success', `Report exported as ${exportFormat.toUpperCase()}! Check your downloads folder.`);
    } catch (err) {
      setStatus('error', 'Export failed. Please try again.');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const selectedType = REPORT_TYPES.find(r => r.id === selectedReport)!;
  const colorClasses = colorMap[selectedType.color];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate, preview and export detailed business reports</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={fetchReport}
            disabled={isGenerating}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-sm"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            {isGenerating ? 'Generating…' : 'Generate Report'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !showPreview}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-sm"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isExporting ? 'Exporting…' : 'Export Report'}
          </button>
        </div>
      </div>

      {/* Status banner */}
      {exportStatus.type && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${exportStatus.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {exportStatus.type === 'success'
            ? <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            : <XCircle className="h-5 w-5 text-red-600 shrink-0" />
          }
          <p className={`text-sm font-medium ${exportStatus.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {exportStatus.message}
          </p>
        </div>
      )}

      {/* Configuration panel */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" /> Report Configuration
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Report type */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Report Type</label>
            <select
              value={selectedReport}
              onChange={e => { setSelectedReport(e.target.value); setShowPreview(false); }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {REPORT_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date Range</label>
            <select
              value={dateRange}
              onChange={e => { setDateRange(e.target.value); setShowPreview(false); }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {DATE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Custom dates */}
          {dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          {/* Export format */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Export Format</label>
            <select
              value={exportFormat}
              onChange={e => setExportFormat(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="pdf">PDF Document</option>
              <option value="xlsx">Excel (XLSX)</option>
              <option value="csv">CSV Spreadsheet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report type selector cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {REPORT_TYPES.map(type => {
          const active = selectedReport === type.id;
          const cc = colorMap[type.color];
          return (
            <div
              key={type.id}
              onClick={() => { setSelectedReport(type.id); setShowPreview(false); }}
              className={`rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${active ? `border-current ${cc.split(' ')[0]} ${cc}` : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <div className={`p-2.5 rounded-lg mb-3 w-fit ${active ? 'bg-white/60' : 'bg-gray-100'}`}>
                <type.icon className={`h-6 w-6 ${active ? cc.split(' ')[1] : 'text-gray-500'}`} />
              </div>
              <div className={`text-sm font-semibold ${active ? cc.split(' ')[1] : 'text-gray-800'}`}>{type.name}</div>
              <div className="text-xs text-gray-500 mt-1 leading-snug">{type.description}</div>
            </div>
          );
        })}
      </div>

      {/* Preview */}
      {showPreview && reportData && (
        <div id="report-preview" className="space-y-4">
          {/* Preview banner */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm font-semibold text-indigo-800">
                  {selectedType.name} — {DATE_RANGES.find(r => r.value === dateRange)?.label}
                </p>
                <p className="text-xs text-indigo-600">Generated {new Date().toLocaleString()}</p>
              </div>
            </div>
            <button
              onClick={fetchReport}
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:text-indigo-900 bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>

          {/* Report-specific preview */}
          {selectedReport === 'overview' && <OverviewPreview data={reportData} />}
          {selectedReport === 'contributions' && <ContributionsPreview data={reportData} />}
          {selectedReport === 'clients' && <ClientsPreview data={reportData} />}
          {selectedReport === 'financial' && <FinancialPreview data={reportData} />}
        </div>
      )}

      {/* Placeholder when no preview */}
      {!showPreview && (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-7 w-7 text-indigo-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">Ready to generate your report</h3>
          <p className="text-sm text-gray-400 mb-5">Select a report type and date range above, then click <strong>Generate Report</strong></p>
          <button
            onClick={fetchReport}
            disabled={isGenerating}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            {isGenerating ? 'Generating…' : 'Generate Report'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Reports;
