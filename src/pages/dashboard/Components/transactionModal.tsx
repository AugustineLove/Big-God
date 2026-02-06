import { useState, useContext, createContext, useEffect, useRef } from "react";
import { 
  DollarSign, 
  CreditCard, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Search, 
  User, 
  Calendar,
  FileText,
  UserCheck,
  CheckCircle,
  X,
  Wallet,
  Building2
} from "lucide-react";
import { useCustomers } from "../../../contexts/dashboard/Customers";
import { useStaff } from "../../../contexts/dashboard/Staff";
import { useAccounts } from "../../../contexts/dashboard/Account";
import { companyId, companyName, makeSuSuProName, parentCompanyName, userRole, userUUID } from "../../../constants/appConstants";
import { useTransactions } from "../../../contexts/dashboard/Transactions";
import toast from 'react-hot-toast';


interface Customer {
  company_id?: string;
  id: string;
  name: string;
  email: string;
  phone_number: string;
  address?: string;
  area?: string;
  city?: string;
  registered_by_name?: string;
  created_at: string;
  location: string;
  daily_rate: string;
  total_balance: string;
  total_transactions: string;
  id_card?: string;
  next_of_kin?: string;
  date_of_registration?: string;
  gender?: string;
  registered_by?: string;
  customer_id?: string; 
  total_balance_across_all_accounts?: string;
  account_number?: string;
}

interface Account {
  id: string;
  account_number: string;
  account_type: string;
  balance: number;
  created_at: string;
  customer_id?: string;
}

interface Transaction {
  id?: string;
  account_id: string;
  amount: number;
  transaction_type: string;
  description?: string;
  transaction_date?: string;
  staked_by: string;
  company_id: string;
  status: string;
}


interface TransactionModalProps {
  transaction?: Transaction | null;
  onSave: (transaction: any) => void;
  onClose: () => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ transaction, onSave, onClose }) => {
  const { customers, customerLoading: customersLoading, refreshCustomers, fetchCustomerById } = useCustomers();
  const { staffList, loading: staffLoading } = useStaff();
  const { accounts, refreshAccounts, setAccounts } = useAccounts();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    account_id: transaction?.account_id || '',
    amount: transaction?.amount?.toString() || '',
    transaction_type: transaction?.transaction_type || 'deposit' as 'deposit' | 'withdrawal',
    description: transaction?.description || '',
    transaction_date: transaction?.transaction_date 
      ? new Date(transaction.transaction_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    staked_by: selectedCustomer?.registered_by || transaction?.staked_by || '',
    company_id: companyId,
    staff_id: userUUID,
    withdrawal_type: ''
  });

  const [customerSearch,  setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addTransaction, refreshTransactions, loading } = useTransactions();
  const [loadingAccounts, setLoadingAccounts] = useState(false);

useEffect(() => {
  const loadAccounts = async () => {
    if (!selectedCustomer) return;

    setLoadingAccounts(true);
    setAccounts([]);

    await refreshAccounts(selectedCustomer.id);
    setLoadingAccounts(false);
  };

  loadAccounts();
}, [selectedCustomer]);

  useEffect(() => {
    if (selectedCustomer) {
      formData.staked_by = selectedCustomer.registered_by || '';
    }
  }, [selectedCustomer]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get Mobile Bankers
  const mobileBankers = staffList.filter(staff => staff.role === 'Mobile Banker' || staff.role === 'mobile banker' || staff.role === 'mobile_banker' || staff.role === 'teller');

  // Filter customers based on search
const filteredCustomers = customers.filter(customer =>
  (customer.name || "").toLowerCase().includes(customerSearch.toLowerCase()) ||
  (customer.phone_number || "").toLowerCase().includes(customerSearch.toLowerCase()) ||
  (customer.email || "").toLowerCase().includes(customerSearch.toLowerCase()) ||
  (customer.account_number || "").toLowerCase().includes(customerSearch.toLowerCase())
);

  // Set initial customer and account if editing
  useEffect(() => {
    if (transaction?.account_id) {
      // Find the account first
      const account = accounts.find(acc => acc.id === transaction.account_id);
      if (account) {
        setSelectedAccount(account);
        // Find the customer who owns this account
        const customer = customers.find(c => c.id === account.customer_id);
        if (customer) {
          setSelectedCustomer(customer);
          setCustomerSearch(customer.name);
          // Load accounts for this customer
          refreshAccounts(customer.customer_id || customer.id);
        }
      }
    }
  }, [transaction, customers, refreshAccounts]);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCustomerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerSearch(value);
    setShowCustomerDropdown(true);
    
    if (!value) {
      setSelectedCustomer(null);
      setSelectedAccount(null);
      setFormData(prev => ({ ...prev, account_id: '' }));
    }

    if (errors.account_id) {
      setErrors(prev => ({ ...prev, account_id: '' }));
    }
  };

  const selectCustomer = (customer: Customer) => {
    console.log('Selected customer:', customer.customer_id);
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
    
    // Reset account selection when customer changes
    setSelectedAccount(null);
    setFormData(prev => ({ ...prev, account_id: '' }));
    
    // Fetch accounts for the selected customer
    console.log(customer)
    refreshAccounts(customer.customer_id);
    
    if (errors.account_id) {
      setErrors(prev => ({ ...prev, account_id: '' }));
    }
  };

  const selectAccount = (account: Account) => {
    setSelectedAccount(account);
    setFormData(prev => ({ ...prev, account_id: account.id }));
    
    if (errors.account_id) {
      setErrors(prev => ({ ...prev, account_id: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.account_id) newErrors.account_id = 'Please select a customer account';
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }
    if (!formData.staked_by) newErrors.staked_by = 'Please select who is creating this transaction';
    if(!formData.description || formData.description == '') newErrors.description = 'Description is required';
    // if( formData.transaction_type === 'withdrawal' && !formData.withdrawal_type || formData.withdrawal_type == '') newErrors.withdrawal_type = 'Please select withdrawal type';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    const toastId= toast.loading('Adding transaction...');
    if (!validateForm()){
       toast.error('Please complete the form.', {id: toastId});
       return
    };
    const status = formData.transaction_type === 'withdrawal' ? 'pending' : 'completed';
    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount),
      transaction_date: new Date(formData.transaction_date).toISOString(),
      company_id: companyId,
      unique_code: '',
      status: status,
    };
    console.log(`Selected customer data: ${JSON.stringify(selectedCustomer)}`)
    
    
    console.log('Submitting transaction:', transactionData);
    const addBool = await addTransaction(transactionData, selectedAccount, selectedCustomer, formData.amount);
    if (addBool === true) {
      toast.success('Transaction successfully created', {id: toastId});
      onClose();
      refreshTransactions();
      refreshCustomers();
    };
    if (transaction) {
      onSave({ ...transaction, ...transactionData });
    } else {
      // onSave(transactionData);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-tr-2xl rounded-tl-2xl shadow-2xl max-w-2xl w-full flex flex-col h-[70vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                {transaction ? 'Edit Transaction' : 'New Transaction'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Customer Selection Section */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-emerald-600" />
                  Customer Selection
                </h4>
              </div>

              <div className="md:col-span-2 relative">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Search className="w-4 h-4 mr-2 text-gray-500" />
                  Search Customer
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={customerSearch}
                    onChange={handleCustomerSearch}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="Type customer name, account number, phone, or email..."
                    className={`w-full px-4 py-3 pr-10 border rounded-xl focus:ring-2 focus:ring-emerald-500 transition-colors ${
                      errors.account_id 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-emerald-500'
                    }`}
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  
                  {selectedCustomer && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </div>
                  )}
                </div>

                {/* Customer Dropdown */}
                {showCustomerDropdown && customerSearch && (
                  <div 
                    ref={dropdownRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                  >
                    {customersLoading ? (
                      <div className="p-4 text-center text-gray-500">Loading customers...</div>
                    ) : filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => selectCustomer(customer)}
                          className="p-4 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                            <div className="flex items-center justify-center">
                              <div className="font-medium text-gray-900">{customer.name}</div>
                              <div className="text-sm text-gray-500 ml-2"> {customer.account_number || 'N/A'}</div>
                            </div>
                              <div className="text-sm text-gray-500">{customer.phone_number}</div>
                              <div className="text-xs text-gray-400">{customer.email}</div>
                            <div className="text-xs text-gray-400">{customer.registered_by_name}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-emerald-600">
                                ¢{parseFloat(customer.total_balance_across_all_accounts || '0').toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {customer.total_transactions} transactions
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No customers found matching "{customerSearch}"
                      </div>
                    )}
                  </div>
                )}

                {errors.account_id && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.account_id}
                  </p>
                )}

                {/* Selected Customer Display */}
                {selectedCustomer && (
                  <div className="mt-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div>
                          <div className="font-medium text-emerald-900">{selectedCustomer.name}</div>
                        <div className="font-medium text-emerald-900 text-sm">{selectedCustomer.account_number}</div>
                        <div className="text-sm text-emerald-700">{selectedCustomer.phone_number}</div>

                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-emerald-600">
                          ¢{parseFloat(selectedCustomer.total_balance_across_all_accounts || '0').toLocaleString()}
                        </div>
                        <div className="text-xs text-emerald-600">Current Balance</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Account Selection */} 
{selectedCustomer && (
  <div>
    {loadingAccounts ? (
      /* 🔹 Loader */
      <div className="flex justify-center items-center py-10">
        <svg
          className="w-6 h-6 animate-spin text-emerald-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        <span className="ml-3 text-gray-600">Loading accounts...</span>
      </div>
    ) : accounts.length > 0 ? (
      /* 🔹 Accounts */
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
          <Wallet className="w-4 h-4 mr-2 text-gray-500" />
          Select Account
          <span className="text-red-500 ml-1">*</span>
        </label>

        <div className="space-y-3">
          {accounts.map((account) => {
            const isNormalAccount = account.account_type.toLowerCase() === "normal";
            const isTellerRestricted =
              userRole === "teller" && isNormalAccount || account.status === 'Inactive';

            const isSelected = selectedAccount?.id === account.id;

            return (
              <div
                key={account.id}
                onClick={() => {
                  if (!isTellerRestricted) {
                    selectAccount(account);
                  }
                }} 
                className={`
                  p-4 border-2 rounded-xl transition-all
                  ${
                    isTellerRestricted
                      ? "opacity-40 cursor-not-allowed bg-gray-50"
                      : "cursor-pointer hover:shadow-md"
                  }
                  ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50 shadow-md"
                      : "border-gray-200 hover:border-emerald-300"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  {/* Left */}
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected
                          ? "bg-emerald-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <Building2
                        className={`w-5 h-5 ${
                          isSelected
                            ? "text-emerald-600"
                            : "text-gray-600"
                        }`}
                      />
                    </div>

                    <div>
                      <div className="font-medium text-gray-900">
                        {account.account_number}
                      </div>
                      <div
                        className={`text-sm ${
                          isSelected
                            ? "text-emerald-700"
                            : "text-gray-500"
                        }`}
                      >
                        {account.account_type.charAt(0).toUpperCase() +
                          account.account_type.slice(1)}{" "}
                        Account
                      </div>

                      {isTellerRestricted && (
                        <div className="text-xs text-red-500 mt-1">
                          Not accessible
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right */}
                  <div className="text-right">
                    <div
                      className={`text-lg font-semibold ${
                        isSelected
                          ? "text-emerald-600"
                          : "text-gray-900"
                      }`}
                    >
                      ¢
                      {account.balance
                        ? account.balance.toLocaleString()
                        : "0"}
                    </div>
                    <div
                      className={`text-xs ${
                        isSelected
                          ? "text-emerald-600"
                          : "text-gray-500"
                      }`}
                    >
                      Available Balance
                    </div>
                  </div>
                </div>

                {/* Selected Icon */}
                {isSelected && !isTellerRestricted && (
                  <div className="mt-2 flex justify-end">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Error */}
        {errors.account_id && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.account_id}
          </p>
        )}
      </div>
    ) : (
      /* 🔹 Empty State */
      <div className="text-gray-500 text-center py-6">
        No accounts found for this customer.
      </div>
    )}
  </div>
)}
  </div>

              {/* Transaction Details Section */}
              <div className="md:col-span-2 mt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-emerald-600" />
                  Transaction Details
                </h4>
              </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <ArrowUpCircle className="w-4 h-4 mr-2 text-gray-500" />
                  Transaction Type
                  <span className="text-red-500 ml-1">*</span>
                </label>

                <select
                  name="transaction_type"
                  value={formData.transaction_type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                >
                  <option value="deposit">Deposit (Add Money)</option>
                  <option value="withdrawal">Withdrawal (Take Money)</option>
                </select>
              </div>

              {/* Withdrawal type (conditional) */}
              {formData.transaction_type === 'withdrawal' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Withdrawal Type
                    <span className="text-red-500 ml-1">*</span>
                  </label>

                  <select
                    name="withdrawal_type"
                    value={formData.withdrawal_type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  >
                    <option value="" disabled>
                      Select withdrawal type
                    </option>
                    <option value="advance">Advance</option>
                    <option value="commission">Commission-based</option>
                  </select>
                </div>
              )}


             <FormField
              label="Amount"
              name="amount"
              type="text"
              // inputMode="decimal"
              value={formData.amount}
              onChange={handleChange}
              required
              error={errors.amount}
              icon={<DollarSign className="w-4 h-4" />}
              placeholder="Enter amount (e.g., 100.00)"
            />


              <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-gray-500" />
                Description <span className="text-red-500 ml-1">*</span>
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={`w-full px-4 py-3 border rounded-xl transition-colors resize-none
                  ${
                    errors.description
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
                  }`}
                placeholder="Add notes about this transaction..."
              />

              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

              <FormField
                label="Transaction Date & Time"
                name="transaction_date"
                type="datetime-local"
                value={formData.transaction_date}
                onChange={handleChange}
                icon={<Calendar className="w-4 h-4" />}
              />

              <div>
  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
    <UserCheck className="w-4 h-4 mr-2 text-gray-500" />
    Created By (Mobile Banker)
    <span className="text-red-500 ml-1">*</span>
  </label>

  <select
    name="staked_by"
    value={formData.staked_by || selectedCustomer?.registered_by || ''}
    onChange={handleChange}
    required
    disabled={staffLoading}
    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 transition-colors ${
      errors.staked_by
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-emerald-500'
    }`}
  >
    {/* Show the registered banker as the selected option */}
    {selectedCustomer?.registered_by && (
      <option value={selectedCustomer.registered_by}>
        {selectedCustomer.registered_by_name} 
      </option>
    )}

    {/* List other bankers, skipping the one already selected */}
    {mobileBankers
      .filter((banker) => banker.id !== selectedCustomer?.registered_by)
      .map((banker) => (
        <option key={banker.staff_id} value={banker.id}>
          {banker.full_name} ({banker.staff_id})
        </option>
      ))}
  </select>

  {errors.staked_by && (
    <p className="mt-1 text-sm text-red-600 flex items-center">
      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      {errors.staked_by}
    </p>
  )}
</div>



            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl max-w-2xl w-full">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-xl hover:from-emerald-700 hover:to-blue-700 transition-all font-medium shadow-lg"
            >
              {transaction ? 'Update Transaction' : loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Adding transaction...
                </div>
              ) : (
                'Add transaction'
              )}
            </button>
          </div>
        </div>
      </div>
   
  );
};

// Enhanced FormField component
const FormField = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  step,
  min,
  error,
  icon,
  placeholder
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  step?: string;
  min?: string;
  error?: string;
  icon?: React.ReactNode;
  placeholder?: string;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
      {icon && <span className="mr-2 text-gray-500">{icon}</span>}
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      step={step}
      min={min}
      placeholder={placeholder}
      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 transition-colors ${
        error 
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
          : 'border-gray-300 focus:border-emerald-500'
      }`}
    />
    {error && <p className="mt-1 text-sm text-red-600 flex items-center">
      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {error}
    </p>}
  </div>
);

// Export the TransactionModal component
export { TransactionModal };

// Demo component
export default function TransactionModalDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);

  const handleSave = (transactionData: any) => {
    console.log('Saving transaction:', transactionData);
    setIsModalOpen(false);
    setEditTransaction(null);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditTransaction(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Transaction Modal Demo</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              New Transaction
            </button>
            <button
              onClick={() => {
                setEditTransaction({} as Transaction);
                setIsModalOpen(true);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Sample Transaction
            </button>
          </div>

          <div className="text-gray-600">
            <p>Click the buttons above to test the transaction modal:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>✅ Customer autocomplete search</li>
              <li>✅ Real-time customer filtering</li>
              <li>✅ Customer balance display</li>
              <li>✅ Transaction type selection</li>
              <li>✅ Amount validation</li>
              <li>✅ Date/time picker</li>
              <li>✅ Mobile banker assignment</li>
              <li>✅ Form validation</li>
              <li>✅ Modern responsive design</li>
            </ul>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <TransactionModal
          transaction={editTransaction}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
