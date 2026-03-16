import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  ChevronDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Hash,
  DollarSign,
  FileText,
  Send,
  RotateCcw,
  User,
} from "lucide-react";
import { useTransactions } from "../../../contexts/dashboard/Transactions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  customer_id?: string;
  name: string;
  phone_number: string;
  email?: string;
  account_number?: string;
  registered_by?: string;
  registered_by_name?: string;
  total_balance_across_all_accounts?: string;
  total_transactions?: string;
}

interface Account {
  id: string;
  account_number: string;
  account_type: string;
  balance: number;
  status?: string;
}

type TransactionType = "deposit" | "withdrawal";
type RowStatus = "idle" | "searching" | "ready" | "submitting" | "success" | "error";

interface BulkRow {
  _rowId: string; // internal stable key
  // customer
  customerSearch: string;
  customerResults: Customer[];
  showCustomerDropdown: boolean;
  selectedCustomer: Customer | null;
  // account
  accounts: Account[];
  accountsLoading: boolean;
  selectedAccount: Account | null;
  // transaction fields
  transaction_type: TransactionType;
  amount: string;
  description: string;
  // meta
  status: RowStatus;
  errorMessage: string;
  successMessage: string;
}

interface BulkTransactionModalProps {
  onClose: () => void;
  companyId: string;
  userUUID: string;
  userRole?: string;
  /** Called after all rows successfully submit, with summary data */
  onComplete?: (results: SubmitResult[]) => void;
}

interface SubmitResult {
  rowIndex: number;
  customerName: string;
  accountNumber: string;
  amount: number;
  transaction_type: TransactionType;
  description: string;
  success: boolean;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const makeEmptyRow = (): BulkRow => ({
  _rowId: uid(),
  customerSearch: "",
  customerResults: [],
  showCustomerDropdown: false,
  selectedCustomer: null,
  accounts: [],
  accountsLoading: false,
  selectedAccount: null,
  transaction_type: "deposit",
  amount: "",
  description: "",
  status: "idle",
  errorMessage: "",
  successMessage: "",
});

// ─── API helpers (swap BASE_URL / endpoints to match your backend) ─────────────

const BASE_URL = "http://localhost:5000/api";

async function searchCustomers(companyId: string, query: string): Promise<Customer[]> {
  const res = await fetch(`${BASE_URL}/customers/${companyId}/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Customer search failed");
  const data = await res.json();
  console.log(`Customer data ${data}`)
  return data.data ?? [];
}

async function fetchAccountsForCustomer(customerId: string): Promise<Account[]> {
  const res = await fetch(`${BASE_URL}/accounts/customer/${customerId}`);
  if (!res.ok) throw new Error("Failed to load accounts");
  const data = await res.json();
  return data.data ?? [];
}

async function postTransaction(payload: object): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${BASE_URL}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) return { success: false, message: data.message ?? "Transaction failed" };
  return { success: true };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const StatusBadge = ({ status, message }: { status: RowStatus; message?: string }) => {
  const map: Record<RowStatus, { icon: React.ReactNode; color: string; label: string }> = {
    idle: { icon: null, color: "text-gray-400", label: "" },
    searching: { icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, color: "text-blue-500", label: "Searching…" },
    ready: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-emerald-500", label: "Ready" },
    submitting: { icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, color: "text-amber-500", label: "Submitting…" },
    success: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-emerald-600", label: message ?? "Done" },
    error: { icon: <AlertCircle className="w-3.5 h-3.5" />, color: "text-red-500", label: message ?? "Error" },
  };
  const { icon, color, label } = map[status];
  if (!icon && !label) return null;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${color} whitespace-nowrap`}>
      {icon} {label}
    </span>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function BulkTransactionModal({
  onClose,
  companyId,
  userUUID,
  userRole = "admin",
  onComplete,
}: BulkTransactionModalProps) {
  const [rows, setRows] = useState<BulkRow[]>([makeEmptyRow(), makeEmptyRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);
  const [results, setResults] = useState<SubmitResult[]>([]);
  const { addBulkTransactions } = useTransactions();

  // Debounce timers per row
  const searchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── Row mutation helper ──────────────────────────────────────────────────────
  const updateRow = useCallback((rowId: string, patch: Partial<BulkRow>) => {
    setRows((prev) => prev.map((r) => (r._rowId === rowId ? { ...r, ...patch } : r)));
  }, []);

  const addRow = () => setRows((prev) => [...prev, makeEmptyRow()]);

  const removeRow = (rowId: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r._rowId !== rowId) : prev));

  const resetRow = (rowId: string) =>
    setRows((prev) => prev.map((r) => (r._rowId === rowId ? { ...makeEmptyRow(), _rowId: rowId } : r)));

  // ── Customer search ──────────────────────────────────────────────────────────
  const handleCustomerSearch = (rowId: string, value: string) => {
    updateRow(rowId, {
      customerSearch: value,
      showCustomerDropdown: true,
      selectedCustomer: null,
      selectedAccount: null,
      accounts: [],
    });

    clearTimeout(searchTimers.current[rowId]);
    if (!value.trim()) {
      updateRow(rowId, { customerResults: [], status: "idle" });
      return;
    }
    updateRow(rowId, { status: "searching" });
    searchTimers.current[rowId] = setTimeout(async () => {
      try {
        const results = await searchCustomers(companyId, value);
        updateRow(rowId, { customerResults: results, status: "idle" });
      } catch {
        updateRow(rowId, { customerResults: [], status: "idle" });
      }
    }, 400);
  };

  const selectCustomer = async (rowId: string, customer: Customer) => {
    updateRow(rowId, {
      selectedCustomer: customer,
      customerSearch: customer.name,
      showCustomerDropdown: false,
      customerResults: [],
      accountsLoading: true,
      accounts: [],
      selectedAccount: null,
    });
    try {
      const accs = await fetchAccountsForCustomer(customer.customer_id ?? customer.id);
      updateRow(rowId, { accounts: accs, accountsLoading: false });
    } catch {
      updateRow(rowId, { accountsLoading: false });
    }
  };

  const selectAccount = (rowId: string, account: Account) => {
    updateRow(rowId, { selectedAccount: account });
    recomputeReady(rowId, account);
  };

  // ── Field change ──────────────────────────────────────────────────────────────
  const handleField = (rowId: string, field: keyof BulkRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r._rowId !== rowId) return r;
        const updated = { ...r, [field]: value };
        return updated;
      })
    );
  };

  const recomputeReady = (rowId: string, account?: Account | null) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r._rowId !== rowId) return r;
        const acc = account !== undefined ? account : r.selectedAccount;
        const isReady = !!r.selectedCustomer && !!acc && !!r.amount && parseFloat(r.amount) > 0;
        return { ...r, status: isReady ? "ready" : r.status };
      })
    );
  };

  // Recompute ready whenever amount or description changes
  useEffect(() => {
    rows.forEach((r) => {
      if (r.status !== "success" && r.status !== "submitting") {
        const isReady =
          !!r.selectedCustomer && !!r.selectedAccount && !!r.amount && parseFloat(r.amount) > 0;
        if (isReady && r.status !== "ready") updateRow(r._rowId, { status: "ready" });
        if (!isReady && r.status === "ready") updateRow(r._rowId, { status: "idle" });
      }
    });
  }, [rows.map((r) => r.amount + r.selectedAccount?.id).join(",")]);

  // ── Validation per row ────────────────────────────────────────────────────────
  const validateRow = (row: BulkRow): string | null => {
    if (!row.selectedCustomer) return "Select a customer";
    if (!row.selectedAccount) return "Select an account";
    if (!row.amount || parseFloat(row.amount) <= 0) return "Enter a valid amount";
    return null;
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
 const handleSubmitAll = async () => {
  // 1. Filter out already-successful rows
  const pendingRows = rows.filter((r) => r.status !== "success");

  // 2. Validate — mark errors and bail early
  const validationErrors = pendingRows.map((r) => ({
    rowId: r._rowId,
    error: validateRow(r),
  }));

  if (validationErrors.some((e) => e.error)) {
    validationErrors.forEach(({ rowId, error }) => {
      if (error) updateRow(rowId, { status: "error", errorMessage: error });
    });
    return;
  }

  setIsSubmitting(true);

  // 3. Shape rows for the context function
  const bulkRows = pendingRows.map((row) => ({
    payload: {
      account_id: row.selectedAccount!.id,
      amount: parseFloat(row.amount),
      transaction_type: row.transaction_type,
      description: row.description || `Bulk ${row.transaction_type}`,
      transaction_date: new Date().toISOString(),
      staked_by: row.selectedCustomer!.registered_by ?? userUUID,
      company_id: companyId,
      staff_id: userUUID,
      unique_code: "",
    },
    account: row.selectedAccount!,
    customer: row.selectedCustomer!,
  }));

  // 4. Submit
  const response = await addBulkTransactions(bulkRows);

  // 5. Map results back to row statuses
  response.results.forEach(({ index, status, message }) => {
    updateRow(pendingRows[index]._rowId, {
      status: status === "success" ? "success" : "error",
      errorMessage: message ?? "",
    });
  });

  // 6. Build SubmitResult[] for the onComplete callback
  const allResults: SubmitResult[] = response.results.map(({ index, status, message }) => ({
    rowIndex: index,
    customerName: pendingRows[index].selectedCustomer!.name,
    accountNumber: pendingRows[index].selectedAccount!.account_number,
    amount: parseFloat(pendingRows[index].amount),
    transaction_type: pendingRows[index].transaction_type,
    description: pendingRows[index].description || `Bulk ${pendingRows[index].transaction_type}`,
    success: status === "success",
    error: status === "failed" ? message : undefined,
  }));

  setResults(allResults);
  if (allResults.every((r) => r.success)) setSubmitDone(true);
  if (onComplete) onComplete(allResults);

  setIsSubmitting(false);
};

  const readyCount = rows.filter((r) => r.status === "ready" || r.status === "success").length;
  const successCount = rows.filter((r) => r.status === "success").length;
  const errorCount = rows.filter((r) => r.status === "error").length;
  const canSubmit = rows.some((r) => r.status === "ready") && !isSubmitting;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col w-full"
        style={{ maxWidth: 980, maxHeight: "92vh" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Upload className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 leading-tight">Bulk Transactions</h2>
              <p className="text-xs text-gray-400">{rows.length} row{rows.length !== 1 ? "s" : ""} · {successCount} done{errorCount > 0 ? ` · ${errorCount} failed` : ""}</p>
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex items-center gap-2 mr-4">
            {successCount > 0 && (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                {successCount} success
              </span>
            )}
            {errorCount > 0 && (
              <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                {errorCount} failed
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Column headers ── */}
        <div
          className="grid gap-2 px-6 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-400"
          style={{ gridTemplateColumns: "22px 2fr 1.4fr 80px 140px 180px 80px" }}
        >
          <span>#</span>
          <span className="flex items-center gap-1"><User className="w-3 h-3" /> Customer & Account</span>
          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Amount</span>
          <span>Type</span>
          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Description</span>
          <span>Status</span>
          <span />
        </div>

        {/* ── Rows ── */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 px-6">
          {rows.map((row, idx) => (
            <BulkRow
              key={row._rowId}
              row={row}
              index={idx}
              userRole={userRole}
              onCustomerSearch={(v) => handleCustomerSearch(row._rowId, v)}
              onSelectCustomer={(c) => selectCustomer(row._rowId, c)}
              onSelectAccount={(a) => selectAccount(row._rowId, a)}
              onField={(field, value) => handleField(row._rowId, field, value)}
              onRemove={() => removeRow(row._rowId)}
              onReset={() => resetRow(row._rowId)}
            />
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50 rounded-b-2xl">
          <button
            onClick={addRow}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors disabled:opacity-40"
          >
            <Plus className="w-4 h-4" /> Add Row
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitAll}
              disabled={!canSubmit}
              className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              ) : (
                <><Send className="w-4 h-4" /> Submit {canSubmit ? readyCount : ""} Transaction{readyCount !== 1 ? "s" : ""}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BulkRow sub-component ─────────────────────────────────────────────────────

interface BulkRowProps {
  row: BulkRow;
  index: number;
  userRole: string;
  onCustomerSearch: (v: string) => void;
  onSelectCustomer: (c: Customer) => void;
  onSelectAccount: (a: Account) => void;
  onField: (field: keyof BulkRow, value: string) => void;
  onRemove: () => void;
  onReset: () => void;
}

function BulkRow({
  row,
  index,
  userRole,
  onCustomerSearch,
  onSelectCustomer,
  onSelectAccount,
  onField,
  onRemove,
  onReset,
}: BulkRowProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isDone = row.status === "success";
  const isError = row.status === "error";

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        // noop – parent controls via updateRow
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const rowBg = isDone
    ? "bg-emerald-50/60"
    : isError
    ? "bg-red-50/40"
    : "bg-white";

  return (
    <div
      ref={wrapperRef}
      className={`grid gap-2 py-3 items-start transition-colors ${rowBg}`}
      style={{ gridTemplateColumns: "22px 2fr 1.4fr 80px 140px 180px 80px" }}
    >
      {/* # */}
      <span className="text-xs text-gray-400 font-mono pt-2.5">{index + 1}</span>

      {/* Customer + Account */}
      <div className="flex flex-col gap-1.5 relative">
        {/* Customer search input */}
        <div className="relative">
          <input
            type="text"
            value={row.customerSearch}
            onChange={(e) => onCustomerSearch(e.target.value)}
            onFocus={() => onField("showCustomerDropdown" as any, "true")}
            disabled={isDone}
            placeholder="Search customer…"
            className={`w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:bg-gray-50 disabled:text-gray-400 transition
              ${isError && !row.selectedCustomer ? "border-red-300" : "border-gray-200"}
            `}
          />
          {row.status === "searching" ? (
            <Loader2 className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-gray-400 animate-spin" />
          ) : (
            <Search className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-gray-300" />
          )}

          {/* Dropdown */}
          {row.showCustomerDropdown && row.customerResults.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
              {row.customerResults.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelectCustomer(c)}
                  className="px-3 py-2.5 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{c.name}</div>
                      <div className="text-xs text-gray-400">{c.phone_number} · {c.account_number ?? "—"}</div>
                    </div>
                    <div className="text-xs text-emerald-600 font-medium">
                      ¢{parseFloat(c.total_balance_across_all_accounts ?? "0").toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account selector */}
        {row.selectedCustomer && (
          <div>
            {row.accountsLoading ? (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 px-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading accounts…
              </div>
            ) : row.accounts.length > 0 ? (
              <select
                value={row.selectedAccount?.id ?? ""}
                onChange={(e) => {
                  const acc = row.accounts.find((a) => a.id === e.target.value);
                  if (acc) onSelectAccount(acc);
                }}
                disabled={isDone}
                className={`w-full pl-3 pr-8 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:bg-gray-50 bg-white appearance-none
                  ${isError && !row.selectedAccount ? "border-red-300" : "border-gray-200"}
                `}
              >
                <option value="">— Select account —</option>
                {row.accounts.map((acc) => {
                  const restricted = userRole === "teller" && acc.account_type.toLowerCase() === "normal";
                  return (
                    <option key={acc.id} value={acc.id} disabled={restricted || acc.status === "Inactive"}>
                      {acc.account_number} · {acc.account_type} · ¢{acc.balance?.toLocaleString()}
                      {restricted ? " (restricted)" : acc.status === "Inactive" ? " (inactive)" : ""}
                    </option>
                  );
                })}
              </select>
            ) : (
              <span className="text-xs text-gray-400 px-1">No accounts found</span>
            )}
          </div>
        )}

        {/* Selected customer chip */}
        {row.selectedCustomer && (
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
            <span className="text-xs text-emerald-700 font-medium truncate">{row.selectedCustomer.name}</span>
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="relative">
        <span className="absolute left-2.5 top-2.5 text-xs text-gray-400">¢</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={row.amount}
          onChange={(e) => onField("amount", e.target.value)}
          disabled={isDone}
          placeholder="0.00"
          className={`w-full pl-6 pr-2 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:bg-gray-50 transition
            ${isError && (!row.amount || parseFloat(row.amount) <= 0) ? "border-red-300" : "border-gray-200"}
          `}
        />
      </div>

      {/* Transaction type */}
      <div>
        <select
          value={row.transaction_type}
          onChange={(e) => onField("transaction_type", e.target.value)}
          disabled={isDone}
          className="w-full px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:bg-gray-50 bg-white"
        >
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
        </select>
        {/* Visual indicator */}
        <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${row.transaction_type === "deposit" ? "text-emerald-600" : "text-amber-600"}`}>
          {row.transaction_type === "deposit"
            ? <ArrowDownCircle className="w-3 h-3" />
            : <ArrowUpCircle className="w-3 h-3" />}
          {row.transaction_type === "deposit" ? "In" : "Out"}
        </div>
      </div>

      {/* Description */}
      <input
        type="text"
        value={row.description}
        onChange={(e) => onField("description", e.target.value)}
        disabled={isDone}
        placeholder="Description"
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:bg-gray-50 transition"
      />

      {/* Status */}
      <div className="pt-2">
        <StatusBadge
          status={row.status}
          message={row.status === "error" ? row.errorMessage : row.successMessage}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 pt-1.5">
        {isError && (
          <button
            onClick={onReset}
            title="Reset row"
            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
        {!isDone && (
          <button
            onClick={onRemove}
            title="Remove row"
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}