import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

/* =========================
   TYPES
========================= */

export type FloatActivity = {
  movement_id: string;
  source_type: "withdrawal" | "expense" | "topup";
  amount: number;
  created_at: string;

  // Withdrawal
  transaction_id?: string;
  transaction_status?: string;
  withdrawal_amount?: number;
  customer_name?: string;
  account_number?: string;
  withdrawal_staff_name?: string;
  recorded_staff_name?: string;
  mobile_banker_name?: string;

  // Expense
  expense_id?: string;
  expense_description?: string;
  expense_amount?: number;
  expense_staff_name?: string;
};

type FloatActivityContextType = {
  activities: FloatActivity[];
  loading: boolean;
  error: string | null;
  fetchFloatActivity: (budgetId: string) => Promise<void>;
  clearFloatActivity: () => void;
};

/* =========================
   CONTEXT
========================= */

const FloatActivityContext = createContext<FloatActivityContextType | undefined>(
  undefined
);

/* =========================
   PROVIDER
========================= */

export const FloatActivityProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [activities, setActivities] = useState<FloatActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFloatActivity = async (budgetId: string) => {
    if (!budgetId) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `https://susu-pro-backend.onrender.com/api/float/${budgetId}/activity`
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch float activity");
      }

      const data = await res.json();
      setActivities(data.data);
      console.log("Fetched float activity:", data.data);
    } catch (err: any) {
      console.error("Float activity error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearFloatActivity = () => {
    setActivities([]);
    setError(null);
    setLoading(false);
  };

  return (
    <FloatActivityContext.Provider
      value={{
        activities,
        loading,
        error,
        fetchFloatActivity,
        clearFloatActivity,
      }}
    >
      {children}
    </FloatActivityContext.Provider>
  );
};

/* =========================
   HOOK
========================= */

export const useFloatActivity = () => {
  const context = useContext(FloatActivityContext);

  if (!context) {
    throw new Error(
      "useFloatActivity must be used within a FloatActivityProvider"
    );
  }

  return context;
};
