import React, { createContext, useContext, useEffect, useState } from 'react';
import { Account, Customer } from '../../data/mockData';
import { companyId, getEffectiveCompanyId, userPermissions } from '../../constants/appConstants';
import toast from 'react-hot-toast';
import { useAccountNumbers } from './NextAccNumbers';


interface CustomersContextType {
  customers: Customer[];
  customer?: Customer;
  customerLoading: boolean;
  editCustomer: (updatedCustomer: Omit<Customer, 'id' | 'created_at'>) => Promise<void>;
  fetchCustomerById: (customerId: string) => Promise<Customer>;
  refreshCustomers: () => Promise<void>;
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
  const fetchCustomers = async () => {
    setCustomerloading(true);
    console.log(`User permissions: ${JSON.stringify(userPermissions)}`)
    console.log(userPermissions.MANAGE_STAFF);
    try {

      if (!companyId) {
        console.warn('Company ID not found in localStorage');
        return;
      }

      const res = await fetch(`https://susu-pro-backend.onrender.com/api/customers/company/${companyId}`);

      if (res.ok) {
        const data = await res.json();
        setCustomers(data.data); 
      } else {
        const errText = await res.text();
        console.error('Failed to fetch customers:', errText);
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
        console.log(`Customer data: ${data.data}`)
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
    const toastId = 'Editing customer...'
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
        await fetchCustomers();
      } else{
        const errorText = await res.text();
        console.error('Failed to delete customer: ', errorText);
      }
    } catch (error) {
      console.log('Error deleting customer: ', error);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <CustomersContext.Provider value={{ customers, customer, customerLoading, refreshCustomers: fetchCustomers, editCustomer, fetchCustomerById, setCustomers, addCustomer, deleteCustomer  }}>
      {children}
    </CustomersContext.Provider>
  );
};
