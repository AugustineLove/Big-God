import { useState, useEffect, useRef } from "react";
import { useCustomers } from '../../contexts/dashboard/Customers';

// ── Icons (inline SVGs to avoid lucide dependency issues in isolation) ──────────
const Icon = ({ d, size = 20, stroke = "currentColor", fill = "none", strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const EyeIcon = ({ open }) => open
  ? <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

// ── Shared styles injected once ─────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --gold: #C9A84C;
  --gold-light: #E8C97A;
  --gold-dim: rgba(201,168,76,0.15);
  --dark: #0A0E1A;
  --dark-2: #111827;
  --dark-3: #1C2333;
  --dark-4: #252D3D;
  --border: rgba(201,168,76,0.2);
  --text: #F0EAD6;
  --text-muted: #8A8FA8;
  --green: #22C55E;
  --red: #EF4444;
  --blue: #3B82F6;
}

body { font-family: 'DM Sans', sans-serif; background: var(--dark); color: var(--text); }

.portal-root { min-height: 100vh; }

/* ── LOGIN PAGE ── */
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--dark);
}
@media (max-width: 768px) {
  .login-page { grid-template-columns: 1fr; }
  .login-art { display: none; }
}

.login-art {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0A0E1A 0%, #0F172A 50%, #1a1000 100%);
}
.login-art::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(ellipse 80% 60% at 30% 40%, rgba(201,168,76,0.12) 0%, transparent 70%),
    radial-gradient(ellipse 60% 80% at 70% 70%, rgba(201,168,76,0.06) 0%, transparent 70%);
}
.art-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(201,168,76,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(201,168,76,0.05) 1px, transparent 1px);
  background-size: 60px 60px;
}
.art-content {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px;
}
.art-logo {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 60px;
}
.art-logo-img {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: white;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(201,168,76,0.3);
}
.art-logo-img img { width: 100%; height: 100%; object-fit: cover; }
.art-logo-text h1 { font-family: 'Playfair Display', serif; font-size: 22px; color: var(--text); }
.art-logo-text p { font-size: 12px; color: var(--gold); letter-spacing: 1px; text-transform: uppercase; }

.art-headline {
  font-family: 'Playfair Display', serif;
  font-size: clamp(32px, 3.5vw, 52px);
  line-height: 1.15;
  color: var(--text);
  margin-bottom: 24px;
}
.art-headline em { color: var(--gold); font-style: italic; }
.art-sub { color: var(--text-muted); font-size: 16px; line-height: 1.7; max-width: 380px; }

.art-stats {
  display: flex;
  gap: 40px;
  margin-top: 60px;
}
.stat-item { }
.stat-num { font-family: 'Playfair Display', serif; font-size: 32px; color: var(--gold); }
.stat-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

.art-bottom-deco {
  position: absolute;
  bottom: -40px; right: -40px;
  width: 300px; height: 300px;
  border-radius: 50%;
  border: 1px solid var(--border);
}
.art-bottom-deco::after {
  content: '';
  position: absolute;
  inset: 30px;
  border-radius: 50%;
  border: 1px solid var(--border);
}

/* ── LOGIN FORM SIDE ── */
.login-form-side {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px 40px;
  background: var(--dark-2);
}
.login-card {
  width: 100%;
  max-width: 420px;
}
.login-card-header { margin-bottom: 40px; }
.login-card-header h2 {
  font-family: 'Playfair Display', serif;
  font-size: 30px;
  color: var(--text);
  margin-bottom: 8px;
}
.login-card-header p { color: var(--text-muted); font-size: 15px; }

.form-group { margin-bottom: 20px; }
.form-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.form-input-wrap { position: relative; }
.form-input {
  width: 100%;
  background: var(--dark-3);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 48px 14px 16px;
  font-size: 15px;
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}
.form-input::placeholder { color: var(--text-muted); opacity: 0.6; }
.form-input:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(201,168,76,0.1);
}
.form-input-icon {
  position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
  color: var(--text-muted);
}
.input-toggle-btn {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; color: var(--text-muted);
  display: flex; align-items: center;
  transition: color 0.2s;
}
.input-toggle-btn:hover { color: var(--gold); }

.login-btn {
  width: 100%;
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%);
  border: none;
  border-radius: 12px;
  padding: 16px;
  font-size: 15px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  color: #0A0E1A;
  cursor: pointer;
  margin-top: 8px;
  transition: opacity 0.2s, transform 0.15s;
  position: relative;
  overflow: hidden;
}
.login-btn:hover { opacity: 0.92; transform: translateY(-1px); }
.login-btn:active { transform: translateY(0); }
.login-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.login-btn-shimmer {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
  animation: shimmer 2s infinite;
}
@keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }

.login-error {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 14px;
  color: #FCA5A5;
  margin-bottom: 20px;
}

.login-footer { margin-top: 32px; text-align: center; }
.login-footer p { font-size: 13px; color: var(--text-muted); }
.login-footer span { color: var(--gold); }

/* ── DASHBOARD ── */
.dash-page {
  min-height: 100vh;
  background: var(--dark);
}

.dash-navbar {
  background: var(--dark-2);
  border-bottom: 1px solid var(--border);
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky; top: 0; z-index: 100;
}
.dash-nav-logo { display: flex; align-items: center; gap: 12px; }
.dash-nav-logo-img {
  width: 38px; height: 38px;
  border-radius: 10px;
  background: white;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(201,168,76,0.2);
}
.dash-nav-logo-img img { width: 100%; height: 100%; object-fit: cover; }
.dash-nav-logo-text h2 { font-family: 'Playfair Display', serif; font-size: 16px; color: var(--text); }
.dash-nav-logo-text p { font-size: 10px; color: var(--gold); letter-spacing: 1px; text-transform: uppercase; }

.dash-nav-right { display: flex; align-items: center; gap: 16px; }
.dash-nav-greeting { font-size: 14px; color: var(--text-muted); }
.dash-nav-greeting strong { color: var(--text); }
.logout-btn {
  background: var(--dark-3);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}
.logout-btn:hover { border-color: var(--gold); color: var(--gold); }

.dash-body { max-width: 1100px; margin: 0 auto; padding: 32px 24px 60px; }

.dash-hero {
  background: linear-gradient(135deg, var(--dark-3) 0%, var(--dark-4) 100%);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}
.dash-hero::before {
  content: '';
  position: absolute;
  top: -50px; right: -50px;
  width: 200px; height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%);
}
.dash-hero-top { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }
.dash-avatar {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold) 0%, #8B6914 100%);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
  font-weight: 700;
  box-shadow: 0 0 20px rgba(201,168,76,0.3);
}
.dash-hero-name { font-family: 'Playfair Display', serif; font-size: 22px; color: var(--text); }
.dash-hero-id { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
.dash-status-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.25);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px;
  color: var(--green);
  margin-top: 6px;
}
.dash-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }

.dash-balance-main {
  font-family: 'Playfair Display', serif;
  font-size: 42px;
  color: var(--gold);
  margin-bottom: 4px;
}
.dash-balance-label { font-size: 13px; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; }

.dash-divider { width: 1px; height: 60px; background: var(--border); margin: 0 32px; }

.dash-hero-grid {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}
.dash-mini-stat { }
.dash-mini-num { font-family: 'Playfair Display', serif; font-size: 22px; color: var(--text); }
.dash-mini-label { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

/* cards grid */
.dash-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
.dash-card {
  background: var(--dark-2);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 22px;
  transition: border-color 0.2s, transform 0.2s;
  cursor: default;
}
.dash-card:hover { border-color: var(--gold); transform: translateY(-2px); }
.dash-card-icon {
  width: 40px; height: 40px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 14px;
}
.dash-card-label { font-size: 12px; color: var(--text-muted); letter-spacing: 0.5px; margin-bottom: 6px; }
.dash-card-value { font-family: 'Playfair Display', serif; font-size: 22px; color: var(--text); }
.dash-card-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

/* tabs */
.dash-tabs { display: flex; gap: 4px; background: var(--dark-2); border: 1px solid var(--border); border-radius: 12px; padding: 4px; margin-bottom: 20px; width: fit-content; }
.dash-tab {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-muted);
  background: transparent;
}
.dash-tab.active { background: var(--gold); color: #0A0E1A; font-weight: 600; }

/* accounts */
.accounts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.account-card {
  background: var(--dark-2);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: all 0.25s;
}
.account-card:hover { border-color: var(--gold); box-shadow: 0 8px 30px rgba(201,168,76,0.08); }
.account-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--gold), var(--gold-light));
  opacity: 0;
  transition: opacity 0.2s;
}
.account-card:hover::before { opacity: 1; }
.account-card-type {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 8px;
}
.account-card-num { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; font-family: monospace; }
.account-card-balance { font-family: 'Playfair Display', serif; font-size: 28px; color: var(--text); margin-bottom: 6px; }
.account-card-date { font-size: 12px; color: var(--text-muted); }
.account-card-status {
  position: absolute; top: 20px; right: 20px;
  font-size: 11px; padding: 4px 10px; border-radius: 20px;
}
.status-active { background: rgba(34,197,94,0.1); color: var(--green); border: 1px solid rgba(34,197,94,0.2); }
.status-inactive { background: rgba(156,163,175,0.1); color: #9CA3AF; border: 1px solid rgba(156,163,175,0.2); }

/* transactions table */
.txn-table-wrap {
  background: var(--dark-2);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
}
.txn-table-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.txn-table-header h3 { font-size: 16px; font-weight: 600; }
.txn-filter {
  background: var(--dark-3);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  outline: none;
}
table { width: 100%; border-collapse: collapse; }
thead { background: var(--dark-3); }
th { padding: 12px 20px; text-align: left; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--text-muted); }
td { padding: 16px 20px; font-size: 14px; border-bottom: 1px solid rgba(201,168,76,0.06); }
tr:last-child td { border-bottom: none; }
tr:hover td { background: rgba(201,168,76,0.02); }

.txn-icon {
  width: 34px; height: 34px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.txn-icon.in { background: rgba(34,197,94,0.1); color: var(--green); }
.txn-icon.out { background: rgba(239,68,68,0.1); color: var(--red); }
.txn-row-left { display: flex; align-items: center; gap: 12px; }
.txn-desc { font-weight: 500; font-size: 14px; }
.txn-desc-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.amount-in { color: var(--green); font-weight: 600; }
.amount-out { color: var(--red); font-weight: 600; }
.txn-status {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; padding: 3px 10px; border-radius: 20px;
}
.s-completed { background: rgba(34,197,94,0.1); color: var(--green); }
.s-pending { background: rgba(234,179,8,0.1); color: #EAB308; }
.s-reversed { background: rgba(156,163,175,0.1); color: #9CA3AF; text-decoration: line-through; }
.s-failed { background: rgba(239,68,68,0.1); color: var(--red); }

/* profile */
.profile-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.profile-card {
  background: var(--dark-2);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
}
.profile-card h4 {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.profile-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid rgba(201,168,76,0.06); }
.profile-row:last-child { border-bottom: none; }
.profile-key { font-size: 12px; color: var(--text-muted); }
.profile-val { font-size: 14px; color: var(--text); font-weight: 500; text-align: right; max-width: 55%; word-break: break-word; }

/* empty */
.empty-state {
  text-align: center;
  padding: 60px 24px;
  color: var(--text-muted);
}
.empty-state p { margin-top: 12px; font-size: 15px; }

/* loading spinner */
.spinner {
  width: 20px; height: 20px;
  border: 2px solid rgba(10,14,26,0.3);
  border-top-color: #0A0E1A;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* fade-in */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-up { animation: fadeUp 0.4s ease both; }
.fade-up-1 { animation-delay: 0.05s; }
.fade-up-2 { animation-delay: 0.1s; }
.fade-up-3 { animation-delay: 0.15s; }
.fade-up-4 { animation-delay: 0.2s; }

@media (max-width: 600px) {
  .dash-hero-grid { flex-direction: column; align-items: flex-start; }
  .dash-divider { display: none; }
  .dash-balance-main { font-size: 32px; }
  table { min-width: 600px; }
  .txn-table-wrap { overflow-x: auto; }
  th, td { padding: 12px; }
}
`;

// ── Helpers ──────────────────────────────────────────────────────────────────────
const fmt = (amount) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(Math.abs(Number(amount || 0)));

const fmtDate = (ds) => {
  if (!ds) return "—";
  const d = new Date(ds);
  return isNaN(d) ? "—" : d.toLocaleDateString("en-GH", { year: "numeric", month: "short", day: "numeric" });
};

// ── MOCK DATA (replace with real API calls) ──────────────────────────────────────
const MOCK_CUSTOMER = {
  id: "CUS-001",
  name: "Kwame Asante-Boateng",
  email: "kwame.asante@email.com",
  phone_number: "0244 123 456",
  momo_number: "0244 123 456",
  gender: "Male",
  city: "Kumasi",
  location: "Adum, Kumasi",
  date_of_birth: "1992-05-14",
  date_of_registration: "2021-03-10",
  account_number: "BGS-0001",
  id_card: "GHA-123456789-0",
  next_of_kin: "Akua Asante",
  daily_rate: "50",
  withdrawal_code: "****",
  registered_by_name: "Kofi Mensah",
  status: "Active",
};

const MOCK_ACCOUNTS = [
  { id: "acc-1", account_type: "Savings", account_number: "BGS-0001-SAV", balance: 12450.00, status: "Active", created_at: "2021-03-10" },
  { id: "acc-2", account_type: "Daily Contribution", account_number: "BGS-0001-DAY", balance: 3200.00, status: "Active", created_at: "2021-03-10" },
  { id: "acc-3", account_type: "Fixed Deposit", account_number: "BGS-0001-FXD", balance: 25000.00, status: "Inactive", created_at: "2022-01-15" },
];

const MOCK_TRANSACTIONS = [
  { id: "t1", transaction_id: "TXN-001", type: "deposit", description: "Cash Deposit", account_type: "Savings", amount: 500, status: "completed", transaction_date: "2025-02-20" },
  { id: "t2", transaction_id: "TXN-002", type: "withdrawal", description: "ATM Withdrawal", account_type: "Savings", amount: 200, status: "completed", transaction_date: "2025-02-18" },
  { id: "t3", transaction_id: "TXN-003", type: "deposit", description: "Daily Contribution", account_type: "Daily Contribution", amount: 50, status: "completed", transaction_date: "2025-02-17" },
  { id: "t4", transaction_id: "TXN-004", type: "transfer_in", description: "Transfer from Savings", account_type: "Fixed Deposit", amount: 1000, status: "completed", transaction_date: "2025-02-15" },
  { id: "t5", transaction_id: "TXN-005", type: "deposit", description: "Cash Deposit", account_type: "Savings", amount: 750, status: "completed", transaction_date: "2025-02-14" },
  { id: "t6", transaction_id: "TXN-006", type: "withdrawal", description: "MoMo Withdrawal", account_type: "Daily Contribution", amount: 100, status: "reversed", transaction_date: "2025-02-12" },
  { id: "t7", transaction_id: "TXN-007", type: "deposit", description: "Weekly Deposit", account_type: "Savings", amount: 300, status: "completed", transaction_date: "2025-02-10" },
  { id: "t8", transaction_id: "TXN-008", type: "withdrawal", description: "Bill Payment", account_type: "Savings", amount: 180, status: "completed", transaction_date: "2025-02-08" },
];

// ── Login Page ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [accountNumber, setAccountNumber] = useState("");
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useCustomers();

 const handleSubmit = async (e) => {
  e?.preventDefault();

  if (!accountNumber.trim() || !code.trim()) {
    setError("Please enter your account number and withdrawal code.");
    return;
  }

  try {
    await login(accountNumber, code);
  } catch (err) {
    setError(err.message);
  }
};

  return (
    <div className="login-page">
      {/* Left artistic panel */}
      <div className="login-art">
        <div className="art-grid" />
        <div className="art-content">
          <div className="art-logo">
            <div className="art-logo-img">
              <img src="/logo.png" alt="Big God Susu" onError={e => { e.target.style.display='none'; e.target.parentElement.style.background='linear-gradient(135deg,#C9A84C,#8B6914)'; }} />
            </div>
            <div className="art-logo-text">
              <h1>Big God</h1>
              <p>Susu Enterprise</p>
            </div>
          </div>

          <h2 className="art-headline">
            Your savings,<br />
            <em>always within</em><br />
            reach.
          </h2>
          <p className="art-sub">
            Access your account balances, track every transaction, and manage your financial journey — all in one place.
          </p>

          <div className="art-stats">
            <div className="stat-item">
              <div className="stat-num">100%</div>
              <div className="stat-label">Secure Access</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">24/7</div>
              <div className="stat-label">Availability</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">Real-time</div>
              <div className="stat-label">Balance Updates</div>
            </div>
          </div>
        </div>
        <div className="art-bottom-deco" />
      </div>

      {/* Right form panel */}
      <div className="login-form-side">
        <div className="login-card fade-up">
          <div className="login-card-header">
            <h2>Member Login</h2>
            <p>Sign in with your account number and withdrawal code to access your portal.</p>
          </div>

          {error && <div className="login-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Account Number</label>
              <div className="form-input-wrap">
                <input
                  className="form-input"
                  placeholder="e.g. BGS-0001"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  autoComplete="username"
                  spellCheck={false}
                />
                <span className="form-input-icon">
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2"/>
                    <line x1="2" y1="10" x2="22" y2="10"/>
                  </svg>
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Withdrawal Code</label>
              <div className="form-input-wrap">
                <input
                  className="form-input"
                  type={showCode ? "text" : "password"}
                  placeholder="Enter your secret code"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" className="input-toggle-btn" onClick={() => setShowCode(v => !v)}>
                  <EyeIcon open={showCode} />
                </button>
              </div>
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {!loading && <span className="login-btn-shimmer" />}
              {loading ? <span className="spinner" /> : "Access My Account →"}
            </button>
          </form>

          <div className="login-footer">
            <p>Having trouble? Contact your <span>savings officer</span> for assistance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────────
function DashboardPage({ customer, accounts, transactions, onLogout }) {
  const [activeTab, setActiveTab] = useState("accounts");
  const [txnFilter, setTxnFilter] = useState("all");

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const now = new Date();
  const monthlyTotal = transactions
    .filter(t => {
      if (!t.transaction_date || t.status === "reversed") return false;
      const d = new Date(t.transaction_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, t) => s + Number(t.amount), 0);

  const filteredTxns = transactions.filter(t =>
    txnFilter === "all" ? true : t.type === txnFilter
  );

  const isIn = (type) => type === "deposit" || type === "transfer_in";

  const txnStatusClass = (s) => {
    if (s === "completed") return "s-completed";
    if (s === "pending") return "s-pending";
    if (s === "reversed") return "s-reversed";
    if (s === "failed") return "s-failed";
    return "";
  };

  return (
    <div className="dash-page">
      {/* Navbar */}
      <nav className="dash-navbar">
        <div className="dash-nav-logo">
          <div className="dash-nav-logo-img">
            <img src="/logo.png" alt="Big God Susu" onError={e => { e.target.style.display='none'; e.target.parentElement.style.background='linear-gradient(135deg,#C9A84C,#8B6914)'; }} />
          </div>
          <div className="dash-nav-logo-text">
            <h2>Big God</h2>
            <p>Susu Enterprise</p>
          </div>
        </div>
        <div className="dash-nav-right">
          <span className="dash-nav-greeting">Welcome, <strong>{customer.name?.split(" ")[0]}</strong></span>
          <button className="logout-btn" onClick={onLogout}>Sign Out</button>
        </div>
      </nav>

      <div className="dash-body">

        {/* Hero card */}
        <div className="dash-hero fade-up">
          <div className="dash-hero-top">
            <div className="dash-avatar">{customer.name?.substring(0,2).toUpperCase()}</div>
            <div>
              <div className="dash-hero-name">{customer.name}</div>
              <div className="dash-hero-id">Account: {customer.account_number}</div>
              <div className="dash-status-badge"><span className="dash-status-dot"/>Active Member</div>
            </div>
          </div>

          <div className="dash-hero-grid">
            <div>
              <div className="dash-balance-label">Total Portfolio Balance</div>
              <div className="dash-balance-main">{fmt(totalBalance)}</div>
            </div>
            <div className="dash-divider" />
            <div className="dash-mini-stat">
              <div className="dash-mini-num">{fmt(monthlyTotal)}</div>
              <div className="dash-mini-label">This Month</div>
            </div>
            <div className="dash-divider" />
            <div className="dash-mini-stat">
              <div className="dash-mini-num">{accounts.length}</div>
              <div className="dash-mini-label">Active Accounts</div>
            </div>
            <div className="dash-divider" />
            <div className="dash-mini-stat">
              <div className="dash-mini-num">¢{customer.daily_rate}</div>
              <div className="dash-mini-label">Daily Rate</div>
            </div>
          </div>
        </div>

        {/* Quick stat cards */}
        <div className="dash-cards fade-up fade-up-1">
          {accounts.map((acc) => (
            <div className="dash-card" key={acc.id}>
              <div className="dash-card-icon" style={{ background: "var(--gold-dim)" }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                </svg>
              </div>
              <div className="dash-card-label">{acc.account_type}</div>
              <div className="dash-card-value">{fmt(acc.balance)}</div>
              <div className="dash-card-sub">{acc.account_number}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="dash-tabs fade-up fade-up-2">
          {[
            { id: "accounts", label: "My Accounts" },
            { id: "transactions", label: "Transactions" },
            { id: "profile", label: "My Profile" },
          ].map(t => (
            <button key={t.id} className={`dash-tab ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ACCOUNTS TAB ── */}
        {activeTab === "accounts" && (
          <div className="accounts-grid fade-up fade-up-3">
            {accounts.map(acc => (
              <div className="account-card" key={acc.id}>
                <span className={`account-card-status ${acc.status === "Active" ? "status-active" : "status-inactive"}`}>
                  {acc.status}
                </span>
                <div className="account-card-type">{acc.account_type}</div>
                <div className="account-card-num">{acc.account_number}</div>
                <div className="account-card-balance">{fmt(acc.balance)}</div>
                <div className="account-card-date">Opened {fmtDate(acc.created_at)}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── TRANSACTIONS TAB ── */}
        {activeTab === "transactions" && (
          <div className="txn-table-wrap fade-up fade-up-3">
            <div className="txn-table-header">
              <h3>Transaction History</h3>
              <select className="txn-filter" value={txnFilter} onChange={e => setTxnFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="transfer_in">Transfers In</option>
              </select>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Account</th>
                    <th>Date</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTxns.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No transactions found</td></tr>
                  ) : filteredTxns.map(txn => (
                    <tr key={txn.id} style={{ opacity: txn.status === "reversed" ? 0.55 : 1 }}>
                      <td>
                        <div className="txn-row-left">
                          <div className={`txn-icon ${isIn(txn.type) ? "in" : "out"}`}>
                            {isIn(txn.type) ? (
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                            ) : (
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                            )}
                          </div>
                          <div>
                            <div className="txn-desc">{txn.description}</div>
                            <div className="txn-desc-sub" style={{ textTransform: "capitalize" }}>{txn.type.replace("_", " ")}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{txn.account_type}</td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDate(txn.transaction_date)}</td>
                      <td style={{ textAlign: "right" }}>
                        <span className={isIn(txn.type) ? "amount-in" : "amount-out"}>
                          {isIn(txn.type) ? "+" : "−"}{fmt(txn.amount)}
                        </span>
                      </td>
                      <td>
                        <span className={`txn-status ${txnStatusClass(txn.status)}`}>
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {activeTab === "profile" && (
          <div className="profile-grid fade-up fade-up-3">
            <div className="profile-card">
              <h4>Personal Details</h4>
              {[
                ["Full Name", customer.name],
                ["Gender", customer.gender],
                ["Date of Birth", fmtDate(customer.date_of_birth)],
                ["Phone Number", customer.phone_number],
                ["Mobile Money", customer.momo_number],
                ["Email", customer.email || "—"],
              ].map(([k, v]) => (
                <div className="profile-row" key={k}>
                  <span className="profile-key">{k}</span>
                  <span className="profile-val">{v || "—"}</span>
                </div>
              ))}
            </div>

            <div className="profile-card">
              <h4>Account Details</h4>
              {[
                ["Account Number", customer.account_number],
                ["Date Joined", fmtDate(customer.date_of_registration)],
                ["Daily Rate", `¢${customer.daily_rate}`],
                ["Ghana Card", customer.id_card],
                ["Next of Kin", customer.next_of_kin],
                ["Registered By", customer.registered_by_name],
              ].map(([k, v]) => (
                <div className="profile-row" key={k}>
                  <span className="profile-key">{k}</span>
                  <span className="profile-val">{v || "—"}</span>
                </div>
              ))}
            </div>

            <div className="profile-card">
              <h4>Location</h4>
              {[
                ["City", customer.city],
                ["Address", customer.location],
              ].map(([k, v]) => (
                <div className="profile-row" key={k}>
                  <span className="profile-key">{k}</span>
                  <span className="profile-val">{v || "—"}</span>
                </div>
              ))}
              <div style={{ marginTop: 20, padding: "14px", background: "var(--dark-3)", borderRadius: 12, border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  To update any personal information, please contact your savings officer or visit our office.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Root App ─────────────────────────────────────────────────────────────────────
const CustomerPortal = () => {
  const [session, setSession] = useState(null); // { customer, accounts, transactions }

  return (
    <>
      <style>{STYLES}</style>
      <div className="portal-root">
        {!session ? (
          <LoginPage onLogin={(data) => setSession(data)} />
        ) : (
          <DashboardPage
            customer={session.customer}
            accounts={session.accounts}
            transactions={session.transactions}
            onLogout={() => setSession(null)}
          />
        )}
      </div>
    </>
  );
}

export default CustomerPortal;