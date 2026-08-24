import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BookOpen, FileText, Layers, Scale, TrendingUp, PieChart } from "lucide-react";
import { Chip, COMPANY_NAME, Empty, fmt, fmtDate, fmtDateLong, Pager, Spinner, useFetch } from "../../pages/dashboard/Components/AccountingModule";
import { companyId } from "../../constants/appConstants";
export const API = `https://susu-pro-backend.onrender.com/api/accounting/${companyId}`;


export function AccountDetail({ account, onBack }) {
  const [page, setPage]       = useState(1);
  const [startDate, setStart] = useState("");
  const [endDate, setEnd]     = useState("");
  const [search, setSearch]   = useState("");

  const params = new URLSearchParams({
    coa_id: account.id, page, limit:"100",
    ...(startDate ? {startDate} : {}),
    ...(endDate   ? {endDate}   : {}),
  });

  const { data, loading, refetch } = useFetch(`${API}/ledger?${params}`, [account.id, page, startDate, endDate]);
  const rows       = data?.data        || [];
  const pagination = data?.pagination;

  const totalDr = rows.reduce((s,r)=>s+(r.debit_credit==="debit"  ? Number(r.amount) : 0), 0);
  const totalCr = rows.reduce((s,r)=>s+(r.debit_credit==="credit" ? Number(r.amount) : 0), 0);
  const nb      = account.normal_balance;
  const netMov  = nb==="debit" ? totalDr-totalCr : totalCr-totalDr;
  const openBal = Number(account.opening_balance) || 0;
  const finalBal = openBal + netMov;

  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.reference_no||"").toLowerCase().includes(q) ||
           (r.entry_description||"").toLowerCase().includes(q) ||
           (r.source||"").toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="acc-breadcrumb">
        <a onClick={onBack}>Chart of Accounts</a>
        <span>›</span>
        <span style={{ color:"var(--text)", fontWeight:600 }}>{account.code} — {account.name}</span>
      </div>

      <div className="acc-kpi-grid" style={{ gridTemplateColumns:"repeat(4,1fr)" }}>
        <div className="acc-kpi">
          <div className="acc-kpi-label">Opening balance</div>
          <div className="acc-kpi-value">{fmt(openBal)}</div>
        </div>
        <div className="acc-kpi">
          <div className="acc-kpi-label">Total debits</div>
          <div className="acc-kpi-value blue">{fmt(totalDr)}</div>
        </div>
        <div className="acc-kpi">
          <div className="acc-kpi-label">Total credits</div>
          <div className="acc-kpi-value red">{fmt(totalCr)}</div>
        </div>
        <div className="acc-kpi">
          <div className="acc-kpi-label">Closing balance</div>
          <div className={`acc-kpi-value ${finalBal>=0?"green":"red"}`}>{fmt(finalBal)}</div>
          <div className="acc-kpi-sub">Normal balance: {nb}</div>
        </div>
      </div>

      <div className="acc-panel">
        <div className="acc-panel-header">
          <span className="acc-panel-title">
            Ledger — {account.name}
            <Chip type={account.account_type} />
          </span>
          <div style={{ display:"flex", gap:8 }}>
            <button className="acc-btn ghost sm" onClick={refetch}>↻ Refresh</button>
            <button className="acc-btn ghost" onClick={onBack}>← Back</button>
          </div>
        </div>
        <div className="acc-toolbar">
          <input className="acc-input wide" placeholder="Search reference or description…"
            value={search} onChange={e=>setSearch(e.target.value)} />
          <input className="acc-input" type="date" value={startDate} onChange={e=>setStart(e.target.value)} />
          <input className="acc-input" type="date" value={endDate}   onChange={e=>setEnd(e.target.value)} />
        </div>

        {loading ? <Spinner /> : (
          <div className="acc-tbl-wrap">
            <table className="acc-tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Source</th>
                  <th>Description</th>
                  <th className="r">Debit</th>
                  <th className="r">Credit</th>
                  <th className="r">Balance</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 && <tr><td colSpan={7}><Empty text="No transactions found" /></td></tr>}
                {filtered.map((r,i)=>(
                  <tr key={r.line_id||i}>
                    <td style={{ whiteSpace:"nowrap", color:"var(--text2)" }}>{fmtDate(r.entry_date)}</td>
                    <td><span className="mono" style={{ color:"var(--accent)" }}>{r.reference_no}</span></td>
                    <td><span style={{ fontSize:11, color:"var(--text3)" }}>{r.source?.replace(/_/g," ")}</span></td>
                    <td style={{ fontSize:13, color:"var(--text2)" }}>{r.line_description||r.entry_description||"—"}</td>
                    <td className="r"><span className="mono" style={{ color:"var(--sky)" }}>{r.debit_credit==="debit"?fmt(r.amount):"—"}</span></td>
                    <td className="r"><span className="mono" style={{ color:"var(--green)" }}>{r.debit_credit==="credit"?fmt(r.amount):"—"}</span></td>
                    <td className="r"><span className="mono" style={{ fontWeight:600, color: Number(r.running_balance)<0?"var(--red)":"var(--text)" }}>{fmt(r.running_balance)}</span></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ background:"var(--bg3)", padding:"10px 16px", fontWeight:700, fontSize:13, color:"var(--text2)" }}>Totals</td>
                  <td className="r" style={{ background:"var(--bg3)", padding:"10px 16px", fontFamily:"var(--mono)", fontWeight:700, color:"var(--sky)" }}>{fmt(totalDr)}</td>
                  <td className="r" style={{ background:"var(--bg3)", padding:"10px 16px", fontFamily:"var(--mono)", fontWeight:700, color:"var(--green)" }}>{fmt(totalCr)}</td>
                  <td className="r" style={{ background:"var(--bg3)", padding:"10px 16px", fontFamily:"var(--mono)", fontWeight:700, color: finalBal<0?"var(--red)":"var(--text)" }}>{fmt(finalBal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <Pager pagination={pagination} onPage={setPage} />
      </div>
    </div>
  );
}