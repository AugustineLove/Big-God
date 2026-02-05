import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';

const StaffManagement = () => {
  const [activeTab, setActiveTab] = useState('mobile-bankers');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExcessLossModal, setShowExcessLossModal] = useState(false);

  // Sample data for mobile bankers
  const mobileBankers = [
    {
      id: 1,
      name: "Kwame Asante",
      phone: "+233 24 123 4567",
      email: "kwame.asante@microfinance.com",
      location: "Accra Central",
      totalCustomers: 45,
      totalDeposits: 125000,
      todayDeposits: 5500,
      status: "active",
      lastActivity: "2 hours ago",
      performance: 92,
      accounts: ["Savings", "Current", "Fixed Deposit"]
    },
    {
      id: 2,
      name: "Ama Osei",
      phone: "+233 20 987 6543",
      email: "ama.osei@microfinance.com",
      location: "Kumasi",
      totalCustomers: 38,
      totalDeposits: 98000,
      todayDeposits: 3200,
      status: "active",
      lastActivity: "1 hour ago",
      performance: 88,
      accounts: ["Savings", "Micro Loans"]
    },
    {
      id: 3,
      name: "Kofi Mensah",
      phone: "+233 26 555 7890",
      email: "kofi.mensah@microfinance.com",
      location: "Tamale",
      totalCustomers: 52,
      totalDeposits: 142000,
      todayDeposits: 0,
      status: "inactive",
      lastActivity: "5 hours ago",
      performance: 76,
      accounts: ["Savings", "Current"]
    }
  ];

  // Sample data for other staff
  const otherStaff = [
    {
      id: 4,
      name: "Akosua Boateng",
      role: "Branch Manager",
      phone: "+233 24 111 2222",
      email: "akosua.boateng@microfinance.com",
      department: "Operations",
      permissions: ["user_management", "financial_reports", "system_admin"],
      status: "active",
      joinDate: "2022-03-15"
    },
    {
      id: 5,
      name: "Yaw Opoku",
      role: "Loan Officer",
      phone: "+233 20 333 4444",
      email: "yaw.opoku@microfinance.com",
      department: "Credit",
      permissions: ["loan_approval", "customer_management"],
      status: "active",
      joinDate: "2023-01-20"
    }
  ];

  const MobileBankersTab = () => (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mobile Bankers</h2>
          <p className="text-gray-600">Manage your field collection staff</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <UserPlus size={18} />
            Add Mobile Banker
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search mobile bankers..."
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
        {mobileBankers.map((banker) => (
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
                <MapPin size={14} />
                {banker.location}
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

  const OtherStaffTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Other Staff</h2>
          <p className="text-gray-600">Manage office staff and permissions</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <UserPlus size={18} />
          Add Staff Member
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search staff members..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Staff table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Staff Member</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Role & Department</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Contact</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Permissions</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {otherStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="text-purple-600" size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{staff.name}</div>
                        <div className="text-sm text-gray-600">Joined {staff.joinDate}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">{staff.role}</div>
                    <div className="text-sm text-gray-600">{staff.department}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-gray-900">{staff.phone}</div>
                    <div className="text-sm text-gray-600">{staff.email}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1">
                      {staff.permissions.map((permission, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {permission.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                      {staff.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button className="text-green-600 hover:text-green-800 transition-colors">
                        <Shield size={16} />
                      </button>
                      <button className="text-red-600 hover:text-red-800 transition-colors">
                        <Trash2 size={16} />
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

  const StaffDetailModal = () => {
    if (!selectedStaff) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="text-blue-600" size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedStaff.name}</h2>
                  <p className="text-gray-600">{selectedStaff.location}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStaff(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Tabs for detailed view */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex gap-6">
                <button className="pb-2 border-b-2 border-blue-600 text-blue-600 font-medium">
                  Overview
                </button>
                <button className="pb-2 text-gray-600 hover:text-gray-900">
                  Customers
                </button>
                <button className="pb-2 text-gray-600 hover:text-gray-900">
                  Transactions
                </button>
                <button className="pb-2 text-gray-600 hover:text-gray-900">
                  Reports
                </button>
              </div>
            </div>

            {/* Overview content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Performance metrics */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{selectedStaff.totalCustomers}</div>
                    <div className="text-blue-100">Total Customers</div>
                  </div>
                  <Users size={24} />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">₵{selectedStaff.totalDeposits.toLocaleString()}</div>
                    <div className="text-green-100">Total Deposits</div>
                  </div>
                  <DollarSign size={24} />
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{selectedStaff.performance}%</div>
                    <div className="text-yellow-100">Performance Score</div>
                  </div>
                  <TrendingUp size={24} />
                </div>
              </div>

              {/* Recent activity */}
              <div className="md:col-span-2 lg:col-span-3 bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="text-green-500" size={20} />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Deposit collected from Mary Aidoo</div>
                      <div className="text-sm text-gray-600">₵350 • 2 hours ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="text-green-500" size={20} />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">New customer registration</div>
                      <div className="text-sm text-gray-600">John Mensah • 4 hours ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <AlertCircle className="text-yellow-500" size={20} />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Missed collection attempt</div>
                      <div className="text-sm text-gray-600">Grace Osei • 6 hours ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <Edit size={18} />
                Edit Details
              </button>
              <button 
                onClick={() => setShowExcessLossModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <DollarSign size={18} />
                Excess & Loss
              </button>
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <BarChart3 size={18} />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
              Mobile Bankers
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
      <StaffDetailModal />
      <ExcessLossModal />
    </div>
  );
};

export default StaffManagement;