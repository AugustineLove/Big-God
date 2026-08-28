import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAccounts } from "../../../contexts/dashboard/Account";
import { useTransactions } from "../../../contexts/dashboard/Transactions";
import { companyId, userUUID } from "../../../constants/appConstants";

/**
 * QuickTransferPage
 * ------------------
 * A standalone, routable page (e.g. mount at /transfers/quick) for moving
 * money between ANY two accounts in the company without first drilling
 * into a customer's detail page. Both the "from" and "to" accounts are
 * found via a live search box (account number, account type, customer
 * name, or phone) instead of relying on a pre-scoped `accounts` list.
 *
 * Drop this file in next to CustomerDetailsPage.tsx (same folder depth)
 * so the relative imports above resolve, or adjust the paths.
 *
 * Add to your router:
 *   <Route path="/transfers/quick" element={<QuickTransferPage />} />
 */

const BASE_URL = "https://susu-pro-backend.onrender.com/api";
const RECENTS_KEY = "quickTransfer.recentAccounts";
const MAX_RECENTS = 6;

// ─── Types ──────────────────────────────────────────────────────────────────

interface Account {
  id: string;
  account_type: string;
  account_number: string;
  balance: number;
  status: string;
  customer_id?: string;
  created_at?: string;
}

interface CustomerSearchResult {
  id: string;
  name: string;
  phone_number?: string;
  email?: string;
  account_number?: string;
}

interface RecentEntry {
  accountId: string;
  accountNumber: string;
  accountType: string;
  customerName?: string;
  usedAt: number;
}

// ─── Constants (reused from TransferModal) ─────────────────────────────────

const REASONS = [
  { label: "Salary", value: "Salary Payment", icon: "💼" },
  { label: "Account Transfer", value: "Account Transfer", icon: "🔄" },
  { label: "Loan", value: "Loan Disbursement", icon: "🏦" },
  { label: "Bill Payment", value: "Bill Payment", icon: "📋" },
  { label: "Investment", value: "Investment", icon: "📈" },
  { label: "Other", value: "Other", icon: "✏️" },
];

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000];

const SMS_RECEIVER_TEMPLATES: Record<string, string> = {
  "Salary Payment": "Dear {receiver_name}, your account {to_acc} has been credited with GHS {amount} as salary payment on {date}. Ref: {ref}",
  "Account Transfer": "Dear {receiver_name}, GHS {amount} has been credited to your account {to_acc} on {date}. Ref: {ref}",
  "Loan Disbursement": "Dear {receiver_name}, a loan of GHS {amount} has been credited to your account {to_acc} on {date}. Ref: {ref}",
  "Bill Payment": "Dear {receiver_name}, a payment of GHS {amount} has been received into your account {to_acc} on {date}. Ref: {ref}",
  Investment: "Dear {receiver_name}, GHS {amount} has been credited to your investment account {to_acc} on {date}. Ref: {ref}",
  Other: "Dear {receiver_name}, GHS {amount} has been credited to your account {to_acc} on {date}. Ref: {ref}",
};

const SMS_SENDER_TEMPLATES: Record<string, string> = {
  "Salary Payment": "Dear {sender_name}, GHS {amount} has been debited from your account {from_acc} as salary payment on {date}. Ref: {ref}",
  "Account Transfer": "Dear {sender_name}, GHS {amount} has been debited from your account {from_acc} and transferred on {date}. Ref: {ref}",
  "Loan Disbursement": "Dear {sender_name}, GHS {amount} loan has been disbursed from account {from_acc} on {date}. Ref: {ref}",
  "Bill Payment": "Dear {sender_name}, GHS {amount} bill payment was processed from your account {from_acc} on {date}. Ref: {ref}",
  Investment: "Dear {sender_name}, GHS {amount} investment transfer made from your account {from_acc} on {date}. Ref: {ref}",
  Other: "Dear {sender_name}, GHS {amount} has been debited from your account {from_acc} on {date}. Ref: {ref}",
};

const SMS_VARS = ["{receiver_name}", "{sender_name}", "{amount}", "{from_acc}", "{to_acc}", "{date}", "{ref}"];

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatGHS = (n: number | string) =>
  Number(n).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getCustomerBaseNumber = (accountNumber: string): string => accountNumber?.slice(0, -3) ?? "";

const generateRef = () => `TRF-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000000 + 1000000)}`;

const loadRecents = (): RecentEntry[] => {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveRecent = (entry: RecentEntry) => {
  try {
    const existing = loadRecents().filter((r) => r.accountId !== entry.accountId);
    const next = [entry, ...existing].slice(0, MAX_RECENTS);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* non-fatal */
  }
};

// ─── Shared style tokens ────────────────────────────────────────────────────

const S = {
  page: { minHeight: "100vh", background: "#ffffff", padding: "28px 16px 60px" } as React.CSSProperties,
  card: {
    background: "#fff", borderRadius: 18, border: "1px solid #e8e8e6",
    maxWidth: 620, margin: "0 auto", overflow: "hidden",
    boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
  } as React.CSSProperties,
  sectionLabel: {
    fontSize: 11, fontWeight: 500, color: "#888780",
    textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 10,
  },
  fieldLabel: { display: "block", fontSize: 12, color: "#5f5e5a", marginBottom: 6 },
  input: {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1px solid #d3d1c7", background: "#fff", color: "#1a1a18",
    fontSize: 13, fontFamily: "inherit", outline: "none",
  } as React.CSSProperties,
  cancelBtn: {
    padding: "8px 16px", borderRadius: 8, border: "1px solid #e8e8e6",
    background: "#fff", fontSize: 13, color: "#5f5e5a", cursor: "pointer", fontFamily: "inherit",
  } as React.CSSProperties,
};

// ─── Micro-components (unchanged behaviour from TransferModal) ─────────────

function PrimaryBtn({ onClick, children, disabled, style }: {
  onClick?: () => void; children: React.ReactNode; disabled?: boolean; style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 20px", borderRadius: 8, border: "none",
        background: disabled ? "#b4b2a9" : "#1d9e75",
        color: "white", fontSize: 13, fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
        transition: "background 0.15s", ...style,
      }}
    >
      {children}
    </button>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "16px 24px", borderTop: "1px solid #eeeeec", display: "flex", gap: 8, justifyContent: "flex-end", background: "#fff" }}>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 36, height: 20, borderRadius: 99, border: "none", outline: "none",
        background: on ? "#1d9e75" : "#d3d1c7",
        position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.2s",
      }}
    >
      <div style={{
        position: "absolute", width: 14, height: 14, borderRadius: "50%",
        background: "white", top: 3, left: on ? 19 : 3,
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "left 0.2s",
      }} />
    </button>
  );
}

function ToggleRow({ label, sub, on, onChange }: { label: string; sub: string; on: boolean; onChange: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderTop: "1px solid #eeeeec" }}>
      <div>
        <div style={{ fontSize: 13, color: "#1a1a18" }}>{label}</div>
        <div style={{ fontSize: 11, color: "#888780", marginTop: 1 }}>{sub}</div>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

function SmsBox({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  const insertVar = (v: string) => {
    const el = document.getElementById(id) as HTMLTextAreaElement | null;
    if (!el) return;
    const pos = el.selectionStart ?? 0;
    const next = value.slice(0, pos) + v + value.slice(el.selectionEnd ?? pos);
    onChange(next);
    setTimeout(() => { el.selectionStart = el.selectionEnd = pos + v.length; el.focus(); }, 0);
  };

  return (
    <div style={{ marginTop: 10, padding: 12, borderRadius: 10, border: "1px solid #e8e8e6", background: "#fafaf8" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888780", marginBottom: 6 }}>
        <span>{label}</span>
        <span style={{ color: value.length > 140 ? "#e24b4a" : "#b4b2a9" }}>{value.length} / 160</span>
      </div>
      <textarea
        id={id} rows={3} value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...S.input, resize: "none", lineHeight: 1.5, fontSize: 12, padding: "8px 10px" }}
      />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8, alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "#888780" }}>Insert:</span>
        {SMS_VARS.map((v) => (
          <span key={v} onClick={() => insertVar(v)} style={{
            padding: "2px 7px", borderRadius: 99, background: "#e6f1fb",
            color: "#185fa5", fontSize: 10, cursor: "pointer", border: "1px solid #b5d4f4",
          }}>
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

function StepsBar({ current }: { current: number }) {
  const steps = ["Accounts", "Details", "Notify", "Review"];
  return (
    <div style={{ display: "flex", padding: "14px 24px", borderBottom: "1px solid #eeeeec", background: "#fafaf8" }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <div key={n} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 500,
                border: `1px solid ${active ? "#1d9e75" : done ? "#5dcaa5" : "#d3d1c7"}`,
                background: active ? "#1d9e75" : done ? "#e1f5ee" : "#fff",
                color: active ? "#fff" : done ? "#0f6e56" : "#888780",
                transition: "all 0.2s",
              }}>
                {done ? "✓" : n}
              </div>
              <span style={{ fontSize: 11, color: active ? "#1a1a18" : done ? "#0f6e56" : "#888780", fontWeight: active ? 500 : 400 }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: "#e8e8e6", margin: "0 8px" }} />}
          </div>
        );
      })}
    </div>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" style={{ animation: "spin 0.8s linear infinite" }}>
      <circle cx="7" cy="7" r="5" strokeDasharray="20 12" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2">
      <polyline points="2,6 5,9 10,3" />
    </svg>
  );
}

const TYPE_COLORS: Record<string, string> = {
  susu: "#1d9e75", savings: "#378add", current: "#ba7517", loan: "#d4537e", investment: "#7f77dd",
};

// ─── Account Picker (search-driven, works company-wide) ────────────────────

function AccountPicker({
  label, accent, allAccounts, excludeId, selectedId, onSelect, resolvedCustomerName, customerLoading, disabledReason,
}: {
  label: string;
  accent: string;
  allAccounts: Account[];
  excludeId?: string;
  selectedId: string;
  onSelect: (id: string) => void;
  resolvedCustomerName?: string | null;
  customerLoading?: boolean;
  disabledReason?: string;
}) {
  const [query, setQuery] = useState("");
  const [customerMatches, setCustomerMatches] = useState<CustomerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showRecents, setShowRecents] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedAccount = allAccounts.find((a) => a.id === selectedId);
  const recents = loadRecents().filter((r) => r.accountId !== excludeId);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.trim().length < 2) {
      setCustomerMatches([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${BASE_URL}/customers/${companyId}/search?query=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setCustomerMatches(data?.data ?? []);
      } catch {
        setCustomerMatches([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Direct account-number / type matches, instant (no debounce needed — local filter)
  const directMatches = query.trim().length >= 2
    ? allAccounts.filter((a) =>
        a.id !== excludeId &&
        (a.account_number?.toLowerCase().includes(query.trim().toLowerCase()) ||
          a.account_type?.toLowerCase().includes(query.trim().toLowerCase()))
      ).slice(0, 6)
    : [];

  // For each matched customer, surface their accounts grouped underneath
  const groupedByCustomer = customerMatches.map((cust) => ({
    customer: cust,
    accounts: allAccounts.filter((a) => a.customer_id === cust.id && a.id !== excludeId),
  })).filter((g) => g.accounts.length > 0);

  const pick = (acc: Account, customerName?: string) => {
    onSelect(acc.id);
    setQuery("");
    setCustomerMatches([]);
    setShowRecents(false);
    saveRecent({
      accountId: acc.id,
      accountNumber: acc.account_number,
      accountType: acc.account_type,
      customerName,
      usedAt: Date.now(),
    });
  };

  const color = accent;

  if (selectedAccount) {
    return (
      <div style={{ border: `1.5px solid ${color}`, borderRadius: 12, padding: "12px 14px", background: `${color}0d`, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{label[0]}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18", textTransform: "capitalize" }}>
            {selectedAccount.account_type} · {selectedAccount.account_number}
          </div>
          <div style={{ fontSize: 11, color: "#888780", marginTop: 1 }}>
            {customerLoading ? "Looking up owner…" : resolvedCustomerName || "Owner unknown"}
            {"  ·  GHS " + formatGHS(selectedAccount.balance)}
          </div>
        </div>
        <button onClick={() => onSelect("")} style={{ fontSize: 11, color: "#e24b4a", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          Change
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setShowRecents(true)}
        placeholder={`Search ${label.toLowerCase()} — name, phone, or account number`}
        style={{ ...S.input, borderColor: "#d3d1c7" }}
      />

      {/* Recents (shown when field is empty & focused) */}
      {showRecents && !query.trim() && recents.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, color: "#b4b2a9", textTransform: "uppercase", letterSpacing: "0.05em", margin: "4px 0" }}>Recent</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {recents.map((r) => {
              const acc = allAccounts.find((a) => a.id === r.accountId);
              if (!acc) return null;
              return (
                <div
                  key={r.accountId}
                  onClick={() => pick(acc, r.customerName)}
                  style={{
                    padding: "6px 10px", borderRadius: 8, border: "1px solid #e8e8e6",
                    background: "#fafaf8", cursor: "pointer", fontSize: 11, color: "#5f5e5a",
                  }}
                >
                  <span style={{ fontWeight: 500, color: "#1a1a18" }}>{r.customerName ?? r.accountType}</span>
                  {"  ·  " + acc.account_number.slice(-4)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {query.trim().length >= 2 && (
        <div style={{ marginTop: 8, border: "1px solid #e8e8e6", borderRadius: 10, overflow: "hidden", maxHeight: 280, overflowY: "auto" }}>
          {searching && (
            <div style={{ padding: "10px 13px", fontSize: 12, color: "#888780" }}>Searching…</div>
          )}

          {groupedByCustomer.map(({ customer, accounts }) => (
            <div key={customer.id} style={{ borderBottom: "1px solid #eeeeec" }}>
              <div style={{ padding: "8px 13px 4px", fontSize: 11, fontWeight: 500, color: "#5f5e5a", background: "#fafaf8" }}>
                {customer.name} {customer.phone_number ? `· ${customer.phone_number}` : ""}
              </div>
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => pick(acc, customer.name)}
                  style={{ padding: "9px 13px 9px 22px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f4f0")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: TYPE_COLORS[acc.account_type?.toLowerCase()] ?? "#888780", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: "#1a1a18", textTransform: "capitalize" }}>{acc.account_type}</div>
                    <div style={{ fontSize: 11, color: "#888780" }}>{acc.account_number}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#5f5e5a" }}>GHS {formatGHS(acc.balance)}</div>
                </div>
              ))}
            </div>
          ))}

          {directMatches.length > 0 && (
            <div>
              <div style={{ padding: "8px 13px 4px", fontSize: 11, fontWeight: 500, color: "#5f5e5a", background: "#fafaf8" }}>
                Matching accounts
              </div>
              {directMatches
                .filter((a) => !groupedByCustomer.some((g) => g.accounts.some((ga) => ga.id === a.id)))
                .map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => pick(acc)}
                    style={{ padding: "9px 13px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f4f0")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: TYPE_COLORS[acc.account_type?.toLowerCase()] ?? "#888780", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: "#1a1a18", textTransform: "capitalize" }}>{acc.account_type}</div>
                      <div style={{ fontSize: 11, color: "#888780" }}>{acc.account_number}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#5f5e5a" }}>GHS {formatGHS(acc.balance)}</div>
                  </div>
                ))}
            </div>
          )}

          {!searching && groupedByCustomer.length === 0 && directMatches.length === 0 && (
            <div style={{ padding: "12px 13px", fontSize: 12, color: "#888780" }}>No matches. Try a full account number or phone.</div>
          )}
        </div>
      )}

      {disabledReason && (
        <div style={{ marginTop: 6, fontSize: 11, color: "#e24b4a" }}>{disabledReason}</div>
      )}
    </div>
  );
}

// ─── Page 1: Accounts ───────────────────────────────────────────────────────

function PageAccounts({
  allAccounts, fromId, setFromId, toId, setToId,
  fromCustomerName, fromCustomerLoading, toCustomerName, toCustomerLoading,
  onNext,
}: {
  allAccounts: Account[];
  fromId: string; setFromId: (v: string) => void;
  toId: string; setToId: (v: string) => void;
  fromCustomerName: string | null; fromCustomerLoading: boolean;
  toCustomerName: string | null; toCustomerLoading: boolean;
  onNext: () => void;
}) {
  const sameAccount = !!fromId && fromId === toId;

  return (
    <>
      <div style={{ padding: "20px 24px", background: "#fff" }}>
        <div style={S.sectionLabel}>Debit from</div>
        <AccountPicker
          label="From account" accent="#1d9e75"
          allAccounts={allAccounts} excludeId={toId}
          selectedId={fromId} onSelect={setFromId}
          resolvedCustomerName={fromCustomerName} customerLoading={fromCustomerLoading}
        />

        <div style={{ textAlign: "center", padding: "10px 0", color: "#b4b2a9", fontSize: 20 }}>↓</div>

        <div style={S.sectionLabel}>Credit to</div>
        <AccountPicker
          label="To account" accent="#378add"
          allAccounts={allAccounts} excludeId={fromId}
          selectedId={toId} onSelect={setToId}
          resolvedCustomerName={toCustomerName} customerLoading={toCustomerLoading}
          disabledReason={sameAccount ? "This is the same account you're debiting from — pick a different one." : undefined}
        />
      </div>

      <Footer>
        <PrimaryBtn onClick={onNext} disabled={!fromId || !toId || sameAccount}>
          Continue →
        </PrimaryBtn>
      </Footer>
    </>
  );
}

// ─── Page 2: Details ────────────────────────────────────────────────────────

function PageDetails({
  reason, setReason, amount, setAmount, fromBalance,
  schedule, setSchedule, scheduledAt, setScheduledAt,
  recurringFreq, setRecurringFreq, narration, setNarration,
  onNext, onBack,
}: {
  reason: string; setReason: (v: string) => void;
  amount: string; setAmount: (v: string) => void;
  fromBalance: number | undefined;
  schedule: string; setSchedule: (v: string) => void;
  scheduledAt: string; setScheduledAt: (v: string) => void;
  recurringFreq: string; setRecurringFreq: (v: string) => void;
  narration: string; setNarration: (v: string) => void;
  onNext: () => void; onBack: () => void;
}) {
  const numericAmount = Number(amount);
  const exceedsBalance = fromBalance !== undefined && numericAmount > fromBalance;
  const canContinue = !!reason && numericAmount > 0 && !exceedsBalance;

  return (
    <>
      <div style={{ padding: "20px 24px", background: "#fff", overflowY: "auto", maxHeight: "60vh" }}>
        <div style={S.sectionLabel}>Transfer reason</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8, marginBottom: 16 }}>
          {REASONS.map((r) => (
            <div
              key={r.value} onClick={() => setReason(r.value)}
              style={{
                padding: "9px 6px", borderRadius: 10, textAlign: "center", cursor: "pointer", transition: "all 0.15s",
                border: `1px solid ${reason === r.value ? "#1d9e75" : "#e8e8e6"}`,
                background: reason === r.value ? "#f0faf6" : "#fff",
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 3 }}>{r.icon}</div>
              <div style={{ fontSize: 11, color: reason === r.value ? "#0f6e56" : "#5f5e5a", fontWeight: reason === r.value ? 500 : 400 }}>
                {r.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={S.sectionLabel}>Amount</div>
          {fromBalance !== undefined && (
            <span style={{ fontSize: 11, color: "#888780" }}>Available: GHS {formatGHS(fromBalance)}</span>
          )}
        </div>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#888780", pointerEvents: "none" }}>
            GHS
          </span>
          <input
            type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
            style={{ ...S.input, paddingLeft: 46, fontSize: 20, fontWeight: 500, borderColor: exceedsBalance ? "#e24b4a" : "#d3d1c7" }}
          />
        </div>
        {exceedsBalance && (
          <div style={{ fontSize: 11, color: "#e24b4a", marginBottom: 10 }}>Amount exceeds the available balance on this account.</div>
        )}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {QUICK_AMOUNTS.map((v) => (
            <div
              key={v} onClick={() => setAmount(String(v))}
              style={{
                padding: "4px 10px", borderRadius: 99, cursor: "pointer",
                border: `1px solid ${amount === String(v) ? "#1d9e75" : "#e8e8e6"}`,
                fontSize: 11, background: amount === String(v) ? "#f0faf6" : "#fafaf8",
                color: amount === String(v) ? "#0f6e56" : "#5f5e5a", transition: "all 0.12s",
              }}
            >
              {v.toLocaleString()}
            </div>
          ))}
        </div>

        <div style={S.sectionLabel}>Schedule</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[["now", "Send now"], ["later", "Schedule later"], ["recurring", "Recurring"]].map(([val, lbl]) => (
            <div
              key={val} onClick={() => setSchedule(val)}
              style={{
                flex: 1, padding: 8, borderRadius: 8, textAlign: "center", cursor: "pointer", fontSize: 12, transition: "all 0.15s",
                border: `1px solid ${schedule === val ? "#1d9e75" : "#e8e8e6"}`,
                background: schedule === val ? "#f0faf6" : "#fff",
                color: schedule === val ? "#0f6e56" : "#5f5e5a", fontWeight: schedule === val ? 500 : 400,
              }}
            >
              {lbl}
            </div>
          ))}
        </div>

        {schedule === "later" && (
          <div style={{ marginBottom: 14 }}>
            <label style={S.fieldLabel}>Date & Time</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} style={S.input} />
          </div>
        )}
        {schedule === "recurring" && (
          <div style={{ marginBottom: 14 }}>
            <label style={S.fieldLabel}>Repeat every</label>
            <select value={recurringFreq} onChange={(e) => setRecurringFreq(e.target.value)} style={S.input}>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        )}

        <div style={{ fontSize: 11, color: "#5f5e5a", background: "#fafaf8", border: "1px solid #e8e8e6", borderRadius: 8, padding: "8px 10px", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#5f5e5a" strokeWidth="1.5">
            <circle cx="7" cy="7" r="6" /><line x1="7" y1="6" x2="7" y2="10" /><circle cx="7" cy="4.2" r="0.6" fill="#5f5e5a" />
          </svg>
          No fees for internal transfers. Processed instantly.
        </div>

        <label style={S.fieldLabel}>Narration / Note (optional)</label>
        <input
          type="text" value={narration} onChange={(e) => setNarration(e.target.value)}
          placeholder="e.g. Monthly salary for March" style={S.input}
        />
      </div>

      <Footer>
        <button style={S.cancelBtn} onClick={onBack}>← Back</button>
        <PrimaryBtn onClick={onNext} disabled={!canContinue}>Continue →</PrimaryBtn>
      </Footer>
    </>
  );
}

// ─── Page 3: Notifications ──────────────────────────────────────────────────

function PageNotify({
  receiverOn, setReceiverOn, smsReceiver, setSmsReceiver,
  senderOn, setSenderOn, smsSender, setSmsSender,
  emailOn, setEmailOn, approvalOn, setApprovalOn,
  onNext, onBack,
}: {
  receiverOn: boolean; setReceiverOn: (v: (p: boolean) => boolean) => void;
  smsReceiver: string; setSmsReceiver: (v: string) => void;
  senderOn: boolean; setSenderOn: (v: (p: boolean) => boolean) => void;
  smsSender: string; setSmsSender: (v: string) => void;
  emailOn: boolean; setEmailOn: (v: (p: boolean) => boolean) => void;
  approvalOn: boolean; setApprovalOn: (v: (p: boolean) => boolean) => void;
  onNext: () => void; onBack: () => void;
}) {
  return (
    <>
      <div style={{ padding: "20px 24px", background: "#fff", overflowY: "auto", maxHeight: "60vh" }}>
        <div style={S.sectionLabel}>Notification settings</div>

        <ToggleRow label="SMS — Receiver (priority)" sub="Notify the account being credited" on={receiverOn} onChange={() => setReceiverOn((v) => !v)} />
        {receiverOn && <SmsBox id="sms-receiver" label="Receiver SMS template" value={smsReceiver} onChange={setSmsReceiver} />}

        <ToggleRow label="SMS — Sender" sub="Notify the account being debited" on={senderOn} onChange={() => setSenderOn((v) => !v)} />
        {senderOn && <SmsBox id="sms-sender" label="Sender SMS template" value={smsSender} onChange={setSmsSender} />}

        <ToggleRow label="Email receipt" sub="Send transaction receipt to registered email" on={emailOn} onChange={() => setEmailOn((v) => !v)} />
        <ToggleRow label="Require approval" sub="Flag for supervisor sign-off before processing" on={approvalOn} onChange={() => setApprovalOn((v) => !v)} />
      </div>

      <Footer>
        <button style={S.cancelBtn} onClick={onBack}>← Back</button>
        <PrimaryBtn onClick={onNext}>Review transfer →</PrimaryBtn>
      </Footer>
    </>
  );
}

// ─── Page 4: Review ─────────────────────────────────────────────────────────

function PageReview({
  fromAccount, toAccount, fromCustomerName, toCustomerName,
  amount, reason, schedule, narration, receiverOn, senderOn,
  onConfirm, onBack, loading, txRef,
}: {
  fromAccount?: Account; toAccount?: Account;
  fromCustomerName: string | null; toCustomerName: string | null;
  amount: string; reason: string; schedule: string; narration: string;
  receiverOn: boolean; senderOn: boolean;
  onConfirm: () => void; onBack: () => void; loading: boolean; txRef: string;
}) {
  const smsText = receiverOn && senderOn ? "Receiver & Sender" : receiverOn ? "Receiver only" : senderOn ? "Sender only" : "None";
  const schedMap: Record<string, string> = { now: "Immediate", later: "Scheduled", recurring: "Recurring" };
  const numAmount = parseFloat(amount || "0");

  const fromAfter = fromAccount ? Number(fromAccount.balance) - numAmount : undefined;
  const toAfter = toAccount ? Number(toAccount.balance) + numAmount : undefined;

  const rows: [string, string, string?][] = [
    ["From", `${fromCustomerName ?? "Unknown"} — ${fromAccount ? `${fromAccount.account_type} · ${fromAccount.account_number}` : "—"}`],
    ["To", `${toCustomerName ?? "Unknown"} — ${toAccount ? `${toAccount.account_type} · ${toAccount.account_number}` : "—"}`],
    ["Reason", reason],
    ["Schedule", schedMap[schedule] ?? "Immediate"],
    ["Narration", narration || "—"],
    ["SMS alerts", smsText],
    ["Fee", "Free", "#0f6e56"],
  ];

  return (
    <>
      <div style={{ padding: "20px 24px", background: "#fff", overflowY: "auto", maxHeight: "60vh" }}>
        <div style={{ textAlign: "center", padding: "18px 0", fontSize: 30, fontWeight: 500, color: "#1a1a18", background: "#fafaf8", borderRadius: 10, marginBottom: 12, border: "1px solid #eeeeec" }}>
          <span style={{ fontSize: 14, color: "#888780", verticalAlign: "super", marginRight: 4 }}>GHS</span>
          {formatGHS(numAmount)}
        </div>

        {rows.map(([label, val, color]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eeeeec", fontSize: 13, gap: 12 }}>
            <span style={{ color: "#888780", flexShrink: 0 }}>{label}</span>
            <span style={{ fontWeight: 500, color: color ?? "#1a1a18", textAlign: "right" }}>{val}</span>
          </div>
        ))}

        {/* Balance preview */}
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <div style={{ flex: 1, border: "1px solid #eeeeec", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#888780", marginBottom: 3 }}>Sender balance after</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: (fromAfter ?? 0) < 0 ? "#e24b4a" : "#1a1a18" }}>
              GHS {fromAfter !== undefined ? formatGHS(fromAfter) : "—"}
            </div>
          </div>
          <div style={{ flex: 1, border: "1px solid #eeeeec", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#888780", marginBottom: 3 }}>Recipient balance after</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a18" }}>
              GHS {toAfter !== undefined ? formatGHS(toAfter) : "—"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", fontSize: 13 }}>
          <span style={{ fontSize: 12, color: "#888780" }}>Reference</span>
          <span style={{ fontSize: 11, fontFamily: "monospace", color: "#888780" }}>{txRef}</span>
        </div>

        <div style={{ marginTop: 8, padding: "8px 12px", background: "#faeeda", border: "1px solid #fac775", borderRadius: 8, fontSize: 12, color: "#854f0b" }}>
          ⚠ Please verify all details before confirming. Transfers cannot be reversed automatically.
        </div>
      </div>

      <Footer>
        <button style={S.cancelBtn} onClick={onBack}>← Back</button>
        <PrimaryBtn onClick={onConfirm} disabled={loading}>
          {loading ? <><Spinner /> Processing...</> : <><CheckIcon /> Confirm transfer</>}
        </PrimaryBtn>
      </Footer>
    </>
  );
}

// ─── Page 5: Success ────────────────────────────────────────────────────────

function PageSuccess({ txRef, onDone, onAnother }: { txRef: string; onDone: () => void; onAnother: () => void }) {
  return (
    <div style={{ padding: "36px 24px", textAlign: "center", background: "#fff" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#e1f5ee", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#0f6e56" strokeWidth="2.2">
          <polyline points="5,14 11,20 23,8" />
        </svg>
      </div>
      <div style={{ fontSize: 16, fontWeight: 500, color: "#1a1a18", marginBottom: 6 }}>Transfer successful</div>
      <div style={{ fontSize: 13, color: "#888780", marginBottom: 20 }}>
        Your transfer has been processed. SMS and email notifications will be sent to the recipient.
      </div>
      <div style={{ fontSize: 11, fontFamily: "monospace", color: "#888780", background: "#fafaf8", border: "1px solid #e8e8e6", padding: "8px 14px", borderRadius: 8, display: "inline-block", marginBottom: 24 }}>
        {txRef}
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button style={S.cancelBtn} onClick={onDone}>Done</button>
        <PrimaryBtn onClick={onAnother}>Send another transfer</PrimaryBtn>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function QuickTransferPage() {
  const navigate = useNavigate();
  const { allAccounts, refreshAllCompanyAccounts } = useAccounts();
  const { transferBetweenAccounts } = useTransactions();

  const [pageLoading, setPageLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [txRef, setTxRef] = useState(generateRef);

  // Step 1: Accounts
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const fromAccount = allAccounts.find((a: Account) => a.id === fromId);
  const toAccount = allAccounts.find((a: Account) => a.id === toId);
  
  // Owner name lookups for both legs — this is the safety net that a
  // customer-detail-page transfer normally gets "for free" (you already
  // know whose page you're on). On a blind, company-wide picker it's the
  // one thing worth fetching eagerly so nobody sends money to the wrong
  // person by matching a similar-looking account number.
  const [fromCustomerName, setFromCustomerName] = useState<string | null>(null);
  const [fromCustomerLoading, setFromCustomerLoading] = useState(false);
  const [toCustomerName, setToCustomerName] = useState<string | null>(null);
  const [toCustomerLoading, setToCustomerLoading] = useState(false);
  const [toCustomerId, setToCustomerId] = useState<string | null>(null);
  const [toCustomerPhone, setToCustomerPhone] = useState<string | null>(null);
  const [toCustomerAccountNumber, setToCustomerAccountNumber ] = useState<string | null>(null);
  const lookupCustomerName = useCallback(async (accountNumber: string, setName: (v: string | null) => void, setLoading: (v: boolean) => void) => {
    if (!accountNumber) { setName(null); return; }
    const baseNumber = getCustomerBaseNumber(accountNumber);
    if (!baseNumber) return;
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/customers/${companyId}/search?query=${baseNumber}`);
      const data = await res.json();
      const results: CustomerSearchResult[] = data.data ?? [];
      setName(results[0]?.name ?? null);
      setToCustomerId(results[0]?.id ?? null);
      setToCustomerPhone(results[0]?.phone_number ?? null);
      setToCustomerAccountNumber(results[0]?.account_number ?? null);
    } catch {
      setName(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    lookupCustomerName(fromAccount?.account_number ?? "", setFromCustomerName, setFromCustomerLoading);
  }, [fromAccount?.account_number, lookupCustomerName]);

  useEffect(() => {
    lookupCustomerName(toAccount?.account_number ?? "", setToCustomerName, setToCustomerLoading);
  }, [toAccount?.account_number, lookupCustomerName]);

  // Step 2: Details
  const [reason, setReason] = useState("Account Transfer");
  const [amount, setAmount] = useState("");
  const [schedule, setSchedule] = useState("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [recurringFreq, setRecurringFreq] = useState("monthly");
  const [narration, setNarration] = useState("");

  // Step 3: Notifications
  const [receiverOn, setReceiverOn] = useState(true);
  const [smsReceiver, setSmsReceiver] = useState(SMS_RECEIVER_TEMPLATES["Account Transfer"]);
  const [senderOn, setSenderOn] = useState(false);
  const [smsSender, setSmsSender] = useState(SMS_SENDER_TEMPLATES["Account Transfer"]);
  const [emailOn, setEmailOn] = useState(true);
  const [approvalOn, setApprovalOn] = useState(false);

  const handleSetReason = (r: string) => {
    setReason(r);
    setSmsReceiver(SMS_RECEIVER_TEMPLATES[r] ?? SMS_RECEIVER_TEMPLATES.Other);
    setSmsSender(SMS_SENDER_TEMPLATES[r] ?? SMS_SENDER_TEMPLATES.Other);
  };

  // Submit
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleConfirm = async () => {
    if (!fromId || !toId || Number(amount) <= 0) return;
    if (fromId === toId) { setErrorMsg("Cannot transfer to the same account."); return; }

    setLoading(true);
    setErrorMsg("");

    const payload = {
      from_account_id: fromId,
      to_account_id: toId,
      amount: Number(amount),
      company_id: companyId,
      created_by: userUUID,
      created_by_type: "staff",
      description: narration || reason,
      reason,
      schedule_type: schedule,
      scheduled_at: schedule === "later" ? scheduledAt : null,
      recurring_frequency: schedule === "recurring" ? recurringFreq : null,
      sms_receiver: receiverOn,
      sms_receiver_template: receiverOn ? smsReceiver : null,
      sms_receiver_name: toCustomerName,
      sms_receiver_id: toCustomerId,
      sms_receiver_phone: toCustomerPhone,
      sms_receiver_account_number: toCustomerAccountNumber,
      to_acc_type: toAccount?.account_type,
      to_acc: toAccount?.account_number,
      sms_sender: senderOn,
      sms_sender_template: senderOn ? smsSender : null,
      sms_sender_name: fromCustomerName,
      email_receipt: emailOn,
      requires_approval: approvalOn,
      reference: txRef,
    };

    try {
      const res = await transferBetweenAccounts(payload);
      if (res?.success) {
        await refreshAllCompanyAccounts();
        setStep(5);
      } else {
        setErrorMsg(res?.message ?? "Transfer failed. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message ?? "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setStep(1);
    setFromId(""); setToId("");
    setFromCustomerName(null); setToCustomerName(null);
    setReason("Account Transfer"); setAmount(""); setSchedule("now");
    setScheduledAt(""); setRecurringFreq("monthly"); setNarration("");
    setReceiverOn(true); setSenderOn(false); setEmailOn(true); setApprovalOn(false);
    setSmsReceiver(SMS_RECEIVER_TEMPLATES["Account Transfer"]);
    setSmsSender(SMS_SENDER_TEMPLATES["Account Transfer"]);
    setErrorMsg("");
    setTxRef(generateRef());
  };

  useEffect(() => {
    (async () => {
      await refreshAllCompanyAccounts();
      setPageLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={S.page}>
      <div style={{ maxWidth: 620, margin: "0 auto 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e8e8e6", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#5f5e5a" }}
        >
          ←
        </button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a18" }}>Quick Transfer</div>
          <div style={{ fontSize: 12, color: "#888780" }}>Move money between any two accounts — no customer page needed</div>
        </div>
      </div>

      <div style={S.card}>
        {step < 5 && <StepsBar current={step} />}

        {errorMsg && (
          <div style={{ padding: "10px 24px", background: "#fcebeb", borderBottom: "1px solid #f7c1c1", fontSize: 12, color: "#a32d2d", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#a32d2d" strokeWidth="1.5">
              <circle cx="7" cy="7" r="6" /><line x1="7" y1="4" x2="7" y2="8" /><circle cx="7" cy="10" r="0.6" fill="#a32d2d" />
            </svg>
            {errorMsg}
          </div>
        )}

        {pageLoading ? (
          <div style={{ padding: "60px 24px", textAlign: "center", fontSize: 13, color: "#888780" }}>Loading accounts…</div>
        ) : (
          <>
            {step === 1 && (
              <PageAccounts
                allAccounts={allAccounts}
                fromId={fromId} setFromId={setFromId}
                toId={toId} setToId={setToId}
                fromCustomerName={fromCustomerName} fromCustomerLoading={fromCustomerLoading}
                toCustomerName={toCustomerName} toCustomerLoading={toCustomerLoading}
                onNext={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <PageDetails
                reason={reason} setReason={handleSetReason}
                amount={amount} setAmount={setAmount}
                fromBalance={fromAccount ? Number(fromAccount.balance) : undefined}
                schedule={schedule} setSchedule={setSchedule}
                scheduledAt={scheduledAt} setScheduledAt={setScheduledAt}
                recurringFreq={recurringFreq} setRecurringFreq={setRecurringFreq}
                narration={narration} setNarration={setNarration}
                onNext={() => setStep(3)} onBack={() => setStep(1)}
              />
            )}

            {step === 3 && (
              <PageNotify
                receiverOn={receiverOn} setReceiverOn={setReceiverOn}
                smsReceiver={smsReceiver} setSmsReceiver={setSmsReceiver}
                senderOn={senderOn} setSenderOn={setSenderOn}
                smsSender={smsSender} setSmsSender={setSmsSender}
                emailOn={emailOn} setEmailOn={setEmailOn}
                approvalOn={approvalOn} setApprovalOn={setApprovalOn}
                onNext={() => setStep(4)} onBack={() => setStep(2)}
              />
            )}

            {step === 4 && (
              <PageReview
                fromAccount={fromAccount} toAccount={toAccount}
                fromCustomerName={fromCustomerName} toCustomerName={toCustomerName}
                amount={amount} reason={reason} schedule={schedule} narration={narration}
                receiverOn={receiverOn} senderOn={senderOn}
                onConfirm={handleConfirm} onBack={() => setStep(3)}
                loading={loading} txRef={txRef}
              />
            )}

            {step === 5 && (
              <PageSuccess
                txRef={txRef}
                onDone={() => navigate(-1)}
                onAnother={resetState}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}