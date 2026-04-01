import React, { useState, useEffect, useCallback } from "react";
import type {
  CreateIndividualLoanPayload,
  CreateGroupLoanPayload,
  CreateP2PLoanPayload,
  P2PStatus,
} from "../../../contexts/dashboard/Loan";
import { useLoans } from "../../../contexts/dashboard/Loan";
import { companyId, userType, userUUID } from "../../../constants/appConstants";

// ─── Types ────────────────────────────────────────────────────────────────────

type LoanTab = "individual" | "group" | "p2p";
type InterestMethod = "fixed" | "reducing" | "flat";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface IndividualForm {
  customerId: string;
  customerName: string;
  customerPhone: string;
  category: string;
  amount: string;
  interestRate: string;
  duration: string;
  interestMethod: InterestMethod;
  startDate: string;
  disbursedAmount: string;
  purpose: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorRelationship: string;
  guarantorAddress: string;
  collateral: string;
  collateralValue: string;
  notes: string;
}

interface LoanScheduleRow {
  month: number;
  principal: number;
  interest: number;
  payment: number;
  balance: number;
}

interface IndividualCalc {
  monthly: number;
  totalInterest: number;
  totalRepayment: number;
  effectiveRate: number;
  maturityDate: string;
  schedule: LoanScheduleRow[];
}

interface GroupMember {
  id: string;
  name: string;
  phone: string;
  amount: number;
  // customer_id is required for the API; optional here so the UI can work
  // with either registered customers or ad-hoc name entries.
  customerId?: string;
}

interface GroupForm {
  groupName: string;
  startDate: string;
  guarantorName: string;
  guarantorPhone: string;
  notes: string;
}

interface P2PPayment {
  id: string;
  amount: number;
  date: string;
  note: string;
}

interface P2PEntry {
  id: string; // local ID — will be replaced by the API-returned ID after creation
  recipientName: string;
  recipientPhone: string;
  amount: number;
  dateSent: string;
  reason: string;
  relationship: string;
  notes: string;
  status: P2PStatus;
  payments: P2PPayment[];
  apiId?: string; // ID returned by the backend after POST
}

interface NewLoanModalProps {
  showNewLoanModal: boolean;
  setShowNewLoanModal: (show: boolean) => void;
  availableCustomers?: Customer[];
  onSubmitLoan?: (data: unknown) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LOAN_CATEGORIES = [
  "Business", "Personal", "Agricultural",
  "Education", "Emergency", "Mortgage", "Auto",
];

const RELATIONSHIPS = [
  "Spouse", "Parent", "Sibling", "Friend", "Business partner", "Other",
];

const DURATIONS = [3, 6, 12, 18, 24, 36, 60];

const GROUP_INTEREST_RATE = 0.20;
const GROUP_DURATION = 6;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GHS = (n: number) =>
  "₵" + n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const initials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const avatarColors = [
  { bg: "#EEEDFE", text: "#3C3489" },
  { bg: "#E1F5EE", text: "#085041" },
  { bg: "#FAEEDA", text: "#633806" },
  { bg: "#E6F1FB", text: "#0C447C" },
  { bg: "#FBEAF0", text: "#72243E" },
];

function calcIndividual(
  amount: number,
  rate: number,
  months: number,
  method: InterestMethod,
  startDate: string
): IndividualCalc {
  const mr = rate / 100 / 12;
  let monthly = 0;
  let totalInterest = 0;
  const schedule: LoanScheduleRow[] = [];

  if (method === "fixed") {
    totalInterest = amount * (rate / 100);
    monthly = (amount + totalInterest) / months;
    const mp = amount / months;
    const mi = totalInterest / months;
    let bal = amount;
    for (let m = 1; m <= months; m++) {
      bal = Math.max(0, bal - mp);
      schedule.push({ month: m, principal: mp, interest: mi, payment: monthly, balance: bal });
    }
  } else if (method === "reducing") {
    monthly = amount * (mr * Math.pow(1 + mr, months)) / (Math.pow(1 + mr, months) - 1);
    let bal = amount;
    for (let m = 1; m <= months; m++) {
      const i = bal * mr;
      const p = monthly - i;
      bal = Math.max(0, bal - p);
      totalInterest += i;
      schedule.push({ month: m, principal: p, interest: i, payment: monthly, balance: bal });
    }
  } else {
    totalInterest = amount * (rate / 100) * (months / 12);
    monthly = (amount + totalInterest) / months;
    const mp = amount / months;
    const mi = totalInterest / months;
    let bal = amount;
    for (let m = 1; m <= months; m++) {
      bal = Math.max(0, bal - mp);
      schedule.push({ month: m, principal: mp, interest: mi, payment: monthly, balance: bal });
    }
  }

  const totalRepayment = amount + totalInterest;
  const effectiveRate = (totalInterest / amount) * (12 / months) * 100;
  const matDate = new Date(startDate);
  matDate.setMonth(matDate.getMonth() + months);
  const maturityDate = matDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return { monthly, totalInterest, totalRepayment, effectiveRate, maturityDate, schedule };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(15,10,40,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "1rem",
    backdropFilter: "blur(2px)",
  },
  modal: {
    background: "#F8F7FF",
    borderRadius: 16,
    width: "100%",
    maxWidth: 780,
    maxHeight: "90vh",
    overflowY: "auto" as const,
    border: "1px solid #E2E0EE",
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    background: "#fff",
    borderBottom: "1px solid #E2E0EE",
    padding: "20px 24px 0",
    borderRadius: "16px 16px 0 0",
  },
  headerTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#1a1830",
    margin: 0,
    letterSpacing: "-0.02em",
  },
  headerSub: {
    fontSize: 13,
    color: "#9896b0",
    marginTop: 2,
  },
  closeBtn: {
    background: "none",
    border: "1px solid #E2E0EE",
    borderRadius: 8,
    width: 32,
    height: 32,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9896b0",
    fontSize: 18,
    lineHeight: 1,
    flexShrink: 0,
  },
  tabs: { display: "flex", gap: 0 },
  tab: (active: boolean, color: string) => ({
    flex: 1,
    padding: "10px 12px",
    border: "none",
    borderBottom: active ? `2px solid ${color}` : "2px solid transparent",
    background: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    color: active ? color : "#9896b0",
    transition: "all .15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    fontFamily: "inherit",
  }),
  tabDot: (color: string) => ({
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  }),
  body: { padding: "20px 24px 24px" },
  card: {
    background: "#fff",
    border: "1px solid #E2E0EE",
    borderRadius: 12,
    padding: "16px 18px",
    marginBottom: 12,
  },
  cardHead: {
    fontSize: 10,
    fontWeight: 700,
    color: "#b8b6cc",
    letterSpacing: ".1em",
    textTransform: "uppercase" as const,
    marginBottom: 14,
  },
  g2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  g3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  field: { display: "flex", flexDirection: "column" as const, gap: 4 },
  label: { fontSize: 12, fontWeight: 500, color: "#5a5878" },
  input: (err?: boolean) => ({
    padding: "8px 11px",
    border: `1px solid ${err ? "#F09595" : "#E2E0EE"}`,
    borderRadius: 8,
    background: "#fff",
    color: "#1a1830",
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    transition: "border .15s",
    boxSizing: "border-box" as const,
  }),
  inputRo: {
    padding: "8px 11px",
    border: "1px solid #E2E0EE",
    borderRadius: 8,
    background: "#F8F7FF",
    color: "#9896b0",
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  textarea: {
    padding: "8px 11px",
    border: "1px solid #E2E0EE",
    borderRadius: 8,
    background: "#fff",
    color: "#1a1830",
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    resize: "vertical" as const,
    minHeight: 60,
  },
  errText: { fontSize: 11, color: "#A32D2D", marginTop: 1 },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 18px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    border: "1px solid #E2E0EE",
    background: "#fff",
    color: "#1a1830",
    fontFamily: "inherit",
    transition: "all .15s",
  },
  btnPrimary: (color: string) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 18px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    border: `1px solid ${color}`,
    background: color,
    color: "#fff",
    fontFamily: "inherit",
    transition: "all .15s",
  }),
  btnSm: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "6px 12px",
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    border: "1px solid #E2E0EE",
    background: "#fff",
    color: "#1a1830",
    fontFamily: "inherit",
  },
  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 10 },
  metric: (bg: string) => ({
    background: bg,
    border: "1px solid #E2E0EE",
    borderRadius: 9,
    padding: "10px 12px",
  }),
  metricLabel: { fontSize: 11, color: "#9896b0", marginBottom: 3 },
  metricVal: (color: string) => ({ fontSize: 16, fontWeight: 600, color }),
  infoBox: (bg: string, border: string, color: string) => ({
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 12,
    color,
    marginTop: 8,
    lineHeight: 1.5,
  }),
  actionRow: { display: "flex", gap: 8, marginTop: 8 },
  msg: (ok: boolean) => ({
    fontSize: 12,
    marginTop: 8,
    padding: "9px 12px",
    borderRadius: 8,
    background: ok ? "#EAF3DE" : "#FCEBEB",
    color: ok ? "#3B6D11" : "#A32D2D",
  }),
  memberItem: {
    display: "flex",
    alignItems: "center",
    background: "#F8F7FF",
    border: "1px solid #E2E0EE",
    borderRadius: 9,
    padding: "9px 12px",
    marginBottom: 7,
    gap: 10,
  },
  avatar: (idx: number) => ({
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: avatarColors[idx % avatarColors.length].bg,
    color: avatarColors[idx % avatarColors.length].text,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  }),
  sched: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 12,
    marginTop: 10,
  },
  th: {
    padding: "6px 10px",
    textAlign: "right" as const,
    color: "#9896b0",
    fontWeight: 500,
    borderBottom: "1px solid #E2E0EE",
    background: "#F8F7FF",
    fontSize: 11,
  },
  td: {
    padding: "6px 10px",
    textAlign: "right" as const,
    borderBottom: "1px solid #F0EFF8",
    color: "#1a1830",
    fontSize: 12,
  },
  tdL: {
    padding: "6px 10px",
    textAlign: "left" as const,
    borderBottom: "1px solid #F0EFF8",
    color: "#9896b0",
    fontSize: 12,
  },
  totalRow: (bg: string, border: string) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "9px 12px",
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 8,
    marginTop: 8,
  }),
  progressOuter: { flex: 1, height: 5, background: "#E2E0EE", borderRadius: 3, overflow: "hidden" },
  pillStatus: (status: P2PStatus) => {
    const map = {
      active:   { bg: "#EAF3DE", color: "#3B6D11" },
      inactive: { bg: "#F1F0F8", color: "#9896b0" },
      ended:    { bg: "#FCEBEB", color: "#A32D2D" },
    };
    const s = map[status];
    return {
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 9px",
      borderRadius: 100,
      fontSize: 11,
      fontWeight: 600,
      background: s.bg,
      color: s.color,
    };
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Field: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}> = ({ label, required, error, children, hint }) => (
  <div style={S.field}>
    <label style={S.label}>
      {label}{required && <span style={{ color: "#A32D2D" }}> *</span>}
    </label>
    {children}
    {hint && <span style={{ fontSize: 11, color: "#b8b6cc" }}>{hint}</span>}
    {error && <span style={S.errText}>{error}</span>}
  </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { err?: boolean }> = ({ err, ...props }) => (
  <input style={S.input(err)} {...props} />
);

const SelectEl: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { err?: boolean }> = ({ err, children, ...props }) => (
  <select style={S.input(err)} {...props}>{children}</select>
);

// ─── Individual Panel ─────────────────────────────────────────────────────────

const IndividualPanel: React.FC<{ availableCustomers: Customer[] }> = ({ availableCustomers }) => {
  const { createIndividualLoan, loading } = useLoans();
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState<IndividualForm>({
    customerId: "", customerName: "", customerPhone: "",
    category: "", amount: "", interestRate: "", duration: "",
    interestMethod: "fixed", startDate: today, disbursedAmount: "",
    purpose: "", guarantorName: "", guarantorPhone: "",
    guarantorRelationship: "", guarantorAddress: "",
    collateral: "", collateralValue: "", notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof IndividualForm, string>>>({});
  const [calc, setCalc] = useState<IndividualCalc | null>(null);
  const [showFull, setShowFull] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof IndividualForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  useEffect(() => {
    const amt = parseFloat(form.amount);
    const rate = parseFloat(form.interestRate);
    const dur = parseInt(form.duration);
    if (amt > 0 && rate > 0 && dur > 0 && form.startDate) {
      setCalc(calcIndividual(amt, rate, dur, form.interestMethod, form.startDate));
      if (!form.disbursedAmount) setForm((p) => ({ ...p, disbursedAmount: form.amount }));
    } else {
      setCalc(null);
    }
  }, [form.amount, form.interestRate, form.duration, form.interestMethod, form.startDate]);

  const matDate = () => {
    if (!form.startDate || !form.duration) return "";
    const d = new Date(form.startDate);
    d.setMonth(d.getMonth() + parseInt(form.duration));
    return d.toISOString().split("T")[0];
  };

  const validate = () => {
    const e: Partial<Record<keyof IndividualForm, string>> = {};
    if (!form.customerName && !form.customerId) e.customerName = "Required";
    if (!form.category) e.category = "Required";
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = "Must be > 0";
    if (!form.interestRate) e.interestRate = "Required";
    if (!form.duration) e.duration = "Required";
    if (!form.startDate) e.startDate = "Required";
    if (!form.purpose) e.purpose = "Required";
    if (!form.guarantorName) e.guarantorName = "Required";
    if (!form.guarantorPhone) e.guarantorPhone = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;

    // Resolve customer_id: use selected registered customer, or leave undefined
    // so the backend falls back to created_by.
    const payload: CreateIndividualLoanPayload = {
      customer_id:           form.customerId || undefined,
      customer_name:         !form.customerId ? form.customerName : undefined,
      customer_phone:        form.customerPhone || undefined,
      loan_category:         form.category,
      loan_amount:           parseFloat(form.amount),
      interest_rate:         parseFloat(form.interestRate),
      duration:              parseInt(form.duration),
      interest_method:       form.interestMethod,
      request_date:          form.startDate,
      disbursement_date:     form.startDate,
      disbursed_amount:      form.disbursedAmount ? parseFloat(form.disbursedAmount) : undefined,
      purpose:               form.purpose,
      collateral:            form.collateral || undefined,
      collateral_value:      form.collateralValue ? parseFloat(form.collateralValue) : undefined,
      guarantor_name:        form.guarantorName,
      guarantor_phone:       form.guarantorPhone,
      guarantor_relationship: form.guarantorRelationship || undefined,
      guarantor_address:     form.guarantorAddress || undefined,
      description:           form.notes || undefined,
    };

    const result = await createIndividualLoan(payload);
    if (result) {
      setMsg({ ok: true, text: "Application submitted successfully. Status: Pending review." });
    } else {
      setMsg({ ok: false, text: "Submission failed. Please check the details and try again." });
    }
  };

  const reset = () => {
    setForm({
      customerId: "", customerName: "", customerPhone: "",
      category: "", amount: "", interestRate: "", duration: "",
      interestMethod: "fixed", startDate: today, disbursedAmount: "",
      purpose: "", guarantorName: "", guarantorPhone: "",
      guarantorRelationship: "", guarantorAddress: "",
      collateral: "", collateralValue: "", notes: "",
    });
    setCalc(null); setErrors({}); setMsg(null); setShowFull(false);
  };

  const methodLabel = { fixed: "Fixed interest", reducing: "Reducing balance (EMI)", flat: "Flat rate" };

  return (
    <div>
      {/* Borrower */}
      <div style={S.card}>
        <div style={S.cardHead}>Borrower</div>
        <div style={S.g2}>
          {availableCustomers.length > 0 ? (
            <Field label="Select customer" required error={errors.customerId}>
              <SelectEl value={form.customerId} onChange={set("customerId")} err={!!errors.customerId}>
                <option value="">Choose…</option>
                {availableCustomers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.phone_number}</option>
                ))}
              </SelectEl>
            </Field>
          ) : (
            <Field label="Customer name" required error={errors.customerName}>
              <Input value={form.customerName} onChange={set("customerName")} placeholder="Full name" err={!!errors.customerName} />
            </Field>
          )}
          <Field label="Phone">
            <Input value={form.customerPhone} onChange={set("customerPhone")} placeholder="+233 XX XXX XXXX" type="tel" />
          </Field>
        </div>
      </div>

      {/* Loan Details */}
      <div style={S.card}>
        <div style={S.cardHead}>Loan details</div>
        <div style={S.g3}>
          <Field label="Category" required error={errors.category}>
            <SelectEl value={form.category} onChange={set("category")} err={!!errors.category}>
              <option value="">Select…</option>
              {LOAN_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </SelectEl>
          </Field>
          <Field label="Loan amount (₵)" required error={errors.amount}>
            <Input type="number" value={form.amount} onChange={set("amount")} placeholder="0.00" min="0" step="0.01" err={!!errors.amount} />
          </Field>
          <Field label="Interest rate (% p.a.)" required error={errors.interestRate}>
            <Input type="number" value={form.interestRate} onChange={set("interestRate")} placeholder="15.0" min="0" step="0.1" err={!!errors.interestRate} />
          </Field>
          <Field label="Duration (months)" required error={errors.duration}>
            <SelectEl value={form.duration} onChange={set("duration")} err={!!errors.duration}>
              <option value="">Select…</option>
              {DURATIONS.map((d) => <option key={d} value={d}>{d} months</option>)}
            </SelectEl>
          </Field>
          <Field label="Interest method">
            <SelectEl value={form.interestMethod} onChange={set("interestMethod")}>
              <option value="fixed">Fixed</option>
              <option value="reducing">Reducing balance</option>
              <option value="flat">Flat rate</option>
            </SelectEl>
          </Field>
          <Field label="Start date" required error={errors.startDate}>
            <Input type="date" value={form.startDate} onChange={set("startDate")} err={!!errors.startDate} />
          </Field>
          <Field label="Purpose" required error={errors.purpose}>
            <Input value={form.purpose} onChange={set("purpose")} placeholder="e.g. Business expansion" err={!!errors.purpose} />
          </Field>
          <Field label="Disbursed amount (₵)" hint="Defaults to loan amount">
            <Input type="number" value={form.disbursedAmount} onChange={set("disbursedAmount")} placeholder={form.amount || "0.00"} min="0" step="0.01" />
          </Field>
          <Field label="Maturity date">
            <input readOnly value={matDate()} style={S.inputRo} />
          </Field>
        </div>
      </div>

      {/* Calculations */}
      {calc && (
        <div style={{ ...S.card, border: "1px solid #CECBF6" }}>
          <div style={{ ...S.cardHead, color: "#534AB7" }}>
            {methodLabel[form.interestMethod]} — calculated summary
          </div>
          <div style={S.metricsGrid}>
            <div style={S.metric("#EEEDFE")}>
              <div style={S.metricLabel}>Monthly payment</div>
              <div style={S.metricVal("#534AB7")}>{GHS(calc.monthly)}</div>
            </div>
            <div style={S.metric("#E6F1FB")}>
              <div style={S.metricLabel}>Total interest</div>
              <div style={S.metricVal("#185FA5")}>{GHS(calc.totalInterest)}</div>
            </div>
            <div style={S.metric("#E1F5EE")}>
              <div style={S.metricLabel}>Total repayment</div>
              <div style={S.metricVal("#0F6E56")}>{GHS(calc.totalRepayment)}</div>
            </div>
            <div style={S.metric("#FAEEDA")}>
              <div style={S.metricLabel}>Effective rate</div>
              <div style={S.metricVal("#854F0B")}>{calc.effectiveRate.toFixed(2)}%</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#9896b0", marginTop: 8 }}>
            Maturity: <strong style={{ color: "#1a1830" }}>{calc.maturityDate}</strong>
          </div>

          {/* Schedule */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#b8b6cc", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 4 }}>
              Payment schedule {!showFull && calc.schedule.length > 6 ? "(first 6 months)" : ""}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={S.sched}>
                <thead>
                  <tr>
                    <th style={{ ...S.th, textAlign: "left" }}>Month</th>
                    <th style={S.th}>Principal</th>
                    <th style={S.th}>Interest</th>
                    <th style={S.th}>Payment</th>
                    <th style={S.th}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {(showFull ? calc.schedule : calc.schedule.slice(0, 6)).map((r) => (
                    <tr key={r.month}>
                      <td style={S.tdL}>Month {r.month}</td>
                      <td style={S.td}>{GHS(r.principal)}</td>
                      <td style={S.td}>{GHS(r.interest)}</td>
                      <td style={{ ...S.td, fontWeight: 600, color: "#534AB7" }}>{GHS(r.payment)}</td>
                      <td style={S.td}>{GHS(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {calc.schedule.length > 6 && (
              <button
                style={{ ...S.btnSm, marginTop: 6, fontSize: 11, color: "#534AB7", border: "none", background: "none", cursor: "pointer", padding: "4px 0" }}
                onClick={() => setShowFull((p) => !p)}
              >
                {showFull ? "Show less" : `View all ${calc.schedule.length} months`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Guarantor & Security */}
      <div style={S.card}>
        <div style={S.cardHead}>Guarantor & security</div>
        <div style={S.g2}>
          <Field label="Guarantor name" required error={errors.guarantorName}>
            <Input value={form.guarantorName} onChange={set("guarantorName")} placeholder="Full name" err={!!errors.guarantorName} />
          </Field>
          <Field label="Guarantor phone" required error={errors.guarantorPhone}>
            <Input type="tel" value={form.guarantorPhone} onChange={set("guarantorPhone")} placeholder="+233 XX XXX XXXX" err={!!errors.guarantorPhone} />
          </Field>
          <Field label="Relationship">
            <SelectEl value={form.guarantorRelationship} onChange={set("guarantorRelationship")}>
              <option value="">Select…</option>
              {RELATIONSHIPS.map((r) => <option key={r}>{r}</option>)}
            </SelectEl>
          </Field>
          <Field label="Guarantor address">
            <Input value={form.guarantorAddress} onChange={set("guarantorAddress")} placeholder="Address" />
          </Field>
          <Field label="Collateral">
            <Input value={form.collateral} onChange={set("collateral")} placeholder="e.g. Land title, equipment" />
          </Field>
          <Field label="Collateral value (₵)">
            <Input type="number" value={form.collateralValue} onChange={set("collateralValue")} placeholder="0.00" min="0" step="0.01" />
          </Field>
        </div>
      </div>

      {/* Notes */}
      <div style={S.card}>
        <div style={S.cardHead}>Notes</div>
        <textarea style={S.textarea} value={form.notes} onChange={set("notes")} placeholder="Any additional notes about this application…" />
      </div>

      <div style={S.actionRow}>
        <button style={S.btn} onClick={reset} disabled={loading}>Clear form</button>
        <button
          style={{ ...S.btnPrimary("#534AB7"), flex: 1, opacity: loading ? 0.65 : 1 }}
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Submitting…" : "Submit application"}
        </button>
      </div>
      {msg && <div style={S.msg(msg.ok)}>{msg.text}</div>}
    </div>
  );
};

// ─── Group Panel ──────────────────────────────────────────────────────────────

const GroupPanel: React.FC<{ availableCustomers: Customer[] }> = ({ availableCustomers }) => {
  const { createGroupLoan, loading } = useLoans();
  const today = new Date().toISOString().split("T")[0];

  const [loanCustomerSearch, setLoanCustomerSearch] = useState("");
const [loanSearchResults, setLoanSearchResults] = useState([]);
const [loanSearchLoading, setLoanSearchLoading] = useState(false);
const [showLoanDropdown, setShowLoanDropdown] = useState(false);
const [selectedLoanCustomer, setSelectedLoanCustomer] = useState(null);

  const [form, setForm] = useState<GroupForm>({
    groupName: "", startDate: today, guarantorName: "", guarantorPhone: "", notes: "",
  });
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAmt, setNewAmt] = useState("");
  // When availableCustomers is present we let user pick a registered customer.
  const [newCustomerId, setNewCustomerId] = useState("");
  const [memberErr, setMemberErr] = useState("");
  const [formErr, setFormErr] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof GroupForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const addMember = () => {
    const resolvedName = selectedLoanCustomer?.name;
       if (!resolvedName.trim() || !newAmt || parseFloat(newAmt) <= 0) {
      setMemberErr("Please enter a name and loan share amount.");
      return;
    }
    if (members.find((m) => m.name.toLowerCase() === resolvedName.trim().toLowerCase())) {
      setMemberErr("Member already added.");
      return;
    }
    const selectedCustomer = availableCustomers.find((c) => c.id === newCustomerId);
    setMemberErr("");
    setMembers((p) => [
      ...p,
      {
        id: Date.now().toString(),
        name: resolvedName.trim(),
        phone: selectedCustomer?.phone ?? newPhone.trim(),
        amount: parseFloat(newAmt),
        customerId: newCustomerId || undefined,
      },
    ]);
    setNewName(""); setNewPhone(""); setNewAmt(""); setNewCustomerId("");
  };

  const removeMember = (id: string) => setMembers((p) => p.filter((m) => m.id !== id));

  const totalDisb = members.reduce((s, m) => s + m.amount, 0);
  const totalInterest = totalDisb * GROUP_INTEREST_RATE;
  const totalRepay = totalDisb + totalInterest;

  const matDate = () => {
    if (!form.startDate) return "";
    const d = new Date(form.startDate);
    d.setMonth(d.getMonth() + GROUP_DURATION);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  };

  const submit = async () => {
    if (!form.groupName || !form.startDate || members.length < 2) {
      setFormErr("Please enter group name, start date, and add at least 2 members.");
      return;
    }
    setFormErr("");

    // Build the members payload expected by the backend.
    // customer_id is required by the controller; if the member was added
    // without a registered customer we fall back to a placeholder so the
    // backend can still create the record (adjust as your backend requires).
    const membersPayload: GroupMemberPayload[] = members.map((m) => ({
      customer_id: m.customerId ?? "unregistered",
      name: m.name,
      phone: m.phone,
      loan_share: m.amount,
    }));

    const payload: CreateGroupLoanPayload = {
      group_name:     form.groupName,
      start_date:     form.startDate,
      created_by_type: userType ?? '',
      created_by: userUUID,
      members:        membersPayload,
      guarantor_name: form.guarantorName || undefined,
      guarantor_phone: form.guarantorPhone || undefined,
      notes:          form.notes || undefined,
    };
    const result = await createGroupLoan(payload);
    if (result) {
      setMsg({ ok: true, text: "Group loan submitted successfully. Status: Pending review." });
    } else {
      setMsg({ ok: false, text: "Submission failed. Please check the details and try again." });
    }
  };

  const reset = () => {
    setForm({ groupName: "", startDate: today, guarantorName: "", guarantorPhone: "", notes: "" });
    setMembers([]); setNewName(""); setNewPhone(""); setNewAmt(""); setNewCustomerId("");
    setMemberErr(""); setFormErr(""); setMsg(null);
  };

  useEffect(() => {
  if (!loanCustomerSearch.trim()) {
    setLoanSearchResults([]);
    return;
  }

  const t = setTimeout(async () => {
    setLoanSearchLoading(true);
    try {
      const res = await fetch(
        `https://susu-pro-backend.onrender.com/api/customers/${companyId}/search?query=${loanCustomerSearch}`
      );
      const data = await res.json();
      console.log(`${JSON.stringify(data)}`)
      setLoanSearchResults(data.data || []);
    } catch {
      // silent
    } finally {
      setLoanSearchLoading(false);
    }
  }, 380);

  return () => clearTimeout(t);
}, [loanCustomerSearch]);

  return (
    <div>
      {/* Group info */}
      <div style={S.card}>
        <div style={S.cardHead}>Group details</div>
        <div style={S.g2}>
          <Field label="Group name" required>
            <Input value={form.groupName} onChange={set("groupName")} placeholder="e.g. Women Entrepreneurs Group" />
          </Field>
          <Field label="Start date" required>
            <Input type="date" value={form.startDate} onChange={set("startDate")} />
          </Field>
        </div>
        <div style={S.infoBox("#E6F1FB", "#B5D4F4", "#185FA5")}>
          Fixed 20% interest on each member's disbursed share. Duration is fixed at 6 months.
        </div>
      </div>

      {/* Add members */}
      <div style={S.card}>
        <div style={S.cardHead}>Add members</div>
        <div style={S.g3}>
          <Field label="Loan Member">
            <div className="relative">
              <Input
                value={loanCustomerSearch}
                onChange={(e) => {
                  setLoanCustomerSearch(e.target.value);
                  setShowLoanDropdown(true);
                }}
                placeholder="Search customer..."
              />

              {showLoanDropdown && loanCustomerSearch && (
                <div className="absolute z-20 w-full mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-lg max-h-[220px] overflow-y-auto">
                  
                  {loanSearchLoading ? (
                    <div className="py-4 text-center text-[13px] text-gray-400">
                      Searching…
                    </div>
                  ) : loanSearchResults.length > 0 ? (
                    loanSearchResults.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedLoanCustomer(c);
                          setNewCustomerId(c.customer_id); // important
                          setLoanCustomerSearch(c.name);
                          setShowLoanDropdown(false);
                        }}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                      >
                        <div>
                          <p className="text-[13px] font-medium">{c.name}</p>
                          <p className="text-[11px] text-gray-400">
                            {c.phone_number}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-[13px] text-gray-400">
                      No customers found
                    </div>
                  )}
                </div>
              )}
            </div>
          </Field>
          <Field label="Phone">
            <Input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+233…" />
          </Field>
          <Field label="Loan share (₵)">
            <Input type="number" value={newAmt} onChange={(e) => setNewAmt(e.target.value)} placeholder="0.00" min="0" step="0.01" />
          </Field>
        </div>
        {memberErr && <div style={{ ...S.msg(false), marginTop: 6 }}>{memberErr}</div>}
        <button style={{ ...S.btnPrimary("#0F6E56"), marginTop: 10, fontSize: 12, padding: "7px 14px" }} onClick={addMember}>
          + Add member
        </button>

        {members.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#b8b6cc", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>
              Members ({members.length})
            </div>
            {members.map((m, idx) => {
              const int = m.amount * GROUP_INTEREST_RATE;
              const total = m.amount + int;
              const monthly = total / GROUP_DURATION;
              return (
                <div key={m.id} style={S.memberItem}>
                  <div style={S.avatar(idx)}>{initials(m.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1830" }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: "#9896b0" }}>{m.phone || "No phone"}</div>
                  </div>
                  <div style={{ textAlign: "right", marginRight: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0F6E56" }}>{GHS(m.amount)}</div>
                    <div style={{ fontSize: 11, color: "#9896b0" }}>
                      +{GHS(int)} interest · {GHS(monthly)}/mo
                    </div>
                    <div style={{ fontSize: 11, color: "#9896b0" }}>Total: {GHS(total)}</div>
                  </div>
                  <button
                    style={{ ...S.btnSm, border: "1px solid #F7C1C1", background: "#FCEBEB", color: "#A32D2D", padding: "4px 9px" }}
                    onClick={() => removeMember(m.id)}
                  >×</button>
                </div>
              );
            })}
          </div>
        )}

        {members.length > 0 && (
          <div style={S.totalRow("#EEEDFE", "#CECBF6")}>
            <span style={{ fontSize: 12, color: "#3C3489" }}>Total group disbursement</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#534AB7" }}>{GHS(totalDisb)}</span>
          </div>
        )}
      </div>

      {/* Summary */}
      {members.length > 0 && (
        <div style={{ ...S.card, border: "1px solid #9FE1CB" }}>
          <div style={{ ...S.cardHead, color: "#0F6E56" }}>Group summary</div>
          <div style={{ ...S.metricsGrid, gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div style={S.metric("#E1F5EE")}>
              <div style={S.metricLabel}>Total disbursed</div>
              <div style={S.metricVal("#0F6E56")}>{GHS(totalDisb)}</div>
            </div>
            <div style={S.metric("#E6F1FB")}>
              <div style={S.metricLabel}>Total interest (20%)</div>
              <div style={S.metricVal("#185FA5")}>{GHS(totalInterest)}</div>
            </div>
            <div style={S.metric("#EEEDFE")}>
              <div style={S.metricLabel}>Total repayment</div>
              <div style={S.metricVal("#534AB7")}>{GHS(totalRepay)}</div>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#b8b6cc", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 4 }}>
              Individual breakdown
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={S.sched}>
                <thead>
                  <tr>
                    <th style={{ ...S.th, textAlign: "left" }}>Member</th>
                    <th style={S.th}>Share</th>
                    <th style={S.th}>Interest (20%)</th>
                    <th style={S.th}>Monthly (6mo)</th>
                    <th style={S.th}>Total repay</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const int = m.amount * GROUP_INTEREST_RATE;
                    const total = m.amount + int;
                    const monthly = total / GROUP_DURATION;
                    return (
                      <tr key={m.id}>
                        <td style={S.tdL}>{m.name}</td>
                        <td style={S.td}>{GHS(m.amount)}</td>
                        <td style={{ ...S.td, color: "#185FA5" }}>{GHS(int)}</td>
                        <td style={{ ...S.td, fontWeight: 600, color: "#0F6E56" }}>{GHS(monthly)}</td>
                        <td style={{ ...S.td, fontWeight: 600 }}>{GHS(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {form.startDate && (
            <div style={S.infoBox("#E1F5EE", "#9FE1CB", "#085041")}>
              Maturity date: <strong>{matDate()}</strong> · 6-month fixed term · 20% interest per member
            </div>
          )}
        </div>
      )}

      {/* Guarantor */}
      {/* <div style={S.card}>
        <div style={S.cardHead}>Guarantor & notes</div>
        <div style={S.g2}>
          <Field label="Group guarantor">
            <Input value={form.guarantorName} onChange={set("guarantorName")} placeholder="Name" />
          </Field>
          <Field label="Guarantor phone">
            <Input type="tel" value={form.guarantorPhone} onChange={set("guarantorPhone")} placeholder="+233…" />
          </Field>
        </div>
        <div style={{ marginTop: 10 }}>
          <Field label="Notes">
            <textarea style={S.textarea} value={form.notes} onChange={set("notes")} placeholder="Additional notes…" />
          </Field>
        </div>
      </div> */}

      {formErr && <div style={S.msg(false)}>{formErr}</div>}
      <div style={S.actionRow}>
        <button style={S.btn} onClick={reset} disabled={loading}>Clear</button>
        <button
          style={{ ...S.btnPrimary("#0F6E56"), flex: 1, opacity: loading ? 0.65 : 1 }}
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Submitting…" : "Submit group loan"}
        </button>
      </div>
      {msg && <div style={S.msg(msg.ok)}>{msg.text}</div>}
    </div>
  );
};

// ─── P2P Panel ────────────────────────────────────────────────────────────────

const P2PPanel: React.FC = () => {
  const { createP2PLoan, logRepayment, updateP2PStatus, loading } = useLoans();
  const today = new Date().toISOString().split("T")[0];

  // Local state mirrors the original but entries also carry apiId after creation.
  const [entries, setEntries] = useState<P2PEntry[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", amount: "", date: today, reason: "", relationship: "", notes: "" });
  const [payForm, setPayForm] = useState({ entryId: "", amount: "", date: today, note: "" });
  const [formErr, setFormErr] = useState("");
  const [payErr, setPayErr] = useState("");

  const setF = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const addEntry = async () => {
    if (!form.name.trim() || !form.amount || parseFloat(form.amount) <= 0 || !form.date || !form.reason.trim()) {
      setFormErr("Please fill name, amount, date, and reason.");
      return;
    }
    setFormErr("");

    const payload: CreateP2PLoanPayload = {
      recipient_name:  form.name.trim(),
      recipient_phone: form.phone.trim() || undefined,
      amount:          parseFloat(form.amount),
      date_sent:       form.date,
      reason:          form.reason.trim(),
      relationship:    form.relationship.trim() || undefined,
      notes:           form.notes.trim() || undefined,
    };

    const result = await createP2PLoan(payload);
    if (!result) return; // toast already shown by context

    // Add to local UI state; use backend ID as the canonical reference.
    const localEntry: P2PEntry = {
      id: result.id,                       // use backend ID
      apiId: result.id,
      recipientName: form.name.trim(),
      recipientPhone: form.phone.trim(),
      amount: parseFloat(form.amount),
      dateSent: form.date,
      reason: form.reason.trim(),
      relationship: form.relationship.trim(),
      notes: form.notes.trim(),
      status: "active",
      payments: [],
    };

    setEntries((p) => [...p, localEntry]);
    setForm({ name: "", phone: "", amount: "", date: today, reason: "", relationship: "", notes: "" });
  };

  const setEntryStatus = async (id: string, status: P2PStatus) => {
    const ok = await updateP2PStatus(id, status);
    if (ok) setEntries((p) => p.map((e) => e.id === id ? { ...e, status } : e));
  };

  const logPay = async () => {
    if (!payForm.entryId || !payForm.amount || parseFloat(payForm.amount) <= 0 || !payForm.date) {
      setPayErr("Select an entry, enter amount and date.");
      return;
    }
    setPayErr("");

    const ok = await logRepayment({
      loanId:       payForm.entryId,
      amount_paid:  parseFloat(payForm.amount),
      payment_date: payForm.date,
      note:         payForm.note || undefined,
    });

    if (!ok) return;

    // Mirror the payment in local UI state.
    setEntries((p) => p.map((e) =>
      e.id === payForm.entryId
        ? {
            ...e,
            payments: [
              ...e.payments,
              { id: Date.now().toString(), amount: parseFloat(payForm.amount), date: payForm.date, note: payForm.note },
            ],
          }
        : e
    ));
    setPayForm((p) => ({ ...p, entryId: "", amount: "", note: "" }));
  };

  const totalOutstanding = entries
    .filter((e) => e.status !== "ended")
    .reduce((s, e) => s + (e.amount - e.payments.reduce((ps, p) => ps + p.amount, 0)), 0);
  const totalSent = entries.reduce((s, e) => s + e.amount, 0);
  const totalRecovered = entries.reduce((s, e) => s + e.payments.reduce((ps, p) => ps + p.amount, 0), 0);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div>
      {/* New entry form */}
      <div style={S.card}>
        <div style={S.cardHead}>New P2P entry</div>
        <div style={S.infoBox("#FAEEDA", "#FAC775", "#633806")}>
          P2P tracks money sent without interest. Log repayments as they come in.
        </div>
        <div style={{ ...S.g2, marginTop: 12 }}>
          <Field label="Recipient name" required>
            <Input value={form.name} onChange={setF("name")} placeholder="Full name" />
          </Field>
          <Field label="Phone">
            <Input type="tel" value={form.phone} onChange={setF("phone")} placeholder="+233 XX XXX XXXX" />
          </Field>
          <Field label="Amount sent (₵)" required>
            <Input type="number" value={form.amount} onChange={setF("amount")} placeholder="0.00" min="0" step="0.01" />
          </Field>
          <Field label="Date sent" required>
            <Input type="date" value={form.date} onChange={setF("date")} />
          </Field>
          <Field label="Reason / purpose" required>
            <Input value={form.reason} onChange={setF("reason")} placeholder="e.g. Business capital" />
          </Field>
          <Field label="Relationship">
            <Input value={form.relationship} onChange={setF("relationship")} placeholder="e.g. Friend, cousin…" />
          </Field>
        </div>
        <div style={{ marginTop: 10 }}>
          <Field label="Notes">
            <textarea style={S.textarea} value={form.notes} onChange={setF("notes")} placeholder="Any context…" />
          </Field>
        </div>
        {formErr && <div style={S.msg(false)}>{formErr}</div>}
        <div style={{ marginTop: 10 }}>
          <button
            style={{ ...S.btnPrimary("#BA7517"), opacity: loading ? 0.65 : 1 }}
            onClick={addEntry}
            disabled={loading}
          >
            {loading ? "Saving…" : "+ Add entry"}
          </button>
        </div>
      </div>

      {/* Summary metrics */}
      {entries.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
            <div style={S.metric("#FAEEDA")}>
              <div style={S.metricLabel}>Total sent</div>
              <div style={S.metricVal("#854F0B")}>{GHS(totalSent)}</div>
            </div>
            <div style={S.metric("#E1F5EE")}>
              <div style={S.metricLabel}>Recovered</div>
              <div style={S.metricVal("#0F6E56")}>{GHS(totalRecovered)}</div>
            </div>
            <div style={S.metric("#FCEBEB")}>
              <div style={S.metricLabel}>Outstanding</div>
              <div style={S.metricVal("#A32D2D")}>{GHS(totalOutstanding)}</div>
            </div>
          </div>

          {/* Entries list */}
          <div style={S.card}>
            <div style={S.cardHead}>P2P entries ({entries.length})</div>
            {entries.map((e, idx) => {
              const paid = e.payments.reduce((s, p) => s + p.amount, 0);
              const bal = e.amount - paid;
              const pct = Math.min(100, (paid / e.amount) * 100);
              return (
                <div key={e.id} style={{ ...S.card, marginBottom: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={S.avatar(idx)}>{initials(e.recipientName)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1830" }}>
                        {e.recipientName}
                        {e.relationship && (
                          <span style={{ fontSize: 11, fontWeight: 400, color: "#9896b0", marginLeft: 6 }}>· {e.relationship}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "#9896b0" }}>
                        {e.reason} · {fmtDate(e.dateSent)}
                        {e.recipientPhone && ` · ${e.recipientPhone}`}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#BA7517" }}>{GHS(e.amount)}</div>
                      <div style={{ fontSize: 11, color: "#9896b0" }}>Balance: {GHS(bal)}</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={S.progressOuter}>
                      <div style={{ height: "100%", width: `${pct.toFixed(0)}%`, background: "#0F6E56", borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, color: "#9896b0", minWidth: 60, textAlign: "right" }}>
                      {pct.toFixed(0)}% repaid
                    </span>
                  </div>

                  {/* Status + actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                    <span style={S.pillStatus(e.status)}>
                      {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                    </span>
                    {e.status !== "active" && (
                      <button style={{ ...S.btnSm, fontSize: 11, color: "#3B6D11", background: "#EAF3DE", border: "1px solid #C0DD97" }} onClick={() => setEntryStatus(e.id, "active")}>
                        Set active
                      </button>
                    )}
                    {e.status !== "inactive" && (
                      <button style={{ ...S.btnSm, fontSize: 11 }} onClick={() => setEntryStatus(e.id, "inactive")}>
                        Set inactive
                      </button>
                    )}
                    {e.status !== "ended" && (
                      <button style={{ ...S.btnSm, fontSize: 11, color: "#A32D2D", background: "#FCEBEB", border: "1px solid #F7C1C1" }} onClick={() => setEntryStatus(e.id, "ended")}>
                        End
                      </button>
                    )}
                  </div>

                  {/* Payment history */}
                  {e.payments.length > 0 && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #F0EFF8" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#b8b6cc", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 4 }}>
                        Payment history
                      </div>
                      {e.payments.map((p) => (
                        <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #F0EFF8" }}>
                          <span style={{ fontSize: 12, color: "#5a5878" }}>{fmtDate(p.date)}{p.note && ` — ${p.note}`}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#0F6E56" }}>+{GHS(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Log repayment */}
          <div style={S.card}>
            <div style={S.cardHead}>Log a repayment</div>
            <div style={S.g3}>
              <Field label="Entry">
                <SelectEl value={payForm.entryId} onChange={(e) => setPayForm((p) => ({ ...p, entryId: e.target.value }))}>
                  <option value="">Select recipient…</option>
                  {entries.filter((e) => e.status === "active").map((e) => {
                    const bal = e.amount - e.payments.reduce((s, p) => s + p.amount, 0);
                    return <option key={e.id} value={e.id}>{e.recipientName} ({GHS(bal)} left)</option>;
                  })}
                </SelectEl>
              </Field>
              <Field label="Amount (₵)">
                <Input type="number" value={payForm.amount} onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))} placeholder="0.00" min="0" step="0.01" />
              </Field>
              <Field label="Date">
                <Input type="date" value={payForm.date} onChange={(e) => setPayForm((p) => ({ ...p, date: e.target.value }))} />
              </Field>
            </div>
            <div style={{ marginTop: 8 }}>
              <Field label="Note">
                <Input value={payForm.note} onChange={(e) => setPayForm((p) => ({ ...p, note: e.target.value }))} placeholder="Optional note…" />
              </Field>
            </div>
            {payErr && <div style={S.msg(false)}>{payErr}</div>}
            <div style={{ marginTop: 10 }}>
              <button
                style={{ ...S.btnPrimary("#0F6E56"), opacity: loading ? 0.65 : 1 }}
                onClick={logPay}
                disabled={loading}
              >
                {loading ? "Saving…" : "Log repayment"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

const NewLoanModal: React.FC<NewLoanModalProps> = ({
  showNewLoanModal,
  setShowNewLoanModal,
  availableCustomers = [],
}) => {
  const [tab, setTab] = useState<LoanTab>("individual");

  if (!showNewLoanModal) return null;

  const tabs: { id: LoanTab; label: string; color: string }[] = [
    { id: "individual", label: "Individual loan", color: "#534AB7" },
    { id: "group",      label: "Group loan",       color: "#0F6E56" },
    { id: "p2p",        label: "P2P lending",       color: "#BA7517" },
  ];

  return (
    <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) setShowNewLoanModal(false); }}>
      <div style={S.modal}>
        {/* Header */}
        <div style={S.header}>
          <div style={S.headerTop}>
            <div>
              <p style={S.headerTitle}>New loan application</p>
              <p style={S.headerSub}>Complete the details and calculations will update automatically</p>
            </div>
            <button style={S.closeBtn} onClick={() => setShowNewLoanModal(false)}>×</button>
          </div>

          <div style={S.tabs}>
            {tabs.map((t) => (
              <button key={t.id} style={S.tab(tab === t.id, t.color)} onClick={() => setTab(t.id)}>
                <span style={S.tabDot(t.color)} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={S.body}>
          {tab === "individual" && <IndividualPanel availableCustomers={availableCustomers} />}
          {tab === "group"      && <GroupPanel      availableCustomers={availableCustomers} />}
          {tab === "p2p"        && <P2PPanel />}
        </div>
      </div>
    </div>
  );
};

export default NewLoanModal;
