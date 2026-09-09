import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import {
  Plus, Trash2, Search, CheckCircle2, ArrowUpCircle, ArrowDownCircle,
  Copy, RotateCcw, Keyboard, Loader2, X,
} from "lucide-react";
import { companyId, companyName, userUUID } from "../../../constants/appConstants";
import { useStaff } from "../../../contexts/dashboard/Staff";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  customer_id?: string;
  name: string;
  phone_number: string;
  account_number?: string;
}

interface Account {
  id: string;
  account_number: string;
  account_type: string;
  balance: number;
  status?: string;
}

type TxType = "deposit" | "withdrawal";

interface SheetRow {
  _rowId: string;
  customerSearch: string;
  customerResults: Customer[];
  showDropdown: boolean;
  searching: boolean;
  selectedCustomer: Customer | null;
  accounts: Account[];
  selectedAccount: Account | null;
  amount: string;
  transaction_type: TxType;
  description: string;
}

// Column order drives keyboard navigation. "account" is skipped
// automatically (tabIndex -1) whenever a row's customer has 0 or 1
// accounts, since there's nothing to choose.
const COLUMNS = ["search", "account", "amount", "type", "description"] as const;
type Column = (typeof COLUMNS)[number];

const uid = () => Math.random().toString(36).slice(2, 9);

const makeEmptyRow = (): SheetRow => ({
  _rowId: uid(),
  customerSearch: "",
  customerResults: [],
  showDropdown: false,
  searching: false,
  selectedCustomer: null,
  accounts: [],
  selectedAccount: null,
  amount: "",
  transaction_type: "deposit",
  description: "",
});

const BASE_URL = "https://susu-pro-backend.onrender.com/api";


async function searchCustomers(query: string): Promise<Customer[]> {
  const res = await fetch(`${BASE_URL}/customers/${companyId}/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ?? [];
}

async function fetchAccounts(customerId: string): Promise<Account[]> {
  const res = await fetch(`${BASE_URL}/accounts/customer/${customerId}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ?? [];
}

// ─────────────────────────────────────────────────────────────

interface FieldEntrySheetProps {
  /** Pass this when the sheet is opened from Quick Actions as an
   *  overlay — renders a close (X) button up top. Omit it when the
   *  sheet lives on its own route/page. */
  onClose?: () => void;
}

export default function FieldEntrySheet({ onClose }: FieldEntrySheetProps) {
  const { staffList } = useStaff();
  const mobileBankers = staffList.filter((s) =>
    ["Mobile Banker", "mobile banker", "mobile_banker", "teller"].includes(s.role)
  );

  console.log(mobileBankers);

  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mobileBankerId, setMobileBankerId] = useState("");
  const [rows, setRows] = useState<SheetRow[]>([makeEmptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});

  const searchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // cellRefs[rowIndex][column] -> focusable element
  const cellRefs = useRef<Record<string, Partial<Record<Column, HTMLElement | null>>>>({});

  const updateRow = useCallback((rowId: string, patch: Partial<SheetRow>) => {
    setRows((prev) => prev.map((r) => (r._rowId === rowId ? { ...r, ...patch } : r)));
  }, []);

  // ── Auto-add a fresh row once the last row starts getting used ──
  useEffect(() => {
    const last = rows[rows.length - 1];
    const lastIsStarted = last.selectedCustomer || last.amount || last.description;
    if (lastIsStarted) setRows((prev) => [...prev, makeEmptyRow()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows[rows.length - 1]?.selectedCustomer, rows[rows.length - 1]?.amount]);

  // ── Customer search ──────────────────────────────────────────
  const handleSearch = (rowId: string, value: string) => {
    updateRow(rowId, { customerSearch: value, showDropdown: true, selectedCustomer: null, accounts: [], selectedAccount: null });
    clearTimeout(searchTimers.current[rowId]);
    if (!value.trim()) { updateRow(rowId, { customerResults: [], searching: false }); return; }
    updateRow(rowId, { searching: true });
    searchTimers.current[rowId] = setTimeout(async () => {
      const results = await searchCustomers(value);
      updateRow(rowId, { customerResults: results, searching: false });
    }, 300);
  };

  const selectCustomer = async (rowId: string, customer: Customer) => {
    updateRow(rowId, {
      selectedCustomer: customer, customerSearch: customer.name,
      showDropdown: false, customerResults: [], accounts: [], selectedAccount: null,
    });
    const accs = await fetchAccounts(customer.customer_id ?? customer.id);
    updateRow(rowId, { accounts: accs, selectedAccount: accs.length === 1 ? accs[0] : null });
    // Move focus onward: straight to amount if there's exactly one
    // account (nothing to pick), otherwise to the account selector.
    const nextCol: Column = accs.length > 1 ? "account" : "amount";
    focusCell(rowId, nextCol);
  };

  const addRow = () => setRows((prev) => [...prev, makeEmptyRow()]);
  const removeRow = (rowId: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r._rowId !== rowId) : prev));

  // ── Totals ───────────────────────────────────────────────────
  const activeRows = rows.filter((r) => r.selectedAccount && r.amount && parseFloat(r.amount) > 0);
  const totalDeposits = activeRows
    .filter((r) => r.transaction_type === "deposit")
    .reduce((s, r) => s + parseFloat(r.amount), 0);
  const totalWithdrawals = activeRows
    .filter((r) => r.transaction_type === "withdrawal")
    .reduce((s, r) => s + parseFloat(r.amount), 0);

  // ── Keyboard navigation ──────────────────────────────────────
  function focusCell(rowId: string, col: Column) {
    // Wait a tick for conditional cells (account picker) to mount.
    requestAnimationFrame(() => cellRefs.current[rowId]?.[col]?.focus());
  }

  const rowIds = rows.map((r) => r._rowId);

  function visibleColumns(row: SheetRow): Column[] {
    return COLUMNS.filter((c) => c !== "account" || row.accounts.length > 1);
  }

  function moveTo(rowIndex: number, col: Column) {
    const row = rows[rowIndex];
    if (!row) return;
    focusCell(row._rowId, col);
  }

  function handleKeyDown(e: KeyboardEvent, rowIndex: number, col: Column) {
    const row = rows[rowIndex];
    const cols = visibleColumns(row);
    const colIdx = cols.indexOf(col);

    // Submit the whole sheet from anywhere.
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
      return;
    }

    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const el = e.currentTarget as HTMLInputElement;
      const atEnd = el.selectionStart === el.value.length;
      const atStart = el.selectionStart === 0;
      const isTextInput = el.tagName === "INPUT" && (el as HTMLInputElement).type !== "button";
      if (isTextInput && !((e.key === "ArrowRight" && atEnd) || (e.key === "ArrowLeft" && atStart))) {
        return; // let the caret move normally inside the text
      }
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const nextIdx = colIdx + dir;
      if (nextIdx >= 0 && nextIdx < cols.length) moveTo(rowIndex, cols[nextIdx]);
      else if (dir === 1 && rowIndex < rows.length - 1) moveTo(rowIndex + 1, visibleColumns(rows[rowIndex + 1])[0]);
      else if (dir === -1 && rowIndex > 0) {
        const prevCols = visibleColumns(rows[rowIndex - 1]);
        moveTo(rowIndex - 1, prevCols[prevCols.length - 1]);
      }
      return;
    }

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const dir = e.key === "ArrowDown" ? 1 : -1;
      const targetRow = rowIndex + dir;
      if (targetRow >= 0 && targetRow < rows.length) {
        const targetCols = visibleColumns(rows[targetRow]);
        moveTo(targetRow, targetCols.includes(col) ? col : targetCols[0]);
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (colIdx < cols.length - 1) {
        moveTo(rowIndex, cols[colIdx + 1]);
      } else if (rowIndex === rows.length - 1) {
        // Last field of last row — a new row already auto-appends
        // once this row has data, so just hop to it.
        setTimeout(() => moveTo(rowIndex + 1, "search"), 0);
      } else {
        moveTo(rowIndex + 1, visibleColumns(rows[rowIndex + 1])[0]);
      }
      return;
    }
  }

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!mobileBankerId) return toast.error("Select the mobile banker this sheet is for");
    if (activeRows.length === 0) return toast.error("Add at least one row");

    setSubmitting(true);
    setRowErrors({});
    const toastId = toast.loading(`Submitting sheet (${activeRows.length} rows)…`);

    const payload = {
    company_id: companyId,
    entry_date: entryDate,
    mobile_banker_staff_id: mobileBankerId,
    entered_by_staff_id: userUUID,

    rows: activeRows.map((r) => {
      const account = r.selectedAccount!;
      const amount = parseFloat(r.amount);
      const formattedAmount = amount.toFixed(2);

      const transactionType = r.transaction_type;
      const userProvidedDescription = r.description?.trim();

      let generatedDescription = "";

      if (transactionType === "deposit") {
        generatedDescription =
          `CASH DEPOSIT OF GHS ${formattedAmount} INTO ` +
          `${account.account_type.toUpperCase()} ACCOUNT (${account.account_number})`;
      }

      if (transactionType === "withdrawal") {
        generatedDescription =
          `CASH WITHDRAWAL OF GHS ${formattedAmount} FROM ` +
          `${account.account_type.toUpperCase()} ACCOUNT (${account.account_number})`;
      }

      // Add staff name if available
      if (companyName?.trim()) {
        generatedDescription += ` PROCESSED BY ${companyName.toUpperCase()}`;
      }

      // Append user's original description professionally
      if (userProvidedDescription) {
        generatedDescription += `. REMARKS: ${userProvidedDescription}`;
      }

      // Final punctuation
      generatedDescription += ".";

      return {
        account_id: account.id,
        amount,
        transaction_type: transactionType,
        description: generatedDescription,
        withdrawal_type:
          transactionType === "withdrawal" ? "advance" : undefined,
      };
    }),
  };
  
    try {
      const res = await fetch(`${BASE_URL}/entry-batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.rowErrors) {
          const errMap: Record<number, string> = {};
          data.rowErrors.forEach((e: any) => { errMap[e.index] = e.error; });
          setRowErrors(errMap);
        }
        toast.error(data.message || "Sheet failed validation", { id: toastId });
        return;
      }
      toast.success("Sheet submitted — pending approval", { id: toastId });
      setSuccessCode(data.data.batch_code);
    } catch {
      toast.error("Network error submitting sheet", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const startNewSheet = () => {
    setSuccessCode(null);
    setRows([makeEmptyRow()]);
    setRowErrors({});
  };

  // ── Success screen ──────────────────────────────────────────
  if (successCode) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center bg-[var(--card)] border border-[var(--paper-line)] rounded-3xl p-10 relative">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--paper)]">
            <X className="w-4 h-4 text-[var(--ink-faint)]" />
          </button>
        )}
        <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--forest)" }} />
        <p className="text-[13px] text-[var(--ink-faint)] mb-2">Sheet submitted — pending approval</p>
        <p className="cd-mono text-[28px] font-bold tracking-wider" style={{ color: "var(--forest-deep)" }}>{successCode}</p>
        <p className="text-[12px] text-[var(--ink-faint)] mt-2 mb-6">Write the code on the paper sheet</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => { navigator.clipboard.writeText(successCode); toast.success("Code copied"); }}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border border-[var(--paper-line)] rounded-xl hover:bg-[var(--paper)]"
          >
            <Copy className="w-3.5 h-3.5" /> Copy code
          </button>
          <button
            onClick={startNewSheet}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white rounded-xl"
            style={{ background: "var(--forest)" }}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Start next sheet
          </button>
        </div>
      </div>
    );
  }

  // ── Grid ─────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Sheet header: date + mobile banker, both apply to every row */}
      <div className="flex flex-wrap items-end gap-4 mb-5 bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl px-5 py-4">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-faint)] block mb-1">Sheet date</label>
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="px-3 py-2 border border-[var(--paper-line)] rounded-xl text-[13px] bg-[var(--paper)]"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-faint)] block mb-1">Mobile banker (this sheet is for)</label>
          <select
            value={mobileBankerId}
            onChange={(e) => setMobileBankerId(e.target.value)}
            className="px-3 py-2 border border-[var(--paper-line)] rounded-xl text-[13px] bg-[var(--paper)] min-w-[220px]"
          >
            <option value="">— Select mobile banker —</option>
            {mobileBankers.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-4 text-[12px]">
          {/* <div className="flex items-center gap-1.5 text-[var(--ink-faint)]">
            <Keyboard className="w-3.5 h-3.5" />
            Tab/arrows to move · Enter for next · Ctrl+Enter to submit
          </div> */}
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-[var(--ink-faint)]">Deposits</p>
            <p className="cd-mono font-bold" style={{ color: "var(--forest)" }}>¢{totalDeposits.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-[var(--ink-faint)]">Withdrawals</p>
            <p className="cd-mono font-bold" style={{ color: "var(--clay)" }}>¢{totalWithdrawals.toLocaleString()}</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--paper)]">
              <X className="w-4 h-4 text-[var(--ink-faint)]" />
            </button>
          )}
        </div>
      </div>

      {/* Column headers */}
      <div
        className="grid gap-2 px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]"
        style={{ gridTemplateColumns: "24px 2.2fr 1.4fr 1fr 90px 1.6fr 32px" }}
      >
        <span>#</span><span>Customer</span><span>Account</span><span>Amount</span><span>Type</span><span>Description</span><span />
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-1.5">
        {rows.map((row, rowIndex) => {
          const err = rowErrors[rowIndex];
          if (!cellRefs.current[row._rowId]) cellRefs.current[row._rowId] = {};

          return (
            <div
              key={row._rowId}
              className="grid gap-2 px-3 py-2 items-start rounded-xl bg-[var(--card)] border"
              style={{
                gridTemplateColumns: "24px 2.2fr 1.4fr 1fr 90px 1.6fr 32px",
                borderColor: err ? "var(--clay)" : "var(--paper-line)",
              }}
            >
              <span className="text-[11px] cd-mono text-[var(--ink-faint)] pt-2">{rowIndex + 1}</span>

              {/* Customer search */}
              <div className="relative">
                <input
                  ref={(el) => { cellRefs.current[row._rowId].search = el; }}
                  value={row.customerSearch}
                  onChange={(e) => handleSearch(row._rowId, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, rowIndex, "search")}
                  placeholder="Name or account number…"
                  className="w-full px-2.5 py-1.5 text-[13px] border border-[var(--paper-line)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--forest)] bg-[var(--paper)] focus:bg-white"
                />
                {row.searching
                  ? <Loader2 className="absolute right-2 top-2 w-3.5 h-3.5 animate-spin text-[var(--ink-faint)]" />
                  : <Search className="absolute right-2 top-2 w-3.5 h-3.5 text-[var(--ink-faint)]" />}

                {row.showDropdown && row.customerResults.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-[var(--paper-line)] rounded-xl shadow-lg max-h-56 overflow-y-auto">
                    {row.customerResults.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => selectCustomer(row._rowId, c)}
                        className="px-3 py-2 hover:bg-[var(--paper)] cursor-pointer border-b border-dashed border-[var(--paper-line)] last:border-0"
                      >
                        <p className="text-[12.5px] font-semibold text-[var(--ink)]">{c.name}</p>
                        <p className="text-[11px] text-[var(--ink-faint)]">{c.phone_number} · {c.account_number ?? "—"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Account */}
              <div>
                {row.accounts.length > 1 ? (
                  <select
                    ref={(el) => { cellRefs.current[row._rowId].account = el; }}
                    value={row.selectedAccount?.id ?? ""}
                    onChange={(e) => {
                      const acc = row.accounts.find((a) => a.id === e.target.value) || null;
                      updateRow(row._rowId, { selectedAccount: acc });
                    }}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, "account")}
                    className="w-full px-2 py-1.5 text-[12px] border border-[var(--paper-line)] rounded-lg bg-[var(--paper)]"
                  >
                    <option value="">— pick —</option>
                    {row.accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.account_type} ····{a.account_number.slice(-4)}</option>
                    ))}
                  </select>
                ) : row.selectedAccount ? (
                  <p className="text-[11.5px] text-[var(--ink-faint)] pt-2 cd-mono">····{row.selectedAccount.account_number.slice(-4)}</p>
                ) : (
                  <p className="text-[11.5px] text-[var(--ink-faint)] pt-2">—</p>
                )}
              </div>

              {/* Amount */}
              <div className="relative">
                <span className="absolute left-2 top-1.5 text-[12px] font-bold text-[var(--ink-faint)]">¢</span>
                <input
                  ref={(el) => { cellRefs.current[row._rowId].amount = el; }}
                  value={row.amount}
                  onChange={(e) => updateRow(row._rowId, { amount: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, rowIndex, "amount")}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="w-full pl-5 pr-2 py-1.5 text-[13px] border border-[var(--paper-line)] rounded-lg bg-[var(--paper)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--forest)]"
                />
              </div>

              {/* Type toggle — press D or W, or click */}
              <button
                ref={(el) => { cellRefs.current[row._rowId].type = el; }}
                type="button"
                onKeyDown={(e) => {
                  if (e.key.toLowerCase() === "d") updateRow(row._rowId, { transaction_type: "deposit" });
                  if (e.key.toLowerCase() === "w") updateRow(row._rowId, { transaction_type: "withdrawal" });
                  handleKeyDown(e, rowIndex, "type");
                }}
                onClick={() => updateRow(row._rowId, {
                  transaction_type: row.transaction_type === "deposit" ? "withdrawal" : "deposit",
                })}
                className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11.5px] font-semibold"
                style={{
                  background: row.transaction_type === "deposit" ? "rgba(47,74,50,0.1)" : "var(--clay-soft)",
                  color: row.transaction_type === "deposit" ? "var(--forest)" : "var(--clay)",
                }}
                title="Press D / W to switch, or Enter/arrows to move"
              >
                {row.transaction_type === "deposit"
                  ? <ArrowUpCircle className="w-3.5 h-3.5" />
                  : <ArrowDownCircle className="w-3.5 h-3.5" />}
                {row.transaction_type === "deposit" ? "In" : "Out"}
              </button>

              {/* Description */}
              <input
                ref={(el) => { cellRefs.current[row._rowId].description = el; }}
                value={row.description}
                onChange={(e) => updateRow(row._rowId, { description: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, rowIndex, "description")}
                placeholder="Note…"
                className="w-full px-2.5 py-1.5 text-[13px] border border-[var(--paper-line)] rounded-lg bg-[var(--paper)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--forest)]"
              />

              {/* Remove */}
              <button
                onClick={() => removeRow(row._rowId)}
                className="p-1.5 rounded-lg text-[var(--ink-faint)] hover:text-[var(--clay)] hover:bg-[var(--clay-soft)] mt-0.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {err && (
                <p className="col-span-7 text-[11px] -mt-1" style={{ color: "var(--clay)" }}>{err}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-medium rounded-xl border border-[var(--paper-line)] hover:bg-[var(--paper)]"
        >
          <Plus className="w-3.5 h-3.5" /> Add row <span className="text-[var(--ink-faint)]">(rows auto-add as you fill the last one)</span>
        </button>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-2.5 text-[13px] font-semibold text-white rounded-xl disabled:opacity-50"
          style={{ background: "var(--forest)" }}
        >
          {submitting ? "Submitting…" : `Submit sheet (${activeRows.length} row${activeRows.length !== 1 ? "s" : ""})`}
        </button>
      </div>
    </div>
  );
}