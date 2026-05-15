import { useState, useEffect, useCallback, useRef } from "react";
import { companyId, userUUID } from "../../constants/appConstants";

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const API        = (path) => `https://susu-pro-backend.onrender.com/api/variance/${companyId}${path}`;

const fmt = (n, d = 2) =>
  Number(n || 0).toLocaleString("en-GH", {
    minimumFractionDigits: d, maximumFractionDigits: d,
  });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  }) : "—";

async function apiFetch(url, opts = {}) {
  const r = await fetch(url, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.message || "Request failed");
  return j;
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,600;0,700;0,900;1,300;1,700&family=Fira+Code:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:      #f7f4ef;
  --bg2:     #edeae3;
  --bg3:     #e4e1d8;
  --surface: #ffffff;
  --ink:     #1a1510;
  --ink2:    #6b6358;
  --ink3:    #9e9790;
  --border:  #d8d4cb;
  --border2: #ccc8be;

  /* Shortage = red/amber system */
  --shortage:    #b83c1e;
  --shortage-bg: #fdf2ef;
  --shortage-bd: #f0c4b8;

  /* Excess = forest green */
  --excess:    #1e6b3c;
  --excess-bg: #f0f7f3;
  --excess-bd: #b4d9c4;

  /* Balanced = deep blue */
  --balanced:    #1e3c6b;
  --balanced-bg: #eff3f9;
  --balanced-bd: #b4c8e0;

  --accent:  #1a1510;
  --gold:    #c48c14;

  --r:  8px;
  --r2: 14px;
  --r3: 20px;

  --sh:  0 1px 3px rgba(26,21,16,.06), 0 4px 12px rgba(26,21,16,.06);
  --sh2: 0 2px 8px rgba(26,21,16,.10), 0 12px 40px rgba(26,21,16,.08);

  font-family: 'DM Sans', sans-serif;
}

body { color: var(--ink); }
.cv  { min-height: 100vh; color: var(--ink); font-family: 'DM Sans', sans-serif; }

/* ── Topbar ── */
.cv-topbar {
  color: #fff;
  padding: 0 32px;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 24px;
  position: sticky; top: 0; z-index: 100;
}
.cv-topbar-logo {
  font-family: 'Fraunces', serif;
  font-size: 20px; font-weight: 700;
  letter-spacing: -0.5px;
}
.cv-topbar-logo em { font-style: italic; color: #e8c878; }
.cv-topbar-sep { flex: 1; }
.cv-topbar-nav { display: flex; gap: 2px; }
.cv-topbar-btn {
  padding: 6px 14px;
  border: none; background: transparent;
  color: #000000; font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer; border-radius: 6px;
  transition: all .15s;
}
.cv-topbar-btn:hover { background: rgba(255,255,255,10); color: #003314; }
.cv-topbar-btn.active { background: rgba(2, 93, 15, 10); color: #ffff; }

/* ── Layout ── */
.cv-body { padding: 32px; max-width: 1280px; margin: 0 auto; }

/* ── Page header ── */
.cv-page-head {
  display: flex; align-items: flex-end;
  justify-content: space-between; gap: 16px;
  margin-bottom: 28px; flex-wrap: wrap;
}
.cv-title {
  font-family: 'Fraunces', serif;
  font-size: 32px; font-weight: 700;
  line-height: 1.1;
}
.cv-title em { font-style: italic; }
.cv-subtitle { font-size: 13.5px; color: var(--ink2); margin-top: 4px; }

/* ── Cards ── */
.cv-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r2);
  box-shadow: var(--sh);
}
.cv-card-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 22px;
  border-bottom: 1px solid var(--border);
}
.cv-card-title { font-size: 15px; font-weight: 600; }

/* ── Stat row ── */
.cv-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 12px; margin-bottom: 24px; }
.cv-stat {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 16px 18px;
  position: relative; overflow: hidden;
}
.cv-stat-accent { position: absolute; top:0; left:0; right:0; height: 3px; background: var(--ink); }
.cv-stat-accent.shortage { background: var(--shortage); }
.cv-stat-accent.excess   { background: var(--excess); }
.cv-stat-accent.balanced { background: var(--balanced); }
.cv-stat-label { font-size: 11px; font-weight: 600; letter-spacing:.5px; text-transform: uppercase; color: var(--ink3); }
.cv-stat-val   { font-family: 'Fira Code', monospace; font-size: 20px; font-weight: 500; margin: 5px 0 2px; }
.cv-stat-sub   { font-size: 11px; color: var(--ink3); }

/* ── Tables ── */
.cv-table-wrap { overflow-x: auto; }
.cv-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.cv-table th {
  padding: 9px 14px;
  font-size: 10.5px; font-weight: 600;
  letter-spacing: .6px; text-transform: uppercase;
  color: var(--ink3); background: var(--bg2);
  border-bottom: 1px solid var(--border);
  text-align: left; white-space: nowrap;
}
.cv-table th.r, .cv-table td.r { text-align: right; }
.cv-table td {
  padding: 11px 14px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
.cv-table tbody tr:last-child td { border-bottom: none; }
.cv-table tbody tr:hover td { background: var(--bg); }
.cv-table tfoot td {
  padding: 11px 14px;
  font-weight: 600;
  background: var(--bg2);
  border-top: 2px solid var(--border2);
}
.mono { font-family: 'Fira Code', monospace; font-size: 12.5px; }
.muted { color: var(--ink2); }

/* ── Variance badges ── */
.cv-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 99px;
  font-size: 11px; font-weight: 600; white-space: nowrap;
}
.cv-badge-shortage { background: var(--shortage-bg); color: var(--shortage); border: 1px solid var(--shortage-bd); }
.cv-badge-excess   { background: var(--excess-bg);   color: var(--excess);   border: 1px solid var(--excess-bd); }
.cv-badge-balanced { background: var(--balanced-bg); color: var(--balanced); border: 1px solid var(--balanced-bd); }
.cv-badge-open     { background: #fff8e6; color: var(--gold);  border: 1px solid #f0d888; }
.cv-badge-resolved { background: var(--excess-bg); color: var(--excess); border: 1px solid var(--excess-bd); }
.cv-badge-written_off { background: var(--bg2); color: var(--ink3); border: 1px solid var(--border); }

/* ── Buttons ── */
.cv-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px;
  border: none; border-radius: var(--r);
  font-family: 'DM Sans', sans-serif;
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all .15s; white-space: nowrap;
}
.cv-btn:disabled { opacity: .45; cursor: default; }
.cv-btn:active:not(:disabled) { transform: scale(.97); }
.cv-btn-ink    { background: var(--ink);  color: #fff; }
.cv-btn-ink:hover:not(:disabled) { background: #332d28; }
.cv-btn-short  { background: var(--shortage); color: #fff; }
.cv-btn-short:hover:not(:disabled) { filter: brightness(1.1); }
.cv-btn-ghost  { background: transparent; border: 1px solid var(--border2); color: var(--ink2); }
.cv-btn-ghost:hover:not(:disabled) { background: var(--bg2); color: var(--ink); }
.cv-btn-sm { padding: 5px 12px; font-size: 12px; }
.cv-btn-lg { padding: 11px 22px; font-size: 14px; }

/* ── Inputs ── */
.cv-input {
  width: 100%; padding: 9px 12px;
  background: var(--surface); color: var(--ink);
  border: 1px solid var(--border2);
  border-radius: var(--r);
  font-family: 'DM Sans', sans-serif; font-size: 13.5px;
  outline: none; transition: border-color .15s;
}
.cv-input:focus { border-color: var(--ink); }
.cv-input::placeholder { color: var(--ink3); }
select.cv-input { cursor: pointer; }
.cv-field { display: flex; flex-direction: column; gap: 5px; }
.cv-field label { font-size: 11.5px; font-weight: 600; color: var(--ink2); letter-spacing: .2px; }
.cv-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.cv-grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
@media(max-width:600px) { .cv-grid2, .cv-grid3 { grid-template-columns: 1fr; } }

/* ── Modal ── */
.cv-modal-bg {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(26,21,16,.5);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.cv-modal {
  background: var(--surface);
  border-radius: var(--r3);
  width: 100%; max-width: 600px;
  max-height: 92vh;
  display: flex; flex-direction: column;
  box-shadow: var(--sh2);
  overflow: hidden;
}
.cv-modal-lg { max-width: 900px; }
.cv-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}
.cv-modal-body { padding: 24px; overflow-y: auto; flex:1; display: flex; flex-direction: column; gap: 18px; }
.cv-modal-foot {
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  display: flex; gap: 10px; justify-content: flex-end;
  background: var(--bg);
}
.cv-close {
  width: 30px; height: 30px; border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface); color: var(--ink2);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 18px; transition: all .15s;
}
.cv-close:hover { background: var(--bg2); color: var(--ink); }

/* ── Variance amount display ── */
.cv-variance-big {
  text-align: center; padding: 24px 20px; border-radius: 12px;
  border: 1.5px solid;
}
.cv-variance-big .amount {
  font-family: 'Fraunces', serif;
  font-size: 48px; font-weight: 900; line-height: 1;
  margin: 8px 0;
}
.cv-variance-big .label {
  font-size: 11px; font-weight: 700;
  letter-spacing: 1.5px; text-transform: uppercase;
}
.cv-variance-big.shortage { background: var(--shortage-bg); border-color: var(--shortage-bd); color: var(--shortage); }
.cv-variance-big.excess   { background: var(--excess-bg);   border-color: var(--excess-bd);   color: var(--excess); }
.cv-variance-big.balanced { background: var(--balanced-bg); border-color: var(--balanced-bd); color: var(--balanced); }

/* ── Transaction list in lookup ── */
.cv-tx-list { max-height: 220px; overflow-y: auto; border: 1px solid var(--border); border-radius: var(--r); }
.cv-tx-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; border-bottom: 1px solid var(--border);
  font-size: 12.5px;
}
.cv-tx-row:last-child { border-bottom: none; }

/* ── Summary bar per staff ── */
.cv-staff-bar {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  cursor: pointer; transition: background .12s;
}
.cv-staff-bar:hover { background: var(--bg); }
.cv-staff-bar:last-child { border-bottom: none; }
.cv-staff-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--bg2); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; color: var(--ink2);
  flex-shrink: 0;
}
.cv-staff-net {
  font-family: 'Fira Code', monospace;
  font-size: 14px; font-weight: 600; margin-left: auto;
}

/* ── Alert ── */
.cv-alert {
  padding: 10px 14px; border-radius: var(--r);
  font-size: 13px; display: flex; align-items: flex-start; gap: 8px;
  border: 1px solid;
}
.cv-alert-success { background: var(--excess-bg); border-color: var(--excess-bd); color: var(--excess); }
.cv-alert-error   { background: var(--shortage-bg); border-color: var(--shortage-bd); color: var(--shortage); }
.cv-alert-info    { background: var(--balanced-bg); border-color: var(--balanced-bd); color: var(--balanced); }

/* ── Toast ── */
.cv-toasts {
  position: fixed; bottom: 24px; right: 24px;
  display: flex; flex-direction: column; gap: 8px;
  z-index: 9999;
}
.cv-toast {
  padding: 11px 16px; border-radius: 10px;
  font-size: 13px; font-weight: 500;
  display: flex; align-items: center; gap: 8px;
  box-shadow: var(--sh2); max-width: 340px;
  animation: cv-slide-in .2s ease;
}
.cv-toast-success { background: var(--ink); color: #fff; }
.cv-toast-error   { background: var(--shortage); color: #fff; }
.cv-toast-info    { background: var(--balanced); color: #fff; }
@keyframes cv-slide-in { from { transform: translateX(20px); opacity:0; } to { transform: none; opacity:1; } }

.cv-divider { border:none; border-top: 1px solid var(--border); }
.cv-spin {
  display: inline-block; width:16px; height:16px;
  border: 2px solid var(--border2); border-top-color: var(--ink);
  border-radius: 50%; animation: cv-spin .7s linear infinite;
}
@keyframes cv-spin { to { transform: rotate(360deg); } }
.cv-empty { text-align: center; padding: 60px 20px; color: var(--ink3); }
.cv-empty-icon { font-size: 32px; margin-bottom: 12px; opacity: .35; }
`;

// ─────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);
  const Toast = () => (
    <div className="cv-toasts">
      {toasts.map(t => (
        <div key={t.id} className={`cv-toast cv-toast-${t.type}`}>
          {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"} {t.msg}
        </div>
      ))}
    </div>
  );
  return { show, Toast };
}

// ─────────────────────────────────────────────────────────────
// VARIANCE BADGE
// ─────────────────────────────────────────────────────────────
function VBadge({ type }) {
  if (!type) return null;
  return (
    <span className={`cv-badge cv-badge-${type}`}>
      {type === "shortage" ? "▼ Shortage" : type === "excess" ? "▲ Excess" : "= Balanced"}
    </span>
  );
}

function StatusBadge({ status }) {
  return <span className={`cv-badge cv-badge-${status}`}>{status}</span>;
}

// ─────────────────────────────────────────────────────────────
// ROOT MODULE
// ─────────────────────────────────────────────────────────────
export default function CashVarianceModule() {
  const [view, setView] = useState("record");  // record | list | summary
  const [staff, setStaff]  = useState([]);
  const { show, Toast } = useToast();

  // Load staff list once
  useEffect(() => {
    fetch(`https://susu-pro-backend.onrender.com/api/staff?company_id=${companyId}`)
      .then(r => r.json())
      .then(d => setStaff(d.data || []))
      .catch(() => {});
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <Toast />
      <div className="cv">
        <div className="cv-topbar">
          <div className="cv-topbar-nav">
            {[
              { id: "record",  label: "Record Variance" },
              { id: "list",    label: "All Variances"   },
              { id: "summary", label: "Staff Summary"   },
            ].map(v => (
              <button key={v.id}
                className={`cv-topbar-btn${view === v.id ? " active" : ""}`}
                onClick={() => setView(v.id)}>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="cv-body">
          {view === "record"  && <RecordView  staff={staff} toast={show} />}
          {view === "list"    && <ListView    staff={staff} toast={show} />}
          {view === "summary" && <SummaryView staff={staff} toast={show} />}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// VIEW 1 — RECORD VARIANCE
// ─────────────────────────────────────────────────────────────
function RecordView({ staff, toast }) {
  const [staffId,  setStaffId]  = useState("");
  const [date,     setDate]     = useState(new Date().toISOString().slice(0,10));
  const [physical, setPhysical] = useState("");
  const [notes,    setNotes]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [lookup,   setLookup]   = useState(null);   // system total result
  const [looking,  setLooking]  = useState(false);
  const [saved,    setSaved]    = useState(null);    // saved variance result

  // Auto-lookup when staff + date both filled
  useEffect(() => {
    if (!staffId || !date) { setLookup(null); return; }
    setLooking(true);
    apiFetch(API(`/system-total?staff_id=${staffId}&date=${date}`))
      .then(d => setLookup(d.data))
      .catch(e => toast(e.message, "error"))
      .finally(() => setLooking(false));
  }, [staffId, date]);

  const sysTotal    = parseFloat(lookup?.system_total || 0);
  const physicalAmt = parseFloat(physical || 0);
  const variance    = sysTotal - physicalAmt;
  const vType       = !physical ? null
    : Math.abs(variance) < 0.01 ? "balanced"
    : variance > 0 ? "shortage" : "excess";

  const submit = async () => {
    if (!staffId)        return toast("Select a staff member", "error");
    if (!date)           return toast("Select a date", "error");
    if (physical === "") return toast("Enter physical cash amount", "error");

    setLoading(true);
    try {
      const d = await apiFetch(API("/"), {
        method: "POST",
        body: JSON.stringify({
          staff_id:          staffId,
          variance_date:     date,
          physical_cash:     physicalAmt,
          notes:             notes || null,
          recorded_by:       userUUID,
          transactions_count: lookup?.transaction_count || 0,
        }),
      });
      setSaved(d.data);
      toast(d.message, "success");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSaved(null);
    setPhysical("");
    setNotes("");
    setLookup(null);
  };

  if (saved) return <SuccessView variance={saved} onNew={reset} />;

  return (
    <div>
      <div className="cv-page-head">
        <div>
          <h1 className="cv-title">Record <em>Variance</em></h1>
          <p className="cv-subtitle">Compare system total vs physical cash handed in by mobile banker</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>

        {/* ── Left: form ── */}
        <div className="cv-card">
          <div className="cv-card-head">
            <span className="cv-card-title">Reconciliation entry</span>
          </div>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>

            <div className="cv-grid2">
              <div className="cv-field">
                <label>Mobile banker *</label>
                <select className="cv-input" value={staffId}
                  onChange={e => { setStaffId(e.target.value); setSaved(null); }}>
                  <option value="">— Select staff —</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.staff_id})</option>
                  ))}
                </select>
              </div>
              <div className="cv-field">
                <label>Date *</label>
                <input className="cv-input" type="date" value={date}
                  max={new Date().toISOString().slice(0,10)}
                  onChange={e => setDate(e.target.value)} />
              </div>
            </div>

            {/* System total lookup result */}
            {looking && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink2)", fontSize: 13 }}>
                <span className="cv-spin" /> Loading system total…
              </div>
            )}

            {lookup && !looking && (
              <div style={{ background: "var(--bg)", borderRadius: 10, padding: 14, border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: .5, textTransform: "uppercase", color: "var(--ink3)", marginBottom: 10 }}>
                  System — {lookup.transaction_count} transaction{lookup.transaction_count !== 1 ? "s" : ""}
                </p>
                <div className="cv-grid3">
                  {[
                    { label: "Cash deposits", val: lookup.cash_total },
                    { label: "MoMo deposits", val: lookup.momo_total },
                    { label: "System total",  val: lookup.system_total, bold: true },
                  ].map(r => (
                    <div key={r.label}>
                      <p style={{ fontSize: 11, color: "var(--ink3)" }}>{r.label}</p>
                      <p className="mono" style={{ fontWeight: r.bold ? 700 : 500, fontSize: r.bold ? 16 : 13, marginTop: 2 }}>
                        GHS {fmt(r.val)}
                      </p>
                    </div>
                  ))}
                </div>

                {lookup.existing_variance && (
                  <div className="cv-alert cv-alert-info" style={{ marginTop: 12, fontSize: 12 }}>
                    ℹ An existing {lookup.existing_variance.variance_type} record of GHS {fmt(Math.abs(lookup.existing_variance.variance_amount))} exists for this date. Submitting will overwrite it if still open.
                  </div>
                )}

                {/* Transaction list */}
                {lookup.transactions?.length > 0 && (
                  <details style={{ marginTop: 10 }}>
                    <summary style={{ fontSize: 12, color: "var(--ink2)", cursor: "pointer", userSelect: "none" }}>
                      View individual transactions
                    </summary>
                    <div className="cv-tx-list" style={{ marginTop: 8 }}>
                      {lookup.transactions.slice(0, 50).map((t, i) => (
                        <div className="cv-tx-row" key={i}>
                          <div>
                            <p style={{ fontWeight: 500 }}>{t.customer}</p>
                            <p style={{ fontSize: 11, color: "var(--ink3)" }}>
                              {t.account_no} · {t.method || "cash"}
                            </p>
                          </div>
                          <span className="mono" style={{ fontWeight: 600 }}>GHS {fmt(t.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}

            <hr className="cv-divider" />

            <div className="cv-field">
              <label>Physical cash handed in (GHS) *</label>
              <input className="cv-input" type="number" step="0.01" min="0"
                placeholder="Enter the exact amount counted"
                value={physical} onChange={e => setPhysical(e.target.value)}
                style={{ fontSize: 18, fontFamily: "'Fira Code', monospace", fontWeight: 600 }} />
            </div>

            {/* Live variance display */}
            {vType && (
              <div className={`cv-variance-big ${vType}`}>
                <p className="label">
                  {vType === "shortage" ? "Cash Shortage" : vType === "excess" ? "Cash Excess" : "Balanced — No Variance"}
                </p>
                <p className="amount">
                  {vType === "balanced" ? "GHS 0.00" : `GHS ${fmt(Math.abs(variance))}`}
                </p>
                <p style={{ fontSize: 13, opacity: .7, marginTop: 4 }}>
                  {vType === "shortage" &&
                    `System: GHS ${fmt(sysTotal)} — Physical: GHS ${fmt(physicalAmt)} = Short GHS ${fmt(variance)}`}
                  {vType === "excess" &&
                    `Physical: GHS ${fmt(physicalAmt)} — System: GHS ${fmt(sysTotal)} = Over GHS ${fmt(Math.abs(variance))}`}
                  {vType === "balanced" && "Cash matches the system total perfectly"}
                </p>
              </div>
            )}

            <div className="cv-field">
              <label>Notes (optional)</label>
              <textarea className="cv-input" rows={3} value={notes}
                placeholder="Explain the variance, any circumstances…"
                onChange={e => setNotes(e.target.value)}
                style={{ resize: "vertical", minHeight: 72 }} />
            </div>

            <button className="cv-btn cv-btn-ink cv-btn-lg"
              onClick={submit} disabled={loading || !lookup || physical === ""}>
              {loading
                ? <><span className="cv-spin" /> Recording…</>
                : "Record variance & post to accounts"}
            </button>
          </div>
        </div>

        {/* ── Right: what happens panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="cv-card">
            <div className="cv-card-head">
              <span className="cv-card-title" style={{ fontSize: 13 }}>How it works</span>
            </div>
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                {
                  type: "shortage",
                  title: "Shortage recorded",
                  je: [
                    { dc: "Dr", acc: "Cash Shortage (5075)", note: "Loss recognised" },
                    { dc: "Cr", acc: "Cash Variance Clearing (1070)", note: "Float reduced by missing amount" },
                  ],
                },
                {
                  type: "excess",
                  title: "Excess recorded",
                  je: [
                    { dc: "Dr", acc: "Cash Variance Clearing (4050)", note: "Variance increased" },
                    { dc: "Cr", acc: "Cash Over (1070)", note: "Gain recognised" },
                  ],
                },
              ].map(s => (
                <div key={s.type} style={{
                  borderRadius: 10,
                  border: `1px solid var(--${s.type}-bd)`,
                  background: `var(--${s.type}-bg)`,
                  padding: 12,
                }}>
                  <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8,
                    color: `var(--${s.type})` }}>
                    {s.title}
                  </p>
                  {s.je.map((j, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                        background: `var(--${s.type})`, color: "#fff", flexShrink: 0,
                        marginTop: 1,
                      }}>{j.dc}</span>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 500 }}>{j.acc}</p>
                        <p style={{ fontSize: 11, color: "var(--ink3)" }}>{j.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              <div style={{ fontSize: 12, color: "var(--ink2)", lineHeight: 1.6, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                After recording, the staff member receives an SMS notification with the variance amount and reference number.
              </div>
            </div>
          </div>

          {/* Staff net variance quick-view */}
          {staffId && lookup && (
            <StaffNetVariance staffId={staffId} staffName={staff.find(s => s.id === staffId)?.full_name} />
          )}
        </div>
      </div>
    </div>
  );
}

// Mini component: staff's running variance total
function StaffNetVariance({ staffId, staffName }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    apiFetch(API(`/summary`))
      .then(d => {
        const row = (d.data || []).find(r => r.staff_id === staffId);
        setData(row || null);
      })
      .catch(() => {});
  }, [staffId]);

  if (!data) return null;

  const net = parseFloat(data.net_variance);
  return (
    <div className="cv-card">
      <div className="cv-card-head" style={{ padding: "12px 18px" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Running total for {staffName}</span>
      </div>
      <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Total shortages", val: data.total_shortage,  color: "var(--shortage)", count: data.shortage_count },
          { label: "Total excess",    val: data.total_excess,    color: "var(--excess)",   count: data.excess_count   },
        ].map(r => (
          <div key={r.label} style={{ background: "var(--bg)", borderRadius: 8, padding: "10px 12px" }}>
            <p style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 3 }}>{r.label}</p>
            <p className="mono" style={{ fontSize: 15, fontWeight: 700, color: r.color }}>
              GHS {fmt(r.val)}
            </p>
            <p style={{ fontSize: 11, color: "var(--ink3)" }}>{r.count} record{r.count !== 1 ? "s" : ""}</p>
          </div>
        ))}
        <div style={{ gridColumn: "1/-1", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
          <p style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 3 }}>Net position</p>
          <p className="mono" style={{ fontSize: 17, fontWeight: 700, color: net > 0 ? "var(--shortage)" : net < 0 ? "var(--excess)" : "var(--balanced)" }}>
            {net > 0 ? `GHS ${fmt(net)} owed to company` : net < 0 ? `GHS ${fmt(Math.abs(net))} excess total` : "Balanced"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────
function SuccessView({ variance, onNew }) {
  const vType = variance.variance_type;
  const amt   = Math.abs(parseFloat(variance.variance_amount));

  return (
    <div style={{ maxWidth: 580, margin: "0 auto", paddingTop: 40 }}>
      <div className="cv-card" style={{ overflow: "hidden" }}>
        <div style={{
          padding: "32px 28px 24px",
          background: vType === "shortage" ? "var(--shortage-bg)"
                    : vType === "excess"   ? "var(--excess-bg)"
                    : "var(--balanced-bg)",
          borderBottom: "1px solid var(--border)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>
            {vType === "shortage" ? "⚠️" : vType === "excess" ? "✅" : "✓"}
          </div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, marginBottom: 6 }}>
            Variance Recorded
          </h2>
          <p style={{ fontSize: 13, color: "var(--ink2)" }}>
            {vType === "shortage"
              ? `Shortage of GHS ${fmt(amt)} posted to accounts`
              : vType === "excess"
              ? `Excess of GHS ${fmt(amt)} posted to accounts`
              : "Cash balanced — no journal entry needed"}
          </p>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Staff",         val: variance.staff_name },
            { label: "Date",          val: fmtDate(variance.variance_date) },
            { label: "System total",  val: `GHS ${fmt(variance.system_total)}` },
            { label: "Physical cash", val: `GHS ${fmt(variance.physical_cash)}` },
            { label: "Variance",      val: vType === "balanced" ? "Balanced" : `GHS ${fmt(amt)} ${vType}`, bold: true },
            { label: "Ref",           val: variance.id?.slice(0,8).toUpperCase(), mono: true },
            { label: "JE posted",     val: variance.accounting_je_id ? "Yes — " + variance.accounting_je_id?.slice(0,8).toUpperCase() : "No JE needed" },
            { label: "SMS sent",      val: variance.sms_sent ? "Sent to staff" : "Not sent (no phone on record)" },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
              <span style={{ fontSize: 12.5, color: "var(--ink2)" }}>{r.label}</span>
              <span className={r.mono ? "mono" : ""} style={{ fontSize: 13, fontWeight: r.bold ? 700 : 500 }}>
                {r.val}
              </span>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 24px", display: "flex", gap: 10, background: "var(--bg)" }}>
          <button className="cv-btn cv-btn-ink cv-btn-full" onClick={onNew}>
            Record another variance
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VIEW 2 — ALL VARIANCES LIST
// ─────────────────────────────────────────────────────────────
function ListView({ staff, toast }) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [detail,  setDetail]  = useState(null);

  // Filters
  const [staffFilter,  setStaffFilter]  = useState("");
  const [typeFilter,   setTypeFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate,    setStartDate]    = useState("");
  const [endDate,      setEndDate]      = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit: 30 });
    if (staffFilter)  p.set("staff_id",      staffFilter);
    if (typeFilter)   p.set("variance_type", typeFilter);
    if (statusFilter) p.set("status",        statusFilter);
    if (startDate)    p.set("startDate",     startDate);
    if (endDate)      p.set("endDate",       endDate);

    apiFetch(API(`/?${p}`))
      .then(d => { setRows(d.data || []); setTotal(d.pagination?.total || 0); })
      .catch(e => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [page, staffFilter, typeFilter, statusFilter, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const totals = rows.reduce((a, r) => ({
    shortage: a.shortage + (r.variance_type === "shortage" ? Math.abs(parseFloat(r.variance_amount)) : 0),
    excess:   a.excess   + (r.variance_type === "excess"   ? Math.abs(parseFloat(r.variance_amount)) : 0),
  }), { shortage: 0, excess: 0 });

  return (
    <div>
      <div className="cv-page-head">
        <div>
          <h1 className="cv-title">All <em>Variances</em></h1>
          <p className="cv-subtitle">{total} records</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="cv-stats">
        <div className="cv-stat">
          <div className="cv-stat-accent shortage" />
          <p className="cv-stat-label">Total shortages (shown)</p>
          <p className="cv-stat-val">GHS {fmt(totals.shortage)}</p>
        </div>
        <div className="cv-stat">
          <div className="cv-stat-accent excess" />
          <p className="cv-stat-label">Total excess (shown)</p>
          <p className="cv-stat-val">GHS {fmt(totals.excess)}</p>
        </div>
        <div className="cv-stat">
          <div className="cv-stat-accent" />
          <p className="cv-stat-label">Net (shortage − excess)</p>
          <p className="cv-stat-val">GHS {fmt(totals.shortage - totals.excess)}</p>
        </div>
      </div>

      <div className="cv-card">
        {/* Filters */}
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select className="cv-input" style={{ width: 200 }} value={staffFilter}
            onChange={e => { setStaffFilter(e.target.value); setPage(1); }}>
            <option value="">All staff</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
          <select className="cv-input" style={{ width: 150 }} value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All types</option>
            <option value="shortage">Shortage</option>
            <option value="excess">Excess</option>
            <option value="balanced">Balanced</option>
          </select>
          <select className="cv-input" style={{ width: 140 }} value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="written_off">Written off</option>
          </select>
          <input className="cv-input" type="date" style={{ width: 150 }} value={startDate}
            onChange={e => { setStartDate(e.target.value); setPage(1); }} />
          <input className="cv-input" type="date" style={{ width: 150 }} value={endDate}
            onChange={e => { setEndDate(e.target.value); setPage(1); }} />
          <button className="cv-btn cv-btn-ghost cv-btn-sm" onClick={load}>↻</button>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <span className="cv-spin" style={{ width: 28, height: 28, borderWidth: 3 }} />
          </div>
        ) : rows.length === 0 ? (
          <div className="cv-empty"><div className="cv-empty-icon">📋</div><p>No variances found</p></div>
        ) : (
          <>
            <div className="cv-table-wrap">
              <table className="cv-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Staff</th>
                    <th className="r">System total</th>
                    <th className="r">Physical cash</th>
                    <th className="r">Variance</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>JE</th>
                    <th>SMS</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const amt = Math.abs(parseFloat(r.variance_amount));
                    return (
                      <tr key={r.id}>
                        <td className="muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                          {fmtDate(r.variance_date)}
                        </td>
                        <td>
                          <p style={{ fontWeight: 600 }}>{r.staff_name}</p>
                          <p className="muted" style={{ fontSize: 11 }}>{r.role}</p>
                        </td>
                        <td className="r mono">GHS {fmt(r.system_total)}</td>
                        <td className="r mono">GHS {fmt(r.physical_cash)}</td>
                        <td className="r mono" style={{
                          fontWeight: 700,
                          color: r.variance_type === "shortage" ? "var(--shortage)"
                               : r.variance_type === "excess"   ? "var(--excess)" : "var(--balanced)",
                        }}>
                          {r.variance_type === "shortage" ? "−" : r.variance_type === "excess" ? "+" : ""}
                          GHS {fmt(amt)}
                        </td>
                        <td><VBadge type={r.variance_type} /></td>
                        <td><StatusBadge status={r.status} /></td>
                        <td>
                          {r.accounting_je_id
                            ? <span style={{ fontSize: 11, color: "var(--excess)" }}>✓ Posted</span>
                            : <span className="muted" style={{ fontSize: 11 }}>—</span>}
                        </td>
                        <td>
                          {r.sms_sent
                            ? <span style={{ fontSize: 11, color: "var(--excess)" }}>✓</span>
                            : <span className="muted" style={{ fontSize: 11 }}>—</span>}
                        </td>
                        <td>
                          <button className="cv-btn cv-btn-ghost cv-btn-sm"
                            onClick={() => setDetail(r)}>
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4}>Showing {rows.length} of {total}</td>
                    <td className="r mono">
                      <span style={{ color: "var(--shortage)" }}>−GHS {fmt(totals.shortage)}</span>
                      {" / "}
                      <span style={{ color: "var(--excess)" }}>+GHS {fmt(totals.excess)}</span>
                    </td>
                    <td colSpan={5} />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--ink2)" }}>
              <span>Page {page} of {Math.ceil(total / 30)}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="cv-btn cv-btn-ghost cv-btn-sm" disabled={page <= 1} onClick={() => setPage(p => p-1)}>← Prev</button>
                <button className="cv-btn cv-btn-ghost cv-btn-sm" disabled={page * 30 >= total} onClick={() => setPage(p => p+1)}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>

      {detail && (
        <VarianceDetailModal
          variance={detail}
          onClose={() => setDetail(null)}
          onResolved={() => { setDetail(null); load(); toast("Variance resolved", "success"); }}
          toast={toast}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VIEW 3 — STAFF SUMMARY
// ─────────────────────────────────────────────────────────────
function SummaryView({ staff, toast }) {
  const [rows,    setRows]    = useState([]);
  const [totals,  setTotals]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [selected,  setSelected]  = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (startDate) p.set("startDate", startDate);
    if (endDate)   p.set("endDate",   endDate);
    apiFetch(API(`/summary?${p}`))
      .then(d => { setRows(d.data || []); setTotals(d.totals); })
      .catch(e => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="cv-page-head">
        <div>
          <h1 className="cv-title">Staff <em>Summary</em></h1>
          <p className="cv-subtitle">Cumulative variance breakdown per mobile banker</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="cv-input" type="date" style={{ width: 150 }} value={startDate}
            onChange={e => setStartDate(e.target.value)} />
          <input className="cv-input" type="date" style={{ width: 150 }} value={endDate}
            onChange={e => setEndDate(e.target.value)} />
          <button className="cv-btn cv-btn-ghost cv-btn-sm" onClick={load}>↻</button>
        </div>
      </div>

      {/* Company totals */}
      {totals && (
        <div className="cv-stats" style={{ marginBottom: 24 }}>
          {[
            { label: "Total shortages", val: totals.total_shortage, color: "shortage" },
            { label: "Total excess",    val: totals.total_excess,   color: "excess"   },
            { label: "Net variance",    val: totals.net_variance,   color: ""         },
            { label: "Open records",    val: totals.open_count,     color: "", mono: false },
            { label: "Total records",   val: totals.total_count,    color: "", mono: false },
          ].map(s => (
            <div key={s.label} className="cv-stat">
              <div className={`cv-stat-accent${s.color ? " " + s.color : ""}`} />
              <p className="cv-stat-label">{s.label}</p>
              <p className="cv-stat-val mono">
                {s.mono === false ? s.val : `GHS ${fmt(s.val)}`}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="cv-card">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <span className="cv-spin" style={{ width: 28, height: 28, borderWidth: 3 }} />
          </div>
        ) : rows.length === 0 ? (
          <div className="cv-empty">
            <div className="cv-empty-icon">👤</div>
            <p>No variance records found</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Record variances from the Record Variance tab</p>
          </div>
        ) : (
          rows.map(r => {
            const net = parseFloat(r.net_variance);
            const initials = r.full_name?.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase();
            return (
              <div key={r.staff_id} className="cv-staff-bar"
                onClick={() => setSelected(r)}>
                <div className="cv-staff-avatar">{initials}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 13.5 }}>{r.full_name}</p>
                  <p className="muted" style={{ fontSize: 11 }}>{r.role} · {r.department}</p>
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 11, color: "var(--ink3)" }}>Shortages</p>
                    <p className="mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--shortage)" }}>
                      GHS {fmt(r.total_shortage)}
                    </p>
                    <p style={{ fontSize: 10, color: "var(--ink3)" }}>{r.shortage_count} records</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 11, color: "var(--ink3)" }}>Excess</p>
                    <p className="mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--excess)" }}>
                      GHS {fmt(r.total_excess)}
                    </p>
                    <p style={{ fontSize: 10, color: "var(--ink3)" }}>{r.excess_count} records</p>
                  </div>
                  <div className="cv-staff-net" style={{ color: net > 0 ? "var(--shortage)" : net < 0 ? "var(--excess)" : "var(--balanced)", minWidth: 120, textAlign: "right" }}>
                    <p style={{ fontSize: 10, color: "var(--ink3)", fontFamily: "inherit", fontWeight: 400 }}>Net</p>
                    GHS {fmt(Math.abs(net))}
                    <p style={{ fontSize: 10, color: "var(--ink3)", fontFamily: "inherit", fontWeight: 400 }}>
                      {net > 0 ? "owed to company" : net < 0 ? "company owes" : "balanced"}
                    </p>
                  </div>
                  {r.open_count > 0 && (
                    <span className="cv-badge cv-badge-open">{r.open_count} open</span>
                  )}
                  <span style={{ fontSize: 16, color: "var(--ink3)" }}>›</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selected && (
        <StaffVarianceHistory
          staff={selected}
          onClose={() => setSelected(null)}
          toast={toast}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STAFF VARIANCE HISTORY MODAL
// ─────────────────────────────────────────────────────────────
function StaffVarianceHistory({ staff, onClose, toast }) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail,  setDetail]  = useState(null);

  useEffect(() => {
    apiFetch(API(`/?staff_id=${staff.staff_id}&limit=100`))
      .then(d => setRows(d.data || []))
      .catch(e => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [staff.staff_id]);

  return (
    <div className="cv-modal-bg" onClick={onClose}>
      <div className="cv-modal cv-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="cv-modal-head">
          <div>
            <p style={{ fontWeight: 700, fontSize: 17 }}>{staff.full_name}</p>
            <p className="muted" style={{ fontSize: 12 }}>
              {staff.role} — {staff.shortage_count} shortages · {staff.excess_count} excess
            </p>
          </div>
          <button className="cv-close" onClick={onClose}>×</button>
        </div>

        <div className="cv-modal-body">
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <span className="cv-spin" />
            </div>
          ) : (
            <div className="cv-table-wrap">
              <table className="cv-table">
                <thead><tr>
                  <th>Date</th>
                  <th className="r">System</th>
                  <th className="r">Physical</th>
                  <th className="r">Variance</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th></th>
                </tr></thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontSize: 12 }}>{fmtDate(r.variance_date)}</td>
                      <td className="r mono" style={{ fontSize: 12 }}>GHS {fmt(r.system_total)}</td>
                      <td className="r mono" style={{ fontSize: 12 }}>GHS {fmt(r.physical_cash)}</td>
                      <td className="r mono" style={{ fontWeight: 700, fontSize: 13,
                        color: r.variance_type === "shortage" ? "var(--shortage)"
                             : r.variance_type === "excess"   ? "var(--excess)" : "var(--balanced)" }}>
                        GHS {fmt(Math.abs(parseFloat(r.variance_amount)))}
                      </td>
                      <td><VBadge type={r.variance_type} /></td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>
                        <button className="cv-btn cv-btn-ghost cv-btn-sm"
                          onClick={() => setDetail(r)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {detail && (
        <VarianceDetailModal
          variance={detail}
          onClose={() => setDetail(null)}
          onResolved={() => {
            setDetail(null);
            setRows(rows.map(r => r.id === detail.id ? { ...r, status: "resolved" } : r));
            toast("Variance resolved", "success");
          }}
          toast={toast}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VARIANCE DETAIL + RESOLVE MODAL
// ─────────────────────────────────────────────────────────────
function VarianceDetailModal({ variance: v, onClose, onResolved, toast }) {
  const [resolveNote, setResolveNote] = useState("");
  const [reverseJE,   setReverseJE]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [tab,         setTab]         = useState("detail");
  const amt = Math.abs(parseFloat(v.variance_amount));

  const resolve = async () => {
    setSaving(true);
    try {
      await apiFetch(API(`/${v.id}/resolve`), {
        method: "PATCH",
        body: JSON.stringify({
          resolved_by:     userUUID,
          resolution_note: resolveNote || null,
          reverse_je:      reverseJE,
        }),
      });
      onResolved();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cv-modal-bg" onClick={onClose}>
      <div className="cv-modal" onClick={e => e.stopPropagation()}>
        <div className="cv-modal-head">
          <div>
            <p style={{ fontWeight: 700, fontSize: 16 }}>{v.staff_name}</p>
            <p className="muted" style={{ fontSize: 12 }}>{fmtDate(v.variance_date)}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <VBadge type={v.variance_type} />
            <button className="cv-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          {["detail", "resolve"].map(t => (
            <button key={t}
              style={{
                flex: 1, padding: "10px 0", border: "none", background: "none",
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                cursor: "pointer",
                color: tab === t ? "var(--ink)" : "var(--ink3)",
                borderBottom: `2px solid ${tab === t ? "var(--ink)" : "transparent"}`,
                marginBottom: -1,
              }}
              onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="cv-modal-body">
          {tab === "detail" && (
            <>
              <div className={`cv-variance-big ${v.variance_type}`}>
                <p className="label">{v.variance_type === "shortage" ? "Shortage" : v.variance_type === "excess" ? "Excess" : "Balanced"}</p>
                <p className="amount">GHS {fmt(amt)}</p>
                <p style={{ fontSize: 12, opacity: .7, marginTop: 4 }}>
                  System: GHS {fmt(v.system_total)} · Physical: GHS {fmt(v.physical_cash)}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Transactions", val: v.transactions_count || "—" },
                  { label: "Recorded by",  val: v.recorded_by_name },
                  { label: "Recorded at",  val: fmtDate(v.recorded_at) },
                  { label: "JE reference", val: v.accounting_je_id ? v.accounting_je_id.slice(0,8).toUpperCase() : "No JE" },
                  { label: "SMS sent",     val: v.sms_sent ? "Yes" : "No" },
                  { label: "Notes",        val: v.notes || "—" },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 12.5, color: "var(--ink2)" }}>{r.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "resolve" && (
            <>
              {v.status === "resolved" ? (
                <div className="cv-alert cv-alert-success">
                  ✓ This variance has been resolved on {fmtDate(v.resolved_at)}.
                  {v.resolution_note && ` Note: ${v.resolution_note}`}
                </div>
              ) : (
                <>
                  <div className="cv-alert cv-alert-info">
                    ℹ Resolving marks this variance as investigated and closed. If cash was returned or the JE should be reversed, tick the option below.
                  </div>

                  <div className="cv-field">
                    <label>Resolution note *</label>
                    <textarea className="cv-input" rows={3} value={resolveNote}
                      placeholder="Describe what happened and how it was resolved…"
                      onChange={e => setResolveNote(e.target.value)}
                      style={{ resize: "vertical" }} />
                  </div>

                  {v.accounting_je_id && (
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 14px", borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)", fontSize: 13 }}>
                      <input type="checkbox" checked={reverseJE}
                        onChange={e => setReverseJE(e.target.checked)}
                        style={{ width: 15, height: 15 }} />
                      <div>
                        <p style={{ fontWeight: 600 }}>Reverse the journal entry</p>
                        <p className="muted" style={{ fontSize: 11 }}>Tick this if the cash was recovered / the error was corrected</p>
                      </div>
                    </label>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {tab === "resolve" && v.status !== "resolved" && (
          <div className="cv-modal-foot">
            <button className="cv-btn cv-btn-ghost" onClick={onClose}>Cancel</button>
            <button className="cv-btn cv-btn-ink" onClick={resolve} disabled={saving || !resolveNote.trim()}>
              {saving ? <><span className="cv-spin" /> Resolving…</> : "Mark as resolved"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
