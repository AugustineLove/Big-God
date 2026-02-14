import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  MenuIcon,
  User,
  Shield,
} from 'lucide-react';
import { companyName, userPermissions, userRole, userStaffId } from '../constants/appConstants';

interface Tab {
  id: string;
  name: string;
  path: string;
  icon: any;
}

const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [openFinance, setOpenFinance] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'dashboard', name: 'Overview', path: '/dashboard', icon: LayoutDashboard }
  ]);
  const [activeTabId, setActiveTabId] = useState('dashboard');
  const { company, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Memoize navigation array to prevent recreation on every render
  const navigation = useMemo(() => [
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
    {name: 'Security', href: '/dashboard/security', icon: Shield},
    { name: 'Chat', href: '/dashboard/chat', icon: Chat },
    
  ], [userPermissions]);

  // Auto-open finance when inside finance page
  useEffect(() => {
    if (location.pathname.startsWith('/dashboard/expenses')) {
      setOpenFinance(true);
    }
  }, [location.pathname]);

  // Handle opening a new tab or switching to existing one - memoized
  const handleOpenTab = useCallback((name: string, path: string, icon: any) => {
    setTabs(prevTabs => {
      // Check if tab already exists
      const existingTab = prevTabs.find(tab => tab.path === path);
      
      if (existingTab) {
        // Switch to existing tab without state update if already active
        if (activeTabId !== existingTab.id) {
          setActiveTabId(existingTab.id);
        }
        navigate(path);
        return prevTabs; // No state change needed
      } else {
        // Create new tab
        const newTab: Tab = {
          id: `tab-${Date.now()}`,
          name,
          path,
          icon
        };
        setActiveTabId(newTab.id);
        navigate(path);
        return [...prevTabs, newTab];
      }
    });
    
    // Close mobile sidebar
    setIsSidebarOpen(false);
  }, [navigate, activeTabId]);

  // Handle closing a tab - memoized
  const handleCloseTab = useCallback((tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setTabs(prevTabs => {
      const tabIndex = prevTabs.findIndex(tab => tab.id === tabId);
      const newTabs = prevTabs.filter(tab => tab.id !== tabId);
      
      // If closing the active tab, switch to another tab
      if (tabId === activeTabId && newTabs.length > 0) {
        // Switch to the tab on the left if available, otherwise the right
        const newActiveTab = newTabs[tabIndex > 0 ? tabIndex - 1 : 0];
        setActiveTabId(newActiveTab.id);
        navigate(newActiveTab.path);
      }
      
      return newTabs;
    });
  }, [activeTabId, navigate]);

  // Handle switching tabs - memoized
  const handleSwitchTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setActiveTabId(tabId);
      navigate(tab.path);
    }
  }, [tabs, navigate]);

  // Sync active tab with current location
  useEffect(() => {
    const currentTab = tabs.find(tab => tab.path === location.pathname);
    if (currentTab && currentTab.id !== activeTabId) {
      setActiveTabId(currentTab.id);
    }
  }, [location.pathname, tabs, activeTabId]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  // Memoize current page name calculation
  const currentPageName = useMemo(() => {
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
  }, [location.pathname, location.search, navigation]);

  // Toggle sidebar collapsed state - memoized
  const toggleSidebar = useCallback(() => {
    if (window.innerWidth >= 1024) {
      setIsSidebarCollapsed(prev => !prev);
    } else {
      setIsSidebarOpen(prev => !prev);
    }
  }, []);

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (window.innerWidth < 1024 && 
          isSidebarOpen && 
          !target.closest('aside') && 
          !target.closest('button[aria-label="Toggle sidebar"]')) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isSidebarOpen]);

  // Memoize current date string
  const currentDate = useMemo(() => 
    new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  , []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 bg-white shadow-xl transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-4' : 'justify-between px-6'} h-16 border-b border-gray-100`}>
            {!isSidebarCollapsed ? (
              <>
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
                  className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="SusuPro"
                  className="h-10 w-10 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Persistent Sidebar Toggle Button */}
          <div className="absolute top-20 -right-3 z-10">
            <button
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              className="bg-white border border-gray-200 rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
            >
              {isSidebarCollapsed ? (
                <ChevronRightIcon className="h-3 w-3 text-gray-600" />
              ) : (
                <ChevronLeft className="h-3 w-3 text-gray-600" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 py-6 overflow-y-auto custom-scrollbar ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/dashboard'
                    ? location.pathname === '/dashboard'
                    : location.pathname === item.href ||
                      location.pathname.startsWith(item.href + '/');

                if (item.children) {
                  if (isSidebarCollapsed) {
                    return (
                      <div key={item.name} className="relative group mb-1">
                        <button
                          onClick={() => {
                            setIsSidebarCollapsed(false);
                            setOpenFinance(true);
                          }}
                          className={`flex w-full items-center justify-center p-3 rounded-lg transition-all duration-200 group ${
                            location.pathname.startsWith('/dashboard/expenses')
                              ? 'bg-[#548048] text-white shadow-md'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          title={item.name}
                        >
                          <Icon className={`h-5 w-5 transition-colors ${
                            location.pathname.startsWith('/dashboard/expenses')
                              ? 'text-white'
                              : 'text-gray-600 group-hover:text-[#548048]'
                          }`} />
                        </button>
                        
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                          {item.name}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={item.name} className="mb-1">
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
                            const childPath = `${item.href}?tab=${child.tab}`;
                            
                            return (
                              <button
                                key={child.tab}
                                onClick={() => handleOpenTab(`Finance - ${child.name}`, childPath, BarChart3)}
                                className={`block w-full text-left py-2 px-3 text-sm rounded-md transition-all duration-200 ${
                                  isChildActive
                                    ? 'text-[#344a2e] bg-[#2c661c]/[0.2] font-medium'
                                    : 'text-gray-600 hover:text-[#344a2e] hover:bg-gray-50'
                                }`}
                              >
                                {child.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }

                return isSidebarCollapsed ? (
                  <div key={item.name} className="relative group mb-1">
                    <button
                      onClick={() => handleOpenTab(item.name, item.href, Icon)}
                      className={`flex w-full items-center justify-center p-3 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'bg-[#344a2e] text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      title={item.name}
                    >
                      <Icon className={`h-5 w-5 transition-colors ${
                        isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#344a2e]'
                      }`} />
                    </button>
                    
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                      {item.name}
                    </div>
                  </div>
                ) : (
                  <button
                    key={item.name}
                    onClick={() => handleOpenTab(item.name, item.href, Icon)}
                    className={`flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                      isActive
                        ? 'bg-[#344a2e] text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mr-3 transition-colors ${
                      isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#344a2e]'
                    }`} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className={`p-4 border-t border-gray-100 bg-gray-50/50 ${isSidebarCollapsed ? 'px-2' : ''}`}>
            <div className={`bg-white rounded-lg shadow-sm border border-gray-100 ${isSidebarCollapsed ? 'p-2' : 'p-3'}`}>
              {isSidebarCollapsed ? (
                <div className="relative group">
                  <div className="w-10 h-10 mx-auto bg-gradient-to-br from-[#344a2e] to-[#4a6b3e] rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-sm font-semibold">
                      {company?.staffName?.charAt(0) || company?.companyName.charAt(0)}
                    </span>
                  </div>
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs py-2 px-3 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                    <div className="font-semibold">{company?.staffName}</div>
                    <div className="text-gray-300 text-[10px]">{company?.companyName}</div>
                  </div>
                </div>
              ) : (
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
              )}
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
              <div className="flex lg:hidden">
                <button
                  onClick={toggleSidebar}
                  aria-label="Toggle sidebar"
                  className="bg-white border border-gray-200 rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
                >
                  <MenuIcon className="h-3 w-3 text-gray-600" />
                </button>
              </div>

              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  {currentPageName}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {currentDate}
                </p>
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleOpenTab('Chat', '/dashboard/chat', Chat)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>

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

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{companyName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{userStaffId}</p>
                      
                      <p className="text-xs text-gray-500 mt-0.5">{company?.email || company?.parentCompanyEmail}</p>
                    <div className = 'flex items-center space-x-[5px] bg-[#344a2e] w-[50%] mt-2 rounded-[50px] p-2 content-center'>
                          <User className = "h-4 w-4 bg-white white rounded-full" />
                          <p className="text-xs text-white mt-0.5">{userRole}</p>
                      </div>
                      {/* <p className="text-sm font-semibold text-gray-500">{userStaffId}</p> */}
                      </div>
                    {userPermissions?.SETTINGS_ACCESS && (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          handleOpenTab('Settings', '/dashboard/settings', Settings);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="h-4 w-4 mr-3 text-gray-500" />
                        Settings
                      </button>
                    )}
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

          {/* Tab Bar */}
          <div className="flex items-center bg-gray-50 border-t border-gray-200 px-4 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = tab.id === activeTabId;
              
              return (
                <div
                  key={tab.id}
                  onClick={() => handleSwitchTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer border-b-2 transition-colors duration-150 whitespace-nowrap group ${
                    isActive
                      ? 'border-[#344a2e] bg-white text-[#344a2e] font-medium'
                      : 'border-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <TabIcon className={`h-4 w-4 ${isActive ? 'text-[#344a2e]' : 'text-gray-500'}`} />
                  <span className="text-sm">{tab.name}</span>
                  
                  {tabs.length > 1 && (
                    <button
                      onClick={(e) => handleCloseTab(tab.id, e)}
                      className="ml-2 p-0.5 rounded hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
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
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;