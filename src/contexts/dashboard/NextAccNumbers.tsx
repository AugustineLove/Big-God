import React, { createContext, useContext, useEffect, useState } from 'react';

interface StaffAccountNumber {
  staff_id: string;
  staff_name: string;
  last_account_number: string | null;
  staff_account_number?: string;
}

interface AccountNumberContextType {
  data: StaffAccountNumber[];
  getNextAccountNumber: (staffId: string) => string | null;
  fetchLastAccountNumbers: () => Promise<void>;
  loading: boolean;
}

const AccountNumberContext = createContext<AccountNumberContextType | null>(null);

export const AccountNumberProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<StaffAccountNumber[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLastAccountNumbers = async () => {
      try {
        const res = await fetch(
          `https://susu-pro-backend.onrender.com/api/accounts/last-account-numbers`
        );
        const json = await res.json();
        console.log(`Staff account numbers: ${JSON.stringify(json.data)}`);
        setData(json.data);
      } catch (error) {
        console.error('Failed to fetch account numbers', error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    const fetchLastAccountNumbers = async () => {
      try {
        const res = await fetch(
          `https://susu-pro-backend.onrender.com/api/accounts/last-account-numbers`
        );
        const json = await res.json();
        console.log(`Staff account numbers: ${JSON.stringify(json.data)}`);
        setData(json.data);
      } catch (error) {
        console.error('Failed to fetch account numbers', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLastAccountNumbers();
  }, []);

const getNextAccountNumber = (staffId: string) => {
  const staff = data.find(s => s.staff_id === staffId);
  if (!staff) return null;

  const last = staff.last_account_number;

  // First account ever
  if (!last) {
    return `${staff.staff_account_number}0001`;
  }

  // Check if the account number contains a hyphen
  if (last.includes('-')) {
    // Format: TWS01-001
    const [base, counter] = last.split('-');
    
    // Safety check
    if (isNaN(Number(counter))) {
      return `${base}-001`;
    }
    
    const next = Number(counter) + 1;
    const paddedNext = next.toString().padStart(counter.length, '0');
    
    return `${base}-${paddedNext}`;
  } else {
    // Format: BGSE0100001 (first 7 chars are base, last 4 are counter)
    const base = last.slice(0, 7);
    const counter = last.slice(7);
    
    // Safety check
    if (isNaN(Number(counter))) {
      return `${base}0001`;
    }
    
    const next = Number(counter) + 1;
    const paddedNext = next.toString().padStart(counter.length, '0');
    
    console.log(`Next account number for staff ${staffId} is ${base}${paddedNext}`);
    return `${base}${paddedNext}`;
  }
};



  return (
    <AccountNumberContext.Provider value={{ data, getNextAccountNumber, loading, fetchLastAccountNumbers: fetchLastAccountNumbers }}>
      {children}
    </AccountNumberContext.Provider>
  );
};

export const useAccountNumbers = () => {
  const context = useContext(AccountNumberContext);
  if (!context) {
    throw new Error('useAccountNumbers must be used within AccountNumberProviders');
  }
  return context;
};
