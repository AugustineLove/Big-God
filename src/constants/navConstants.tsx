import { ArrowUpDown, BarChart3, Building2, Calendar, CreditCard, CreditCardIcon, DollarSign, FileText, FileTextIcon, LayoutDashboard, MessageCircle, PieChart, PiggyBank, Receipt, Shield, Sparkles, TrendingUp, User2, Users, Users2, Wallet } from "lucide-react";
import Chat from "../pages/dashboard/ChatList";
import { userPermissions, userRole } from "./appConstants";


export const buildNavigation = () => userRole !== 'Momo Agent'
? [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null
    },

    {
      name: 'Customers',
      href: '/dashboard/clients',
      icon: Users,
      badge: null,
      children: [
        {
          name: 'Customer Lookup',
          tab: 'customer',
          icon: User2
        },
        {
          name: 'Account Statements',
          tab: 'account-statement',
          icon: CreditCard
        },
        {
          name: 'Lost / Replacement Cards',
          tab: 'lost-card',
          icon: CreditCardIcon
        }
      ]
    },

    {
      name: 'Deposits',
      href: '/dashboard/contributions',
      icon: PiggyBank,
      badge: null
    },

    {
      name: 'Withdrawals',
      href: '/dashboard/withdrawals',
      icon: ArrowUpDown,
      badge: null
    },

    {
      name: 'Finance & Accounts',
      href: '/dashboard/expenses',
      icon: BarChart3,
      badge: null,

      children: userPermissions?.ALTER_FINANCE
        ? [
            {
              name: 'Financial Overview',
              tab: 'overview',
              icon: PieChart
            },
            {
              name: 'Revenue Tracking',
              tab: 'revenue',
              icon: TrendingUp
            },
            {
              name: 'Commissions',
              tab: 'commission',
              icon: DollarSign
            },
            {
              name: 'Expense Management',
              tab: 'expenses',
              icon: Receipt
            },
            {
              name: 'Assets Register',
              tab: 'assets',
              icon: Building2
            },
            {
              name: 'Cash Float',
              tab: 'budget',
              icon: Wallet
            },
            {
              name: 'Financial Analytics',
              tab: 'analytics',
              icon: BarChart3
            },
          ]
        : [
            {
              name: 'Cash Float',
              tab: 'budget',
              icon: Wallet
            },
            {
              name: 'Expenses',
              tab: 'expenses',
              icon: Receipt
            },
          ],
    },

    ...(userPermissions?.VIEW_BRIEFING
      ? [{
          name: 'Reports & Insights',
          href: '/dashboard/reports',
          icon: FileText,
          badge: null,

          children: [
            {
              name: 'General Reports',
              tab: 'general',
              icon: FileText
            },

            ...(userPermissions?.MANAGE_CASHACCOUNTS
              ? [{
                  name: 'Accounting Reports',
                  tab: 'accounting',
                  icon: Receipt
                }]
              : []),

            ...(userPermissions?.DELETE_CUSTOMER
              ? [{
                  name: 'Sales Reports',
                  tab: 'sales',
                  icon: User2
                }]
              : []),
          ],
        }]
      : []),

    ...(userPermissions?.MANAGE_STAFF
      ? [{
          name: 'Staff Management',
          href: '/dashboard/staffs',
          icon: Users,
          badge: null
        }]
      : []),

    ...(userPermissions?.LOAN_PRIVILEGES
      ? [{
          name: 'Loan Management',
          href: '/dashboard/loans',
          icon: CreditCard,
          badge: null
        }]
      : []),

    {
      name: 'Day-End Operations',
      href: '/dashboard/day-end',
      icon: Calendar,
      badge: null,

      children: [
        {
          name: 'Day-End Summary',
          tab: 'dayend',
          icon: Calendar
        },
        {
          name: 'Transaction Spool',
          tab: 'spool',
          icon: FileTextIcon
        }
      ]
    },

    {
      name: 'Security & Access',
      href: '/dashboard/security',
      icon: Shield,
      badge: null
    },

    {
      name: 'System Updates',
      href: '/dashboard/updates',
      icon: Sparkles,
      badge: 'v2.0'
    },

    {
      name: 'Team Chat',
      href: '/dashboard/chat',
      icon: MessageCircle,
      badge: null
    },
]
: [
    {
      name: 'Agent Dashboard',
      href: '/dashboard/momo-agent',
      icon: Users2,
      badge: null
    },
];