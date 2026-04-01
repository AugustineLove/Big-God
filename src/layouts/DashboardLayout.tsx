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
} from 'lucide-react';
import {
  companyName, userPermissions, userRole, userStaffId,
} from '../constants/appConstants';
import SpotlightSearch from '../components/SpotlightSearch';
import { useSpotlight } from '../utils/useSpotlight';

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

// ─── Nav config (defined outside component — no memo needed) ─────────────────

const buildNavigation = () => [
  { name: 'Overview',    href: '/dashboard',               icon: LayoutDashboard },
  { name: 'Customers',   href: '/dashboard/clients',       icon: Users           },
  { name: 'Deposits',    href: '/dashboard/contributions', icon: PiggyBank       },
  { name: 'Withdrawals', href: '/dashboard/withdrawals',   icon: ArrowUpDown     },
  {
    name: 'Finance',
    href: '/dashboard/expenses',
    icon: BarChart3,
    children: userPermissions?.ALTER_FINANCE
      ? [
          { name: 'Overview',   tab: 'overview'   },
          { name: 'Revenue',    tab: 'revenue'    },
          { name: 'Commission', tab: 'commission' },
          { name: 'Expenses',   tab: 'expenses'   },
          { name: 'Assets',     tab: 'assets'     },
          { name: 'Float',      tab: 'budget'     },
          { name: 'Analytics',  tab: 'analytics'  },
        ]
      : [
          { name: 'Float',    tab: 'budget'   },
          { name: 'Expenses', tab: 'expenses' },
        ],
  },
  ...(userPermissions?.VIEW_BRIEFING
    ? [{
        name: 'Reports',
        href: '/dashboard/reports',
        icon: FileText,
        children: [
          { name: 'General',    tab: 'general'    },
          ...(userPermissions?.MANAGE_CASHACCOUNTS ? [{ name: 'Accounting', tab: 'accounting' },] : []),
        ],
      }]
    : []),
  ...(userPermissions?.MANAGE_STAFF    ? [{ name: 'Staffs',   href: '/dashboard/staffs',    icon: Users      }] : []),
  ...(userPermissions?.LOAN_PRIVILEGES ? [{ name: 'Loans',    href: '/dashboard/loans',     icon: CreditCard }] : []),
  { name: 'Security', href: '/dashboard/security', icon: Shield   },
  { name: 'Updates',  href: '/dashboard/updates',  icon: Sparkles },
  { name: 'Chat',     href: '/dashboard/chat',     icon: Chat     },
];

const NAVIGATION = buildNavigation();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeid = () => `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const INITIAL_TAB: Tab = {
  id: 'dashboard',
  name: 'Overview',
  rootPath: '/dashboard',
  currentPath: '/dashboard',
  icon: LayoutDashboard,
};

// ─── Component ────────────────────────────────────────────────────────────────

const DashboardLayout: React.FC = () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed,  setIsSidebarCollapsed]  = useState(false);
  const [openAccordions, setOpenAccordions]            = useState<Record<string, boolean>>({});
  const [isProfileOpen,  setIsProfileOpen]             = useState(false);
  const [tabs,           setTabs]                      = useState<Tab[]>([INITIAL_TAB]);
  const [activeTabId,    setActiveTabId]               = useState<string>(INITIAL_TAB.id);

  // Ref so stale-closure callbacks always see latest activeTabId
  const activeTabIdRef = useRef(activeTabId);
  useEffect(() => { activeTabIdRef.current = activeTabId; }, [activeTabId]);

  const { company, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const spotlight = useSpotlight();
  const profileRef = useRef<HTMLDivElement>(null);

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

  // ── Close profile dropdown on outside click ────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isProfileOpen]);

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

  /** Sidebar click: always open a BRAND-NEW tab */
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

  /** Context API: open a new tab from any child component */
  const openInNewTab = useCallback(
    (name: string, path: string, icon: React.ElementType) => {
      const newTab: Tab = { id: makeid(), name, rootPath: path, currentPath: path, icon };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
      navigate(path);
    },
    [navigate]
  );

  /** Tab bar click: switch and RESTORE last visited path in that tab */
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

  /** Close a tab, activate neighbour if it was active */
  const handleCloseTab = useCallback(
    (tabId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setTabs(prev => {
        if (prev.length === 1) return prev; // never close last tab
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

  const currentDate = useMemo(() =>
    new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
  , []);

  const tabCtxValue = useMemo<TabContextValue>(
    () => ({ openInNewTab }),
    [openInNewTab]
  );

  // ── Nav item renderer ─────────────────────────────────────────────────────

  const renderNavItem = (item: (typeof NAVIGATION)[number]) => {
    const Icon = item.icon;

    // ── Accordion item (Finance / Reports) ──
    if (item.children) {
      const isParentActive = location.pathname.startsWith(item.href);
      const isOpen = !!openAccordions[item.name];

      if (isSidebarCollapsed) {
        return (
          <Tooltip key={item.name} label={item.name}>
            <button
              onClick={() => { setIsSidebarCollapsed(false); setOpenAccordions(p => ({ ...p, [item.name]: true })); }}
              className={`w-full flex justify-center p-3 rounded-xl transition-all ${
                isParentActive ? 'bg-[#344a2e] text-white shadow' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-5 w-5" />
            </button>
          </Tooltip>
        );
      }

      return (
        <div key={item.name}>
          <button
            onClick={() => toggleAccordion(item.name)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
              isParentActive ? 'bg-[#344a2e] text-white shadow' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className={`h-5 w-5 shrink-0 ${isParentActive ? 'text-white' : 'text-gray-500 group-hover:text-[#344a2e]'}`} />
              <span>{item.name}</span>
            </div>
            {isOpen
              ? <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
              : <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200" />}
          </button>

          <div
            className="overflow-hidden transition-all duration-300"
            style={{ maxHeight: isOpen ? `${item.children.length * 44}px` : '0px', opacity: isOpen ? 1 : 0 }}
          >
            <div className="ml-8 mt-1 border-l-2 border-gray-200 pl-3 space-y-0.5">
              {item.children.map((child: { name: string; tab: string }) => {
                const currentTab = new URLSearchParams(location.search).get('tab');
                const childPath  = `${item.href}?tab=${child.tab}`;
                const isActive   = location.pathname === item.href && currentTab === child.tab;
                return (
                  <button
                    key={child.tab}
                    onClick={() => handleOpenTab(`${item.name} — ${child.name}`, childPath, Icon)}
                    className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'text-[#344a2e] bg-[#344a2e]/10 font-semibold'
                        : 'text-gray-600 hover:text-[#344a2e] hover:bg-gray-100'
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

    // ── Regular item ──
    const isActive = item.href === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname === item.href || location.pathname.startsWith(item.href + '/');

    if (isSidebarCollapsed) {
      return (
        <Tooltip key={item.name} label={item.name}>
          <button
            onClick={() => handleOpenTab(item.name, item.href, Icon)}
            className={`w-full flex justify-center p-3 rounded-xl transition-all ${
              isActive ? 'bg-[#344a2e] text-white shadow' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Icon className="h-5 w-5" />
          </button>
        </Tooltip>
      );
    }

    return (
      <button
        key={item.name}
        onClick={() => handleOpenTab(item.name, item.href, Icon)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
          isActive ? 'bg-[#344a2e] text-white shadow' : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#344a2e]'}`} />
        <span>{item.name}</span>
      </button>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <TabContext.Provider value={tabCtxValue}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">

        {/* Spotlight */}
        <SpotlightSearch isOpen={spotlight.isOpen} onClose={spotlight.close} />

        {/* Mobile overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside
          className={[
            'fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-gray-100 shadow-xl',
            'transform transition-[width,transform] duration-300 ease-in-out',
            'lg:relative lg:translate-x-0',
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
            isSidebarCollapsed ? 'w-[72px]' : 'w-64',
          ].join(' ')}
        >
          {/* Brand */}
          <div className={`flex items-center h-16 border-b border-gray-100 shrink-0 ${isSidebarCollapsed ? 'justify-center px-3' : 'px-5 gap-3'}`}>
            <Link to="/dashboard" onClick={() => setIsMobileSidebarOpen(false)} className="shrink-0">
              <div className="w-9 h-9 rounded-lg overflow-hidden shadow-sm border border-gray-100">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
            </Link>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate leading-none">Big God</p>
                <p className="text-[11px] text-gray-400 truncate mt-0.5">Susu Enterprise</p>
              </div>
            )}
            {!isSidebarCollapsed && (
              <button
                className="lg:hidden text-gray-400 hover:text-gray-600 p-1"
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
            className="absolute top-[72px] -right-3 z-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
          >
            {isSidebarCollapsed
              ? <ChevronRightIcon className="h-3 w-3 text-gray-600" />
              : <ChevronLeft      className="h-3 w-3 text-gray-600" />}
          </button>

          {/* Nav */}
          <nav
            className={[
              'flex-1 py-4 overflow-y-auto space-y-0.5',
              'custom-scrollbar',
              isSidebarCollapsed ? 'px-2' : 'px-3',
            ].join(' ')}
          >
            {NAVIGATION.map(renderNavItem)}
          </nav>

          {/* User card */}
          <div className={`shrink-0 border-t border-gray-100 p-3 ${isSidebarCollapsed ? 'px-2' : ''}`}>
            <div className={`flex items-center gap-3 rounded-xl bg-gray-50 ${isSidebarCollapsed ? 'p-2 justify-center' : 'p-2.5'}`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#344a2e] to-[#4a6b3e] flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-white text-xs font-bold">
                  {(company?.staffName ?? company?.companyName ?? 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{company?.staffName}</p>
                  <p className="text-[10px] text-gray-400 truncate">{company?.companyName}</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main ────────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Top bar */}
          <header className="shrink-0 bg-white border-b border-gray-100 shadow-sm z-10">
            <div className="flex items-center h-16 px-4 sm:px-6 gap-4">

              {/* Mobile hamburger */}
              <button
                data-sidebar-toggle
                onClick={() => setIsMobileSidebarOpen(p => !p)}
                aria-label="Toggle sidebar"
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Page title */}
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold text-gray-900 truncate leading-none">{currentPageName}</h1>
                <p className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">{currentDate}</p>
              </div>

              {/* Profile */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(p => !p)}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#344a2e] to-[#4a6b3e] flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-bold">
                      {(companyName ?? userRole ?? 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-gray-800 leading-none">{companyName}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{userRole}</p>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-gray-400 hidden sm:block transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    {/* Profile header */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{companyName}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{company?.email ?? company?.parentCompanyEmail}</p>
                      <p className="text-[10px] text-gray-400">{userStaffId}</p>
                      <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-[#344a2e] rounded-full">
                        <User className="h-3 w-3 text-white" />
                        <span className="text-[10px] text-white font-medium">{userRole}</span>
                      </span>
                    </div>

                    {/* Actions */}
                    {userPermissions?.SETTINGS_ACCESS && (
                      <button
                        onClick={() => { setIsProfileOpen(false); handleOpenTab('Settings', '/dashboard/settings', Settings); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="h-4 w-4 text-gray-400" />
                        Settings
                      </button>
                    )}
                    <button
                      onClick={() => { setIsProfileOpen(false); logout(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex items-end overflow-x-auto scrollbar-hide border-t border-gray-100 bg-gray-50/80 px-4 gap-0.5">
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
                        ? 'border-[#344a2e] bg-white text-[#344a2e] font-semibold shadow-sm'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/80',
                    ].join(' ')}
                  >
                    <TabIcon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-[#344a2e]' : 'text-gray-400'}`} />
                    <span className="max-w-[120px] truncate">{tab.name}</span>
                    {tabs.length > 1 && (
                      <button
                        onClick={e => handleCloseTab(tab.id, e)}
                        className="ml-0.5 p-0.5 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
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
        'bg-gray-900 text-white text-[11px] font-medium px-2 py-1 rounded-lg whitespace-nowrap',
        'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
      ].join(' ')}
    >
      {label}
    </div>
  </div>
);

export default DashboardLayout;
