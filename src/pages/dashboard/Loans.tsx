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
  GraduationCap
} from 'lucide-react';
import { useAccounts } from '../../contexts/dashboard/Account';
import { companyId, userRole, userUUID } from '../../constants/appConstants';
import { Account } from '../../data/mockData';
import { ApprovePayload, useLoans } from '../../contexts/dashboard/Loan';

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

  const LoansTab = () => (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Loan Portfolio</h2>
          <p className="text-gray-600">Manage all active and inactive loans</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Download size={18} />
            Export
          </button>
          <button 
            onClick={() => setShowNewLoanModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            New Loan
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by customer name or loan ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Status</option>
            <option>Active</option>
            <option>Overdue</option>
            <option>Completed</option>
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Types</option>
            <option>Business Loan</option>
            <option>Personal Loan</option>
            <option>Agricultural Loan</option>
            <option>Mortgage</option>
          </select>
        </div>
      </div>

      {/* Loans table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Loan Details</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Customer</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Amount & Terms</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Repayment Status</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {companyLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {getLoanTypeIcon(loan.loantype)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{loan.id}</div>
                        <div className="text-sm text-gray-600">{loan.loantype}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">{loan.customer_name}</div>
                    <div className="text-sm text-gray-600">{loan.customer_phone}</div>
                    <div className="text-sm text-gray-600">{loan.mobile_banker}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">₵{(loan.disbursedamount ?? 0).toLocaleString()}</div>
                    <div className="text-sm text-gray-600">{loan.interestrateloan}% • {loan.loanterm} months</div>
                    <div className="text-sm text-gray-600">₵{(loan.monthlypayment ?? 0).toLocaleString()}/month</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-900">
                        ₵{(loan.amountpaid ?? 0).toLocaleString()} / ₵{(loan.totalpayable ?? 0).toLocaleString()}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(parseFloat(loan.amountpaid) / parseFloat(loan.totalpayable)) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600">
                        Outstanding: ₵{(loan.outstandingbalance ?? 0).toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(loan.status)}`}>
                        {loan.status.replace('_', ' ')}
                      </span>
                      {loan.daysOverdue > 0 && (
                        <div className="text-xs text-red-600 font-medium">
                          {loan.daysOverdue} days overdue
                        </div>
                      )}
                      <div className={`text-xs font-medium ${getRiskColor(loan.riskLevel)}`}>
                        {loan.riskLevel} risk
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedLoan(loan)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {loan.status === 'active' && (
                        <button 
                          onClick={() => setShowRepaymentModal(true)}
                          className="text-green-600 hover:text-green-800 transition-colors"
                          title="Record Payment"
                        >
                          <Receipt size={16} />
                        </button>
                      )}
                      <button className="text-gray-600 hover:text-gray-800 transition-colors">
                        <Edit size={16} />
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

  const ApplicationsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Loan Applications</h2>
          <p className="text-gray-600">Review and process new loan applications</p>
        </div>
      </div>

      {/* Applications list */}
      <div className="space-y-4">
        {loanApplications.map((app) => (
          <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <FileText className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{app.customer_name}</h3>
                    <p className="text-gray-600">{app.id} • Applied {app.created_at}</p>
                  </div>
                  <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(app.status)}`}>
                    {app.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Loan Amount</div>
                    <div className="font-semibold text-gray-900">₵{(app.disbursedamount ?? 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Loan Type</div>
                    <div className="font-semibold text-gray-900">{app.loantype}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Credit Score</div>
                    <div className="font-semibold text-gray-900">{app.creditScore}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">Purpose</div>
                  <div className="text-gray-900">{app.purpose}</div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">Documents Submitted</div>
                  {/* <div className="flex flex-wrap gap-2">
                    {app.documents.map((doc, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded">
                        {doc}
                      </span>
                    ))}
                  </div> */}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {app.status === 'requested' && (
                  <>
                    <button 
                      onClick={() => {
                        setSelectedLoan(app)
                        setShowApprovalModal(true)
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                      <XCircle size={16} />
                      Reject
                    </button>
                  </>
                )}
                <button 
                onClick={() => setSelectedLoan(app)}      
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const LoanDetailModal = () => {
    if (!selectedLoan) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  {getLoanTypeIcon(selectedLoan.loantype)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedLoan.id}</h2>
                  <p className="text-gray-600">{selectedLoan.customer_name} • {selectedLoan.loantype}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLoan(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User size={14} />
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{selectedLoan.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} />
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{selectedLoan.customer_phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={14} />
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{selectedLoan.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={14} />
                    <span className="text-gray-600">Mobile Banker:</span>
                    <span className="font-medium">{selectedLoan.mobilebanker}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Target size={14} />
                    <span className="text-gray-600">Credit Score:</span>
                    <span className="font-medium">{selectedLoan.creditScore}</span>
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Loan Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Principal Amount:</span>
                    <span className="font-medium">₵{(selectedLoan.disbursedamount ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Interest Rate:</span>
                    <span className="font-medium">{selectedLoan.interestrateloan}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tenure:</span>
                    <span className="font-medium">{selectedLoan.loanterm} months</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Monthly Payment:</span>
                    <span className="font-medium">₵{(selectedLoan.monthlypayment ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Payable:</span>
                    <span className="font-medium">₵{(selectedLoan.totalpayable ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Purpose:</span>
                    <span className="font-medium">{selectedLoan.purpose}</span>
                  </div>
                </div>
              </div>

              {/* Repayment Status */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Repayment Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium text-green-600">₵{(selectedLoan.amountpaid ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Outstanding:</span>
                    <span className="font-medium text-red-600">₵{(selectedLoan.outstandingbalance ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div 
                      className="bg-green-600 h-3 rounded-full" 
                      style={{ width: `${(parseFloat(selectedLoan.amountpaid) / parseFloat(selectedLoan.totalpayable)) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {Math.round(parseFloat(selectedLoan.amountpaid) / parseFloat(selectedLoan.totalpayable)) * 100}% Complete
                  </div>
                  <div className="text-sm text-gray-600">
                  {`${Math.round(
                      (parseFloat(selectedLoan.amountpaid ?? "0") / parseFloat(selectedLoan.totalpayable ?? "0"))
                    ) * 100}%`} Complete
                </div>

                  {selectedLoan.nextPaymentDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Next Payment:</span>
                      <span className="font-medium">{selectedLoan.nextPaymentDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Payments */}
            <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Payment History</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-500" size={20} />
                    <div>
                      <div className="font-medium text-gray-900">Payment Received</div>
                      <div className="text-sm text-gray-600">September 15, 2024</div>
                    </div>
                  </div>
                  <div className="text-green-600 font-semibold">₵{(selectedLoan.monthlypayment ?? 0).toLocaleString()}</div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-500" size={20} />
                    <div>
                      <div className="font-medium text-gray-900">Payment Received</div>
                      <div className="text-sm text-gray-600">August 15, 2024</div>
                    </div>
                  </div>
                  <div className="text-green-600 font-semibold">₵{(selectedLoan.monthlypayment ?? 0).toLocaleString()}</div>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-500" size={20} />
                    <div>
                      <div className="font-medium text-gray-900">Payment Received</div>
                      <div className="text-sm text-gray-600">July 15, 2024</div>
                    </div>
                  </div>
                  <div className="text-green-600 font-semibold">₵{(selectedLoan.monthlypayment ?? 0).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-200">
              {selectedLoan.status === 'active' && (
                <button 
                  onClick={() => setShowRepaymentModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Receipt size={18} />
                  Record Payment
                </button>
              )}
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <Calculator size={18} />
                Calculate Interest
              </button>
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <Download size={18} />
                Generate Statement
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <Edit size={18} />
                Edit Loan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const NewLoanModal = () => {
    if (!showNewLoanModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">New Loan Application</h2>
              <button 
                onClick={() => setShowNewLoanModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <form className="space-y-6">
              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+233 XX XXX XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="customer@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Banker</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Select mobile banker</option>
                      <option>Kwame Asante</option>
                      <option>Ama Osei</option>
                      <option>Kofi Mensah</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Loan Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loan Type</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Select loan type</option>
                      <option>Business Loan</option>
                      <option>Personal Loan</option>
                      <option>Agricultural Loan</option>
                      <option>Mortgage</option>
                      <option>Education Loan</option>
                      <option>Auto Loan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loan Amount (₵)</label>
                    <input
                      type="number"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="15.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tenure (Months)</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Select tenure</option>
                      <option>3 months</option>
                      <option>6 months</option>
                      <option>12 months</option>
                      <option>18 months</option>
                      <option>24 months</option>
                      <option>36 months</option>
                      <option>60 months</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Loan purpose"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Collateral</label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Collateral description"
                    />
                  </div>
                </div>
              </div>

              {/* Guarantor Information */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Guarantor Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Guarantor Name</label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter guarantor name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Guarantor Phone</label>
                    <input
                      type="tel"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+233 XX XXX XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Select relationship</option>
                      <option>Spouse</option>
                      <option>Parent</option>
                      <option>Sibling</option>
                      <option>Friend</option>
                      <option>Business Partner</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Guarantor Address</label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter address"
                    />
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Required Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                    <div className="text-sm text-gray-600">Customer ID Card</div>
                    <button className="mt-2 text-blue-600 text-sm hover:underline">
                      Upload File
                    </button>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                    <div className="text-sm text-gray-600">Business Plan/Proof of Income</div>
                    <button className="mt-2 text-blue-600 text-sm hover:underline">
                      Upload File
                    </button>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                    <div className="text-sm text-gray-600">Bank Statement</div>
                    <button className="mt-2 text-blue-600 text-sm hover:underline">
                      Upload File
                    </button>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                    <div className="text-sm text-gray-600">Guarantor Form</div>
                    <button className="mt-2 text-blue-600 text-sm hover:underline">
                      Upload File
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button 
                  type="button"
                  onClick={() => setShowNewLoanModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
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
      <LoanDetailModal />
      <NewLoanModal />
      <RepaymentModal />
      <ApprovalModal interestmethod={selectedLoan?.interestmethod ?? ''}/>
    </div>
  );
};

export default LoanManagement;