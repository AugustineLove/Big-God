import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  UserPlus, 
  Edit, 
  BarChart3,
  Calendar,
  CreditCard,
  FileText,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useTransactions } from '../../../contexts/dashboard/Transactions';
import { useCustomers } from '../../../contexts/dashboard/Customers';
import { formatDate } from '../../../constants/appConstants';

const StaffDetailModal = ({ 
  selectedStaff, 
  setSelectedStaff, 
  setShowExcessLossModal,
  dashboardLoading,
  dashboardStaffList 
}) => {
    const { transactions } = useTransactions();
    const { customers } = useCustomers();

    const customersOfStaff = customers.filter(
        (c) => c.registered_by === selectedStaff?.id
    );
     const staffTransactions = transactions.filter(
    (tx) => tx.recorded_staff_id === selectedStaff?.id
  );


  const recentActivity = staffTransactions
  .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()) // newest first
  .slice(0, 5) // last 5 activities
  .map((tx) => {
    let title = '';
    let subtitle = '';
    let transaction_date = '';

    switch (tx.type) {
      case 'deposit':
        title = `Deposit collected from ${tx.customer_name || 'Unknown'}`;
        subtitle = `₵${tx.amount} • ${new Date(tx.transaction_date).toLocaleDateString()}- ${tx.description}`;
        transaction_date = transaction_date;
        break;
      case 'withdrawal':
        title = `Withdrawal by ${tx.customer_name || 'Unknown'}`;
        subtitle = `₵${tx.amount} • ${new Date(tx.transaction_date).toLocaleDateString()}- ${tx.description}`;
        transaction_date = transaction_date;
        break;
      case 'commission':
        title = `New commission`;
        subtitle = `${tx.customer_name} • ${new Date(tx.transaction_date).toLocaleDateString()}- ${tx.description}`;
        transaction_date = transaction_date;
        break;
      default:
        title = tx.type;
        subtitle = new Date(tx.transaction_date).toLocaleDateString();
        transaction_date = transaction_date;
    }
    

    return { id: tx.id, title, subtitle, type: tx.type, transaction_date };
  });
  

  const [activeTab, setActiveTab] = useState('overview');
  const [tabData, setTabData] = useState({
    customers: [],
    transactions: [],
    reports: [],
  });
  const [loading, setLoading] = useState(false);

  // Fetch data when tab changes
  useEffect(() => {
    if (selectedStaff && activeTab !== 'overview') {
      fetchTabData(activeTab);
    }
  }, [activeTab, selectedStaff]);

 
  const fetchTabData = async (tab) => {
    setLoading(true);
    try {
      // Replace with your actual API endpoints
      let endpoint = '';
      switch (tab) {
        case 'customers':
          endpoint = `/api/staff/${selectedStaff.id}/customers`;
          break;
        case 'transactions':
          endpoint = `/api/staff/${selectedStaff.id}/transactions`;
          break;
        case 'reports':
          endpoint = `/api/staff/${selectedStaff.id}/reports`;
          break;
      }

      // const response = await fetch(endpoint);
      // const data = await response.json();

      // Mock data for demonstration
      const mockData = generateMockData(tab);
      setTabData(prev => ({ ...prev, [tab]: mockData }));
    } catch (error) {
      console.error(`Error fetching ${tab} data:`, error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (tab) => {
    switch (tab) {
      case 'customers':
        return Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Customer ${i + 1}`,
          accountNumber: `ACC${1000 + i}`,
          balance: Math.floor(Math.random() * 50000) + 5000,
          status: Math.random() > 0.3 ? 'active' : 'inactive',
          joinDate: new Date(Date.now() - Math.random() * 31536000000).toISOString()
        }));
      
      case 'transactions':
        return Array.from({ length: 15 }, (_, i) => ({
          id: i + 1,
          type: Math.random() > 0.5 ? 'deposit' : 'withdrawal',
          customer: `Customer ${Math.floor(Math.random() * 10) + 1}`,
          amount: Math.floor(Math.random() * 10000) + 500,
          date: new Date(Date.now() - Math.random() * 2592000000).toISOString(),
          status: 'completed',
          reference: `TXN${10000 + i}`
        }));
      
      case 'reports':
        return Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          title: `Monthly Report - ${new Date(Date.now() - i * 2592000000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          type: 'monthly',
          generatedDate: new Date(Date.now() - i * 2592000000).toISOString(),
          status: 'completed',
          totalDeposits: Math.floor(Math.random() * 100000) + 50000,
          totalWithdrawals: Math.floor(Math.random() * 50000) + 20000
        }));
      
      default:
        return [];
    }
  };

  if (!selectedStaff) return null;

  if (dashboardLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <p className="text-gray-900">Loading staff data...</p>
        </div>
      </div>
    );
  }

  if (!dashboardStaffList || dashboardStaffList.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <p className="text-gray-900">No staff found for this company.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'customers', label: 'Customers' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'reports', label: 'Reports' }
  ];

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

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-2 border-b-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
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
                      {recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            activity.type === 'deposit'
                              ? 'bg-green-50 border border-green-200'
                              : activity.type === 'withdrawal'
                              ? 'bg-red-50 border border-red-200'
                              : 'bg-yellow-50 border border-yellow-200'
                          }`}
                        >
                          {activity.type === 'deposit' && <CheckCircle className="text-green-500" size={20} />}
                          {activity.type === 'withdrawal' && <XCircle className="text-red-500" size={20} />}
                          {activity.type === 'commission' && <UserPlus className="text-blue-500" size={20} />}
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{activity.title}</div>
                            <div className="text-sm text-gray-600">{activity.subtitle}</div>
                          </div>
                          {/* <div className="text-sm text-gray-500">
                            {new Date(activity.transaction_date).toLocaleDateString()}
                          </div> */}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Customers Tab */}
              {activeTab === 'customers' && (
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Account Number
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Balance
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Join Date
                            </th>
                          </tr>
                        </thead>
                       <tbody className="bg-white divide-y divide-gray-200">
                            {customersOfStaff
                                .slice() // make a copy to avoid mutating state
                                .sort((a, b) => a.account_number.localeCompare(b.account_number)) // sort by account_number
                                .map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Users className="text-blue-600" size={20} />
                                        </div>
                                        <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                        </div>
                                    </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {customer.account_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ₵{customer.total_balance_across_all_accounts}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        customer.status === "active"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-gray-100 text-gray-800"
                                        }`}
                                    >
                                        {customer.status}
                                    </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(customer.date_of_registration)}
                                    </td>
                                </tr>
                                ))}
                            </tbody>

                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <div className="space-y-4">
                  {staffTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            transaction.type === 'deposit'
                              ? 'bg-green-100'
                              : 'bg-red-100'
                          }`}>
                            {transaction.type === 'deposit' ? (
                              <ArrowDownRight className="text-green-600" size={24} />
                            ) : (
                              <ArrowUpRight className="text-red-600" size={24} />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                            </div>
                            <div className="text-sm text-gray-600">{transaction.customer_name}</div>
                            <div className="text-xs text-gray-500">{transaction.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${
                            transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'deposit' ? '+' : '-'}₵{transaction.amount.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(transaction.transaction_date).toLocaleDateString()}
                          </div>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reports Tab */}
            {activeTab === 'reports' && (
            <div className="space-y-4">
                {(() => {
                // Aggregate transactions by date
                const reportsMap: Record<string, { totalDeposits: number; totalWithdrawals: number }> = {};

                transactions.forEach((tx) => {
                    const dateKey = new Date(tx.transaction_date).toDateString(); // group by day
                    if (!reportsMap[dateKey]) {
                    reportsMap[dateKey] = { totalDeposits: 0, totalWithdrawals: 0 };
                    }

                    if (tx.type === 'deposit' && !tx.is_deleted && tx.status === 'approved' || tx.status === 'completed' && tx.mobile_banker_id === selectedStaff?.id) {
                    reportsMap[dateKey].totalDeposits += Number(tx.amount);
                    } else if (tx.type === 'withdrawal' && !tx.is_deleted && tx.status === 'approved' && tx.recorded_staff_id === selectedStaff?.id) {
                    reportsMap[dateKey].totalWithdrawals += Number(tx.amount);
                    }
                });

                // Convert the map to an array for mapping in JSX
                const reportsArray = Object.entries(reportsMap).map(([date, data], idx) => ({
                    id: idx,
                    generatedDate: new Date(date),
                    totalDeposits: data.totalDeposits,
                    totalWithdrawals: data.totalWithdrawals,
                }));

                // Sort by date descending (most recent first)
                reportsArray.sort((a, b) => b.generatedDate.getTime() - a.generatedDate.getTime());

                return reportsArray.map((report) => (
                    <div
                    key={report.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FileText className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">
                            Report - {report.generatedDate.toLocaleDateString()}
                            </h4>
                            <div className="flex gap-6 mt-3">
                            <div>
                                <div className="text-xs text-gray-500">Total Deposits</div>
                                <div className="text-sm font-medium text-green-600">
                                ₵{report.totalDeposits.toLocaleString()}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Total Withdrawals</div>
                                <div className="text-sm font-medium text-red-600">
                                ₵{report.totalWithdrawals.toLocaleString()}
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                        Download
                        </button>
                    </div>
                    </div>
                ));
                })()}
            </div>
            )}
            </>
            )}

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

export default StaffDetailModal;