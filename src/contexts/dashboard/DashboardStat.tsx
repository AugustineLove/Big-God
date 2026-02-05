// src/context/StatsContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

interface Stats {
  totalCustomers: number;
  totalTransactions: number;
  totalBalance: number;
  totalCommissions: number;
}

interface StatsContextType {
  stats: Stats | null;
  loading: boolean;
  refreshStats: () => void;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
};

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('susupro_token');
      const res = await fetch('https://susu-pro-backend.onrender.com/api/companies/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.data);
      } else {
        const message = await res.text(); // 🔁 use .text() for non-JSON errors
        console.error('Login failed:', message);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <StatsContext.Provider value={{ stats, loading, refreshStats: fetchStats }}>
      {children}
    </StatsContext.Provider>
  );
};
