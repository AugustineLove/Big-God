import React, { useState, useEffect } from 'react';
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
  Bell,
  ChevronDown,
  ChevronRight,
  Search,
  HelpCircle,
} from 'lucide-react';
import { companyName, userPermissions, userRole } from '../constants/appConstants';

const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openFinance, setOpenFinance] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { company, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-open finance when inside finance page
  useEffect(() => {
    if (location.pathname.startsWith('/dashboard/expenses')) {
      setOpenFinance(true);
    }
  }, [location.pathname]);

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', href: '/dashboard/clients', icon: Users },
    { name: 'Deposits', href: '/dashboard/contributions', icon: PiggyBank },
    { name: 'Withdrawals', href: '/dashboard/withdrawals', icon: ArrowUpDown },
    {
      name: 'Finance',
      href: '/dashboard/expenses',
      icon: BarChart3,
      children: userPermissions?.ALTER_FINANCE ? [
        { name: 'Overview', tab: 'overview' },
        { name: 'Revenue', tab: 'revenue' },
        { name: 'Commission', tab: 'commission' },
        { name: 'Expenses', tab: 'expenses' },
        { name: 'Assets', tab: 'assets' },
        { name: 'Float', tab: 'budget' },
        { name: 'Analytics', tab: 'analytics' },
      ] : [
        { name: 'Float', tab: 'budget' },
        { name: 'Expenses', tab: 'expenses' },
      ]
    },
    ...(userPermissions?.VIEW_BRIEFING ? [{ name: 'Reports', href: '/dashboard/reports', icon: FileText }] : []),
    ...(userPermissions?.MANAGE_STAFF ? [{ name: 'Staffs', href: '/dashboard/staffs', icon: Users }] : []),
    ...(userPermissions?.LOAN_PRIVILEGES ? [{ name: 'Loans', href: '/dashboard/loans', icon: CreditCard }] : []),
    { name: 'Chat', href: '/dashboard/chat', icon: Chat },
    // ...(userPermissions?.SETTINGS_ACCESS ? [{ name: 'Settings', href: '/dashboard/settings', icon: Settings }] : [])
  ];

  const handleLogout = () => {
    logout();
  };

  const getCurrentPageName = () => {
    const currentRoute = navigation.find(item => item.href === location.pathname);
    if (currentRoute) return currentRoute.name;
    
    // Check if we're in a finance sub-tab
    if (location.pathname.startsWith('/dashboard/expenses')) {
      const params = new URLSearchParams(location.search);
      const tab = params.get('tab');
      const financeItem = navigation.find(item => item.name === 'Finance');
      const subTab = financeItem?.children?.find(child => child.tab === tab);
      return subTab ? `Finance - ${subTab.name}` : 'Finance';
    }
    
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100 bg-gradient-to-r">
            <Link to="#" className="flex items-center space-x-3 flex-1" onClick={() => setIsSidebarOpen(false)}>
              <div className="bg-white rounded-lg shadow-lg">
                <img
                  src="/logo.png"
                  alt="SusuPro"
                  className="h-[50px] w-[50px] object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-black tracking-tight">Big God</span>
                <span className="text-xs text-gray/80 font-medium">Susu Enterprise</span>
              </div>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-white/80 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar">
            <div className="space-y-1 px-3">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive =
                item.href === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : location.pathname === item.href ||
                    location.pathname.startsWith(item.href + '/');

                return item.children ? (
                  <div key={item.name} className="mb-1">
                    {/* Finance main button */}
                    <button
                      onClick={() => setOpenFinance(!openFinance)}
                      className={`flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                        location.pathname.startsWith('/dashboard/expenses')
                          ? 'bg-[#548048] text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className={`h-5 w-5 mr-3 transition-colors ${
                          location.pathname.startsWith('/dashboard/expenses')
                            ? 'text-white'
                            : 'text-gray-600 group-hover:text-[#548048]'
                        }`} />
                        <span>{item.name}</span>
                      </div>
                      {openFinance ? (
                        <ChevronDown className="h-4 w-4 transition-transform" />
                      ) : (
                        <ChevronRight className="h-4 w-4 transition-transform" />
                      )}
                    </button>

                    {/* Finance dropdown */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        openFinance ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="ml-11 space-y-0.5 border-l-2 border-gray-200 pl-3">
                        {item.children.map((child) => {
                          const params = new URLSearchParams(location.search);
                          const currentTab = params.get('tab');
                          const isChildActive = currentTab === child.tab;
                          
                          return (
                            <Link
                              key={child.tab}
                              to={`${item.href}?tab=${child.tab}`}
                              onClick={() => setIsSidebarOpen(false)}
                              className={`block py-2 px-3 text-sm rounded-md transition-all duration-200 ${
                                isChildActive
                                  ? 'text-[#344a2e] bg-[#2c661c]/[0.2] font-medium'
                                  : 'text-gray-600 hover:text-[#344a2e] hover:bg-gray-50'
                              }`}
                            >
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                      isActive
                        ? 'bg-[#344a2e] text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mr-3 transition-colors ${
                      isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#344a2e]'
                    }`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            {/* User Profile Card */}
            <div className="bg-white rounded-lg p-3 mb-3 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#344a2e] to-[#4a6b3e] rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-semibold">
                    {company?.staffName?.charAt(0) || company?.companyName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {company?.staffName}
                  </p>
                  <p className="text-xs text-gray-600 truncate font-medium">
                    {company?.companyName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {company?.email || company?.parentCompanyEmail}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Left section */}
            <div className="flex items-center space-x-4 flex-1">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>

              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  {getCurrentPageName()}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-3">
              {/* Search button - desktop only */}
              {/* <button className="hidden md:flex items-center px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <Search className="h-4 w-4 mr-2" />
                <span>Search</span>
                <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-white rounded border border-gray-300">
                  Type here
                </kbd>
              </button> */}

              {/* Notifications */}
              <button
                onClick={() => {
                  navigate('/dashboard/chat');
                  setIsSidebarOpen(false);
                }}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-[#344a2e] to-[#4a6b3e] rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-sm font-semibold">
                      {companyName?.charAt(0) || userRole?.charAt(0)}
                    </span>
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-semibold text-gray-900">{companyName}</span>
                    <span className="text-xs text-gray-500">{userRole}</span>
                  </div>
                  <ChevronDown className="hidden md:block h-4 w-4 text-gray-500" />
                </button>

                {/* Profile dropdown menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{companyName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{company?.email || company?.parentCompanyEmail}</p>
                    </div>
                   {
                    userPermissions.SETTINGS_ACCESS && (
                       <Link
                      to="/dashboard/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-3 text-gray-500" />
                      Settings
                    </Link>
                    )
                   }
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;