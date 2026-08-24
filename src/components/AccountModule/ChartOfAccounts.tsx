import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BookOpen, FileText, Layers, Scale, TrendingUp, PieChart } from "lucide-react";
import { Chip, Empty, fmt, Spinner, useFetch } from "../../pages/dashboard/Components/AccountingModule";
import { companyId } from "../../constants/appConstants";
import { AccountModal } from "./AccountModal";
export const API = `https://susu-pro-backend.onrender.com/api/accounting/${companyId}`;


export function ChartOfAccounts({ onSelectAccount }) {
  const { data, loading, refetch } = useFetch(`${API}/accounts`);
  const [search, setSearch]   = useState("");
  const [typeFilter, setType] = useState("all");
  const [showModal, setModal] = useState(false);
  const [editAcc, setEdit]    = useState(null);
  const [msg, setMsg]         = useState(null);

  const accounts = data?.data || [];

  const filtered = useMemo(() => accounts.filter(a => {
    const mt = typeFilter === "all" || a.account_type === typeFilter;
    const ms = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search);
    return mt && ms;
  }), [accounts, search, typeFilter]);

  const grouped = useMemo(() => {
    return ["asset","liability","equity","income","expense"].map(type => ({
      type, rows: filtered.filter(a => a.account_type === type)
    })).filter(g => g.rows.length > 0);
  }, [filtered]);

  const TYPE_CONFIG = {
    asset:     { label:"Assets",      color:"var(--sky)",     icon:"🏦" },
    liability: { label:"Liabilities", color:"var(--red)",     icon:"📋" },
    equity:    { label:"Equity",      color:"var(--purple)",  icon:"💼" },
    income:    { label:"Income",      color:"var(--green)",   icon:"📈" },
    expense:   { label:"Expenses",    color:"var(--amber)",   icon:"📉" },
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this account?")) return;
    const r = await fetch(`${API}/accounts/${id}`, {
      method:"DELETE", headers: authHeaders()
    });
    const j = await r.json();
    if (r.ok) { setMsg({ type:"ok", text:"Account deleted" }); refetch(); }
    else setMsg({ type:"err", text: j.message });
    setTimeout(() => setMsg(null), 3500);
  };

  return (
    <div>
      {/* KPI strip */}
      <div className="acc-kpi-grid">
        {["asset","liability","equity","income","expense"].map(type => {
          const rows  = accounts.filter(a => a.account_type === type);
          const total = rows.reduce((s, a) => {
            const n = Number(a.current_balance || 0);
            return s + (a.account_type === "asset" && a.normal_balance === "credit" ? -n : n);
          }, 0);
          const cfg = TYPE_CONFIG[type];
          return (
            <div className={`acc-kpi ${type}`} key={type}>
              <div className="acc-kpi-label">{cfg.label}</div>
              <div className="acc-kpi-value" style={{ color: cfg.color }}>{fmt(total)}</div>
              <div className="acc-kpi-sub">{rows.length} account{rows.length !== 1 ? "s" : ""}</div>
            </div>
          );
        })}
      </div>

      {msg && <div className={`acc-alert ${msg.type}`}>{msg.type==="ok"?"✓":"✕"} {msg.text}</div>}

      <div className="acc-panel">
        <div className="acc-panel-header">
          <span className="acc-panel-title">
            Chart of Accounts
            <span className="count">{accounts.length}</span>
          </span>
          <button className="acc-btn primary" onClick={() => { setEdit(null); setModal(true); }}>
            + New Account
          </button>
        </div>

        <div className="acc-toolbar">
          <input className="acc-input wide" placeholder="Search by name or account code…"
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="acc-input" value={typeFilter} onChange={e => setType(e.target.value)}>
            <option value="all">All types</option>
            {["asset","liability","equity","income","expense"].map(t => (
              <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>
            ))}
          </select>
        </div>

        {loading ? <Spinner /> : (
          <div className="acc-tbl-wrap">
            <table className="acc-tbl">
              <thead>
                <tr>
                  <th style={{ width:90 }}>Code</th>
                  <th>Account name</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th className="r">Balance</th>
                  <th className="c">Status</th>
                  <th style={{ width:130 }}></th>
                </tr>
              </thead>
              <tbody>
                {grouped.length === 0 && (
                  <tr><td colSpan={7}><Empty text="No accounts found" sub="Try a different search or filter" /></td></tr>
                )}
                {grouped.map(group => (
                  <React.Fragment key={`g-${group.type}`}>
                    <tr className="grp-row">
                      <td colSpan={7}>
                        {TYPE_CONFIG[group.type].icon} {TYPE_CONFIG[group.type].label}
                        <span style={{ marginLeft:8, opacity:.6, fontWeight:400 }}>({group.rows.length})</span>
                      </td>
                    </tr>
                    {group.rows.map(acc => (
                      <tr key={acc.id}>
                        <td><span className="mono" style={{ color:"var(--accent)" }}>{acc.code}</span></td>
                        <td
                          style={{ paddingLeft: acc.is_sub_account ? 32 : 16, cursor:"pointer" }}
                          onClick={() => onSelectAccount(acc)}
                        >
                          {acc.is_sub_account && <span style={{ color:"var(--text3)", marginRight:6 }}>↳</span>}
                          <span style={{ fontWeight:500 }}>{acc.name}</span>
                          {acc.is_system_account && (
                            <span style={{ marginLeft:8, fontSize:10, background:"var(--bg4)", color:"var(--text3)", padding:"1px 6px", borderRadius:99 }}>
                              SYSTEM
                            </span>
                          )}
                        </td>
                        <td><Chip type={acc.account_type} /></td>
                        <td style={{ fontSize:12, color:"var(--text3)" }}>{acc.category?.replace(/_/g," ")}</td>
                        <td className="r">
                          <span className="mono" style={{ color: Number(acc.current_balance) < 0 ? "var(--red)" : "var(--text)" }}>
                            {fmt(acc.current_balance)}
                          </span>
                        </td>
                        <td className="c"><Chip type={acc.is_active ? "active" : "inactive"} /></td>
                        <td>
                          <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                            <button className="acc-btn ghost sm" onClick={() => { setEdit(acc); setModal(true); }}>Edit</button>
                            {!acc.is_system_account && (
                              <button className="acc-btn danger sm" onClick={() => handleDelete(acc.id)}>Delete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="sub-row">
                      <td colSpan={4} style={{ paddingLeft:20 }}>Subtotal — {TYPE_CONFIG[group.type].label}</td>
                      <td className="r">
                        {fmt(group.rows.reduce((s, a) => {
                          const n = Number(a.current_balance);
                          return s + (a.normal_balance === "credit" ? -n : n);
                        }, 0))}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <AccountModal
          account={editAcc}
          accounts={accounts}
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); refetch(); }}
        />
      )}
    </div>
  );
}
