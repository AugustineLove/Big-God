import { useState, useEffect, useRef } from "react";
import {
  CreditCard, Search, CheckCircle, X,
  ArrowUpCircle, ArrowDownCircle, AlertCircle,
  Smartphone, Landmark, Coins, MessageSquare,
  MessageSquareOff, Shield, ShieldAlert, ShieldOff,
  Lock, Unlock, AlertTriangle, Clock, TrendingDown,
  BadgeCheck, Info, Building2, Eye, EyeOff,
  ChevronRight, Zap,
} from "lucide-react";
import { useCustomers } from "../../../contexts/dashboard/Customers";
import { useStaff } from "../../../contexts/dashboard/Staff";
import { useAccounts } from "../../../contexts/dashboard/Account";
import { useTransactions } from "../../../contexts/dashboard/Transactions";
import { companyId, userRole, userUUID } from "../../../constants/appConstants";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Customer {
  company_id?: string;
  id: string;
  name: string;
  email: string;
  phone_number: string;
  address?: string;
  area?: string;
  city?: string;
  registered_by_name?: string;
  created_at: string;
  location: string;
  daily_rate: string;
  total_balance: string;
  total_transactions: string;
  id_card?: string;
  next_of_kin?: string;
  date_of_registration?: string;
  gender?: string;
  registered_by?: string;
  customer_id?: string;
  total_balance_across_all_accounts?: string;
  account_number?: string;
}

interface Account {
  id: string;
  account_number: string;
  account_type: string;
  balance: number;
  status?: string;
  created_at: string;
  customer_id?: string;
  // Settings fields
  minimum_balance?: number;
  allow_negative_balance?: boolean;
  overdraft_limit?: number;
  low_balance_threshold?: number;
  daily_withdrawal_limit?: number;
  card_status?: string;
  card_number?: string;
  card_expiry_date?: string;
  card_replacement_count?: number;
  transaction_pin_enabled?: boolean;
  locked_until?: string;
  failed_pin_attempts?: number;
  sms_enabled?: boolean;
  interest_rate?: number;
  daily_rate?: number;
  frequency?: string;
  last_activity_at?: string;
  inactive_at?: string;
}

interface Transaction {
  id?: string;
  account_id: string;
  amount: number;
  transaction_type: string;
  description?: string;
  transaction_date?: string;
  staked_by: string;
  company_id: string;
  status: string;
  payment_method?: string;
}

interface TransactionModalProps {
  transaction?: Transaction | null;
  onSave: (transaction: any) => void;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n: number | string | undefined, digits = 2) =>
  Number(n || 0).toLocaleString("en-GH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

const isExpired = (d?: string) => !!d && new Date(d) < new Date();
const isLocked = (until?: string) => !!until && new Date(until) > new Date();
const daysSince = (d?: string) => {
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
};

const ACCOUNT_TYPE_ICONS: Record<string, string> = {
  savings: "", susu: "", current: "", default: "",
};

const getAccountEmoji = (type: string) =>
  ACCOUNT_TYPE_ICONS[type.toLowerCase()] ?? ACCOUNT_TYPE_ICONS.default;

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="flex items-center gap-1 text-[11.5px] text-red-500 mt-1.5">
      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {msg}
    </p>
  ) : null;

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <p className="text-[11.5px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
    {children}{required && <span className="text-red-400 ml-0.5">*</span>}
  </p>
);

/** A compact warning/info/danger banner */
const AlertBanner = ({
  type, icon: Icon, title, sub,
}: {
  type: "warn" | "danger" | "info" | "success";
  icon: React.ElementType;
  title: string;
  sub?: string;
}) => {
  const styles = {
    warn:    { wrap: "bg-amber-50 border-amber-200 text-amber-800", sub: "text-amber-600", icon: "text-amber-500" },
    danger:  { wrap: "bg-red-50 border-red-200 text-red-800",       sub: "text-red-500",   icon: "text-red-500" },
    info:    { wrap: "bg-blue-50 border-blue-100 text-blue-800",     sub: "text-blue-500",  icon: "text-blue-400" },
    success: { wrap: "bg-emerald-50 border-emerald-100 text-emerald-800", sub: "text-emerald-500", icon: "text-emerald-500" },
  };
  const s = styles[type];
  return (
    <div className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border text-[12px] ${s.wrap}`}>
      <Icon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${s.icon}`} />
      <div>
        <span className="font-semibold">{title}</span>
        {sub && <span className={`ml-1 font-normal ${s.sub}`}>{sub}</span>}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Account Health Panel
// ─────────────────────────────────────────────────────────────────────────────

const AccountHealthPanel = ({
  account, amount, txType,
}: {
  account: Account;
  amount: string;
  txType: "deposit" | "withdrawal";
}) => {
  const numAmount = parseFloat(amount) || 0;
  const balance = account.balance || 0;
  const minBalance = account.minimum_balance || 0;
  const overdraftLimit = account.overdraft_limit || 0;
  const dailyLimit = account.daily_withdrawal_limit;
  const lowThreshold = account.low_balance_threshold || 100;

  const projectedBalance =
    txType === "withdrawal" ? balance - numAmount : balance + numAmount;

  const willBreachMin = txType === "withdrawal" && projectedBalance < minBalance && !account.allow_negative_balance;
  const willGoNegative =
    txType === "withdrawal" && projectedBalance < 0 && account.allow_negative_balance &&
    Math.abs(projectedBalance) > overdraftLimit;
  const willBeNegativeAllowed =
    txType === "withdrawal" && projectedBalance < 0 && account.allow_negative_balance &&
    Math.abs(projectedBalance) <= overdraftLimit;
  const willBeLow =
    txType === "withdrawal" && projectedBalance >= 0 && projectedBalance < lowThreshold;

  const cardStatus = account.card_status?.toUpperCase();
  const cardExpired = isExpired(account.card_expiry_date);
  const pinLocked = isLocked(account.locked_until);
  const days = daysSince(account.last_activity_at);
  const isDormant = days !== null && days > 90;

  const warnings: React.ReactNode[] = [];

  // ── Account-level alerts ──────────────────────────────────────────────────
  if (account.status === "Suspended")
    warnings.push(<AlertBanner key="susp" type="danger" icon={ShieldOff} title="Account suspended" sub="Transactions may be restricted." />);
  if (account.status === "Inactive")
    warnings.push(<AlertBanner key="inact" type="warn" icon={ShieldAlert} title="Account inactive" sub="Confirm with supervisor before proceeding." />);
  if (account.status === "Dormant" || isDormant)
    warnings.push(<AlertBanner key="dorm" type="warn" icon={Clock} title={`Account dormant`} sub={days ? `No activity in ${days} days.` : undefined} />);

  // ── PIN / lock alerts ─────────────────────────────────────────────────────
  if (pinLocked)
    warnings.push(<AlertBanner key="lock" type="danger" icon={Lock} title="PIN locked" sub={`Until ${formatDate(account.locked_until)}`} />);
  if (account.failed_pin_attempts && account.failed_pin_attempts > 0 && !pinLocked)
    warnings.push(<AlertBanner key="pin" type="warn" icon={ShieldAlert} title={`${account.failed_pin_attempts} failed PIN attempt(s)`} sub="Verify customer identity." />);

  // ── Card alerts ───────────────────────────────────────────────────────────
  if (cardStatus === "BLOCKED")
    warnings.push(<AlertBanner key="cblk" type="danger" icon={ShieldOff} title="Card is blocked" sub="The physical card cannot be used." />);
  if (cardStatus === "LOST" || cardStatus === "STOLEN")
    warnings.push(<AlertBanner key="clost" type="danger" icon={AlertTriangle} title={`Card reported ${cardStatus?.toLowerCase()}`} sub="Extra verification required." />);
  if (cardExpired && account.card_expiry_date)
    warnings.push(<AlertBanner key="cexp" type="warn" icon={Clock} title="Card expired" sub={`Expired ${formatDate(account.card_expiry_date)}`} />);

  // ── Balance / amount alerts ───────────────────────────────────────────────
  if (willBreachMin)
    warnings.push(<AlertBanner key="bmin" type="danger" icon={TrendingDown} title="Below minimum balance" sub={`Would leave ¢${fmt(projectedBalance)} (min ¢${fmt(minBalance)})`} />);
  if (willGoNegative)
    warnings.push(<AlertBanner key="bneg" type="danger" icon={TrendingDown} title="Exceeds overdraft limit" sub={`Overdraft limit is ¢${fmt(overdraftLimit)}`} />);
  if (willBeNegativeAllowed)
    warnings.push(<AlertBanner key="bneok" type="warn" icon={TrendingDown} title="Balance will go negative" sub={`Overdraft applies — projected: −¢${fmt(Math.abs(projectedBalance))}`} />);
  if (willBeLow)
    warnings.push(<AlertBanner key="blow" type="warn" icon={AlertCircle} title="Low balance after transaction" sub={`¢${fmt(projectedBalance)} remaining`} />);
  if (dailyLimit && txType === "withdrawal" && numAmount > dailyLimit)
    warnings.push(<AlertBanner key="dlim" type="danger" icon={ShieldAlert} title="Exceeds daily withdrawal limit" sub={`Limit is ¢${fmt(dailyLimit)}`} />);

  // ── Stats row ─────────────────────────────────────────────────────────────
  const stats = [
    { label: "Balance", value: `¢${fmt(balance)}`, color: balance < 0 ? "text-red-600" : "text-gray-900" },
    { label: "Minimum", value: `¢${fmt(minBalance)}`, color: "text-gray-600" },
    ...(account.allow_negative_balance
      ? [{ label: "Overdraft", value: `¢${fmt(overdraftLimit)}`, color: "text-orange-600" }]
      : []),
    ...(dailyLimit ? [{ label: "Daily limit", value: `¢${fmt(dailyLimit)}`, color: "text-gray-600" }] : []),
    ...(account.interest_rate ? [{ label: "Rate", value: `${account.interest_rate}%`, color: "text-emerald-600" }] : []),
    ...(account.frequency ? [{ label: "Freq.", value: account.frequency, color: "text-blue-600" }] : []),
    ...(account.daily_rate ? [{ label: "Rate", value: account.daily_rate, color: "text-green-600" }] : []),
  ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden">
      {/* Stats bar */}
      <div className="grid divide-x divide-gray-100 border-b border-gray-100"
        style={{ gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)` }}>
        {stats.slice(0, 4).map((s) => (
          <div key={s.label} className="px-3 py-2.5 text-center">
            <p className="text-[9.5px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">{s.label}</p>
            <p className={`text-[13px] font-bold tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Projected balance pill (if amount entered) */}
      {numAmount > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <span className="text-[11.5px] text-gray-400">Projected balance after transaction</span>
          <span className={`text-[13px] font-bold tabular-nums ${
            projectedBalance < 0 ? "text-red-600" : projectedBalance < lowThreshold ? "text-amber-600" : "text-emerald-600"
          }`}>
            {projectedBalance < 0 ? "−" : ""}¢{fmt(Math.abs(projectedBalance))}
          </span>
        </div>
      )}

      {/* Card + PIN status row */}
      <div className="flex items-center gap-3 px-4 py-2.5 flex-wrap">
        {/* Card chip */}
        <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
          cardStatus === "ACTIVE"   ? "bg-emerald-100 text-emerald-700" :
          cardStatus === "BLOCKED"  ? "bg-red-100 text-red-700" :
          cardStatus === "LOST" || cardStatus === "STOLEN" ? "bg-red-100 text-red-700" :
          cardStatus === "EXPIRED"  ? "bg-amber-100 text-amber-700" :
          "bg-gray-100 text-gray-500"
        }`}>
          <CreditCard className="w-3 h-3" />
          Card: {cardStatus ?? "—"}
          {account.card_replacement_count && account.card_replacement_count > 0
            ? <span className="opacity-60 ml-1">#{account.card_replacement_count}R</span>
            : null}
        </div>

        {/* PIN chip */}
        {account.transaction_pin_enabled && (
          <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
            pinLocked ? "bg-red-100 text-red-700" : "bg-blue-50 text-blue-600"
          }`}>
            {pinLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            PIN: {pinLocked ? "Locked" : "Enabled"}
          </div>
        )}

        {/* Overdraft chip */}
        {account.allow_negative_balance && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600">
            <Zap className="w-3 h-3" />
            Overdraft on
          </div>
        )}

        {/* Last activity */}
        {days !== null && (
          <span className="text-[11px] text-gray-400 ml-auto">
            Last activity: {days === 0 ? "today" : `${days}d ago`}
          </span>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="flex flex-col gap-1.5 px-3 pb-3 pt-1 border-t border-gray-100">
          {warnings}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SMS Toggle component
// ─────────────────────────────────────────────────────────────────────────────

const SmsToggle = ({
  enabled,
  onChange,
  accountDefault,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  accountDefault?: boolean;
}) => (
  <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all ${
    enabled
      ? "border-emerald-200 bg-emerald-50"
      : "border-gray-100 bg-gray-50"
  }`}>
    <div className="flex items-center gap-2.5">
      {enabled
        ? <MessageSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        : <MessageSquareOff className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      <div>
        <p className={`text-[13px] font-semibold ${enabled ? "text-emerald-800" : "text-gray-500"}`}>
          SMS notification
          {accountDefault === false && enabled && (
            <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-600 font-semibold px-1.5 py-0.5 rounded-md">
              Override
            </span>
          )}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {enabled
            ? "Customer will receive an SMS for this transaction"
            : "No SMS will be sent for this transaction"}
          {accountDefault !== undefined && (
            <span className="ml-1 opacity-60">
              · account default: {accountDefault ? "on" : "off"}
            </span>
          )}
        </p>
      </div>
    </div>
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
        enabled ? "bg-emerald-500" : "bg-gray-300"
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        enabled ? "translate-x-6" : "translate-x-1"
      }`} />
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────────────────────

const TransactionModal: React.FC<TransactionModalProps> = ({ transaction, onSave, onClose }) => {
  const { customerLoading, refreshCustomers } = useCustomers();
  const { staffList, loading: staffLoading } = useStaff();
  const { accounts, refreshAccounts, setAccounts } = useAccounts();
  const { addTransaction, refreshTransactions, loading } = useTransactions();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sendSms, setSendSms] = useState(true);

  const [formData, setFormData] = useState({
    account_id: transaction?.account_id || "",
    amount: transaction?.amount?.toString() || "",
    transaction_type: (transaction?.transaction_type || "deposit") as "deposit" | "withdrawal",
    withdrawal_type: "",
    payment_method: transaction?.payment_method || "cash",
    description: transaction?.description || "",
    transaction_date: transaction?.transaction_date
      ? new Date(transaction.transaction_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    staked_by: transaction?.staked_by || "",
    company_id: companyId,
    staff_id: userUUID,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const mobileBankers = staffList.filter((s) =>
    ["Mobile Banker", "mobile banker", "mobile_banker", "teller"].includes(s.role)
  );

  // ── Debounced customer search ──────────────────────────────────────────────
  useEffect(() => {
    if (!customerSearch.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `https://susu-pro-backend.onrender.com/api/customers/${companyId}/search?query=${customerSearch}`
        );
        const data = await res.json();
        setSearchResults(data.data || []);
      } catch { /* silent */ } finally { setSearchLoading(false); }
    }, 380);
    return () => clearTimeout(t);
  }, [customerSearch]);

  useEffect(() => {
    if (!selectedCustomer) return;
    setLoadingAccounts(true);
    setAccounts([]);
    refreshAccounts(selectedCustomer.id).finally(() => setLoadingAccounts(false));
  }, [selectedCustomer]);

  useEffect(() => {
    if (selectedCustomer?.registered_by) {
      setFormData((p) => ({ ...p, staked_by: selectedCustomer.registered_by! }));
    }
  }, [selectedCustomer]);

  // Sync SMS toggle with selected account's default
  useEffect(() => {
    if (selectedAccount) {
      setSendSms(selectedAccount.sms_enabled !== false);
    }
  }, [selectedAccount]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current && !searchInputRef.current.contains(e.target as Node)
      ) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const selectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setShowDropdown(false);
    setSelectedAccount(null);
    setFormData((p) => ({ ...p, account_id: "" }));
    refreshAccounts(c.customer_id || c.id);
  };

  const selectAccount = (a: Account) => {
    setSelectedAccount(a);
    setFormData((p) => ({ ...p, account_id: a.id }));
    if (errors.account_id) setErrors((p) => ({ ...p, account_id: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.account_id) e.account_id = "Select a customer account";
    if (!formData.amount || parseFloat(formData.amount) <= 0) e.amount = "Enter a valid amount";
    if (!formData.description.trim()) e.description = "Description is required";
    if (!formData.staked_by) e.staked_by = "Select a mobile banker";
    if (formData.transaction_type === "withdrawal" && !formData.withdrawal_type)
      e.withdrawal_type = "Select a withdrawal type";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const toastId = toast.loading("Adding transaction…");
    const status = formData.transaction_type === "withdrawal" ? "pending" : "completed";
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount),
      transaction_date: new Date(formData.transaction_date).toISOString(),
      company_id: companyId,
      unique_code: "",
      status,
      send_sms: sendSms,
    };
     const ok = await addTransaction(payload, selectedAccount, selectedCustomer, formData.amount);
    if (ok === true) {
      toast.success("Transaction added successfully", { id: toastId });
      onClose();
      refreshTransactions("1", 20);
      refreshCustomers(String(1), 20, { location: "all", status: "all", staff: "all", dateRange: "all" });
      if (transaction) onSave({ ...transaction, ...payload });
    } else {
      toast.error("Failed — amount may exceed balance or minimum balance", { id: toastId });
    }
  };

  const isWithdrawal = formData.transaction_type === "withdrawal";
  const isDeposit = !isWithdrawal;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-xl flex flex-col" style={{ maxHeight: "92vh" }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isDeposit ? "bg-emerald-50" : "bg-red-50"
            }`}>
              {isDeposit
                ? <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
                : <ArrowDownCircle className="w-5 h-5 text-red-500" />}
            </div>
            <div>
              <p className="text-[15px] font-semibold text-gray-900">
                {transaction ? "Edit transaction" : "New transaction"}
              </p>
              <p className="text-[12px] text-gray-400 mt-0.5">
                Record a deposit or withdrawal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

          {/* ── Transaction type toggle — first so context is set ── */}
          <div>
            <Label>Transaction type</Label>
            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
              {(["deposit", "withdrawal"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, transaction_type: type, withdrawal_type: "" }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-all
                    ${formData.transaction_type === type
                      ? type === "deposit"
                        ? "bg-white text-emerald-600 shadow-sm"
                        : "bg-white text-red-500 shadow-sm"
                      : "text-gray-400 hover:text-gray-600"}`}
                >
                  {type === "deposit"
                    ? <ArrowUpCircle className="w-4 h-4" />
                    : <ArrowDownCircle className="w-4 h-4" />}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* ── Customer search ── */}
          <div>
            <Label>Customer</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value) {
                    setSelectedCustomer(null);
                    setSelectedAccount(null);
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search by name, phone or account number…"
                className={`w-full pl-10 pr-10 py-2.5 border rounded-2xl text-[13px] bg-gray-50 focus:bg-white focus:outline-none transition-all
                  ${errors.account_id
                    ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"}`}
              />
              {selectedCustomer && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              )}

              {showDropdown && customerSearch && (
                <div
                  ref={dropdownRef}
                  className="absolute z-20 w-full mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden"
                  style={{ maxHeight: 220, overflowY: "auto" }}
                >
                  {searchLoading ? (
                    <div className="py-4 text-center text-[13px] text-gray-400">Searching…</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 text-[11px] font-bold flex-shrink-0">
                            {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-gray-900">{c.name}</p>
                            <p className="text-[11px] text-gray-400">{c.phone_number} · {c.account_number || "—"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-semibold text-emerald-600">
                            ¢{parseFloat(c.total_balance_across_all_accounts || "0").toLocaleString()}
                          </p>
                          <p className="text-[11px] text-gray-400">{c.total_transactions} txns</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-[13px] text-gray-400">No customers found</div>
                  )}
                </div>
              )}
            </div>
            <FieldError msg={errors.account_id} />

            {/* Selected customer chip */}
            {selectedCustomer && (
              <div className="mt-2.5 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 text-[12px] font-bold flex-shrink-0">
                    {selectedCustomer.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">{selectedCustomer.name}</p>
                    <p className="text-[11px] text-gray-500">{selectedCustomer.phone_number}
                      {selectedCustomer.area && ` · ${selectedCustomer.area}`}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-bold text-emerald-600">
                    ¢{fmt(parseFloat(selectedCustomer.total_balance_across_all_accounts || "0"), 0)}
                  </p>
                  <p className="text-[10px] text-gray-400">{selectedCustomer.total_transactions} total txns</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Account selection ── */}
          {selectedCustomer && (
            <div>
              <Label>Account</Label>
              {loadingAccounts ? (
                <div className="flex items-center gap-3 py-5 text-[13px] text-gray-400">
                  <svg className="w-5 h-5 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  Loading accounts…
                </div>
              ) : accounts.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {accounts.map((account) => {
                    const restricted =
                      (userRole === "teller" && account.account_type.toLowerCase() === "normal") ||
                      account.status === "Inactive";
                    const selected = selectedAccount?.id === account.id;
                    const cardBad = ["BLOCKED","LOST","STOLEN"].includes(account.card_status?.toUpperCase() || "");
                    const pinLk = isLocked(account.locked_until);

                    return (
                      <div key={account.id}>
                        <div
                          onClick={() => !restricted && selectAccount(account)}
                          className={`flex items-center justify-between px-4 py-3.5 border-2 rounded-2xl transition-all
                            ${restricted ? "opacity-40 cursor-not-allowed bg-gray-50" : "cursor-pointer"}
                            ${selected
                              ? isDeposit
                                ? "border-emerald-400 bg-emerald-50"
                                : "border-red-300 bg-red-50"
                              : "border-gray-100 hover:border-gray-200 bg-white"}`}
                        >
                          <div className="flex items-center gap-3">
                            {/* <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg
                              ${selected
                                ? isDeposit ? "bg-emerald-100" : "bg-red-100"
                                : "bg-gray-100"}`}>
                              {getAccountEmoji(account.account_type)}
                            </div> */}
                            <div>
                              <p className="text-[13px] font-semibold text-gray-900 capitalize">
                                {account.account_type} account
                              </p>
                              <p className="text-[11px] text-gray-400 font-mono">····{account.account_number.slice(-4)}</p>

                              {/* inline status chips on card row */}
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {account.status && account.status !== "Active" && (
                                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                    {account.status}
                                  </span>
                                )}
                                {cardBad && (
                                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                                    Card {account.card_status}
                                  </span>
                                )}
                                {pinLk && (
                                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                                    PIN locked
                                  </span>
                                )}
                                {restricted && (
                                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">
                                    Restricted
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div className="text-right">
                              <p className={`text-[14px] font-bold tabular-nums ${
                                account.balance < 0
                                  ? "text-red-600"
                                  : selected
                                    ? isDeposit ? "text-emerald-600" : "text-red-500"
                                    : "text-gray-900"
                              }`}>
                                {account.balance < 0 ? "−" : ""}¢{fmt(Math.abs(account.balance), 0)}
                              </p>
                              <p className="text-[10px] text-gray-400">Available</p>
                            </div>
                            {selected && (
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                isDeposit ? "bg-emerald-500" : "bg-red-400"
                              }`}>
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Account health panel — only for selected */}
                        {selected && (
                          <div className="mt-2">
                            <AccountHealthPanel
                              account={account}
                              amount={formData.amount}
                              txType={formData.transaction_type as "deposit" | "withdrawal"}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-[13px] text-gray-400 bg-gray-50 rounded-2xl">
                  No accounts found for this customer
                </div>
              )}
              <FieldError msg={errors.account_id} />
            </div>
          )}

          {/* ── Payment method ── */}
          <div>
            <Label>Payment method</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "cash",  label: "Cash",          icon: Coins,    desc: "Physical cash" },
                { value: "momo",  label: "Mobile Money",  icon: Smartphone, desc: "MTN · Voda · ATigo" },
                { value: "bank",  label: "Bank Transfer",  icon: Landmark,  desc: "Direct transfer" },
              ].map((method) => {
                const Icon = method.icon;
                const isSel = formData.payment_method === method.value;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, payment_method: method.value }))}
                    className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl border-2 transition-all
                      ${isSel
                        ? isDeposit
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-red-300 bg-red-50"
                        : "border-gray-100 bg-white hover:border-gray-200"}`}
                  >
                    <Icon className={`w-5 h-5 ${isSel
                      ? isDeposit ? "text-emerald-600" : "text-red-600"
                      : "text-gray-400"}`} />
                    <p className={`text-[12px] font-semibold ${isSel
                      ? isDeposit ? "text-emerald-700" : "text-red-700"
                      : "text-gray-700"}`}>
                      {method.label}
                    </p>
                    <p className="text-[9.5px] text-gray-400 text-center">{method.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Withdrawal type ── */}
          {isWithdrawal && (
            <div>
              <Label required>Withdrawal type</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "advance",    label: "Advance",    desc: "Early payout against savings" },
                  { value: "commission", label: "Commission", desc: "Commission-based payout" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setFormData((p) => ({ ...p, withdrawal_type: opt.value }));
                      if (errors.withdrawal_type) setErrors((p) => ({ ...p, withdrawal_type: "" }));
                    }}
                    className={`text-left px-4 py-3 rounded-2xl border-2 transition-all
                      ${formData.withdrawal_type === opt.value
                        ? "border-red-300 bg-red-50"
                        : "border-gray-100 bg-white hover:border-gray-200"}`}
                  >
                    <p className={`text-[13px] font-semibold ${formData.withdrawal_type === opt.value ? "text-red-600" : "text-gray-900"}`}>
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <FieldError msg={errors.withdrawal_type} />
            </div>
          )}

          {/* ── Amount + Date ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-gray-400">¢</span>
                <input
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={`w-full pl-7 pr-3 py-2.5 border rounded-2xl text-[13px] bg-gray-50 focus:bg-white focus:outline-none transition-all
                    ${errors.amount
                      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-50"
                      : "border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"}`}
                />
              </div>
              <FieldError msg={errors.amount} />
            </div>
            <div>
              <Label required>Date & time</Label>
              <input
                type="datetime-local"
                name="transaction_date"
                value={formData.transaction_date}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-2xl text-[13px] bg-gray-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* ── Description ── */}
          <div>
            <Label required>Description</Label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              placeholder="e.g. Monthly contribution, emergency withdrawal…"
              className={`w-full px-4 py-2.5 border rounded-2xl text-[13px] bg-gray-50 focus:bg-white focus:outline-none resize-none transition-all
                ${errors.description
                  ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-50"
                  : "border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"}`}
            />
            <FieldError msg={errors.description} />
          </div>

         
          {/* ── SMS toggle ── */}
          <SmsToggle
            enabled={sendSms}
            onChange={setSendSms}
            accountDefault={selectedAccount?.sms_enabled}
          />

        </div>

        {/* ── Footer ── */}
        <div className="flex gap-2.5 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 rounded-2xl text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-[2] py-3 rounded-2xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
              isDeposit
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-gray-900 hover:bg-gray-800 text-white"
            }`}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                Adding…
              </>
            ) : (
              <>
                {isDeposit ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                {transaction ? "Update transaction" : isDeposit ? "Record deposit" : "Record withdrawal"}
                {sendSms && <MessageSquare className="w-3.5 h-3.5 opacity-60" />}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export { TransactionModal };
export default TransactionModal;