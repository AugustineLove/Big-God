import React, { useEffect, useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  FileText, 
  Download, 
  Upload, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Building, 
  Percent, 
  Target, 
  BarChart3, 
  PieChart,
  Banknote,
  Receipt,
  Calculator,
  Users,
  Home,
  Briefcase,
  Car,
  GraduationCap,
  ChevronRight
} from 'lucide-react';
import { useAccounts } from '../../contexts/dashboard/Account';
import { companyId, userRole, userUUID } from '../../constants/appConstants';
import { Account } from '../../data/mockData';
import { ApprovePayload, useActiveLoans, useLoanApplications, useLoans } from '../../contexts/dashboard/Loan';
import { useCustomers } from '../../contexts/dashboard/Customers';
import NewLoanModal from './Components/NewLoanModal';
import GroupLoanBreakdownModal from './Components/GroupLoanBreakDownModal';
import LoanDetailModal from './Components/LoanDetailModal';
interface ApprovalForm {
  disbursedamount: number;
  interestRate: number;
  loanterm: number;
  disbursementdate: string;
  notes: string;
}

const LoanManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedLoan, setSelectedLoan] = useState<Account>();
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const { companyLoans, fetchLoanAccounts } = useAccounts();
  const { getGroupLoanWithMembers, logRepayment } = useLoans();
const activeLoans = useActiveLoans();
  const { customers } = useCustomers();
  const { allCompanyLoans, loading, approveLoan } = useLoans();
    useEffect(() => {
    if (companyId) {
      fetchLoanAccounts(companyId);
    }
  }, [companyId]);

  const loanApplications = [
  ...companyLoans.filter(l => l.status !== 'approved')
];


console.log('Loan applications:', loanApplications);


  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'defaulted': return 'bg-gray-100 text-gray-700';
      case 'under_review': return 'bg-orange-100 text-orange-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getLoanTypeIcon = (type?: string) => {
    switch (type) {
      case 'Business Loan': return <Briefcase size={16} />;
      case 'Personal Loan': return <User size={16} />;
      case 'Agricultural Loan': return <Home size={16} />;
      case 'Mortgage': return <Building size={16} />;
      case 'Education Loan': return <GraduationCap size={16} />;
      case 'Auto Loan': return <Car size={16} />;
      default: return <CreditCard size={16} />;
    }
  };

  // Calculate portfolio metrics
  const portfolioMetrics = {
    totalLoans: companyLoans.length,
    totalDisbursed: companyLoans.reduce((sum, loan) => sum + loan.disbursedAmount, 0),
    totalOutstanding: companyLoans.reduce((sum, loan) => sum + loan.outstandingBalance, 0),
    totalRepaid: companyLoans.reduce((sum, loan) => sum + loan.amountPaid, 0),
    overdueLoans: companyLoans.filter(loan => loan.status === 'overdue').length,
    overdueAmount: companyLoans.filter(loan => loan.status === 'overdue').reduce((sum, loan) => sum + loan.outstandingBalance, 0),
    activeLoans: companyLoans.filter(loan => loan.status === 'active').length,
    pendingApprovals: companyLoans.filter(loan => loan.status === 'pending_approval').length
  };

  const handleApproveLoan = async (data: ApprovePayload) => {
     await approveLoan(data)
     
    setShowApprovalModal(false);
    setSelectedLoan(null)
  }

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Portfolio metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">₵{portfolioMetrics.totalDisbursed.toLocaleString()}</div>
              <div className="text-blue-100">Total Disbursed</div>
            </div>
            <Banknote size={32} />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">₵{portfolioMetrics.totalOutstanding.toLocaleString()}</div>
              <div className="text-green-100">Outstanding</div>
            </div>
            <Target size={32} />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">₵{portfolioMetrics.overdueAmount.toLocaleString()}</div>
              <div className="text-red-100">Overdue Amount</div>
            </div>
            <AlertTriangle size={32} />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{portfolioMetrics.totalLoans}</div>
              <div className="text-purple-100">Total Loans</div>
            </div>
            <CreditCard size={32} />
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Loans</h3>
            <CheckCircle className="text-green-500" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{portfolioMetrics.activeLoans}</div>
          <div className="text-sm text-gray-600">Performing loans</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Overdue Loans</h3>
            <XCircle className="text-red-500" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{portfolioMetrics.overdueLoans}</div>
          <div className="text-sm text-gray-600">Require attention</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
            <Clock className="text-yellow-500" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{portfolioMetrics.pendingApprovals}</div>
          <div className="text-sm text-gray-600">Awaiting review</div>
        </div>
      </div>

      {/* Recent loan activities */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Loan Activities</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
            <CheckCircle className="text-green-500" size={20} />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Payment Received - LN001</div>
              <div className="text-sm text-gray-600">Akosua Mensah paid ₵4,833 • 2 hours ago</div>
            </div>
            <div className="text-green-600 font-semibold">+₵4,833</div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
            <Banknote className="text-blue-500" size={20} />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Loan Disbursed - LN002</div>
              <div className="text-sm text-gray-600">₵15,000 disbursed to Yaw Osei • 1 day ago</div>
            </div>
            <div className="text-blue-600 font-semibold">₵15,000</div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg">
            <Clock className="text-yellow-500" size={20} />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Payment Overdue - LN002</div>
              <div className="text-sm text-gray-600">Yaw Osei missed payment • 3 days ago</div>
            </div>
            <div className="text-yellow-600 font-semibold">₵2,845</div>
          </div>
        </div>
      </div>
    </div>
  );

  const LoansTab = () => {
  const { loading } = useLoans();
  const loans = useActiveLoans(); // 👈 only active loans

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Loan Portfolio</h2>
          <p className="text-gray-600">Manage all active loans</p>
        </div>

        <button
          onClick={() => setShowNewLoanModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          + New Loan
        </button>
      </div>

      {/* Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
  {loading ? (
    // Skeleton Loader
    [1, 2, 3].map((i) => (
      <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
        <div className="h-8 bg-gray-50 rounded w-3/4 mb-6" />
        <div className="space-y-3">
          <div className="h-3 bg-gray-50 rounded" />
          <div className="h-3 bg-gray-50 rounded w-5/6" />
        </div>
      </div>
    ))
  ) : loans.length === 0 ? (
    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
      <p className="text-gray-400 font-medium text-lg">No loans found in the system</p>
    </div>
  ) : (
    loans.map((loan) => {
      const paid = loan.amountpaid ?? 0;
      const total = loan.totalpayable ?? 1;
      const progress = (paid / total) * 100;
      const isGroup = loan.loantype === 'group';

      return (
        <div key={loan.id} className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
          {/* Top Section: Status & Type */}
          <div className="p-5 flex justify-between items-start pb-2">
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                isGroup ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {loan.loantype} Loan
              </span>
              <h3 className="text-sm font-mono text-gray-400 mt-2">#{loan.id.slice(0, 8)}</h3>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              loan.status === 'active' || loan.status === 'approved' 
                ? 'bg-emerald-50 text-emerald-600' 
                : 'bg-amber-50 text-amber-600'
            }`}>
              {loan.status.toUpperCase()}
            </span>
          </div>

          {/* Main Info */}
          <div className="px-5 py-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#F5F5DC] flex items-center justify-center text-[#4A635D] font-bold">
                {loan.group_name?.charAt(0) ?? loan.recipient_name?.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-800 leading-none">{loan.group_name ?? loan.recipient_name}</p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Phone size={10} /> {loan.customer_phone ?? loan.recipient_phone}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Disbursed</p>
                <p className="text-xl font-black text-slate-900">₵{(loan.disbursedamount ?? 0).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Rate</p>
                <p className="text-sm font-bold text-[#4A635D]">{loan.interestrateloan}% • {loan.loanterm}m</p>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="px-5 py-4 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gray-400 uppercase">Repayment Progress</span>
              <span className="text-slate-700">{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#4A635D] h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-500 pt-1">
              <span>Paid: ₵{paid.toLocaleString()}</span>
              <span>Balance: ₵{(total - paid).toLocaleString()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-auto p-4 bg-gray-50/50 border-t border-gray-50 flex gap-3">
            <button 
              onClick={() => setSelectedLoan(loan)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              <Eye size={16} /> Details
            </button>
            <button 
              onClick={() => setShowRepaymentModal(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#4A635D] text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all"
            >
              <CreditCard size={16} /> Pay
            </button>
          </div>
        </div>
      );
    })
  )}
</div>
    </div>
  );
};

  const ApplicationsTab = () => {
  const applications = useLoanApplications();
  const { approveLoan, rejectLoan, loading } = useLoans();
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewBreakdown = (id) => {
    setSelectedGroupId(id);
    setIsModalOpen(true);
  };
  const onClose = () => {
    setIsModalOpen(false);
    setSelectedGroupId(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Loan Applications</h2>
        <p className="text-gray-600">Pending loan requests</p>
      </div>

      {applications.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
    <p className="text-gray-400 font-medium">No pending applications found</p>
  </div>
) : (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
    {applications.map((app) => (
      <div 
        key={app.id} 
        className="group relative bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
      >
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-xl text-slate-800 tracking-tight">
                {app.group_name}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                {app.status}
              </span>
            </div>
            <p className="text-xs font-mono text-gray-400 flex items-center gap-2">
              ID: {app.id.slice(0, 8)}... • <Calendar size={12} /> {new Date(app.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => rejectLoan({ loanId: app.id })}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              Reject
            </button>
            <button
              onClick={() => approveLoan({ loanId: app.id })}
              disabled={loading}
              className="flex-1 sm:flex-none px-6 py-2 text-sm font-semibold text-white bg-[#4A635D] hover:bg-[#3d524d] rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              Approve Loan
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-4 border-y border-gray-50">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Amount</p>
            <p className="text-lg font-bold text-slate-900">₵{(app.loanamount ?? 0).toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Duration</p>
            <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <Clock size={14} className="text-gray-400" /> {app.loanterm} Months
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Interest</p>
            <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <Percent size={14} className="text-gray-400" /> {app.interestrateloan}%
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Members</p>
            <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <Users size={14} className="text-gray-400" /> {app.member_count} Participants
            </p>
          </div>
        </div>

        {/* Footer Detail Section */}
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center text-sm gap-3">
          <div className="flex items-center gap-4 text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-[#F5F5DC] flex items-center justify-center text-[10px] font-bold text-[#4A635D]">
                {app.customer_name?.charAt(0)}
              </div>
              <span className="text-xs font-medium">Leader: {app.customer_name}</span>
            </div>
            <div className="flex items-center gap-1.5 border-l pl-4">
              <Briefcase size={14} className="text-gray-400" />
              <span className="text-xs italic truncate max-w-[150px]">{app.purpose}</span>
            </div>
          </div>
          
          <button className="text-[#4A635D] text-xs font-bold flex items-center gap-1 hover:underline"
            onClick={() => handleViewBreakdown(app.id)}
          >
            View Breakdown <ChevronRight size={14} />
          </button>
        </div>
         {
          isModalOpen && (
            <GroupLoanBreakdownModal 
              groupId={app.id}
              isOpen={isModalOpen}
              onClose={onClose}
            />
          )      
        }
      </div>
      
    ))}
  </div>
)}
   
    </div>
    
  );
};


  const RepaymentModal = () => {
    if (!showRepaymentModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Record Loan Payment</h2>
              <button 
                onClick={() => setShowRepaymentModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loan ID</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Select loan</option>
                  {companyLoans.filter(loan => loan.status === 'active').map(loan => (
                    <option key={loan.id} value={loan.id}>
                      {loan.id} - {loan.customer_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount (₵)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Cash</option>
                  <option>Mobile Money</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Transaction reference (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes (optional)"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <button 
                onClick={() => setShowRepaymentModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                Record Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ApprovalModal = (props: {interestmethod: string}) => {
    console.log(props.interestmethod)
  if (!showApprovalModal) return null;

  const [form, setForm] = useState<ApprovalForm>({
    disbursedamount: Number(selectedLoan?.disbursedamount) || 0,
    interestRate: selectedLoan?.interestrateloan || 0,
    loanterm: selectedLoan?.loanterm || 12,
    disbursementdate: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        e.target.type === "number"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async () => {
    console.log('Submit');
    if (!selectedLoan) return;
    console.log('Submit');
    console.log('Submitss');
    if (form.disbursedamount <= 0) {
      alert("Approved amount must be greater than zero");
      return;
    }

    const payload = {
      loanId: selectedLoan.id || '',
      disbursedamount: form.disbursedamount,
      interestrateloan: form.interestRate,
      loanterm: form.loanterm,
      disbursementdate: form.disbursementdate,
      notes: form.notes,
      approvedby: userUUID,
      created_by_type: userRole,
      interestmethod: props.interestmethod
    };
    console.log(payload);

    await handleApproveLoan(payload);

  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Loan Approval
            </h2>
            <button
              onClick={() => setShowApprovalModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Approved Amount */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Approval Amount (₵)
              </label>
              <input
                type="number"
                name="disbursedamount"
                value={form.disbursedamount}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {/* Interest */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                name="interestRate"
                value={form.interestRate}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {/* Tenure */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Tenure (Months)
              </label>
              <select
                name="loanterm"
                value={form.loanterm}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              >
                {[3, 6, 12, 18, 24, 36, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} months
                  </option>
                ))}
              </select>
            </div>

            {/* Disbursement Date */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Disbursement Date
              </label>
              <input
                type="date"
                name="disbursementdate"
                value={form.disbursementdate}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Conditions / Notes
              </label>
              <textarea
                name="notes"
                rows={3}
                value={form.notes}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button
              onClick={() => {setShowApprovalModal(false)
                setSelectedLoan(null)
              }}
              className="flex-1 border px-4 py-2 rounded-lg"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              Approve Loan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Loan Management</h1>
          <p className="text-gray-600">Comprehensive loan portfolio management system</p>
        </div>

        {/* Navigation tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('loans')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'loans'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Loans
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'applications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Applications
            </button>
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'loans' && <LoansTab />}
        {activeTab === 'applications' && <ApplicationsTab />}
      </div>

      {/* Modals */}
      <LoanDetailModal
        selectedLoan={selectedLoan}
        setSelectedLoan={setSelectedLoan}
        setShowRepaymentModal={setShowRepaymentModal}
        getGroupLoanWithMembers={getGroupLoanWithMembers}
        logRepayment={logRepayment}
      />
      {/* <NewLoanModal
      showNewLoanModal = {showNewLoanModal}
      setShowNewLoanModal = {setShowNewLoanModal}
      availableCustomers = {customers}
       /> */}
       <NewLoanModal 
         showNewLoanModal={showNewLoanModal}
          setShowNewLoanModal={setShowNewLoanModal}
          availableCustomers={customers}
       />
      <RepaymentModal />
      <ApprovalModal interestmethod={selectedLoan?.interestmethod ?? ''}/>
    </div>
  );
};

export default LoanManagement;