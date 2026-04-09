import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { companyId, userUUID, userRole, getDisplayName, companyName } from "../../constants/appConstants";
import { toast } from "react-hot-toast";

const BASE_URL = "https://susu-pro-backend.onrender.com/api/day-end";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type DayEndReportType =
  | "status"
  | "summary"
  | "teller-reconciliation"
  | "loan-report"
  | "financial-close"
  | "sales-report"
  | "hr-report"
  | "audit-trail";

export interface DayEndStatus {
  pending_withdrawals: number;
  open_floats: number;
  closed_floats: number;
  active_loans: number;
  overdue_loans: number;
  pending_loan_applications: number;
  pending_commissions: number;
  today_deposits: number;
  today_withdrawals: number;
  net_today: number;
  alerts: {
    has_pending_withdrawals: boolean;
    has_open_floats: boolean;
    has_overdue_loans: boolean;
    has_pending_loans: boolean;
  };
}

export interface TellerFloat {
  budget_id: string;
  teller_id: string;
  teller_name: string;
  allocated: number;
  spent: number;
  remaining: number;
  status: "Active" | "Closed";
}

export interface StaffActivity {
  id: string;
  name: string;
  role: string;
  deposits_recorded: number;
  deposit_value: number;
  withdrawals_processed: number;
  customers_registered: number;
  last_activity: string | null;
}

export interface DayEndSummary {
  report_date: string;
  generated_at: string;
  data: {
    transactions: {
      total: number;
      net_flow: number;
      deposits: { count: number; total: number };
      withdrawals: { count: number; total: number };
      transfers: { count: number; total: number };
      reversals: { count: number; total: number };
      pending_withdrawals_count: number;
    };
    float: {
      teller_count: number;
      total_allocated: number;
      total_spent: number;
      total_remaining: number;
      active_floats: number;
      closed_floats: number;
      teller_floats: TellerFloat[];
    };
    loans: {
      new_applications: number;
      approved_today: number;
      rejected_today: number;
      completed_today: number;
      disbursed_today: number;
      total_overdue: number;
      repayments: { count: number; total: number };
    };
    commissions: {
      count: number;
      total_earned: number;
      paid_amount: number;
      reversed_amount: number;
    };
    financials: {
      revenue_today: number;
      expenses_today: number;
      revenue_entries: number;
      expense_entries: number;
      net_cash_position: number;
    };
    customers: { new_today: number; active_new: number; list: any[] };
    staff_activity: StaffActivity[];
    alerts: { pending_withdrawals: any[]; overdue_loans: any };
  };
}

export interface TellerReconciliation {
  report_date: string;
  data: {
    teller_floats: any[];
    teller_transactions: any[];
    summary: {
      total_floats: number;
      total_allocated: number;
      total_spent: number;
      total_remaining: number;
      open_floats: number;
      closed_floats: number;
    };
  };
}

export interface LoanDayEndReport {
  report_date: string;
  data: {
    loan_summary_by_type: any[];
    new_loans_today: any[];
    repayments_today: any[];
    overdue_loans: any[];
    officer_performance: any[];
    totals: {
      new_applications: number;
      total_repayments: number;
      repayment_count: number;
      total_overdue: number;
    };
  };
}

export interface FinancialDayEnd {
  report_date: string;
  data: {
    income_statement: {
      total_revenue: number;
      total_commission_paid: number;
      loan_repayment_income: number;
      total_income: number;
      total_expenses: number;
      net_profit: number;
      profit_margin_pct: string;
    };
    expense_breakdown: any[];
    revenue_breakdown: any[];
    budget_reconciliation: {
      records: any[];
      total_allocated: number;
      total_spent: number;
      total_variance: number;
      utilisation_pct: string;
    };
    commission_payables: { count: number; total: number; items: any[] };
    assets_snapshot: any[];
    account_balances: any[];
    total_assets_value: number;
  };
}

export interface SalesDayEnd {
  report_date: string;
  data: {
    agent_performance: any[];
    new_accounts_today: any[];
    hourly_trend: any[];
    top_customers: any[];
    summary: {
      total_deposits_today: number;
      total_new_customers: number;
      active_agents: number;
      best_agent: string;
      best_agent_total: number;
    };
  };
}

export interface HRDayEnd {
  report_date: string;
  data: {
    staff_activity: any[];
    new_staff_today: any[];
    float_assignments: any[];
    summary: {
      total_staff: number;
      active_today: number;
      idle_today: number;
      new_hires: number;
    };
  };
}

export interface AuditTrail {
  report_date: string;
  data: {
    reversals: any[];
    rejected_loans: any[];
    approved_loans: any[];
    deleted_transactions: any[];
    budget_events: any[];
    summary: {
      total_reversals: number;
      total_rejections: number;
      total_approvals: number;
      total_deletions: number;
      total_budget_events: number;
    };
  };
}

export interface CloseDayResult {
  report_date: string;
  closed_by: string;
  closed_at: string;
  floats_closed_now: number;
  snapshot: {
    total_deposits: number;
    total_withdrawals: number;
    pending_withdrawals: number;
    total_transactions: number;
    loans_approved: number;
    disbursed_today: number;
    commissions_paid: number;
  };
}

export interface DayEndQuery {
  date?: string;
  teller_id?: string;
  officer_id?: string;
  staff_id?: string;
}

interface DayEndContextType {
  loading: Record<DayEndReportType | "close", boolean>;
  statusData: DayEndStatus | null;
  summaryData: DayEndSummary | null;
  tellerData: TellerReconciliation | null;
  loanReportData: LoanDayEndReport | null;
  financialData: FinancialDayEnd | null;
  salesData: SalesDayEnd | null;
  hrData: HRDayEnd | null;
  auditData: AuditTrail | null;
  fetchStatus: () => Promise<DayEndStatus | null>;
  fetchSummary: (query?: DayEndQuery) => Promise<DayEndSummary | null>;
  fetchTellerReconciliation: (query?: DayEndQuery) => Promise<TellerReconciliation | null>;
  fetchLoanReport: (query?: DayEndQuery) => Promise<LoanDayEndReport | null>;
  fetchFinancialClose: (query?: DayEndQuery) => Promise<FinancialDayEnd | null>;
  fetchSalesReport: (query?: DayEndQuery) => Promise<SalesDayEnd | null>;
  fetchHRReport: (query?: DayEndQuery) => Promise<HRDayEnd | null>;
  fetchAuditTrail: (query?: DayEndQuery) => Promise<AuditTrail | null>;
  closeDay: (date?: string) => Promise<CloseDayResult | null>;
  clearAll: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT + PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

const DayEndContext = createContext<DayEndContextType | undefined>(undefined);

export const DayEndProvider = ({ children }: { children: ReactNode }) => {
  const initLoading = {
    status: false, summary: false, "teller-reconciliation": false,
    "loan-report": false, "financial-close": false, "sales-report": false,
    "hr-report": false, "audit-trail": false, close: false,
  };
  const [loading, setLoading] = useState<Record<DayEndReportType | "close", boolean>>(initLoading as any);
  const [statusData,     setStatusData]     = useState<DayEndStatus | null>(null);
  const [summaryData,    setSummaryData]     = useState<DayEndSummary | null>(null);
  const [tellerData,     setTellerData]      = useState<TellerReconciliation | null>(null);
  const [loanReportData, setLoanReportData]  = useState<LoanDayEndReport | null>(null);
  const [financialData,  setFinancialData]   = useState<FinancialDayEnd | null>(null);
  const [salesData,      setSalesData]       = useState<SalesDayEnd | null>(null);
  const [hrData,         setHrData]          = useState<HRDayEnd | null>(null);
  const [auditData,      setAuditData]       = useState<AuditTrail | null>(null);

  const setKey = (k: DayEndReportType | "close", v: boolean) =>
    setLoading(p => ({ ...p, [k]: v }));

  async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<{ ok: boolean; data: T | null; message: string }> {
    try {
      const res  = await fetch(`${BASE_URL}${path}`, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) } });
      const json = await res.json();
      return { ok: res.ok, data: res.ok ? json : null, message: json.message ?? (res.ok ? "OK" : "Failed") };
    } catch (e: any) {
      return { ok: false, data: null, message: "Network error" };
    }
  }

  const qs = (q?: DayEndQuery) => {
    if (!q) return "";
    const p = new URLSearchParams();
    if (q.date)       p.set("date",       q.date);
    if (q.teller_id)  p.set("teller_id",  q.teller_id);
    if (q.officer_id) p.set("officer_id", q.officer_id);
    if (q.staff_id)   p.set("staff_id",   q.staff_id);
    return p.toString() ? `?${p.toString()}` : "";
  };

  const fetchStatus = useCallback(async () => {
    if (!companyId) return null;
    setKey("status", true);
    const { ok, data, message } = await apiFetch<any>(`/${companyId}/status`);
    setKey("status", false);
    if (!ok) { toast.error(message); return null; }
    const r = data?.data ?? null;
    setStatusData(r);
    return r;
  }, []);

  const fetchSummary = useCallback(async (q?: DayEndQuery) => {
    if (!companyId) return null;
    console.log(`Day end summary: ${JSON.stringify(q)}`)
    setKey("summary", true);
    const { ok, data, message } = await apiFetch<DayEndSummary>(`/${companyId}/summary${qs(q)}`);
    
    setKey("summary", false);
    if (!ok) { toast.error(message); return null; }
    setSummaryData(data); return data;
  }, []);

  const fetchTellerReconciliation = useCallback(async (q?: DayEndQuery) => {
    if (!companyId) return null;
    setKey("teller-reconciliation", true);
    const { ok, data, message } = await apiFetch<TellerReconciliation>(`/${companyId}/teller-reconciliation${qs(q)}`);
    setKey("teller-reconciliation", false);
    if (!ok) { toast.error(message); return null; }
    setTellerData(data); return data;
  }, []);

  const fetchLoanReport = useCallback(async (q?: DayEndQuery) => {
    if (!companyId) return null;
    setKey("loan-report", true);
    const { ok, data, message } = await apiFetch<LoanDayEndReport>(`/${companyId}/loan-report${qs(q)}`);
    setKey("loan-report", false);
    if (!ok) { toast.error(message); return null; }
    setLoanReportData(data); return data;
  }, []);

  const fetchFinancialClose = useCallback(async (q?: DayEndQuery) => {
    if (!companyId) return null;
    setKey("financial-close", true);
    const { ok, data, message } = await apiFetch<FinancialDayEnd>(`/${companyId}/financial-close${qs(q)}`);
    setKey("financial-close", false);
    if (!ok) { toast.error(message); return null; }
    setFinancialData(data); return data;
  }, []);

  const fetchSalesReport = useCallback(async (q?: DayEndQuery) => {
    if (!companyId) return null;
    setKey("sales-report", true);
    const { ok, data, message } = await apiFetch<SalesDayEnd>(`/${companyId}/sales-report${qs(q)}`);
    setKey("sales-report", false);
    if (!ok) { toast.error(message); return null; }
    setSalesData(data); return data;
  }, []);

  const fetchHRReport = useCallback(async (q?: DayEndQuery) => {
    if (!companyId) return null;
    setKey("hr-report", true);
    const { ok, data, message } = await apiFetch<HRDayEnd>(`/${companyId}/hr-report${qs(q)}`);
    setKey("hr-report", false);
    if (!ok) { toast.error(message); return null; }
    setHrData(data); return data;
  }, []);

  const fetchAuditTrail = useCallback(async (q?: DayEndQuery) => {
    if (!companyId) return null;
    setKey("audit-trail", true);
    console.log(`Auditing q: ${JSON.stringify(q)}`)
    const { ok, data, message } = await apiFetch<AuditTrail>(`/${companyId}/audit-trail${qs(q)}`);
    setKey("audit-trail", false);
    if (!ok) { toast.error(message); return null; }
    setAuditData(data); return data;
  }, []);

  const closeDay = useCallback(async (date?: string) => {
    if (!companyId || !userUUID) { toast.error("Auth required"); return null; }
    setKey("close", true);
    const { ok, data, message } = await apiFetch<any>(`/${companyId}/close`, {
      method: "POST",
      body: JSON.stringify({ closed_by: userUUID, closed_by_name: companyName, date }),
    });
    setKey("close", false);
    if (!ok) { toast.error(message); return null; }
    toast.success(message || "Day closed!");
    return data?.data ?? null;
  }, []);

  const clearAll = useCallback(() => {
    setStatusData(null); setSummaryData(null); setTellerData(null);
    setLoanReportData(null); setFinancialData(null); setSalesData(null);
    setHrData(null); setAuditData(null);
  }, []);

  return (
    <DayEndContext.Provider value={{
      loading, statusData, summaryData, tellerData, loanReportData,
      financialData, salesData, hrData, auditData,
      fetchStatus, fetchSummary, fetchTellerReconciliation, fetchLoanReport,
      fetchFinancialClose, fetchSalesReport, fetchHRReport, fetchAuditTrail,
      closeDay, clearAll,
    }}>
      {children}
    </DayEndContext.Provider>
  );
};

export const useDayEnd = (): DayEndContextType => {
  const ctx = useContext(DayEndContext);
  if (!ctx) throw new Error("useDayEnd must be used inside <DayEndProvider>");
  return ctx;
};

export default DayEndContext;
