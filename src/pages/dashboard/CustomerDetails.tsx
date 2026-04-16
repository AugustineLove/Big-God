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
  ArrowLeftRight,
  Settings,
  Trash2,
  EyeOff,
  Users,
  X,
  Undo2
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
import Select from 'react-select';
import AccountSettingsModal from './Components/accountSettingsModal';
import TransferModal from './Components/TransferModal';
import DeleteTransactionModal from '../../components/deleteTransactionModal';

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
    const { fetchCustomerById, addSmsNumber, deleteSmsNumber, 
      toggleSms, editCustomer, addCustomer, refreshCustomers, deleteCustomer, customer, customerLoading, customers } = useCustomers();
  const { accounts, accountSummary, allAccounts, customerLoans, refreshAccounts, refreshAllCompanyAccounts, addAccount, toggleAccountStatus } = useAccounts();
  const { fetchCustomerTransactions, customerTransactions, deleteTransaction } = useTransactions();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [fromAccountId, setFromAccountId] = useState("");
const [toAccountId, setToAccountId] = useState("");
const [amount, setAmount] = useState<number>(0);
const [narration, setNarration] = useState("");
const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newSettingsSelectedAccount, setNewSettingsSelectedAccount] = useState();
const [showCode, setShowCode] = useState(false)
const { transferBetweenAccounts } = useTransactions();
const [newNumber, setNewNumber] = useState("");

  const [selectedTransaction, setSelectedTransaction] = useState('');
  const [isDeleteTransactionModal, setIsDeleteTransactionModal] = useState(false);

 const { id } = useParams();


 const handleAddNumber = async () => {
  if (!newNumber) return;

  await addSmsNumber(id || '', newNumber);
  await fetchCustomerById(id || '');
  setNewNumber("");
};

const handleDeleteNumber = async (num: string) => {
  await deleteSmsNumber(id || '', num)
  await fetchCustomerById(id || '');
};

const toggleSmsStatus = async () => {
  await toggleSms(id || '')
};

 
 useEffect(() => {
  let mounted = false;

  const fetchData = async () => {
    if (mounted) return; // prevent double execution
    mounted = true;

    const toastId = toast.loading("Fetching data for customer ....");

    await fetchCustomerById(id || '');
    await refreshAccounts(id || '');
    await refreshAllCompanyAccounts();
    await fetchCustomerTransactions(id || '');

    toast.success("Done", { id: toastId });
  };

  if (id) {
    fetchData();
  }
}, [id]);

const accountOptions = allAccounts.map(account => ({
  value: account.id,
  label: `${account.account_type} - ${account.account_number}`,
}));

  // Find selected account
  const newSelectedAccount = allAccounts.find(
    (account) => account.id === toAccountId
  );
  // Find the customer whose ID is the prefix of the account ID
  const selectedCustomer = customers.find(
    (customer) =>
      newSelectedAccount?.account_number.startsWith(customer.account_number)
  );

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
    status: customer?.status,
    send_sms: customer?.send_sms,
    sms_numbers: customer?.sms_numbers,
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
    company_id: companyId,
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
      case 'transfer_in': return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
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

   const handleOpenSettings = (account) => {
    setNewSettingsSelectedAccount(account);
    setShowSettingsModal(true);
  };

  // Function to handle settings save
  const handleSettingsSave = async (updatedAccount) => {
    // Update the account in your local state
    // setAccounts(prevAccounts => 
    //   prevAccounts.map(acc => 
    //     acc.id === updatedAccount.id ? updatedAccount : acc
    //   )
    // );
    
    // Or refresh from API
    // await fetchAccounts();
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

  const handleDeleteClick = (transaction_id: string) => {
    console.log(`Id: ${transaction_id}`)
    setSelectedTransaction(transaction_id);
    setIsDeleteTransactionModal(true);
  };

  const handleDeleteCancel = () => {
      setSelectedTransaction('');
      setIsDeleteTransactionModal(false);
    };
  
    const handleDeleteConfirm = async (transactionId: string) => {
      setIsDeleting(true);
      const toastId = toast.loading('Deleting transaction…');
      try {
        const res = await deleteTransaction(transactionId);
        if (res) {
          setIsDeleteTransactionModal(false);
          setSelectedTransaction('');
          await refreshCustomers('1', 20);
          toast.success('Transaction deleted successfully', { id: toastId });
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete transaction', { id: toastId });
      } finally {
        setIsDeleting(false);
      }
    };


  return (
    <div className="min-h-screen bg-gray-50 p-1">
      <div className="flex flex-col gap-3">

  {/* Customer Header */}
<div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">

  {/* Top: Profile + Actions */}
  <div className="flex items-start justify-between gap-4">

    {/* Identity */}
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-medium text-gray-700 flex-shrink-0">
        {customerData.fullName?.substring(0, 2).toUpperCase()}
      </div>
      <div>
        <h1 className="text-sm font-semibold text-gray-900 leading-tight">
          {customerData.fullName}
        </h1>
        <p className="text-[11px] font-mono text-gray-400 mt-0.5">
          {customerData.id}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium
            ${customerData.status === 'Active'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-600'}`}>
            <span className={`w-1.5 h-1.5 rounded-full
              ${customerData.status === 'Active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
            {customerData.status}
          </span>
          <span className="text-[11px] text-gray-400 hidden sm:inline">
            Since {formatDate(customerData.date_of_registration)}
          </span>
        </div>
      </div>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {userPermissions.CUSTOMER_CREATE && (
        <button
          onClick={() => setEditingClient(toCustomer(customerData))}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg transition"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Edit</span>
        </button>
      )}
      <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg transition">
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Export</span>
      </button>
    </div>
  </div>

  {/* Divider */}
  <div className="border-t border-gray-100" />

  {/* Stats Grid — 2 col mobile / 3 col desktop */}
  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">

    {/* Balance — spans full width on mobile, 1 col on desktop */}
    <div className="col-span-2 sm:col-span-1 bg-white border border-gray-200 rounded-xl p-3">
      <p className="text-[11px] text-gray-400 font-medium">Current balance</p>
      <p className="text-lg font-semibold text-gray-900 mt-0.5 tabular-nums">
        GHS {accountSummary?.totalBalance?.toLocaleString()}
      </p>
    </div>

    <div className="bg-green-50 rounded-xl p-3">
      <p className="text-[11px] text-green-700 font-medium">Deposits</p>
      <p className="text-sm font-semibold text-green-700 mt-0.5 tabular-nums">
        GHS {accountSummary?.totalDeposits?.toLocaleString()}
      </p>
    </div>

    <div className="bg-red-50 rounded-xl p-3">
      <p className="text-[11px] text-red-700 font-medium">Withdrawals</p>
      <p className="text-sm font-semibold text-red-500 mt-0.5 tabular-nums">
        GHS {accountSummary?.totalWithdrawals?.toLocaleString()}
      </p>
    </div>

    <div className="bg-blue-50 rounded-xl p-3">
      <p className="text-[11px] text-blue-700 font-medium">Transfer in</p>
      <p className="text-sm font-medium text-blue-600 mt-0.5 tabular-nums">
        GHS {accountSummary?.totalTransferIns?.toLocaleString()}
      </p>
    </div>

    <div className="bg-orange-50 rounded-xl p-3">
      <p className="text-[11px] text-orange-700 font-medium">Transfer out</p>
      <p className="text-sm font-medium text-orange-600 mt-0.5 tabular-nums">
        GHS {accountSummary?.totalTransferOuts?.toLocaleString()}
      </p>
    </div>

    <div className="bg-green-50 rounded-xl p-3">
      <p className="text-[11px] text-green-500 font-medium">Commission</p>
      <p className="text-sm font-medium text-green-500 mt-0.5 tabular-nums">
        GHS {accountSummary?.totalCommissions?.toLocaleString()}
      </p>
    </div>
  </div>

  {/* Account Breakdown */}
  <div className="border border-gray-100 rounded-xl overflow-hidden">

    <div className="px-3.5 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
      <p className="text-[11px] font-medium text-gray-500">
        {accounts?.length || 0} {accounts?.length === 1 ? 'account' : 'accounts'}
      </p>
    </div>

    {/* Mobile: stacked cards / Desktop: inline rows */}
    <div className="divide-y divide-gray-50">
      {accounts?.map((acc, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-gray-50/60 transition-colors"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-800">{acc.account_type}</p>
            <p className="text-[11px] font-mono text-gray-400 mt-0.5 truncate">
              {acc.account_number}
            </p>
          </div>
          <p className="text-xs font-semibold text-gray-700 tabular-nums flex-shrink-0">
            GHS {acc.balance?.toLocaleString()}
          </p>
        </div>
      ))}
    </div>

  </div>

</div>

  {/* Tab Nav */}
  <div className="bg-white border border-gray-100 rounded-2xl p-1.5 inline-flex gap-1 self-start">
    {[
      { id: 'overview',      label: 'Overview' },
      { id: 'accounts',      label: 'Accounts' },
      { id: 'transactions',  label: 'Transactions' },
      { id: 'profile',       label: 'Profile Details' },
    ].map((tab) => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`px-5 py-2 rounded-xl text-[13px] font-medium transition-colors whitespace-nowrap
          ${activeTab === tab.id
            ? 'bg-[#548048] text-white'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
      >
        {tab.label}
      </button>
    ))}
  </div>

        {/* Content */}
        {activeTab === 'overview' && (
  <div className="flex flex-col gap-4">

    {/* Stat Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        {
          label: 'Total Balance',
          value: formatCurrency(customerData.totalBalance),
          icon: Wallet,
          bg: 'bg-emerald-50', iconColor: 'text-emerald-600',
        },
        {
          label: 'Monthly Contribution',
          value: formatCurrency(customerData.monthlyContribution),
          icon: Calendar,
          bg: 'bg-indigo-50', iconColor: 'text-indigo-600',
        },
        {
          label: 'Daily Rate',
          value: `¢${customerData.dailyRate}`,
          icon: TrendingUp,
          bg: 'bg-violet-50', iconColor: 'text-violet-600',
        },
      ].map(({ label, value, icon: Icon, bg, iconColor }) => (
        <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">{label}</p>
            <p className="text-[26px] font-medium text-gray-900 tracking-tight leading-none">{value}</p>
          </div>
          <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      ))}
    </div>

    {/* Main Row */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

      {/* Recent Transactions — spans 2 cols */}
      <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Recent Transactions</h3>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-[12px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            View all
          </button>
        </div>

        <div>
          {customerTransactions.slice(0, 5).map((tx, i) => {
            const isInflow = tx.type === 'deposit' || tx.type === 'transfer_in';
            const statusColors: Record<string, string> = {
              completed: 'text-emerald-600',
              approved:  'text-indigo-600',
              pending:   'text-amber-600',
              reversed:  'text-gray-400',
              rejected:  'text-red-500',
            };
            const statusDots: Record<string, string> = {
              completed: 'bg-emerald-400',
              approved:  'bg-indigo-400',
              pending:   'bg-amber-400',
              reversed:  'bg-gray-300',
              rejected:  'bg-red-400',
            };

            return (
              <div key={tx.transaction_id}>
                <div className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                      ${isInflow ? 'bg-emerald-50' : tx.type === 'payment' ? 'bg-amber-50' : tx.type.includes('transfer') ? 'bg-indigo-50' : 'bg-red-50'}`}>
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-gray-900 leading-snug">{tx.description || '—'}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{tx.account_type} · {tx.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[14px] font-semibold tabular-nums ${isInflow ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isInflow ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(tx.transaction_date)}</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold mt-0.5 ${statusColors[tx.status] || 'text-gray-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDots[tx.status] || 'bg-gray-300'}`} />
                      {tx.status}
                    </span>
                  </div>
                </div>
                {i < 4 && <div className="h-px bg-gray-50 mx-6" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Account Summary */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Account Summary</h3>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {accounts.map((account) => (
            <div key={account.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[12px] font-semibold text-gray-500 capitalize">{account.account_type}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold
                  ${account.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${account.status === 'Active' ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                  {account.status}
                </span>
              </div>
              <p className={`text-[20px] font-medium tracking-tight leading-none
                ${Number(account.balance) >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                {formatCurrency(account.balance)}
              </p>
              <p className="text-[11px] font-mono text-gray-300 mt-1.5 tracking-wide">
                •••• {account.account_number?.slice(-4)}
              </p>
              <p className="text-[11px] text-gray-300 mt-0.5">Opened {formatDate(account.created_at)}</p>
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
                userPermissions.MANAGE_CASHACCOUNTS && (
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {accounts.map((account) => (
    <div
      key={account.id}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-200"
    >
      {/* Body */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div className="w-11 h-11 rounded-xl bg-indigo-500 flex items-center justify-center">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-400">
              {account.status}
            </span>
            <button
              onClick={async () => {
                await toggleAccountStatus(account.id);
                await refreshAccounts(id || '');
              }}
              className={`relative inline-flex h-[18px] w-[34px] items-center rounded-full transition-colors
                ${account.status === 'Active' ? 'bg-emerald-400' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform
                ${account.status === 'Active' ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}
              />
            </button>
          </div>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
          {account.account_type} account
        </p>
        <p className="text-sm text-gray-300 font-mono tracking-wider">
        {account.account_number}
        </p>

        <div className="mt-4">
          <p className="text-[11px] text-gray-400 mb-1">Balance</p>
          <p className={`text-[28px] font-medium tracking-tight leading-none
            ${Number(account.balance) >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
            {formatCurrency(account.balance)}
          </p>
        </div>
      </div>

      {/* Meta strip */}
      <div className="border-t border-gray-100 flex">
        <div className="flex-1 px-5 py-3">
          <p className="text-[11px] text-gray-400 mb-0.5">Min balance</p>
          <p className="text-sm font-medium text-amber-500">
            {formatCurrency(account.minimum_balance)}
          </p>
        </div>
        <div className="flex-1 px-5 py-3 border-l border-gray-100">
          <p className="text-[11px] text-gray-400 mb-0.5">Opened</p>
          <p className="text-sm font-medium text-gray-700">
            {formatDate(account.created_at)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-100 flex">
        <button
          onClick={() => handleOpenSettings(account)}
          className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button
          onClick={() => handleDeleteAccount(account.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium text-gray-300 border-l border-gray-100 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
             <AccountSettingsModal
            account={newSettingsSelectedAccount}
            isOpen={showSettingsModal}
            onClose={() => {
              setShowSettingsModal(false);
              setNewSettingsSelectedAccount(undefined);
            }}
            onSave={handleSettingsSave}
           />
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
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
    
    {/* Header */}
    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Transaction History</h3>
        <p className="text-xs text-gray-400 mt-0.5">{filteredTransactions.length} transactions</p>
      </div>
      <div className="flex gap-2">
        <div className="relative">
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
          >
            <option value="all">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.account_type}>
                •••• {a.account_number.slice(-4)} — {a.account_type.toLowerCase()}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={transactionFilter}
            onChange={(e) => setTransactionFilter(e.target.value)}
            className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
            <option value="payment">Payments</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>

    {/* Table */}
<div className="overflow-x-auto">
  <table className="w-full">
    <thead>
      <tr className="border-b border-gray-100">
        <th className="py-2.5 pl-5 pr-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50">Date</th>
        <th className="py-2.5 px-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50">Account</th>
        <th className="py-2.5 px-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50">Type</th>
        <th className="py-2.5 px-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50">Method</th>
        <th className="py-2.5 px-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50">Description</th>
        <th className="py-2.5 px-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50">Amount</th>
        <th className="py-2.5 px-3 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50">Status</th>
        <th className="py-2.5 pl-3 pr-5 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50"></th>
      </tr>
    </thead>

    <tbody className="divide-y divide-gray-50">
      {filteredTransactions.map((transaction) => {
        const isReversed = transaction.status === 'reversed';
        const isDeleted  = transaction.is_deleted;
        const isInflow   = transaction.type === 'deposit' || transaction.type === 'transfer_in';

        const typeBadge: Record<string, string> = {
          deposit:      'bg-emerald-50 text-emerald-700',
          withdrawal:   'bg-red-50 text-red-600',
          transfer_in:  'bg-gray-100 text-gray-500',
          transfer_out: 'bg-gray-100 text-gray-500',
          payment:      'bg-amber-50 text-amber-700',
        };

        const statusStyles: Record<string, { pill: string; dot: string }> = {
          completed: { pill: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-400' },
          approved:  { pill: 'bg-blue-50 text-blue-700',       dot: 'bg-blue-400'    },
          pending:   { pill: 'bg-amber-50 text-amber-700',     dot: 'bg-amber-400'   },
          reversed:  { pill: 'bg-gray-100 text-gray-400',      dot: 'bg-gray-300'    },
          rejected:  { pill: 'bg-red-50 text-red-600',         dot: 'bg-red-400'     },
        };

        const ss = statusStyles[transaction.status] ?? { pill: 'bg-gray-100 text-gray-500', dot: 'bg-gray-300' };

        return (
          <tr
            key={transaction.id}
            className={`group transition-colors last:border-0
              ${isReversed || isDeleted ? 'opacity-40' : 'hover:bg-gray-50/70'}`}
          >

            {/* Date */}
            <td className="py-3 pl-5 pr-3 whitespace-nowrap">
              <span className={`text-xs font-medium ${isReversed ? 'text-gray-400' : 'text-gray-700'}`}>
                {formatDate(transaction.transaction_date)}
              </span>
            </td>

            {/* Account */}
            <td className="py-3 px-3 whitespace-nowrap">
              <span className="inline-flex items-center gap-1 bg-gray-100 rounded-md px-2 py-0.5 text-[11px] font-medium text-gray-500">
                {transaction.account_type}
              </span>
            </td>

            {/* Type */}
            <td className="py-3 px-3 whitespace-nowrap">
              <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium capitalize
                ${isReversed ? 'bg-gray-100 text-gray-400' : (typeBadge[transaction.type] ?? 'bg-gray-100 text-gray-500')}`}>
                {transaction.type.replace('_', ' ')}
              </span>
            </td>

            {/* Method */}
            <td className="py-3 px-3 whitespace-nowrap">
              <span className="inline-block rounded-md px-2 py-0.5 text-[11px] font-medium capitalize bg-gray-100 text-gray-500">
                {transaction.payment_method ?? 'Cash'}
              </span>
            </td>

            {/* Description */}
            <td className="py-3 px-3 max-w-[180px]">
              <p className={`text-xs truncate ${isReversed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {transaction.description || <span className="text-gray-300">—</span>}
              </p>
              {isReversed && transaction.reversed_by_name ? (
                <p className="text-[11px] text-red-400 mt-0.5">
                  Reversed by {transaction.reversed_by_name}
                </p>
              ) : (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  by {transaction.recorded_staff_name}
                </p>
              )}
            </td>

            {/* Amount */}
            <td className="py-3 px-3 text-right whitespace-nowrap">
              <span className={`text-sm font-semibold tabular-nums
                ${isReversed ? 'text-gray-400' : isInflow ? 'text-emerald-600' : 'text-red-500'}`}>
                {isInflow ? '+' : '−'}{formatCurrency(transaction.amount)}
              </span>
            </td>

            {/* Status */}
            <td className="py-3 px-3 text-center whitespace-nowrap">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${ss.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ss.dot}`} />
                {transaction.status}
              </span>
            </td>

            {/* Actions */}
            <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
              {userPermissions.REVERSE_TRANSACTIONS && !isReversed && (
                <button
                  disabled={isDeleted}
                  onClick={() => { if (!isDeleted) handleDeleteClick(transaction.id); }}
                  className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-md px-2 py-1 transition-all
                    ${isDeleted
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 cursor-pointer'
                    }`}
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  Reverse
                </button>
              )}
            </td>

          </tr>
        );
      })}
    </tbody>
  </table>

  {filteredTransactions.length === 0 && (
    <div className="py-14 text-center">
      <p className="text-sm text-gray-400">No transactions found</p>
      <p className="text-xs text-gray-300 mt-1">Try adjusting your filters</p>
    </div>
  )}
</div>
  </div>
)}

        {activeTab === 'profile' && (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

    {/* Personal Information */}
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Personal Information</h3>
        <p className="text-xs text-gray-400 mt-0.5">Customer profile details</p>
      </div>
      <div className="grid grid-cols-2">
        {[
          { icon: User,       label: 'Full Name',      value: customerData.fullName },
          { icon: Mail,       label: 'Email Address',  value: customerData.email },
          { icon: Phone,      label: 'Phone Number',   value: customerData.phone },
          { icon: MapPin,     label: 'Address',        value: customerData.address },
          { icon: Calendar,   label: 'Date of Birth',  value: formatDate(customerData.date_of_birth) },
          { icon: Users,      label: 'Next of Kin',    value: customerData.next_of_kin },
          { icon: CreditCard, label: 'Ghana Card',     value: customerData.id_card, mono: true },
          { icon: User2,      label: 'Gender',         value: customerData.gender },
        ].map(({ icon: Icon, label, value, mono }, i, arr) => (
          <div
            key={label}
            className={`flex items-start gap-3 p-4
              ${i % 2 === 0 ? 'border-r border-gray-50' : ''}
              ${i < arr.length - 2 ? 'border-b border-gray-50' : ''}
            `}
          >
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-400 mb-0.5">{label}</p>
              <p className={`text-[13px] font-medium text-gray-900 break-words leading-snug
                ${mono ? 'font-mono tracking-wide text-[12px]' : ''}`}>
                {value || '—'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Account Information */}
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Account Information</h3>
        <p className="text-xs text-gray-400 mt-0.5">Membership & banking details</p>
      </div>
      <div className="grid grid-cols-2">
        {/* Date Joined */}
        <div className="flex items-start gap-3 p-4 border-r border-b border-gray-50">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400 mb-0.5">Date Joined</p>
            <p className="text-[13px] font-medium text-gray-900">{formatDate(customerData.date_of_registration)}</p>
          </div>
        </div>

        {/* Account Number */}
        <div className="flex items-start gap-3 p-4 border-b border-gray-50">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CreditCard className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400 mb-0.5">Account Number</p>
            <p className="text-[12px] font-medium font-mono tracking-wide text-gray-900">{customerData.account_number}</p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-start gap-3 p-4 border-r border-b border-gray-50">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
            ${customerData.status === 'Active' ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <CheckCircle className={`w-3.5 h-3.5 ${customerData.status === 'Active' ? 'text-emerald-500' : 'text-red-400'}`} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400 mb-1">Account Status</p>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold
              ${customerData.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${customerData.status === 'Active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
              {customerData.status}
            </span>
          </div>
        </div>

        {/* Daily Rate */}
        <div className="flex items-start gap-3 p-4 border-b border-gray-50">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400 mb-0.5">Daily Rate</p>
            <p className="text-[13px] font-medium text-gray-900">¢{customerData.dailyRate}</p>
          </div>
        </div>

        {/* MoMo Number */}
        <div className="flex items-start gap-3 p-4 border-r border-gray-50">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Phone className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400 mb-0.5">Mobile Money</p>
            <p className="text-[13px] font-medium text-gray-900">{customerData.momo_number}</p>
          </div>
        </div>

        {/* Withdrawal Code */}
        <div className="flex items-start gap-3 p-4">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Code className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400 mb-0.5">Withdrawal Code</p>
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-medium tracking-[0.2em] text-gray-900">
                {showCode ? customerData.withdrawal_code : '••••••'}
              </p>
              <button
                onClick={() => setShowCode(!showCode)}
                className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                {showCode ? <EyeOff className="w-3 h-3 text-gray-400" /> : <Eye className="w-3 h-3 text-gray-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* ================= SMS MANAGEMENT ================= */}
    <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl overflow-hidden">

      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">SMS Settings</h3>
          <p className="text-xs text-gray-400">Manage notification numbers</p>
        </div>

        {/* Toggle */}
        <button
          onClick={toggleSmsStatus}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
            ${customerData.send_sms
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-gray-100 text-gray-500'}`}
        >
          {customerData.send_sms ? 'SMS Enabled' : 'SMS Disabled'}
        </button>
      </div>

      <div className="p-4 space-y-3">

        {/* List of Numbers */}
        <div className="flex flex-wrap gap-2">
          {customerData.sms_numbers?.map((num, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-xs"
            >
              <span>{num}</span>

              <button
                onClick={() => handleDeleteNumber(num)}
                className="text-red-400 hover:text-red-600"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Add Number */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter phone number"
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
          />

          <button
            onClick={handleAddNumber}
            className="px-4 py-2 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800"
          >
            Add
          </button>
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
          {/* Add Account Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />
      {isDeleteTransactionModal && (
              <DeleteTransactionModal
                transaction_id={selectedTransaction}
                isOpen={isDeleteTransactionModal}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
              />
            )}

    </div>
  );
};

export default CustomerDetailsPage;