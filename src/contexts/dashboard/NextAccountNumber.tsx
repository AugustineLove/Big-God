import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useStaff } from './Staff';

/* =======================
   Types
======================= */

interface AccountNumberContextType {
  nextAccountNumber: string | null;
  loading: boolean;
  refreshAccountNumber: (staffId: string) => Promise<void>;
}

interface Props {
  staffId: string | null;
  children: ReactNode;
}

/* =======================
   Context
======================= */

const AccountNumberContext = createContext<AccountNumberContextType | undefined>(
  undefined
);

/* =======================
   Helper
======================= */

const generateNextAccountNumber = (last: string | null) => {
  if (!last) return 'BGSE001001';

  const match = last.match(/(\d+)$/);
  if (!match) return last;

  const number = match[1];
  const prefix = last.slice(0, -number.length);

  const nextNumber = (parseInt(number, 10) + 1)
    .toString()
    .padStart(number.length, '0');

  return `${prefix}${nextNumber}`;
};

/* =======================
   Provider
======================= */

export const AccountNumberProvider = ({children}: {children: ReactNode}) => {
  const [nextAccountNumber, setNextAccountNumber] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const {staffList, loading: staffLoading} = useStaff();
  const mobileBankers = staffList.filter(staff => staff.role === 'mobile_banker');

  const fetchLastAccountNumber = async (staffId: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://susu-pro-backend.onrender.com/api/accounts/last-account-number/${staffId}`
      );

    //   const last = res.data?.lastAccountNumber ?? null;
      const data = await res.json();
        const last = data?.data?.lastAccountNumber ?? null;
        console.log('Last account number fetched:', data);
      const next = generateNextAccountNumber(last);

      setNextAccountNumber(next);
    } catch (err) {
      console.error('Failed to fetch last account number', err);
      setNextAccountNumber(null);
    } finally {
      setLoading(false);
    }
  };

  /* Auto-fetch when staff is known */
//   useEffect(() => {
//     if (staffId) {
//       fetchLastAccountNumber(staffId);
//     } else {
//       setNextAccountNumber(null);
//     }
//   }, [staffId]);

  return (
    <AccountNumberContext.Provider
      value={{
        nextAccountNumber,
        loading,
        refreshAccountNumber: fetchLastAccountNumber,
      }}
    >
        {children}
    </AccountNumberContext.Provider>
  );
};

/* =======================
   Hook
======================= */

export const useAccountNumber = () => {
  const context = useContext(AccountNumberContext);
  if (!context) {
    throw new Error(
      'useAccountNumber must be used within AccountNumberProvider'
    );
  }
  return context;
};
