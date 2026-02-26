import React, { createContext, useContext, useEffect, useState } from 'react';
import { Account, Customer } from '../../data/mockData';
import { companyId, getEffectiveCompanyId, userPermissions } from '../../constants/appConstants';
import toast from 'react-hot-toast';
import { useAccountNumbers } from './NextAccNumbers';
import { TransactionType } from './Transactions';


interface CustomersContextType {
  accounts: Account[];
  transactions: TransactionType[];
  loading: boolean;
  customers: Customer[];
  customer?: Customer;
  customerLoading: boolean;
  contextPaginationMeta: any;
  login: (accountNumber: string, withdrawalCode: string) => Promise<any>;
  editCustomer: (updatedCustomer: Omit<Customer, 'id' | 'created_at'>) => Promise<void>;
  fetchCustomerById: (customerId: string) => Promise<Customer>;
  refreshCustomers: (page: string, limit?: number, filters?: {
  search?: string;
  location?: string;
  status?: string;
  staff?: string;
  dateRange?: string;
}) => Promise<void>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
   addCustomer: (newCustomer: Omit<Customer, 'id' | 'created_at'>, account: string, account_number: string) => Promise<void>;
   deleteCustomer: (customer_id: string) => Promise<void>;
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined);

export const useCustomers = () => {
  const context = useContext(CustomersContext);
  if (!context) {
    throw new Error('useCustomers must be used within a CustomersProvider');
  }
  return context;
};

export const CustomersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerLoading, setCustomerloading] = useState(true);
  const [customer, setCustomer] = useState<Customer>();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [contextPaginationMeta, setPaginationMeta] = useState({
  total: 0, totalPages: 1, currentPage: 1, isSearching: false
});
const fetchCustomers = async (page: string, limit = 20, filters?: {
  search?: string;
  location?: string;
  status?: string;
  staff?: string;
  dateRange?: string;
}) => {
  setCustomerloading(true);
  try {
    if (!companyId) return;

    // Build query string
    const params = new URLSearchParams({ page, limit: String(limit) });
    if (filters?.search)   params.append('search', filters.search);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.status)   params.append('status', filters.status);
    if (filters?.staff)    params.append('staff', filters.staff);
    if (filters?.dateRange) params.append('dateRange', filters.dateRange);

    const res = await fetch(
      `https://susu-pro-backend.onrender.com/api/customers/company/${companyId}?${params.toString()}`
    );

    if (res.ok) {
      const data = await res.json();
      setCustomers(data.data);
      setPaginationMeta({            
        total: data.total,
        totalPages: data.totalPages,
        currentPage: data.page,
        isSearching: data.isSearching,
      });
      return {
        total: data.total,
        totalPages: data.totalPages,
        currentPage: data.page,
        isSearching: data.isSearching
      }
    }
  } catch (err) {
    console.error('Error fetching customers:', err);
  } finally {
    setCustomerloading(false);
  }
};

  const fetchCustomerById = async (customerId?: string) => {
    setCustomerloading(true);
    try{
      const res = await fetch(`https://susu-pro-backend.onrender.com/api/customers/${customerId}`);
      if (res.ok){
        const data = await res.json();
        setCustomer(data.data);
        return data.data;
      }
    } catch(error){
      console.log(error);
    } finally {
      setCustomerloading(false);
    }
  }


  const addAccount = async(newAccount: Omit<Account, 'id' | 'created_at'>)=>{
    try {
      console.log('Adding account for customer');
      const res = await fetch('https://susu-pro-backend.onrender.com/api/accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify(newAccount),
      });
      if (res.ok){
        const added = await res.json();
        console.log('Added account', added);
      }  

    } catch (error) {
      console.log('Error: ', error);
    }
  }

 const editCustomer = async (
  updatedCustomer: Omit<Customer, 'id' | 'created_at'>
) => {
  setCustomerloading(true);
  try {
    const toastId = toast.loading('Editing customer...')
    const res = await fetch(`https://susu-pro-backend.onrender.com/api/customers/customer`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedCustomer),
    });

    if (!res.ok) {
      throw new Error(`Failed to update customer: ${res.statusText}`);
    }
    toast.success('Customer details edited', {id: toastId});
    setCustomerloading(false);
    const data = await res.json();
    return data; // the updated customer object from backend
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};


  const addCustomer = async (newCustomer: Omit<Customer, 'id' | 'created_at'>, account_type:string, account_number: string) => {
    const companyId = getEffectiveCompanyId();
    const token = localStorage.getItem('susupro_token');
    console.log('Company ID in addCustomer: ', companyId);
    try {
      const res = await fetch(`https://susu-pro-backend.onrender.com/api/customers/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',  
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCustomer),
      });
      console.log('Account in the addCustomer function: ', account_type);

      if (res.ok) {
        const added = await res.json();
        console.log('Added customer:', added);
        console.log('Trying to add account: ', account_type)
        await addAccount({
          'account_type': account_type,
          'created_by': newCustomer.registered_by,
          'customer_id': added.data.id,
          'company_id': companyId,
          'balance': 0,
          'account_number': account_number,
        })
        await fetchCustomers();
        return added;
      } else {
        const errorText = await res.text();
        console.error('Failed to add customer:', errorText);
      }
    } catch (err) {
      console.error('Error adding customer:', err);
    }
  };

  const login = async (
  accountNumber: string,
  withdrawalCode: string
) => {
  try {
    setLoading(true);

    const res = await fetch(
      "https://susu-pro-backend.onrender.com/api/customers/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_number: accountNumber.trim(),
          withdrawal_code: withdrawalCode.trim(),
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    // ✅ Store in state
    setCustomer(data.customer);
    setAccounts(data.accounts);
    setTransactions(data.transactions);

    return data;

  } catch (error: any) {
    throw new Error(error.message);
  } finally {
    setLoading(false);
  }
};

  const deleteCustomer = async (customerId: string) => {
    try {
      console.log('Deleting customer: ', customerId);
      const res = await fetch('https://susu-pro-backend.onrender.com/api/customers/delete', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          'customer_id': customerId
        })
      });
      console.log('Deleting account for: ', customerId);
      if(res.ok){
        const deleted = await res.json();
        console.log(deleted);
        await fetchCustomers("1", 20);
      } else{
        const errorText = await res.text();
        console.error('Failed to delete customer: ', errorText);
      }
    } catch (error) {
      console.log('Error deleting customer: ', error);
    }
  }

  useEffect(() => {
    fetchCustomers("1", 20);
  }, []);

  return (
    <CustomersContext.Provider value={{ customers, customer, accounts, transactions, loading, customerLoading, contextPaginationMeta, refreshCustomers: fetchCustomers, editCustomer, fetchCustomerById, setCustomers, addCustomer, deleteCustomer, login  }}>
      {children}
    </CustomersContext.Provider>
  );
};
