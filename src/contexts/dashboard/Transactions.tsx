import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Account, Commission, Customer, Transaction } from '../../data/mockData';
import { useCustomers } from './Customers';
import { useStats } from './DashboardStat';
import { companyId, makeSuSuProName, parentCompanyName } from '../../constants/appConstants';
import toast from 'react-hot-toast';
import { useCommissionStats } from './Commissions';
import { useAccounts } from './Account';

export type TransactionType = {
  transaction_id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'commission';
  description: string;
  transaction_date: string;
  account_number: string;
  customer_name: string;
  customer_phone: string;
  staff_name: string;
  account_type: string;
  status: string;
  account_id?: string;
  customer_id?: string;
  unique_code: string;
  recorded_staff_name?: string;
  mobile_banker_name?: string;
  recorded_staff_id?: string;
  mobile_banker_id?: string;
  reversed_at?: string;
  reversed_by?: string;
  reversal_reason?: string;
  reversed_by_name?: string;
  is_deleted?: boolean;
  withdrawal_type?: string;
};

export interface BulkTransactionPayload {
  account_id: string;
  amount: number;
  transaction_type: "deposit" | "withdrawal";
  staked_by: string;
  company_id: string;
  staff_id: string;
  description?: string;
  unique_code?: string;
  transaction_date?: string;
  withdrawal_type?: string;
}

export interface BulkTransactionResult {
  index: number;
  status: "success" | "failed";
  message?: string;
  transaction?: {
    id: string;
    account_id: string;
    amount: number;
    type: string;
    status: string;
    transaction_date: string;
  };
  updatedAccount?: {
    id: string;
    account_type: string;
    balance: number;
  };
  error?: string;
}

export interface BulkTransactionResponse {
  status: "success" | "partial" | "fail";
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
  results: BulkTransactionResult[];
}


export type TransactionTotals = {
  totalDeposits: number;
  totalWithdrawals: number;
  totalCommissions: number;
  totalPendingDeposits: number;
  totalPendingWithdrawals: number;
  totalApprovedDeposits: number;
  totalApprovedWithdrawals: number;
  totalRejectedTransactions: number;
  netBalance: number;
  transactionCount: number;
};

type TransactionContextType = {
  transactions: TransactionType[];
  withdrawals: TransactionType[];
  customerTransactions: TransactionType[];
  loading: boolean;
  error: string | null;
  totals: TransactionTotals;
  contextPaginationMeta: any;
  deductCommission: (newCommission: Commission, messageData: TransactionType) => Promise<boolean>;
  deleteTransaction: (transactionId: string) => Promise<boolean>;
  fetchCustomerTransactions: (customerId: string) => Promise<void>;
  fetchWithdrawals: (page: string, limit?: number, filters?: {
  search?: string;
  location?: string;
  status?: string;
  staff?: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
}) => Promise<any>;
  refreshTransactions: (page: string, limit?: number, filters?: {
  search?: string;
  location?: string;
  status?: string;
  staff?: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
}) => Promise<any>;
  addTransaction: (newTransaction: Omit<Transaction, 'id' | 'created_at'>, account: Account, customer: Customer, amount: string) => Promise<boolean>;
  addBulkTransactions: (
  rows: Array<{
    payload: BulkTransactionPayload;
    account: Account;
    customer: Customer;
  }>
) => Promise<BulkTransactionResponse>;
  approveTransaction: (transactionId: string, messageData: Record<string, any>, customerId: string, accountId: string, customerPhone: string, amount: string, accountType: string, accountNumber: string) => Promise<boolean>;
  rejectTransaction: (transactionId: string) => Promise<boolean>;
  reverseTransaction: (staffId: string,transactionId: string, reason: string) => Promise<any>;
  transferBetweenAccounts:(payload: {
  from_account_id: string;
  to_account_id:   string;
  amount:          number;
  company_id:      string;
  created_by:      string;
  created_by_type: string;
  description?:    string;
  narration?:      string;
  reason?:         string;

  schedule_type?:        "now" | "later" | "recurring";
  scheduled_at?:         string | null;
  recurring_frequency?:  "weekly" | "biweekly" | "monthly" | null;
  sms_receiver_name?: string;
  sms_receiver_id?: string;
  sms_receiver_phone?: string;
  sms_receiver_account_number?: string;
  to_acc_type?: string;
  to_acc?: string;
  sms_receiver?:          boolean;         
  sms_receiver_template?: string | null;  
  sms_sender?:            boolean;         
  sms_sender_template?:   string | null;
  email_receipt?:         boolean;
  requires_approval?:     boolean;
  reference?:             string;
}) => Promise<any>;
  sendMessage: (messageData: Record<string, any>) => Promise<boolean>;  
};

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

const calculateTotals = (transactions: TransactionType[]): TransactionTotals => {
  const totals: TransactionTotals = {
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalCommissions: 0,
    totalPendingDeposits: 0,
    totalPendingWithdrawals: 0,
    totalApprovedDeposits: 0,
    totalApprovedWithdrawals: 0,
    totalRejectedTransactions: 0,
    netBalance: 0,
    transactionCount: transactions.length,
  };

  transactions.forEach((tx) => {
    const amount = Number(tx.amount) || 0;
    const status = tx.status?.toLowerCase() || '';
    const type = tx.type?.toLowerCase() || '';
    const is_deleted = tx.is_deleted

    if (type === 'deposit' && status !== 'reversed' && !is_deleted) {
      totals.totalDeposits += amount;
      
      if (status === 'approved') {
        totals.totalApprovedDeposits += amount;
      } else if (status === 'pending') {
        totals.totalPendingDeposits += amount;
      }
    } else if (type === 'withdrawal' && status !== 'reversed') {
      totals.totalWithdrawals += amount;
      
      if (status === 'approved') {
        totals.totalApprovedWithdrawals += amount;
      } else if (status === 'pending') {
        totals.totalPendingWithdrawals += amount;
      }
    } else if (type === 'commission' && status !== 'reversed') {
      totals.totalCommissions += amount;
    }

    // Rejected transactions
    if (status === 'rejected') {
      totals.totalRejectedTransactions += amount;
    }
  });

  // Calculate net balance (deposits - withdrawals - commissions)
  totals.netBalance = totals.totalApprovedDeposits - totals.totalApprovedWithdrawals - totals.totalCommissions;

  return totals;
};

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [customerTransactions, setCustomerTransactions] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<TransactionTotals>(calculateTotals([]));
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);


  const { customers, refreshCustomers } = useCustomers();
  const { accounts, refreshAccounts } = useAccounts();
  const { refreshStats } = useStats();
  const [contextPaginationMeta, setPaginationMeta] = useState({
    total: 0, totalPages: 1, currentPage: 1, isSearching: false
  });
 const filters = {
      search:  '',
      location:  'all',
      status:    'all',
      staff:     'all',
      dateRange: 'all',
    };

 const fetchTransactions = useCallback(async (page: string, limit?: number, filters?: {
  search?: string;
  location?: string;
  status?: string;
  staff?: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
}) => {
  try {
    setLoading(true);
    setError(null);

     const params = new URLSearchParams({ page, limit: String(limit) });
    if (filters?.search)   params.append('search', filters.search);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.status)   params.append('status', filters.status);
    if (filters?.staff)    params.append('staff', filters.staff);
    if (filters?.dateRange) params.append('dateRange', filters.dateRange);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const res = await fetch(
      `https://susu-pro-backend.onrender.com/api/transactions/all/${companyId}?${params.toString()}`
    );

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const json = await res.json();

    if (json.status === "success" && Array.isArray(json.data)) {
      setTransactions(json.data);

      // ⚠️ Important: totals now represent only current page
      setTotals(calculateTotals(json.data));

      setTotalPages(json.totalPages);
      setPaginationMeta({
        total: json.total,
        totalPages: json.totalPages,
        currentPage: json.page,
        isSearching: false
      });
      return{
        total: json.total,
        totalPages: json.totalPages,
        currentPage: json.page,
        isSearching: false
      }
    } else {
      throw new Error(json.message || "Failed to fetch transactions");
    }

  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";

    console.error("Error fetching transactions:", errorMessage);
    setError(errorMessage);
    setTransactions([]);
    setTotals(calculateTotals([]));
  } finally {
    setLoading(false);
  }
}, [companyId, page, limit]);


const fetchWithdrawals = useCallback(async (
  page: string,
  limit?: number,
  filters?: {
    search?: string;
    status?: string;
    staff?: string;
    startDate?: string;
    endDate?: string;
  }
) => {
  try {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page,
      limit: String(limit || 20),
    });

    if (filters?.search) params.append("search", filters.search);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.staff) params.append("staff", filters.staff);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const res = await fetch(
      `https://susu-pro-backend.onrender.com/api/transactions/all/withdrawals/${companyId}?${params.toString()}`
    );

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const json = await res.json();

    if (json.status === "success" && Array.isArray(json.data)) {
      setWithdrawals(json.data);

      setTotalPages(json.totalPages);
      setPaginationMeta({
        total: json.total,
        totalPages: json.totalPages,
        currentPage: json.page,
        isSearching: json.isSearching
      });

      return {
        total: json.total,
        totalPages: json.totalPages,
        currentPage: json.page,
        isSearching: json.isSearching
      };
    } else {
      throw new Error(json.message || "Failed to fetch withdrawals");
    }

  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";

    console.error("Error fetching withdrawals:", errorMessage);
    setError(errorMessage);
    setWithdrawals([]);
  } finally {
    setLoading(false);
  }
}, [companyId]);

  const fetchCustomerTransactions = useCallback(async (customerId: string) => {
    if (!customerId) {
      console.error('Customer ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`https://susu-pro-backend.onrender.com/api/transactions/customer/${customerId}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const json = await res.json();
      
      if (json.status === 'success' && Array.isArray(json.data)) {
        setCustomerTransactions(json.data);
      } else {
        throw new Error(json.message || 'Failed to fetch customer transactions');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching customer transactions:', errorMessage);
      setError(errorMessage);
      setCustomerTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTransaction = useCallback(async (newTransaction: Omit<Transaction, 'id' | 'created_at'>, account: Account, customer: Customer, amount: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
     const res = await fetch(`https://susu-pro-backend.onrender.com/api/transactions/stake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTransaction),
      });

      // if (!res.ok) {
      //   toast.error('Failed to add transaction', {id: toastId});
      //   throw new Error(`HTTP error! status: ${res.status}`);
      // }
       console.log(`New transaction body: ${JSON.stringify(newTransaction)}`);
      const json = await res.json();

      if (json.status === 'success') {
        await Promise.all([
          fetchTransactions("1", 20),
          refreshCustomers("1", 20),
          refreshStats(),
        ]);

        
        const updatedAccounts = await refreshAccounts(customer.customer_id);
        const newAccountBalance = updatedAccounts.find(a => a.id === account.id)?.balance;
        
      
      const messageData = {
            messageTo: customer.phone_number,
            message: `You have successfully credited your ${account?.account_type} account with GHS${amount}.00. Your new balance is GHS${newAccountBalance}`,
            messageFrom: makeSuSuProName(parentCompanyName)
        } as Record<string, any>;
        
        if(newTransaction.transaction_type === 'deposit' || newTransaction.transaction_type === 'Deposit'){
          if (messageData && Object.keys(messageData).length > 0){
          sendMessage(messageData).catch(err => 
            console.warn(`Message sending failed but transaction was sent:`, err)
          )
        }
        }
        return true;
      } else if (json.status === 'insufficient_balance') {
        // setError('Insufficient balance for this transaction');
        return false;
      } else if (json.status === 'minimum_balance') {
        return false;
      } 
       else {
        throw new Error(json.message || 'Failed to add transaction');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error adding transaction:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTransactions, refreshCustomers, refreshStats]);

  const addBulkTransactions = useCallback(
  async (
    rows: Array<{
      payload: BulkTransactionPayload;
      account: Account;
      customer: Customer;
    }>
  ): Promise<BulkTransactionResponse> => {
    setLoading(true);
    setError(null);

    // Shape the array the backend expects
    const transactions: BulkTransactionPayload[] = rows.map((r) => r.payload);

    try {
      const res = await fetch(`https://susu-pro-backend.onrender.com/api/transactions/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions }),
      });

      const json: BulkTransactionResponse = await res.json();

      // ── Refresh global state ──────────────────────────────────────────────
      if (json.summary.succeeded > 0) {
        await Promise.all([
          fetchTransactions("1", 20),
          refreshCustomers("1", 20),
          refreshStats(),
        ]);
      }

      // ── Post-success side-effects per row ─────────────────────────────────
      for (const result of json.results) {
        if (result.status !== "success") continue;

        const row = rows[result.index];
        if (!row) continue;

        const { account, customer, payload } = row;

        // Refresh that customer's accounts to get the latest balance
        const updatedAccounts = await refreshAccounts(customer.customer_id);
        const newBalance =
          updatedAccounts?.find((a: Account) => a.id === account.id)?.balance ??
          result.updatedAccount?.balance;

        // Send SMS only for deposits
        if (
          payload.transaction_type === "deposit" ||
          payload.transaction_type === ("Deposit" as any)
        ) {
          const messageData = {
            messageTo: customer.phone_number,
            message: `You have successfully credited your ${account.account_type} account with GHS${payload.amount}.00. Your new balance is GHS${newBalance}`,
            messageFrom: makeSuSuProName(parentCompanyName),
          };

          sendMessage(messageData).catch((err) =>
            console.warn(
              `[bulkTransaction] SMS failed for row ${result.index} but transaction succeeded:`,
              err
            )
          );
        }
      }

      return json;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      console.error("[addBulkTransactions] Error:", errorMessage);
      setError(errorMessage);

      // Return a shaped failure so callers don't need to null-check
      return {
        status: "fail",
        summary: { total: rows.length, succeeded: 0, failed: rows.length },
        results: rows.map((_, i) => ({
          index: i,
          status: "failed",
          message: errorMessage,
        })),
      };
    } finally {
      setLoading(false);
    }
  },
  [fetchTransactions, refreshCustomers, refreshStats, refreshAccounts]
);


  const deductCommission = useCallback(async (newCommission: Commission, messageData: TransactionType): Promise<boolean> => {
    const accountId = newCommission.account_id;
    console.log(`Commission data: ${JSON.stringify(newCommission)}`)
    
    if (!accountId) {
      console.error('Account ID is required for commission deduction');
      setError('Account ID is required');
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`https://susu-pro-backend.onrender.com/api/transactions/commission/${accountId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCommission),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();

      if (json.status === 'success') {
        await Promise.all([
          fetchTransactions("1", 20),
          refreshCustomers("1", 20),
          refreshStats(),
        ]);

         const updatedAccounts = await refreshAccounts(messageData.customer_id);
        const newAccountBalance = updatedAccounts.find(a => a.id === accountId)?.balance;
        console.log(`New account balance: ${newAccountBalance}`)

      
      const finalMessageData = {
            messageTo: messageData.customer_phone,
            message: `An amount of GHS${messageData.amount} has been debited from your ${messageData.account_number} ${messageData.account_type} account. Deducted commission is GHS${newCommission.amount}.00. Your new balance is GHS${newAccountBalance}`,
            messageFrom: makeSuSuProName(parentCompanyName)
        } as Record<string, any>;
        
        // Send message (don't block on failure)
        if (finalMessageData && Object.keys(finalMessageData).length > 0) {
          sendMessage(finalMessageData).catch(err => 
            console.warn('Message sending failed but transaction was approved:', err)
          );
        }

        return true;
      } else {
        throw new Error(json.message || 'Failed to deduct commission');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error deducting commission:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTransactions, refreshCustomers, refreshStats]);

  const deleteTransaction = useCallback(async (transactionId: string): Promise<boolean> => {
    if (!transactionId) {
      console.error('Transaction ID is required');
      setError('Transaction ID is required');
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`https://susu-pro-backend.onrender.com/api/transactions/${transactionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      await fetchTransactions("1", 20);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error deleting transaction:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTransactions, companyId]);

  const sendMessage = useCallback(async (messageData: Record<string, any>): Promise<boolean> => {
    try {
      const res = await fetch('https://susu-pro-backend.onrender.com/api/messages/send-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();

      if (json.status === 'success') {
        return true;
      } else {
        throw new Error(json.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      return false;
    }
  }, []);

  const approveTransaction = useCallback(async (
    transactionId: string,
    messageData: Record<string, any>,
    customerId: string,
    accountId:string,
    customerPhone: string,
    amount: String,
    accountType: string,
    accountNumber: string
  ): Promise<boolean> => {
    if (!transactionId) {
      console.error('Transaction ID is required');
      setError('Transaction ID is required');
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(
        `https://susu-pro-backend.onrender.com/api/transactions/${transactionId}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          }
      );

      if (!res.ok) {
      const err = await res.json();
      console.error("Approve error:", err);
      throw new Error(err.message || "Approval failed");
    }


      const json = await res.json();

      if (json.status === 'success') {
        await Promise.all([
          fetchTransactions("1", 20),
          refreshCustomers("1", 20),
          refreshStats(),
        ]);

       
        
        return true;
      } else {
        throw new Error(json.message || 'Transaction approval failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error approving transaction:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTransactions, refreshCustomers, refreshStats, sendMessage]);

  const rejectTransaction = useCallback(async (transactionId: string): Promise<boolean> => {
    if (!transactionId) {
      console.error('Transaction ID is required');
      setError('Transaction ID is required');
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(
        `https://susu-pro-backend.onrender.com/api/transactions/${transactionId}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();

      if (json.status === 'success') {
        setTransactions(prev =>
          prev.map(tx =>
            tx.transaction_id === transactionId ? { ...tx, status: 'rejected' } : tx
          )
        );
        // Recalculate totals after status update
        setTotals(calculateTotals(transactions));
        return true;
      } else {
        throw new Error(json.message || 'Transaction rejection failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error rejecting transaction:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [transactions]);

    const reverseTransaction = async (
    staffId: string,
    transactionId: string,
    reason: string
    ) => {
    if (!transactionId || !reason) {
      throw new Error("Transaction ID and reason are required");
    }
    const toastId = 'Reversing transaction...';
    try {
    setLoading(true);
    const res = await fetch(
      `https://susu-pro-backend.onrender.com/api/transactions/${transactionId}/reverse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          staffId,
          reason,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to reverse transaction");
    }
    toast.success("Transaction reversed successfully", { id: toastId });
    // ✅ Refresh transactions / balances
    await fetchTransactions("1", 20);
    await refreshCustomers("1", 20);

    return data;
  } catch (error: any) {
    console.error("Reverse transaction error:", error);
    throw error;
  } finally {
    setLoading(false);
    }
  };

  // ─── Updated transferBetweenAccounts ─────────────────────────────────────────
// Drop-in replacement for the function inside your Transactions context.
// Accepts the full transfer payload (including SMS/notification flags) and
// fires SMS messages to receiver and/or sender after a successful transfer.

const transferBetweenAccounts = async (payload: {
  from_account_id: string;
  to_account_id:   string;
  amount:          number;
  company_id:      string;
  created_by:      string;
  created_by_type: string;
  description?:    string;
  narration?:      string;
  reason?:         string;

  schedule_type?:        "now" | "later" | "recurring";
  scheduled_at?:         string | null;
  recurring_frequency?:  "weekly" | "biweekly" | "monthly" | null;
  sms_receiver_name?: string;
  sms_receiver_id?: string;
  sms_receiver_phone?: string;
  sms_receiver_account_number?: string;
  to_acc_type?: string;
  to_acc?: string;
  sms_receiver?:          boolean;         
  sms_receiver_template?: string | null;  
  sms_sender?:            boolean;         
  sms_sender_template?:   string | null;
  email_receipt?:         boolean;
  requires_approval?:     boolean;
  reference?:             string;
}) => {
  try {
    setLoading(true);
    const toastId = toast.loading(`Transferring GHS ${payload.amount.toLocaleString()}...`);

    const res = await fetch(
      `https://susu-pro-backend.onrender.com/api/transactions/transfer-money`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      }
    );
    console.log(JSON.stringify(payload))

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.message ?? "Transfer failed", { id: toastId });
      throw new Error(data.message ?? "Transfer failed");
    }

    // ── 2. Refetch transactions to keep the list fresh ────────────────────────
    await Promise.all([
          fetchTransactions("1", 20),
          refreshCustomers("1", 20),
          refreshStats(),
        ]);
    const updatedAccounts = await refreshAccounts(payload.sms_receiver_id);
        const newAccountBalance = updatedAccounts.find(a => a.id === data?.data?.to_account_id)?.balance;
        

    toast.success("Transfer successful", { id: toastId });

    const fromAccount = data?.data?.from_account_id;
    const toAccount   = data?.data?.to_account_id;
    const reference   = payload.reference ?? data?.data?.reference ?? "";
    const date        = new Date().toLocaleDateString("en-GH", {
      year: "numeric", month: "short", day: "numeric",
    });

    // ── Helper: resolve a template's {vars} ──────────────────────────────────
    const resolveTemplate = (
      template: string,
      vars: Record<string, string>
    ): string =>
      Object.entries(vars).reduce(
      (tpl, [key, val]) =>
        tpl.replace(new RegExp(`{${key}}`, 'g'), val),
      template
    );

    // ── 4. SMS to RECEIVER (credited account) — priority ─────────────────────
    if (payload.sms_receiver) {
      const template =
        `${payload.sms_receiver_template}\nNew Balance: GHS${newAccountBalance}` ??
        `Dear {receiver_name}, GHS {amount} has been credited to your {to_acc_type} account {to_acc} on {date}. Ref: {ref}\nNew Balance: GHS${newAccountBalance}`;

      const message = resolveTemplate(template, {
        receiver_name: payload.sms_receiver_name           ?? "",
        amount:        payload.amount.toLocaleString("en-GH", { minimumFractionDigits: 2 }),
        to_acc:        payload.to_acc            ?? "",
        to_acc_type:   payload.to_acc_type              ?? "",
        from_acc:      fromAccount?.account_number         ?? "",
        from_acc_type: fromAccount?.account_type           ?? "",
        date,
        ref:   payload.description ?        reference : "",
      });

      const receiverMessageData = {
        messageTo:   payload.sms_receiver_phone,
        message,
        messageFrom: makeSuSuProName(parentCompanyName),
      };
      console.log(receiverMessageData)
      sendMessage(receiverMessageData).catch((err) =>
        console.warn(
          `[transferBetweenAccounts] SMS to receiver failed but transfer succeeded:`,
          err
        )
      );
    }

    // ── 5. SMS to SENDER (debited account) ───────────────────────────────────
    if (payload.sms_sender && fromAccount?.customer?.phone_number) {
      const template =
        payload.sms_sender_template ??
        `Dear {sender_name}, GHS {amount} has been debited from your {from_acc_type} account {from_acc} on {date}. Ref: {ref}`;

      const message = resolveTemplate(template, {
        sender_name:   fromAccount.customer?.name          ?? "",
        amount:        payload.amount.toLocaleString("en-GH", { minimumFractionDigits: 2 }),
        from_acc:      fromAccount.account_number          ?? "",
        from_acc_type: fromAccount.account_type            ?? "",
        to_acc:        toAccount?.account_number           ?? "",
        to_acc_type:   toAccount?.account_type             ?? "",
        date,
        ref:           reference,
      });

      const senderMessageData = {
        messageTo:   fromAccount.customer.phone_number,
        message,
        messageFrom: makeSuSuProName(parentCompanyName),
      };

      sendMessage(senderMessageData).catch((err) =>
        console.warn(
          `[transferBetweenAccounts] SMS to sender failed but transfer succeeded:`,
          err
        )
      );
    }

    // ── 6. Return ─────────────────────────────────────────────────────────────
    return {
      success: true,
      message: data.message,
      data:    data.data,
    };

  } catch (err: any) {
    setError(err.message ?? "Unable to transfer funds");
    return {
      success: false,
      message: err.message,
    };
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchTransactions("1", 20);
    fetchWithdrawals("1", 20);
  }, [fetchTransactions, fetchWithdrawals]);

  const value: TransactionContextType = {
    transactions,
    customerTransactions,
    loading,
    error,
    withdrawals,
    totals,
    contextPaginationMeta,
    deductCommission,
    deleteTransaction,
    fetchWithdrawals,
    fetchCustomerTransactions,
    refreshTransactions: fetchTransactions,
    addTransaction,
    addBulkTransactions,
    approveTransaction,
    rejectTransaction,
    reverseTransaction,
    transferBetweenAccounts,
    sendMessage,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};