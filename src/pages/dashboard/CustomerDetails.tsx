import React, { useEffect, useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Eye, 
  Edit3, 
  Download,
  Filter,
  Search,
  ChevronDown,
  Building,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User2,
  Code,
  ArrowLeftRight
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useCustomers } from '../../contexts/dashboard/Customers';
import { useAccounts } from '../../contexts/dashboard/Account';
import { useTransactions } from '../../contexts/dashboard/Transactions';
import { companyId, userPermissions, userUUID } from '../../constants/appConstants';
import { ClientModal } from './Components/clientModal';
import { Account, Customer } from '../../data/mockData';
import toast from 'react-hot-toast';
import AddAccountModal, { AccountFormData } from '../../components/addAccountModal';

type CustomerDTO = {
  id?: string;
  fullName?: string;
  email: string;
  phone?: string;
  address: string;
  date_of_registration?: string;
  lastLogin: string;
  status: string;
  profileImage: string | null;
  totalBalance: number;
  monthlyContribution: number;
  dailyRate: string;
  id_card?: string;
  next_of_kin?: string;
  gender?: string;
  account_number?: string;
  city?: string;
  registered_by?: string;
  date_of_birth?: string;
  customer_id?: string;
};


const CustomerDetailsPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [transactionFilter, setTransactionFilter] = useState('all');
   const [showAddModal, setShowAddModal] = useState(false); 
    const [editingClient, setEditingClient] = useState<Customer | null>(null);
    const { fetchCustomerById, editCustomer, addCustomer, refreshCustomers, deleteCustomer, customer, customerLoading } = useCustomers();
  const { accounts, customerLoans, refreshAccounts, addAccount, toggleAccountStatus } = useAccounts();
  const { fetchCustomerTransactions, customerTransactions } = useTransactions();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [fromAccountId, setFromAccountId] = useState("");
const [toAccountId, setToAccountId] = useState("");
const [amount, setAmount] = useState<number>(0);
const [narration, setNarration] = useState("");

const { transferBetweenAccounts } = useTransactions();

 const { id } = useParams();
 
 useEffect(() => {
  let mounted = false;

  const fetchData = async () => {
    if (mounted) return; // prevent double execution
    mounted = true;

    const toastId = toast.loading("Fetching data for customer ....");

    await fetchCustomerById(id || '');
    await refreshAccounts(id || '');
    await fetchCustomerTransactions(id || '');

    toast.success("Done", { id: toastId });
  };

  if (id) {
    fetchData();
  }
}, [id]);

  console.log(`Customer data: ${JSON.stringify(customer)}`);
  // Mock customer data - replace with your actual data fetching
  const now = new Date();
  const customerData = {
    id: customer?.account_number,
    fullName: customer?.name,
    email: customer?.email || 'N/A',
    phone: customer?.phone_number,
    momo_number: customer?.momo_number || 'N/A',
    address: `${customer?.city} - ${customer?.location}`,
    date_of_registration: customer?.date_of_registration,
    lastLogin: '2024-09-20',
    date_of_birth: customer?.date_of_birth,
    account_number: customer?.account_number,
    gender: customer?.gender,
    registered_by: customer?.registered_by,
    id_card: customer?.id_card,
    staff_name: customer?.registered_by_name,
    next_of_kin: customer?.next_of_kin,
    customer_id: customer?.id,
    city: customer?.city,
    withdrawal_code: customer?.withdrawal_code,
    status: 'Active',
    profileImage: null,
    dailyRate: customer?.daily_rate,
    totalBalance: accounts.reduce((sum, acc) => Number(sum) + Number(acc.balance), 0),
    monthlyContribution: customerTransactions
      .filter(txn => {
        if (!txn.transaction_date) return false;
        if (txn.status === 'reversed') return false;

        const txnDate = new Date(txn.transaction_date);

        return (
          txnDate.getMonth() === now.getMonth() &&
          txnDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, txn) => sum + Number(txn.amount), 0),
      }


    const toCustomer = (dto: CustomerDTO): Customer => ({
    id: dto.id ?? crypto.randomUUID(),
    name: dto.fullName ?? "",
    date_of_registration: dto.date_of_registration ?? new Date().toISOString(),
    id_card: dto.id_card,
    gender: dto.gender,
    email: dto.email,
    phone_number: dto.phone,
    next_of_kin: dto.next_of_kin,
    location: dto.address,
    daily_rate: dto.dailyRate,
    company_id: "some-company-id",
    registered_by: dto.registered_by,
    created_at: dto.lastLogin,
    date_of_birth: dto.date_of_birth,
    customer_id: dto.customer_id,
    city: dto.city,
    account_number: dto.account_number,
    is_deleted: false,
    deleted_at: null,
  });


  const handleEditClient = (updatedClient: Customer) => {
      editCustomer(updatedClient);
      refreshCustomers();
      !customerLoading ? setEditingClient(null) : null;
    };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case 'withdrawal': return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case 'payment': return <ArrowUpRight className="w-4 h-4 text-blue-600" />;
      default: return <ArrowUpRight className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
  if (!dateString) return "Invalid date";
  const date = new Date(dateString);
  return isNaN(date) ? "Invalid date" : date.toLocaleDateString("en-GH", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};


  const filteredTransactions = customerTransactions.filter(txn => {
    if (selectedAccount === 'all' && transactionFilter === 'all') return true;
    if (selectedAccount !== 'all' && txn.account_type !== selectedAccount) return false;
    if (transactionFilter !== 'all' && txn.type !== transactionFilter) return false;
    return true;
  });

  const handleAddAccount = async (accountData: Account) => {
    setIsLoading(true);
    
    const toastId = toast.loading('Adding account...');
    try {
      console.log('Creating account:', accountData);
     
      const addAccountRes = await addAccount(accountData);
      console.log(`Creating account for: ${accountData}`);
      console.log(`Adding account boolean: ${addAccountRes}`)
      if(addAccountRes===true){
        setIsAddModalOpen(false);
        refreshAccounts(accountData.customer_id || '');
        toast.success('Account added successfully', {id: toastId});
      }
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error(`${error}`, {id: toastId});
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = () => {

  }

  const handleTransfer = async () => {
  if (!fromAccountId || !toAccountId || amount <= 0 || !narration) {
    alert("Please fill all required fields");
    return;
  }

  if (fromAccountId === toAccountId) {
    alert("Cannot transfer to the same account");
    return;
  }

  const payload = {
    from_account_id: fromAccountId,
    to_account_id: toAccountId,
    amount: amount,
    company_id: companyId,
    created_by: userUUID,
    created_by_type: 'staff',
    description: narration
  }

  const res = await transferBetweenAccounts(payload);
  await refreshAccounts(id || '');
  if (res.success) {
    setIsTransferModalOpen(false);
    setFromAccountId("");
    setToAccountId("");
    setAmount(0);
    setNarration("");
  }
};



  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {customerData.fullName?.substring(0, 2).toLocaleUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {customerData.fullName}
                </h1>
                <p className="text-gray-600">Customer ID: {customerData.id}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {customerData.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    Member since {formatDate(customerData.date_of_registration)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
             {
              userPermissions.CUSTOMER_CREATE && (
                 <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                 onClick={() => setEditingClient(toCustomer(customerData))}
                 >
                <Edit3 className="w-4 h-4" />
                <span>Edit Customer</span>
              </button>
              )
             }
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'accounts', label: 'Accounts' },
                { id: 'transactions', label: 'Transactions' },
                { id: 'profile', label: 'Profile Details' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Summary Cards */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Balance</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(customerData.totalBalance)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                {/* <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">+12.5% from last month</span>
                </div> */}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Contribution</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(customerData.monthlyContribution)}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                {/* <div className="mt-4 flex items-center text-sm text-gray-600">
                  Next due: Oct 20, 2024
                </div> */}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Daily Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{customerData.dailyRate}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-4">
                  {customerTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.transaction_id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-600">{transaction.account_type}</p>
                          <p className='text-[12px] text-gray-600'>{transaction.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-sm text-gray-600 font-bold">{formatDate(transaction.transaction_date)}</p>
                        <p className='text-sm text-gray-600'>{transaction.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Account Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Summary</h3>
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{account.account_type}</h4>
                        <span className={`text-sm px-2 py-1 rounded ${
                          account.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {account.status}
                        </span>
                      </div>
                      <p className={`text-lg font-bold ${
                        account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(account.balance)}
                      </p>
                      
                      <p className="text-xs text-gray-600 mt-1">
                        {formatDate(account.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

            {/* ===== HEADER ===== */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Customer Accounts
              </h3>

              <div className='flex space-x-3'>
                  {userPermissions.ALTER_ACCOUNT && (
                <button
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Add Account</span>
                </button>
              )}

              {
                userPermissions.ALTER_ACCOUNT && (
                  <button
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  onClick={() => setIsTransferModalOpen(true)}

                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Transfer</span>
                </button>

                )
              }
              </div>
              
            </div>

    {/* ========================================================= */}
    {/* ===== NORMAL ACCOUNTS GRID ===== */}
    {/* ========================================================= */}

    {accounts.length === 0 ? (
      <div className="text-center py-8 bg-blue-50 rounded-xl border border-blue-100">
        <CreditCard className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm text-gray-700">
          This customer has no operational accounts yet.
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {accounts.map((account) => (

          <div
            key={account.id}
            className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow group"
          >

            {isTransferModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6">
              
              <h3 className="text-lg font-semibold mb-4">
                Transfer Between Accounts
            </h3>

            {/* FROM ACCOUNT */}
            <div className="mb-4">
              <label className="text-sm text-gray-600">From Account</label>
              <select
                className="w-full mt-1 border rounded-lg px-3 py-2"
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
              >
                <option value="">Select account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_type} — {acc.account_number} (
                    {formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>
            </div>

            {/* TO ACCOUNT */}
            <div className="mb-4">
              <label className="text-sm text-gray-600">To Account</label>
              <select
                className="w-full mt-1 border rounded-lg px-3 py-2"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
              >
                <option value="">Select account</option>
                {accounts
                  .filter(acc => acc.id !== fromAccountId)
                  .map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_type} — {acc.account_number}
                    </option>
                  ))}
              </select>
            </div>

            {/* AMOUNT */}
            <div className="mb-4">
              <label className="text-sm text-gray-600">Amount</label>
              <input
                type="text"
                className="w-full mt-1 border rounded-lg px-3 py-2"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>

            {/* NARRATION */}
            <div className="mb-6">
              <label className="text-sm text-gray-600">Narration</label>
              <input
                type="text"
                className="w-full mt-1 border rounded-lg px-3 py-2"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
              />
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
          onClick={handleTransfer}
          disabled= {isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          {
                    isLoading ? (
                      <div>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Transferring...
                </div>
                    ) : (
                      'Transfer'
                    )
                    }
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* ---- top icon + status ---- */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
                
              </div>
               {/* <span
                className={`text-xs px-2 py-1 rounded-full ${
                  account.status === 'Active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {account.status}
              </span> */}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-700 mr-2">
                {account.status}
              </span>

              <button
                onClick={async () => {
                  await toggleAccountStatus(account.id);
                  await refreshAccounts(id || '');
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${account.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'}
                `}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${account.status === 'Active' ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
            </div>

            <h4 className="text-lg font-semibold text-gray-900 mb-1">
              {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)}
            </h4>

            <p className="text-sm text-gray-600 mb-3">
              {account.account_type.charAt(0).toUpperCase() +
                account.account_type.slice(1)} - {account.account_number}
            </p>

            {/* <p className="text-[10px] text-gray-400 mb-2">
              ID {account.id}
            </p> */}

            {/* ---- balances + opened ---- */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Balance:</span>

                <span
                  className={`font-medium ${
                    Number(account.balance) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatCurrency(account.balance)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Opened:</span>
                <span className="font-medium text-gray-900">
                  {formatDate(account.created_at)}
                </span>
              </div>
            </div>

            {/* ---- actions ---- */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">

              <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                <Eye className="w-4 h-4" />
                <span>Activities</span>
              </button>

              <button
                onClick={() => handleDeleteAccount(account.id)}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm border border-red-300 text-red-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Delete</span>
              </button>

            </div>
          </div>

        ))}
      </div>
    )}



    {/* ========================================================= */}
    {/* ===== LOAN ACCOUNTS GRID ===== */}
    {/* ========================================================= */}

    <div className="mt-10">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Loan Accounts
      </h3>

      {customerLoans.length === 0 ? (
        <div className="text-center py-8 bg-purple-50 rounded-xl border border-purple-100">
          <CreditCard className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm text-gray-700">
            This customer has not requested any loans.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {customerLoans.map((loan) => (

            <div
              key={loan.id}
              className="border border-purple-200 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-white hover:shadow-md transition-shadow"
            >

              {/* ---- icon + status ---- */}
              <div className="flex items-center justify-between mb-3">

                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>

                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    loan.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : loan.status === 'overdue'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {loan.status}
                </span>
              </div>

              <h4 className="text-lg font-semibold text-gray-900">
                {loan.loanType}
              </h4>

              <p className="text-[10px] text-gray-400 mb-2">
                Loan ID {loan.id}
              </p>

              {/* ---- loan metrics ---- */}
              <div className="space-y-2 text-sm">

                <div className="flex justify-between">
                  <span className="text-gray-600">Requested Amount:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(loan.loanAmount)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Tenure:</span>
                  <span className="font-medium">
                    {loan.loanTerm} months
                  </span>
                </div>

                {loan.interestRateLoan && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interest:</span>
                    <span className="font-medium">
                      {loan.interestRateLoan}%
                    </span>
                  </div>
                )}

                {loan.disbursementDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Disbursed:</span>
                    <span className="font-medium">
                      {formatDate(loan.disbursementDate)}
                    </span>
                  </div>
                )}

                {loan.maturityDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maturity:</span>
                    <span className="font-medium">
                      {formatDate(loan.maturityDate)}
                    </span>
                  </div>
                )}

                {loan.daysOverdue > 0 && (
                  <div className="mt-2 text-red-600 text-xs">
                    {loan.daysOverdue} days overdue
                  </div>
                )}

              </div>


              {/* ---- purpose ---- */}
              {loan.purpose && (
                <div className="mt-3 p-2 bg-white rounded-lg border border-purple-100 text-xs">
                  Purpose: {loan.purpose}
                </div>
              )}

            </div>

          ))}

        </div>
      )}

    </div>

  </div>
)}


        {activeTab === 'transactions' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
              <div className="flex space-x-3">
                <div className="relative">
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Accounts</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.account_type}>{account.account_type}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2 top-3" />
                </div>
                <div className="relative">
                  <select
                    value={transactionFilter}
                    onChange={(e) => setTransactionFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="deposit">Deposits</option>
                    <option value="withdrawal">Withdrawals</option>
                    <option value="payment">Payments</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2 top-3" />
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Account</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Amount</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => {
                  const isReversed = transaction.status === 'reversed';

                  return (
                    <tr
                      key={transaction.id}
                      className={`
                        border-b border-gray-100 transition-colors
                        ${isReversed
                          ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'hover:bg-gray-50'}
                      `}
                    >
                      {/* Date */}
                      <td className="py-3 px-4 text-sm">
                        <span className={isReversed ? 'line-through' : 'text-gray-900'}>
                          {formatDate(transaction.transaction_date)}
                        </span>
                      </td>

                      {/* Account Type */}
                      <td className="py-3 px-4 text-sm">
                        <span className={isReversed ? 'text-gray-400' : 'text-gray-600'}>
                          {transaction.account_type}
                        </span>
                      </td>

                      {/* Transaction Type */}
                      <td className="py-3 px-4">
                        <span
                          className={`capitalize text-sm ${
                            isReversed ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>

                      {/* Amount */}
                      <td
                        className={`py-3 px-4 text-right font-medium ${
                          isReversed
                            ? 'text-gray-400'
                            : transaction.type === 'deposit'
                              ? 'text-green-600'
                              : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'deposit' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {getStatusIcon(transaction.status)}
                          <span
                            className={`text-xs capitalize font-medium ${
                              isReversed ? 'text-gray-500' : 'text-gray-700'
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {getTransactionIcon(transaction.type)}
                          <span
                            className={`text-sm font-medium ${
                              isReversed ? 'italic text-gray-400' : 'text-gray-900'
                            }`}
                          >
                            {transaction.description || '-'}
                            {isReversed && ' (Reversed)'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
              <div className="space-y-4 grid grid-cols-1 lg:grid-cols-2">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium text-gray-900">{customerData.fullName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Email Address</p>
                    <p className="font-medium text-gray-900">{customerData.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="font-medium text-gray-900">{customerData.phone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-gray-900">{customerData.address}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Date Of Birth</p>
                    <p className="font-medium text-gray-900">{formatDate(customerData.date_of_birth)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Next of Kin</p>
                    <p className="font-medium text-gray-900">{customerData.next_of_kin}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Ghana Card</p>
                    <p className="font-medium text-gray-900">{customerData.id_card}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <User2 className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-medium text-gray-900">{customerData.gender}</p>
                  </div>
                </div>
              </div>
            </div>

             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Information</h3>
              <div className="space-y-2 grid grid-cols-1 lg:grid-cols-2">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Date Joined</p>
                        <p className="font-medium text-gray-900">{formatDate(customerData.date_of_registration)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Account Number</p>
                        <p className="font-medium text-gray-900">{customerData.account_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Account Status</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {customerData.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Daily Rate</p>
                        <p className="font-medium text-gray-900">¢{customerData.dailyRate}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Mobile Money Number</p>
                      <p className="font-medium text-gray-900">{customerData.momo_number}</p>
                    </div>
                  </div>

                    <div className="flex items-center space-x-3">
                    <Code className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Secret Withdrawal Code</p>
                      <p className="font-medium text-gray-900">{customerData.withdrawal_code}</p>
                    </div>
                </div>

              </div>
            </div>
           </div>
        )}
      </div>

       {/* Add/Edit Client Modal */}
            {(showAddModal || editingClient) && (
              <ClientModal
                account={{} as Account}
                client={editingClient}
                onSave={handleEditClient}
                onClose={() => {
                  setShowAddModal(false);
                  setEditingClient(null);
                }}
              />
            )}
            

          {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddAccount}
        customer={customer ? customer : {} as Customer}
        // customers={mockCustomers}
        isLoading={isLoading}
      />

    </div>
  );
};

export default CustomerDetailsPage;