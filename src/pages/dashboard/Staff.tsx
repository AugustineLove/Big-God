import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Plus,
  Minus,
  BarChart3,
  PieChart,
  Settings,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  User
} from 'lucide-react';
import { useStaff } from '../../contexts/dashboard/Staff';
import { useTransactions } from '../../contexts/dashboard/Transactions';
import StaffDetailModal from './Components/staffDetailModal';
import OtherStaffTab from './Components/otherStaffTab';

const StaffManagement = () => {
  const [activeTab, setActiveTab] = useState('mobile-bankers');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExcessLossModal, setShowExcessLossModal] = useState(false);
  const { dashboardStaffList, dashboardLoading, fetchDashboardStaff } = useStaff();
  const { transactions } =  useTransactions();

  const staffTransactions = transactions.filter(
    (tx) => tx.recorded_staff_id === selectedStaff?.id
  );

 
   useEffect(() => {
    // Optionally refresh data on mount
    fetchDashboardStaff();
  }, []);

  
    const mobileBankers = dashboardStaffList.filter(staff => staff.role === 'mobile_banker' || staff.role === 'teller' || staff.role === 'accountant');
    const otherStaff = dashboardStaffList.filter(staff => staff.role !== 'mobile_banker');
    
  // Sample data for mobile bankers
  
  const MobileBankersTab = () => (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bankers</h2>
          <p className="text-gray-600">Manage your field collection staff</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <UserPlus size={18} />
            Add Banker
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search bankers..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Locations</option>
            <option>Accra Central</option>
            <option>Kumasi</option>
            <option>Tamale</option>
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
      </div>

      {/* Mobile bankers grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {mobileBankers?.map((banker) => (
          <div key={banker.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{banker.name}</h3>
                  <p className="text-sm text-gray-600">{banker.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  banker.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {banker.status}
                </span>
              </div>
            </div>

            {/* Contact info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} />
                {banker.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={14} />
                {banker.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User size={14} />
                {banker.role}
              </div>
            </div>

            {/* Performance metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-900">{banker.totalCustomers}</div>
                <div className="text-sm text-gray-600">Customers</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-700">₵{banker.totalDeposits.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Deposits</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-lg font-semibold text-blue-700">₵{banker.todayDeposits.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Today's Deposits</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-lg font-semibold text-yellow-700">{banker.performance}%</div>
                <div className="text-sm text-gray-600">Performance</div>
              </div>
            </div>

            {/* Account types */}
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Account Types:</div>
              <div className="flex flex-wrap gap-1">
                {banker.accounts.map((account, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {account}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button 
                onClick={() => setSelectedStaff(banker)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <Eye size={16} />
                View Details
              </button>
              <button 
                onClick={() => setShowExcessLossModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
              >
                <DollarSign size={16} />
                E&L
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );


  const ExcessLossModal = () => {
    if (!showExcessLossModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Excess & Loss Account</h2>
              <button 
                onClick={() => setShowExcessLossModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Excess</option>
                  <option>Loss</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₵)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  placeholder="Enter description or reason..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <button 
                onClick={() => setShowExcessLossModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                Record Transaction
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Management</h1>
          <p className="text-gray-600">Manage your microfinance staff and their activities</p>
        </div>

        {/* Navigation tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('mobile-bankers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'mobile-bankers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bankers
            </button>
            <button
              onClick={() => setActiveTab('other-staff')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'other-staff'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Other Staff
            </button>
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === 'mobile-bankers' ? <MobileBankersTab /> : <OtherStaffTab />}
      </div>

      {/* Modals */}
      <StaffDetailModal
      selectedStaff = {selectedStaff}
      setSelectedStaff = {setSelectedStaff}
      setShowExcessLossModal = {setShowExcessLossModal}
      dashboardLoading = {dashboardLoading}
      dashboardStaffList = {dashboardStaffList}
       />
      <ExcessLossModal />
    </div>
  );
};

export default StaffManagement;