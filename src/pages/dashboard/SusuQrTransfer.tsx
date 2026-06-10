import { useState, useEffect, useRef } from "react";
import { useAccounts } from "../../contexts/dashboard/Account";
import { useParams } from 'react-router-dom';
import { Customer } from "../../data/mockData";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (val) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(val || 0);

// Simulated API calls – replace with your real hooks


const fakeTransfer = async (payload) => {
  await new Promise((r) => setTimeout(r, 1500));
  return { success: true, reference: "TXN" + Date.now() };
};

// ─── Particle background ──────────────────────────────────────────────────────
function Particles() {
  return (
    <div className="particles" aria-hidden="true">
      {[...Array(18)].map((_, i) => (
        <div key={i} className={`particle p${i % 6}`} style={{ "--i": i }} />
      ))}
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDots({ step, total }) {
  return (
    <div className="step-dots">
      {[...Array(total)].map((_, i) => (
        <div key={i} className={`dot ${i === step ? "active" : i < step ? "done" : ""}`} />
      ))}
    </div>
  );
}

// ─── Amount Pad ───────────────────────────────────────────────────────────────
function AmountPad({ value, onChange }) {
  const keys = ["1","2","3","4","5","6","7","8","9",".",  "0","⌫"];
  const press = (k) => {
    if (k === "⌫") return onChange(value.slice(0, -1) || "");
    if (k === "." && value.includes(".")) return;
    if (value.length >= 8) return;
    onChange(value + k);
  };
  return (
    <div className="numpad">
      {keys.map((k) => (
        <button key={k} className={`num-key ${k === "⌫" ? "del" : ""}`} onClick={() => press(k)}>
          {k}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const SusuQRTransfer = () => {

const { accounts, fetchCustomerByAccountNumber, selectedAgent, allAccounts, customerLoans, refreshAccounts, refreshAllCompanyAccounts, addAccount, toggleAccountStatus } = useAccounts();
    const getCustomerByAccountNumber = async (accountNumber: string) => {
  try {
    const res = await fetch(
      `https://susu-pro-backend.onrender.com/api/customers/account/${accountNumber}`
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

  // Simulate URL params – in your app use useSearchParams()
  const { account_number } = useParams();

  const [step, setStep] = useState(0); // 0=loading, 1=account, 2=amount, 3=confirm, 4=success
  const [direction, setDirection] = useState(1); // 1=forward, -1=back
  const [prevStep, setPrevStep] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [agentAccount, setAgentAccount] = useState(null);
  const [customerAccountInput, setCustomerAccountInput] = useState("");
  const [customerAccount, setCustomerAccount] = useState<Customer>();
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [narration, setNarration] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [txnRef, setTxnRef] = useState("");

  // Load agent on mount
  useEffect(() => {
    console.log(account_number);
    if (account_number) {
    fetchCustomerByAccountNumber(account_number);
  }
    getCustomerByAccountNumber(account_number).then((acc) => {
      setCustomerAccount(acc);
      setTimeout(() => goTo(1), 400);
    });
  }, [account_number]);

  const goTo = (target) => {
    if (animating) return;
    setDirection(target > step ? 1 : -1);
    setPrevStep(step);
    setAnimating(true);
    setTimeout(() => {
      setStep(target);
      setAnimating(false);
      setPrevStep(null);
    }, 380);
  };

  console.log(`Selected agent ${selectedAgent}`)

  const lookupCustomer = async () => {
    if (!customerAccountInput.trim()) return;
    setCustomerLoading(true);
    setCustomerError("");
    const acc = await getCustomerByAccountNumber(customerAccountInput.trim().toUpperCase());
    setCustomerLoading(false);
    if (!acc) { setCustomerError("Account not found. Please check the number."); return; }
    if (acc.account_number === account_number) { setCustomerError("You cannot transfer to the same agent account."); return; }
    setCustomerAccount(acc);
    goTo(2);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    const res = await fakeTransfer({
      from_account_id: customerAccount.account_number,
      to_account_id: agentAccount.account_number,
      amount: parseFloat(amountStr),
      description: narration || "QR Pay",
    });
    setIsProcessing(false);
    if (res.success) { setTxnRef(res.reference); goTo(4); }
  };

  const amount = parseFloat(amountStr) || 0;

  // ── Render ──
  return (
    <>
      <style>{css}</style>
      <div className="root">
        <Particles />

        {/* Card */}
        <div className="card">
          {/* Header */}
          <div className="card-header">
            <div className="logo-ring">
              <svg viewBox="0 0 40 40" fill="none" width="22" height="22">
                <path d="M20 4C11.163 4 4 11.163 4 20s7.163 16 16 16 16-7.163 16-16S28.837 4 20 4zm0 6a4 4 0 110 8 4 4 0 010-8zm0 22c-4.418 0-8.354-2.015-10.998-5.19C10.698 24.48 15.065 22 20 22s9.302 2.48 10.998 5.81C28.354 30.985 24.418 33 20 33z" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <p className="header-label">Big God</p>
              <p className="header-sub">Quick Transfer</p>
            </div>
            {step > 1 && step < 4 && (
              <div className="step-badge">{step - 1} / 3</div>
            )}
          </div>

          {/* Slide container */}
          <div className="slide-wrap">

            {/* STEP 0 – Loading */}
            {step === 0 && (
              <div className="slide center">
                <div className="spinner" />
                <p className="loading-text">Connecting…</p>
              </div>
            )}

            {/* STEP 1 – Enter customer account */}
            {step === 1 && (
              <div className={`slide ${animating ? (direction > 0 ? "exit-left" : "exit-right") : "enter"}`}>
                <StepDots step={0} total={3} />
                <div className="agent-card">
                  <div className="agent-avatar">{selectedAgent?.name?.[0] || "A"}</div>
                  <div>
                    <p className="agent-name">{selectedAgent?.name}</p>
                    <p className="agent-type">{selectedAgent?.account_type} · {selectedAgent?.account_number}</p>
                  </div>
                  <div className="verified-badge">
                    <svg viewBox="0 0 16 16" fill="currentColor" width="11" height="11"><path d="M8 0l1.8 2.5L13 1.5l.5 3.3L17 6l-1.5 2.7L17 11.3l-3.5.7-.5 3.3L10 14.2 8 17l-2-2.8-3.5 1.1-.5-3.3L-1 11.3l1.5-2.6L-1 6l3.5-1.2.5-3.3L6 2.5z"/></svg>
                    Verified
                  </div>
                </div>

                <p className="section-label">Your Account Number</p>
                <div className="input-group">
                  <input
                    className="text-input"
                    placeholder="e.g. ACC-001"
                    value={customerAccountInput}
                    onChange={(e) => { setCustomerAccountInput(e.target.value); setCustomerError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && lookupCustomer()}
                  />
                  {customerLoading && <div className="input-spinner" />}
                </div>
                {customerError && <p className="error-msg">{customerError}</p>}

                <button className="btn primary" onClick={lookupCustomer} disabled={customerLoading || !customerAccountInput.trim()}>
                  {customerLoading ? "Looking up…" : "Continue →"}
                </button>
              </div>
            )}

            {/* STEP 2 – Enter amount */}
            {step === 2 && (
              <div className={`slide ${animating ? (direction > 0 ? "exit-left" : "exit-right") : "enter"}`}>
                <button className="back-btn" onClick={() => { setCustomerAccount(null); goTo(1); }}>← Back</button>
                <StepDots step={1} total={3} />

                <div className="hello-wrap">
                  <p className="greeting">Hello,</p>
                  <p className="customer-name">{customerAccount?.name}</p>
                  <p className="account-tag">{customerAccount?.account_type} · {customerAccount?.account_number}</p>
                </div>

                <div className="amount-display">
                  <span className="currency-sym">GH₵</span>
                  <span className="amount-val">{amountStr || "0"}</span>
                </div>

                <AmountPad value={amountStr} onChange={setAmountStr} />

                <input
                  className="text-input narration"
                  placeholder="Add a note (optional)"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                />

                <button className="btn primary" onClick={() => goTo(3)} disabled={amount <= 0}>
                  Review →
                </button>
              </div>
            )}

            {/* STEP 3 – Confirm */}
            {step === 3 && (
              <div className={`slide ${animating ? (direction > 0 ? "exit-left" : "exit-right") : "enter"}`}>
                <button className="back-btn" onClick={() => goTo(2)}>← Back</button>
                <StepDots step={2} total={3} />

                <p className="confirm-title">Confirm Transfer</p>

                <div className="summary-card">
                  <div className="summary-row">
                    <span>From</span>
                    <span className="val">{customerAccount?.customer?.name}</span>
                  </div>
                  <div className="summary-row">
                    <span>Account</span>
                    <span className="val mono">{customerAccount?.account_number}</span>
                  </div>
                  <div className="divider" />
                  <div className="summary-row">
                    <span>To Agent</span>
                    <span className="val">{agentAccount?.customer?.name}</span>
                  </div>
                  <div className="summary-row">
                    <span>Account</span>
                    <span className="val mono">{agentAccount?.account_number}</span>
                  </div>
                  <div className="divider" />
                  <div className="summary-row big">
                    <span>Amount</span>
                    <span className="val green">{formatCurrency(amount)}</span>
                  </div>
                  {narration && (
                    <div className="summary-row">
                      <span>Note</span>
                      <span className="val italic">{narration}</span>
                    </div>
                  )}
                </div>

                <p className="consent-text">
                  An SMS notification will be sent to both you and the agent upon completion.
                </p>

                <button className="btn success" onClick={handleConfirm} disabled={isProcessing}>
                  {isProcessing ? (
                    <><span className="btn-spinner" /> Processing…</>
                  ) : (
                    "Confirm & Send ✓"
                  )}
                </button>
              </div>
            )}

            {/* STEP 4 – Success */}
            {step === 4 && (
              <div className="slide enter center">
                <div className="success-ring">
                  <svg viewBox="0 0 60 60" fill="none" width="40" height="40">
                    <path d="M10 30l14 14 26-28" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="success-title">Transfer Sent!</p>
                <p className="success-sub">
                  {formatCurrency(amount)} sent to {agentAccount?.customer?.name}
                </p>
                <div className="txn-chip">{txnRef}</div>
                <p className="sms-note">📱 SMS confirmation sent to both parties</p>
                <button className="btn outline" onClick={() => { setStep(1); setCustomerAccount(null); setAmountStr(""); setNarration(""); setCustomerAccountInput(""); }}>
                  New Transfer
                </button>
              </div>
            )}

          </div>
        </div>

        <p className="footer-text">Secured by SuSu · Powered by your savings</p>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: #0a0e1a;
    font-family: 'DM Sans', sans-serif;
    position: relative;
    overflow: hidden;
  }

  /* ── Particles ── */
  .particles { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
  .particle {
    position: absolute;
    border-radius: 50%;
    animation: float var(--dur, 12s) ease-in-out infinite;
    animation-delay: calc(var(--i) * -1.3s);
    opacity: .12;
  }
  .p0 { width: 220px; height: 220px; background: #4f46e5; left: -80px; top: 10%; }
  .p1 { width: 140px; height: 140px; background: #10b981; right: 5%; top: 30%; }
  .p2 { width: 90px; height: 90px; background: #f59e0b; left: 30%; bottom: 15%; }
  .p3 { width: 180px; height: 180px; background: #6366f1; right: -50px; bottom: 5%; --dur: 15s; }
  .p4 { width: 60px; height: 60px; background: #34d399; left: 60%; top: 8%; --dur: 9s; }
  .p5 { width: 110px; height: 110px; background: #818cf8; left: 15%; top: 50%; --dur: 11s; }

  @keyframes float {
    0%,100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-30px) scale(1.05); }
  }

  /* ── Card ── */
  .card {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 420px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 28px;
    backdrop-filter: blur(20px);
    overflow: hidden;
    box-shadow: 0 30px 80px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.08);
  }

  /* ── Header ── */
  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 22px 28px 18px;
    border-bottom: 1px solid rgba(255,255,255,.07);
    background: rgba(255,255,255,.03);
  }
  .logo-ring {
    width: 44px; height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4f46e5, #10b981);
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    flex-shrink: 0;
    box-shadow: 0 0 20px rgba(79,70,229,.4);
  }
  .header-label { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: #fff; }
  .header-sub { font-size: 11px; color: rgba(255,255,255,.45); margin-top: 1px; }
  .step-badge {
    margin-left: auto;
    font-size: 11px;
    font-weight: 600;
    color: #818cf8;
    background: rgba(99,102,241,.15);
    border: 1px solid rgba(99,102,241,.3);
    padding: 3px 10px;
    border-radius: 20px;
  }

  /* ── Slide ── */
  .slide-wrap { padding: 28px; min-height: 460px; position: relative; }

  .slide { animation: slideIn .38s cubic-bezier(.4,0,.2,1) both; }
  .slide.exit-left { animation: slideOutLeft .38s cubic-bezier(.4,0,.2,1) both; }
  .slide.exit-right { animation: slideOutRight .38s cubic-bezier(.4,0,.2,1) both; }
  .slide.center { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 420px; gap: 14px; }

  @keyframes slideIn { from { opacity: 0; transform: translateX(32px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes slideOutLeft { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-32px); } }
  @keyframes slideOutRight { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(32px); } }

  /* ── Step dots ── */
  .step-dots { display: flex; gap: 6px; margin-bottom: 24px; }
  .dot { width: 28px; height: 4px; border-radius: 2px; background: rgba(255,255,255,.12); transition: all .3s ease; }
  .dot.active { background: #818cf8; width: 36px; }
  .dot.done { background: #10b981; }

  /* ── Agent card ── */
  .agent-card {
    display: flex; align-items: center; gap: 12px;
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 16px;
    padding: 14px 16px;
    margin-bottom: 24px;
    position: relative;
  }
  .agent-avatar {
    width: 42px; height: 42px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4f46e5, #818cf8);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
    font-weight: 800; font-size: 17px; color: #fff;
    flex-shrink: 0;
  }
  .agent-name { font-weight: 600; color: #fff; font-size: 14px; }
  .agent-type { font-size: 11px; color: rgba(255,255,255,.45); margin-top: 2px; }
  .verified-badge {
    margin-left: auto;
    display: flex; align-items: center; gap: 4px;
    font-size: 10px; font-weight: 600;
    color: #10b981;
    background: rgba(16,185,129,.12);
    border: 1px solid rgba(16,185,129,.25);
    padding: 3px 8px; border-radius: 12px;
  }

  /* ── Inputs ── */
  .section-label { font-size: 12px; font-weight: 500; color: rgba(255,255,255,.5); margin-bottom: 8px; letter-spacing: .05em; text-transform: uppercase; }
  .input-group { position: relative; margin-bottom: 8px; }
  .text-input {
    width: 100%;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 14px;
    padding: 14px 18px;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    outline: none;
    transition: border-color .2s, background .2s;
  }
  .text-input::placeholder { color: rgba(255,255,255,.25); }
  .text-input:focus { border-color: #818cf8; background: rgba(129,140,248,.08); }
  .text-input.narration { margin-top: 12px; font-size: 13px; }
  .input-spinner {
    position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,.2);
    border-top-color: #818cf8;
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }
  .error-msg { font-size: 12px; color: #f87171; margin-bottom: 10px; }

  /* ── Buttons ── */
  .btn {
    width: 100%; padding: 15px;
    border-radius: 16px;
    font-family: 'Syne', sans-serif;
    font-weight: 700; font-size: 14px;
    border: none; cursor: pointer;
    transition: all .2s ease;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    margin-top: 16px;
  }
  .btn:disabled { opacity: .4; cursor: not-allowed; }
  .btn.primary {
    background: linear-gradient(135deg, #4f46e5, #818cf8);
    color: #fff;
    box-shadow: 0 8px 24px rgba(79,70,229,.4);
  }
  .btn.primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(79,70,229,.55); }
  .btn.success {
    background: linear-gradient(135deg, #059669, #10b981);
    color: #fff;
    box-shadow: 0 8px 24px rgba(16,185,129,.35);
  }
  .btn.success:hover:not(:disabled) { transform: translateY(-2px); }
  .btn.outline {
    background: transparent;
    color: #818cf8;
    border: 1.5px solid #818cf8;
    margin-top: 8px;
  }
  .btn.outline:hover { background: rgba(129,140,248,.1); }
  .btn-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin .7s linear infinite;
    display: inline-block;
  }

  /* ── Back ── */
  .back-btn {
    background: none; border: none; cursor: pointer;
    color: rgba(255,255,255,.4);
    font-size: 12px; font-family: 'DM Sans', sans-serif;
    padding: 0; margin-bottom: 16px;
    transition: color .2s;
  }
  .back-btn:hover { color: rgba(255,255,255,.8); }

  /* ── Hello ── */
  .hello-wrap { margin-bottom: 22px; }
  .greeting { font-size: 13px; color: rgba(255,255,255,.45); margin-bottom: 2px; }
  .customer-name { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; color: #fff; }
  .account-tag { font-size: 11px; color: rgba(255,255,255,.35); margin-top: 3px; }

  /* ── Amount display ── */
  .amount-display {
    display: flex; align-items: baseline; gap: 4px;
    justify-content: center;
    margin-bottom: 20px;
    padding: 20px 0 16px;
    border-bottom: 1px solid rgba(255,255,255,.07);
  }
  .currency-sym { font-family: 'Syne', sans-serif; font-size: 22px; color: rgba(255,255,255,.4); font-weight: 700; }
  .amount-val { font-family: 'Syne', sans-serif; font-size: 48px; font-weight: 800; color: #fff; letter-spacing: -2px; }

  /* ── Numpad ── */
  .numpad {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 8px; margin-bottom: 4px;
  }
  .num-key {
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.08);
    color: #fff;
    font-family: 'Syne', sans-serif;
    font-size: 20px; font-weight: 600;
    padding: 14px 0;
    border-radius: 14px;
    cursor: pointer;
    transition: all .12s ease;
    user-select: none;
  }
  .num-key:active { background: rgba(129,140,248,.25); transform: scale(.95); }
  .num-key.del { font-size: 18px; color: #f87171; background: rgba(248,113,113,.07); }

  /* ── Summary ── */
  .confirm-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 18px; }
  .summary-card {
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 18px;
    padding: 18px;
    margin-bottom: 16px;
  }
  .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 13px; }
  .summary-row span:first-child { color: rgba(255,255,255,.45); }
  .summary-row .val { color: #fff; font-weight: 500; text-align: right; max-width: 60%; }
  .summary-row .val.mono { font-family: monospace; font-size: 12px; color: #818cf8; }
  .summary-row .val.green { color: #34d399; font-weight: 700; font-size: 16px; }
  .summary-row .val.italic { font-style: italic; color: rgba(255,255,255,.5); }
  .summary-row.big span:first-child { font-weight: 600; color: rgba(255,255,255,.7); }
  .divider { height: 1px; background: rgba(255,255,255,.07); margin: 6px 0; }
  .consent-text { font-size: 11px; color: rgba(255,255,255,.3); line-height: 1.5; margin-bottom: 4px; }

  /* ── Success ── */
  .success-ring {
    width: 88px; height: 88px;
    border-radius: 50%;
    background: linear-gradient(135deg, #059669, #34d399);
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    box-shadow: 0 0 0 12px rgba(16,185,129,.12), 0 0 0 24px rgba(16,185,129,.06);
    animation: popIn .5s cubic-bezier(.4,0,.2,1) .1s both;
  }
  @keyframes popIn { from { transform: scale(0) rotate(-20deg); opacity: 0; } to { transform: scale(1) rotate(0); opacity: 1; } }
  .success-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #fff; }
  .success-sub { font-size: 14px; color: rgba(255,255,255,.5); text-align: center; line-height: 1.5; }
  .txn-chip {
    font-family: monospace; font-size: 11px; color: #818cf8;
    background: rgba(99,102,241,.12);
    border: 1px solid rgba(99,102,241,.25);
    padding: 5px 14px; border-radius: 20px;
  }
  .sms-note { font-size: 12px; color: rgba(255,255,255,.35); }

  /* ── Spinner ── */
  .spinner {
    width: 48px; height: 48px;
    border: 3px solid rgba(255,255,255,.1);
    border-top-color: #818cf8;
    border-radius: 50%;
    animation: spin .8s linear infinite;
  }
  .loading-text { font-size: 13px; color: rgba(255,255,255,.4); }

  /* ── Footer ── */
  .footer-text { position: relative; z-index: 2; margin-top: 20px; font-size: 11px; color: rgba(255,255,255,.2); }

  @media (max-width: 440px) {
    .card { border-radius: 20px; }
    .slide-wrap { padding: 20px; }
    .amount-val { font-size: 40px; }
  }
`;

export default SusuQRTransfer;