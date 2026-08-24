import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BookOpen, FileText, Layers, Scale, TrendingUp, PieChart } from "lucide-react";
import { Chip, COMPANY_NAME, Empty, fmt, fmtDate, fmtDateLong, Pager, Spinner, useFetch } from "../../pages/dashboard/Components/AccountingModule";
import { companyId } from "../../constants/appConstants";
import { exportBalanceSheetPDF } from "../../utils/pdfExport";
export const API = `https://susu-pro-backend.onrender.com/api/accounting/${companyId}`;



export function BalanceSheet() {
  const [asOf, setAsOf]           = useState("");
  const [submitted, setSubmitted] = useState(false);

  const params = new URLSearchParams({ ...(asOf ? {asOf} : {}) });
  const { data, loading } = useFetch(
    submitted ? `${API}/reports/balance-sheet?${params}` : null,
    [submitted, asOf]
  );

  const rows        = data?.data           || [];
  const assets      = data?.data?.assets      || [];
  const liabilities = data?.data?.liabilities || [];
  const equity      = data?.data?.equity      || [];
  const summary     = data?.summary           || {};

  if (!submitted) {
    return (
      <div className="acc-panel">
        <div className="acc-gate">
          <div className="acc-gate-icon">📑</div>
          <div className="acc-gate-title">Balance Sheet</div>
          <div className="acc-gate-sub">
            Choose a date to produce your Statement of Financial Position. The report shows all assets,
            liabilities, and equity as of that date.
          </div>
          <div className="acc-gate-form">
            <div className="acc-gate-field">
              <label>As of date *</label>
              <input className="acc-input" type="date" value={asOf} onChange={e=>setAsOf(e.target.value)} />
            </div>
            <button className="acc-btn primary" style={{ alignSelf:"flex-end" }}
              disabled={!asOf}
              onClick={() => setSubmitted(true)}>
              Generate Report →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalLiabEquity = (Number(summary.totalLiabilities)||0) + (Number(summary.totalEquity)||0);

  return (
    <div>
      <div className="acc-kpi-grid" style={{ gridTemplateColumns:"repeat(4,1fr)" }}>
        <div className="acc-kpi asset">
          <div className="acc-kpi-label">Total assets</div>
          <div className="acc-kpi-value blue">{fmt(summary.totalAssets)}</div>
        </div>
        <div className="acc-kpi liability">
          <div className="acc-kpi-label">Total liabilities</div>
          <div className="acc-kpi-value red">{fmt(summary.totalLiabilities)}</div>
        </div>
        <div className="acc-kpi equity">
          <div className="acc-kpi-label">Total equity</div>
          <div className="acc-kpi-value purple">{fmt(summary.totalEquity)}</div>
        </div>
        <div className="acc-kpi">
          <div className="acc-kpi-label">Balance check</div>
          <div style={{ marginTop:8 }}>
            <span className={`bal-pill ${summary.isBalanced?"ok":"bad"}`} style={{ fontSize:13, padding:"6px 14px" }}>
              {summary.isBalanced ? "✓ Balanced" : "✕ Unbalanced"}
            </span>
          </div>
          <div className="acc-kpi-sub" style={{ marginTop:6 }}>Assets = Liabilities + Equity</div>
        </div>
      </div>

      <div className="acc-report">
        <div className="acc-report-cover">
          <div>
            <div className="acc-report-co">{COMPANY_NAME}</div>
            <div className="acc-report-name">Statement of Financial Position (Balance Sheet)</div>
          </div>
          <div className="acc-report-meta">
            <div className="acc-report-meta-label">As of</div>
            <div className="acc-report-meta-val">{fmtDateLong(asOf)}</div>
            <div style={{ display:"flex", gap:8, marginTop:12, justifyContent:"flex-end" }}>
              <button className="acc-btn ghost sm" onClick={() => setSubmitted(false)}>← Change date</button>
              <button className="acc-btn primary sm" onClick={() => exportBalanceSheetPDF({ rows, summary, startDate, endDate })}>
                ⬇ Export PDF
                </button>
            </div>
          </div>
        </div>

        {loading ? <Spinner /> : (
          <>
            <div className="acc-report-section">
              <div className="acc-report-section-hdr">🏦 Assets</div>
              <div className="acc-report-row" style={{ background:"var(--bg3)", fontWeight:700, fontSize:11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".5px" }}>
                <span>Code</span><span>Account</span><span>Category</span><span style={{textAlign:"right"}}>Amount</span>
              </div>
              {assets.map(r => (
                <div className={`acc-report-row ${r.is_sub_account?"indent":""}`} key={r.code}>
                  <span className="code">{r.code}</span>
                  <span className="name">{r.name}</span>
                  <span className="cat">{r.category?.replace(/_/g," ")}</span>
                  <span className="amt" style={{ color: Number(r.amount)<0 ? "var(--red)" : "var(--sky)" }}>{fmt(r.amount)}</span>
                </div>
              ))}
              <div className="acc-report-row sub">
                <span></span><span className="name">Total Assets</span><span></span>
                <span className="amt" style={{ color:"var(--accent)" }}>{fmt(summary.totalAssets)}</span>
              </div>
            </div>

            <div className="acc-report-section">
              <div className="acc-report-section-hdr">📋 Liabilities</div>
              <div className="acc-report-row" style={{ background:"var(--bg3)", fontWeight:700, fontSize:11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".5px" }}>
                <span>Code</span><span>Account</span><span>Category</span><span style={{textAlign:"right"}}>Amount</span>
              </div>
              {liabilities.map(r => (
                <div className={`acc-report-row ${r.is_sub_account?"indent":""}`} key={r.code}>
                  <span className="code">{r.code}</span>
                  <span className="name">{r.name}</span>
                  <span className="cat">{r.category?.replace(/_/g," ")}</span>
                  <span className="amt" style={{ color:"var(--red)" }}>{fmt(r.amount)}</span>
                </div>
              ))}
              <div className="acc-report-row sub">
                <span></span><span className="name">Total Liabilities</span><span></span>
                <span className="amt" style={{ color:"var(--red)" }}>{fmt(summary.totalLiabilities)}</span>
              </div>
            </div>

            <div className="acc-report-section">
              <div className="acc-report-section-hdr">💼 Equity</div>
              <div className="acc-report-row" style={{ background:"var(--bg3)", fontWeight:700, fontSize:11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".5px" }}>
                <span>Code</span><span>Account</span><span>Category</span><span style={{textAlign:"right"}}>Amount</span>
              </div>
              {equity.map(r => (
                <div className={`acc-report-row ${r.is_sub_account?"indent":""}`} key={r.code}>
                  <span className="code">{r.code}</span>
                  <span className="name">{r.name}</span>
                  <span className="cat">{r.category?.replace(/_/g," ")}</span>
                  <span className="amt" style={{ color:"var(--purple)" }}>{fmt(r.amount)}</span>
                </div>
              ))}
              <div className="acc-report-row" style={{ background:"var(--amber-light)", borderLeft:"3px solid var(--amber)" }}>
                <span className="code">—</span>
                <span className="name" style={{ color:"var(--amber)" }}>Current period profit / (loss)</span>
                <span className="cat">Retained earnings</span>
                <span className="amt" style={{ color: Number(summary.netProfit)>=0?"var(--green)":"var(--red)" }}>
                  {fmt(summary.netProfit)}
                </span>
              </div>
              <div className="acc-report-row sub">
                <span></span><span className="name">Total Equity</span><span></span>
                <span className="amt" style={{ color:"var(--purple)" }}>{fmt(summary.totalEquity)}</span>
              </div>
            </div>

            <div className="acc-report-row" style={{ background:"var(--bg4)", borderTop:"2px solid var(--border)", padding:"14px 24px" }}>
              <span></span>
              <span style={{ fontWeight:700, fontSize:13 }}>Total Liabilities + Equity</span>
              <span></span>
              <span style={{ textAlign:"right", fontFamily:"var(--mono)", fontWeight:700, fontSize:14, color:"var(--text)" }}>
                {fmt(totalLiabEquity)}
              </span>
            </div>

            <div className="acc-report-row grand">
              <span></span>
              <span className="name">
                {summary.isBalanced
                  ? "✓ Statement balances — Assets equal Liabilities + Equity"
                  : "✕ Statement does not balance — please review your entries"}
              </span>
              <span></span>
              <span className="amt" style={{ color: summary.isBalanced ? "#a7d7b6" : "#fca5a5" }}>
                {fmt(summary.totalAssets)} = {fmt(totalLiabEquity)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}