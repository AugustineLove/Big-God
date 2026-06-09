import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAccounts } from "../../contexts/dashboard/Account";
import { companyId, makeSuSuProName, userUUID } from "../../constants/appConstants";
import { useTransactions } from "../../contexts/dashboard/Transactions";
// ─── Types ────────────────────────────────────────────────────────────────────

interface Account {
  id: string;
  account_type: string;
  account_number: string;
  balance: number;
  status: string;
  customer_id?: string;
  sms_enabled?: boolean;
  sms_numbers?: string[];
}

interface Customer {
  id?: string;
  name?: string;
  phone_number?: string;
}

interface InvestmentProduct {
  id: string;
  name: string;
  icon: string;
  description: string;
  min_amount: number;
  min_term_months: number;
  max_term_months: number | null;
  default_rate: number;
  rate_type: string;
  early_withdrawal_penalty: number;
  auto_rollover: boolean;
}

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Pass the customer object so we can personalise the SMS */
  customer?: Customer | null;
  /** Your company's display name for the SMS sender field */
  parentCompanyName?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { value: "cash",          label: "Cash",           icon: "💵" },
  { value: "momo",          label: "Mobile Money",   icon: "📱" },
  { value: "bank_transfer", label: "Bank Transfer",  icon: "🏦" },
  { value: "cheque",        label: "Cheque",         icon: "📋" },
];

const TERM_PRESETS: Record<string, { label: string; months: number }[]> = {
  fixed_deposit:   [
    { label: "1 mo",  months: 1  },
    { label: "3 mo",  months: 3  },
    { label: "6 mo",  months: 6  },
    { label: "12 mo", months: 12 },
    { label: "24 mo", months: 24 },
  ],
  treasury_bill:   [
    { label: "91 days",  months: 3  },
    { label: "182 days", months: 6  },
    { label: "364 days", months: 12 },
  ],
  susu_plus:       [
    { label: "6 mo",  months: 6  },
    { label: "12 mo", months: 12 },
    { label: "24 mo", months: 24 },
  ],
  investment_bond: [
    { label: "1 yr",  months: 12 },
    { label: "2 yrs", months: 24 },
    { label: "3 yrs", months: 36 },
    { label: "5 yrs", months: 60 },
  ],
  money_market:    [
    { label: "Open-ended", months: 0 },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatGHS = (n: number | string) =>
  Number(n).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const generateRef = () =>
  `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`;

function calcReturns(principal: number, ratePercent: number, termMonths: number) {
  if (!principal || !ratePercent || !termMonths) return { interest: 0, maturityValue: principal || 0 };
  const interest = principal * (ratePercent / 100) * (termMonths / 12);
  return {
    interest:      parseFloat(interest.toFixed(2)),
    maturityValue: parseFloat((principal + interest).toFixed(2)),
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GH", { year: "numeric", month: "short", day: "numeric" });
}

function addMonths(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

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
    boxSizing: "border-box" as const,
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
    >{children}</button>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "16px 24px", borderTop: "1px solid #eeeeec", display: "flex", gap: 8, justifyContent: "flex-end", background: "#fff" }}>
      {children}
    </div>
  );
}

function StepsBar({ current }: { current: number }) {
  const steps = ["Product", "Amount", "Funding", "Review"];
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

// ─── Returns Summary Card ─────────────────────────────────────────────────────

function ReturnsSummary({
  principal, rate, termMonths, product,
}: {
  principal: number; rate: number; termMonths: number; product?: InvestmentProduct | null;
}) {
  const { interest, maturityValue } = calcReturns(principal, rate, termMonths);
  const maturityDate = termMonths > 0 ? addMonths(termMonths) : null;

  if (!principal || !rate) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, #f0faf6 0%, #e8f8f2 100%)",
      border: "1px solid #b8e8d6", borderRadius: 12,
      padding: "14px 16px", marginTop: 14,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#0f6e56", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
        Projected Returns
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { label: "Principal",    value: `GHS ${formatGHS(principal)}`,     accent: false },
          { label: "Interest",     value: `GHS ${formatGHS(interest)}`,       accent: true  },
          { label: "At Maturity",  value: `GHS ${formatGHS(maturityValue)}`,  accent: true  },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#5f9e8a", marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: accent ? "#0f6e56" : "#1a1a18" }}>
              {value}
            </div>
          </div>
        ))}
      </div>
      {maturityDate && (
        <div style={{
          marginTop: 10, paddingTop: 10, borderTop: "1px solid #c8e8d8",
          fontSize: 11, color: "#5f9e8a", textAlign: "center",
        }}>
          📅 Matures on <strong style={{ color: "#0f6e56" }}>{formatDate(maturityDate.toISOString())}</strong>
          {" "}({termMonths} {termMonths === 1 ? "month" : "months"})
        </div>
      )}
      {product?.early_withdrawal_penalty && product.early_withdrawal_penalty > 0 && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#a05f20", background: "#fdf4e3", border: "1px solid #f0d49a", borderRadius: 6, padding: "5px 8px" }}>
          ⚠ Early withdrawal penalty: {product.early_withdrawal_penalty}% of principal
        </div>
      )}
    </div>
  );
}

// ─── Page 1: Product Selection ────────────────────────────────────────────────

const PRODUCTS: InvestmentProduct[] = [
  {
    id: "fixed_deposit",   name: "Fixed Deposit",    icon: "🔒",
    description: "Lock funds for a fixed term and earn guaranteed interest.",
    min_amount: 500, min_term_months: 1, max_term_months: 60,
    default_rate: 18, rate_type: "fixed", early_withdrawal_penalty: 2.5, auto_rollover: false,
  },
  {
    id: "treasury_bill",   name: "Treasury Bill",    icon: "📜",
    description: "Government-backed short-term securities via your MFI.",
    min_amount: 1000, min_term_months: 3, max_term_months: 12,
    default_rate: 22, rate_type: "fixed", early_withdrawal_penalty: 0, auto_rollover: false,
  },
  {
    id: "susu_plus",       name: "Susu Plus",         icon: "📈",
    description: "Enhanced Susu with bonus interest on milestones.",
    min_amount: 100, min_term_months: 6, max_term_months: 24,
    default_rate: 15, rate_type: "tiered", early_withdrawal_penalty: 1, auto_rollover: true,
  },
  {
    id: "investment_bond", name: "Investment Bond",   icon: "🏛️",
    description: "Medium-to-long term bond with quarterly interest payments.",
    min_amount: 5000, min_term_months: 12, max_term_months: 120,
    default_rate: 24, rate_type: "compound", early_withdrawal_penalty: 5, auto_rollover: false,
  },
  {
    id: "money_market",    name: "Money Market",      icon: "💹",
    description: "Flexible high-yield account with 30-day notice withdrawal.",
    min_amount: 2000, min_term_months: 0, max_term_months: null,
    default_rate: 20, rate_type: "variable", early_withdrawal_penalty: 0, auto_rollover: true,
  },
];

function PageProduct({
  selected, onSelect, onNext, onClose,
}: {
  selected: string; onSelect: (id: string) => void; onNext: () => void; onClose: () => void;
}) {
  const selectedProduct = PRODUCTS.find(p => p.id === selected);

  return (
    <>
      <div style={{ padding: "20px 24px", background: "#fff", overflowY: "auto", maxHeight: "62vh" }}>
        <div style={S.sectionLabel}>Choose investment type</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PRODUCTS.map((p) => {
            const isSelected = selected === p.id;
            return (
              <div
                key={p.id}
                onClick={() => onSelect(p.id)}
                style={{
                  border: `1px solid ${isSelected ? "#1d9e75" : "#e8e8e6"}`,
                  borderRadius: 12, padding: "14px 16px",
                  cursor: "pointer", transition: "all 0.15s",
                  background: isSelected ? "#f0faf6" : "#fff",
                  display: "flex", alignItems: "center", gap: 14,
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: isSelected ? "#d4f0e5" : "#f5f5f3",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20,
                }}>
                  {p.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: isSelected ? "#0f6e56" : "#1a1a18" }}>
                      {p.name}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: "#1d9e75",
                      background: "#e1f5ee", padding: "2px 8px", borderRadius: 99,
                    }}>
                      {p.default_rate}% p.a.
                    </span>
                    {p.auto_rollover && (
                      <span style={{
                        fontSize: 10, color: "#378add", background: "#e6f1fb",
                        padding: "2px 7px", borderRadius: 99, border: "1px solid #b5d4f4",
                      }}>
                        Auto-rollover
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#888780", marginTop: 3 }}>{p.description}</div>
                  <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: "#5f5e5a" }}>
                      Min: <strong>GHS {p.min_amount.toLocaleString()}</strong>
                    </span>
                    {p.min_term_months > 0 && (
                      <span style={{ fontSize: 11, color: "#5f5e5a" }}>
                        Term: <strong>{p.min_term_months}–{p.max_term_months ?? "∞"} mo</strong>
                      </span>
                    )}
                    {p.early_withdrawal_penalty > 0 && (
                      <span style={{ fontSize: 11, color: "#a05f20" }}>
                        Penalty: <strong>{p.early_withdrawal_penalty}%</strong>
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", background: "#1d9e75",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.8">
                      <polyline points="2,5 4,7.5 8,3" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <Footer>
        <button style={S.cancelBtn} onClick={onClose}>Cancel</button>
        <PrimaryBtn onClick={onNext} disabled={!selected}>
          Continue →
        </PrimaryBtn>
      </Footer>
    </>
  );
}

// ─── Page 2: Amount & Terms ───────────────────────────────────────────────────

function PageAmount({
  product, amount, setAmount,
  rate, setRate,
  termMonths, setTermMonths,
  autoRollover, setAutoRollover,
  narration, setNarration,
  onNext, onBack,
}: {
  product: InvestmentProduct | null;
  amount: string; setAmount: (v: string) => void;
  rate: string; setRate: (v: string) => void;
  termMonths: number; setTermMonths: (v: number) => void;
  autoRollover: boolean; setAutoRollover: (v: boolean) => void;
  narration: string; setNarration: (v: string) => void;
  onNext: () => void; onBack: () => void;
}) {
  const numAmount = parseFloat(amount) || 0;
  const numRate = parseFloat(rate) || 0;

  const canContinue =
    numAmount >= (product?.min_amount ?? 0) &&
    numRate > 0 &&
    (product?.min_term_months === 0 || termMonths >= (product?.min_term_months ?? 1));

  const termPresets = product ? (TERM_PRESETS[product.id] ?? []) : [];

  const quickAmounts = product
    ? [product.min_amount, product.min_amount * 2, product.min_amount * 5, product.min_amount * 10]
    : [];

  return (
    <>
      <div style={{ padding: "20px 24px", background: "#fff", overflowY: "auto", maxHeight: "62vh" }}>

        {/* Product recap */}
        {product && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#fafaf8", border: "1px solid #e8e8e6",
            borderRadius: 10, padding: "10px 14px", marginBottom: 18,
          }}>
            <span style={{ fontSize: 20 }}>{product.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a18" }}>{product.name}</div>
              <div style={{ fontSize: 11, color: "#888780" }}>
                Min: GHS {product.min_amount.toLocaleString()} · Default rate: {product.default_rate}% p.a.
              </div>
            </div>
          </div>
        )}

        {/* Amount */}
        <div style={S.sectionLabel}>Principal amount</div>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#888780", pointerEvents: "none" }}>
            GHS
          </span>
          <input
            type="number" min="0" value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Min: ${product?.min_amount?.toLocaleString() ?? "0"}`}
            style={{ ...S.input, paddingLeft: 46, fontSize: 22, fontWeight: 500 }}
          />
        </div>
        {product && numAmount > 0 && numAmount < product.min_amount && (
          <div style={{ fontSize: 11, color: "#e24b4a", marginBottom: 8 }}>
            Minimum investment is GHS {product.min_amount.toLocaleString()}
          </div>
        )}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {quickAmounts.map((v) => (
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

        {/* Interest rate */}
        <div style={S.sectionLabel}>Interest rate (% per annum)</div>
        <div style={{ position: "relative", marginBottom: 20 }}>
          <input
            type="number" min="0" step="0.5" value={rate}
            onChange={(e) => setRate(e.target.value)}
            style={{ ...S.input, paddingRight: 36 }}
          />
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#888780", pointerEvents: "none" }}>
            %
          </span>
        </div>

        {/* Term */}
        {product && product.min_term_months > 0 && (
          <>
            <div style={S.sectionLabel}>Investment term</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {termPresets.map(({ label, months }) => (
                <div
                  key={months}
                  onClick={() => setTermMonths(months)}
                  style={{
                    padding: "6px 14px", borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${termMonths === months ? "#1d9e75" : "#e8e8e6"}`,
                    fontSize: 12,
                    background: termMonths === months ? "#f0faf6" : "#fff",
                    color: termMonths === months ? "#0f6e56" : "#5f5e5a",
                    fontWeight: termMonths === months ? 500 : 400,
                    transition: "all 0.12s",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <label style={{ ...S.fieldLabel, marginBottom: 0, flex: 1 }}>Custom months</label>
              <input
                type="number" min={product.min_term_months}
                max={product.max_term_months ?? 999}
                value={termMonths || ""}
                onChange={(e) => setTermMonths(parseInt(e.target.value) || 0)}
                style={{ ...S.input, width: 80, textAlign: "center" }}
              />
            </div>
          </>
        )}

        {/* Auto-rollover */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 0", borderTop: "1px solid #eeeeec",
        }}>
          <div>
            <div style={{ fontSize: 13, color: "#1a1a18" }}>Auto-rollover on maturity</div>
            <div style={{ fontSize: 11, color: "#888780", marginTop: 1 }}>
              Automatically reinvest principal + interest
            </div>
          </div>
          <button
            onClick={() => setAutoRollover(!autoRollover)}
            style={{
              width: 36, height: 20, borderRadius: 99, border: "none", outline: "none",
              background: autoRollover ? "#1d9e75" : "#d3d1c7",
              position: "relative", cursor: "pointer", flexShrink: 0,
              transition: "background 0.2s",
            }}
          >
            <div style={{
              position: "absolute", width: 14, height: 14, borderRadius: "50%",
              background: "white", top: 3, left: autoRollover ? 19 : 3,
              boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
              transition: "left 0.2s",
            }} />
          </button>
        </div>

        {/* Narration */}
        <div style={{ marginTop: 14 }}>
          <label style={S.fieldLabel}>Narration / Note (optional)</label>
          <input
            type="text" value={narration}
            onChange={(e) => setNarration(e.target.value)}
            placeholder="e.g. Q3 savings, education fund..."
            style={S.input}
          />
        </div>

        {/* Returns preview */}
        <ReturnsSummary
          principal={numAmount} rate={numRate}
          termMonths={termMonths} product={product}
        />
      </div>

      <Footer>
        <button style={S.cancelBtn} onClick={onBack}>← Back</button>
        <PrimaryBtn onClick={onNext} disabled={!canContinue}>Continue →</PrimaryBtn>
      </Footer>
    </>
  );
}

// ─── Page 3: Funding Source ───────────────────────────────────────────────────

function PageFunding({
  accounts, fundingMode, setFundingMode,
  sourceAccountId, setSourceAccountId,
  paymentMethod, setPaymentMethod,
  amount,
  onNext, onBack,
}: {
  accounts: Account[];
  fundingMode: "account" | "cash";
  setFundingMode: (v: "account" | "cash") => void;
  sourceAccountId: string; setSourceAccountId: (v: string) => void;
  paymentMethod: string; setPaymentMethod: (v: string) => void;
  amount: string;
  onNext: () => void; onBack: () => void;
}) {
  const numAmount = parseFloat(amount) || 0;
  const selectedAccount = accounts.find(a => a.id === sourceAccountId);
  const canContinue = fundingMode === "account" ? !!sourceAccountId : !!paymentMethod;

  return (
    <>
      <div style={{ padding: "20px 24px", background: "#fff", overflowY: "auto", maxHeight: "62vh" }}>
        <div style={S.sectionLabel}>Funding source</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {(["account", "cash"] as const).map((m) => (
            <div
              key={m}
              onClick={() => { setFundingMode(m); setSourceAccountId(""); }}
              style={{
                flex: 1, padding: "10px", borderRadius: 10, textAlign: "center",
                cursor: "pointer", transition: "all 0.15s",
                border: `1px solid ${fundingMode === m ? "#1d9e75" : "#e8e8e6"}`,
                background: fundingMode === m ? "#f0faf6" : "#fff",
                color: fundingMode === m ? "#0f6e56" : "#5f5e5a",
                fontWeight: fundingMode === m ? 500 : 400,
                fontSize: 13,
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{m === "account" ? "💳" : "💵"}</div>
              {m === "account" ? "From Account" : "Cash / Transfer"}
            </div>
          ))}
        </div>

        {fundingMode === "account" && (
          <>
            <div style={{ ...S.sectionLabel, marginBottom: 8 }}>Debit from account</div>
            {accounts.length === 0 && (
              <div style={{ fontSize: 12, color: "#888780" }}>No accounts available to fund from.</div>
            )}
            {accounts.map((acc) => {
              const insufficient = Number(acc.balance) < numAmount;
              const isSelected = sourceAccountId === acc.id;
              return (
                <div
                  key={acc.id}
                  onClick={() => !insufficient && setSourceAccountId(acc.id)}
                  style={{
                    border: `1px solid ${isSelected ? "#1d9e75" : insufficient ? "#f7c1c1" : "#e8e8e6"}`,
                    borderRadius: 10, padding: "12px 14px", marginBottom: 8,
                    display: "flex", alignItems: "center", gap: 10,
                    cursor: insufficient ? "not-allowed" : "pointer",
                    background: isSelected ? "#f0faf6" : insufficient ? "#fff9f9" : "#fff",
                    opacity: insufficient ? 0.6 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18", textTransform: "capitalize" }}>
                      {acc.account_type}
                    </div>
                    <div style={{ fontSize: 11, color: "#888780", marginTop: 2 }}>{acc.account_number}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: Number(acc.balance) >= numAmount ? "#1a1a18" : "#e24b4a" }}>
                      GHS {formatGHS(acc.balance)}
                    </div>
                    {insufficient && (
                      <div style={{ fontSize: 10, color: "#e24b4a", marginTop: 2 }}>Insufficient</div>
                    )}
                  </div>
                  {isSelected && (
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#1d9e75", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.8">
                        <polyline points="2,5 4,7.5 8,3" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}

            {selectedAccount && (
              <div style={{ marginTop: 8, padding: "10px 14px", background: "#fafaf8", borderRadius: 8, border: "1px solid #e8e8e6", fontSize: 12, color: "#5f5e5a" }}>
                Remaining balance after funding:{" "}
                <strong style={{ color: "#1a1a18" }}>
                  GHS {formatGHS(Number(selectedAccount.balance) - numAmount)}
                </strong>
              </div>
            )}
          </>
        )}

        {fundingMode === "cash" && (
          <>
            <div style={S.sectionLabel}>Payment method</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {PAYMENT_METHODS.map((pm) => (
                <div
                  key={pm.value}
                  onClick={() => setPaymentMethod(pm.value)}
                  style={{
                    border: `1px solid ${paymentMethod === pm.value ? "#1d9e75" : "#e8e8e6"}`,
                    borderRadius: 10, padding: "12px",
                    cursor: "pointer", transition: "all 0.15s",
                    background: paymentMethod === pm.value ? "#f0faf6" : "#fff",
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{pm.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: paymentMethod === pm.value ? 500 : 400, color: paymentMethod === pm.value ? "#0f6e56" : "#5f5e5a" }}>
                    {pm.label}
                  </span>
                  {paymentMethod === pm.value && (
                    <div style={{ marginLeft: "auto", width: 14, height: 14, borderRadius: "50%", background: "#1d9e75", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2">
                        <polyline points="2,5 4,7.5 8,3" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ marginTop: 16, fontSize: 11, color: "#5f5e5a", background: "#fafaf8", border: "1px solid #e8e8e6", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#5f5e5a" strokeWidth="1.5">
            <circle cx="7" cy="7" r="6" /><line x1="7" y1="6" x2="7" y2="10" /><circle cx="7" cy="4.2" r="0.6" fill="#5f5e5a" />
          </svg>
          No fees for opening investment accounts. Processing is immediate.
        </div>
      </div>

      <Footer>
        <button style={S.cancelBtn} onClick={onBack}>← Back</button>
        <PrimaryBtn onClick={onNext} disabled={!canContinue}>Review →</PrimaryBtn>
      </Footer>
    </>
  );
}

// ─── Page 4: Review ───────────────────────────────────────────────────────────

function PageReview({
  product, amount, rate, termMonths, autoRollover, narration,
  fundingMode, sourceAccount, paymentMethod,
  onConfirm, onBack, loading, txRef,
}: {
  product: InvestmentProduct | null;
  amount: string; rate: string; termMonths: number;
  autoRollover: boolean; narration: string;
  fundingMode: "account" | "cash";
  sourceAccount?: Account;
  paymentMethod: string;
  onConfirm: () => void; onBack: () => void;
  loading: boolean; txRef: string;
}) {
  const numAmount = parseFloat(amount) || 0;
  const numRate = parseFloat(rate) || 0;
  const { interest, maturityValue } = calcReturns(numAmount, numRate, termMonths);
  const maturityDate = termMonths > 0 ? addMonths(termMonths) : null;

  const rows: [string, string, string?][] = [
    ["Product",         product?.name ?? "—"],
    ["Principal",       `GHS ${formatGHS(numAmount)}`],
    ["Interest Rate",   `${numRate}% per annum`],
    ["Term",            termMonths > 0 ? `${termMonths} months` : "Open-ended"],
    ["Expected Return", `GHS ${formatGHS(interest)}`,      "#0f6e56"],
    ["Maturity Value",  `GHS ${formatGHS(maturityValue)}`, "#0f6e56"],
    ["Matures On",      maturityDate ? formatDate(maturityDate.toISOString()) : "Open-ended"],
    ["Auto-rollover",   autoRollover ? "Yes" : "No"],
    ["Funded From",     sourceAccount ? `${sourceAccount.account_type} · ${sourceAccount.account_number}` : paymentMethod],
    ["Narration",       narration || "—"],
  ];

  return (
    <>
      <div style={{ padding: "20px 24px", background: "#fff", overflowY: "auto", maxHeight: "62vh" }}>
        <div style={{
          textAlign: "center", padding: "16px 0", marginBottom: 14,
          background: "linear-gradient(135deg, #f0faf6 0%, #e6f8f1 100%)",
          borderRadius: 12, border: "1px solid #b8e8d6",
        }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>{product?.icon ?? "💰"}</div>
          <div style={{ fontSize: 11, color: "#5f9e8a", marginBottom: 4 }}>Opening</div>
          <div style={{ fontSize: 28, fontWeight: 500, color: "#1a1a18" }}>
            <span style={{ fontSize: 14, color: "#888780", verticalAlign: "super", marginRight: 4 }}>GHS</span>
            {formatGHS(numAmount)}
          </div>
          <div style={{ fontSize: 12, color: "#5f9e8a", marginTop: 4 }}>{product?.name}</div>
        </div>

        {rows.map(([label, val, color]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #eeeeec", fontSize: 13 }}>
            <span style={{ color: "#888780" }}>{label}</span>
            <span style={{ fontWeight: 500, color: color ?? "#1a1a18", textTransform: label === "Funded From" ? "capitalize" : undefined }}>
              {val}
            </span>
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 12 }}>
          <span style={{ color: "#888780" }}>Reference</span>
          <span style={{ fontFamily: "monospace", color: "#888780", fontSize: 11 }}>{txRef}</span>
        </div>

        <div style={{ marginTop: 10, padding: "8px 12px", background: "#faeeda", border: "1px solid #fac775", borderRadius: 8, fontSize: 12, color: "#854f0b" }}>
          ⚠ Please verify all details. Once created, terms are locked until maturity.
        </div>
      </div>

      <Footer>
        <button style={S.cancelBtn} onClick={onBack}>← Back</button>
        <PrimaryBtn onClick={onConfirm} disabled={loading}>
          {loading ? <><Spinner /> Opening account...</> : <><CheckIcon /> Open Investment</>}
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

function PageSuccess({
  txRef, product, maturityDate, maturityValue, onDone,
}: {
  txRef: string; product: InvestmentProduct | null;
  maturityDate: Date | null; maturityValue: number; onDone: () => void;
}) {
  return (
    <div style={{ padding: "40px 24px", textAlign: "center", background: "#fff" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>{product?.icon ?? "💰"}</div>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#e1f5ee", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <svg width="26" height="26" viewBox="0 0 28 28" fill="none" stroke="#0f6e56" strokeWidth="2.2">
          <polyline points="5,14 11,20 23,8" />
        </svg>
      </div>
      <div style={{ fontSize: 17, fontWeight: 600, color: "#1a1a18", marginBottom: 6 }}>
        Investment Account Opened!
      </div>
      <div style={{ fontSize: 13, color: "#888780", marginBottom: 6 }}>
        {product?.name} account has been created and funded successfully.
      </div>
      {maturityDate && (
        <div style={{ fontSize: 13, color: "#5f9e8a", marginBottom: 8 }}>
          Matures on <strong style={{ color: "#0f6e56" }}>{formatDate(maturityDate.toISOString())}</strong>{" "}
          with expected return of{" "}
          <strong style={{ color: "#0f6e56" }}>GHS {formatGHS(maturityValue)}</strong>
        </div>
      )}
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

export default function InvestmentModal({
  isOpen,
  onClose,
  onSuccess,
  customer,
  parentCompanyName,
}: InvestmentModalProps) {
  const { id: customerId } = useParams<{ id: string }>();
  const { accounts, refreshAccounts } = useAccounts();

  const [step, setStep] = useState(1);
  const [txRef] = useState(generateRef);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1 — product
  const [productId, setProductId] = useState("");

  // Step 2 — amount & terms
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [termMonths, setTermMonths] = useState(12);
  const [autoRollover, setAutoRollover] = useState(false);
  const [narration, setNarration] = useState("");
  const {sendMessage} = useTransactions();
  // Step 3 — funding
  const [fundingMode, setFundingMode] = useState<"account" | "cash">("account");
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const product = PRODUCTS.find(p => p.id === productId) ?? null;

  // Auto-set defaults when product changes
  useEffect(() => {
    if (product) {
      setRate(String(product.default_rate));
      setTermMonths(product.min_term_months || 12);
      setAutoRollover(product.auto_rollover);
    }
  }, [productId]);

  const sourceAccount = accounts.find(a => a.id === sourceAccountId);

  // ── SMS helper — mirrors addTransaction's exact pattern ──────────────────
  const sendInvestmentSms = useCallback(
    async (
      investmentAccount: Account,
      principalAmount: string,
      investmentProduct: InvestmentProduct,
      maturityDateStr: string | null,
      expectedReturn: number,
    ) => {
      // Respect account-level sms_enabled flag (same rule as addTransaction)
      const shouldSendSms = investmentAccount?.sms_enabled ?? false;
      if (!shouldSendSms) return;

      // Collect & sanitise numbers from the SOURCE account's sms_numbers
      // (mirrors: "Use ACCOUNT sms_numbers instead of customer")
      const numbers = [
        ...new Set(
          (Array.isArray(investmentAccount?.sms_numbers)
            ? investmentAccount.sms_numbers
            : []
          )
            .filter(
              (num): num is string =>
                typeof num === "string" &&
                num.trim() !== "" &&
                /^[0-9+\-\s]{8,20}$/.test(num.trim())
            )
            .map((num) => num.trim())
        ),
      ];

      if (numbers.length === 0) return;

      // Build the message
      const customerName = customer?.name ?? "Valued Customer";
      const formattedAmount = Number(principalAmount).toFixed(2);
      const formattedReturn = Number(expectedReturn).toFixed(2);
      const maturityPart = maturityDateStr
        ? ` Your investment matures on ${maturityDateStr} with an expected payout of GHS${formattedReturn}.`
        : "";

      const message =
        `Dear ${customerName}, your ${investmentProduct.name} account has been successfully opened ` +
        `with a principal of GHS${formattedAmount} at ${rate}% p.a.` +
        maturityPart +
        ` Ref: ${txRef}.`;

      const messageData = {
        messageTo: numbers,
        message,
        messageFrom: makeSuSuProName(parentCompanyName ?? ""),
      };

      // Fire-and-forget — same as addTransaction: don't let SMS failure
      // block or roll back the investment creation.
      sendMessage(messageData).catch((err) =>
        console.warn("Investment SMS failed but account was created:", err)
      );
    },
    [customer, parentCompanyName, rate, txRef]
  );

  const handleConfirm = async () => {
    if (!customerId || !productId || !amount) return;
    setLoading(true);
    setErrorMsg("");

    const numAmount   = parseFloat(amount);
    const numRate     = parseFloat(rate);
    const { maturityValue } = calcReturns(numAmount, numRate, termMonths);
    const maturityDate = termMonths > 0 ? addMonths(termMonths) : null;
    const maturityDateStr = maturityDate
      ? maturityDate.toLocaleDateString("en-GH", { year: "numeric", month: "short", day: "numeric" })
      : null;

    const payload = {
      customer_id:       customerId,
      company_id:        companyId,
      created_by:        userUUID,
      product_type:      productId,
      principal_amount:  numAmount,
      interest_rate:     numRate,
      term_months:       termMonths,
      source_account_id: fundingMode === "account" ? sourceAccountId || null : null,
      payment_method:    fundingMode === "cash" ? paymentMethod : "internal",
      auto_rollover:     autoRollover,
      narration:         narration || null,
    };

    try {
      const res = await fetch(
        "http://localhost:5000/api/investments/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();

      if (data.success) {
        // Refresh accounts to get the freshly-created investment account
        // (including its sms_numbers & sms_enabled, just like addTransaction
        //  calls refreshAccounts before reading the updated balance)
        const updatedAccounts = await refreshAccounts(customerId);

        // Find the new investment account in the refreshed list
        const newInvAccountId: string | undefined = data.data?.account?.id;
        const newInvAccount = updatedAccounts?.find(
          (a: Account) => a.id === newInvAccountId
        );

        // If funding from an existing account, fall back to that account's
        // SMS settings (it's the one the customer "owns" and has numbers on)
        const smsAccount =
          newInvAccount ??
          (sourceAccountId
            ? updatedAccounts?.find((a: Account) => a.id === sourceAccountId)
            : null);

        if (smsAccount && product) {
          // Fire SMS — non-blocking, same pattern as addTransaction
          sendInvestmentSms(
            smsAccount,
            amount,
            product,
            maturityDateStr,
            maturityValue,
          );
        }

        if (onSuccess) onSuccess();
        setStep(5);
      } else {
        setErrorMsg(data.message ?? "Failed to create investment.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message ?? "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const maturityDate = termMonths > 0 ? addMonths(termMonths) : null;
  const { maturityValue } = calcReturns(parseFloat(amount) || 0, parseFloat(rate) || 0, termMonths);

  const handleDone = () => {
    onClose();
    setTimeout(resetState, 300);
  };

  const resetState = () => {
    setStep(1); setProductId(""); setAmount(""); setRate(""); setTermMonths(12);
    setAutoRollover(false); setNarration(""); setFundingMode("account");
    setSourceAccountId(""); setPaymentMethod("cash"); setErrorMsg("");
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      background: "rgba(0,0,0,0.35)", padding: "24px 16px", overflowY: "auto",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, border: "1px solid #e8e8e6",
        width: "100%", maxWidth: 540, overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        marginTop: 8,
      }}>

        {/* Header */}
        <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid #eeeeec", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#e1f5ee", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#0f6e56" strokeWidth="1.5">
                <path d="M3 8l3 3 7-7" />
                <circle cx="8" cy="8" r="6.5" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#1a1a18" }}>Open Investment Account</div>
              <div style={{ fontSize: 12, color: "#888780", marginTop: 1 }}>
                Fixed deposits, bonds & more
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #e8e8e6", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888780", fontSize: 13 }}
          >
            ✕
          </button>
        </div>

        {/* Steps bar */}
        {step < 5 && <StepsBar current={step} />}

        {/* Returns teaser banner (steps 2-4) */}
        {step >= 2 && step < 5 && product && parseFloat(amount) > 0 && (
          <div style={{
            padding: "8px 24px", background: "#f0faf6", borderBottom: "1px solid #c8eed8",
            display: "flex", alignItems: "center", gap: 8, fontSize: 12,
          }}>
            <span style={{ fontSize: 16 }}>{product.icon}</span>
            <span style={{ color: "#0f6e56", fontWeight: 500 }}>{product.name}</span>
            <span style={{ color: "#888780" }}>·</span>
            <span style={{ color: "#1a1a18" }}>GHS {formatGHS(parseFloat(amount))}</span>
            <span style={{ color: "#888780" }}>→</span>
            <span style={{ color: "#0f6e56", fontWeight: 600 }}>GHS {formatGHS(maturityValue)} at maturity</span>
          </div>
        )}

        {/* Error banner */}
        {errorMsg && (
          <div style={{ padding: "10px 24px", background: "#fcebeb", borderBottom: "1px solid #f7c1c1", fontSize: 12, color: "#a32d2d", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#a32d2d" strokeWidth="1.5">
              <circle cx="7" cy="7" r="6" /><line x1="7" y1="4" x2="7" y2="8" /><circle cx="7" cy="10" r="0.6" fill="#a32d2d" />
            </svg>
            {errorMsg}
          </div>
        )}

        {/* Pages */}
        {step === 1 && (
          <PageProduct
            selected={productId} onSelect={setProductId}
            onNext={() => setStep(2)} onClose={onClose}
          />
        )}

        {step === 2 && (
          <PageAmount
            product={product}
            amount={amount} setAmount={setAmount}
            rate={rate} setRate={setRate}
            termMonths={termMonths} setTermMonths={setTermMonths}
            autoRollover={autoRollover} setAutoRollover={setAutoRollover}
            narration={narration} setNarration={setNarration}
            onNext={() => setStep(3)} onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <PageFunding
            accounts={accounts}
            fundingMode={fundingMode} setFundingMode={setFundingMode}
            sourceAccountId={sourceAccountId} setSourceAccountId={setSourceAccountId}
            paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
            amount={amount}
            onNext={() => setStep(4)} onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <PageReview
            product={product}
            amount={amount} rate={rate} termMonths={termMonths}
            autoRollover={autoRollover} narration={narration}
            fundingMode={fundingMode}
            sourceAccount={sourceAccount}
            paymentMethod={paymentMethod}
            onConfirm={handleConfirm} onBack={() => setStep(3)}
            loading={loading} txRef={txRef}
          />
        )}

        {step === 5 && (
          <PageSuccess
            txRef={txRef} product={product}
            maturityDate={maturityDate}
            maturityValue={maturityValue}
            onDone={handleDone}
          />
        )}
      </div>
    </div>
  );
}
