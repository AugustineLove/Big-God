import { ArrowUpDown, BarChart3, Building2, Calendar, DollarSign, FileText, FileTextIcon, LayoutDashboard, PieChart, PiggyBank, Receipt, Shield, Sparkles, TrendingUp, Users, Wallet } from "lucide-react";
import Chat from "../pages/dashboard/ChatList";

export const companyJSON = localStorage.getItem('susupro_company');
const user = companyJSON ? JSON.parse(companyJSON) : null;
console.log(user)
export const getEffectiveCompanyId = () => {
  if (!user) return null;

  if (user.type === "company") {
    return user.id; 
  }

  if (user.type === "staff") {
    return user.companyId; // staff points to parent company id
  }

  return null;
};

export const getChangePassword = () =>{
  if (!user) return null;
  return user.change_password_after_signin;
}

export const getUserPermissions = () =>{
  if (!user) return null;
  return user.permissions;
}

const formatFallbackRole = (role: string) => {
  if (!role) return "User";

  return role
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};


export const getUserRole = () => {
  if (!user) return null;

  const rawRole =
    user.type === "company"
      ? "admin"
      : String(user.role || "").toLowerCase().trim();

  const roleMap: Record<string, string> = {
    admin: "Admin",
    manager: "Manager",
    teller: "Teller",
    mobile_banker: "Mobile Banker",
    "mobile banker": "Mobile Banker",
    mobilebanker: "Mobile Banker",
    cashier: "Cashier",
    accountant: "Accountant",
    sales_manager: "Sales Manager",
    hr: "Human Resource"
  };

  return roleMap[rawRole] || formatFallbackRole(rawRole);
};

export const getUserUUID = () => {
  if (!user) return null;
  return user.id;
}

export const getStaffID = () => {
  if (!user) return null;
  return user.staffId;
}
export const getDisplayName = () => {
  if (!user) return null;

  return user.type === "company" ? user.companyName : user.staffName;
};

export const getUserType = () => {
  if (!user) return null;
  return user.type === "company" ? "company" : "staff";
}

export const getParentCompanyName = () => {
  if (!user) return null;
  return user.type === "staff" ? user.companyName : user.companyName;
}

      
export function formatDate(dateString: string, locale: string = "en-US"): string {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (isNaN(date.getTime())) return "Invalid Date";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",  
    day: "numeric", 
  }).format(date);
}

export const makeSuSuProName = (companyName: string) => {
  if (!companyName || typeof companyName !== 'string') return 'SuSuPro';
  if(companyName === 'Big God Susu Enterprise') return 'BigGod Susu'
  // Get words (handles extra spaces, punctuation, hyphens)
  const words = companyName
    .trim()
    .split(/[\s\-_.]+/g)                // split on space, hyphen, underscore, dot
    .filter(Boolean);

  // Collect initials (letters only), uppercase
  const initials = words
    .map(w => (w.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/)?.[0] || '')) // first letter (incl. accents)
    .join('')
    .toUpperCase();

  return `${initials}SuSu`;
}

export const buildNavigation = () => [
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
          ...(userPermissions?.DELETE_CUSTOMER ? [{name: 'Sales', tab: 'sales', icon: Users2}] : []),
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
  { name: 'Chat',     href: '/dashboard/chat',     icon: Chat,     badge: null },
];


export const companyId = getEffectiveCompanyId();
export const companyName = getDisplayName();
export const userRole = getUserRole();
export const userStaffId = getStaffID();
export const userType = getUserType();
export const userPermissions = getUserPermissions();
export const resetPassword = getChangePassword();
export const userUUID = getUserUUID();
export const parentCompanyName = getParentCompanyName();