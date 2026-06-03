import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { companyId } from "../../constants/appConstants";
import toast from "react-hot-toast";
import { useFinance } from "./Finance";

export interface Budget {
  id: string;
  company_id: string;
  date: string;
  allocated: number;
  spent: number;
  status: "Active" | "Inactive";
  created_at?: string;
  updated_at?: string;
}

interface BudgetContextType {
  budgets: Budget[];
  loadingToggle: boolean;
  error: string | null;
  fetchBudgets: (companyId: string) => Promise<void>;
  addBudget: (companyId: string, allocated: number, source?: string, recordedBy?: string) => Promise<void>;
  sellCash: (companyId: string, amount: number, destination?: string, recordedBy?: string) => Promise<void>;
  toggleBudgetStatus: (budgetId: string) => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) throw new Error("useBudget must be used within a BudgetProvider");
  return context;
};

interface Props {
  children: ReactNode;
}

export const BudgetProvider = ({ children }: Props) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loadingToggle, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchFinanceData } =useFinance();
  const API_BASE = "https://susu-pro-backend.onrender.com/api/budgets";

  /* ----------------------------- Fetch Budgets ----------------------------- */
  const fetchBudgets = async (companyId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/company/${companyId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to fetch budgets");

      setBudgets(data.data.budgets || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

   const fetchBudgetById = async (id: string): Promise<Budget | null> => {
    try {
      const res = await fetch(`https://susu-pro-backend.onrender.com/api/budgets/${id}`);
      if (!res.ok) {
        console.error("Failed to fetch budget", res.statusText);
        return null;
      }
      const data = await res.json();
      return data.data?.budget || null;
    } catch (err) {
      console.error("Error fetching budget:", err);
      return null;
    }
  };

  /* ----------------------------- Add / Top-Up Budget ----------------------------- */
  const addBudget = async (companyId: string, allocated: number, source?: string, recordedBy?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId, allocated, source, recorded_by: recordedBy }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add budget");

      // Update locally
      setBudgets((prev) => {
        const updated = prev.filter((b) => b.id !== data.data.budget.id);
        return [data.data.budget, ...updated];
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------- Sell Cash ----------------------------- */
  const sellCash = async (companyId: string, amount: number, destination?: string, recordedBy?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId, allocated: amount, destination, recorded_by: recordedBy }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to sell cash");

      // Update locally
      setBudgets((prev) => {
        const updated = prev.filter((b) => b.id !== data.data.budget.id);
        return [data.data.budget, ...updated];
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------- Toggle Budget Status ----------------------------- */
  const toggleBudgetStatus = async (budgetId: string) => {
    setLoading(true);
    const toastId = toast.loading("Updating")
    try {
      const res = await fetch(`${API_BASE}/${budgetId}/toggle-status`, {
        method: "PATCH",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to toggle status");

      setBudgets((prev) =>
        prev.map((b) => (b.id === budgetId ? { ...b, status: data.data.status } : b))
      );
      await fetchBudgetById(budgetId)
      await fetchBudgets(companyId);
      await fetchFinanceData();
      toast.success("Updated", {id: toastId})
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed", {id: toastId})
    } finally {
      setLoading(false);
    }
  };

  return (
    <BudgetContext.Provider
      value={{
        budgets,
        loadingToggle,
        error,
        fetchBudgets,
        addBudget,
        sellCash,
        toggleBudgetStatus,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};
