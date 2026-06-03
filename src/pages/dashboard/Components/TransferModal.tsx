import { useState, useEffect, useCallback } from "react";
import { useAccounts } from "../../../contexts/dashboard/Account";
import { useTransactions } from "../../../contexts/dashboard/Transactions";
import { useParams } from "react-router-dom";
import { companyId, userUUID } from "../../../constants/appConstants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Account {
  id: string;
  account_type: string;
  account_number: string;
  balance: number;
  status: string;
  customer_id?: string;
}

interface CustomerSearchResult {
  id: string;
  name: string;
  phone_number?: string;
  email?: string;
  account_number?: string;
}

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REASONS = [
  { label: "Salary",           value: "Salary Payment",     icon: "💼" },
  { label: "Account Transfer", value: "Account Transfer",   icon: "🔄" },
  { label: "Loan",             value: "Loan Disbursement",  icon: "🏦" },
  { label: "Bill Payment",     value: "Bill Payment",       icon: "📋" },
  { label: "Investment",       value: "Investment",         icon: "📈" },
  { label: "Other",            value: "Other",              icon: "✏️"  },
];

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000];

const SMS_RECEIVER_TEMPLATES: Record<string, string> = {
  "Salary Payment":    "Dear {receiver_name}, your account {to_acc} has been credited with GHS {amount} as salary payment on {date}. Ref: {ref}",
  "Account Transfer":  "Dear {receiver_name}, GHS {amount} has been credited to your account {to_acc} on {date}. Ref: {ref}",
  "Loan Disbursement": "Dear {receiver_name}, a loan of GHS {amount} has been credited to your account {to_acc} on {date}. Ref: {ref}",
  "Bill Payment":      "Dear {receiver_name}, a payment of GHS {amount} has been received into your account {to_acc} on {date}. Ref: {ref}",
  "Investment":        "Dear {receiver_name}, GHS {amount} has been credited to your investment account {to_acc} on {date}. Ref: {ref}",
  "Other":             "Dear {receiver_name}, GHS {amount} has been credited to your account {to_acc} on {date}. Ref: {ref}",
};

const SMS_SENDER_TEMPLATES: Record<string, string> = {
  "Salary Payment":    "Dear {sender_name}, GHS {amount} has been debited from your account {from_acc} as salary payment on {date}. Ref: {ref}",
  "Account Transfer":  "Dear {sender_name}, GHS {amount} has been debited from your account {from_acc} and transferred on {date}. Ref: {ref}",
  "Loan Disbursement": "Dear {sender_name}, GHS {amount} loan has been disbursed from account {from_acc} on {date}. Ref: {ref}",
  "Bill Payment":      "Dear {sender_name}, GHS {amount} bill payment was processed from your account {from_acc} on {date}. Ref: {ref}",
  "Investment":        "Dear {sender_name}, GHS {amount} investment transfer made from your account {from_acc} on {date}. Ref: {ref}",
  "Other":             "Dear {sender_name}, GHS {amount} has been debited from your account {from_acc} on {date}. Ref: {ref}",
};

const SMS_VARS = [
  "{receiver_name}", "{sender_name}", "{amount}",
  "{from_acc}", "{to_acc}", "{date}", "{ref}",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatGHS = (n: number | string) =>
  Number(n).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Strip the last 3 chars (e.g. SU1, SA1) to get the customer base account number */
const getCustomerBaseNumber = (accountNumber: string): string =>
  accountNumber?.slice(0, -3) ?? "";

const generateRef = () =>
  `TRF-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000000 + 1000000)}`;

// ─── Shared style tokens ──────────────────────────────────────────────────────

const S = {
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

// ─── Micro-components ─────────────────────────────────────────────────────────

function PrimaryBtn({
  onClick, children, disabled, style,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
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
        position: "relative", cursor: "pointer", flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <div style={{
        position: "absolute", width: 14, height: 14, borderRadius: "50%",
        background: "white", top: 3, left: on ? 19 : 3,
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        transition: "left 0.2s",
      }} />
    </button>
  );
}

function ToggleRow({
  label, sub, on, onChange,
}: {
  label: string; sub: string; on: boolean; onChange: () => void;
}) {
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

function SmsBox({
  id, label, value, onChange,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
}) {
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
        id={id}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...S.input, resize: "none", lineHeight: 1.5, fontSize: 12, padding: "8px 10px" }}
      />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8, alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "#888780" }}>Insert:</span>
        {SMS_VARS.map((v) => (
          <span
            key={v}
            onClick={() => insertVar(v)}
            style={{
              padding: "2px 7px", borderRadius: 99, background: "#e6f1fb",
              color: "#185fa5", fontSize: 10, cursor: "pointer", border: "1px solid #b5d4f4",
            }}
          >
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
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 1, background: "#e8e8e6", margin: "0 8px" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Account selection card ───────────────────────────────────────────────────

function AccountCard({
  account, selected, onClick,
}: {
  account: Account; selected: boolean; onClick: () => void;
}) {
  const colors: Record<string, string> = {
    susu: "#1d9e75", savings: "#378add", current: "#ba7517",
    loan: "#d4537e", investment: "#7f77dd",
  };
  const color = colors[account.account_type?.toLowerCase()] ?? "#888780";

  return (
    <div
      onClick={onClick}
      style={{
        border: `1px solid ${selected ? "#1d9e75" : "#e8e8e6"}`,
        borderRadius: 10, padding: "11px 13px",
        display: "flex", alignItems: "center", gap: 10,
        cursor: "pointer", marginBottom: 8,
        background: selected ? "#f0faf6" : "#fff",
        transition: "all 0.15s",
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: color }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18", textTransform: "capitalize" }}>
          {account.account_type}
        </div>
        <div style={{ fontSize: 11, color: "#888780", marginTop: 1 }}>{account.account_number}</div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: Number(account.balance) >= 0 ? "#1a1a18" : "#e24b4a" }}>
        GHS {formatGHS(account.balance)}
      </div>
      {selected && (
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#1d9e75", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.8">
            <polyline points="2,5 4,7.5 8,3" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Page 1: Account Selection ────────────────────────────────────────────────

function PageAccounts({
  accounts,
  allAccounts,
  fromId, setFromId,
  toId, setToId,
  onNext, onClose,
}: {
  accounts: Account[];
  allAccounts: Account[];
  fromId: string; setFromId: (v: string) => void;
  toId: string; setToId: (v: string) => void;
  onNext: () => void; onClose: () => void;
}) {
  // ── "To" account: search across ALL company accounts ──
  const [toSearch, setToSearch] = useState("");
  const [toResults, setToResults] = useState<Account[]>([]);
  const [toMode, setToMode] = useState<"customer" | "external">("customer");

  // Live filter allAccounts by search query (exclude current customer's accounts)
  useEffect(() => {
    if (!toSearch.trim()) { setToResults([]); return; }
    const q = toSearch.toLowerCase();
    const filtered = allAccounts.filter(
      (a) =>
        (a.account_number?.toLowerCase().includes(q) ||
          a.account_type?.toLowerCase().includes(q)) &&
        !accounts.find((ca) => ca.id === a.id) // exclude own accounts
    );
    setToResults(filtered.slice(0, 8));
  }, [toSearch, allAccounts, accounts]);

  // Resolve selected "to" account display
  const selectedToAccount = [...accounts, ...allAccounts].find((a) => a.id === toId);

  return (
    <>
      <div style={{ padding: "20px 24px", background: "#fff", overflowY: "auto", maxHeight: "60vh" }}>

        {/* FROM */}
        <div style={S.sectionLabel}>From account</div>
        {accounts.length === 0 && (
          <div style={{ fontSize: 12, color: "#888780", padding: "8px 0" }}>No accounts available.</div>
        )}
        {accounts.map((acc) => (
          <AccountCard key={acc.id} account={acc} selected={fromId === acc.id} onClick={() => setFromId(acc.id)} />
        ))}

        <div style={{ textAlign: "center", padding: "8px 0", color: "#b4b2a9", fontSize: 20 }}>↓</div>

        {/* TO — mode tabs */}
        <div style={S.sectionLabel}>To account</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {(["customer", "external"] as const).map((m) => (
            <div
              key={m}
              onClick={() => { setToMode(m); setToId(""); setToSearch(""); }}
              style={{
                flex: 1, padding: "7px 0", borderRadius: 8, textAlign: "center",
                fontSize: 12, cursor: "pointer", transition: "all 0.15s",
                border: `1px solid ${toMode === m ? "#1d9e75" : "#e8e8e6"}`,
                background: toMode === m ? "#f0faf6" : "#fff",
                color: toMode === m ? "#0f6e56" : "#5f5e5a",
                fontWeight: toMode === m ? 500 : 400,
              }}
            >
              {m === "customer" ? "This customer's accounts" : "Another account"}
            </div>
          ))}
        </div>

        {toMode === "customer" && (
          <>
            {accounts.filter((a) => a.id !== fromId).map((acc) => (
              <AccountCard key={acc.id} account={acc} selected={toId === acc.id} onClick={() => setToId(acc.id)} />
            ))}
            {accounts.filter((a) => a.id !== fromId).length === 0 && (
              <div style={{ fontSize: 12, color: "#888780" }}>No other accounts for this customer.</div>
            )}
          </>
        )}

        {toMode === "external" && (
          <div>
            <label style={S.fieldLabel}>Search by account number or type</label>
            <input
              type="text"
              value={toSearch}
              onChange={(e) => setToSearch(e.target.value)}
              placeholder="e.g. BGSE0100001, savings..."
              style={{ ...S.input, marginBottom: 8 }}
              autoFocus
            />
            {toResults.length > 0 && (
              <div style={{ border: "1px solid #e8e8e6", borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
                {toResults.map((acc, i) => (
                  <div
                    key={acc.id}
                    onClick={() => { setToId(acc.id); setToSearch(""); setToResults([]); }}
                    style={{
                      padding: "10px 13px", cursor: "pointer",
                      background: toId === acc.id ? "#f0faf6" : i % 2 === 0 ? "#fff" : "#fafaf8",
                      borderBottom: i < toResults.length - 1 ? "1px solid #eeeeec" : "none",
                      display: "flex", alignItems: "center", gap: 10,
                      transition: "background 0.12s",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18", textTransform: "capitalize" }}>
                        {acc.account_type}
                      </div>
                      <div style={{ fontSize: 11, color: "#888780" }}>{acc.account_number}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#5f5e5a" }}>GHS {formatGHS(acc.balance)}</div>
                  </div>
                ))}
              </div>
            )}
            {toSearch.trim() && toResults.length === 0 && (
              <div style={{ fontSize: 12, color: "#888780", padding: "6px 0" }}>No matching accounts found.</div>
            )}
            {/* Show selected external account */}
            {toId && selectedToAccount && toMode === "external" && (
              <div style={{ border: "1px solid #1d9e75", borderRadius: 10, padding: "10px 13px", background: "#f0faf6", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1d9e75", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18", textTransform: "capitalize" }}>{selectedToAccount.account_type}</div>
                  <div style={{ fontSize: 11, color: "#888780" }}>{selectedToAccount.account_number}</div>
                </div>
                <button onClick={() => setToId("")} style={{ fontSize: 11, color: "#e24b4a", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer>
        <button style={S.cancelBtn} onClick={onClose}>Cancel</button>
        <PrimaryBtn onClick={onNext} disabled={!fromId || !toId}>
          Continue →
        </PrimaryBtn>
      </Footer>
    </>
  );
}

// ─── Page 2: Details ──────────────────────────────────────────────────────────

function PageDetails({
  reason, setReason,
  amount, setAmount,
  schedule, setSchedule,
  scheduledAt, setScheduledAt,
  recurringFreq, setRecurringFreq,
  narration, setNarration,
  onNext, onBack,
}: {
  reason: string; setReason: (v: string) => void;
  amount: string; setAmount: (v: string) => void;
  schedule: string; setSchedule: (v: string) => void;
  scheduledAt: string; setScheduledAt: (v: string) => void;
  recurringFreq: string; setRecurringFreq: (v: string) => void;
  narration: string; setNarration: (v: string) => void;
  onNext: () => void; onBack: () => void;
}) {
  const canContinue = !!reason && Number(amount) > 0;

  return (
    <>
      <div style={{ padding: "20px 24px", background: "#fff", overflowY: "auto", maxHeight: "60vh" }}>

        {/* Reason */}
        <div style={S.sectionLabel}>Transfer reason</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8, marginBottom: 16 }}>
          {REASONS.map((r) => (
            <div
              key={r.value}
              onClick={() => setReason(r.value)}
              style={{
                padding: "9px 6px", borderRadius: 10, textAlign: "center",
                cursor: "pointer", transition: "all 0.15s",
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

        {/* Amount */}
        <div style={S.sectionLabel}>Amount</div>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#888780", pointerEvents: "none" }}>
            GHS
          </span>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            style={{ ...S.input, paddingLeft: 46, fontSize: 20, fontWeight: 500 }}
          />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {QUICK_AMOUNTS.map((v) => (
            <div
              key={v}
              onClick={() => setAmount(String(v))}
              style={{
                padding: "4px 10px", borderRadius: 99, cursor: "pointer",
                border: `1px solid ${amount === String(v) ? "#1d9e75" : "#e8e8e6"}`,
                fontSize: 11,
                background: amount === String(v) ? "#f0faf6" : "#fafaf8",
                color: amount === String(v) ? "#0f6e56" : "#5f5e5a",
                transition: "all 0.12s",
              }}
            >
              {v.toLocaleString()}
            </div>
          ))}
        </div>

        {/* Schedule */}
        <div style={S.sectionLabel}>Schedule</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[["now", "Send now"], ["later", "Schedule later"], ["recurring", "Recurring"]].map(([val, lbl]) => (
            <div
              key={val}
              onClick={() => setSchedule(val)}
              style={{
                flex: 1, padding: 8, borderRadius: 8, textAlign: "center",
                cursor: "pointer", fontSize: 12, transition: "all 0.15s",
                border: `1px solid ${schedule === val ? "#1d9e75" : "#e8e8e6"}`,
                background: schedule === val ? "#f0faf6" : "#fff",
                color: schedule === val ? "#0f6e56" : "#5f5e5a",
                fontWeight: schedule === val ? 500 : 400,
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

        {/* Narration */}
        <label style={S.fieldLabel}>Narration / Note (optional)</label>
        <input
          type="text"
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
          placeholder="e.g. Monthly salary for March"
          style={S.input}
        />
      </div>

      <Footer>
        <button style={S.cancelBtn} onClick={onBack}>← Back</button>
        <PrimaryBtn onClick={onNext} disabled={!canContinue}>Continue →</PrimaryBtn>
      </Footer>
    </>
  );
}

// ─── Page 3: Notifications ────────────────────────────────────────────────────

function PageNotify({
  receiverOn, setReceiverOn, smsReceiver, setSmsReceiver,
  senderOn, setSenderOn, smsSender, setSmsSender,
  emailOn, setEmailOn,
  approvalOn, setApprovalOn,
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

        {/* RECEIVER first — priority */}
        <ToggleRow
          label="SMS — Receiver (priority)"
          sub="Notify the account being credited"
          on={receiverOn}
          onChange={() => setReceiverOn((v) => !v)}
        />
        {receiverOn && (
          <SmsBox id="sms-receiver" label="Receiver SMS template" value={smsReceiver} onChange={setSmsReceiver} />
        )}

        <ToggleRow
          label="SMS — Sender"
          sub="Notify the account being debited"
          on={senderOn}
          onChange={() => setSenderOn((v) => !v)}
        />
        {senderOn && (
          <SmsBox id="sms-sender" label="Sender SMS template" value={smsSender} onChange={setSmsSender} />
        )}

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

// ─── Page 4: Review ───────────────────────────────────────────────────────────

function PageReview({
  fromAccount, toAccount, toCustomer,
  amount, reason, schedule, narration,
  receiverOn, senderOn,
  onConfirm, onBack, loading, txRef,
}: {
  fromAccount?: Account;
  toAccount?: Account;
  toCustomer?: CustomerSearchResult | null;
  amount: string; reason: string; schedule: string; narration: string;
  receiverOn: boolean; senderOn: boolean;
  onConfirm: () => void; onBack: () => void;
  loading: boolean; txRef: string;
}) {
  const smsText = receiverOn && senderOn ? "Receiver & Sender" : receiverOn ? "Receiver only" : senderOn ? "Sender only" : "None";
  const schedMap: Record<string, string> = { now: "Immediate", later: "Scheduled", recurring: "Recurring" };

  const rows: [string, string, string?][] = [
    ["From",      fromAccount ? `${fromAccount.account_type} · ${fromAccount.account_number}` : "—"],
    ["To",        toAccount ? `${toAccount.account_type} · ${toAccount.account_number}` : "—"],
    ...(toCustomer ? [["Beneficiary", toCustomer.name] as [string, string]] : []),
    ["Reason",    reason],
    ["Schedule",  schedMap[schedule] ?? "Immediate"],
    ["Narration", narration || "—"],
    ["SMS alerts", smsText],
    ["Fee",       "Free", "#0f6e56"],
  ];

  return (
    <>
      <div style={{ padding: "20px 24px", background: "#fff", overflowY: "auto", maxHeight: "60vh" }}>
        {/* Big amount display */}
        <div style={{ textAlign: "center", padding: "18px 0", fontSize: 30, fontWeight: 500, color: "#1a1a18", background: "#fafaf8", borderRadius: 10, marginBottom: 12, border: "1px solid #eeeeec" }}>
          <span style={{ fontSize: 14, color: "#888780", verticalAlign: "super", marginRight: 4 }}>GHS</span>
          {formatGHS(parseFloat(amount || "0"))}
        </div>

        {rows.map(([label, val, color]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eeeeec", fontSize: 13 }}>
            <span style={{ color: "#888780" }}>{label}</span>
            <span style={{ fontWeight: 500, color: color ?? "#1a1a18", textTransform: label === "From" || label === "To" ? "capitalize" : undefined }}>{val}</span>
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", fontSize: 13 }}>
          <span style={{ fontSize: 12, color: "#888780" }}>Reference</span>
          <span style={{ fontSize: 11, fontFamily: "monospace", color: "#888780" }}>{txRef}</span>
        </div>

        {/* Warning if approval required */}
        <div style={{ marginTop: 8, padding: "8px 12px", background: "#faeeda", border: "1px solid #fac775", borderRadius: 8, fontSize: 12, color: "#854f0b" }}>
          ⚠ Please verify all details before confirming. Transfers cannot be reversed automatically.
        </div>
      </div>

      <Footer>
        <button style={S.cancelBtn} onClick={onBack}>← Back</button>
        <PrimaryBtn onClick={onConfirm} disabled={loading}>
          {loading
            ? <><Spinner /> Processing...</>
            : <><CheckIcon /> Confirm transfer</>}
        </PrimaryBtn>
      </Footer>
    </>
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

// ─── Page 5: Success ──────────────────────────────────────────────────────────

function PageSuccess({ txRef, onDone }: { txRef: string; onDone: () => void }) {
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
      <div>
        <PrimaryBtn onClick={onDone} style={{ margin: "0 auto", display: "inline-flex" }}>Done</PrimaryBtn>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function TransferModal({ isOpen, onClose }: TransferModalProps) {
  const { id: customerId } = useParams<{ id: string }>();
  const { accounts, allAccounts, refreshAccounts } = useAccounts();
  const { transferBetweenAccounts } = useTransactions();

  // ── Step ──
  const [step, setStep] = useState(1);
  const [txRef] = useState(generateRef);

  // ── Step 1: Accounts ──
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");

  // Resolve full account objects
  const fromAccount = accounts.find((a) => a.id === fromId);
  const toAccount = [...accounts, ...allAccounts].find((a) => a.id === toId);

  // ── Receiver customer lookup (from account number) ──
  const [toCustomer, setToCustomer] = useState<CustomerSearchResult | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);

  const lookupCustomer = useCallback(async (accountNumber: string) => {
    if (!accountNumber) { setToCustomer(null); return; }
    const baseNumber = getCustomerBaseNumber(accountNumber);
    if (!baseNumber) return;
    try {
      setCustomerLoading(true);
      const res = await fetch(
        `https://susu-pro-backend.onrender.com/api/customers/${companyId}/search?query=${baseNumber}`
      );
      const data = await res.json();
      console.log(data)
      const results: CustomerSearchResult[] = data.data ?? [];
      setToCustomer(results[0] ?? null);
    } catch {
      setToCustomer(null);
    } finally {
      setCustomerLoading(false);
    }
  }, []);

  // Trigger customer lookup whenever toAccount changes
  useEffect(() => {
    if (toAccount?.account_number) {
      lookupCustomer(toAccount.account_number);
    } else {
      setToCustomer(null);
    }
  }, [toAccount?.account_number, lookupCustomer]);

  // ── Step 2: Details ──
  const [reason, setReason] = useState("Account Transfer");
  const [amount, setAmount] = useState("");
  const [schedule, setSchedule] = useState("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [recurringFreq, setRecurringFreq] = useState("monthly");
  const [narration, setNarration] = useState("");

  // ── Step 3: Notifications ──
  const [receiverOn, setReceiverOn] = useState(true);   // receiver is PRIORITY
  const [smsReceiver, setSmsReceiver] = useState(SMS_RECEIVER_TEMPLATES["Account Transfer"]);
  const [senderOn, setSenderOn] = useState(false);
  const [smsSender, setSmsSender] = useState(SMS_SENDER_TEMPLATES["Account Transfer"]);
  const [emailOn, setEmailOn] = useState(true);
  const [approvalOn, setApprovalOn] = useState(false);

  // Keep templates in sync with reason
  const handleSetReason = (r: string) => {
    setReason(r);
    setSmsReceiver(SMS_RECEIVER_TEMPLATES[r] ?? SMS_RECEIVER_TEMPLATES["Other"]);
    setSmsSender(SMS_SENDER_TEMPLATES[r] ?? SMS_SENDER_TEMPLATES["Other"]);
  };

  // ── Step 4: Submit ──
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
      sms_receiver_name: toCustomer?.name,
      sms_receiver_id: toCustomer?.id,
      sms_receiver_phone: toCustomer?.phone_number,
      sms_receiver_account_number: toCustomer?.account_number,
      to_acc_type: toAccount?.account_type,
      to_acc: toAccount?.account_number,
      sms_sender: senderOn,
      sms_sender_template: senderOn ? smsSender : null,
      email_receipt: emailOn,
      requires_approval: approvalOn,
      reference: txRef,
    };

    try {
      const res = await transferBetweenAccounts(payload);
      if (res?.success) {
        await refreshAccounts(customerId ?? "");
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

  const handleDone = () => {
    onClose();
    setTimeout(resetState, 300);
  };

  const resetState = () => {
    setStep(1);
    setFromId(""); setToId(""); setToCustomer(null);
    setReason("Account Transfer"); setAmount(""); setSchedule("now");
    setScheduledAt(""); setRecurringFreq("monthly"); setNarration("");
    setReceiverOn(true); setSenderOn(false); setEmailOn(true); setApprovalOn(false);
    setSmsReceiver(SMS_RECEIVER_TEMPLATES["Account Transfer"]);
    setSmsSender(SMS_SENDER_TEMPLATES["Account Transfer"]);
    setErrorMsg("");
  };

  // Pre-select first account as "from" when accounts load
  useEffect(() => {
    if (accounts.length > 0 && !fromId) {
      setFromId(accounts[0].id);
    }
  }, [accounts, fromId]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      background: "rgba(0,0,0,0.35)", padding: "24px 16px", overflowY: "auto",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, border: "1px solid #e8e8e6",
        width: "100%", maxWidth: 520, overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        marginTop: 8,
      }}>

        {/* ── Header ── */}
        <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid #eeeeec", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#e1f5ee", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#0f6e56" strokeWidth="1.5">
                <path d="M2 8h12" /><polyline points="10,5 14,8 10,11" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#1a1a18" }}>Transfer Funds</div>
              <div style={{ fontSize: 12, color: "#888780", marginTop: 1 }}>Internal account transfer</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #e8e8e6", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888780", fontSize: 13 }}
          >
            ✕
          </button>
        </div>

        {/* ── Steps bar (hidden on success) ── */}
        {step < 5 && <StepsBar current={step} />}

        {/* ── Receiver customer preview banner ── */}
        {step < 5 && toAccount && (
          <div style={{ padding: "10px 24px", background: "#fafaf8", borderBottom: "1px solid #eeeeec", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e1f5ee", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#0f6e56" strokeWidth="1.4">
                <circle cx="7" cy="5" r="2.5" /><path d="M2 12c0-2.8 2.2-5 5-5s5 2.2 5 5" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              {customerLoading
                ? <div style={{ fontSize: 12, color: "#888780" }}>Looking up recipient...</div>
                : toCustomer
                  ? <>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18" }}>{toCustomer.name}</div>
                      <div style={{ fontSize: 11, color: "#888780" }}>{toCustomer.phone_number ?? ""} · {toAccount.account_number}</div>
                    </>
                  : <div style={{ fontSize: 12, color: "#888780" }}>{toAccount.account_type} · {toAccount.account_number}</div>
              }
            </div>
          </div>
        )}

        {/* ── Error banner ── */}
        {errorMsg && (
          <div style={{ padding: "10px 24px", background: "#fcebeb", borderBottom: "1px solid #f7c1c1", fontSize: 12, color: "#a32d2d", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#a32d2d" strokeWidth="1.5">
              <circle cx="7" cy="7" r="6" /><line x1="7" y1="4" x2="7" y2="8" /><circle cx="7" cy="10" r="0.6" fill="#a32d2d" />
            </svg>
            {errorMsg}
          </div>
        )}

        {/* ── Pages ── */}
        {step === 1 && (
          <PageAccounts
            accounts={accounts}
            allAccounts={allAccounts}
            fromId={fromId} setFromId={setFromId}
            toId={toId} setToId={setToId}
            onNext={() => setStep(2)} onClose={onClose}
          />
        )}

        {step === 2 && (
          <PageDetails
            reason={reason} setReason={handleSetReason}
            amount={amount} setAmount={setAmount}
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
            fromAccount={fromAccount}
            toAccount={toAccount}
            toCustomer={toCustomer}
            amount={amount} reason={reason}
            schedule={schedule} narration={narration}
            receiverOn={receiverOn} senderOn={senderOn}
            onConfirm={handleConfirm} onBack={() => setStep(3)}
            loading={loading} txRef={txRef}
          />
        )}

        {step === 5 && <PageSuccess txRef={txRef} onDone={handleDone} />}
      </div>
    </div>
  );
}