import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { companyId, userRole, userUUID } from "../../constants/appConstants";
import { toast } from "react-hot-toast";

type LoanStatus = "initiated" | "approved" | "overdue" | "rejected";

export interface Loan {
  id: string;
  customer_id: string;

  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;

  loanType?: string;
  loanAmount?: number;
  disbursedAmount?: number;
  interestRateLoan?: number;
  loanTerm?: number;

  collateral?: string;
  guarantor?: string;
  guarantorPhone?: string;
  purpose?: string;

  created_at?: string;
  status?: LoanStatus;
}

export interface ApprovePayload {
  loanId: string;
  approvedby: string;
  created_by_type: string;
  disbursedamount: number;
  interestrateloan: number;
  loanterm: Number;
  disbursementdate: string;
  interestmethod: string;
}

interface LoansContextType {
  allCompanyLoans: Loan[];
  loading: boolean;

  fetchCompanyLoans: () => Promise<void>;

  approveLoan: (payload: ApprovePayload) => Promise<string>;

  repayLoan: (loanId: string, amount: number) => Promise<void>;

  reverseLoan: (loanId: string) => Promise<void>;
}

const LoansContext = createContext<LoansContextType | undefined>(
  undefined
);

export const LoansProvider = ({ children }: { children: ReactNode }) => {
  const [allCompanyLoans, setCompanyLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);


  const fetchCompanyLoans = async () => {
    if (!companyId) return;

    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:5000/api/loans/company/${companyId}`
      );

      if (!res.ok) {
        setCompanyLoans([]);
        return;
      }

      const data = await res.json();

      setCompanyLoans(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      console.error("Error fetching loans:", err);
      setCompanyLoans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyLoans();
  }, [companyId]);

  // ===== APPROVE LOAN → DOUBLE ENTRY =====
    const approveLoan = async (payload: ApprovePayload) => {
      try {
        setLoading(true)
        if (!userUUID) {
          toast.error("You must be logged in to approve a loan");
          throw new Error("Staff not logged in");
        }

        const finalPayload: ApprovePayload = {
          ...payload,
          approvedby: userUUID,
          created_by_type: userRole,
        };

        const res = await fetch(
          "http://localhost:5000/api/loans/approve",
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(finalPayload),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          const errorMessage =
            data?.message || "Unable to approve loan. Please try again.";
          toast.error(errorMessage);
          setLoading(false)
          return false
        }

        // ✅ Success
        toast.success(data?.message || "Loan approved successfully");

        // Refresh loans after approval
        await fetchCompanyLoans();
        setLoading(false)
        return data?.message;

      } catch (error: any) {
        console.error("Approve loan error:", error.message);

        // Catch network / unexpected errors
        if (!error.message) {
          toast.error("Network error. Please check your connection.");
        }
        setLoading(false)
        return error;
      }
    };

  const repayLoan = async (loanId: string, amount: number) => {
    if (!userUUID) throw new Error("Staff not logged in");

    await fetch("http://localhost:5000/api/loans/repay", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loanId,
        amount,
        userUUID,
      }),
    });

    await fetchCompanyLoans();
  };

  // ===== REVERSAL =====
  const reverseLoan = async (loanId: string) => {
    if (!userUUID) throw new Error("Staff not logged in");

    await fetch("http://localhost:5000/api/loans/reverse", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loanId,
        userUUID,
      }),
    });

    await fetchCompanyLoans();
  };

  return (
    <LoansContext.Provider
      value={{
        allCompanyLoans,
        loading,
        fetchCompanyLoans,
        approveLoan,
        repayLoan,
        reverseLoan,
      }}
    >
      {children}
    </LoansContext.Provider>
  );
};

export const useLoans = () => {
  const context = useContext(LoansContext);

  if (!context) {
    throw new Error("useLoans must be used inside LoansProvider");
  }

  return context;
};

export const useLoanApplications = () => {
  const { allCompanyLoans } = useLoans();

  return allCompanyLoans.filter(
    (l) => l.status !== "approved"
  );
};

export default LoansContext;
