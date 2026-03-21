import { useState, useEffect, useRef } from "react";
import {
  CreditCard, Search, User, Calendar, FileText,
  UserCheck, CheckCircle, X, Wallet, Building2,
  ArrowUpCircle, ArrowDownCircle, DollarSign, AlertCircle,
} from "lucide-react";
import { useCustomers } from "../../../contexts/dashboard/Customers";
import { useStaff } from "../../../contexts/dashboard/Staff";
import { useAccounts } from "../../../contexts/dashboard/Account";
import { useTransactions } from "../../../contexts/dashboard/Transactions";
import {
  companyId, userRole, userUUID,
} from "../../../constants/appConstants";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

interface TransactionModalProps {
  transaction?: Transaction | null;
  onSave: (transaction: any) => void;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCOUNT_ICONS: Record<string, React.ReactNode> = {
  savings: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  current: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  ),
};

const getAccountIcon = (type: string) =>
  ACCOUNT_ICONS[type.toLowerCase()] ?? <Building2 className="w-4 h-4" />;

// ─── Sub-components ───────────────────────────────────────────────────────────

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="flex items-center gap-1 text-[12px] text-red-500 mt-1">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {msg}
    </p>
  ) : null;

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <p className="text-[12px] font-medium text-gray-500 mb-1.5">
    {children}{required && <span className="text-red-400 ml-0.5">*</span>}
  </p>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">{children}</p>
);

// ─── Main Modal ───────────────────────────────────────────────────────────────

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

  const [formData, setFormData] = useState({
    account_id: transaction?.account_id || "",
    amount: transaction?.amount?.toString() || "",
    transaction_type: (transaction?.transaction_type || "deposit") as "deposit" | "withdrawal",
    withdrawal_type: "",
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

  const mobileBankers = staffList.filter(
    (s) => ["Mobile Banker", "mobile banker", "mobile_banker", "teller"].includes(s.role)
  );

  // ── Debounced customer search ──
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
      } catch { /* silent */ } finally {
        setSearchLoading(false);
      }
    }, 380);
    return () => clearTimeout(t);
  }, [customerSearch]);

  // ── Load accounts when customer changes ──
  useEffect(() => {
    if (!selectedCustomer) return;
    setLoadingAccounts(true);
    setAccounts([]);
    refreshAccounts(selectedCustomer.id).finally(() => setLoadingAccounts(false));
  }, [selectedCustomer]);

  // ── Auto-set staked_by from customer ──
  useEffect(() => {
    if (selectedCustomer?.registered_by) {
      setFormData((p) => ({ ...p, staked_by: selectedCustomer.registered_by! }));
    }
  }, [selectedCustomer]);

  // ── Close dropdown on outside click ──
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

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-xl flex flex-col"
        style={{ maxHeight: "90vh" }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-gray-900">
                {transaction ? "Edit transaction" : "New transaction"}
              </p>
              <p className="text-[12px] text-gray-400 mt-0.5">Fill in the details to record a transaction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

          {/* Customer search */}
          <div>
            <SectionTitle>Customer</SectionTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value) { setSelectedCustomer(null); setSelectedAccount(null); }
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

              {/* Dropdown */}
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
                          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 text-[11px] font-semibold flex-shrink-0">
                            {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-gray-900">{c.name}</p>
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
              <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white border border-emerald-200 flex items-center justify-center text-emerald-700 text-[12px] font-semibold flex-shrink-0">
                    {selectedCustomer.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">{selectedCustomer.name}</p>
                    <p className="text-[11px] text-gray-500">{selectedCustomer.phone_number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[16px] font-semibold text-emerald-600">
                    ¢{parseFloat(selectedCustomer.total_balance_across_all_accounts || "0").toLocaleString()}
                  </p>
                  <p className="text-[10px] text-emerald-500">Total balance</p>
                </div>
              </div>
            )}
          </div>

          {/* Account selection */}
          {selectedCustomer && (
            <div>
              <SectionTitle>Select account</SectionTitle>
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
                    return (
                      <div
                        key={account.id}
                        onClick={() => !restricted && selectAccount(account)}
                        className={`flex items-center justify-between px-4 py-3.5 border-2 rounded-2xl transition-all
                          ${restricted ? "opacity-40 cursor-not-allowed bg-gray-50" : "cursor-pointer"}
                          ${selected
                            ? "border-emerald-400 bg-emerald-50"
                            : "border-gray-100 hover:border-emerald-200 bg-white"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                            ${selected ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                            {getAccountIcon(account.account_type)}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-gray-900 capitalize">
                              {account.account_type} account
                            </p>
                            <p className="text-[11px] text-gray-400 font-mono">•••• {account.account_number}</p>
                            {restricted && <p className="text-[10px] text-red-400 mt-0.5">Not accessible</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="text-right">
                            <p className={`text-[14px] font-semibold ${selected ? "text-emerald-600" : "text-gray-900"}`}>
                              ¢{(account.balance || 0).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-gray-400">Available</p>
                          </div>
                          {selected && (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
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

          {/* Transaction type toggle */}
          <div>
            <SectionTitle>Transaction type</SectionTitle>
            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
              {(["deposit", "withdrawal"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFormData((p) => ({ ...p, transaction_type: type, withdrawal_type: "" }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium transition-all
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

          {/* Withdrawal type — required when withdrawal selected */}
          {isWithdrawal && (
            <div>
              <SectionTitle>Withdrawal type</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "advance", label: "Advance", desc: "Early payout against savings" },
                  { value: "commission", label: "Commission", desc: "Commission-based payout" },
                ].map((opt) => (
                  <button
                    key={opt.value}
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

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-gray-400">¢</span>
                <input
                  type="text"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
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

          {/* Description */}
          <div>
            <Label required>Description</Label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="e.g. Monthly contribution, emergency withdrawal…"
              className={`w-full px-4 py-2.5 border rounded-2xl text-[13px] bg-gray-50 focus:bg-white focus:outline-none resize-none transition-all
                ${errors.description
                  ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-50"
                  : "border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"}`}
            />
            <FieldError msg={errors.description} />
          </div>

          {/* Mobile Banker */}
          <div>
            <Label required>Recorded by (Mobile Banker)</Label>
            <select
              name="staked_by"
              value={formData.staked_by}
              onChange={handleChange}
              disabled={staffLoading}
              className={`w-full px-4 py-2.5 border rounded-2xl text-[13px] bg-gray-50 focus:bg-white focus:outline-none transition-all appearance-none
                ${errors.staked_by
                  ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-50"
                  : "border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"}`}
            >
              <option value="">Select mobile banker…</option>
              {selectedCustomer?.registered_by && (
                <option value={selectedCustomer.registered_by}>
                  {selectedCustomer.registered_by_name} (assigned)
                </option>
              )}
              {mobileBankers
                .filter((b) => b.id !== selectedCustomer?.registered_by)
                .map((b) => (
                  <option key={b.staff_id} value={b.id}>
                    {b.full_name} · {b.staff_id}
                  </option>
                ))}
            </select>
            <FieldError msg={errors.staked_by} />
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="flex gap-2.5 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 rounded-2xl text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-[13px] font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
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
                <CheckCircle className="w-4 h-4" />
                {transaction ? "Update transaction" : "Add transaction"}
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
