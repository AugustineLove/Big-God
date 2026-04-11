import React, { createContext, useContext, useState, useCallback } from 'react';

const BASE_URL = 'https://susu-pro-backend.onrender.com/api';

export interface MomoPendingWithdrawal {
  transaction_id: string;
  amount: string;
  status: string;
  processing_status: string | null;
  withdrawal_type: string | null;
  payment_method: string;
  transaction_date: string;
  unique_code: string | null;
  account_id: string;
  account_number: string;
  account_type: string;
  customer_name: string;
  customer_phone: string;
}

type ProcessingStatus = 'sent' | 'failed';

interface UpdateStatusPayload {
  processing_status: ProcessingStatus;
  agent_note?: string;
  agent_id: string;
}

interface MomoAgentContextType {
  withdrawals: MomoPendingWithdrawal[];
  loading: boolean;
  updatingId: string | null;
  error: string | null;
  fetchPendingWithdrawals: (company_id: string) => Promise<void>;
  updateProcessingStatus: (
    transactionId: string,
    payload: UpdateStatusPayload
  ) => Promise<{ success: boolean; message: string }>;
  getWithdrawalById: (
    transactionId: string,
    company_id: string
  ) => Promise<MomoPendingWithdrawal | null>;
}

const MomoAgentContext = createContext<MomoAgentContextType | undefined>(undefined);

export const MomoAgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [withdrawals, setWithdrawals] = useState<MomoPendingWithdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingWithdrawals = useCallback(async (company_id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BASE_URL}/agent/withdrawals/pending?company_id=${company_id}`
      );
      if (!res.ok) throw new Error('Failed to fetch pending withdrawals');
      const data = await res.json();
      setWithdrawals(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProcessingStatus = useCallback(
    async (transactionId: string, payload: UpdateStatusPayload) => {
      setUpdatingId(transactionId);
      try {
        const res = await fetch(
          `${BASE_URL}/agent/withdrawals/${transactionId}/processing-status`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
        const data = await res.json();
        if (!res.ok) return { success: false, message: data.message || 'Update failed' };

        // Optimistically remove from list if sent/failed — it's no longer "pending"
        setWithdrawals(prev => prev.filter(w => w.transaction_id !== transactionId));
        return { success: true, message: data.message };
      } catch (err: any) {
        return { success: false, message: err.message || 'Unknown error' };
      } finally {
        setUpdatingId(null);
      }
    },
    []
  );

  const getWithdrawalById = useCallback(
    async (transactionId: string, company_id: string) => {
      try {
        const res = await fetch(
          `${BASE_URL}/agent/withdrawals/${transactionId}?company_id=${company_id}`
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.data as MomoPendingWithdrawal;
      } catch {
        return null;
      }
    },
    []
  );

  return (
    <MomoAgentContext.Provider
      value={{
        withdrawals,
        loading,
        updatingId,
        error,
        fetchPendingWithdrawals,
        updateProcessingStatus,
        getWithdrawalById,
      }}
    >
      {children}
    </MomoAgentContext.Provider>
  );
};

export const useMomoAgent = () => {
  const ctx = useContext(MomoAgentContext);
  if (!ctx) throw new Error('useMomoAgent must be used within a MomoAgentProvider');
  return ctx;
};