// src/context/FinanceContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Asset, Budget, Expense, Payment } from "../../data/mockData";
import { companyId, userRole, userUUID } from "../../constants/appConstants";


type FinanceContextType ={
  data: {
    expenses: Expense[];
    assets: Asset[];
    budgets: Budget[];
    totalCommission?: number;
  };
  loading: boolean;
  error: string | null;
  fetchFinanceData: () => Promise<void>;
  addAsset: (company_id: string, data: Omit<Asset, "id">) => Promise<boolean>;
  addExpense: (company_id: string, data: Omit<Expense, "id">) => Promise<boolean>;
  addPayment: (company_id: string, data: Omit<Payment, "id">) => Promise<boolean>;
  addBudget: (company_id: string, data: Omit<Budget, "id">) => Promise<void>;
  reduceBudget: (company_id: string, data: Omit<Budget, "id">) => Promise<void>;
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance must be used within FinanceProvider");
  return context;
};

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
    const [data, setData] = useState({
        expenses: [],
        assets: [],
        revenue: [],
        budgets: [],
        totalCommission: 0,
    });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSendingEntry, setIsSendingEntry] = useState(false);

  const API_BASE = "https://susu-pro-backend.onrender.com/api"; // adjust to your backend
  // const API_BASE = "https://susu-pro-backend.onrender.com/api";
  // Fetch both assets + expenses
  const fetchFinanceData = async () => {
        try {
      const res = await fetch(`https://susu-pro-backend.onrender.com/api/financials/get-financials/${companyId}`);
      const json = await res.json();
      if (json.status === "success") {
        setData(json.data);
        }
        
      
      } catch (err) {
      console.error("Failed to fetch financials:", err);
    }
  };

  console.log(`Finance data: ${JSON.stringify(data)}`)

  // Add Asset
  const addAsset = async (company_id: string, data: Omit<Asset, "id">) => {
    try {
        console.log("Adding asset with data:", {company_id, ...data});
      setLoading(true);
      const res = await fetch(`${API_BASE}/financials/entry`, { 
        method: "POST", 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            company_id,
        ...data,
       })});
      await fetchFinanceData()
       console.log('Add asset response:', res);
       console.log('Response ok status:', res.ok);
      if (res.ok) {
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Add Expense
  const addExpense = async ( company_id: string, data: Omit<Expense, "id">) => {
    try {
      setLoading(true);
      const recorded_by = (userRole === "company") ? '' : userUUID;
      const res = await fetch(`https://susu-pro-backend.onrender.com/api/financials/entry`, { 
        method: "POST", 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        company_id, 
        recorded_by,
        ...data })});
        console.log('Add expense response:', res);
      await fetchFinanceData(); 
      if (res.ok) {
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };
  // Add Payment
  const addPayment = async ( company_id: string, data: Omit<Payment, "id">) => {
    try {
      setLoading(true);
      const res = await fetch(`https://susu-pro-backend.onrender.com/api/financials/entry`, { 
        method: "POST", 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        company_id,
        ...data })});
        console.log('Add payment response:', res);
      await fetchFinanceData(); 
      if (res.ok) {
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addBudget = async ( company_id: string, data: Omit<Budget, "id">) => {
    try {
      setLoading(true);
      const recorded_by = userUUID;
      const res = await fetch(`${API_BASE}/financials/budget`, { 
        method: "POST", 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        company_id,
        recorded_by,
        ...data })});
        console.log('Add budget response:', res);
      await fetchFinanceData(); // refresh
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };
  const reduceBudget = async ( company_id: string, data: Omit<Budget, "id">) => {
    try {
      setLoading(true);
      const recorded_by = userUUID;
      console.log(`Reducing data ${JSON.stringify(data)}`)
      const res = await fetch(`https://susu-pro-backend.onrender.com/api/budgets/sell-cash`, { 
        method: "POST", 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        company_id,
        recorded_by,
        ...data })});
        console.log('Add budget response:', res);
      await fetchFinanceData(); // refresh
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  return (
    <FinanceContext.Provider
      value={{ loading, error, data, fetchFinanceData, addAsset, addExpense, addPayment, addBudget, reduceBudget }}
    >
      {children}
    </FinanceContext.Provider>
  );
};
