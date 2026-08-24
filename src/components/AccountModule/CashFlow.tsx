import React, { useState } from "react";
import { COMPANY_NAME, Empty, fmt, fmtDateLong, Spinner, useFetch } from "../../pages/dashboard/Components/AccountingModule";
import { companyId } from "../../constants/appConstants";
import { exportCashFlowPDF } from "../../utils/pdfExport";
export const API = `https://susu-pro-backend.onrender.com/api/accounting/${companyId}`;

export function CashFlow() {
  const [startDate, setStart] = useState("");
  const [endDate, setEnd]     = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data, loading } = useFetch(
    submitted ? `${API}/reports/cash-flow?startDate=${startDate}&endDate=${endDate}` : null,
    [submitted, startDate, endDate]
  );

  const operating = data?.data?.operating || {};
  const investing = data?.data?.investing || { items: [] };
  const financing = data?.data?.financing || { items: [] };
  const summary   = data?.summary || {};
  const isPositive = Number(summary.netCashFlow) >= 0;

  if (!submitted) {
    return (
      <div className="acc-panel">
        <div className="acc-gate">
          <div className="acc-gate-icon">💵</div>
          <div className="acc-gate-title">Statement of Cash Flows</div>
          <div className="acc-gate-sub">
            See how cash moved through operating, investing, and financing activities over a period.
          </div>
          <div className="acc-gate-form">
            <div className="acc-gate-field">
              <label>From date *</label>
              <input className="acc-input" type="date" value={startDate} onChange={e=>setStart(e.target.value)} />
            </div>
            <div className="acc-gate-field">
              <label>To date *</label>
              <input className="acc-input" type="date" value={endDate} onChange={e=>setEnd(e.target.value)} />
            </div>
            <button className="acc-btn primary" style={{ alignSelf:"flex-end" }}
              disabled={!startDate || !endDate}
              onClick={() => setSubmitted(true)}>
              Generate Report →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const Section = ({ title, icon, items, total, isNet }) => (
    <div className="acc-report-section">
      <div className="acc-report-section-hdr">{icon} {title}</div>
      {items.length === 0 && !isNet && (
        <div style={{ padding:"20px 24px", color:"var(--text3)", fontSize:13 }}>No movement this period</div>
      )}
      {items.map(r => (
        <div className="acc-report-row" key={r.code}>
          <span className="code">{r.code}</span>
          <span className="name">{r.name}</span>
          <span className="cat">{r.category?.replace(/_/g," ")}</span>
          <span className="amt" style={{ color: r.amount>=0 ? "var(--green)" : "var(--red)" }}>
            {r.amount>=0 ? "" : "("}{fmt(Math.abs(r.amount))}{r.amount>=0 ? "" : ")"}
          </span>
        </div>
      ))}
      <div className="acc-report-row sub">
        <span></span><span className="name">Net cash from {title.toLowerCase()}</span><span></span>
        <span className="amt" style={{ color: total>=0 ? "var(--accent)" : "var(--red)" }}>{fmt(total)}</span>
      </div>
    </div>
  );

  return (
    <div>
      <div className="acc-kpi-grid" style={{ gridTemplateColumns:"repeat(4,1fr)" }}>
        <div className="acc-kpi"><div className="acc-kpi-label">Operating</div><div className="acc-kpi-value blue">{fmt(operating.total)}</div></div>
        <div className="acc-kpi"><div className="acc-kpi-label">Investing</div><div className="acc-kpi-value">{fmt(investing.total)}</div></div>
        <div className="acc-kpi"><div className="acc-kpi-label">Financing</div><div className="acc-kpi-value purple">{fmt(financing.total)}</div></div>
        <div className={`acc-kpi net ${isPositive?"positive":"negative"}`}>
          <div className="acc-kpi-label">Net change in cash</div>
          <div className={`acc-kpi-value ${isPositive?"green":"red"}`}>{fmt(summary.netCashFlow)}</div>
        </div>
      </div>

      <div className="acc-report">
        <div className="acc-report-cover">
          <div>
            <div className="acc-report-co">{COMPANY_NAME}</div>
            <div className="acc-report-name">Statement of Cash Flows</div>
          </div>
          <div className="acc-report-meta">
            <div className="acc-report-meta-label">Period</div>
            <div className="acc-report-meta-val">{fmtDateLong(startDate)} to {fmtDateLong(endDate)}</div>
            <div style={{ display:"flex", gap:8, marginTop:12, justifyContent:"flex-end" }}>
              <button className="acc-btn ghost sm" onClick={() => setSubmitted(false)}>← Change period</button>
              <button className="acc-btn primary sm" onClick={() => exportCashFlowPDF({ operating, investing, financing, summary, startDate, endDate })}>
                ⬇ Export PDF
              </button>
            </div>
          </div>
        </div>

        {loading ? <Spinner /> : (
          <>
            <Section title="Operating Activities" icon="🔄" items={[
              { code:"—", name:"Net income for the period", category:"", amount: Number(operating.netIncome||0) },
              { code:"—", name:"Add back: Depreciation", category:"", amount: Number(operating.depreciation||0) },
              ...(operating.adjustments||[]),
            ]} total={operating.total} />
            <Section title="Investing Activities" icon="🏗️" items={investing.items} total={investing.total} />
            <Section title="Financing Activities" icon="🏛️" items={financing.items} total={financing.total} />

            <div className="acc-report-row" style={{ background:"var(--bg4)", borderTop:"2px solid var(--border)", padding:"14px 24px" }}>
              <span></span><span style={{ fontWeight:700, fontSize:13 }}>Cash at beginning of period</span><span></span>
              <span style={{ textAlign:"right", fontFamily:"var(--mono)", fontWeight:700 }}>{fmt(summary.cashBegin)}</span>
            </div>
            <div className="acc-report-row grand">
              <span></span><span className="name">Cash at end of period</span><span></span>
              <span className="amt" style={{ color:"#a7d7b6" }}>{fmt(summary.cashEnd)}</span>
            </div>
            {!summary.reconciles && (
              <div className="acc-alert err" style={{ margin:"12px 24px" }}>
                ✕ Statement doesn't fully reconcile — variance of {fmt(Math.abs(summary.variance))}. Likely an uncategorized account in the Chart of Accounts.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}