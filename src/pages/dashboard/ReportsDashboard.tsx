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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCommissionStats } from '../../contexts/dashboard/Commissions';
import NewRevenueModal, { RevenueItem } from './Components/revenueModal';
import { useBudget } from '../../contexts/dashboard/Budget';
import PLModal from './Components/plModal';
import { useStaff } from '../../contexts/dashboard/Staff';
import FloatTab from './Components/FloatTab';
import Reports from './Reports';
import AccountantReports from './AccountantReports';

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
  teller_id?: string;
}

interface ModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (formData: FormDataState, company_id: string) => void;
  formData: FormDataState;
  onFormChange: (field: keyof FormDataState, value: string) => void;
  loading: boolean;
}

const financeTabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'revenue', label: 'Revenue', icon: TrendingUp },
  { id: 'commission', label: 'Commission', icon: TrendingUp },
  { id: 'expenses', label: 'Expenses', icon: Banknote },
  { id: 'assets', label: 'Assets', icon: Building2 },
  { id: 'budget', label: 'Float', icon: PieChart },
  { id: 'analytics', label: 'Analytics', icon: LineChart },
]
// Main Component
const ReportsDashboard: React.FC = () => {
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
  const { dashboardStaffList } = useStaff();
  const [setRevenue ] = useState<RevenueItem>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'overview';
  
  useEffect(() => {
    fetchFinanceData();
    setActiveTab(tabFromUrl)
  }, [companyId, tabFromUrl]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <div className="px-6 py-8">
        {activeTab === 'general' && <Reports />}
        {activeTab === 'accounting' && <AccountantReports />}
      </div>
    </div>
  );
};

export default ReportsDashboard;
                 

