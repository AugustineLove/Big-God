import React, { createContext, useContext, useEffect, useState } from 'react';
import { Account, Customer } from '../../data/mockData';
import { companyId, userUUID } from '../../constants/appConstants';
import toast from 'react-hot-toast';

interface AccountsContextType {
  selectedAgent: Customer;
  accounts: Account[];
  allAccounts: Account[];
  customerLoans: Account[];
  companyLoans: Account[];
  loading: boolean;
  loadingLoans: boolean;
  addAccount: (newAccount: Omit<Account, 'id' | 'created_at'>) => Promise<boolean>;
  refreshAccounts: (customerId: string) => any;
  refreshAllCompanyAccounts: () => any;
  fetchLoanAccounts: (companyId: string) => void;
  toggleAccountStatus: (accountId: string) => void;
  fetchCustomerByAccountNumber: (accountNumber: string) => Promise<any>;
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

export const useAccounts = () => {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  return context;
};

export const AccountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [customerLoans, setCustomerLoans] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyLoans, setCompanyLoans] = useState<Account[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Customer | null>(null);


  const fetchAllCompanyLoans = async (companyId: string) => {

  setLoadingLoans(true);

  try {

    const res = await fetch(
      `http://localhost:5000/api/loans/all/${companyId}`
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Loan fetch error:", errorText);
      setCompanyLoans([]);
      return;
    }

    const data = await res.json();

    console.log(`Company loans: ${data}`);

    setCompanyLoans(
      Array.isArray(data?.data) ? data.data : []
    );

  } catch (error) {

    console.error("Error fetching company loans:", error);

    setCompanyLoans([]);

  } finally {
    setLoadingLoans(false);
  }

};



  const fetchAccounts = async (customerId: string) => {
    setLoading(true);
    try {
        const res = await fetch(`http://localhost:5000/api/accounts/customer/${customerId}`);
      if (!res.ok) {
        const errorText = await res.text();
        return;
      }
      const data = await res.json();
        setAccounts(
      Array.isArray(data?.data)
        ? data.data
        : []
    );
    
     setCustomerLoans(
          Array.isArray(data?.data.loans) ? data.data.loans : []
        )
        return data.data;
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerByAccountNumber = async (accountNumber: string) => {
  try {
    const res = await fetch(
      `http://localhost:5000/api/customers/account/${accountNumber}`
    );

    if (!res.ok) {
      console.error("Customer not found");
      return null;
    }

    const data = await res.json();
    console.log(data);
    setSelectedAgent(data.data);
    return data.data;

  } catch (error) {
    console.error("Error fetching customer:", error);
    return null;
  }
};

  const getAllCompanyAccounts = async () => {
    setLoading(true);
    try {
        const res = await fetch(`http://localhost:5000/api/accounts/company/${companyId}`);
      if (!res.ok) {
        const errorText = await res.text();
        console.log(errorText);
        return;
      }
      const data = await res.json();
        setAllAccounts(
      Array.isArray(data?.data)
        ? data.data
        : []
    );
    
     setCustomerLoans(
          Array.isArray(data?.data.loans) ? data.data.loans : []
        )
        return data.data;
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAccount = async(newAccount: Omit<Account, 'id' | 'created_at'>)=>{
      try {
        const res = await fetch('http://localhost:5000/api/accounts/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify(newAccount),
        });
        if (res.ok){
          const added = await res.json();
          return true;
        }  
        return false;
      } catch (error) {
        console.log('Error: ', error);
        return false;
      }
    }

    const toggleAccountStatus = async (accountId: string) => {
    try {
    setLoading(true);
    const toastId = toast.loading(`Updating...`)
    const res = await fetch(
      `http://localhost:5000/api/accounts/${accountId}/toggle-status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_id: companyId,
          staff_id: userUUID,
        }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message);
        }

        // 🔁 Update locally
        setAccounts(prev =>
          prev.map(acc =>
            acc.id === accountId ? data.data : acc
          )
        );

        toast.success(data.message, {id: toastId});

      } catch (err: any) {
        toast.error(err.message || "Failed to update account status");
      } finally {
        setLoading(false);
      }
    };


    useEffect(() => {
    fetchAllCompanyLoans(companyId);
    }, []);

  return (
    <AccountsContext.Provider value={{ accounts, selectedAgent, customerLoans, companyLoans, loading, loadingLoans, refreshAccounts: fetchAccounts, refreshAllCompanyAccounts: getAllCompanyAccounts, addAccount, setAccounts, fetchLoanAccounts: fetchAllCompanyLoans, toggleAccountStatus, allAccounts, fetchCustomerByAccountNumber }}>
      {children}
    </AccountsContext.Provider>
  );
};
