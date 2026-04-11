import React, {
  useState, useEffect, useCallback, useMemo, useRef, createContext, useContext,
} from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, PiggyBank, ArrowUpDown, FileText,
  Settings, LogOut, X, BarChart3, MessageCircle as Chat,
  CreditCard, ChevronDown, ChevronRight, ChevronLeft,
  ChevronRight as ChevronRightIcon, Menu, User, Shield,
  Sparkles, Wallet, TrendingUp, DollarSign, PieChart, Layers,
  Home, Bell, HelpCircle, Search, Globe, Building2,
  Receipt, Target, Briefcase, Clock, Calendar,
  Users2,
  FileTextIcon,
} from 'lucide-react';
import {
  companyName, userPermissions, userRole, userStaffId,
} from '../constants/appConstants';
import SpotlightSearch from '../components/SpotlightSearch';
import { useSpotlight } from '../utils/useSpotlight';
import { buildNavigation } from '../constants/navConstants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tab {
  id: string;
  name: string;
  rootPath: string;
  currentPath: string;
  icon: React.ElementType;
}

interface TabContextValue {
  openInNewTab: (name: string, path: string, icon: React.ElementType) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const TabContext = createContext<TabContextValue>({ openInNewTab: () => {} });
export const useTabContext = () => useContext(TabContext);


const NAVIGATION = buildNavigation();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeid = () => `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const INITIAL_TAB: Tab = {
  id: 'dashboard',
  name: 'Dashboard',
  rootPath: '/dashboard',
  currentPath: '/dashboard',
  icon: LayoutDashboard,
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(amount);
};

// ─── Component ────────────────────────────────────────────────────────────────

const DashboardLayout: React.FC = () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed,  setIsSidebarCollapsed]  = useState(false);
  const [openAccordions, setOpenAccordions]            = useState<Record<string, boolean>>({});
  const [isProfileOpen,  setIsProfileOpen]             = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen]   = useState(false);
  const [tabs,           setTabs]                      = useState<Tab[]>([INITIAL_TAB]);
  const [activeTabId,    setActiveTabId]               = useState<string>(INITIAL_TAB.id);
  const [searchQuery, setSearchQuery] = useState('');

  // Ref so stale-closure callbacks always see latest activeTabId
  const activeTabIdRef = useRef(activeTabId);
  useEffect(() => { activeTabIdRef.current = activeTabId; }, [activeTabId]);

  const { company, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const spotlight = useSpotlight();
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Mock notifications
  const notifications = [
    { id: 1, title: 'System update', message: 'New updates available', time: '1 day ago', read: true, type: 'system' },
  ];
  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Auto-open accordions when URL matches ──────────────────────────────────
  useEffect(() => {
    NAVIGATION.forEach(item => {
      if (item.children && location.pathname.startsWith(item.href)) {
        setOpenAccordions(prev => ({ ...prev, [item.name]: true }));
      }
    });
  }, [location.pathname]);

  // ── Track currentPath as user navigates within active tab ──────────────────
  useEffect(() => {
    const fullPath = location.pathname + location.search;
    setTabs(prev =>
      prev.map(t =>
        t.id === activeTabIdRef.current && t.currentPath !== fullPath
          ? { ...t, currentPath: fullPath }
          : t
      )
    );
  }, [location.pathname, location.search]);

  // ── Sync active tab when browser back/forward changes the URL ─────────────
  useEffect(() => {
    const fullPath = location.pathname + location.search;
    setTabs(prev => {
      const match = prev.find(t => t.currentPath === fullPath);
      if (match && match.id !== activeTabIdRef.current) {
        setActiveTabId(match.id);
      }
      return prev;
    });
  }, [location.pathname, location.search]);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    if (isProfileOpen || isNotificationsOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isProfileOpen, isNotificationsOpen]);

  // ── Close mobile sidebar on outside click ─────────────────────────────────
  useEffect(() => {
    if (!isMobileSidebarOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('aside') && !t.closest('[data-sidebar-toggle]')) {
        setIsMobileSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMobileSidebarOpen]);

  // ── TAB operations ────────────────────────────────────────────────────────

  const handleOpenTab = useCallback(
    (name: string, path: string, icon: React.ElementType) => {
      const newTab: Tab = { id: makeid(), name, rootPath: path, currentPath: path, icon };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
      navigate(path);
      setIsMobileSidebarOpen(false);
    },
    [navigate]
  );

  const openInNewTab = useCallback(
    (name: string, path: string, icon: React.ElementType) => {
      const newTab: Tab = { id: makeid(), name, rootPath: path, currentPath: path, icon };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
      navigate(path);
    },
    [navigate]
  );

  const handleSwitchTab = useCallback(
    (tabId: string) => {
      if (tabId === activeTabIdRef.current) return;
      setTabs(prev => {
        const tab = prev.find(t => t.id === tabId);
        if (tab) {
          setActiveTabId(tabId);
          navigate(tab.currentPath);
        }
        return prev;
      });
    },
    [navigate]
  );

  const handleCloseTab = useCallback(
    (tabId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setTabs(prev => {
        if (prev.length === 1) return prev;
        const idx  = prev.findIndex(t => t.id === tabId);
        const next = prev.filter(t => t.id !== tabId);
        if (tabId === activeTabIdRef.current) {
          const newActive = next[Math.max(idx - 1, 0)];
          setActiveTabId(newActive.id);
          navigate(newActive.currentPath);
        }
        return next;
      });
    },
    [navigate]
  );

  // ── Sidebar / toggle ──────────────────────────────────────────────────────

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth >= 1024) {
      setIsSidebarCollapsed(p => !p);
    } else {
      setIsMobileSidebarOpen(p => !p);
    }
  }, []);

  const toggleAccordion = useCallback((name: string) => {
    setOpenAccordions(prev => ({ ...prev, [name]: !prev[name] }));
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const currentPageName = useMemo(() => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    return activeTab?.name ?? 'Dashboard';
  }, [tabs, activeTabId]);

  const currentDateTime = useMemo(() =>
    new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  , []);

  const tabCtxValue = useMemo<TabContextValue>(
    () => ({ openInNewTab }),
    [openInNewTab]
  );

  // ── Nav item renderer ─────────────────────────────────────────────────────

  const renderNavItem = (item: (typeof NAVIGATION)[number]) => {
    const Icon = item.icon;

    if (item.children) {
      const isParentActive = location.pathname.startsWith(item.href);
      const isOpen = !!openAccordions[item.name];

      if (isSidebarCollapsed) {
        return (
          <Tooltip key={item.name} label={item.name}>
            <button
              onClick={() => { setIsSidebarCollapsed(false); setOpenAccordions(p => ({ ...p, [item.name]: true })); }}
              className={`w-full flex justify-center p-3 rounded-xl transition-all duration-200 ${
                isParentActive ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:bg-gray-50 hover:text-primary-600'
              }`}
            >
              <Icon className="h-5 w-5" />
            </button>
          </Tooltip>
        );
      }

      return (
        <div key={item.name} className="mb-1">
          <button
            onClick={() => toggleAccordion(item.name)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
              isParentActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className={`h-5 w-5 shrink-0 transition-colors ${
                isParentActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-500'
              }`} />
              <span>{item.name}</span>
            </div>
            <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
              <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
            </div>
          </button>

          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: isOpen ? `${item.children.length * 44}px` : '0px' }}
          >
            <div className="ml-9 mt-1 border-l-2 border-gray-100 pl-3 space-y-0.5">
              {item.children.map((child: { name: string; tab: string; icon: React.ElementType }) => {
                const ChildIcon = child.icon;
                const currentTab = new URLSearchParams(location.search).get('tab');
                const childPath  = `${item.href}?tab=${child.tab}`;
                const isActive   = location.pathname === item.href && currentTab === child.tab;
                return (
                  <button
                    key={child.tab}
                    onClick={() => handleOpenTab(`${item.name} — ${child.name}`, childPath, ChildIcon)}
                    className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-all duration-150 flex items-center gap-2 ${
                      isActive
                        ? 'text-primary-700 bg-primary-50/50 font-medium'
                        : 'text-gray-500 hover:text-primary-600 hover:bg-gray-50'
                    }`}
                  >
                    <ChildIcon className="h-3.5 w-3.5" />
                    {child.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    const isActive = item.href === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname === item.href || location.pathname.startsWith(item.href + '/');

    if (isSidebarCollapsed) {
      return (
        <Tooltip key={item.name} label={item.name}>
          <button
            onClick={() => handleOpenTab(item.name, item.href, Icon)}
            className={`w-full flex justify-center p-3 rounded-xl transition-all duration-200 relative ${
              isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:bg-gray-50 hover:text-primary-600'
            }`}
          >
            <Icon className="h-5 w-5" />
            {item.badge && (
              <span className="absolute -top-1 -right-1 px-1 py-0.5 bg-primary-500 text-white text-[9px] rounded-full font-medium">
                {item.badge}
              </span>
            )}
          </button>
        </Tooltip>
      );
    }

    return (
      <button
        key={item.name}
        onClick={() => handleOpenTab(item.name, item.href, Icon)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group mb-1 relative ${
          isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
        }`}
      >
        <Icon className={`h-5 w-5 shrink-0 transition-colors ${
          isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-500'
        }`} />
        <span>{item.name}</span>
        {item.badge && (
          <span className="ml-auto px-1.5 py-0.5 bg-primary-500 text-white text-[10px] rounded-full font-medium">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <TabContext.Provider value={tabCtxValue}>
      <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">

        {/* Spotlight */}
        {
          userRole !== 'Momo Agent' && (
            <SpotlightSearch isOpen={spotlight.isOpen} onClose={spotlight.close} />
          )
        }

        {/* Mobile overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside
          className={[
            'fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-gray-100',
            'transform transition-all duration-300 ease-out',
            'lg:relative lg:translate-x-0',
            isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
            isSidebarCollapsed ? 'w-[72px]' : 'w-64',
          ].join(' ')}
        >
          {/* Brand */}
          <div className={`flex items-center h-16 border-b border-gray-100 shrink-0 ${isSidebarCollapsed ? 'justify-center px-2' : 'px-5 gap-3'}`}>
            <Link to="/dashboard" onClick={() => setIsMobileSidebarOpen(false)} className="shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-sm">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
            </Link>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate leading-none">Big God</p>
                <p className="text-[11px] text-primary-600 truncate mt-0.5 font-medium">Susu Enterprise</p>
              </div>
            )}
            {!isSidebarCollapsed && (
              <button
                className="lg:hidden text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Collapse toggle */}
          <button
            data-sidebar-toggle
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            className="absolute top-[72px] -right-3 z-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:border-primary-300"
          >
            {isSidebarCollapsed
              ? <ChevronRightIcon className="h-3 w-3 text-gray-500" />
              : <ChevronLeft      className="h-3 w-3 text-gray-500" />}
          </button>

          {/* Nav */}
          <nav
            className={[
              'flex-1 py-5 overflow-y-auto',
              'custom-scrollbar',
              isSidebarCollapsed ? 'px-2' : 'px-3',
            ].join(' ')}
          >
            {NAVIGATION.map(renderNavItem)}
          </nav>

          {/* User card */}
          <div className={`shrink-0 border-t border-gray-100 p-3 ${isSidebarCollapsed ? 'px-2' : ''}`}>
            <div className={`flex items-center gap-3 rounded-xl bg-gradient-to-r from-gray-50 to-white ${isSidebarCollapsed ? 'p-2 justify-center' : 'p-2.5'}`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-white text-xs font-bold">
                  {(company?.staffName ?? company?.companyName ?? 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{company?.staffName || 'Staff User'}</p>
                  <p className="text-[10px] text-primary-600 truncate font-medium">{company?.companyName || 'Main Branch'}</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main ────────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Top bar */}
          <header className="shrink-0 bg-white border-b border-gray-100 shadow-sm z-10">
            <div className="flex items-center h-16 px-4 sm:px-6 gap-4 justify-between">

              {/* Mobile hamburger */}
              <button
                data-sidebar-toggle
                onClick={() => setIsMobileSidebarOpen(p => !p)}
                aria-label="Toggle sidebar"
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Search */}
              {
                userRole !== 'Momo Agent' && (
                  <div className="hidden md:flex items-center flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search customers by name, phone or account…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => spotlight.open()}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all"
                  />
                </div>
              </div>
                )
              }

              <div className="flex-1 md:flex-none" />

              {/* Date/time */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-gray-500">{currentDateTime}</span>
              </div>

              <div className='flex items-center space-x-3'>
                  {/* Help */}
              <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-primary-600 transition-colors">
                <HelpCircle className="h-5 w-5" />
              </button>

              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setIsNotificationsOpen(p => !p)}
                  className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-primary-600 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-medium">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map(notif => (
                        <div key={notif.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? 'bg-primary-50/30' : ''}`}>
                          <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                        </div>
                      ))}
                    </div>
                    <button className="w-full px-4 py-2 text-center text-xs text-primary-600 hover:bg-gray-50 font-medium">
                      View all notifications
                    </button>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(p => !p)}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1a2e1a] via-[#2d442d] to-[#3d5a3d] flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-bold">
                      {(companyName ?? userRole ?? 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-gray-800 leading-none">{companyName || 'Staff User'}</p>
                    <p className="text-[10px] text-primary-600 mt-0.5 font-medium">{userRole || 'Staff'}</p>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-gray-400 hidden sm:block transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="px-4 py-3 bg-gradient-to-r from-primary-50 to-white border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{companyName || 'Staff User'}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{company?.email ?? company?.parentCompanyEmail}</p>
                      <p className="text-[10px] text-gray-400">{userStaffId}</p>
                      <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 bg-primary-100 rounded-lg">
                        <User className="h-3 w-3 text-primary-600" />
                        <span className="text-[10px] text-primary-700 font-medium">{userRole || 'Staff'}</span>
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => { setIsProfileOpen(false); handleOpenTab('Settings', '/dashboard/settings', User); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="h-4 w-4 text-gray-400" />
                        Profile
                      </button>
                      {userPermissions?.SETTINGS_ACCESS && (
                        <button
                          onClick={() => { setIsProfileOpen(false); handleOpenTab('Settings', '/dashboard/settings', Settings); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Settings className="h-4 w-4 text-gray-400" />
                          Settings
                        </button>
                      )}
                    </div>

                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={() => { setIsProfileOpen(false); logout(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex items-end overflow-x-auto scrollbar-hide border-t border-gray-100 bg-gray-50/50 px-4 gap-0.5">
              {tabs.map(tab => {
                const TabIcon = tab.icon;
                const isActive = tab.id === activeTabId;
                return (
                  <div
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleSwitchTab(tab.id)}
                    className={[
                      'group flex items-center gap-1.5 px-3.5 py-2.5 cursor-pointer border-b-2',
                      'transition-all duration-150 whitespace-nowrap select-none text-sm shrink-0',
                      isActive
                        ? 'border-primary-500 bg-white text-primary-700 font-medium'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50',
                    ].join(' ')}
                  >
                    <TabIcon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-primary-500' : 'text-gray-400'}`} />
                    <span className="max-w-[140px] truncate">{tab.name}</span>
                    {tabs.length > 1 && (
                      <button
                        onClick={e => handleCloseTab(tab.id, e)}
                        className="ml-1 p-0.5 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        aria-label={`Close ${tab.name}`}
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
            <div className="p-4 sm:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* ── Global styles ──────────────────────────────────────────────────── */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Custom focus ring */
        *:focus-visible {
          outline: 2px solid #0f3b2c;
          outline-offset: 2px;
        }
        
        /* Smooth transitions */
        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </TabContext.Provider>
  );
};

// ─── Tooltip helper (collapsed sidebar) ──────────────────────────────────────

interface TooltipProps {
  label: string;
  children: React.ReactElement;
}

const Tooltip: React.FC<TooltipProps> = ({ label, children }) => (
  <div className="relative group">
    {children}
    <div
      className={[
        'pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50',
        'bg-gray-800 text-white text-[11px] font-medium px-2 py-1 rounded-lg whitespace-nowrap',
        'opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg',
      ].join(' ')}
    >
      {label}
    </div>
  </div>
);

export default DashboardLayout;