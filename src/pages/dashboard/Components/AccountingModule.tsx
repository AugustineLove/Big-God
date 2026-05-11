import React, { useState, useEffect, useCallback, useMemo } from "react";
import { companyId, userUUID } from "../../../constants/appConstants";

// ─────────────────────────────────────────────────────────────
// CONFIG — adjust base URL to match your Express server
// ─────────────────────────────────────────────────────────────
const API = `https://susu-pro-backend.onrender.com/api/accounting/${companyId}`;

const fmt = (n) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", minimumFractionDigits: 2 }).format(Number(n) || 0);

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ─────────────────────────────────────────────────────────────
// STYLES - Light Theme
// ─────────────────────────────────────────────────────────────
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #f8f9fc;
    --bg2:       #ffffff;
    --bg3:       #f1f3f8;
    --border:    #e4e7ed;
    --border2:   #d1d5db;
    --text:      #1a1a2e;
    --text2:     #6b7280;
    --text3:     #9ca3af;
    --accent:    #4f46e5;
    --accent2:   #6366f1;
    --accent-light: #eef2ff;
    --green:     #10b981;
    --green-light: #d1fae5;
    --red:       #ef4444;
    --red-light: #fee2e2;
    --blue:      #3b82f6;
    --blue-light: #dbeafe;
    --purple:    #8b5cf6;
    --purple-light: #ede9fe;
    --orange:    #f59e0b;
    --orange-light: #fed7aa;
    --radius:    10px;
    --radius-lg: 16px;
    --shadow:    0 1px 3px 0 rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }

  body { background: var(--bg); color: var(--text); }

  .acc-module {
    min-height: 100vh;
    background: var(--bg);
  }

  /* ── Top bar ── */
  .acc-topbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 28px;
    background: var(--bg2);
    border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 50;
    box-shadow: var(--shadow);
  }
  .acc-topbar-logo {
    font-size: 24px;
    color: var(--accent);
    letter-spacing: -0.5px;
  }
  .acc-topbar-logo span { font-style: italic; color: var(--accent2); }
  .acc-topbar-sep { flex: 1; }
  .acc-topbar-badge {
    font-size: 11px;
    background: var(--accent-light);
    border: 1px solid var(--accent2);
    color: var(--accent);
    padding: 4px 12px;
    border-radius: 99px;
    letter-spacing: 0.5px;
  }

  /* ── Nav tabs ── */
  .acc-nav {
    display: flex;
    gap: 4px;
    padding: 0 28px;
    background: var(--bg2);
    border-bottom: 1px solid var(--border);
    overflow-x: auto;
  }
  .acc-nav-btn {
    padding: 12px 20px;
    border: none;
    background: none;
    color: var(--text2);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    white-space: nowrap;
    transition: all .2s;
  }
  .acc-nav-btn:hover { color: var(--accent); background: var(--bg3); }
  .acc-nav-btn.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
    background: var(--accent-light);
  }

  /* ── Layout ── */
  .acc-body { padding: 28px; max-width: 1400px; margin: 0 auto; }

  /* ── Cards ── */
  .acc-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow);
  }
  .acc-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--bg2);
  }
  .acc-card-title {
    font-size: 20px;
    color: var(--text);
  }

  /* ── Stat grid ── */
  .acc-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }
  .acc-stat {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    transition: transform .2s, box-shadow .2s;
  }
  .acc-stat:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
  .acc-stat-label {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--text2);
    margin-bottom: 8px;
  }
  .acc-stat-value {
    font-size: 24px;
    font-weight: 600;
    color: var(--text);
  }
  .acc-stat-value.green { color: var(--green); }
  .acc-stat-value.red   { color: var(--red); }
  .acc-stat-value.gold  { color: var(--accent); }
  .acc-stat-sub {
    font-size: 12px;
    color: var(--text3);
    margin-top: 6px;
  }

  /* ── Table ── */
  .acc-table-wrap { overflow-x: auto; }
  .acc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .acc-table th {
    padding: 12px 16px;
    text-align: left;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--text2);
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
    background: var(--bg3);
  }
  .acc-table th.right, .acc-table td.right { text-align: right; }
  .acc-table td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    color: var(--text);
    vertical-align: middle;
  }
  .acc-table tr:last-child td { border-bottom: none; }
  .acc-table tr:hover td { background: var(--bg3); }
  .acc-table .mono { font-size: 13px; }
  .acc-table .muted { color: var(--text2); }
  .acc-table .group-header td {
    background: var(--bg3);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--accent);
    padding: 10px 16px;
  }
  .acc-table .subtotal td {
    font-weight: 600;
    font-size: 13px;
    background: var(--accent-light);
    border-top: 1px solid var(--border);
  }
  .acc-table .grand-total td {
    font-weight: 700;
    background: var(--accent-light);
    border-top: 2px solid var(--accent);
    color: var(--accent);
  }

  /* ── Badges ── */
  .acc-badge {
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.3px;
    padding: 4px 10px;
    border-radius: 99px;
    text-transform: uppercase;
  }
  .acc-badge.asset     { background: var(--blue-light); color: var(--blue); }
  .acc-badge.liability { background: var(--red-light); color: var(--red); }
  .acc-badge.equity    { background: var(--purple-light); color: var(--purple); }
  .acc-badge.income    { background: var(--green-light); color: var(--green); }
  .acc-badge.expense   { background: var(--orange-light); color: var(--orange); }
  .acc-badge.posted    { background: var(--green-light); color: var(--green); }
  .acc-badge.draft     { background: #f3f4f6; color: var(--text2); }
  .acc-badge.reversed  { background: var(--red-light); color: var(--red); }
  .acc-badge.debit     { background: var(--blue-light); color: var(--blue); }
  .acc-badge.credit    { background: var(--green-light); color: var(--green); }

  /* ── Buttons ── */
  .acc-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 18px;
    border-radius: var(--radius);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all .2s;
  }
  .acc-btn:hover { opacity: .85; transform: translateY(-1px); }
  .acc-btn:active { transform: translateY(0); }
  .acc-btn.primary { background: var(--accent); color: white; }
  .acc-btn.ghost {
    background: transparent;
    color: var(--text2);
    border: 1px solid var(--border2);
  }
  .acc-btn.ghost:hover { background: var(--bg3); color: var(--text); border-color: var(--text3); }
  .acc-btn.danger { background: var(--red-light); color: var(--red); border: 1px solid var(--red); }
  .acc-btn.sm { padding: 5px 12px; font-size: 12px; }

  /* ── Search / filter bar ── */
  .acc-filters {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    background: var(--bg2);
  }
  .acc-input {
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: var(--radius);
    color: var(--text);
    font-size: 13px;
    padding: 8px 14px;
    outline: none;
    transition: all .2s;
  }
  .acc-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
  .acc-input::placeholder { color: var(--text3); }
  .acc-input.wide { flex: 1; min-width: 200px; }
  select.acc-input { cursor: pointer; background: var(--bg2); }

  /* ── Modal ── */
  .acc-modal-bg {
    position: fixed; inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .acc-modal {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
  }
  .acc-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--bg2);
  }
  .acc-modal-title {
    font-size: 20px;
    color: var(--text);
  }
  .acc-modal-close {
    background: none; border: none;
    color: var(--text2); font-size: 24px;
    cursor: pointer; padding: 4px 8px;
    border-radius: 6px;
    transition: background .2s;
  }
  .acc-modal-close:hover { background: var(--bg3); color: var(--text); }
  .acc-modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
  .acc-modal-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    background: var(--bg3);
  }

  /* ── Form ── */
  .acc-form-row { display: flex; flex-direction: column; gap: 6px; }
  .acc-form-row label { font-size: 13px; font-weight: 500; color: var(--text2); }
  .acc-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .acc-form-line {
    display: grid;
    grid-template-columns: 1fr 100px 120px 32px;
    gap: 8px;
    align-items: center;
  }
  .acc-form-sep {
    border: none; border-top: 1px solid var(--border);
    margin: 8px 0;
  }

  /* ── Empty / loading ── */
  .acc-empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--text3);
    font-size: 14px;
  }
  .acc-empty-icon { font-size: 48px; margin-bottom: 16px; opacity: .5; }
  .acc-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: var(--text3);
    gap: 12px;
    font-size: 14px;
  }
  .acc-spinner {
    width: 20px; height: 20px;
    border: 2px solid var(--border2);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Pagination ── */
  .acc-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-top: 1px solid var(--border);
    font-size: 13px;
    color: var(--text2);
    background: var(--bg2);
  }

  /* ── Alert ── */
  .acc-alert {
    padding: 12px 16px;
    border-radius: var(--radius);
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .acc-alert.success { background: var(--green-light); color: var(--green); border: 1px solid var(--green); }
  .acc-alert.error   { background: var(--red-light); color: var(--red); border: 1px solid var(--red); }

  /* ── Report sections ── */
  .acc-report-section { margin-bottom: 32px; }
  .acc-report-section-title {
    font-size: 18px;
    color: var(--accent);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--accent);
  }

  /* ── Expand/collapse ── */
  .acc-expand { cursor: pointer; user-select: none; }
  .acc-indent { padding-left: 32px !important; }
  .acc-indent2 { padding-left: 48px !important; }

  /* ── Balance indicator ── */
  .acc-balanced {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 600; padding: 4px 12px;
    border-radius: 99px;
  }
  .acc-balanced.ok  { background: var(--green-light); color: var(--green); }
  .acc-balanced.bad { background: var(--red-light); color: var(--red); }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: var(--bg3); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text3); }
`;

// ─────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────
function useFetch(url, deps = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    if (!url) return;
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem('susupro_token');
      const r = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || "Request failed");
      setData(j);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => { load(); }, [load, ...deps]);
  return { data, loading, error, refetch: load };
}

// ─────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────
function Spinner() {
  return <div className="acc-loading"><div className="acc-spinner" /><span>Loading...</span></div>;
}

function Empty({ icon = "📭", text = "No records found" }) {
  return <div className="acc-empty"><div className="acc-empty-icon">{icon}</div>{text}</div>;
}

function Badge({ type }) {
  const badgeMap = {
    asset: 'asset', liability: 'liability', equity: 'equity',
    income: 'income', expense: 'expense', posted: 'posted',
    draft: 'draft', reversed: 'reversed', debit: 'debit', credit: 'credit'
  };
  return <span className={`acc-badge ${badgeMap[type] || 'draft'}`}>{type}</span>;
}

function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  return (
    <div className="acc-pagination">
      <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)</span>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="acc-btn ghost sm" disabled={pagination.page <= 1}
          onClick={() => onPage(pagination.page - 1)}>← Previous</button>
        <button className="acc-btn ghost sm" disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPage(pagination.page + 1)}>Next →</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CHART OF ACCOUNTS VIEW
// ─────────────────────────────────────────────────────────────
function ChartOfAccounts({ companyId }) {
  const { data, loading, refetch } = useFetch(`${API}/accounts`);
  const [search, setSearch]   = useState("");
  const [typeFilter, setType] = useState("all");
  const [showModal, setModal] = useState(false);
  const [editAcc, setEdit]    = useState(null);
  const [msg, setMsg]         = useState(null);

  const accounts = data?.data || [];

  const filtered = useMemo(() => accounts.filter(a => {
    const matchType = typeFilter === "all" || a.account_type === typeFilter;
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search);
    return matchType && matchSearch;
  }), [accounts, search, typeFilter]);

  const grouped = useMemo(() => {
    const order = ["asset", "liability", "equity", "income", "expense"];
    return order.map(type => ({
      type,
      rows: filtered.filter(a => a.account_type === type)
    })).filter(g => g.rows.length > 0);
  }, [filtered]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this account?")) return;
    const r = await fetch(`${API}/accounts/${id}`, { method: "DELETE" });
    const j = await r.json();
    if (r.ok) { setMsg({ type: "success", text: "Account deleted" }); refetch(); }
    else setMsg({ type: "error", text: j.message });
    setTimeout(() => setMsg(null), 3500);
  };

  return (
    <div>
      <div className="acc-stats">
        {["asset","liability","equity","income","expense"].map(type => {
          const rows  = accounts.filter(a => a.account_type === type);
          const total = rows.reduce((sum, acc) => {
            const amount = Number(acc.current_balance || 0);

            const isContraAsset =
              acc.account_type === "asset" &&
              acc.normal_balance === "credit";

            return sum + (isContraAsset ? -amount : amount);
          }, 0);
          return (
            <div className="acc-stat" key={type}>
              <div className="acc-stat-label">{type}</div>
              <div className={`acc-stat-value ${type === "income" ? "green" : type === "expense" ? "red" : type === "asset" ? "gold" : ""}`}>
                {fmt(total)}
              </div>
              <div className="acc-stat-sub">{rows.length} accounts</div>
            </div>
          );
        })}
      </div>

      {msg && <div className={`acc-alert ${msg.type}`} style={{ marginBottom: 16 }}>
        {msg.type === "success" ? "✓" : "✕"} {msg.text}
      </div>}

      <div className="acc-card">
        <div className="acc-card-header">
          <span className="acc-card-title">Chart of Accounts</span>
          <button className="acc-btn primary" onClick={() => { setEdit(null); setModal(true); }}>
            + New Account
          </button>
        </div>

        <div className="acc-filters">
          <input className="acc-input wide" placeholder="Search by name or code..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="acc-input" value={typeFilter} onChange={e => setType(e.target.value)}>
            <option value="all">All types</option>
            <option value="asset">Assets</option>
            <option value="liability">Liabilities</option>
            <option value="equity">Equity</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        {loading ? <Spinner /> : (
          <div className="acc-table-wrap">
            <table className="acc-table">
              <thead>
                <tr><th>Code</th><th>Account name</th><th>Type</th><th>Category</th><th className="right">Balance</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {grouped.length === 0 && <tr><td colSpan={7}><Empty /></td></tr>}
                {grouped.map(group => (
                  <>
                    <tr className="group-header" key={`g-${group.type}`}>
                      <td colSpan={7}>{group.type.toUpperCase()} ({group.rows.length})</td>
                    </tr>
                    {group.rows.map(acc => (
                      <tr key={acc.id}>
                        <td className="mono" style={{ color: "var(--accent)", whiteSpace: "nowrap" }}>{acc.code}</td>
                        <td className={acc.is_sub_account ? "acc-indent" : ""}>
                          {acc.name}
                          {acc.is_system_account && <span style={{ marginLeft: 8, fontSize: 10, color: "var(--text3)" }}>SYSTEM</span>}
                        </td>
                        <td><Badge type={acc.account_type} /></td>
                        <td className="muted" style={{ fontSize: 12 }}>{acc.category?.replace(/_/g, " ")}</td>
                        <td className="right mono">
                          <span style={{ color: Number(acc.current_balance) < 0 ? "var(--red)" : "var(--text)" }}>
                            {fmt(acc.current_balance)}
                          </span>
                        </td>
                        <td><span className={`acc-badge ${acc.is_active ? "posted" : "reversed"}`}>{acc.is_active ? "active" : "inactive"}</span></td>
                        <td>
                          <div style={{ display: "flex", gap: 8 }}>
                            {!acc.is_system_account && (
                              <>
                                <button className="acc-btn ghost sm" onClick={() => { setEdit(acc); setModal(true); }}>Edit</button>
                                <button className="acc-btn danger sm" onClick={() => handleDelete(acc.id)}>Delete</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="subtotal">
                      <td colSpan={4} style={{ paddingLeft: 16 }}>Subtotal — {group.type}</td>
                      <td className="right"> {fmt(
                      group.rows.reduce((sum, acc) => {
                        const amount = Number(acc.current_balance);

                        return sum + (
                          acc.normal_balance === "credit"
                            ? -amount
                            : amount
                        );
                      }, 0)
                    )}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <AccountModal
          companyId={companyId}
          account={editAcc}
          accounts={accounts}
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); refetch(); }}
        />
      )}
    </div>
  );
}

// ─── Account create/edit modal ───────────────────────────────
function AccountModal({ companyId, account, accounts, onClose, onSaved }) {
  const isEdit = !!account;
  const [form, setForm] = useState({
    code:            account?.code || "",
    name:            account?.name || "",
    description:     account?.description || "",
    account_type:    account?.account_type || "asset",
    category:        account?.category || "cash_and_cash_equivalents",
    parent_id:       account?.parent_id || "",
    opening_balance: account?.opening_balance || 0,
    opening_date:    account?.opening_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    is_active:       account?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState(null);

  const CATEGORIES = {
    asset:     ["cash_and_cash_equivalents","bank_accounts","accounts_receivable","other_receivables","fixed_assets","accumulated_depreciation","other_assets"],
    liability: ["customer_deposits","loans_payable","accounts_payable","accrued_liabilities","other_liabilities"],
    equity:    ["share_capital","retained_earnings","current_year_profit"],
    income:    ["interest_income","commission_income","fee_income","other_income"],
    expense:   ["staff_costs","depreciation_expense","interest_expense","operating_expense","commission_expense","other_expense"],
  };

  const submit = async () => {
    setLoading(true); setErr(null);
    const url    = isEdit ? `${API}/accounts/${account.id}` : `${API}/accounts`;
    const method = isEdit ? "PATCH" : "POST";
    const body   = isEdit
      ? { name: form.name, description: form.description, is_active: form.is_active }
      : form;
    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({...body, created_by: userUUID})
    });
    const j = await r.json();
    setLoading(false);
    if (r.ok) onSaved();
    else setErr(j.message);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="acc-modal-bg" onClick={onClose}>
      <div className="acc-modal" onClick={e => e.stopPropagation()}>
        <div className="acc-modal-header">
          <span className="acc-modal-title">{isEdit ? "Edit Account" : "New Account"}</span>
          <button className="acc-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="acc-modal-body">
          {err && <div className="acc-alert error">✕ {err}</div>}
          <div className="acc-form-grid">
            <div className="acc-form-row">
              <label>Account code *</label>
              <input className="acc-input" value={form.code} disabled={isEdit}
                onChange={e => set("code", e.target.value)} placeholder="e.g., 1010-04" />
            </div>
            <div className="acc-form-row">
              <label>Account type *</label>
              <select className="acc-input" value={form.account_type} disabled={isEdit}
                onChange={e => { set("account_type", e.target.value); set("category", CATEGORIES[e.target.value][0]); }}>
                {["asset","liability","equity","income","expense"].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="acc-form-row">
            <label>Account name *</label>
            <input className="acc-input" value={form.name}
              onChange={e => set("name", e.target.value)} placeholder="e.g., Petty Cash" />
          </div>

          <div className="acc-form-row">
            <label>Category *</label>
            <select className="acc-input" value={form.category} disabled={isEdit}
              onChange={e => set("category", e.target.value)}>
              {(CATEGORIES[form.account_type] || []).map(c => (
                <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          {!isEdit && (
            <>
              <div className="acc-form-row">
                <label>Parent account (optional)</label>
                <select className="acc-input" value={form.parent_id}
                  onChange={e => set("parent_id", e.target.value)}>
                  <option value="">— None (top-level) —</option>
                  {accounts.filter(a => a.account_type === form.account_type && !a.is_sub_account)
                    .map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                </select>
              </div>
              <div className="acc-form-grid">
                <div className="acc-form-row">
                  <label>Opening balance</label>
                  <input className="acc-input" type="number" value={form.opening_balance}
                    onChange={e => set("opening_balance", e.target.value)} />
                </div>
                <div className="acc-form-row">
                  <label>Opening date</label>
                  <input className="acc-input" type="date" value={form.opening_date}
                    onChange={e => set("opening_date", e.target.value)} />
                </div>
              </div>
            </>
          )}

          <div className="acc-form-row">
            <label>Description</label>
            <input className="acc-input" value={form.description}
              onChange={e => set("description", e.target.value)} placeholder="Optional notes" />
          </div>

          {isEdit && (
            <div className="acc-form-row">
              <label>Status</label>
              <select className="acc-input" value={form.is_active}
                onChange={e => set("is_active", e.target.value === "true")}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          )}
        </div>
        <div className="acc-modal-footer">
          <button className="acc-btn ghost" onClick={onClose}>Cancel</button>
          <button className="acc-btn primary" onClick={submit} disabled={loading}>
            {loading ? "Saving..." : isEdit ? "Save changes" : "Create account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// JOURNAL ENTRIES VIEW
// ─────────────────────────────────────────────────────────────
function JournalEntries({ companyId }) {
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [status, setStatus]     = useState("all");
  const [source, setSource]     = useState("all");
  const [startDate, setStart]   = useState("");
  const [endDate, setEnd]       = useState("");
  const [showModal, setModal]   = useState(false);
  const [expanded, setExpanded] = useState({});

  const params = new URLSearchParams({
    page,
    ...(search    ? { search } : {}),
    ...(status !== "all" ? { status } : {}),
    ...(source !== "all" ? { source } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate   ? { endDate }   : {}),
  });

  const { data, loading, refetch } = useFetch(`${API}/journal?${params}`, [page, search, status, source, startDate, endDate]);
  const entries    = data?.data        || [];
  const pagination = data?.pagination;

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  return (
    <div>
      <div className="acc-card">
        <div className="acc-card-header">
          <span className="acc-card-title">Journal Entries</span>
          <button className="acc-btn primary" onClick={() => setModal(true)}>+ Manual Entry</button>
        </div>

        <div className="acc-filters">
          <input className="acc-input wide" placeholder="Search reference or description..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select className="acc-input" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="all">All statuses</option>
            <option value="posted">Posted</option>
            <option value="draft">Draft</option>
            <option value="reversed">Reversed</option>
          </select>
          <select className="acc-input" value={source} onChange={e => { setSource(e.target.value); setPage(1); }}>
            <option value="all">All sources</option>
            {["customer_deposit","customer_withdrawal","commission","expense","revenue","transfer","depreciation","manual","opening_balance"].map(s => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
          <input className="acc-input" type="date" placeholder="Start date" value={startDate} onChange={e => setStart(e.target.value)} />
          <input className="acc-input" type="date" placeholder="End date" value={endDate} onChange={e => setEnd(e.target.value)} />
        </div>

        {loading ? <Spinner /> : (
          <div className="acc-table-wrap">
            <table className="acc-table">
              <thead>
                <tr>
                  <th style={{ width: 30 }}></th>
                  <th>Reference</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Source</th>
                  <th className="right">Debits</th>
                  <th className="right">Credits</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <Empty />
                    </td>
                  </tr>
                )}

                {entries.map(je => (
                  <React.Fragment key={je.id}>
                    <tr className="acc-expand" onClick={() => toggleExpand(je.id)}>
                      <td style={{ color: "var(--text3)", textAlign: "center" }}>
                        {expanded[je.id] ? "▼" : "▶"}
                      </td>
                      <td className="mono" style={{ color: "var(--accent)" }}>
                        {je.reference_no}
                      </td>
                      <td className="muted">{fmtDate(je.entry_date)}</td>
                      <td>{je.description}</td>
                      <td>
                        <span className="muted" style={{ fontSize: 12 }}>
                          {je.source?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="right mono">{fmt(je.total_debits)}</td>
                      <td className="right mono">{fmt(je.total_credits)}</td>
                      <td><Badge type={je.status} /></td>
                    </tr>

                    {expanded[je.id] &&
                      (je.lines || []).map(line => (
                        <tr key={line.id} style={{ background: "var(--bg3)" }}>
                          <td></td>
                          <td className="acc-indent2 mono" style={{ fontSize: 12, color: "var(--text3)" }}>
                            {line.account_code}
                          </td>
                          <td colSpan={2} className="acc-indent2 muted" style={{ fontSize: 12 }}>
                            {line.account_name}
                            {line.description && (
                              <span style={{ color: "var(--text3)" }}>
                                {" — "}{line.description}
                              </span>
                            )}
                          </td>
                          <td><Badge type={line.debit_credit} /></td>
                          <td className="right mono">
                            {line.debit_credit === "debit" ? fmt(line.amount) : ""}
                          </td>
                          <td className="right mono">
                            {line.debit_credit === "credit" ? fmt(line.amount) : ""}
                          </td>
                          <td></td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={pagination} onPage={setPage} />
      </div>

      {showModal && (
        <JournalModal companyId={companyId}
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); refetch(); }} />
      )}
    </div>
  );
}

// ─── Manual journal entry modal ───────────────────────────────
function JournalModal({ companyId, onClose, onSaved }) {
  const { data: coaData } = useFetch(`${API}/accounts`);
  const accounts = coaData?.data || [];

  const [desc, setDesc]       = useState("");
  const [date, setDate]       = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo]       = useState("");
  const [lines, setLines]     = useState([
    { coa_id: "", debit_credit: "debit",  amount: "" },
    { coa_id: "", debit_credit: "credit", amount: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState(null);

  const totalDebits  = lines.filter(l => l.debit_credit === "debit").reduce((s, l) => s + Number(l.amount || 0), 0);
  const totalCredits = lines.filter(l => l.debit_credit === "credit").reduce((s, l) => s + Number(l.amount || 0), 0);
  const balanced     = Math.abs(totalDebits - totalCredits) < 0.01;

  const addLine = () => setLines(ls => [...ls, { coa_id: "", debit_credit: "debit", amount: "" }]);
  const remLine = (i) => setLines(ls => ls.filter((_, idx) => idx !== i));
  const setLine = (i, k, v) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l));

  const submit = async () => {
    if (!desc) return setErr("Description is required");
    if (!balanced) return setErr("Debits must equal credits");
    setLoading(true); setErr(null);
    const r = await fetch(`${API}/journal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: desc, entry_date: date, memo,
        lines: lines.filter(l => l.coa_id && l.amount),
        created_by: userUUID,
      })
    });
    const j = await r.json();
    setLoading(false);
    if (r.ok) onSaved();
    else setErr(j.message);
  };

  return (
    <div className="acc-modal-bg" onClick={onClose}>
      <div className="acc-modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
        <div className="acc-modal-header">
          <span className="acc-modal-title">Manual Journal Entry</span>
          <button className="acc-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="acc-modal-body">
          {err && <div className="acc-alert error">✕ {err}</div>}
          <div className="acc-form-grid">
            <div className="acc-form-row">
              <label>Description *</label>
              <input className="acc-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g., Adjusting entry" />
            </div>
            <div className="acc-form-row">
              <label>Date *</label>
              <input className="acc-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <div className="acc-form-row">
            <label>Memo (optional)</label>
            <input className="acc-input" value={memo} onChange={e => setMemo(e.target.value)} placeholder="Internal reference" />
          </div>

          <hr className="acc-form-sep" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)" }}>Journal Lines</span>
            <span className={`acc-balanced ${balanced ? "ok" : "bad"}`}>
              {balanced ? "✓ Balanced" : `Out by ${fmt(Math.abs(totalDebits - totalCredits))}`}
            </span>
          </div>

          {lines.map((line, i) => (
            <div className="acc-form-line" key={i}>
              <select className="acc-input" value={line.coa_id} onChange={e => setLine(i, "coa_id", e.target.value)}>
                <option value="">— Select account —</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
              </select>
              <select className="acc-input" value={line.debit_credit} onChange={e => setLine(i, "debit_credit", e.target.value)}>
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
              <input className="acc-input" type="number" placeholder="Amount" value={line.amount}
                onChange={e => setLine(i, "amount", e.target.value)} />
              <button className="acc-btn danger sm" onClick={() => remLine(i)} disabled={lines.length <= 2}>✕</button>
            </div>
          ))}

          <button className="acc-btn ghost sm" style={{ width: "fit-content" }} onClick={addLine}>+ Add line</button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "var(--bg3)", borderRadius: 8, padding: "12px 16px", marginTop: 8 }}>
            <span style={{ fontSize: 13, color: "var(--text2)" }}>Total debits</span>
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: "var(--blue)", textAlign: "right" }}>{fmt(totalDebits)}</span>
            <span style={{ fontSize: 13, color: "var(--text2)" }}>Total credits</span>
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: "var(--green)", textAlign: "right" }}>{fmt(totalCredits)}</span>
          </div>
        </div>
        <div className="acc-modal-footer">
          <button className="acc-btn ghost" onClick={onClose}>Cancel</button>
          <button className="acc-btn primary" onClick={submit} disabled={loading || !balanced}>
            {loading ? "Posting..." : "Post Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GENERAL LEDGER VIEW
// ─────────────────────────────────────────────────────────────
function GeneralLedger({ companyId }) {
  const { data: coaData } = useFetch(`${API}/accounts`);
  const accounts = coaData?.data || [];

  const [coaId, setCoaId]     = useState("");
  const [startDate, setStart] = useState("");
  const [endDate, setEnd]     = useState("");
  const [page, setPage]       = useState(1);

  const params = new URLSearchParams({
    page, limit: 50,
    ...(coaId     ? { coa_id: coaId } : {}),
    ...(startDate ? { startDate }     : {}),
    ...(endDate   ? { endDate }       : {}),
  });

  const { data, loading } = useFetch(`${API}/ledger?${params}`, [coaId, startDate, endDate, page]);
  const rows       = data?.data        || [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="acc-card">
        <div className="acc-card-header">
          <span className="acc-card-title">General Ledger</span>
        </div>

        <div className="acc-filters">
          <select className="acc-input" style={{ flex: 1, minWidth: 250 }} value={coaId}
            onChange={e => { setCoaId(e.target.value); setPage(1); }}>
            <option value="">— All accounts —</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
          </select>
          <input className="acc-input" type="date" placeholder="Start date" value={startDate} onChange={e => { setStart(e.target.value); setPage(1); }} />
          <input className="acc-input" type="date" placeholder="End date" value={endDate} onChange={e => { setEnd(e.target.value); setPage(1); }} />
        </div>

        {loading ? <Spinner /> : (
          <div className="acc-table-wrap">
            <table className="acc-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Account</th>
                  <th>Description</th>
                  <th>Source</th>
                  <th className="right">Debit</th>
                  <th className="right">Credit</th>
                  <th className="right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={8}><Empty /></td></tr>}
                {rows.map(r => (
                  <tr key={r.line_id}>
                    <td className="muted">{fmtDate(r.entry_date)}</td>
                    <td className="mono" style={{ color: "var(--accent)" }}>{r.reference_no}</td>
                    <td>
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "var(--accent)" }}>{r.account_code}</div>
                      <div style={{ fontSize: 13 }}>{r.account_name}</div>
                    </td>
                    <td className="muted" style={{ fontSize: 13 }}>
                      {r.line_description || r.entry_description}
                      {r.customer_name && <div style={{ fontSize: 11, color: "var(--text3)" }}>{r.customer_name}</div>}
                    </td>
                    <td><span className="muted" style={{ fontSize: 11 }}>{r.source?.replace(/_/g," ")}</span></td>
                    <td className="right mono" style={{ color: "var(--blue)" }}>{r.debit_credit === "debit" ? fmt(r.amount) : ""}</td>
                    <td className="right mono" style={{ color: "var(--green)" }}>{r.debit_credit === "credit" ? fmt(r.amount) : ""}</td>
                    <td className="right mono" style={{ color: Number(r.running_balance) < 0 ? "var(--red)" : "var(--text)" }}>
                      {fmt(r.running_balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={pagination} onPage={setPage} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TRIAL BALANCE VIEW
// ─────────────────────────────────────────────────────────────
function TrialBalance({ companyId }) {
  const [startDate, setStart] = useState("");
  const [endDate, setEnd]     = useState("");
  const params = new URLSearchParams({
    ...(startDate ? { startDate } : {}),
    ...(endDate   ? { endDate }   : {}),
  });

  const { data, loading } = useFetch(`${API}/reports/trial-balance?${params}`, [startDate, endDate]);
  const rows    = data?.data    || [];
  const summary = data?.summary || {};

  return (
    <div>
      {data && (
        <div style={{ marginBottom: 16 }}>
          <span className={`acc-balanced ${summary.is_balanced ? "ok" : "bad"}`} style={{ fontSize: 13, padding: "6px 14px" }}>
            {summary.is_balanced ? "✓ Trial balance is balanced" : "✕ Trial balance is OUT OF BALANCE"}
          </span>
        </div>
      )}

      <div className="acc-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="acc-stat">
          <div className="acc-stat-label">Total debits</div>
          <div className="acc-stat-value">{fmt(summary.total_debits)}</div>
        </div>
        <div className="acc-stat">
          <div className="acc-stat-label">Total credits</div>
          <div className="acc-stat-value">{fmt(summary.total_credits)}</div>
        </div>
        <div className="acc-stat">
          <div className="acc-stat-label">Difference</div>
          <div className={`acc-stat-value ${summary.is_balanced ? "green" : "red"}`}>
            {fmt(Math.abs((summary.total_debits || 0) - (summary.total_credits || 0)))}
          </div>
        </div>
      </div>

      <div className="acc-card">
        <div className="acc-card-header">
          <span className="acc-card-title">Trial Balance</span>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="acc-input" type="date" placeholder="Start date" value={startDate} onChange={e => setStart(e.target.value)} />
            <input className="acc-input" type="date" placeholder="End date" value={endDate} onChange={e => setEnd(e.target.value)} />
          </div>
        </div>

        {loading ? <Spinner /> : (
          <div className="acc-table-wrap">
            <table className="acc-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Account name</th>
                  <th>Type</th>
                  <th className="right">Debits</th>
                  <th className="right">Credits</th>
                  <th className="right">Net balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={6}><Empty /></td></tr>}
                {["asset","liability","equity","income","expense"].map(type => {
                  const typeRows = rows.filter(r => r.account_type === type);
                  if (!typeRows.length) return null;
                  const typeTotals = {
                    dr: typeRows.reduce((s, r) => s + Number(r.total_debits), 0),
                    cr: typeRows.reduce((s, r) => s + Number(r.total_credits), 0),
                    net: typeRows.reduce((s, r) => s + Number(r.net_balance), 0),
                  };
                  return (
                    <>
                      <tr className="group-header" key={`g-${type}`}>
                        <td colSpan={6}>{type.toUpperCase()} ({typeRows.length})</td>
                      </tr>
                      {typeRows.map(r => (
                        <tr key={r.coa_id}>
                          <td className="mono" style={{ color: "var(--accent)" }}>{r.account_code}</td>
                          <td className={r.is_sub_account ? "acc-indent" : ""}>{r.account_name}</td>
                          <td><Badge type={r.account_type} /></td>
                          <td className="right mono">{Number(r.total_debits) > 0 ? fmt(r.total_debits) : "—"}</td>
                          <td className="right mono">{Number(r.total_credits) > 0 ? fmt(r.total_credits) : "—"}</td>
                          <td className="right mono" style={{ color: Number(r.net_balance) < 0 ? "var(--red)" : "" }}>
                            {fmt(r.net_balance)}
                          </td>
                        </tr>
                      ))}
                      <tr className="subtotal">
                        <td colSpan={3}>Subtotal — {type}</td>
                        <td className="right">{fmt(typeTotals.dr)}</td>
                        <td className="right">{fmt(typeTotals.cr)}</td>
                        <td className="right">{fmt(typeTotals.net)}</td>
                      </tr>
                    </>
                  );
                })}
                <tr className="grand-total">
                  <td colSpan={3}>Grand total</td>
                  <td className="right">{fmt(summary.total_debits)}</td>
                  <td className="right">{fmt(summary.total_credits)}</td>
                  <td className="right">{fmt(Math.abs((summary.total_debits||0)-(summary.total_credits||0)))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROFIT & LOSS VIEW
// ─────────────────────────────────────────────────────────────
function ProfitAndLoss({ companyId }) {
  const [startDate, setStart] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [endDate, setEnd]     = useState(new Date().toISOString().slice(0, 10));

  const params = new URLSearchParams({ startDate, endDate });
  const { data, loading } = useFetch(`${API}/reports/profit-loss?${params}`, [startDate, endDate]);

  const income   = data?.data?.income   || [];
  const expenses = data?.data?.expenses || [];
  const summary  = data?.summary        || {};

  return (
    <div>
      <div className="acc-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="acc-stat">
          <div className="acc-stat-label">Total income</div>
          <div className="acc-stat-value green">{fmt(summary.totalIncome)}</div>
        </div>
        <div className="acc-stat">
          <div className="acc-stat-label">Total expenses</div>
          <div className="acc-stat-value red">{fmt(summary.totalExpenses)}</div>
        </div>
        <div className="acc-stat">
          <div className="acc-stat-label">Net profit / loss</div>
          <div className={`acc-stat-value ${Number(summary.netProfit) >= 0 ? "green" : "red"}`}>
            {fmt(summary.netProfit)}
          </div>
          <div className="acc-stat-sub">{Number(summary.netProfit) >= 0 ? "Profit" : "Loss"}</div>
        </div>
      </div>

      <div className="acc-card">
        <div className="acc-card-header">
          <span className="acc-card-title">Profit & Loss Statement</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--text2)" }}>From</span>
            <input className="acc-input" type="date" value={startDate} onChange={e => setStart(e.target.value)} />
            <span style={{ fontSize: 13, color: "var(--text2)" }}>to</span>
            <input className="acc-input" type="date" value={endDate} onChange={e => setEnd(e.target.value)} />
          </div>
        </div>

        {loading ? <Spinner /> : (
          <div style={{ padding: "20px 24px" }}>
            <div className="acc-report-section">
              <div className="acc-report-section-title">Income</div>
              <table className="acc-table">
                <tbody>
                  {income.map(r => (
                    <tr key={r.code}>
                      <td className="mono" style={{ color: "var(--accent)", width: 100 }}>{r.code}</td>
                      <td className={r.is_sub_account ? "acc-indent" : ""}>{r.name}</td>
                      <td className="right mono" style={{ color: "var(--green)" }}>{fmt(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
               </table>
             </div>
             <table className="acc-table" style={{ marginBottom: 32 }}>
               <tbody>
                 <tr className="subtotal">
                   <td colSpan={2}>Total income</td>
                   <td className="right" style={{ color: "var(--green)" }}>{fmt(summary.totalIncome)}</td>
                 </tr>
               </tbody>
             </table>

             <div className="acc-report-section">
               <div className="acc-report-section-title">Expenses</div>
               <table className="acc-table">
                 <tbody>
                   {expenses.map(r => (
                     <tr key={r.code}>
                       <td className="mono" style={{ color: "var(--accent)", width: 100 }}>{r.code}</td>
                       <td className={r.is_sub_account ? "acc-indent" : ""}>{r.name}</td>
                       <td className="right mono" style={{ color: "var(--red)" }}>{fmt(r.amount)}</td>
                      </tr>
                   ))}
                 </tbody>
               </table>
             </div>
             <table className="acc-table" style={{ marginBottom: 32 }}>
               <tbody>
                 <tr className="subtotal">
                   <td colSpan={2}>Total expenses</td>
                   <td className="right" style={{ color: "var(--red)" }}>{fmt(summary.totalExpenses)}</td>
                 </tr>
               </tbody>
             </table>

             <table className="acc-table">
               <tbody>
                 <tr className="grand-total">
                   <td colSpan={2}>Net {Number(summary.netProfit) >= 0 ? "Profit" : "Loss"}</td>
                   <td className="right" style={{ color: Number(summary.netProfit) >= 0 ? "var(--green)" : "var(--red)" }}>
                     {fmt(summary.netProfit)}
                   </td>
                 </tr>
               </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BALANCE SHEET VIEW
// ─────────────────────────────────────────────────────────────
function BalanceSheet({ companyId }) {
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const params = new URLSearchParams({ asOf });
  const { data, loading } = useFetch(`${API}/reports/balance-sheet?${params}`, [asOf]);

  const assets      = data?.data?.assets      || [];
  const liabilities = data?.data?.liabilities || [];
  const equity      = data?.data?.equity      || [];
  const summary     = data?.summary           || {};

  return (
    <div>
      <div className="acc-stats" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="acc-stat">
          <div className="acc-stat-label">Total assets</div>
          <div className="acc-stat-value gold">{fmt(summary.totalAssets)}</div>
        </div>
        <div className="acc-stat">
          <div className="acc-stat-label">Total liabilities</div>
          <div className="acc-stat-value red">{fmt(summary.totalLiabilities)}</div>
        </div>
        <div className="acc-stat">
          <div className="acc-stat-label">Total equity</div>
          <div className="acc-stat-value">{fmt(summary.totalEquity)}</div>
        </div>
        <div className="acc-stat">
          <div className="acc-stat-label">Balance check</div>
          <div style={{ marginTop: 8 }}>
            <span className={`acc-balanced ${summary.isBalanced ? "ok" : "bad"}`}>
              {summary.isBalanced ? "✓ Balanced" : "✕ Unbalanced"}
            </span>
          </div>
          <div className="acc-stat-sub">Assets = Liabilities + Equity</div>
        </div>
      </div>

      <div className="acc-card">
        <div className="acc-card-header">
          <span className="acc-card-title">Balance Sheet</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--text2)" }}>As of</span>
            <input className="acc-input" type="date" value={asOf} onChange={e => setAsOf(e.target.value)} />
          </div>
        </div>

        {loading ? <Spinner /> : (
          <div style={{ padding: "20px 24px" }}>
            <div className="acc-report-section">
              <div className="acc-report-section-title">Assets</div>
              <table className="acc-table">
                <tbody>
                  {assets.map(r => (
                    <tr key={r.code}>
                      <td className="mono" style={{ color: "var(--accent)", width: 100 }}>{r.code}</td>
                      <td className={r.is_sub_account ? "acc-indent" : ""}>{r.name}</td>
                      <td className="muted" style={{ fontSize: 12 }}>{r.category?.replace(/_/g," ")}</td>
                      <td className="right mono" style={{ color: "var(--blue)" }}>{fmt(r.amount)}</td>
                    </tr>
                  ))}
                  <tr className="subtotal">
                    <td colSpan={3}>Total assets</td>
                    <td className="right">
                    {fmt(
                      assets.reduce((sum, acc) => {
                        const amount = Number(acc.amount);

                        return sum + (
                          acc.normal_balance === "credit"
                            ? -amount
                            : amount
                        );
                      }, 0)
                    )}
                  </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="acc-report-section">
              <div className="acc-report-section-title">Liabilities</div>
              <table className="acc-table">
                <tbody>
                  {liabilities.map(r => (
                    <tr key={r.code}>
                      <td className="mono" style={{ color: "var(--accent)", width: 100 }}>{r.code}</td>
                      <td className={r.is_sub_account ? "acc-indent" : ""}>{r.name}</td>
                      <td className="muted" style={{ fontSize: 12 }}>{r.category?.replace(/_/g," ")}</td>
                      <td className="right mono" style={{ color: "var(--red)" }}>{fmt(r.amount)}</td>
                    </tr>
                  ))}
                  <tr className="subtotal">
                    <td colSpan={3}>Total liabilities</td>
                    <td className="right">{fmt(liabilities.reduce((s, r) => s + Number(r.amount), 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="acc-report-section">
              <div className="acc-report-section-title">Equity</div>
              <table className="acc-table">
                <tbody>
                  {equity.map(r => (
                    <tr key={r.code}>
                      <td className="mono" style={{ color: "var(--accent)", width: 100 }}>{r.code}</td>
                      <td className={r.is_sub_account ? "acc-indent" : ""}>{r.name}</td>
                      <td className="muted" style={{ fontSize: 12 }}>{r.category?.replace(/_/g," ")}</td>
                      <td className="right mono" style={{ color: "var(--purple)" }}>{fmt(r.amount)}</td>
                    </tr>
                  ))}
                  <tr className="subtotal">
                    <td colSpan={3}>Total equity</td>
                    <td className="right">{fmt(equity.reduce((s, r) => s + Number(r.amount), 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <table className="acc-table">
              <tbody>
                <tr className="grand-total">
                  <td colSpan={3}>Total Liabilities + Equity</td>
                  <td className="right">{fmt((summary.totalLiabilities || 0) + (summary.totalEquity || 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT ACCOUNTING MODULE
// ─────────────────────────────────────────────────────────────
const TABS = [
  { id: "coa",     label: "Chart of Accounts", icon: "" },
  { id: "journal", label: "Journal Entries",   icon: "" },
  { id: "ledger",  label: "General Ledger",    icon: "" },
  { id: "trial",   label: "Trial Balance",     icon: "" },
  { id: "pl",      label: "Profit & Loss",     icon: "" },
  { id: "bs",      label: "Balance Sheet",     icon: "" },
];

const AccountingModule = ({ companyId }) => {
  const [tab, setTab] = useState("coa");

  return (
    <>
      <style>{STYLES}</style>
      <div className="acc-module">
       

        <div className="acc-nav">
          {TABS.map(t => (
            <button key={t.id}
              className={`acc-nav-btn ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}>
              <span style={{ marginRight: 6 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="acc-body">
          {tab === "coa"     && <ChartOfAccounts companyId={companyId} />}
          {tab === "journal" && <JournalEntries  companyId={companyId} />}
          {tab === "ledger"  && <GeneralLedger   companyId={companyId} />}
          {tab === "trial"   && <TrialBalance    companyId={companyId} />}
          {tab === "pl"      && <ProfitAndLoss   companyId={companyId} />}
          {tab === "bs"      && <BalanceSheet    companyId={companyId} />}
        </div>
      </div>
    </>
  );
};

export default AccountingModule;