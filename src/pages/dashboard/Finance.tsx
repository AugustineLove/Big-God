import React, { useEffect, useMemo, useState } from 'react';
import { 
  Plus, 
  Receipt, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Search,
  Filter,
  Download,
  Edit3,
  Trash2,
  Eye,
  Banknote,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Activity,
  Percent,
  Calculator,
  LineChart,
  Zap,
  Wallet,
  CheckCircle
} from 'lucide-react';
// import { Asset, Budget, Expense } from '../../data/mockData';
import { useFinance } from '../../contexts/dashboard/Finance';
import { companyId, formatDate, userPermissions, userUUID } from '../../constants/appConstants';
import { Account, Asset, Budget, Commission, Customer, Expense } from '../../data/mockData';
import toast from 'react-hot-toast';
import { AssetModal, BudgetModal, ExpenseModal, PaymentModal } from '../../components/financeModals';
import { useCustomers } from '../../contexts/dashboard/Customers';
import { useAccounts } from '../../contexts/dashboard/Account';
import { useTransactions } from '../../contexts/dashboard/Transactions';
import { useNavigate } from 'react-router-dom';
import { useCommissionStats } from '../../contexts/dashboard/Commissions';
import NewRevenueModal, { RevenueItem } from './Components/revenueModal';
import { useBudget } from '../../contexts/dashboard/Budget';

interface FinanceData{
  expenses: Expense[];
  assets: Asset[];
  budgets: Budget[];
  revenue?: Revenue[];
  operationalMetrics?: OperationalMetrics;
}

interface Revenue {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  source: string;
  status: string;
  notes?: string;
}

interface OperationalMetrics {
  monthlyRevenue: number;
  monthlyExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  operatingExpenseRatio: number;
  roi: number;
  burnRate: number;
  runway: number;
}

export interface FormDataState {
  name?: string;
  category?: string;
  description?: string;
  amount?: number;
  value?: number;
  type?: string;
  date?: string;
  depreciation_rate?: string;
  purchase_date?: string;
  allocated?: number;
  method?: string;
  recorded_by?: string;
  source?: string;
  account_id?: string;
  transactionId?: string;
}

interface ModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (formData: FormDataState, company_id: string) => void;
  formData: FormDataState;
  onFormChange: (field: keyof FormDataState, value: string) => void;
  loading: boolean;
}

const RevenueModal: React.FC<ModalProps> = ({
  show,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  loading,
  companyId,
}) => {
  const [customerAccounts, setCustomerAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedCustomerAccount, setSelectedCustomerAccount] = useState<Account | null>(null);
  const { deductCommission } = useTransactions();
  const { toggleBudgetStatus } = useBudget();
  const { customers } = useCustomers();
  

  const selectedCustomer = customers.find(
    (c) => c.id === formData.customer_id
  ) || null;
  const navigate = useNavigate();

  // Fetch accounts when customer + commissions
  useEffect(() => {
    const fetchCustomerAccounts = async (customerId: string) => {
      try {
        setLoadingAccounts(true);
        const res = await fetch(
          `https://susu-pro-backend.onrender.com/api/accounts/customer/${customerId}`
        );
        const data = await res.json();
        if (data.status === "success") {
          setCustomerAccounts(data.data || []);
        } else {
          setCustomerAccounts([]);
          toast.error("Failed to fetch accounts");
        }
      } catch (err) {
        console.error("Error fetching accounts:", err);
        setCustomerAccounts([]);
        toast.error("Failed to load customer accounts");
      } finally {
        setLoadingAccounts(false);
      }
    };

    if (formData.source === "commissions" && formData.customer_id) {
      fetchCustomerAccounts(formData.customer_id);
    } else {
      setCustomerAccounts([]);
      setSelectedCustomerAccount(null);
    }
  }, [formData.source, formData.customer_id]);

  const handleSubmit = () => {
    if (!formData.description || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.source === "commissions") {
      if (!formData.customer_id) {
        toast.error("Please select a customer");
        return;
      }
      if (!formData.account_id) {
        toast.error("Please select an account");
        return;
      }
    }

    onSubmit(formData, companyId);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Add Revenue</h2>
        <div className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.description || ""}
              onChange={(e) => onFormChange("description", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Revenue description"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount ?? ""}
              onChange={(e) =>
                onFormChange("amount", Number(e.target.value) || 0)
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.source || ""}
              onChange={(e) => {
                onFormChange("source", e.target.value);
                if (e.target.value !== "commissions") {
                  onFormChange("customer_id", "");
                  onFormChange("account_id", "");
                  setCustomerAccounts([]);
                  setSelectedCustomerAccount(null);
                }
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select source</option>
              <option value="sales">Product Sales</option>
              <option value="services">Service Revenue</option>
              <option value="subscriptions">Subscriptions</option>
              <option value="commissions">Commissions</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Customer Selection */}
          {formData.source === "commissions" && (
            <div className="bg-blue-50 border rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Customer <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.customer_id || ""}
                  onChange={(e) => {
                    onFormChange("customer_id", e.target.value);
                    onFormChange("account_id", "");
                    setSelectedCustomerAccount(null);
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.customer_id}>
                      {c.name} ({c.account_number}) - Balance: ¢
                      {c.total_balance_across_all_accounts?.toLocaleString() ||
                        "0"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Selection */}
              {formData.customer_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Wallet className="w-4 h-4 mr-2 text-gray-500" />
                    Select Account
                  </label>
                  {loadingAccounts ? (
                    <div className="text-sm text-gray-500 text-center py-4">
                      Loading accounts...
                    </div>
                  ) : customerAccounts.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No accounts found for this customer
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerAccounts.map((account) => (
                        <div
                          key={account.id}
                          onClick={() => {
                            setSelectedCustomerAccount(account);
                            onFormChange("account_id", account.id);
                          }}
                          className={`p-4 border-2 rounded-xl cursor-pointer ${
                            formData.account_id === account.id
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                              <Building2 className="w-5 h-5 text-gray-600" />
                              <div>
                                <div className="font-medium">
                                  {account.account_number}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {account.account_type.charAt(0).toUpperCase() +
                                    account.account_type.slice(1)}{" "}
                                  Account
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold">
                                ¢
                                {account.balance
                                  ? account.balance.toLocaleString()
                                  : "0"}
                              </div>
                              <div className="text-xs text-gray-500">
                                Available Balance
                              </div>
                            </div>
                          </div>
                          {formData.account_id === account.id && (
                            <div className="mt-2 flex justify-end">
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-600">
                Commission will be deducted from the selected customer account
              </p>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category || ""}
              onChange={(e) => onFormChange("category", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              <option value="operations">Operations</option>
              <option value="marketing">Marketing</option>
              <option value="investments">Investments</option>
              <option value="one-time">One-time</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={formData.date || ""}
              onChange={(e) => onFormChange("date", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || loadingAccounts}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Revenue"}
          </button>
        </div>
      </div>
    </div>
  );
};
// Main Component
const FinancialDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const { data, fetchFinanceData, addExpense, addPayment, addAsset, addBudget, loading } = useFinance();
  const { transactions, totals, approveTransaction, refreshTransactions, rejectTransaction } = useTransactions();
    const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const { deductCommission } = useTransactions();
  const { commissionStats, commissions } = useCommissionStats();
  const [setRevenue ] = useState<RevenueItem>();
  useEffect(() => {
    fetchFinanceData();
  }, [companyId]);

  const expenses = data?.expenses || [];
  const assets = data?.assets || [];
  const payments = data?.payments || [];
  const budgets = data?.budgets || [];
  console.log(`Budget data: ${JSON.stringify(budgets)}`)
  const revenue = data?.revenue || [];

 // Calculate operational metrics
const calculateOperationalMetrics = () => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyRevenue = revenue
    .filter(r => {
      const date = new Date(r.payment_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  
  const monthlyExpenses = expenses
    .filter(e => {
      const date = new Date(e.expense_date || e.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  
  const grossProfit = (Number(monthlyRevenue) + Number(commissionStats?.this_month_amount)) - Number(monthlyExpenses);
  const profitMargin = (monthlyRevenue + commissionStats?.this_month_amount) > 0 ? (grossProfit / (monthlyRevenue + commissionStats?.this_month_amount)) * 100 : 0;
  const operatingExpenseRatio = (monthlyRevenue + commissionStats?.this_month_amount) > 0 ? (monthlyExpenses / (monthlyRevenue + commissionStats?.this_month_amount)) * 100 : 0;

  // Assets & ROI
  const totalAssets = assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0);
  const roi = totalAssets > 0 ? (grossProfit / totalAssets) * 100 : 0;

 
  const burnRate = monthlyExpenses;
  const totalCash = totalAssets; 
  const runway = burnRate > 0 ? totalCash / burnRate : 0;

  const breakEvenPoint = monthlyExpenses;

  return {
    monthlyRevenue,
    monthlyExpenses,
    grossProfit,
    netProfit: grossProfit,
    profitMargin,
    operatingExpenseRatio,
    roi,
    burnRate,
    runway,
    breakEvenPoint, // ✅ new metric
  };
};

  // const commissions = useMemo(() => {
  //     return transactions.filter(t => t.type === "commission");
  //     }, [transactions]);
  
  const operationalMetrics = calculateOperationalMetrics();

  const uniqueCategories = ["All Categories", ...new Set(expenses.map(e => e.category))];
  const uniqueStatuses = ["All Status", ...new Set(expenses.map(e => e.status))];

  const filteredExpenses = expenses.filter((e) => {
    const description = (e.description || "").toLowerCase();
    const category = (e.category || "").toLowerCase();
    const status = (e.status || "").toLowerCase();
    const term = (searchTerm || "").toLowerCase();

    const matchesSearch =
      description.includes(term) || category.includes(term) || status.includes(term);

    const matchesCategory =
      categoryFilter === "All Categories" || e.category === categoryFilter;

    const matchesStatus =
      statusFilter === "All Status" || e.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredPayments = payments.filter((p) => {
    const description = (p.description || "").toLowerCase();
    const category = (p.category || "").toLowerCase();
    const term = (searchTerm || "").toLowerCase();

    const matchesSearch =
      description.includes(term) || category.includes(term);

    const matchesCategory =
      categoryFilter === "All Categories" || p.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Form data states
  const defaultExpenseFormData: FormDataState = {
    name: "",
    category: "",
    description: "",
    amount: 0,
    value: 0,
    type: "expense",
    date: new Date().toISOString().split("T")[0], 
  };

  const defaultPaymentFormData: FormDataState = {
    name: "",
    category: "",
    description: "",
    method: "",
    amount: 0,
    value: 0,
    recorded_by: userUUID,
    type: "expense",
    date: new Date().toISOString().split("T")[0], 
  };

  const defaultAssetFormData: FormDataState = {
    name: "",
    category: "",
    description: "",
    amount: 0,
    value: 0,
    type: "asset",
    depreciation_rate: "",
    date: new Date().toISOString().split("T")[0], 
  };

  const defaultBudgetFormData: FormDataState = {
    allocated: 0,
    date: new Date().toISOString().split("T")[0], 
  };

  const defaultRevenueFormData: FormDataState = {
    description: "",
    amount: 0,
    category: "",
    account_id: '',
    source: "",
    date: new Date().toISOString().split("T")[0],
  };

  

  const [expenseFormData, setExpenseFormData] = useState<FormDataState>(defaultExpenseFormData);
  const [assetFormData, setAssetFormData] = useState<FormDataState>(defaultAssetFormData);
  const [budgetFormData, setBudgetFormData] = useState<FormDataState>(defaultBudgetFormData);
  const [paymentFormData, setPaymentFormData] = useState<FormDataState>(defaultPaymentFormData);
  const [revenueFormData, setRevenueFormData] = useState<FormDataState>(defaultRevenueFormData);
  
  // Submit functions
  const submitExpense = async (formData: FormDataState, company_id: string) => {
    try {
      const toastId = toast.loading('Adding expense...');
      const { description, amount, date, category } = formData;
      const expenseData = { description, amount, date, category };
      const res = await addExpense(company_id, { status: "approved", type: "expense", ...expenseData });
      if(res === true){
        toast.success('Expense added successfully!', { id: toastId });
        setExpenseFormData(defaultExpenseFormData);
        setShowExpenseModal(false);
      } else {
        toast.error('Failed to add expense.', { id: toastId });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const submitPayment = async (formData: FormDataState, company_id: string) => {
    try {
      const toastId = toast.loading('Adding payment...');
      const { description, amount, date, category, method } = formData;
      const paymentData = { description, amount, date, category, method };
      const res = await addPayment(company_id, {status: "approved", type: "payment", recorded_by: userUUID, ...paymentData});
      if (res === true){
        toast.success("Payment added successfully!", {id: toastId});
        setPaymentFormData(defaultPaymentFormData);
        setShowPaymentModal(false);
      } else{
        toast.error('Failed to add payment', {id: toastId});
      }
    } catch (error) {
      console.log(error);
    }
  };

  const submitAsset = async (formData: FormDataState, company_id: string) => {
    try {
      const { name, value, category, date, depreciation_rate } = formData;
      const assetData = { name, category, value, date, depreciation_rate };
      const res = await addAsset(company_id, { status: "active", type: "asset", ...assetData });
      setAssetFormData(defaultAssetFormData);
      setShowAssetModal(false);
    } catch (error) {
      console.log(error);
    }
  };

  const submitBudget = async (formData: FormDataState, company_id: string) => {
    try {
      const { allocated, date } = formData;
      const budgetData = {allocated, date };
      await addBudget(company_id, { ...budgetData });
      setShowBudgetModal(false); 
      setBudgetFormData(defaultBudgetFormData);
    } catch (error) {
      console.log(error);
    }
  };

  const submitRevenue = async (formData: FormDataState, company_id: string) => {
    const toastId = toast.loading('Adding payment...');
      try {
      const { description, amount, date, category, method, source, account_id } = formData;
      console.log('Account id: ', account_id);
      const created_by = userUUID === companyId ? companyId : userUUID;
      const created_by_type = userUUID === companyId ? 'company' : 'staff';
      const company_id = companyId;
      const paymentData = { description, amount, date, category, method, source, account_id, created_by, created_by_type, company_id };
      if (source === 'commissions'){
        const res = await deductCommission(paymentData as Commission);
        toast.success("Commission added successfully!", {id: toastId});
        setRevenueFormData(defaultRevenueFormData);
        setShowRevenueModal(false);
      }
      if (source !== 'commissions'){
        const res = await addPayment(company_id, {status: "approved", type: "payment", recorded_by: userUUID, ...paymentData});
        if (res === true){
          toast.success("Payment added successfully!", {id: toastId});
          setRevenueFormData(defaultRevenueFormData);
          setShowRevenueModal(false);
        }
      }
    } catch (error) {
      toast.error('Failed to add revenue', {id: toastId})
      console.log(error);
    }
  };

  useEffect(() => {
  if (!userPermissions?.ALTER_FINANCE) {
    setActiveTab('budget');
  }
}, [userPermissions]);



  // Enhanced Overview Tab Component
  const OverviewTab = () => {
    const totalExpenses = expenses.reduce((sum, e) => Number(sum) + (Number(e.amount) || 0), 0);
    const totalAssets = assets.reduce((sum, a) => Number(sum) + (Number(a.value) || 0), 0);
    const budgetAllocated = budgets.reduce((sum, b) => Number(sum) + (Number(b.allocated) || 0), 0);
    const budgetSpent = budgets.reduce((sum, b) => Number(sum) + (Number(b.spent) || 0), 0);
    const budgetUtilization = budgetAllocated > 0 ? (budgetSpent / budgetAllocated) * 100 : 0;

    return (
      <div className="space-y-6">
        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Monthly Revenue */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Monthly Revenue</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  ¢{operationalMetrics.monthlyRevenue.toLocaleString()}
                </h3>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">vs last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Monthly Expenses</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  ¢{operationalMetrics.monthlyExpenses.toLocaleString()}
                </h3>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-600">
                    {operationalMetrics.operatingExpenseRatio.toFixed(1)}% of revenue
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Banknote className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* Gross Profit */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Gross Profit</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  ¢{operationalMetrics.grossProfit.toLocaleString()}
                </h3>
                <div className="flex items-center mt-2">
                  <span className={`text-sm ${operationalMetrics.profitMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {operationalMetrics.profitMargin.toFixed(1)}% margin
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calculator className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* ROI */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Return on Investment</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {operationalMetrics.roi.toFixed(1)}%
                </h3>
                <div className="flex items-center mt-2">
                  <Target className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-600">on assets</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Percent className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Operational Performance Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-3 gap-6">
          
          {/* Total Commissions */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Monthly Commission</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  ¢{commissionStats?.this_month_amount.toLocaleString()}
                </h3>
                <div className="flex items-center mt-2">
                  {/* <span className="text-sm text-gray-600">
                    {operationalMetrics.operatingExpenseRatio.toFixed(1)}% of revenue
                  </span> */}
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          {/* Cash Runway */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Cash Runway</h3>
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {operationalMetrics.runway.toFixed(1)} months
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Based on current burn rate
            </p>
          </div>

          {/* Burn Rate */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Monthly Burn Rate</h3>
              <Zap className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ¢{operationalMetrics.burnRate.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Average monthly spending
            </p>
          </div>

          {/* Budget Utilization */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Budget Utilization</h3>
              <PieChart className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {budgetUtilization.toFixed(0)}%
            </p>
            <p className="text-sm text-gray-600 mt-2">
              ¢{budgetSpent.toLocaleString()} of ¢{budgetAllocated.toLocaleString()} used
            </p>
          </div>
        </div>

        {/* Profit & Loss Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Profit & Loss Summary (This Month)</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View Detailed P&L
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-600">Revenue</span>
              <span className="text-sm font-semibold text-green-600">
                +¢{operationalMetrics.monthlyRevenue.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-600">Commission</span>
              <span className="text-sm font-semibold text-green-600">
                +¢{commissionStats?.this_month_amount.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-600">Operating Expenses</span>
              <span className="text-sm font-semibold text-red-600">
                -¢{operationalMetrics.monthlyExpenses.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 pt-4 border-t border-gray-100">
              <span className="text-base font-semibold text-gray-900">Gross Profit</span>
              <span className={`text-base font-bold ${
                operationalMetrics.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {operationalMetrics.grossProfit >= 0 ? '+' : ''}¢{operationalMetrics.grossProfit.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Profit Margin</span>
              <span className={`text-sm font-medium ${
                operationalMetrics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {operationalMetrics.profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {expenses.slice(0, 5).map((expense: any) => (
              <div key={expense.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                    <p className="text-xs text-gray-500">{expense.category} • {expense.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">-¢{expense.amount.toLocaleString()}</p>
                  <span className="text-xs text-gray-500">
                    {formatDate(expense.expense_date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Revenue Tab Component
  const RevenueTab = () => {

    const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<RevenueItem | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('create');

  // Sample data structure - replace with your actual data
  // const [revenue, setRevenue] = useState<RevenueItem[]>([
    // Your revenue data here
  // ]);

  const handleViewRevenue = (rev: RevenueItem) => {
    setSelectedRevenue(rev);
    setModalMode('view');
    setShowRevenueModal(true);
  };

  const handleEditRevenue = (rev: RevenueItem) => {
    setSelectedRevenue(rev);
    setModalMode('edit');
    setShowRevenueModal(true);
  };

  const handleAddRevenue = () => {
    setSelectedRevenue(null);
    setModalMode('create');
    setShowRevenueModal(true);
  };

  const handleSaveRevenue = (data: RevenueItem) => {
    if (modalMode === 'create') {
      // Add new revenue
      setRevenue(prev => [...prev, { ...data, id: Date.now() }]);
    } else if (modalMode === 'edit') {
      // Update existing revenue
      setRevenue(prev => prev.map(rev => rev.id === data.id ? data : rev));
    }
  };

  const handleDeleteRevenue = (id: string | number) => {
    setRevenue(prev => prev.filter(rev => rev.id !== id));
  };

  
    return (
    <>
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Revenue Management</h2>
          <p className="text-sm text-gray-600 mt-1">Track and analyze company revenue streams</p>
        </div>
        <button 
          onClick={handleAddRevenue}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Revenue</span>
        </button>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <h3 className="text-xl font-bold text-gray-900">
                ¢{revenue.reduce((sum, r) => sum + (Number(r.amount) || 0), 0).toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">This Month</p>
              <h3 className="text-xl font-bold text-gray-900">
                ¢{operationalMetrics.monthlyRevenue.toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Revenue Streams</p>
              <h3 className="text-xl font-bold text-gray-900">
                {new Set(revenue.map(r => r.source)).size}
              </h3>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <LineChart className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Deal</p>
              <h3 className="text-xl font-bold text-gray-900">
                ¢{revenue.length > 0 ? (revenue.reduce((sum, r) => sum + (Number(r.amount) || 0), 0) / revenue.length).toFixed(0) : '0'}
              </h3>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {revenue.map((rev: any) => (
                <tr key={rev.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    {/* <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        asset.status === "active"
                          ? "bg-green-100 text-green-700"
                          : asset.status === "maintenance"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {asset.status}
                    </span> */}
                    <p>{rev.description}</p>
                  </td>
                  <td >
                   {rev.source}
                  </td>
                  <td>
                    {rev.amount}
                  </td>
                  <td>
                    {formatDate(rev.payment_date)}
                  </td>
                  <td>
                    {rev.status}
                  </td>
                  <td>
                     
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleViewRevenue(rev)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Eye className="w-4 h-4 text-gray-500" />
                  </button>
                  <button 
                    onClick={() => handleEditRevenue(rev)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Edit3 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure?')) {
                        handleDeleteRevenue(rev.id);
                      }
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
       {/* Add the modal at the end */}
      <NewRevenueModal
        isOpen={showRevenueModal}
        onClose={() => setShowRevenueModal(false)}
        revenue={selectedRevenue}
        mode={modalMode}
        onSave={handleSaveRevenue}
        onDelete={handleDeleteRevenue}
      />
    </>
    )
};

const CommissionTab = ({
  transactions = [],
}) => {
  const navigate = useNavigate();

  // 1️⃣ Get only commission transactions (excluding reversed)
  // const commissions = useMemo(() => {
  //   return transactions.filter(
  //     t => t.type === "commission" && t.status !== "reversed"
  //   );
  // }, [transactions]);

  // 2️⃣ Group commissions by date
  const commissionsByDate = useMemo(() => {
  if (!Array.isArray(commissions)) return {};

  return commissions.reduce<Record<string, typeof commissions>>(
    (acc, commission) => {
      if (!commission.commission_date) return acc;

      const dateKey = new Date(commission.commission_date)
        .toISOString()
        .split("T")[0]; // YYYY-MM-DD

      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(commission);

      return acc;
    },
    {}
  );
}, [commissions]);


  // 3️⃣ Convert grouped object to array
  const commissionDays = useMemo(() => {
    return Object.entries(commissionsByDate)
      .map(([date, items]) => ({
        date,
        total: items.reduce((sum, i) => sum + Number(i.commission_amount), 0),
        count: items.length,
        items
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [commissionsByDate]);

  // 4️⃣ Monthly total
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Commission Tracking
          </h2>
          <p className="text-sm text-gray-600">
            View and manage company commission income
          </p>
        </div>

        {userPermissions?.ALTER_FINANCE && (
          <button
            // onClick={() => setShowCommissionModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Record Commission</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-sm text-gray-600">Overall Commission</h3>
          <p className="text-2xl font-bold mt-2">
            ₵{commissionStats?.total_amount.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex justify-between items-center">
            <h3 className="text-sm text-gray-600">
              Commission This Month
            </h3>
            <Receipt className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold mt-2">
            ₵{commissionStats?.this_month_amount.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-sm text-gray-600">
            Total Transactions
          </h3>
          <p className="text-2xl font-bold mt-2">
            {commissionStats?.total_commissions}
          </p>
        </div>
      </div>

      {/* Commissions by Date */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">
          Commissions by Date
        </h3>

        {commissionDays.length === 0 ? (
          <p className="text-sm text-gray-500">
            No commission records available.
          </p>
        ) : (
          <div className="space-y-4">
            {commissionDays.map(day => (
              <div
                key={day.date}
                onClick={() =>
                  navigate(`commissions/${day.date}`, {
                    state: {
                      date: day.date,
                      commissions: day.items
                    }
                  })
                }
                className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">
                    {new Date(day.date).toDateString()}
                  </h4>
                  <p className="font-semibold">
                    ₵{day.total.toLocaleString()}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {day.count} transaction(s)
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

  // Expenses Tab Component
  const ExpensesTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Expense Management</h2>
          <p className="text-sm text-gray-600 mt-1">Track and manage company expenses</p>
        </div>
        <button 
          onClick={() => setShowExpenseModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          
         <select
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {uniqueCategories.map((cat, i) => (
            <option key={i}>{cat}</option>
          ))}
        </select>

        <select
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {uniqueStatuses.map((st, i) => (
            <option key={i}>{st}</option>
          ))}
        </select>

          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses.map((expense: any) => (
                <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <Receipt className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{expense.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{expense.category}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">¢{expense.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(expense.expense_date)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      expense.status === 'approved' ? 'bg-green-100 text-green-700' :
                      expense.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {expense.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Edit3 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Trash2 className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );


// Budget Tab Component
    const FloatTab = () => {
      const totalAllocated = budgets.reduce((sum, b) => Number(sum) + Number(b.allocated), 0);
      const totalSpent = budgets.reduce((sum, b) => Number(sum) + Number(b.spent), 0);
      const totalRemaining = totalAllocated - totalSpent;
      const navigate = useNavigate();
      const { toggleBudgetStatus, fetchBudgets, loadingToggle } = useBudget();
      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Float Planning</h2>
              <p className="text-sm text-gray-600 mt-1">
                Plan and monitor departmental floats
              </p>
            </div>
            {
              userPermissions?.ALTER_FINANCE && (
                <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              onClick={() => setShowBudgetModal(true)}
            >
              <Plus className="w-4 h-4" />
              <span>Create Float</span>
            </button>
              )
            }
          </div>

          {/* Budget Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Total Allocated</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ₵{totalAllocated.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Total Spent</h3>
                <Receipt className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ₵{totalSpent.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {totalAllocated > 0
                  ? `${Math.round((totalSpent / totalAllocated) * 100)}% of budget used`
                  : "No budget yet"}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Remaining</h3>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ₵{totalRemaining.toLocaleString()}
              </p>
              <p className="text-sm text-blue-600 mt-2">
                {totalAllocated > 0
                  ? `${Math.round((totalRemaining / totalAllocated) * 100)}% remaining`
                  : "No budget yet"}
              </p>
            </div>
          </div>

          {/* Budget Categories */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Float by Category
            </h3>
            <div className="space-y-6">
              {budgets.length === 0 ? (
                <p className="text-gray-500 text-sm">No budgets set yet.</p>
              ) : (
                budgets.map((budget) => {
                  const percentage = budget.allocated
                    ? Math.round((budget.spent / budget.allocated) * 100)
                    : 0;

                  const remaining = budget.allocated - budget.spent;
                  const isInactive = budget.status === "Closed";

                  return (
                    <div
                      key={budget.id}
                      onClick={() =>
                        navigate(`budgets/${budget.id}`, { state: { budget } })
                      }
                      className={`relative border rounded-lg p-4 transition-all cursor-pointer
                        ${isInactive ? "bg-gray-50 border-gray-200 opacity-80" : "border-gray-100 hover:shadow-md"}
                      `}
                    >
                      {/* 📅 Header */}
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900">
                          {formatDate(budget.date)}
                        </h4>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            ₵{budget.spent.toLocaleString()} / ₵{budget.allocated.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">{percentage}% used</p>
                        </div>
                      </div>

                      {/* 📊 Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-500
                            ${isInactive
                              ? "bg-gray-400"
                              : percentage > 80
                              ? "bg-red-500"
                              : percentage > 60
                              ? "bg-yellow-500"
                              : "bg-green-500"
                            }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>

                      {/* 📈 Footer */}
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Remaining: ₵{remaining.toLocaleString()}</span>
                        <span>
                          {isInactive
                            ? "Float closed"
                            : remaining < 0
                            ? "Over budget"
                            : percentage > 80
                            ? "Approaching limit"
                            : "On track"}
                        </span>
                      </div>

                      {/* 🔖 Status & Toggle */}
                      <div className="flex justify-end items-center space-x-3 mt-4">
                        {/* Status Badge */}
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium
                            ${isInactive ? "bg-gray-200 text-gray-600" : "bg-green-100 text-green-700"}
                          `}
                        >
                          {isInactive ? "Closed" : "Active"}
                        </span>

                        {/* Toggle Button */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (loadingToggle) return; // prevent multiple clicks
                            await toggleBudgetStatus(budget.id);
                          }}
                          disabled={loadingToggle}
                          className={`flex items-center justify-center text-xs px-3 py-1.5 rounded-md font-medium transition
                            ${isInactive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-600 hover:bg-red-200"}
                            ${loadingToggle ? "opacity-70 cursor-not-allowed" : ""}
                          `}
                        >
                          {loadingToggle ? (
                            <svg
                              className="w-4 h-4 animate-spin mr-1 text-gray-600"
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
                                d="M4 12a8 8 0 018-8v8H4z"
                              />
                            </svg>
                          ) : null}
                          {loadingToggle ? "Processing..." : isInactive ? "Reopen Float" : "Close Float"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>


          </div>
        </div>
      );
    };

     // Assets Tab Component
const AssetsTab = () => {
  // ✅ Compute summary from assets
  const totalAssetValue = assets.reduce((sum: number, a: any) => Number(sum) + (Number(a.value) || 0), 0);

  const activeAssets = assets.filter((a: any) => a.status === "active").length;

  const annualDepreciation = assets.reduce((sum: number, a: any) => {
    if (a.depreciation_rate) {
      return sum + ((a.value || 0) * (a.depreciation_rate / 100));
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Asset Management</h2>
          <p className="text-sm text-gray-600 mt-1">Monitor and track company assets</p>
        </div>
        <button
          onClick={() => setShowAssetModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Asset</span>
        </button>
      </div>

      {/* Asset Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Asset Value</p>
              <h3 className="text-xl font-bold text-gray-900">
                ¢{totalAssetValue.toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Assets</p>
              <h3 className="text-xl font-bold text-gray-900">{activeAssets}</h3>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Annual Depreciation</p>
              <h3 className="text-xl font-bold text-gray-900">
                ¢{annualDepreciation.toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Name</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depreciation</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assets.map((asset: any) => (
                <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <Building2 className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{asset.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{asset.category}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ¢{(asset.value || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(asset.purchase_date)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {asset.depreciation_rate ? `${asset.depreciation_rate}% / year` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        asset.status === "active"
                          ? "bg-green-100 text-green-700"
                          : asset.status === "maintenance"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Edit3 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Trash2 className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


      // Analytics Tab Component
  const AnalyticsTab = () => {
    // Calculate expense breakdown by category
    const expenseByCategory = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      acc[category] = (acc[category] || 0) + (Number(expense.amount) || 0);
      return acc;
    }, {} as Record<string, number>);

    console.log(`Revenue: ${JSON.stringify(revenue)}`)

    // Calculate revenue breakdown by source
    const revenueBySource = revenue.reduce((acc, rev) => {
      const source = rev.source || 'Other';
      acc[source] = (acc[source] || 0) + (Number(rev.amount) || 0);
      return acc;
    }, {} as Record<string, number>);

    // Monthly trends (simplified - last 6 months)
    const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      
      const monthExpenses = expenses
        .filter(e => (e.expense_date)?.startsWith(monthKey))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      console.log(`Monthly expense: ${monthExpenses}`)
      const monthRevenue = revenue
        .filter(r => r.payment_date?.startsWith(monthKey))
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const monthCommission = commissions
  .filter(
    c =>
      c.commission_status === "approved" || c.commission_status === "paid" &&
      c.commission_date?.startsWith(monthKey)
  )
  .reduce(
    (sum, c) => sum + (Number(c.commission_amount) || 0),
    0
  );
      return {
        month: date.toLocaleDateString('en', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        commission: monthCommission,
        expenses: monthExpenses,
        profit: (monthRevenue + monthCommission) - monthExpenses

      };
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Financial Analytics</h2>
            <p className="text-sm text-gray-600 mt-1">Analyze financial performance and trends</p>
          </div>
          <div className="flex space-x-2">
            <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Date Range</span>
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Revenue Growth</h3>
              <ArrowUpRight className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {monthlyTrends.length > 1 ? 
                (((monthlyTrends[monthlyTrends.length - 1].revenue - monthlyTrends[monthlyTrends.length - 2].revenue) / 
                  (monthlyTrends[monthlyTrends.length - 2].revenue || 1)) * 100).toFixed(1) : '0'}%
            </p>
            <p className="text-sm text-gray-600 mt-2">vs last month</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Cost Efficiency</h3>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {operationalMetrics.operatingExpenseRatio.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 mt-2">expense ratio</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Break-even Point</h3>
              <Target className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ¢{operationalMetrics.breakEvenPoint.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mt-2">monthly revenue needed</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Asset Efficiency</h3>
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {operationalMetrics.roi.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 mt-2">return on assets</p>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Expense Breakdown</h3>
            <div className="space-y-4">
              {Object.entries(expenseByCategory).map(([category, amount]) => {
                const percentage = (amount / operationalMetrics.monthlyExpenses) * 100;
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{category}</span>
                      <span className="text-sm text-gray-600">¢{amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{percentage.toFixed(1)}% of total</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Sources</h3>
            <div className="space-y-4">
              {Object.entries(revenueBySource).map(([source, amount]) => {
                  const totalRevenue = operationalMetrics.monthlyRevenue || 0;
                const percentage = totalRevenue > 0 
                  ? (amount / totalRevenue) * 100 
                  : 0;
                return (
                  <div key={source} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{source}</span>
                      <span className="text-sm text-gray-600">¢{amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{percentage.toFixed(1)}% of total</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Trends</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expenses</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlyTrends.map((month, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{month.month}</td>
                    <td className="px-4 py-3 text-sm text-green-600">¢{month.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-green-600">¢{month.commission.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-red-600">¢{month.expenses.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      <span className={month.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {month.profit >= 0 ? '+' : ''}¢{month.profit.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={(month.revenue > 0 ? (month.profit / month.revenue) * 100 : 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {month.revenue > 0 ? ((month.profit / month.revenue) * 100).toFixed(1) : '0'}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };




  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage expenses, assets, budgets, and revenue</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

   {/* Navigation Tabs */}
<div className="bg-white border-b border-gray-200 px-6">
  <nav className="flex space-x-8">
    {userPermissions?.ALTER_FINANCE
      ? [
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'revenue', label: 'Revenue', icon: TrendingUp },
          { id: 'commission', label: 'Commission', icon: TrendingUp },
          { id: 'expenses', label: 'Expenses', icon: Banknote },
          { id: 'assets', label: 'Assets', icon: Building2 },
          { id: 'budget', label: 'Float', icon: PieChart },
          { id: 'analytics', label: 'Analytics', icon: LineChart }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))
      : [(
        // Only Budget tab
        <button
          key="budget"
          onClick={() => setActiveTab('budget')}
          className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
            activeTab === 'budget'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span className="font-medium">Float</span>
        </button>
            ),
            (
        // Only Budget tab
        <button
          key="expenses"
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
            activeTab === 'expenses'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span className="font-medium">Expense</span>
        </button>
            ),
            ]}
        </nav>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'revenue' && <RevenueTab />}
        {activeTab === 'commission' && <CommissionTab />}
        {activeTab === 'expenses' && <ExpensesTab />}
        {activeTab === 'assets' && <AssetsTab />}
        {activeTab === 'budget' && <FloatTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </div>

      {/* Modals */}
      {showExpenseModal && <ExpenseModal
        show={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSubmit={submitExpense}
        formData={expenseFormData}
        onFormChange={(field, value) =>
          setExpenseFormData(prev => ({ ...prev, [field]: value }))
        }
        loading={loading}
      />}
      {showAssetModal && <AssetModal
        show={showAssetModal}
        onClose={() => setShowAssetModal(false)}
        onSubmit={submitAsset}
        formData={assetFormData}
        onFormChange={(field, value) =>
          setAssetFormData(prev => ({ ...prev, [field]: value }))
        }
        loading={loading}
      />}
   
      {showBudgetModal && <BudgetModal
        show={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        onSubmit={submitBudget}
        formData={budgetFormData}
        onFormChange={(field, value) =>
          setBudgetFormData(prev => ({ ...prev, [field]: value }))
        }
        loading={loading}
      />}
      {showRevenueModal && <RevenueModal
        show={shownueModal}
        onClose={() => setShowRevenueModal(false)}
        onSubmit={submitRevenue}
        formData={revenueFormData}
        onFormChange={(field, value) =>
          setRevenueFormData(prev => ({ ...prev, [field]: value }))
        }
        loading={loading}
      />}
    </div>
  );
};

export default FinancialDashboard;
                 

