import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  PiggyBank,
  ArrowUpDown,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  MessageCircle as Chat,
  CreditCard,
  Bell
} from 'lucide-react';
import { companyName, userPermissions, userRole } from '../constants/appConstants';

const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { company, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', href: '/dashboard/clients', icon: Users },
    { name: 'Deposits', href: '/dashboard/contributions', icon: PiggyBank },
    { name: 'Withdrawals', href: '/dashboard/withdrawals', icon: ArrowUpDown },
    { name: 'Finance', href: '/dashboard/expenses', icon: BarChart3 },
    ...(userPermissions?.VIEW_BRIEFING ? [{ name: 'Reports', href: '/dashboard/reports', icon: FileText }] : []),
    // { name: 'Staffs', href: '/dashboard/staffs', icon: Users },
    ...(userPermissions?.LOAN_PRIVILEGES ? [{ name: 'Loans', href: '/dashboard/loans', icon: CreditCard }] : []),
    { name: 'Chat', href: '/dashboard/chat', icon: Chat },
   ...(userPermissions?.SETTINGS_ACCESS ? [{ name: 'Settings', href: '/dashboard/settings', icon: Settings }] : [])
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-indigo-600 to-teal-600 p-2 rounded-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SusuPro</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 mt-6 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || 
                (item.href === '/dashboard' && location.pathname === '/dashboard');
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-700'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {company?.staffName?.charAt(0) || company?.companyName.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {company?.staffName}
                </p>
                <p className="text-sm text-[9px] font-medium text-gray-700 truncate">
                  {company?.companyName}
                </p>
                <p className="text-xs text-[9px] text-gray-500 truncate">
                  {company?.email || company?.parentCompanyEmail}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 lg:ml-0 ml-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700 relative"
              onClick={() => {
                setIsSidebarOpen(true);
               navigate('/dashboard/chat');
              }}
              >
                <Bell className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {companyName?.charAt(0) || userRole?.charAt(0)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{companyName}</span>
                  <span className="text-xs text-gray-500">{userRole}</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;