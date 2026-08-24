import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BookOpen, FileText, Layers, Scale, TrendingUp, PieChart } from "lucide-react";
import { Chip, COMPANY_NAME, Empty, fmt, fmtDate, fmtDateLong, Pager, Spinner, useFetch } from "../../pages/dashboard/Components/AccountingModule";
import { companyId } from "../../constants/appConstants";
import { exportTrialBalancePDF } from "../../utils/pdfExport";
export const API = `https://susu-pro-backend.onrender.com/api/accounting/${companyId}`;


export function TrialBalance() {
  const [startDate, setStart] = useState("");
  const [endDate, setEnd]     = useState("");
  const [submitted, setSubmitted] = useState(false);

  const params = new URLSearchParams({
    ...(startDate ? {startDate} : {}),
    ...(endDate   ? {endDate}   : {}),
  });

  const { data, loading } = useFetch(
    submitted ? `${API}/reports/trial-balance?${params}` : null,
    [submitted, startDate, endDate]
  );

  const rows    = data?.data    || [];
  const summary = data?.summary || {};

  const TYPE_CONFIG = {
    asset:     { label:"Assets",      icon:"🏦" },
    liability: { label:"Liabilities", icon:"📋" },
    equity:    { label:"Equity",      icon:"💼" },
    income:    { label:"Income",      icon:"📈" },
    expense:   { label:"Expenses",    icon:"📉" },
  };

  if (!submitted) {
    return (
      <div className="acc-panel">
        <div className="acc-gate">
          <div className="acc-gate-icon">⚖️</div>
          <div className="acc-gate-title">Trial Balance</div>
          <div className="acc-gate-sub">
            Select a reporting period to generate your trial balance. Leave dates empty to include all posted transactions.
          </div>
          <div className="acc-gate-form">
            <div className="acc-gate-field">
              <label>From date (optional)</label>
              <input className="acc-input" type="date" value={startDate} onChange={e=>setStart(e.target.value)} />
            </div>
            <div className="acc-gate-field">
              <label>To date (optional)</label>
              <input className="acc-input" type="date" value={endDate} onChange={e=>setEnd(e.target.value)} />
            </div>
            <button className="acc-btn primary" style={{ alignSelf:"flex-end" }} onClick={() => setSubmitted(true)}>
              Generate Report →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="acc-kpi-grid" style={{ gridTemplateColumns:"repeat(3,1fr)" }}>
        <div className="acc-kpi">
          <div className="acc-kpi-label">Total debits</div>
          <div className="acc-kpi-value blue">{fmt(summary.total_debits)}</div>
        </div>
        <div className="acc-kpi">
          <div className="acc-kpi-label">Total credits</div>
          <div className="acc-kpi-value green">{fmt(summary.total_credits)}</div>
        </div>
        <div className="acc-kpi">
          <div className="acc-kpi-label">Balance status</div>
          <div style={{ marginTop:8 }}>
            <span className={`bal-pill ${summary.is_balanced ? "ok" : "bad"}`} style={{ fontSize:13, padding:"6px 16px" }}>
              {summary.is_balanced ? "✓ Balanced" : "✕ Out of Balance"}
            </span>
          </div>
          <div className="acc-kpi-sub" style={{ marginTop:6 }}>
            {summary.is_balanced ? "Debits = Credits" : `Difference: ${fmt(Math.abs((summary.total_debits||0)-(summary.total_credits||0)))}`}
          </div>
        </div>
      </div>

      <div className="acc-report">
        <div className="acc-report-cover">
          <div>
            <div className="acc-report-co">{COMPANY_NAME}</div>
            <div className="acc-report-name">Trial Balance</div>
          </div>
          <div className="acc-report-meta">
            <div className="acc-report-meta-label">Period</div>
            <div className="acc-report-meta-val">
              {startDate ? fmtDateLong(startDate) : "All dates"} — {endDate ? fmtDateLong(endDate) : "Present"}
            </div>
            <div style={{ display:"flex", gap:8, marginTop:12, justifyContent:"flex-end" }}>
              <button className="acc-btn ghost sm" onClick={() => setSubmitted(false)}>← Change period</button>
               <button className="acc-btn primary sm" onClick={() => exportTrialBalancePDF({ rows, summary, startDate, endDate })}>
                              ⬇ Export PDF
                              </button>
            </div>
          </div>
        </div>

        {loading ? <Spinner /> : (
          <>
            {["asset","liability","equity","income","expense"].map(type => {
              const typeRows = rows.filter(r => r.account_type === type);
              if (!typeRows.length) return null;
              const totDr  = typeRows.reduce((s,r)=>s+Number(r.total_debits),0);
              const totCr  = typeRows.reduce((s,r)=>s+Number(r.total_credits),0);
              return (
                <div className="acc-report-section" key={type}>
                  <div className="acc-report-section-hdr">
                    {TYPE_CONFIG[type].icon} {TYPE_CONFIG[type].label} ({typeRows.length})
                  </div>
                  <div className="acc-report-row" style={{ background:"var(--bg3)", fontWeight:700, fontSize:11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".5px" }}>
                    <span>Code</span>
                    <span>Account name</span>
                    <span style={{ textAlign:"right" }}>Debits</span>
                    <span style={{ textAlign:"right" }}>Credits</span>
                  </div>
                  {typeRows.map(r => (
                    <div className={`acc-report-row ${r.is_sub_account?"indent":""}`} key={r.coa_id}>
                      <span className="code">{r.account_code}</span>
                      <span className="name">{r.account_name}</span>
                      <span className="amt" style={{ color:"var(--sky)" }}>{Number(r.total_debits)>0 ? fmt(r.total_debits) : "—"}</span>
                      <span className="amt" style={{ color:"var(--green)" }}>{Number(r.total_credits)>0 ? fmt(r.total_credits) : "—"}</span>
                    </div>
                  ))}
                  <div className="acc-report-row sub">
                    <span></span>
                    <span className="name">Subtotal — {TYPE_CONFIG[type].label}</span>
                    <span className="amt" style={{ color:"var(--sky)" }}>{fmt(totDr)}</span>
                    <span className="amt" style={{ color:"var(--green)" }}>{fmt(totCr)}</span>
                  </div>
                </div>
              );
            })}

            <div className="acc-report-row grand">
              <span></span>
              <span className="name">Grand Total</span>
              <span className="amt">{fmt(summary.total_debits)}</span>
              <span className="amt">{fmt(summary.total_credits)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}