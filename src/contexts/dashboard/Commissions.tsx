// context/CommissionStatsContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { Commission, CommissionStats } from "../../data/mockData";
import { companyId } from "../../constants/appConstants";
interface CommissionStatsContextType {
  commissionStats: CommissionStats | null;
  commissions: Commission[];
  loading: boolean;
  error: string | null;

  refreshCommissionStats: () => Promise<void>;
  fetchCommissions: () => Promise<void>;
}

const CommissionStatsContext =
  createContext<CommissionStatsContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export const CommissionStatsProvider: React.FC<Props> = ({
  children,
}) => {
  const [commissionStats, setStats] = useState<CommissionStats | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /* 🔹 Fetch stats */
  const refreshCommissionStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`https://susu-pro-backend.onrender.com/api/commissions/stats/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch commission stats");

      const json = await res.json();
      console.log(`Commission stats ${json.data}`)
      setStats(json.data.stats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* 🔹 Fetch all commissions */
  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`https://susu-pro-backend.onrender.com/api/commissions/all/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch commissions");

      const json = await res.json();
      console.log(`Commissions: ${JSON.stringify(json.data)}`)
      setCommissions(json.data.commissions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      refreshCommissionStats();
      fetchCommissions();
    }
  }, [companyId]);

  return (
    <CommissionStatsContext.Provider
      value={{
        commissionStats,
        commissions,
        loading,
        error,
        refreshCommissionStats,
        fetchCommissions,
      }}
    >
      {children}
    </CommissionStatsContext.Provider>
  );
};

export const useCommissionStats = () => {
  const context = useContext(CommissionStatsContext);
  if (!context) {
    throw new Error(
      "useCommissionStats must be used within CommissionStatsProvider"
    );
  }
  return context;
};
