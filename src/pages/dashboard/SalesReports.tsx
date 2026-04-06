import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Download,
  FileText,
  Filter,
  MapPin,
  User,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Wallet,
  Activity,
  BarChart3,
  PieChart,
  Clock,
  Star,
  Award,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Printer,
  Mail,
  Share2,
  ChevronDown,
  ChevronUp,
  Search,
  Settings,
  Bell,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Home,
  Building2,
  Phone,
  Mail as MailIcon,
  Calendar as CalendarIcon,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  FileSpreadsheet,
  FileText as FilePdf,
  DownloadCloud,
  FilterX,
  Globe,
  Briefcase,
  CreditCard,
  PiggyBank,
} from 'lucide-react';
import { companyId } from '../../constants/appConstants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Staff {
  id: string;
  full_name: string;
  phone: string;
  role: string;
}

interface Location {
  id: string;
  name: string;
  code: string;
}

interface FilterState {
  staffId: string;
  location: string;
  dateRange: string;
  startDate: string;
  endDate: string;
}

interface SummaryStats {
  total_customers: number;
  total_deposit_transactions: number;
  total_collected: number;
  avg_deposit: number;
  highest_single_deposit: number;
  total_withdrawal_transactions: number;
  total_withdrawn: number;
  locations_covered: number;
  active_bankers: number;
}

interface LocationCollection {
  location: string;
  customer_count: number;
  deposit_count: number;
  total_collected: number;
  avg_deposit: number;
}

interface StaffPerformance {
  staff_id: string;
  staff_name: string;
  staff_phone: string;
  customers_served: number;
  deposit_count: number;
  total_collected: number;
  avg_deposit: number;
  locations_covered: number;
  last_activity: string;
}

interface CustomerRecord {
  customer_id: string;
  customer_name: string;
  phone_number: string;
  account_number: string;
  location: string;
  date_of_registration: string;
  status: string;
  registered_by_name: string;
  period_deposits: number;
  deposit_count: number;
  period_withdrawals: number;
  current_balance: number;
  last_transaction_date: string;
}

interface DailyTrend {
  day: string;
  deposits: number;
  withdrawals: number;
  deposit_count: number;
}

interface FieldReportData {
  summaryStats: SummaryStats;
  collectionsByLocation: LocationCollection[];
  collectionsByStaff: StaffPerformance[];
  customerList: CustomerRecord[];
  dailyTrend: DailyTrend[];
}

interface TargetVsActual {
  staff_id: string;
  staff_name: string;
  staff_phone: string;
  expected_collection: number;
  actual_collection: number;
  achievement_pct: number;
  customer_count: number;
  deposit_count: number;
}

interface RetentionCustomer {
  customer_id: string;
  customer_name: string;
  phone_number: string;
  account_number: string;
  location: string;
  date_of_registration: string;
  mobile_banker: string;
  banker_phone: string;
  last_deposit_date: string;
  days_since_last_deposit: number;
  current_balance: number;
  total_lifetime_deposits: number;
}

interface AcquisitionData {
  totalNewCustomers: number;
  byStaff: { staff_name: string; staff_phone: string; new_customers: number; locations: number }[];
  byLocation: { location: string; new_customers: number }[];
  dailyTrend: { day: string; new_customers: number }[];
  customers: CustomerRecord[];
}

// ─── API Service ─────────────────────────────────────────────────────────────

const API_BASE = 'https://susu-pro-backend.onrender.com/api';

const salesManagerApi = {
  
  getStaffList: async (companyId: string): Promise<Staff[]> => {
    const company_id = companyId
    const response = await fetch(`${API_BASE}/sales-manager/${companyId}/staff?company_id=${company_id}`);
    if (!response.ok) throw new Error('Failed to fetch staff');
    const data = await response.json();
    return data.data;
  },

  getLocations: async (companyId: string): Promise<string[]> => {
    const response = await fetch(`${API_BASE}/sales-manager/${companyId}/locations`);
    if (!response.ok) throw new Error('Failed to fetch locations');
    const data = await response.json();
    return data.data;
  },

  getFieldReport: async (companyId: string, filters: FilterState): Promise<FieldReportData> => {
    const params = new URLSearchParams();
    if (filters.staffId && filters.staffId !== 'all') params.append('staffId', filters.staffId);
    if (filters.location && filters.location !== 'all') params.append('location', filters.location);
    if (filters.dateRange) params.append('dateRange', filters.dateRange);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${API_BASE}/sales-manager/${companyId}/field-report?${params}`);
    if (!response.ok) throw new Error('Failed to fetch field report');
    const data = await response.json();
    return data.data;
  },

  getTargetVsActual: async (companyId: string, filters: FilterState): Promise<TargetVsActual[]> => {
    const params = new URLSearchParams();
    if (filters.staffId && filters.staffId !== 'all') params.append('staffId', filters.staffId);
    if (filters.location && filters.location !== 'all') params.append('location', filters.location);
    if (filters.dateRange) params.append('dateRange', filters.dateRange);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${API_BASE}/sales-manager/${companyId}/target-vs-actual?${params}`);
    if (!response.ok) throw new Error('Failed to fetch target vs actual');
    const data = await response.json();
    return data.data;
  },

  getRetentionReport: async (companyId: string, staffId?: string, location?: string, dormantDays: number = 30): Promise<RetentionCustomer[]> => {
    const params = new URLSearchParams();
    if (staffId && staffId !== 'all') params.append('staffId', staffId);
    if (location && location !== 'all') params.append('location', location);
    params.append('dormantDays', dormantDays.toString());

    const response = await fetch(`${API_BASE}/sales-manager/${companyId}/retention?${params}`);
    if (!response.ok) throw new Error('Failed to fetch retention report');
    const data = await response.json();
    return data.data;
  },

  getAcquisitionReport: async (companyId: string, filters: FilterState): Promise<AcquisitionData> => {
    const params = new URLSearchParams();
    if (filters.staffId && filters.staffId !== 'all') params.append('staffId', filters.staffId);
    if (filters.location && filters.location !== 'all') params.append('location', filters.location);
    if (filters.dateRange) params.append('dateRange', filters.dateRange);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${API_BASE}/sales-manager/${companyId}/acquisition?${params}`);
    if (!response.ok) throw new Error('Failed to fetch acquisition report');
    const data = await response.json();
    return data.data;
  },
};

// ─── Helper Functions ────────────────────────────────────────────────────────

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (dateString: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getAchievementColor = (percentage: number): string => {
  if (percentage >= 100) return 'text-green-600 bg-green-100';
  if (percentage >= 75) return 'text-blue-600 bg-blue-100';
  if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};

const getDormancyStatus = (days: number): { label: string; color: string } => {
  if (days >= 90) return { label: 'Critical', color: 'bg-red-100 text-red-700' };
  if (days >= 60) return { label: 'High Risk', color: 'bg-orange-100 text-orange-700' };
  if (days >= 30) return { label: 'At Risk', color: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Active', color: 'bg-green-100 text-green-700' };
};

const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(','))
  ];
  
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ─── Main Component ──────────────────────────────────────────────────────────

const SalesManagerDashboard: React.FC = () => {
  // Assume companyId comes from auth context or route params
  // State
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'targets' | 'retention' | 'acquisition' | 'customers'>('overview');
  
  // Filters
  const [filters, setFilters] = useState<FilterState>({
    staffId: 'all',
    location: 'all',
    dateRange: 'last_month',
    startDate: '',
    endDate: '',
  });
  
  const [showFilters, setShowFilters] = useState(true);
  const [dormantDays, setDormantDays] = useState(30);
  
  // Report Data
  const [fieldReport, setFieldReport] = useState<FieldReportData | null>(null);
  const [targetData, setTargetData] = useState<TargetVsActual[]>([]);
  const [retentionData, setRetentionData] = useState<RetentionCustomer[]>([]);
  const [acquisitionData, setAcquisitionData] = useState<AcquisitionData | null>(null);
  
  // UI State
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  
  // Date range presets
  const datePresets = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last_week', label: 'Last 7 Days' },
    { value: 'last_month', label: 'Last 30 Days' },
    { value: 'last_3_months', label: 'Last 90 Days' },
    { value: 'this_year', label: 'Year to Date' },
    { value: 'custom', label: 'Custom Range' },
  ];
  
  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);
  
  const loadInitialData = async () => {
    try {
      const [staff, locs] = await Promise.all([
        salesManagerApi.getStaffList(companyId),
        salesManagerApi.getLocations(companyId),
      ]);
      setStaffList(staff);
      setLocations(locs);
    } catch (err) {
      setError('Failed to load initial data');
      console.error(err);
    }
  };
  
  const runReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const [report, targets, retention, acquisition] = await Promise.all([
        salesManagerApi.getFieldReport(companyId, filters),
        salesManagerApi.getTargetVsActual(companyId, filters),
        salesManagerApi.getRetentionReport(companyId, filters.staffId, filters.location, dormantDays),
        salesManagerApi.getAcquisitionReport(companyId, filters),
      ]);
      setFieldReport(report);
      setTargetData(targets);
      setRetentionData(retention);
      setAcquisitionData(acquisition);
    } catch (err) {
      setError('Failed to generate report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const exportCurrentView = () => {
    if (activeTab === 'overview' && fieldReport) {
      exportToCSV(fieldReport.customerList, 'customer_report');
    } else if (activeTab === 'targets') {
      exportToCSV(targetData, 'target_vs_actual');
    } else if (activeTab === 'retention') {
      exportToCSV(retentionData, 'retention_report');
    } else if (activeTab === 'acquisition' && acquisitionData) {
      exportToCSV(acquisitionData.customers, 'acquisition_report');
    }
  };
  
  const resetFilters = () => {
    setFilters({
      staffId: 'all',
      location: 'all',
      dateRange: 'last_month',
      startDate: '',
      endDate: '',
    });
    setDormantDays(30);
  };
  
  // Summary Cards Component
  const SummaryCards = () => {
    if (!fieldReport) return null;
    const stats = fieldReport.summaryStats;
    
    const cards = [
      {
        title: 'Total Collection',
        value: formatCurrency(stats.total_collected),
        icon: DollarSign,
        color: 'bg-gradient-to-br from-green-500 to-green-600',
        trend: '+12.5%',
        trendUp: true,
      },
      {
        title: 'Active Customers',
        value: formatNumber(stats.total_customers),
        icon: Users,
        color: 'bg-gradient-to-br from-blue-500 to-blue-600',
        trend: '+8.2%',
        trendUp: true,
      },
      {
        title: 'Avg Deposit',
        value: formatCurrency(stats.avg_deposit),
        icon: Wallet,
        color: 'bg-gradient-to-br from-purple-500 to-purple-600',
        trend: '+3.1%',
        trendUp: true,
      },
      {
        title: 'Withdrawals',
        value: formatCurrency(stats.total_withdrawn),
        icon: ArrowUpRight,
        color: 'bg-gradient-to-br from-orange-500 to-orange-600',
        trend: '-2.4%',
        trendUp: false,
      },
      {
        title: 'Locations Covered',
        value: formatNumber(stats.locations_covered),
        icon: MapPin,
        color: 'bg-gradient-to-br from-teal-500 to-teal-600',
      },
      {
        title: 'Active Bankers',
        value: formatNumber(stats.active_bankers),
        icon: User,
        color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      },
    ];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${card.color} text-white`}>
                  <card.icon className="h-5 w-5" />
                </div>
                {card.trend && (
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {card.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {card.trend}
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.title}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Daily Trend Chart (simplified)
  const DailyTrendChart = () => {
    if (!fieldReport?.dailyTrend.length) return null;
    
    const maxDeposit = Math.max(...fieldReport.dailyTrend.map(d => d.deposits));
    
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary-500" />
            Daily Collection Trend
          </h3>
          <span className="text-xs text-gray-400">Last {fieldReport.dailyTrend.length} days</span>
        </div>
        <div className="flex items-end gap-1 h-40">
          {fieldReport.dailyTrend.map((day, idx) => {
            const height = maxDeposit > 0 ? (day.deposits / maxDeposit) * 100 : 0;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-primary-100 rounded-t-lg transition-all duration-300" style={{ height: `${height}%`, minHeight: '2px' }}>
                  <div className="w-full bg-primary-500 rounded-t-lg" style={{ height: `${height}%` }} />
                </div>
                <span className="text-[10px] text-gray-400 rotate-45 origin-left">
                  {new Date(day.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Collections by Location
  const LocationTable = () => {
    if (!fieldReport?.collectionsByLocation.length) return null;
    
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary-500" />
            Collections by Location
          </h3>
          <span className="text-xs text-gray-400">{fieldReport.collectionsByLocation.length} locations</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Customers</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Collected</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Average</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fieldReport.collectionsByLocation.map((loc, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpandedLocation(expandedLocation === loc.location ? null : loc.location)}>
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{loc.location}</td>
                  <td className="px-5 py-3 text-sm text-right text-gray-600">{formatNumber(loc.customer_count)}</td>
                  <td className="px-5 py-3 text-sm text-right text-gray-600">{formatNumber(loc.deposit_count)}</td>
                  <td className="px-5 py-3 text-sm text-right font-semibold text-green-600">{formatCurrency(loc.total_collected)}</td>
                  <td className="px-5 py-3 text-sm text-right text-gray-600">{formatCurrency(loc.avg_deposit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Staff Performance Table
  const StaffTable = () => {
    if (!fieldReport?.collectionsByStaff.length) return null;
    
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5 text-primary-500" />
            Staff Performance
          </h3>
          <span className="text-xs text-gray-400">{fieldReport.collectionsByStaff.length} active bankers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banker</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Customers</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Deposits</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Collected</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Deposit</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Locations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fieldReport.collectionsByStaff.map((staff, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpandedStaff(expandedStaff === staff.staff_id ? null : staff.staff_id)}>
                  <td className="px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{staff.staff_name}</p>
                      <p className="text-xs text-gray-400">{staff.staff_phone}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-right text-gray-600">{formatNumber(staff.customers_served)}</td>
                  <td className="px-5 py-3 text-sm text-right text-gray-600">{formatNumber(staff.deposit_count)}</td>
                  <td className="px-5 py-3 text-sm text-right font-semibold text-green-600">{formatCurrency(staff.total_collected)}</td>
                  <td className="px-5 py-3 text-sm text-right text-gray-600">{formatCurrency(staff.avg_deposit)}</td>
                  <td className="px-5 py-3 text-sm text-right text-gray-600">{formatNumber(staff.locations_covered)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Target vs Actual Table
  const TargetTable = () => {
    if (!targetData.length) return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No target data available for selected filters</p>
      </div>
    );
    
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary-500" />
            Target vs Actual Performance
          </h3>
          <span className="text-xs text-gray-400">Ranked by achievement</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banker</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Customers</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Achievement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {targetData.map((staff, idx) => {
                const achievementColor = getAchievementColor(staff.achievement_pct);
                return (
                  <tr key={staff.staff_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      {idx === 0 ? (
                        <Award className="h-5 w-5 text-yellow-500" />
                      ) : idx === 1 ? (
                        <Award className="h-5 w-5 text-gray-400" />
                      ) : idx === 2 ? (
                        <Award className="h-5 w-5 text-amber-600" />
                      ) : (
                        <span className="text-sm text-gray-400">#{idx + 1}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{staff.staff_name}</p>
                        <p className="text-xs text-gray-400">{staff.staff_phone}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-right text-gray-600">{formatNumber(staff.customer_count)}</td>
                    <td className="px-5 py-3 text-sm text-right text-gray-600">{formatCurrency(staff.expected_collection)}</td>
                    <td className="px-5 py-3 text-sm text-right font-semibold text-green-600">{formatCurrency(staff.actual_collection)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${achievementColor}`}>
                        {staff.achievement_pct?.toFixed(1) || 0}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Retention Table
  const RetentionTable = () => {
    if (!retentionData.length) return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No dormant customers found for selected filters</p>
      </div>
    );
    
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary-500" />
            Dormant Customers ({retentionData.length})
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Dormancy threshold:</label>
            <select
              value={dormantDays}
              onChange={(e) => setDormantDays(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1"
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
            <button
              onClick={() => runReport()}
              className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banker</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Last Deposit</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {retentionData.map((customer) => {
                const status = getDormancyStatus(customer.days_since_last_deposit);
                return (
                  <tr key={customer.customer_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{customer.customer_name}</p>
                        <p className="text-xs text-gray-400">{customer.phone_number}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{customer.location}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{customer.mobile_banker}</td>
                    <td className="px-5 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(customer.current_balance)}</td>
                    <td className="px-5 py-3 text-sm text-center text-gray-500">{formatDate(customer.last_deposit_date)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Customer List Table
  const CustomerTable = () => {
    if (!fieldReport?.customerList.length) return null;
    
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-500" />
            Customer Details ({fieldReport.customerList.length})
          </h3>
          <button
            onClick={() => exportToCSV(fieldReport.customerList, 'customer_details')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <DownloadCloud className="h-4 w-4" />
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Period Deposits</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fieldReport.customerList.map((customer) => (
                <tr key={customer.customer_id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                  <td className="px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{customer.customer_name}</p>
                      <p className="text-xs text-gray-400">{customer.phone_number}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-gray-600">{customer.account_number}</p>
                    <p className="text-xs text-gray-400">Reg: {formatDate(customer.date_of_registration)}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{customer.location}</td>
                  <td className="px-5 py-3 text-sm text-right">
                    <p className="font-semibold text-green-600">{formatCurrency(customer.period_deposits)}</p>
                    <p className="text-xs text-gray-400">{formatNumber(customer.deposit_count)} txns</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(customer.current_balance)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      customer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Acquisition Summary
  const AcquisitionSummary = () => {
    if (!acquisitionData) return null;
    
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-xl">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-xs text-gray-400">New Customers</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(acquisitionData.totalNewCustomers)}</p>
            <p className="text-xs text-gray-500 mt-1">in selected period</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Star className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xs text-gray-400">Top Performer</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{acquisitionData.byStaff[0]?.staff_name || 'N/A'}</p>
            <p className="text-xs text-gray-500 mt-1">{acquisitionData.byStaff[0]?.new_customers || 0} new customers</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-xl">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-xs text-gray-400">Top Location</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{acquisitionData.byLocation[0]?.location || 'N/A'}</p>
            <p className="text-xs text-gray-500 mt-1">{acquisitionData.byLocation[0]?.new_customers || 0} new customers</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">By Staff</h4>
            <div className="space-y-2">
              {acquisitionData.byStaff.slice(0, 5).map((staff, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{staff.staff_name}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${(staff.new_customers / acquisitionData.byStaff[0].new_customers) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{staff.new_customers}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">By Location</h4>
            <div className="space-y-2">
              {acquisitionData.byLocation.slice(0, 5).map((loc, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{loc.location}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${(loc.new_customers / acquisitionData.byLocation[0].new_customers) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{loc.new_customers}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-900">New Customers List</h4>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Customer</th>
                  <th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Phone</th>
                  <th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Location</th>
                  <th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Registered By</th>
                  <th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {acquisitionData.customers.slice(0, 20).map((customer) => (
                  <tr key={customer.customer_id} className="hover:bg-gray-50">
                    <td className="px-5 py-2 text-sm text-gray-900">{customer.customer_name}</td>
                    <td className="px-5 py-2 text-sm text-gray-600">{customer.phone_number}</td>
                    <td className="px-5 py-2 text-sm text-gray-600">{customer.location}</td>
                    <td className="px-5 py-2 text-sm text-gray-600">{customer.registered_by_name}</td>
                    <td className="px-5 py-2 text-sm text-gray-500">{formatDate(customer.date_of_registration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };
  
  // Filter Panel
  const FilterPanel = () => (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 transition-all duration-300 ${showFilters ? 'p-5' : 'p-3'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary-500" />
          <h3 className="text-base font-semibold text-gray-900">Report Filters</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FilterX className="h-4 w-4" />
            Reset
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Mobile Banker</label>
            <select
              value={filters.staffId}
              onChange={(e) => setFilters(prev => ({ ...prev, staffId: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            >
              <option value="all">All Bankers</option>
              {staffList.map(staff => (
                <option key={staff.id} value={staff.id}>{staff.full_name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Location</label>
            <select
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            >
              <option value="all">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value, startDate: '', endDate: '' }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            >
              {datePresets.map(preset => (
                <option key={preset.value} value={preset.value}>{preset.label}</option>
              ))}
            </select>
          </div>
          
          {filters.dateRange === 'custom' && (
            <div className="md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={runReport}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 bg-[#3d5a3d] text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Generate Report
        </button>
        
        {fieldReport && (
          <button
            onClick={exportCurrentView}
            className="flex items-center gap-2 px-5 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            <DownloadCloud className="h-4 w-4" />
            Export
          </button>
        )}
      </div>
    </div>
  );
  
  // Tab Navigation
  const TabNavigation = () => (
    <div className="flex items-center gap-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-1 mb-6">
      <button
        onClick={() => setActiveTab('overview')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
          activeTab === 'overview'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <LayoutDashboard className="h-4 w-4" />
        Overview
      </button>
      <button
        onClick={() => setActiveTab('targets')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
          activeTab === 'targets'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Target className="h-4 w-4" />
        Targets
      </button>
      <button
        onClick={() => setActiveTab('retention')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
          activeTab === 'retention'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <AlertCircle className="h-4 w-4" />
        Retention
      </button>
      <button
        onClick={() => setActiveTab('acquisition')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
          activeTab === 'acquisition'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Users className="h-4 w-4" />
        Acquisition
      </button>
      <button
        onClick={() => setActiveTab('customers')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
          activeTab === 'customers'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <FileText className="h-4 w-4" />
        Customers
      </button>
    </div>
  );
  
  // Customer Detail Modal
  const CustomerModal = () => {
    if (!selectedCustomer) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCustomer(null)}>
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Customer Details</h3>
            <button onClick={() => setSelectedCustomer(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400">Customer Name</label>
                <p className="text-sm font-medium text-gray-900">{selectedCustomer.customer_name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400">Phone Number</label>
                <p className="text-sm text-gray-700">{selectedCustomer.phone_number}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400">Account Number</label>
                <p className="text-sm text-gray-700">{selectedCustomer.account_number}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400">Location</label>
                <p className="text-sm text-gray-700">{selectedCustomer.location}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400">Registration Date</label>
                <p className="text-sm text-gray-700">{formatDate(selectedCustomer.date_of_registration)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400">Registered By</label>
                <p className="text-sm text-gray-700">{selectedCustomer.registered_by_name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400">Status</label>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  selectedCustomer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {selectedCustomer.status}
                </span>
              </div>
              <div>
                <label className="text-xs text-gray-400">Last Transaction</label>
                <p className="text-sm text-gray-700">{formatDateTime(selectedCustomer.last_transaction_date)}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-4 mt-2">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Financial Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-xs text-green-600">Period Deposits</p>
                  <p className="text-xl font-bold text-green-700">{formatCurrency(selectedCustomer.period_deposits)}</p>
                  <p className="text-xs text-green-500">{selectedCustomer.deposit_count} transactions</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-xs text-red-600">Period Withdrawals</p>
                  <p className="text-xl font-bold text-red-700">{formatCurrency(selectedCustomer.period_withdrawals)}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 col-span-2">
                  <p className="text-xs text-blue-600">Current Balance</p>
                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(selectedCustomer.current_balance)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="sticky bottom-0 bg-gray-50 px-6 py-3 flex justify-end gap-2 border-t border-gray-100">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                exportToCSV([selectedCustomer], `customer_${selectedCustomer.customer_id}`);
                setSelectedCustomer(null);
              }}
              className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Export Details
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-sm">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sales Manager Dashboard</h1>
              <p className="text-xs text-gray-500">Field Operations & Performance Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
              <HelpCircle className="h-5 w-5" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center">
                <span className="text-white text-xs font-bold">SM</span>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">Sales Manager</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="p-6">
        <div className="max-w-[1600px] mx-auto">
          <FilterPanel />
          <TabNavigation />
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
              <span className="ml-3 text-gray-500">Generating report...</span>
            </div>
          )}
          
          {!loading && activeTab === 'overview' && fieldReport && (
            <>
              <SummaryCards />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <DailyTrendChart />
                </div>
                <div>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 h-full">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <PieChart className="h-4 w-4 text-primary-500" />
                      Quick Stats
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Highest Deposit</span>
                        <span className="text-sm font-bold text-green-600">{formatCurrency(fieldReport.summaryStats.highest_single_deposit)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Total Withdrawals</span>
                        <span className="text-sm font-medium text-orange-600">{formatCurrency(fieldReport.summaryStats.total_withdrawn)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Deposit Transactions</span>
                        <span className="text-sm font-medium text-gray-700">{formatNumber(fieldReport.summaryStats.total_deposit_transactions)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Withdrawal Transactions</span>
                        <span className="text-sm font-medium text-gray-700">{formatNumber(fieldReport.summaryStats.total_withdrawal_transactions)}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Net Collection</span>
                          <span className="text-sm font-bold text-gray-900">{formatCurrency(fieldReport.summaryStats.total_collected - fieldReport.summaryStats.total_withdrawn)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <LocationTable />
              <StaffTable />
              <CustomerTable />
            </>
          )}
          
          {!loading && activeTab === 'targets' && <TargetTable />}
          
          {!loading && activeTab === 'retention' && <RetentionTable />}
          
          {!loading && activeTab === 'acquisition' && acquisitionData && <AcquisitionSummary />}
          
          {!loading && activeTab === 'customers' && fieldReport && <CustomerTable />}
          
          {!loading && !fieldReport && !targetData.length && activeTab !== 'acquisition' && activeTab !== 'retention' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Filter className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Select filters and click "Generate Report" to view data</p>
              <button
                onClick={runReport}
                className="px-5 py-2 bg-[#3d5a3d] text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                Generate Report
              </button>
            </div>
          )}
        </div>
      </main>
      
      <CustomerModal />
    </div>
  );
};

export default SalesManagerDashboard;