import { useState, useEffect, useRef } from "react";
import {
  CreditCard, Search, CheckCircle, X,
  ArrowUpCircle, ArrowDownCircle, AlertCircle,
  Smartphone, Landmark, Coins, MessageSquare,
  MessageSquareOff, ShieldAlert, ShieldOff,
  Lock, Unlock, AlertTriangle, Clock, TrendingDown,
  Zap,
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
  /** Lock the modal to a single flow (used by the "Deposit" / "Withdrawal" quick
   *  action buttons). When set, the deposit/withdrawal toggle is hidden and the
   *  type can't be changed. Leave undefined to keep the toggle (e.g. editing). */
  transactionType?: "deposit" | "withdrawal";
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

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="flex items-center gap-1 text-[11.5px] mt-1.5" style={{ color: "var(--clay)" }}>
      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {msg}
    </p>
  ) : null;

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-faint)] mb-1.5">
    {children}{required && <span className="ml-0.5" style={{ color: "var(--clay)" }}>*</span>}
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
    warn:    { bg: "var(--brass-soft)", text: "var(--forest-deep)", sub: "var(--forest-deep)", icon: "var(--brass)" },
    danger:  { bg: "var(--clay-soft)",  text: "var(--clay)",        sub: "var(--clay)",        icon: "var(--clay)" },
    info:    { bg: "var(--paper)",      text: "var(--ink-soft)",    sub: "var(--ink-faint)",   icon: "var(--ink-faint)" },
    success: { bg: "rgba(47,74,50,0.1)",text: "var(--forest)",      sub: "var(--forest)",      icon: "var(--forest)" },
  };
  const s = styles[type];
  return (
    <div
      className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border text-[12px]"
      style={{ background: s.bg, borderColor: "var(--paper-line)", color: s.text }}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: s.icon }} />
      <div>
        <span className="font-semibold">{title}</span>
        {sub && <span className="ml-1 font-normal" style={{ color: s.sub }}>{sub}</span>}
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
    { label: "Balance", value: `¢${fmt(balance)}`, color: balance < 0 ? "var(--clay)" : "var(--ink)" },
    { label: "Minimum", value: `¢${fmt(minBalance)}`, color: "var(--ink-soft)" },
    ...(account.allow_negative_balance
      ? [{ label: "Overdraft", value: `¢${fmt(overdraftLimit)}`, color: "var(--brass)" }]
      : []),
    ...(dailyLimit ? [{ label: "Daily limit", value: `¢${fmt(dailyLimit)}`, color: "var(--ink-soft)" }] : []),
    ...(account.interest_rate ? [{ label: "Rate", value: `${account.interest_rate}%`, color: "var(--forest)" }] : []),
    ...(account.frequency ? [{ label: "Freq.", value: account.frequency, color: "var(--ink-soft)" }] : []),
    ...(account.daily_rate ? [{ label: "Rate", value: account.daily_rate, color: "var(--forest)" }] : []),
  ];

  return (
    <div className="rounded-2xl border border-[var(--paper-line)] bg-[var(--paper)] overflow-hidden">
      {/* Stats bar */}
      <div className="grid divide-x divide-[var(--paper-line)] border-b border-[var(--paper-line)]"
        style={{ gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)` }}>
        {stats.slice(0, 4).map((s) => (
          <div key={s.label} className="px-3 py-2.5 text-center">
            <p className="text-[9.5px] uppercase tracking-wider font-semibold text-[var(--ink-faint)] mb-0.5">{s.label}</p>
            <p className="cd-mono text-[13px] font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Projected balance pill (if amount entered) */}
      {numAmount > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--paper-line)]">
          <span className="text-[11.5px] text-[var(--ink-faint)]">Projected balance after transaction</span>
          <span
            className="cd-mono text-[13px] font-bold tabular-nums"
            style={{ color: projectedBalance < 0 ? "var(--clay)" : projectedBalance < lowThreshold ? "#b8963f" : "var(--forest)" }}
          >
            {projectedBalance < 0 ? "−" : ""}¢{fmt(Math.abs(projectedBalance))}
          </span>
        </div>
      )}

      {/* Card + PIN status row */}
      <div className="flex items-center gap-3 px-4 py-2.5 flex-wrap">
        {/* Card chip */}
        <div
          className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
          style={{
            background:
              cardStatus === "ACTIVE" ? "rgba(47,74,50,0.1)" :
              cardStatus === "BLOCKED" || cardStatus === "LOST" || cardStatus === "STOLEN" ? "var(--clay-soft)" :
              cardStatus === "EXPIRED" ? "var(--brass-soft)" : "var(--card)",
            color:
              cardStatus === "ACTIVE" ? "var(--forest)" :
              cardStatus === "BLOCKED" || cardStatus === "LOST" || cardStatus === "STOLEN" ? "var(--clay)" :
              cardStatus === "EXPIRED" ? "var(--forest-deep)" : "var(--ink-faint)",
          }}
        >
          <CreditCard className="w-3 h-3" />
          Card: {cardStatus ?? "—"}
          {account.card_replacement_count && account.card_replacement_count > 0
            ? <span className="opacity-60 ml-1">#{account.card_replacement_count}R</span>
            : null}
        </div>

        {/* PIN chip */}
        {account.transaction_pin_enabled && (
          <div
            className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
            style={{
              background: pinLocked ? "var(--clay-soft)" : "var(--card)",
              color: pinLocked ? "var(--clay)" : "var(--ink-soft)",
            }}
          >
            {pinLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            PIN: {pinLocked ? "Locked" : "Enabled"}
          </div>
        )}

        {/* Overdraft chip */}
        {account.allow_negative_balance && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: "var(--brass-soft)", color: "var(--forest-deep)" }}>
            <Zap className="w-3 h-3" />
            Overdraft on
          </div>
        )}

        {/* Last activity */}
        {days !== null && (
          <span className="text-[11px] text-[var(--ink-faint)] ml-auto">
            Last activity: {days === 0 ? "today" : `${days}d ago`}
          </span>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="flex flex-col gap-1.5 px-3 pb-3 pt-1 border-t border-[var(--paper-line)]">
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
  <div
    className="flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all"
    style={{
      borderColor: enabled ? 'var(--forest)' : 'var(--paper-line)',
      background: enabled ? 'rgba(47,74,50,0.06)' : 'var(--paper)',
    }}
  >
    <div className="flex items-center gap-2.5">
      {enabled
        ? <MessageSquare className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--forest)' }} />
        : <MessageSquareOff className="w-4 h-4 text-[var(--ink-faint)] flex-shrink-0" />}
      <div>
        <p className="text-[13px] font-semibold" style={{ color: enabled ? 'var(--forest-deep)' : 'var(--ink-soft)' }}>
          SMS notification
          {accountDefault === false && enabled && (
            <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: 'var(--brass-soft)', color: 'var(--forest-deep)' }}>
              Override
            </span>
          )}
        </p>
        <p className="text-[11px] text-[var(--ink-faint)] mt-0.5">
          {enabled
            ? "Customer will receive an SMS for this transaction"
            : "No SMS will be sent for this transaction"}
          {accountDefault !== undefined && (
            <span className="ml-1 opacity-70">
              · account default: {accountDefault ? "on" : "off"}
            </span>
          )}
        </p>
      </div>
    </div>
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
      style={{ background: enabled ? 'var(--forest)' : 'var(--paper-line)' }}
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

const TransactionModal: React.FC<TransactionModalProps> = ({ transaction, transactionType, onSave, onClose }) => {
  const { customerLoading, refreshCustomers } = useCustomers();
  const { staffList, loading: staffLoading } = useStaff();
  const { accounts, refreshAccounts, setAccounts } = useAccounts();
  const { addTransaction, refreshTransactions, loading } = useTransactions();

  // If a transactionType was handed in (from the Deposit/Withdrawal quick
  // action buttons) the flow is locked to that type — no toggle shown.
  const isTypeLocked = !!transactionType && !transaction;

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
    transaction_type: (transaction?.transaction_type || transactionType || "deposit") as "deposit" | "withdrawal",
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
  const accent = isDeposit ? "var(--forest)" : "var(--clay)";
  const accentSoft = isDeposit ? "rgba(47,74,50,0.1)" : "var(--clay-soft)";
  const accentDeep = isDeposit ? "var(--forest-deep)" : "var(--clay)";

  const inputCls =
    "w-full px-3.5 py-2.5 border rounded-2xl text-[13px] bg-[var(--paper)] focus:bg-white focus:outline-none transition-all placeholder:text-[var(--ink-faint)]";

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[rgba(6,20,10,0.55)] backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="cd-root bg-[var(--card)] rounded-3xl w-full max-w-xl flex flex-col overflow-hidden shadow-[0_1px_2px_rgba(20,32,20,0.08),0_24px_48px_-16px_rgba(20,32,20,0.45)]" style={{ maxHeight: "92vh" }}>

        {/* ── Cover: dark passbook face ── */}
        <div className="cd-stitch relative overflow-hidden bg-[linear-gradient(145deg,#062e1b_0%,#0b4325_55%,#14532d_100%)] px-6 pt-5 pb-6 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.18)] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <p className="text-[10px] uppercase tracking-[0.18em] text-[rgba(255,255,255,0.5)]">
            {transaction ? "Edit transaction" : "New transaction"}
          </p>
          <h2 className="cd-display text-xl font-medium text-white mt-1">
            {transaction ? "Update transaction" : isDeposit ? "Record a deposit" : "Record a withdrawal"}
          </h2>

          {/* Locked-type badge, or the toggle when the type is editable */}
          {isTypeLocked ? (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[rgba(255,255,255,0.12)]">
              {isDeposit
                ? <ArrowUpCircle className="w-4 h-4 text-white" />
                : <ArrowDownCircle className="w-4 h-4 text-white" />}
              <span className="text-[12px] font-semibold text-white capitalize">{formData.transaction_type}</span>
            </div>
          ) : (
            <div className="mt-4 flex gap-2 p-1 bg-[rgba(255,255,255,0.1)] rounded-2xl max-w-xs">
              {(["deposit", "withdrawal"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, transaction_type: type, withdrawal_type: "" }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-all
                    ${formData.transaction_type === type ? "bg-white" : "text-[rgba(255,255,255,0.6)] hover:text-white"}`}
                  style={formData.transaction_type === type ? { color: type === "deposit" ? "var(--forest)" : "var(--clay)" } : undefined}
                >
                  {type === "deposit"
                    ? <ArrowUpCircle className="w-3.5 h-3.5" />
                    : <ArrowDownCircle className="w-3.5 h-3.5" />}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

          {/* ── Customer search ── */}
          <div>
            <Label>Customer</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-faint)] pointer-events-none" />
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
                className={`${inputCls} pl-10 pr-10`}
                style={{
                  borderColor: errors.account_id ? 'var(--clay)' : 'var(--paper-line)',
                }}
              />
              {selectedCustomer && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--forest)' }} />
              )}

              {showDropdown && customerSearch && (
                <div
                  ref={dropdownRef}
                  className="absolute z-20 w-full mt-1.5 bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl shadow-lg overflow-hidden"
                  style={{ maxHeight: 220, overflowY: "auto" }}
                >
                  {searchLoading ? (
                    <div className="py-4 text-center text-[13px] text-[var(--ink-faint)]">Searching…</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-[var(--paper)] cursor-pointer border-b border-dashed border-[var(--paper-line)] last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--brass-soft)] flex items-center justify-center text-[var(--forest-deep)] text-[11px] font-bold flex-shrink-0 cd-mono">
                            {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-[var(--ink)]">{c.name}</p>
                            <p className="text-[11px] text-[var(--ink-faint)]">{c.phone_number} · {c.account_number || "—"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="cd-mono text-[13px] font-semibold" style={{ color: 'var(--forest)' }}>
                            ¢{parseFloat(c.total_balance_across_all_accounts || "0").toLocaleString()}
                          </p>
                          <p className="text-[11px] text-[var(--ink-faint)]">{c.total_transactions} txns</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-[13px] text-[var(--ink-faint)]">No customers found</div>
                  )}
                </div>
              )}
            </div>
            <FieldError msg={errors.account_id} />

            {/* Selected customer chip */}
            {selectedCustomer && (
              <div className="mt-2.5 bg-[var(--paper)] border border-[var(--paper-line)] rounded-2xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 cd-mono" style={{ background: 'var(--brass-soft)', color: 'var(--forest-deep)' }}>
                    {selectedCustomer.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--ink)]">{selectedCustomer.name}</p>
                    <p className="text-[11px] text-[var(--ink-faint)]">{selectedCustomer.phone_number}
                      {selectedCustomer.area && ` · ${selectedCustomer.area}`}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="cd-mono text-[15px] font-bold" style={{ color: 'var(--forest)' }}>
                    ¢{fmt(parseFloat(selectedCustomer.total_balance_across_all_accounts || "0"), 0)}
                  </p>
                  <p className="text-[10px] text-[var(--ink-faint)]">{selectedCustomer.total_transactions} total txns</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Account selection ── */}
          {selectedCustomer && (
            <div>
              <Label>Account</Label>
              {loadingAccounts ? (
                <div className="flex items-center gap-3 py-5 text-[13px] text-[var(--ink-faint)]">
                  <svg className="w-5 h-5 animate-spin" style={{ color: 'var(--forest)' }} fill="none" viewBox="0 0 24 24">
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
                            ${restricted ? "opacity-40 cursor-not-allowed bg-[var(--paper)]" : "cursor-pointer"}`}
                          style={{
                            borderColor: selected ? accent : 'var(--paper-line)',
                            background: selected ? accentSoft : 'var(--card)',
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="text-[13px] font-semibold text-[var(--ink)] capitalize">
                                {account.account_type} account
                              </p>
                              <p className="cd-mono text-[11px] text-[var(--ink-faint)]">····{account.account_number.slice(-4)}</p>

                              {/* inline status chips on card row */}
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {account.status && account.status !== "Active" && (
                                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--brass-soft)', color: 'var(--forest-deep)' }}>
                                    {account.status}
                                  </span>
                                )}
                                {cardBad && (
                                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--clay-soft)', color: 'var(--clay)' }}>
                                    Card {account.card_status}
                                  </span>
                                )}
                                {pinLk && (
                                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--clay-soft)', color: 'var(--clay)' }}>
                                    PIN locked
                                  </span>
                                )}
                                {restricted && (
                                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-[var(--paper-line)] text-[var(--ink-faint)]">
                                    Restricted
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div className="text-right">
                              <p
                                className="cd-mono text-[14px] font-bold tabular-nums"
                                style={{ color: account.balance < 0 ? 'var(--clay)' : selected ? accentDeep : 'var(--ink)' }}
                              >
                                {account.balance < 0 ? "−" : ""}¢{fmt(Math.abs(account.balance), 0)}
                              </p>
                              <p className="text-[10px] text-[var(--ink-faint)]">Available</p>
                            </div>
                            {selected && (
                              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: accent }}>
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
                <div className="py-6 text-center text-[13px] text-[var(--ink-faint)] bg-[var(--paper)] rounded-2xl">
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
                    className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl border-2 transition-all"
                    style={{
                      borderColor: isSel ? accent : 'var(--paper-line)',
                      background: isSel ? accentSoft : 'var(--card)',
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: isSel ? accentDeep : 'var(--ink-faint)' }} />
                    <p className="text-[12px] font-semibold" style={{ color: isSel ? accentDeep : 'var(--ink)' }}>
                      {method.label}
                    </p>
                    <p className="text-[9.5px] text-[var(--ink-faint)] text-center">{method.desc}</p>
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
                    className="text-left px-4 py-3 rounded-2xl border-2 transition-all"
                    style={{
                      borderColor: formData.withdrawal_type === opt.value ? 'var(--clay)' : 'var(--paper-line)',
                      background: formData.withdrawal_type === opt.value ? 'var(--clay-soft)' : 'var(--card)',
                    }}
                  >
                    <p className="text-[13px] font-semibold" style={{ color: formData.withdrawal_type === opt.value ? 'var(--clay)' : 'var(--ink)' }}>
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-[var(--ink-faint)] mt-0.5">{opt.desc}</p>
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
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[var(--ink-faint)]">¢</span>
                <input
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={`${inputCls} pl-7 pr-3`}
                  style={{ borderColor: errors.amount ? 'var(--clay)' : 'var(--paper-line)' }}
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
                className={inputCls}
                style={{ borderColor: 'var(--paper-line)' }}
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
              className={`${inputCls} resize-none`}
              style={{ borderColor: errors.description ? 'var(--clay)' : 'var(--paper-line)' }}
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
        <div className="flex gap-2.5 px-6 py-4 border-t border-[var(--paper-line)] flex-shrink-0 bg-[var(--card)]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-[var(--paper-line)] rounded-2xl text-[13px] font-medium text-[var(--ink-soft)] hover:bg-[var(--paper)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] py-3 rounded-2xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-white"
            style={{ background: isDeposit ? 'var(--forest)' : '#062e1b' }}
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