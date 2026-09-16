import { useState } from "react";
import { useTransactions } from "../../../contexts/dashboard/Transactions";
import { companyId, makeSuSuProName, userUUID } from "../../../constants/appConstants";

const BASE_URL = "https://susu-pro-backend.onrender.com/api";

interface InvestmentRow {
  id: string;
  reference: string;
  product_type: string;
  principal_amount: number | string;
  interest_rate: number | string;
  term_months: number;
  expected_maturity_value: number | string;
  account_number: string;
  customer_name: string;
  sms_enabled?: boolean;
  sms_numbers?: string[];
}

interface RolloverInvestmentModalProps {
  isOpen: boolean;
  investment: InvestmentRow | null;
  parentCompanyName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const formatGHS = (n: number | string) =>
  Number(n).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const S = {
  input: {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1px solid #d3d1c7", background: "#fff", color: "#1a1a18",
    fontSize: 13, fontFamily: "inherit", outline: "none",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,
  label: { display: "block", fontSize: 12, color: "#5f5e5a", marginBottom: 6 },
  cancelBtn: {
    padding: "8px 16px", borderRadius: 8, border: "1px solid #e8e8e6",
    background: "#fff", fontSize: 13, color: "#5f5e5a", cursor: "pointer", fontFamily: "inherit",
  } as React.CSSProperties,
};

function PrimaryBtn({ onClick, children, disabled }: { onClick?: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        padding: "8px 20px", borderRadius: 8, border: "none",
        background: disabled ? "#b4b2a9" : "#1d9e75",
        color: "white", fontSize: 13, fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
        display: "flex", alignItems: "center", gap: 6,
      }}
    >{children}</button>
  );
}

export default function RolloverInvestmentModal({
  isOpen, investment, parentCompanyName, onClose, onSuccess,
}: RolloverInvestmentModalProps) {
  const { sendMessage } = useTransactions();
  const [newTermMonths, setNewTermMonths] = useState<string>(investment ? String(investment.term_months) : "");
  const [newRate, setNewRate] = useState<string>(investment ? String(investment.interest_rate) : "");
  const [includeInterest, setIncludeInterest] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !investment) return null;

  const principalBase = includeInterest
    ? Number(investment.expected_maturity_value)
    : Number(investment.principal_amount);
  const rate = parseFloat(newRate) || Number(investment.interest_rate);
  const term = parseInt(newTermMonths) || investment.term_months;
  const projectedInterest = principalBase * (rate / 100) * (term / 12);
  const projectedMaturity = principalBase + projectedInterest;

  const handleConfirm = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${BASE_URL}/investments/${investment.id}/rollover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          processed_by: userUUID,
          new_term_months: term,
          new_interest_rate: rate,
          include_interest: includeInterest,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setErrorMsg(data.message ?? "Rollover failed.");
        setLoading(false);
        return;
      }

      // Fire-and-forget SMS confirming the rollover — same pattern used
      // elsewhere in the app (don't block or fail the rollover on SMS error).
      if (investment.sms_enabled && Array.isArray(investment.sms_numbers) && investment.sms_numbers.length > 0) {
        const message =
          `Dear ${investment.customer_name}, your investment ${investment.reference} has been rolled over ` +
          `into a new ${term}-month term at ${rate}% p.a. New principal: GHS${formatGHS(principalBase)}. ` +
          `New reference: ${data.data?.new_reference ?? ""}.`;

        sendMessage({
          messageTo: investment.sms_numbers,
          message,
          messageFrom: makeSuSuProName(parentCompanyName ?? ""),
        }).catch((err) => console.warn("Rollover SMS failed but rollover succeeded:", err));
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message ?? "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60, display: "flex",
      alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)", padding: 16,
    }}>
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8e8e6", width: "100%", maxWidth: 440, overflow: "hidden" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid #eeeeec" }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: "#1a1a18" }}>Rollover Investment</div>
          <div style={{ fontSize: 12, color: "#888780", marginTop: 2 }}>{investment.reference} · {investment.customer_name}</div>
        </div>

        <div style={{ padding: "18px 22px" }}>
          {errorMsg && (
            <div style={{ marginBottom: 12, padding: "8px 12px", background: "#fcebeb", border: "1px solid #f7c1c1", borderRadius: 8, fontSize: 12, color: "#a32d2d" }}>
              {errorMsg}
            </div>
          )}

          <label style={S.label}>New term (months)</label>
          <input type="number" min={1} value={newTermMonths} onChange={(e) => setNewTermMonths(e.target.value)} style={{ ...S.input, marginBottom: 14 }} />

          <label style={S.label}>New interest rate (% p.a.)</label>
          <input type="number" min={0} step="0.5" value={newRate} onChange={(e) => setNewRate(e.target.value)} style={{ ...S.input, marginBottom: 14 }} />

          <div
            onClick={() => setIncludeInterest((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
              padding: "8px 10px", background: "#fafaf8", border: "1px solid #e8e8e6", borderRadius: 8, marginBottom: 14,
            }}
          >
            <div style={{
              width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${includeInterest ? "#1d9e75" : "#d3d1c7"}`,
              background: includeInterest ? "#1d9e75" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {includeInterest && (
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2">
                  <polyline points="2,5 4,7.5 8,3" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 12, color: "#5f5e5a" }}>Roll interest into new principal</span>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #f0faf6 0%, #e8f8f2 100%)", border: "1px solid #b8e8d6",
            borderRadius: 10, padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "center",
          }}>
            <div>
              <div style={{ fontSize: 10, color: "#5f9e8a" }}>New Principal</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a18" }}>GHS {formatGHS(principalBase)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#5f9e8a" }}>Interest</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f6e56" }}>GHS {formatGHS(projectedInterest)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#5f9e8a" }}>At Maturity</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f6e56" }}>GHS {formatGHS(projectedMaturity)}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 22px", borderTop: "1px solid #eeeeec", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button style={S.cancelBtn} onClick={onClose}>Cancel</button>
          <PrimaryBtn onClick={handleConfirm} disabled={loading}>{loading ? "Rolling over…" : "Confirm Rollover"}</PrimaryBtn>
        </div>
      </div>
    </div>
  );
} 