import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { companyId, userRole, userType, userUUID } from "../../constants/appConstants";
import { toast } from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type LoanType = "individual" | "group" | "group_member" | "p2p";
export type LoanStatus =
  | "pending"
  | "active"
  | "completed"
  | "ended"
  | "rejected"
  | "overdue";
export type P2PStatus = "active" | "inactive" | "ended";
export type InterestMethod = "fixed" | "reducing" | "flat";
export type CreatedByType = "staff" | "admin" | "owner" | "company" | string;

// ── Core loan shape returned from the API ────────────────────────────────────
export interface Loan {
  id: string;
  customer_id: string;
  loantype: LoanType;

  // Customer join fields
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;

  // Group
  group_id?: string;
  group_name?: string;

  // P2P
  recipient_name?: string;
  recipient_phone?: string;
  relationship?: string;

  // Amounts
  loanamount?: number;
  disbursedamount?: number;
  interestrateloan?: number;
  loanterm?: number;
  interestmethod?: InterestMethod;
  monthlypayment?: number;
  totalpayable?: number;
  amountpaid?: number;
  outstandingbalance?: number;
  balance?: number;

  // Dates
  request_date?: string;
  disbursementdate?: string;
  maturitydate?: string;
  nextpaymentdate?: string;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;

  // Status
  status?: LoanStatus;
  days_overdue?: number;

  // Loan details
  loan_category?: string;
  purpose?: string;
  collateral?: string;
  guarantor?: string;
  guarantorphone?: string;
  guarantor_relationship?: string;
  guarantor_address?: string;
  description?: string;

  // Approval
  approved_by?: string;
  approved_by_type?: string;

  // Company / auth
  company_id?: string;
  created_by?: string;
  created_by_type?: CreatedByType;

  // Hydrated sub-relations (getLoanById)
  members?: Loan[];
  repayments?: LoanRepayment[];
}

export interface LoanRepayment {
  id: string;
  loan_id: string;
  amount: number;
  payment_date: string;
  note?: string;
  balance_after: number;
  company_id: string;
  created_by: string;
  created_at?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ── Request payloads ─────────────────────────────────────────────────────────

export interface CreateIndividualLoanPayload {
  customer_id?: string;
  customer_name?: string;   // if no registered customer
  customer_phone?: string;
  loan_category: string;
  loan_amount: number;
  interest_rate: number;
  duration: number;
  interest_method?: InterestMethod;
  request_date: string;
  disbursement_date?: string;
  disbursed_amount?: number;
  purpose: string;
  collateral?: string;
  collateral_value?: number;
  guarantor_name: string;
  guarantor_phone: string;
  guarantor_relationship?: string;
  guarantor_address?: string;
  description?: string;
}

export interface GroupMemberPayload {
  customer_id: string;
  name?: string;
  phone?: string;
  loan_share: number;
}

export interface CreateGroupLoanPayload {
  group_name: string;
  start_date: string;
  members: GroupMemberPayload[];
  guarantor_name?: string;
  guarantor_phone?: string;
  notes?: string;
  created_by_type?: string;
  created_by?: string;
}

export interface CreateP2PLoanPayload {
  recipient_name: string;
  recipient_phone?: string;
  amount: number;
  date_sent: string;
  reason: string;
  relationship?: string;
  notes?: string;
  customer_id?: string;
}

export interface ApproveLoanPayload {
  loanId: string;
  disbursement_date?: string;
}

export interface RejectLoanPayload {
  loanId: string;
  rejection_reason?: string;
}

export interface LogRepaymentPayload {
  loanId: string;
  amount_paid: number;
  payment_date?: string;
  note?: string;
}

export interface GetLoansQuery {
  type?: LoanType;
  status?: LoanStatus;
  page?: number;
  limit?: number;
}

// ── Context shape ─────────────────────────────────────────────────────────────

interface LoansContextType {
  // State
  allCompanyLoans: Loan[];
  loading: boolean;

  // Fetch helpers
  fetchCompanyLoans: (query?: GetLoansQuery) => Promise<void>;
  getLoanById: (loanId: string) => Promise<Loan | null>;
  getCustomerLoans: (customerId: string) => Promise<Loan[]>;
  getGroupLoanWithMembers: (groupId: string) => Promise<{ group_loan: Loan; members: Loan[] } | null>;

  // Mutations — loans
  createIndividualLoan: (payload: CreateIndividualLoanPayload) => Promise<Loan | null>;
  createGroupLoan: (payload: CreateGroupLoanPayload) => Promise<{ group_loan: Loan; member_loans: Loan[] } | null>;
  createP2PLoan: (payload: CreateP2PLoanPayload) => Promise<Loan | null>;

  // Mutations — lifecycle
  approveLoan: (payload: ApproveLoanPayload) => Promise<boolean>;
  rejectLoan: (payload: RejectLoanPayload) => Promise<boolean>;
  updateP2PStatus: (loanId: string, status: P2PStatus) => Promise<boolean>;

  // Mutations — repayments
  logRepayment: (payload: LogRepaymentPayload) => Promise<boolean>;
  getLoanRepayments: (loanId: string) => Promise<LoanRepayment[]>;

  // Legacy aliases kept so existing call-sites don't break
  repayLoan: (loanId: string, amount: number) => Promise<void>;
  reverseLoan: (loanId: string) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = "https://susu-pro-backend.onrender.com/api/loans";

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

const LoansContext = createContext<LoansContextType | undefined>(undefined);

export const LoansProvider = ({ children }: { children: ReactNode }) => {
  const [allCompanyLoans, setCompanyLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);

  // ─── Auth helpers ──────────────────────────────────────────────────────────

  /** Returns common auth fields injected into every mutating request body. */
  const authFields = () => ({
    company_id: companyId,
    created_by: userUUID,
    created_by_type: userType as CreatedByType,
  });

  const requireAuth = (): boolean => {
    if (!userUUID) {
      toast.error("You must be logged in.");
      return false;
    }
    return true;
  };

  // ─── Generic fetch wrapper ─────────────────────────────────────────────────

  async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<{ ok: boolean; data: T | null; message: string }> {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
      });
      const json = await res.json();
      return {
        ok: res.ok,
        data: res.ok ? (json.data ?? json) : null,
        message: json.message ?? (res.ok ? "Success" : "An error occurred"),
      };
    } catch (err: any) {
      console.error(`apiFetch ${path}:`, err.message);
      return { ok: false, data: null, message: "Network error. Check your connection." };
    }
  }

  // ─── FETCH: all company loans ──────────────────────────────────────────────

  const fetchCompanyLoans = useCallback(
    async (query: GetLoansQuery = {}) => {
      if (!companyId) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({ company_id: companyId });
        if (query.type)   params.set("type",   query.type);
        if (query.status) params.set("status", query.status);
        if (query.page)   params.set("page",   String(query.page));
        if (query.limit)  params.set("limit",  String(query.limit));

        const res = await fetch(`${BASE_URL}?${params.toString()}`);
        if (!res.ok) { setCompanyLoans([]); return; }

        const json = await res.json();
        setCompanyLoans(Array.isArray(json?.data) ? json.data : []);
      } catch (err) {
        console.error("fetchCompanyLoans error:", err);
        setCompanyLoans([]);
      } finally {
        setLoading(false);
      }
    },
    [companyId]
  );

  useEffect(() => {
    fetchCompanyLoans();
  }, [fetchCompanyLoans]);

  // ─── FETCH: single loan ────────────────────────────────────────────────────

  const getLoanById = async (loanId: string): Promise<Loan | null> => {
    const { ok, data, message } = await apiFetch<Loan>(`/${loanId}`);
    if (!ok) { toast.error(message); return null; }
    return data;
  };

  // ─── FETCH: loans by customer ──────────────────────────────────────────────

  const getCustomerLoans = async (customerId: string): Promise<Loan[]> => {
    if (!companyId) return [];
    const { ok, data } = await apiFetch<Loan[]>(
      `/customer/${customerId}?company_id=${companyId}`
    );
    return ok && Array.isArray(data) ? data : [];
  };

  // ─── FETCH: group loan + members ──────────────────────────────────────────

  const getGroupLoanWithMembers = async (
    groupId: string
  ): Promise<{ group_loan: Loan; members: Loan[] } | null> => {
    console.log(`Group id: ${groupId}`)
    const { ok, data, message } = await apiFetch<{ group_loan: Loan; members: Loan[] }>(
      `/group/${groupId}/members`
    );
    if (!ok) { toast.error(message); return null; }
    return data;
  };

  // ─── CREATE: individual loan ───────────────────────────────────────────────

  const createIndividualLoan = async (
    payload: CreateIndividualLoanPayload
  ): Promise<Loan | null> => {
    if (!requireAuth()) return null;
    setLoading(true);

    const body = { ...payload, ...authFields() };
    const { ok, data, message } = await apiFetch<Loan>("/individual", {
      method: "POST",
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!ok) { toast.error(message); return null; }
    toast.success(message || "Individual loan application submitted.");
    await fetchCompanyLoans();
    return data;
  };

  // ─── CREATE: group loan ────────────────────────────────────────────────────

  const createGroupLoan = async (
    payload: CreateGroupLoanPayload
  ): Promise<{ group_loan: Loan; member_loans: Loan[] } | null> => {
    if (!requireAuth()) return null;
    setLoading(true);

    const body = { ...payload, ...authFields() };
    const { ok, data, message } = await apiFetch<{
      group_loan: Loan;
      member_loans: Loan[];
    }>("/group", { method: "POST", body: JSON.stringify(body) });
    console.log(`Loan body: ${JSON.stringify(payload)}`)
    setLoading(false);

    if (!ok) { toast.error(message); return null; }
    toast.success(message || "Group loan submitted.");
    await fetchCompanyLoans();
    return data;
  };

  // ─── CREATE: P2P loan ──────────────────────────────────────────────────────

  const createP2PLoan = async (
    payload: CreateP2PLoanPayload
  ): Promise<Loan | null> => {
    if (!requireAuth()) return null;
    setLoading(true);

    const body = { ...payload, ...authFields() };
    const { ok, data, message } = await apiFetch<Loan>("/p2p", {
      method: "POST",
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!ok) { toast.error(message); return null; }
    toast.success(message || "P2P entry created.");
    await fetchCompanyLoans();
    return data;
  };

  // ─── APPROVE loan ──────────────────────────────────────────────────────────

  const approveLoan = async (payload: ApproveLoanPayload): Promise<boolean> => {
    if (!requireAuth()) return false;
    setLoading(true);

    const body = {
      loanId:            payload.loanId,
      disbursement_date: payload.disbursement_date,
      approved_by:       userUUID,
      approved_by_type:  userRole,
      company_id:        companyId,
    };

    const { ok, message } = await apiFetch<Loan>(`/${payload.loanId}/approve`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!ok) { toast.error(message); return false; }
    toast.success(message || "Loan approved.");
    await fetchCompanyLoans();
    return true;
  };

  // ─── REJECT loan ───────────────────────────────────────────────────────────

  const rejectLoan = async (payload: RejectLoanPayload): Promise<boolean> => {
    if (!requireAuth()) return false;
    setLoading(true);

    const body = {
      rejected_by:       userUUID,
      rejected_by_type:  userRole,
      rejection_reason:  payload.rejection_reason ?? "",
    };

    const { ok, message } = await apiFetch<Loan>(`/${payload.loanId}/reject`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!ok) { toast.error(message); return false; }
    toast.success(message || "Loan rejected.");
    await fetchCompanyLoans();
    return true;
  };

  // ─── UPDATE P2P status ─────────────────────────────────────────────────────

  const updateP2PStatus = async (
    loanId: string,
    status: P2PStatus
  ): Promise<boolean> => {
    if (!requireAuth()) return false;

    const { ok, message } = await apiFetch<Loan>(`/p2p/${loanId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });

    if (!ok) { toast.error(message); return false; }
    toast.success(`Entry marked as ${status}.`);
    await fetchCompanyLoans();
    return true;
  };

  // ─── LOG repayment ─────────────────────────────────────────────────────────

  const logRepayment = async (payload: LogRepaymentPayload, id?: string): Promise<boolean> => {
    if (!requireAuth()) return false;
    setLoading(true);

    const body = {
      amount_paid:   payload.amount_paid,
      payment_date:  payload.payment_date,
      note:          payload.note,
      company_id:    companyId,
      created_by:    userUUID,
      loanId: payload.loanId,
    };
    const effectiveID = id ? id : body.loanId;
    console.log(`Loggin body: ${JSON.stringify(body)} id: ${JSON.stringify(id)}`)
    const { ok, message } = await apiFetch(`/${effectiveID}/repayment`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!ok) { toast.error(message); return false; }
    toast.success(message || "Repayment logged.");
    await fetchCompanyLoans();
    return true;
  };

  // ─── GET repayment history ─────────────────────────────────────────────────

  const getLoanRepayments = async (loanId: string): Promise<LoanRepayment[]> => {
    const { ok, data } = await apiFetch<LoanRepayment[]>(`/${loanId}/repayments`);
    return ok && Array.isArray(data) ? data : [];
  };

  // ─── Legacy aliases ────────────────────────────────────────────────────────
  // Kept so any existing call-sites continue to compile without changes.

  const repayLoan = async (loanId: string, amount: number): Promise<void> => {
    await logRepayment({ loanId, amount_paid: amount });
  };

  const reverseLoan = async (loanId: string): Promise<void> => {
    if (!userUUID) throw new Error("Staff not logged in");
    await fetch(`${BASE_URL}/reverse`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loanId, userUUID }),
    });
    await fetchCompanyLoans();
  };

  // ─── Provider ──────────────────────────────────────────────────────────────

  return (
    <LoansContext.Provider
      value={{
        allCompanyLoans,
        loading,

        fetchCompanyLoans,
        getLoanById,
        getCustomerLoans,
        getGroupLoanWithMembers,

        createIndividualLoan,
        createGroupLoan,
        createP2PLoan,

        approveLoan,
        rejectLoan,
        updateP2PStatus,

        logRepayment,
        getLoanRepayments,

        repayLoan,
        reverseLoan,
      }}
    >
      {children}
    </LoansContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export const useLoans = (): LoansContextType => {
  const ctx = useContext(LoansContext);
  if (!ctx) throw new Error("useLoans must be used inside <LoansProvider>");
  return ctx;
};

/** All loans that are still pending / not yet active. */
export const useLoanApplications = (): Loan[] => {
  const { allCompanyLoans } = useLoans();
  return allCompanyLoans.filter((l) => l.status === "pending");
};

/** Only individual loans. */
export const useIndividualLoans = (): Loan[] => {
  const { allCompanyLoans } = useLoans();
  return allCompanyLoans.filter((l) => l.loantype === "individual");
};

/** Only parent group loans (excludes individual member rows). */
export const useGroupLoans = (): Loan[] => {
  const { allCompanyLoans } = useLoans();
  return allCompanyLoans.filter((l) => l.loantype === "group");
};

/** Only P2P entries. */
export const useP2PLoans = (): Loan[] => {
  const { allCompanyLoans } = useLoans();
  return allCompanyLoans.filter((l) => l.loantype === "p2p");
};

/** Active (approved) loans only. */
export const useActiveLoans = (): Loan[] => {
  const { allCompanyLoans } = useLoans();
  return allCompanyLoans.filter((l) => l.status === "active");
};

/** Overdue loans. */
export const useOverdueLoans = (): Loan[] => {
  const { allCompanyLoans } = useLoans();
  return allCompanyLoans.filter((l) => l.status === "overdue");
};

export default LoansContext;
