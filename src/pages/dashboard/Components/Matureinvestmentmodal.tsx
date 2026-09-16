import { useState } from "react";
import { useAccounts } from "../../../contexts/dashboard/Account";
import { useTransactions } from "../../../contexts/dashboard/Transactions";
import { companyId, makeSuSuProName, userUUID } from "../../../constants/appConstants";

const BASE_URL = "https://susu-pro-backend.onrender.com/api";

interface InvestmentRow {
  id: string;
  reference: string;
  product_type: string;
  principal_amount: number | string;
  expected_interest: number | string;
  expected_maturity_value: number | string;
  current_balance: number | string;
  customer_id: string;
  customer_name: string;
  account_number: string;
  sms_enabled?: boolean;
  sms_numbers?: string[];
}

interface Account {
  id: string;
  account_type: string;
  account_number: string;
  balance: number;
  customer_id?: string;
}

interface MatureInvestmentModalProps {
  isOpen: boolean;
  investment: InvestmentRow | null;
  parentCompanyName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const formatGHS = (n: number | string) =>
  Number(n).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: "💵" },
  { value: "momo", label: "Mobile Money", icon: "📱" },
  { value: "bank_transfer", label: "Bank Transfer", icon: "🏦" },
];

const S = {
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

export default function MatureInvestmentModal({
  isOpen, investment, parentCompanyName, onClose, onSuccess,
}: MatureInvestmentModalProps) {
  const { accounts } = useAccounts();
  const { sendMessage } = useTransactions();

  const [payoutMode, setPayoutMode] = useState<"cash" | "account">("cash");
  const [targetAccountId, setTargetAccountId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [narration, setNarration] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !investment) return null;

  const customerAccounts: Account[] = accounts.filter(
    (a: Account) => a.customer_id === investment.customer_id
  );

  const payoutAmount = Number(investment.current_balance) + Number(investment.expected_interest);

  const handleConfirm = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${BASE_URL}/investments/${investment.id}/mature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          processed_by: userUUID,
          target_account_id: payoutMode === "account" ? targetAccountId || null : null,
          payment_method: payoutMode === "cash" ? paymentMethod : undefined,
          narration: narration || undefined,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setErrorMsg(data.message ?? "Maturity payout failed.");
        setLoading(false);
        return;
      }

      if (investment.sms_enabled && Array.isArray(investment.sms_numbers) && investment.sms_numbers.length > 0) {
        const message =
          `Dear ${investment.customer_name}, your investment ${investment.reference} has matured. ` +
          `Principal: GHS${formatGHS(data.data?.principal_paid ?? investment.current_balance)}, ` +
          `Interest: GHS${formatGHS(data.data?.interest_paid ?? investment.expected_interest)}, ` +
          `Total payout: GHS${formatGHS(data.data?.total_payout ?? payoutAmount)}. Thank you for investing with us.`;

        sendMessage({
          messageTo: investment.sms_numbers,
          message,
          messageFrom: makeSuSuProName(parentCompanyName ?? ""),
        }).catch((err) => console.warn("Maturity SMS failed but payout succeeded:", err));
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
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8e8e6", width: "100%", maxWidth: 460, overflow: "hidden" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid #eeeeec" }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: "#1a1a18" }}>Process Maturity Payout</div>
          <div style={{ fontSize: 12, color: "#888780", marginTop: 2 }}>{investment.reference} · {investment.customer_name}</div>
        </div>

        <div style={{ padding: "18px 22px" }}>
          {errorMsg && (
            <div style={{ marginBottom: 12, padding: "8px 12px", background: "#fcebeb", border: "1px solid #f7c1c1", borderRadius: 8, fontSize: 12, color: "#a32d2d" }}>
              {errorMsg}
            </div>
          )}

          <div style={{
            background: "linear-gradient(135deg, #f0faf6 0%, #e8f8f2 100%)", border: "1px solid #b8e8d6",
            borderRadius: 10, padding: "14px 16px", marginBottom: 16, textAlign: "center",
          }}>
            <div style={{ fontSize: 10, color: "#5f9e8a", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Payout</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: "#0f6e56", marginTop: 4 }}>GHS {formatGHS(payoutAmount)}</div>
            <div style={{ fontSize: 11, color: "#5f9e8a", marginTop: 2 }}>
              Principal GHS {formatGHS(investment.current_balance)} + Interest GHS {formatGHS(investment.expected_interest)}
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 500, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Pay out to
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {(["cash", "account"] as const).map((m) => (
              <div
                key={m}
                onClick={() => { setPayoutMode(m); setTargetAccountId(""); }}
                style={{
                  flex: 1, padding: "9px", borderRadius: 10, textAlign: "center", cursor: "pointer",
                  border: `1px solid ${payoutMode === m ? "#1d9e75" : "#e8e8e6"}`,
                  background: payoutMode === m ? "#f0faf6" : "#fff",
                  color: payoutMode === m ? "#0f6e56" : "#5f5e5a", fontSize: 12.5,
                  fontWeight: payoutMode === m ? 500 : 400,
                }}
              >
                {m === "cash" ? "💵 Cash / Mobile Money" : "💳 Credit an account"}
              </div>
            ))}
          </div>

          {payoutMode === "cash" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              {PAYMENT_METHODS.map((pm) => (
                <div
                  key={pm.value} onClick={() => setPaymentMethod(pm.value)}
                  style={{
                    padding: "9px 6px", borderRadius: 8, textAlign: "center", cursor: "pointer",
                    border: `1px solid ${paymentMethod === pm.value ? "#1d9e75" : "#e8e8e6"}`,
                    background: paymentMethod === pm.value ? "#f0faf6" : "#fff", fontSize: 11.5,
                  }}
                >
                  <div style={{ fontSize: 15 }}>{pm.icon}</div>
                  {pm.label}
                </div>
              ))}
            </div>
          )}

          {payoutMode === "account" && (
            <div style={{ marginBottom: 14 }}>
              {customerAccounts.length === 0 && (
                <div style={{ fontSize: 12, color: "#888780" }}>This customer has no other accounts to credit.</div>
              )}
              {customerAccounts.map((acc) => (
                <div
                  key={acc.id} onClick={() => setTargetAccountId(acc.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 6,
                    borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${targetAccountId === acc.id ? "#1d9e75" : "#e8e8e6"}`,
                    background: targetAccountId === acc.id ? "#f0faf6" : "#fff",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, textTransform: "capitalize" }}>{acc.account_type}</div>
                    <div style={{ fontSize: 11, color: "#888780" }}>{acc.account_number}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#5f5e5a" }}>GHS {formatGHS(acc.balance)}</div>
                </div>
              ))}
            </div>
          )}

          <label style={{ display: "block", fontSize: 12, color: "#5f5e5a", marginBottom: 6 }}>Narration (optional)</label>
          <input
            type="text" value={narration} onChange={(e) => setNarration(e.target.value)}
            placeholder="e.g. Matured on schedule"
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d3d1c7", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ padding: "14px 22px", borderTop: "1px solid #eeeeec", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button style={S.cancelBtn} onClick={onClose}>Cancel</button>
          <PrimaryBtn onClick={handleConfirm} disabled={loading || (payoutMode === "account" && !targetAccountId)}>
            {loading ? "Processing…" : "Confirm Payout"}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
}