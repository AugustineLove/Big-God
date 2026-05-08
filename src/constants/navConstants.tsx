import {
  LayoutDashboard,
  Users,
  UserSearch,
  Landmark,
  Wallet,
  ArrowLeftRight,
  Receipt,
  BadgeDollarSign,
  PieChart,
  BarChart4,
  Building2,
  FileSpreadsheet,
  ShieldCheck,
  MessagesSquare,
  CalendarClock,
  Sparkles,
  CreditCard,
  ClipboardList,
  TrendingUp,
  ScrollText,
  UserCog,
  BriefcaseIcon,
} from "lucide-react";

import { userPermissions, userRole } from "./appConstants";

const can = (permission) => !!userPermissions?.[permission];

export const buildNavigation = () => {
  // MoMo agents get a simplified experience
  if (userRole === "Momo Agent") {
    return [
      {
        name: "Agent Dashboard",
        href: "/dashboard/momo-agent",
        icon: LayoutDashboard,
      },

      {
        name: "Customers",
        href: "/dashboard/clients",
        icon: Users,
      },

      {
        name: "Deposits",
        href: "/dashboard/contributions",
        icon: Wallet,
      },

      {
        name: "Withdrawals",
        href: "/dashboard/withdrawals",
        icon: ArrowLeftRight,
      },
    ];
  }

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },

    {
      name: "Customers",
      href: "/dashboard/clients",
      icon: Users,

      children: [
        {
          name: "Customer Lookup",
          tab: "customer",
          icon: UserSearch,
        },

        {
          name: "Account Statements",
          tab: "account-statement",
          icon: ScrollText,
        },

        {
          name: "Card Replacement",
          tab: "lost-card",
          icon: CreditCard,
        },
      ],
    },

    {
      name: "Deposits",
      href: "/dashboard/contributions",
      icon: Wallet,
    },

    {
      name: "Withdrawals",
      href: "/dashboard/withdrawals",
      icon: ArrowLeftRight,
    },

    {
      name: "Finance",
      href: "/dashboard/finance",
      icon: Landmark,

      children: [
        can("ALTER_FINANCE") && {
          name: "Financial Overview",
          tab: "overview",
          icon: PieChart,
        },

        can("ALTER_FINANCE") && {
          name: "Revenue",
          tab: "revenue",
          icon: TrendingUp,
        },

        can("ALTER_FINANCE") && {
          name: "Commissions",
          tab: "commission",
          icon: BadgeDollarSign,
        },

        {
          name: "Expenses",
          tab: "expenses",
          icon: Receipt,
        },

        can("ALTER_FINANCE") && {
          name: "Assets Register",
          tab: "assets",
          icon: Building2,
        },

        {
          name: "Cash Float",
          tab: "budget",
          icon: Wallet,
        },

        can("ALTER_FINANCE") && {
          name: "Analytics",
          tab: "analytics",
          icon: BarChart4,
        },
      ].filter(Boolean),
    },

    can("MANAGE_CASHACCOUNTS") && {
      name: "Accounting",
      href: "/dashboard/accounting",
      icon: FileSpreadsheet,
    },

    can("VIEW_BRIEFING") && {
      name: "Reports & Insights",
      href: "/dashboard/reports",
      icon: ClipboardList,

      children: [
        {
          name: "General Reports",
          tab: "general",
          icon: ClipboardList,
        },

        can("MANAGE_CASHACCOUNTS") && {
          name: "Accounting Reports",
          tab: "accounting",
          icon: Landmark,
        },

        can("DELETE_CUSTOMER") && {
          name: "Sales Reports",
          tab: "sales",
          icon: TrendingUp,
        },
      ].filter(Boolean),
    },

    can("MANAGE_STAFF") && {
      name: "Staff Management",
      href: "/dashboard/staffs",
      icon: UserCog,
    },

    can("LOAN_PRIVILEGES") && {
      name: "Loan Management",
      href: "/dashboard/loans",
      icon: BriefcaseIcon,
    },

    {
      name: "Day-End Operations",
      href: "/dashboard/day-end",
      icon: CalendarClock,

      children: [
        {
          name: "Day-End Summary",
          tab: "dayend",
          icon: CalendarClock,
        },

        {
          name: "Transaction Spool",
          tab: "spool",
          icon: ScrollText,
        },
      ],
    },

    can("MANAGE_SECURITY") && {
      name: "Security & Access",
      href: "/dashboard/security",
      icon: ShieldCheck,
    },

    {
      name: "Team Chat",
      href: "/dashboard/chat",
      icon: MessagesSquare,
    },

    {
      name: "System Updates",
      href: "/dashboard/updates",
      icon: Sparkles,
      badge: "v2.0",
    },
  ];

  return navigation.filter(Boolean);
};