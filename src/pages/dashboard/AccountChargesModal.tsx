import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAccounts } from "../../contexts/dashboard/Account";
import { useTransactions } from "../../contexts/dashboard/Transactions";
import { companyId, userUUID } from "../../constants/appConstants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Account {
  id: string;
  account_type: string;
  account_number: string;
  balance: number;
  status: string;
  customer_id?: string;
}

interface ChargeType {
  value: string;
  label: string;
  icon: string;
  description: string;
  coaCode: string;
  color: string;        // tailwind bg class for the icon chip
  textColor: string;    // tailwind text class
  badgeBg: string;
}

interface AccountChargesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ─── Charge catalogue (mirrors backend CHARGE_COA_MAP) ───────────────────────

const CHARGE_TYPES: ChargeType[] = [
  {
    value: "commission",
    label: "Commission",
    icon: "💼",
    description: "Agent or staff commission deducted from client account.",
    coaCode: "4020",
    color: "#e1f5ee", textColor: "#0f6e56", badgeBg: "#c8f0e0",
  },
  {
    value: "service_fee",
    label: "Service Fee",
    icon: "⚙️",
    description: "Fee for account servicing, statement requests, or support.",
    coaCode: "4030-01",
    color: "#e6f1fb", textColor: "#185fa5", badgeBg: "#c6dff8",
  },
  {
    value: "maintenance_fee",
    label: "Maintenance Fee",
    icon: "🛠️",
    description: "Monthly or annual account maintenance charge.",
    coaCode: "4030-02",
    color: "#fdf4e3", textColor: "#854f0b", badgeBg: "#f8e0b0",
  },
  {
    value: "penalty",
    label: "Penalty",
    icon: "⚠️",
    description: "Late payment, early withdrawal, or contract breach penalty.",
    coaCode: "4040-01",
    color: "#fcebeb", textColor: "#a32d2d", badgeBg: "#f7c1c1",
  },
  {
    value: "processing_fee",
    label: "Processing Fee",
    icon: "📋",
    description: "Fee for processing a specific transaction or request.",
    coaCode: "4030-03",
    color: "#f3f0fc", textColor: "#5b4fcf", badgeBg: "#dbd5f8",
  },
  {
    value: "ledger_fee",
    label: "Ledger Fee",
    icon: "📒",
    description: "Administrative ledger or record-keeping fee.",
    coaCode: "4030-04",
    color: "#f0f9ff", textColor: "#0369a1", badgeBg: "#bae6fd",
  },
  {
    value: "insurance",
    label: "Insurance Premium",
    icon: "🛡️",
    description: "Insurance premium deducted from the account.",
    coaCode: "4050-01",
    color: "#f0faf6", textColor: "#166534", badgeBg: "#bbf7d0",
  },
  {
    value: "custom",
    label: "Custom Charge",
    icon: "✏️",
    description: "Any other charge not covered above. Requires description.",
    coaCode: "4090",
    color: "#f5f5f3", textColor: "#5f5e5a", badgeBg: "#e8e8e6",
  },
];

// ─── Shared style tokens ──────────────────────────────────────────────────────

const S = {
  sectionLabel: {
    fontSize: 11, fontWeight: 500, color: "#888780",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em", marginBottom: 10,
  },
  fieldLabel: {
    display: "block", fontSize: 12,
    color: "#5f5e5a", marginBottom: 6,
  },
  input: {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1px solid #d3d1c7", background: "#fff",
    color: "#1a1a18", fontSize: 13, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box" as const,
  } as React.CSSProperties,
  cancelBtn: {
    padding: "8px 16px", borderRadius: 8,
    border: "1px solid #e8e8e6", background: "#fff",
    fontSize: 13, color: "#5f5e5a",
    cursor: "pointer", fontFamily: "inherit",
  } as React.CSSProperties,
};

const formatGHS = (n: number | string) =>
  Number(n).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ─── Micro-components ─────────────────────────────────────────────────────────

function PrimaryBtn({
  onClick, children, disabled, danger, style,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  style?: React.CSSProperties;
}) {
  const bg = disabled ? "#b4b2a9" : danger ? "#dc2626" : "#1d9e75";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 20px", borderRadius: 8, border: "none",
        background: bg, color: "white", fontSize: 13,
        fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit", display: "flex",
        alignItems: "center", gap: 6,
        transition: "background 0.15s", ...style,
      }}
    >
      {children}
    </button>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: "16px 24px", borderTop: "1px solid #eeeeec",
      display: "flex", gap: 8, justifyContent: "flex-end",
      background: "#fff",
    }}>
      {children}
    </div>
  );
}

function StepsBar({ current }: { current: number }) {
  const steps = ["Account", "Charge", "Confirm"];
  return (
    <div style={{
      display: "flex", padding: "14px 24px",
      borderBottom: "1px solid #eeeeec", background: "#fafaf8",
    }}>
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
              <span style={{
                fontSize: 11,
                color: active ? "#1a1a18" : done ? "#0f6e56" : "#888780",
                fontWeight: active ? 500 : 400,
              }}>
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

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
      stroke="white" strokeWidth="2"
      style={{ animation: "spin 0.8s linear infinite" }}>
      <circle cx="7" cy="7" r="5" strokeDasharray="20 12" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

// ─── Page 1: Account Selection ────────────────────────────────────────────────

function PageAccount({
  accounts,
  selectedId,
  onSelect,
  onNext,
  onClose,
}: {
  accounts: Account[];
  selectedId: string;
  onSelect: (id: string) => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const selected = accounts.find(a => a.id === selectedId);

  return (
    <>
      <div style={{
        padding: "20px 24px", background: "#fff",
        overflowY: "auto", maxHeight: "60vh",
      }}>
        <div style={S.sectionLabel}>Select account to charge</div>

        {accounts.length === 0 && (
          <div style={{ fontSize: 13, color: "#888780", padding: "12px 0" }}>
            No active accounts found for this customer.
          </div>
        )}

        {accounts.map((acc) => {
          const isSelected = selectedId === acc.id;
          const isInactive = acc.status === "Inactive";

          const typeColors: Record<string, string> = {
            susu: "#1d9e75", savings: "#378add", current: "#ba7517",
            loan: "#d4537e", investment: "#7f77dd",
            fixed_deposit: "#0f6e56", treasury_bill: "#0369a1",
          };
          const dot = typeColors[acc.account_type?.toLowerCase()] ?? "#888780";

          return (
            <div
              key={acc.id}
              onClick={() => !isInactive && onSelect(acc.id)}
              style={{
                border: `1px solid ${isSelected ? "#1d9e75" : isInactive ? "#f0e8e8" : "#e8e8e6"}`,
                borderRadius: 10, padding: "13px 16px", marginBottom: 8,
                display: "flex", alignItems: "center", gap: 12,
                cursor: isInactive ? "not-allowed" : "pointer",
                background: isSelected ? "#f0faf6" : isInactive ? "#fffafa" : "#fff",
                opacity: isInactive ? 0.6 : 1,
                transition: "all 0.15s",
              }}
            >
              {/* Colour dot */}
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                flexShrink: 0, background: dot,
              }} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 500, color: "#1a1a18",
                  textTransform: "capitalize",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  {acc.account_type}
                  {isInactive && (
                    <span style={{
                      fontSize: 10, color: "#a32d2d",
                      background: "#fcebeb", padding: "1px 6px",
                      borderRadius: 99, fontWeight: 400,
                    }}>Inactive</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#888780", marginTop: 2, fontFamily: "monospace" }}>
                  {acc.account_number}
                </div>
              </div>

              {/* Balance */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: Number(acc.balance) > 0 ? "#1a1a18" : "#e24b4a",
                }}>
                  GHS {formatGHS(acc.balance)}
                </div>
                <div style={{ fontSize: 10, color: "#b4b2a9", marginTop: 2 }}>available</div>
              </div>

              {/* Checkmark */}
              {isSelected && (
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: "#1d9e75", display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <svg width="9" height="9" viewBox="0 0 10 10"
                    fill="none" stroke="white" strokeWidth="2">
                    <polyline points="2,5 4,7.5 8,3" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}

        {/* Balance warning */}
        {selected && (
          <div style={{
            marginTop: 12, padding: "9px 14px",
            background: "#fafaf8", border: "1px solid #e8e8e6",
            borderRadius: 8, fontSize: 12, color: "#5f5e5a",
          }}>
            Charging{" "}
            <strong style={{ textTransform: "capitalize" }}>{selected.account_type}</strong>{" "}
            account · Available balance:{" "}
            <strong style={{ color: "#1d9e75" }}>GHS {formatGHS(selected.balance)}</strong>
          </div>
        )}
      </div>

      <Footer>
        <button style={S.cancelBtn} onClick={onClose}>Cancel</button>
        <PrimaryBtn onClick={onNext} disabled={!selectedId}>
          Continue →
        </PrimaryBtn>
      </Footer>
    </>
  );
}

// ─── Page 2: Charge Details ───────────────────────────────────────────────────

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];

function PageCharge({
  account,
  chargeTypeValue,
  setChargeTypeValue,
  amount,
  setAmount,
  description,
  setDescription,
  chargeDate,
  setChargeDate,
  onNext,
  onBack,
}: {
  account: Account | undefined;
  chargeTypeValue: string;
  setChargeTypeValue: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  chargeDate: string;
  setChargeDate: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const numAmount = parseFloat(amount) || 0;
  const selectedType = CHARGE_TYPES.find(c => c.value === chargeTypeValue);
  const balance = Number(account?.balance ?? 0);
  const exceedsBalance = numAmount > balance;
  const isCustom = chargeTypeValue === "custom";
  const canContinue =
    !!chargeTypeValue &&
    numAmount > 0 &&
    !exceedsBalance &&
    (isCustom ? description.trim().length > 3 : true);

  return (
    <>
      <div style={{
        padding: "20px 24px", background: "#fff",
        overflowY: "auto", maxHeight: "60vh",
      }}>

        {/* Charge type grid */}
        <div style={S.sectionLabel}>Charge type</div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8, marginBottom: 20,
        }}>
          {CHARGE_TYPES.map((ct) => {
            const isSelected = chargeTypeValue === ct.value;
            return (
              <div
                key={ct.value}
                onClick={() => setChargeTypeValue(ct.value)}
                title={ct.description}
                style={{
                  border: `1.5px solid ${isSelected ? "#1d9e75" : "#e8e8e6"}`,
                  borderRadius: 10, padding: "10px 8px",
                  textAlign: "center", cursor: "pointer",
                  background: isSelected ? "#f0faf6" : "#fff",
                  transition: "all 0.15s",
                  position: "relative",
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 5 }}>{ct.icon}</div>
                <div style={{
                  fontSize: 10, fontWeight: 500, lineHeight: 1.3,
                  color: isSelected ? "#0f6e56" : "#5f5e5a",
                }}>
                  {ct.label}
                </div>
                {isSelected && (
                  <div style={{
                    position: "absolute", top: 6, right: 6,
                    width: 14, height: 14, borderRadius: "50%",
                    background: "#1d9e75",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="7" height="7" viewBox="0 0 10 10"
                      fill="none" stroke="white" strokeWidth="2">
                      <polyline points="2,5 4,7.5 8,3" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected type description */}
        {selectedType && (
          <div style={{
            marginBottom: 18, padding: "9px 14px",
            background: selectedType.color,
            border: `1px solid ${selectedType.badgeBg}`,
            borderRadius: 8, fontSize: 12,
            color: selectedType.textColor,
          }}>
            <strong>{selectedType.label}</strong> · COA {selectedType.coaCode}
            {" — "}{selectedType.description}
          </div>
        )}

        {/* Amount */}
        <div style={S.sectionLabel}>Charge amount</div>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <span style={{
            position: "absolute", left: 12,
            top: "50%", transform: "translateY(-50%)",
            fontSize: 13, color: "#888780", pointerEvents: "none",
          }}>
            GHS
          </span>
          <input
            type="number" min="0" step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            style={{
              ...S.input, paddingLeft: 46,
              fontSize: 22, fontWeight: 500,
              borderColor: exceedsBalance ? "#e24b4a" : "#d3d1c7",
            }}
          />
        </div>

        {/* Balance validation */}
        {exceedsBalance && (
          <div style={{
            fontSize: 11, color: "#e24b4a",
            marginBottom: 8, display: "flex", alignItems: "center", gap: 4,
          }}>
            <svg width="12" height="12" viewBox="0 0 14 14"
              fill="none" stroke="#e24b4a" strokeWidth="1.5">
              <circle cx="7" cy="7" r="6" />
              <line x1="7" y1="4" x2="7" y2="8" />
              <circle cx="7" cy="10" r="0.6" fill="#e24b4a" />
            </svg>
            Charge exceeds available balance of GHS {formatGHS(balance)}
          </div>
        )}

        {/* Remaining balance preview */}
        {numAmount > 0 && !exceedsBalance && account && (
          <div style={{
            fontSize: 11, color: "#5f9e8a", marginBottom: 10,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <svg width="12" height="12" viewBox="0 0 14 14"
              fill="none" stroke="#1d9e75" strokeWidth="1.5">
              <polyline points="2,7 5.5,10.5 12,3" />
            </svg>
            Balance after charge:{" "}
            <strong style={{ color: "#0f6e56" }}>
              GHS {formatGHS(balance - numAmount)}
            </strong>
          </div>
        )}

        {/* Quick amounts */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {QUICK_AMOUNTS.map(v => (
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

        {/* Description */}
        <div style={{ marginBottom: 14 }}>
          <label style={S.fieldLabel}>
            Description{isCustom ? " (required)" : " (optional)"}
          </label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={
              isCustom
                ? "Describe the charge reason…"
                : "e.g. March commission, late payment penalty…"
            }
            style={{
              ...S.input,
              borderColor: isCustom && !description.trim() ? "#f0c96a" : "#d3d1c7",
            }}
          />
          {isCustom && !description.trim() && (
            <div style={{ fontSize: 11, color: "#b07a20", marginTop: 4 }}>
              Description is required for custom charges.
            </div>
          )}
        </div>

        {/* Charge date */}
        <div>
          <label style={S.fieldLabel}>Charge date</label>
          <input
            type="date"
            value={chargeDate}
            onChange={e => setChargeDate(e.target.value)}
            style={S.input}
          />
        </div>
      </div>

      <Footer>
        <button style={S.cancelBtn} onClick={onBack}>← Back</button>
        <PrimaryBtn onClick={onNext} disabled={!canContinue} danger={false}>
          Review charge →
        </PrimaryBtn>
      </Footer>
    </>
  );
}

// ─── Page 3: Review & Confirm ─────────────────────────────────────────────────

function PageReview({
  account,
  chargeType,
  amount,
  description,
  chargeDate,
  onConfirm,
  onBack,
  loading,
}: {
  account: Account | undefined;
  chargeType: ChargeType | undefined;
  amount: string;
  description: string;
  chargeDate: string;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  const numAmount  = parseFloat(amount) || 0;
  const newBalance = Number(account?.balance ?? 0) - numAmount;

  const rows: [string, string, string?][] = [
    ["Account",      account ? `${account.account_type} · ${account.account_number}` : "—"],
    ["Charge Type",  chargeType?.label ?? "—"],
    ["COA Code",     chargeType?.coaCode ?? "—"],
    ["Amount",       `GHS ${formatGHS(numAmount)}`,  "#a32d2d"],
    ["New Balance",  `GHS ${formatGHS(newBalance)}`, newBalance >= 0 ? "#0f6e56" : "#e24b4a"],
    ["Date",         chargeDate || new Date().toISOString().slice(0, 10)],
    ["Description",  description || "—"],
  ];

  return (
    <>
      <div style={{
        padding: "20px 24px", background: "#fff",
        overflowY: "auto", maxHeight: "60vh",
      }}>

        {/* Charge amount hero */}
        <div style={{
          textAlign: "center", padding: "18px 0", marginBottom: 14,
          background: "#fffafa",
          border: "1px solid #f7c1c1",
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 30, marginBottom: 4 }}>{chargeType?.icon ?? "💳"}</div>
          <div style={{ fontSize: 11, color: "#888780", marginBottom: 4 }}>Applying charge</div>
          <div style={{ fontSize: 30, fontWeight: 600, color: "#dc2626" }}>
            <span style={{ fontSize: 14, color: "#888780", verticalAlign: "super", marginRight: 4 }}>
              GHS
            </span>
            {formatGHS(numAmount)}
          </div>
          <div style={{ fontSize: 12, color: "#888780", marginTop: 4 }}>
            {chargeType?.label}
          </div>
        </div>

        {/* Detail rows */}
        {rows.map(([label, val, color]) => (
          <div
            key={label}
            style={{
              display: "flex", justifyContent: "space-between",
              padding: "9px 0", borderBottom: "1px solid #eeeeec",
              fontSize: 13,
            }}
          >
            <span style={{ color: "#888780" }}>{label}</span>
            <span style={{
              fontWeight: 500,
              color: color ?? "#1a1a18",
              textTransform: label === "Account" ? "capitalize" : undefined,
            }}>
              {val}
            </span>
          </div>
        ))}

        {/* Journal entry preview */}
        <div style={{
          marginTop: 14, padding: "12px 14px",
          background: "#fafaf8", border: "1px solid #e8e8e6",
          borderRadius: 10,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: "#888780",
            textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8,
          }}>
            Journal Entry Preview
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "#5f5e5a" }}>
                Dr Deposit Liability{" "}
                <span style={{ fontFamily: "monospace", color: "#888780" }}>
                  ({account?.account_type ?? "…"})
                </span>
              </span>
              <span style={{ fontWeight: 500, color: "#1a1a18" }}>
                GHS {formatGHS(numAmount)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "#5f5e5a" }}>
                Cr Income{" "}
                <span style={{ fontFamily: "monospace", color: "#888780" }}>
                  ({chargeType?.coaCode})
                </span>
              </span>
              <span style={{ fontWeight: 500, color: "#1d9e75" }}>
                GHS {formatGHS(numAmount)}
              </span>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 12, padding: "8px 12px",
          background: "#faeeda", border: "1px solid #fac775",
          borderRadius: 8, fontSize: 12, color: "#854f0b",
        }}>
          ⚠ Charges are recorded immediately and deducted from the client's account.
          A reversal is available but requires manager authorisation.
        </div>
      </div>

      <Footer>
        <button style={S.cancelBtn} onClick={onBack}>← Back</button>
        <PrimaryBtn onClick={onConfirm} disabled={loading} danger={!loading}>
          {loading
            ? <><Spinner /> Applying…</>
            : <>
                <svg width="12" height="12" viewBox="0 0 14 14"
                  fill="none" stroke="white" strokeWidth="2">
                  <polyline points="2,7 5.5,10.5 12,3" />
                </svg>
                Apply Charge
              </>
          }
        </PrimaryBtn>
      </Footer>
    </>
  );
}

// ─── Page 4: Success ──────────────────────────────────────────────────────────

function PageSuccess({
  chargeType,
  amount,
  account,
  onDone,
  onChargeAnother,
}: {
  chargeType: ChargeType | undefined;
  amount: string;
  account: Account | undefined;
  onDone: () => void;
  onChargeAnother: () => void;
}) {
  return (
    <div style={{ padding: "36px 24px", textAlign: "center", background: "#fff" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{chargeType?.icon ?? "💳"}</div>
      <div style={{
        width: 52, height: 52, borderRadius: "50%",
        background: "#fcebeb",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px",
      }}>
        <svg width="24" height="24" viewBox="0 0 28 28"
          fill="none" stroke="#dc2626" strokeWidth="2.2">
          <polyline points="5,14 11,20 23,8" />
        </svg>
      </div>
      <div style={{
        fontSize: 16, fontWeight: 600, color: "#1a1a18", marginBottom: 6,
      }}>
        Charge Applied
      </div>
      <div style={{ fontSize: 13, color: "#888780", marginBottom: 4 }}>
        <strong style={{ color: "#dc2626" }}>GHS {formatGHS(parseFloat(amount) || 0)}</strong>
        {" "}{chargeType?.label ?? "charge"} deducted from{" "}
        <strong style={{ textTransform: "capitalize" }}>
          {account?.account_type}
        </strong>{" "}account.
      </div>
      <div style={{
        fontSize: 11, fontFamily: "monospace", color: "#888780",
        background: "#fafaf8", border: "1px solid #e8e8e6",
        padding: "7px 14px", borderRadius: 8,
        display: "inline-block", marginBottom: 28,
      }}>
        {account?.account_number}
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button
          onClick={onChargeAnother}
          style={{
            ...S.cancelBtn,
            fontSize: 13, fontWeight: 500,
          }}
        >
          + Another charge
        </button>
        <PrimaryBtn onClick={onDone} style={{ display: "inline-flex" }}>
          Done
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function AccountChargesModal({
  isOpen,
  onClose,
  onSuccess,
}: AccountChargesModalProps) {
  const { id: customerId } = useParams<{ id: string }>();
  const { accounts, refreshAccounts } = useAccounts();
  const { fetchCustomerTransactions } = useTransactions();

  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [errorMsg, setErrorMsg]   = useState("");

  // Step 1
  const [accountId, setAccountId] = useState("");

  // Step 2
  const [chargeTypeValue, setChargeTypeValue] = useState("");
  const [amount, setAmount]                   = useState("");
  const [description, setDescription]         = useState("");
  const [chargeDate, setChargeDate]           = useState(
    new Date().toISOString().slice(0, 10)
  );

  const account    = accounts.find(a => a.id === accountId);
  const chargeType = CHARGE_TYPES.find(c => c.value === chargeTypeValue);

  const handleConfirm = useCallback(async () => {
    if (!accountId || !chargeTypeValue || !amount) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(
        `https://susu-pro-backend.onrender.com/api/charges/${accountId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            charge_type:  chargeTypeValue,
            amount:       parseFloat(amount),
            description:  description || undefined,
            company_id:   companyId,
            created_by:   userUUID,
            charge_date:  chargeDate,
          }),
        }
      );
      const data = await res.json();

      if (data.success) {
        // Refresh accounts + transactions so UI reflects new balance & tx
        await Promise.all([
          refreshAccounts(customerId ?? ""),
          fetchCustomerTransactions(customerId ?? ""),
        ]);
        if (onSuccess) onSuccess();
        setStep(4);
      } else {
        setErrorMsg(data.message ?? "Failed to apply charge.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message ?? "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [accountId, chargeTypeValue, amount, description, chargeDate,
      customerId, refreshAccounts, fetchCustomerTransactions, onSuccess]);

  const resetState = () => {
    setStep(1);
    setAccountId(""); setChargeTypeValue(""); setAmount("");
    setDescription(""); setChargeDate(new Date().toISOString().slice(0, 10));
    setErrorMsg("");
  };

  const handleDone = () => { onClose(); setTimeout(resetState, 300); };
  const handleChargeAnother = () => resetState();

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      background: "rgba(0,0,0,0.35)", padding: "24px 16px", overflowY: "auto",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16,
        border: "1px solid #e8e8e6",
        width: "100%", maxWidth: 500,
        overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        marginTop: 8,
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: "18px 24px 14px",
          borderBottom: "1px solid #eeeeec",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", background: "#fff",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: "#fcebeb",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16"
                fill="none" stroke="#dc2626" strokeWidth="1.5">
                <rect x="1.5" y="3" width="13" height="10" rx="2" />
                <line x1="1.5" y1="6.5" x2="14.5" y2="6.5" />
                <circle cx="5" cy="10" r="1" fill="#dc2626" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#1a1a18" }}>
                Apply Account Charge
              </div>
              <div style={{ fontSize: 12, color: "#888780", marginTop: 1 }}>
                Commissions, fees, penalties & more
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8,
              border: "1px solid #e8e8e6", background: "#fff",
              cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "#888780", fontSize: 13,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Steps bar (hidden on success) ── */}
        {step < 4 && <StepsBar current={step} />}

        {/* ── Account/charge preview banner (steps 2–3) ── */}
        {step >= 2 && step < 4 && account && (
          <div style={{
            padding: "9px 24px",
            background: "#fafaf8",
            borderBottom: "1px solid #eeeeec",
            display: "flex", alignItems: "center", gap: 8, fontSize: 12,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#dc2626", flexShrink: 0, display: "inline-block",
            }} />
            <span style={{ color: "#5f5e5a", textTransform: "capitalize" }}>
              {account.account_type}
            </span>
            <span style={{ color: "#b4b2a9" }}>·</span>
            <span style={{ fontFamily: "monospace", color: "#888780", fontSize: 11 }}>
              {account.account_number}
            </span>
            <span style={{ color: "#b4b2a9" }}>·</span>
            <span style={{ color: "#0f6e56", fontWeight: 500 }}>
              GHS {formatGHS(account.balance)}
            </span>
          </div>
        )}

        {/* ── Error banner ── */}
        {errorMsg && (
          <div style={{
            padding: "10px 24px", background: "#fcebeb",
            borderBottom: "1px solid #f7c1c1",
            fontSize: 12, color: "#a32d2d",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14"
              fill="none" stroke="#a32d2d" strokeWidth="1.5">
              <circle cx="7" cy="7" r="6" />
              <line x1="7" y1="4" x2="7" y2="8" />
              <circle cx="7" cy="10" r="0.6" fill="#a32d2d" />
            </svg>
            {errorMsg}
          </div>
        )}

        {/* ── Pages ── */}
        {step === 1 && (
          <PageAccount
            accounts={accounts}
            selectedId={accountId}
            onSelect={setAccountId}
            onNext={() => setStep(2)}
            onClose={onClose}
          />
        )}

        {step === 2 && (
          <PageCharge
            account={account}
            chargeTypeValue={chargeTypeValue}
            setChargeTypeValue={setChargeTypeValue}
            amount={amount}
            setAmount={setAmount}
            description={description}
            setDescription={setDescription}
            chargeDate={chargeDate}
            setChargeDate={setChargeDate}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <PageReview
            account={account}
            chargeType={chargeType}
            amount={amount}
            description={description}
            chargeDate={chargeDate}
            onConfirm={handleConfirm}
            onBack={() => setStep(2)}
            loading={loading}
          />
        )}

        {step === 4 && (
          <PageSuccess
            chargeType={chargeType}
            amount={amount}
            account={account}
            onDone={handleDone}
            onChargeAnother={handleChargeAnother}
          />
        )}
      </div>
    </div>
  );
}
