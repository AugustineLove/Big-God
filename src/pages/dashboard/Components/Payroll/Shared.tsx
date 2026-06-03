// ============================================================
// payroll/shared.js
// Design tokens, API helpers, shared components, utilities
// ============================================================

import { useCallback, useState } from "react";
import { companyId } from "../../../../constants/appConstants";

// ── CONFIG — change these to match your app ─────────────────
export const BASE_URL    = "https://susu-pro-backend.onrender.com/payroll";

export const API = (path) => `${BASE_URL}/${companyId}${path}`;

// ── NUMBER FORMATTING ────────────────────────────────────────
export const fmt = (n, decimals = 2) =>
  Number(n || 0).toLocaleString("en-GH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export const fmtGHS = (n) => `GHS ${fmt(n)}`;

export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

// ── FETCH WRAPPER ────────────────────────────────────────────
export async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ── SHARED DESIGN SYSTEM ─────────────────────────────────────
// All payroll components import this string and inject it via <style>
export const PAYROLL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Instrument+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  /* Core palette — deep forest green + warm cream */
  --pr-ink:       #0e1a0f;
  --pr-forest:    #1a3a1c;
  --pr-green:     #2d6a30;
  --pr-green2:    #3d8a40;
  --pr-sage:      #7aab7d;
  --pr-mint:      #c8e6c9;
  --pr-cream:     #f8f5ef;
  --pr-warm:      #ede9e0;
  --pr-border:    #ddd8cc;
  --pr-border2:   #cec8bb;

  /* Status colours */
  --pr-gold:      #c8960a;
  --pr-gold-bg:   #fef9ec;
  --pr-red:       #c0392b;
  --pr-red-bg:    #fdf0ef;
  --pr-blue:      #1a4a8a;
  --pr-blue-bg:   #eff4fb;
  --pr-purple:    #5a2d8a;
  --pr-purple-bg: #f3eefb;

  /* Typography */
  --pr-font-display: 'DM Serif Display', serif;
  --pr-font-body:    'Instrument Sans', sans-serif;
  --pr-font-mono:    'DM Mono', monospace;

  /* Radii & shadows */
  --pr-r:   10px;
  --pr-r2:  16px;
  --pr-r3:  24px;
  --pr-sh:  0 1px 4px rgba(14,26,15,.06), 0 4px 16px rgba(14,26,15,.06);
  --pr-sh2: 0 2px 8px rgba(14,26,15,.10), 0 8px 32px rgba(14,26,15,.08);
}

/* ── Base ── */
.pr { font-family: var(--pr-font-body); color: var(--pr-ink); background: var(--pr-cream); min-height: 100vh; }
.pr *, .pr *::before, .pr *::after { font-family: inherit; }

/* ── Typography ── */
.pr-display { font-family: var(--pr-font-display); font-size: 28px; font-weight: 400; line-height: 1.1; }
.pr-display em { font-style: italic; color: var(--pr-green); }
.pr-heading  { font-size: 20px; font-weight: 600; }
.pr-subhead  { font-size: 13px; color: #6a6458; font-weight: 400; margin-top: 3px; }
.pr-label    { font-size: 11px; font-weight: 600; letter-spacing: .6px; text-transform: uppercase; color: #8a8278; }
.pr-mono     { font-family: var(--pr-font-mono); }
.pr-muted    { color: #7a7468; }

/* ── Cards ── */
.pr-card {
  background: #fff;
  border: 1px solid var(--pr-border);
  border-radius: var(--pr-r2);
  box-shadow: var(--pr-sh);
}
.pr-card-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid var(--pr-border);
}
.pr-card-body { padding: 22px; }

/* ── Stat cards ── */
.pr-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px,1fr)); gap: 14px; }
.pr-stat {
  background: #fff;
  border: 1px solid var(--pr-border);
  border-radius: var(--pr-r);
  padding: 16px 18px;
  position: relative;
  overflow: hidden;
}
.pr-stat::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: var(--pr-green);
}
.pr-stat.gold::before  { background: var(--pr-gold); }
.pr-stat.red::before   { background: var(--pr-red); }
.pr-stat.blue::before  { background: var(--pr-blue); }
.pr-stat.purple::before{ background: var(--pr-purple); }
.pr-stat-val {
  font-family: var(--pr-font-mono);
  font-size: 22px; font-weight: 500;
  margin: 6px 0 3px;
}

/* ── Buttons ── */
.pr-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 18px;
  border: none; border-radius: var(--pr-r);
  font-family: var(--pr-font-body);
  font-size: 13.5px; font-weight: 600;
  cursor: pointer; transition: all .15s;
  white-space: nowrap;
}
.pr-btn:disabled { opacity: .5; cursor: default; }
.pr-btn:active:not(:disabled) { transform: scale(.97); }

.pr-btn-primary { background: var(--pr-forest); color: #fff; }
.pr-btn-primary:hover:not(:disabled) { background: var(--pr-green); }

.pr-btn-green  { background: var(--pr-green);  color: #fff; }
.pr-btn-green:hover:not(:disabled)  { background: var(--pr-green2); }

.pr-btn-gold   { background: var(--pr-gold);   color: #fff; }
.pr-btn-gold:hover:not(:disabled)   { filter: brightness(1.05); }

.pr-btn-danger { background: var(--pr-red);    color: #fff; }
.pr-btn-ghost  { background: transparent; color: var(--pr-ink); border: 1px solid var(--pr-border2); }
.pr-btn-ghost:hover:not(:disabled)  { background: var(--pr-warm); }

.pr-btn-sm  { padding: 6px 13px; font-size: 12px; }
.pr-btn-lg  { padding: 12px 24px; font-size: 15px; }
.pr-btn-full{ width: 100%; justify-content: center; }

/* ── Inputs ── */
.pr-input {
  width: 100%; padding: 9px 12px;
  background: #fff; color: var(--pr-ink);
  border: 1px solid var(--pr-border2);
  border-radius: var(--pr-r);
  font-family: var(--pr-font-body); font-size: 13.5px;
  outline: none; transition: border-color .15s;
}
.pr-input:focus { border-color: var(--pr-green); }
.pr-input::placeholder { color: #b0aaa0; }
select.pr-input { cursor: pointer; }

.pr-field { display: flex; flex-direction: column; gap: 5px; }
.pr-field label { font-size: 12px; font-weight: 600; color: #6a6458; }

.pr-form-grid   { display: grid; grid-template-columns: 1fr 1fr;     gap: 16px; }
.pr-form-grid3  { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
@media(max-width:600px) {
  .pr-form-grid, .pr-form-grid3 { grid-template-columns: 1fr; }
}

/* ── Tables ── */
.pr-table-wrap { overflow-x: auto; }
.pr-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.pr-table th {
  padding: 10px 14px;
  font-size: 11px; font-weight: 600; letter-spacing: .5px; text-transform: uppercase;
  color: #8a8278; background: var(--pr-warm);
  border-bottom: 1px solid var(--pr-border);
  text-align: left; white-space: nowrap;
}
.pr-table th.r, .pr-table td.r { text-align: right; }
.pr-table td {
  padding: 11px 14px;
  border-bottom: 1px solid var(--pr-border);
  vertical-align: middle;
}
.pr-table tbody tr:last-child td { border-bottom: none; }
.pr-table tbody tr:hover td { background: var(--pr-cream); }
.pr-table tfoot td {
  padding: 11px 14px;
  font-weight: 600; font-size: 13px;
  background: var(--pr-warm);
  border-top: 2px solid var(--pr-border2);
}

/* ── Status badges ── */
.pr-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 99px;
  font-size: 11px; font-weight: 600;
  white-space: nowrap;
}
.pr-badge-draft     { background: var(--pr-warm);      color: #6a6458;         border: 1px solid var(--pr-border2); }
.pr-badge-reviewed  { background: var(--pr-blue-bg);   color: var(--pr-blue);   border: 1px solid #c0d0e8; }
.pr-badge-approved  { background: var(--pr-gold-bg);   color: var(--pr-gold);   border: 1px solid #f0d888; }
.pr-badge-paid      { background: var(--pr-mint);      color: var(--pr-forest); border: 1px solid #a8d4aa; }
.pr-badge-computed  { background: var(--pr-blue-bg);   color: var(--pr-blue);   border: 1px solid #c0d0e8; }
.pr-badge-adjusted  { background: var(--pr-purple-bg); color: var(--pr-purple); border: 1px solid #c8b8e8; }
.pr-badge-active    { background: var(--pr-mint);      color: var(--pr-forest); border: 1px solid #a8d4aa; }
.pr-badge-inactive  { background: var(--pr-red-bg);    color: var(--pr-red);    border: 1px solid #f0c8c4; }
.pr-badge-cancelled { background: var(--pr-red-bg);    color: var(--pr-red);    border: 1px solid #f0c8c4; }

/* ── Modal ── */
.pr-modal-bg {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(14,26,15,.45);
  backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.pr-modal {
  background: #fff;
  border-radius: var(--pr-r3);
  width: 100%; max-width: 580px;
  max-height: 92vh; display: flex; flex-direction: column;
  box-shadow: var(--pr-sh2);
  overflow: hidden;
}
.pr-modal-lg { max-width: 780px; }
.pr-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--pr-border);
  flex-shrink: 0;
}
.pr-modal-body   { padding: 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 18px; }
.pr-modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--pr-border);
  display: flex; gap: 10px; justify-content: flex-end;
  flex-shrink: 0; background: var(--pr-warm);
}

/* ── Close button ── */
.pr-close {
  width: 30px; height: 30px; border-radius: 8px;
  border: 1px solid var(--pr-border);
  background: #fff; color: #8a8278;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 18px; line-height: 1;
  transition: all .15s;
}
.pr-close:hover { background: var(--pr-warm); color: var(--pr-ink); }

/* ── Tabs ── */
.pr-tabs { display: flex; border-bottom: 1px solid var(--pr-border); gap: 0; overflow-x: auto; }
.pr-tab {
  padding: 11px 20px;
  border: none; background: none;
  font-family: var(--pr-font-body); font-size: 13.5px; font-weight: 500;
  color: #8a8278; cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px; white-space: nowrap;
  transition: all .15s;
}
.pr-tab:hover  { color: var(--pr-ink); }
.pr-tab.active { color: var(--pr-forest); border-bottom-color: var(--pr-forest); font-weight: 600; }

/* ── Progress bar ── */
.pr-progress { height: 6px; background: var(--pr-warm); border-radius: 99px; overflow: hidden; }
.pr-progress-fill { height: 100%; border-radius: 99px; background: var(--pr-green); transition: width .4s ease; }

/* ── Divider ── */
.pr-divider { border: none; border-top: 1px solid var(--pr-border); margin: 4px 0; }

/* ── Empty state ── */
.pr-empty { text-align: center; padding: 60px 20px; color: #8a8278; }
.pr-empty-icon { font-size: 36px; margin-bottom: 12px; opacity: .4; }

/* ── Spinner ── */
.pr-spin {
  display: inline-block; width: 16px; height: 16px;
  border: 2px solid var(--pr-border2);
  border-top-color: var(--pr-green);
  border-radius: 50%;
  animation: pr-spin .7s linear infinite;
}
.pr-spin-lg { width: 28px; height: 28px; border-width: 3px; }
@keyframes pr-spin { to { transform: rotate(360deg); } }

/* ── Alert ── */
.pr-alert {
  padding: 11px 14px; border-radius: var(--pr-r);
  font-size: 13px; display: flex; align-items: flex-start; gap: 9px;
  border: 1px solid;
}
.pr-alert-success { background: #f0faf0; border-color: #a8d4aa; color: var(--pr-forest); }
.pr-alert-error   { background: var(--pr-red-bg);  border-color: #f0c8c4; color: var(--pr-red); }
.pr-alert-warn    { background: var(--pr-gold-bg); border-color: #f0d888; color: #7a5800; }
.pr-alert-info    { background: var(--pr-blue-bg); border-color: #c0d0e8; color: var(--pr-blue); }

/* ── Payslip print styles ── */
@media print {
  .pr-no-print { display: none !important; }
  .pr-payslip-print { padding: 0 !important; }
}

/* ── Responsive helpers ── */
@media (max-width: 768px) {
  .pr-hide-mobile { display: none !important; }
}
@media (min-width: 769px) {
  .pr-hide-desktop { display: none !important; }
}
`;

// ── STATUS BADGE COMPONENT ───────────────────────────────────
export function StatusBadge({ status }) {
  const labels = {
    draft: "Draft", reviewed: "Reviewed", approved: "Approved",
    paid: "Paid", computed: "Computed", adjusted: "Adjusted",
    active: "Active", inactive: "Inactive", cancelled: "Cancelled",
    processing: "Processing",
  };
  return (
    <span className={`pr-badge pr-badge-${status || "draft"}`}>
      {labels[status] || status}
    </span>
  );
}

// ── SPINNER COMPONENT ────────────────────────────────────────
export function Spinner({ large = false }) {
  return <span className={`pr-spin${large ? " pr-spin-lg" : ""}`} />;
}

// ── EMPTY STATE ──────────────────────────────────────────────
export function Empty({ icon = "📋", text = "No records found", sub = "" }) {
  return (
    <div className="pr-empty">
      <div className="pr-empty-icon">{icon}</div>
      <p style={{ fontWeight: 500 }}>{text}</p>
      {sub && <p style={{ fontSize: 12, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

// ── ALERT ────────────────────────────────────────────────────
export function Alert({ type = "info", children }) {
  const icons = { success: "✓", error: "✕", warn: "⚠", info: "ℹ" };
  return (
    <div className={`pr-alert pr-alert-${type}`}>
      <span style={{ flexShrink: 0, fontWeight: 700 }}>{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
}

// ── MODAL WRAPPER ────────────────────────────────────────────
export function Modal({ title, onClose, children, footer, large = false }) {
  return (
    <div className="pr-modal-bg" onClick={onClose}>
      <div className={`pr-modal${large ? " pr-modal-lg" : ""}`} onClick={e => e.stopPropagation()}>
        <div className="pr-modal-header">
          <span className="pr-heading">{title}</span>
          <button className="pr-close" onClick={onClose}>×</button>
        </div>
        <div className="pr-modal-body">{children}</div>
        {footer && <div className="pr-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const ToastContainer = () => (
    <div style={{
      position: "fixed", bottom: 24, right: 24,
      display: "flex", flexDirection: "column", gap: 8,
      zIndex: 9999, maxWidth: 360,
    }}>
      {toasts.map(t => (
        <div key={t.id} className={`pr-alert pr-alert-${t.type}`}
          style={{ boxShadow: "0 4px 16px rgba(0,0,0,.12)", borderRadius: 10 }}>
          <span style={{ fontWeight: 700 }}>
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
          </span>
          <span style={{ fontSize: 13 }}>{t.message}</span>
        </div>
      ))}
    </div>
  );

  return { show, ToastContainer };
}