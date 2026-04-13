import { ArrowUpDown, BarChart3, Building2, Calendar, CreditCard, DollarSign, FileText, FileTextIcon, LayoutDashboard, MessageCircle, PieChart, PiggyBank, Receipt, Shield, Sparkles, TrendingUp, User2, Users, Users2, Wallet } from "lucide-react";
import Chat from "../pages/dashboard/ChatList";
import { userPermissions, userRole } from "./appConstants";


export const buildNavigation = () => userRole !== 'Momo Agent' ? [
  { name: 'Dashboard',    href: '/dashboard',               icon: LayoutDashboard, badge: null },
  { name: 'Customers',   href: '/dashboard/clients',       icon: Users,           badge: null },
  { name: 'Deposits',    href: '/dashboard/contributions', icon: PiggyBank,       badge: null },
  { name: 'Withdrawals', href: '/dashboard/withdrawals',   icon: ArrowUpDown,     badge: null },
  {
    name: 'Finance',
    href: '/dashboard/expenses',
    icon: BarChart3,
    badge: null,
    children: userPermissions?.ALTER_FINANCE
      ? [
          { name: 'Overview',   tab: 'overview', icon: PieChart },
          { name: 'Revenue',    tab: 'revenue',  icon: TrendingUp },
          { name: 'Commission', tab: 'commission', icon: DollarSign },
          { name: 'Expenses',   tab: 'expenses', icon: Receipt },
          { name: 'Assets',     tab: 'assets',   icon: Building2 },
          { name: 'Float',      tab: 'budget',   icon: Wallet },
          { name: 'Analytics',  tab: 'analytics', icon: BarChart3 },
        ]
      : [
          { name: 'Float',    tab: 'budget',   icon: Wallet },
          { name: 'Expenses', tab: 'expenses', icon: Receipt },
        ],
  },
  ...(userPermissions?.VIEW_BRIEFING
    ? [{
        name: 'Reports',
        href: '/dashboard/reports',
        icon: FileText,
        badge: null,
        children: [
          { name: 'General',    tab: 'general', icon: FileText },
          ...(userPermissions?.MANAGE_CASHACCOUNTS ? [{ name: 'Accounting', tab: 'accounting', icon: Receipt }] : []),
          ...(userPermissions?.DELETE_CUSTOMER ? [{name: 'Sales', tab: 'sales', icon: User2}] : []),
        ],
      }]
    : []),
  ...(userPermissions?.MANAGE_STAFF    ? [{ name: 'Staff',   href: '/dashboard/staffs',    icon: Users,      badge: null }] : []),
  ...(userPermissions?.LOAN_PRIVILEGES ? [{ name: 'Loans',    href: '/dashboard/loans',     icon: CreditCard, badge: null }] : []),
  { name: 'Day End', 
    href: '/dashboard/day-end', 
    icon: Calendar, 
    badge: null,
    children: [
      {name: 'Summary', tab: 'dayend', icon: Calendar},
      {name: 'Spool', tab: 'spool', icon: FileTextIcon}
    ]
   },
  { name: 'Security', href: '/dashboard/security', icon: Shield, badge: null },
  { name: 'Updates',  href: '/dashboard/updates',  icon: Sparkles, badge: 'v2.0' },
  { name: 'Chat',     href: '/dashboard/chat',     icon: MessageCircle,     badge: null },
] : [
  {name: 'Dashboard', href: '/dashboard/momo-agent', icon: Users2, badge: null},
    // { name: 'History',   href: '/dashboard/momo-agent/history',       icon: Users,           badge: null },
  ];
