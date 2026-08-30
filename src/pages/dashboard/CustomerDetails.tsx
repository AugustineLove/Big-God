import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useCustomers } from '../../contexts/dashboard/Customers';
import { useAccounts } from '../../contexts/dashboard/Account';
import { useTransactions } from '../../contexts/dashboard/Transactions';
import { companyId, parentCompanyName, userUUID } from '../../constants/appConstants';
import { Account, Customer } from '../../data/mockData';

import { ClientModal } from './Components/clientModal';
import AddAccountModal, { AccountFormData } from '../../components/addAccountModal';
import TransferModal from './Components/TransferModal';
import DeleteTransactionModal from '../../components/deleteTransactionModal';
import InvestmentModal from './InvestmentModal';
import AccountChargesModal from './AccountChargesModal';
import CardSimulationModal from './Components/CardSimulationModal';

import CustomerHeader from './Components/CustomerDetails/CustomerHeader';
import TabNav from './Components/CustomerDetails/TabNav';
import OverviewTab from './Components/CustomerDetails/OverviewTab';
import AccountsTab from './Components/CustomerDetails/AccountsTab';
import TransactionsTab from './Components/CustomerDetails/TransactionsTab';
import ProfileTab from './Components/CustomerDetails/ProfileTab';

import { CustomerViewData, TabId } from './Components/CustomerDetails/Types';

const BASE_URL = 'https://susu-pro-backend.onrender.com/api';

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
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [editingClient, setEditingClient] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cardModalAccountId, setCardModalAccountId] = useState<string | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isChargesModalOpen, setIsChargesModalOpen] = useState(false);

  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [narration, setNarration] = useState('');

  const [selectedTransaction, setSelectedTransaction] = useState('');
  const [isDeleteTransactionModal, setIsDeleteTransactionModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { fetchCustomerById, editCustomer, refreshCustomers, customer, customerLoading, customers } =
    useCustomers();
  const {
    accounts,
    accountSummary,
    allAccounts,
    customerLoans,
    refreshAccounts,
    refreshAllCompanyAccounts,
    addAccount,
    toggleAccountStatus,
  } = useAccounts();
  const { fetchCustomerTransactions, customerTransactions, deleteTransaction, transferBetweenAccounts } =
    useTransactions();

  useEffect(() => {
    let mounted = false;

    const fetchData = async () => {
      if (mounted) return; // prevent double execution
      mounted = true;

      const toastId = toast.loading('Fetching data for customer ....');

      await fetchCustomerById(id || '');
      await refreshAccounts(id || '');
      await refreshAllCompanyAccounts();
      await fetchCustomerTransactions(id || '');

      toast.success('Done', { id: toastId });
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const now = new Date();
  const customerData: CustomerViewData = {
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
      .filter((txn) => {
        if (!txn.transaction_date) return false;
        if (txn.status === 'reversed') return false;
        const txnDate = new Date(txn.transaction_date);
        return txnDate.getMonth() === now.getMonth() && txnDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, txn) => sum + Number(txn.amount), 0),
  };

  const toCustomer = (dto: CustomerDTO): Customer => ({
    id: dto.id ?? crypto.randomUUID(),
    name: dto.fullName ?? '',
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

  const handleAddAccount = async (accountData: Account) => {
    setIsLoading(true);
    const toastId = toast.loading('Adding account...');
    try {
      const addAccountRes = await addAccount(accountData);
      if (addAccountRes === true) {
        setIsAddModalOpen(false);
        refreshAccounts(accountData.customer_id || '');
        toast.success('Account added successfully', { id: toastId });
      }
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error(`${error}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = (_accountId: string) => {
    // TODO: wire up account deletion
  };

  const handleTransfer = async () => {
    if (!fromAccountId || !toAccountId || amount <= 0 || !narration) {
      alert('Please fill all required fields');
      return;
    }
    if (fromAccountId === toAccountId) {
      alert('Cannot transfer to the same account');
      return;
    }

    const payload = {
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
      amount,
      company_id: companyId,
      created_by: userUUID,
      created_by_type: 'staff',
      description: narration,
    };

    const res = await transferBetweenAccounts(payload);
    await refreshAccounts(id || '');
    if (res.success) {
      setIsTransferModalOpen(false);
      setFromAccountId('');
      setToAccountId('');
      setAmount(0);
      setNarration('');
    }
  };

  const handleDeleteClick = (transaction_id: string) => {
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
        <CustomerHeader
          customerData={customerData}
          accounts={accounts}
          accountSummary={accountSummary}
          onEdit={() => setEditingClient(toCustomer(customerData as CustomerDTO))}
        />

        <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === 'overview' && (
          <OverviewTab
            customerData={customerData}
            accounts={accounts}
            customerTransactions={customerTransactions}
            onViewAllTransactions={() => setActiveTab('transactions')}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsTab
            accounts={accounts}
            customerLoans={customerLoans}
            id={id}
            toggleAccountStatus={toggleAccountStatus}
            refreshAccounts={refreshAccounts}
            onAddAccountClick={() => setIsAddModalOpen(true)}
            onTransferClick={() => setIsTransferModalOpen(true)}
            onInvestClick={() => setIsInvestmentModalOpen(true)}
            onChargesClick={() => setIsChargesModalOpen(true)}
            onCardClick={(accountId) => setCardModalAccountId(accountId)}
            onDeleteAccount={handleDeleteAccount}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTab
            customerTransactions={customerTransactions}
            accounts={accounts}
            onReverseClick={handleDeleteClick}
          />
        )}

        {activeTab === 'profile' && <ProfileTab customerData={customerData} />}
      </div>

      {/* Page-level modals */}
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

      <CardSimulationModal
        isOpen={!!cardModalAccountId}
        onClose={() => setCardModalAccountId(null)}
        accountId={cardModalAccountId || ''}
        apiBaseUrl={BASE_URL}
      />

      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddAccount}
        customer={customer ? customer : ({} as Customer)}
        isLoading={isLoading}
      />

      <TransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} />

      <InvestmentModal
        isOpen={isInvestmentModalOpen}
        onClose={() => setIsInvestmentModalOpen(false)}
        onSuccess={() => fetchCustomerTransactions(id || '')}
        customer={customer}
        parentCompanyName={parentCompanyName}
      />

      <AccountChargesModal
        isOpen={isChargesModalOpen}
        onClose={() => setIsChargesModalOpen(false)}
        onSuccess={() => fetchCustomerTransactions(id || '')}
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